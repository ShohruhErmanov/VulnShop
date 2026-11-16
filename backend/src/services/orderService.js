'use strict';
const { sequelize, Order, OrderItem, CartItem, Product, User } = require('../models');
const labs = require('../labs/labState');
const AppError = require('../utils/AppError');
const config = require('../config');
const { isInstructor } = require('./classroomPolicy');

const itemsInclude = { model: OrderItem, as: 'items' };

async function listMine(userId) {
  return Order.findAll({ where: { userId }, include: [itemsInclude], order: [['id', 'DESC']] });
}

async function checkout(user, { shippingAddress, note }) {
  return sequelize.transaction(async (t) => {
    const cart = await CartItem.findAll({
      where: { userId: user.id },
      include: [{ model: Product, as: 'product' }],
      transaction: t,
    });
    if (!cart.length) throw new AppError(400, 'Savatcha bo‘sh');

    let total = 0;
    for (const item of cart) {
      if (!item.product || !item.product.isPublished) throw new AppError(400, 'Mahsulot mavjud emas');
      if (item.quantity > item.product.stock) throw new AppError(400, `${item.product.name}: omborda yetarli emas`);
      total += Number(item.product.price) * item.quantity; // price always taken from the DB, never the client
    }

    const order = await Order.create({
      userId: user.id,
      status: 'paid',
      total: Math.round(total * 100) / 100,
      shippingAddress,
      note: note || null,
    }, { transaction: t });

    for (const item of cart) {
      await OrderItem.create({
        orderId: order.id,
        productId: item.product.id,
        productName: item.product.name,
        quantity: item.quantity,
        unitPrice: item.product.price,
      }, { transaction: t });
      item.product.stock -= item.quantity;
      await item.product.save({ transaction: t });
    }
    await CartItem.destroy({ where: { userId: user.id }, transaction: t });
    return order;
  }).then((order) => Order.findByPk(order.id, { include: [itemsInclude] }));
}

/**
 * Order lookup — IDOR lab.
 * VULNERABLE: fetches the order by its sequential id only; no ownership check.
 * SECURE: the query is scoped to the authenticated owner (admins may see all).
 */
async function getForUser(user, orderId) {
  const include = [itemsInclude, { model: User, as: 'customer', attributes: ['id', 'name', 'email'] }];
  let order;
  if (labs.isVulnerable('idor')) {
    order = await Order.findByPk(orderId, { include });
  } else {
    const where = user.role === 'admin' ? { id: orderId } : { id: orderId, userId: user.id };
    order = await Order.findOne({ where, include });
  }
  // SECURE mode returns 404 (not 403) so attackers can't even confirm the id exists.
  if (!order) throw new AppError(404, 'Buyurtma topilmadi');
  return order;
}

async function cancel(user, orderId) {
  const order = await getForUser(user, orderId);
  // Classroom server: IDOR stays readable, but students cannot cancel each other's orders.
  if (config.hosted && order.userId !== user.id && !isInstructor(user)) throw new AppError(404, 'Buyurtma topilmadi');
  if (!['pending', 'paid'].includes(order.status)) throw new AppError(400, 'Bu buyurtmani bekor qilib bo‘lmaydi');
  await sequelize.transaction(async (t) => {
    for (const item of order.items) {
      if (item.productId) {
        await Product.increment('stock', { by: item.quantity, where: { id: item.productId }, transaction: t });
      }
    }
    order.status = 'cancelled';
    await order.save({ transaction: t });
  });
  return order;
}

module.exports = { listMine, checkout, getForUser, cancel };
