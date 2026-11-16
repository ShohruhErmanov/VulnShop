'use strict';
const { CartItem, Product } = require('../models');
const AppError = require('../utils/AppError');

const productAttrs = ['id', 'name', 'price', 'imageUrl', 'category', 'stock'];

async function list(userId) {
  const items = await CartItem.findAll({
    where: { userId },
    include: [{ model: Product, as: 'product', attributes: productAttrs }],
    order: [['id', 'ASC']],
  });
  const subtotal = items.reduce((s, i) => s + Number(i.product.price) * i.quantity, 0);
  return { items, subtotal: Math.round(subtotal * 100) / 100, count: items.reduce((s, i) => s + i.quantity, 0) };
}

async function add(userId, { productId, quantity }) {
  const product = await Product.findOne({ where: { id: productId, isPublished: true } });
  if (!product) throw new AppError(404, 'Mahsulot topilmadi');
  const existing = await CartItem.findOne({ where: { userId, productId } });
  const nextQty = (existing ? existing.quantity : 0) + quantity;
  if (nextQty > product.stock) throw new AppError(400, `Omborda faqat ${product.stock} dona mavjud`);
  if (existing) {
    existing.quantity = nextQty;
    await existing.save();
  } else {
    await CartItem.create({ userId, productId, quantity });
  }
  return list(userId);
}

async function update(userId, itemId, { quantity }) {
  const item = await CartItem.findOne({ where: { id: itemId, userId }, include: [{ model: Product, as: 'product' }] });
  if (!item) throw new AppError(404, 'Savatcha elementi topilmadi');
  if (quantity > item.product.stock) throw new AppError(400, `Omborda faqat ${item.product.stock} dona mavjud`);
  item.quantity = quantity;
  await item.save();
  return list(userId);
}

async function remove(userId, itemId) {
  const deleted = await CartItem.destroy({ where: { id: itemId, userId } });
  if (!deleted) throw new AppError(404, 'Savatcha elementi topilmadi');
  return list(userId);
}

async function clear(userId) {
  await CartItem.destroy({ where: { userId } });
  return list(userId);
}

module.exports = { list, add, update, remove, clear };
