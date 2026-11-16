'use strict';
const { sequelize, User, Product, Order, OrderItem } = require('../models');
const AppError = require('../utils/AppError');
const FLAGS = require('../labs/flags');
const labs = require('../labs/labState');
const { adminRow } = require('./userSerializer');

async function stats() {
  const [users, products, orders, revenueRow] = await Promise.all([
    User.count(),
    Product.count(),
    Order.count(),
    Order.findOne({ where: { status: ['paid', 'shipped', 'delivered'] }, attributes: [[sequelize.fn('SUM', sequelize.col('total')), 'revenue']], raw: true }),
  ]);
  const byStatus = await Order.findAll({ attributes: ['status', [sequelize.fn('COUNT', sequelize.col('id')), 'count']], group: ['status'], raw: true });
  const recentOrders = await Order.findAll({
    include: [{ model: User, as: 'customer', attributes: ['id', 'name'] }],
    order: [['id', 'DESC']],
    limit: 6,
  });
  const lowStock = await Product.findAll({ where: { isPublished: true }, order: [['stock', 'ASC']], limit: 5, attributes: ['id', 'name', 'stock', 'category'] });
  return {
    users,
    products,
    orders,
    revenue: Number(revenueRow && revenueRow.revenue ? revenueRow.revenue : 0),
    byStatus: byStatus.map((r) => ({ status: r.status, count: Number(r.count) })),
    recentOrders,
    lowStock,
  };
}

/** Internal shop settings — a sensitive admin-only function (BAC lab target). */
function settings() {
  return {
    storeName: 'VulnShop',
    currency: 'USD',
    paymentGateway: 'sandbox-gateway (test mode)',
    maintenanceMode: false,
    internalFlag: labs.isVulnerable('bac') ? FLAGS.bac : undefined,
    note: 'Bu sozlamalar faqat administratorlar uchun.',
  };
}

async function listUsers() {
  const users = await User.findAll({ order: [['id', 'ASC']] });
  return users.map(adminRow);
}

async function updateUserRole(actor, id, role) {
  const user = await User.findByPk(id);
  if (!user) throw new AppError(404, 'Foydalanuvchi topilmadi');
  if (actor.id === user.id && role !== 'admin' && actor.role === 'admin') throw new AppError(400, 'O‘zingizning admin rolingizni olib tashlay olmaysiz');
  user.role = role;
  await user.save();
  return adminRow(user);
}

async function deleteUser(actor, id) {
  if (Number(id) === actor.id) throw new AppError(400, 'O‘zingizni o‘chira olmaysiz');
  const deleted = await User.destroy({ where: { id } });
  if (!deleted) throw new AppError(404, 'Foydalanuvchi topilmadi');
}

async function listProducts() {
  return Product.findAll({ order: [['id', 'DESC']] });
}

const slugify = (s) => String(s).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

async function createProduct(data) {
  const slug = `${slugify(data.name)}-${Date.now().toString(36)}`;
  return Product.create({ ...data, slug });
}

async function updateProduct(id, data) {
  const product = await Product.findByPk(id);
  if (!product) throw new AppError(404, 'Mahsulot topilmadi');
  await product.update(data);
  return product;
}

async function deleteProduct(id) {
  const deleted = await Product.destroy({ where: { id } });
  if (!deleted) throw new AppError(404, 'Mahsulot topilmadi');
}

async function listOrders() {
  return Order.findAll({
    include: [{ model: User, as: 'customer', attributes: ['id', 'name', 'email'] }, { model: OrderItem, as: 'items' }],
    order: [['id', 'DESC']],
  });
}

async function updateOrderStatus(id, status) {
  const order = await Order.findByPk(id);
  if (!order) throw new AppError(404, 'Buyurtma topilmadi');
  order.status = status;
  await order.save();
  return order;
}

module.exports = {
  stats, settings, listUsers, updateUserRole, deleteUser,
  listProducts, createProduct, updateProduct, deleteProduct, listOrders, updateOrderStatus,
};
