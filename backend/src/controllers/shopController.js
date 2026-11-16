'use strict';
const productService = require('../services/productService');
const reviewService = require('../services/reviewService');
const cartService = require('../services/cartService');
const orderService = require('../services/orderService');
const accountService = require('../services/accountService');
const { publicProfile, selfProfile } = require('../services/userSerializer');
const { User } = require('../models');
const AppError = require('../utils/AppError');

// Products ------------------------------------------------------------------
async function listProducts(req, res) {
  const products = await productService.search(req.query);
  res.json({ products, count: products.length });
}
async function categories(req, res) {
  res.json({ categories: await productService.categories() });
}
async function getProduct(req, res) {
  res.json({ product: await productService.getById(req.params.id) });
}
async function createReview(req, res) {
  res.status(201).json({ review: await reviewService.create(req.user, req.params.id, req.body) });
}
async function deleteReview(req, res) {
  await reviewService.remove(req.user, req.params.reviewId);
  res.json({ ok: true });
}

// Cart ----------------------------------------------------------------------
const getCart = async (req, res) => res.json(await cartService.list(req.user.id));
const addToCart = async (req, res) => res.status(201).json(await cartService.add(req.user.id, req.body));
const updateCart = async (req, res) => res.json(await cartService.update(req.user.id, req.params.itemId, req.body));
const removeFromCart = async (req, res) => res.json(await cartService.remove(req.user.id, req.params.itemId));
const clearCart = async (req, res) => res.json(await cartService.clear(req.user.id));

// Orders --------------------------------------------------------------------
const myOrders = async (req, res) => res.json({ orders: await orderService.listMine(req.user.id) });
const checkout = async (req, res) => res.status(201).json({ order: await orderService.checkout(req.user, req.body) });
const getOrder = async (req, res) => res.json({ order: await orderService.getForUser(req.user, req.params.id) });
const cancelOrder = async (req, res) => res.json({ order: await orderService.cancel(req.user, req.params.id) });

// Users / account -------------------------------------------------------------
async function getPublicProfile(req, res) {
  const user = await User.findByPk(req.params.id);
  if (!user) throw new AppError(404, 'Foydalanuvchi topilmadi');
  res.json({ user: publicProfile(user) });
}
async function updateProfile(req, res) {
  const user = await accountService.updateProfile(req.user, req.body);
  res.json({ user: selfProfile(user) });
}
async function changeEmail(req, res) {
  const user = await accountService.changeEmail(req, req.body);
  // Classic HTML form posts (e.g. a CSRF PoC) get a plain response; API clients get JSON.
  if (req.is('application/x-www-form-urlencoded')) return res.type('text/plain').send('Email updated');
  return res.json({ user: selfProfile(user) });
}
async function clearNotice(req, res) {
  req.user.notice = null;
  await req.user.save();
  res.json({ user: selfProfile(req.user) });
}

module.exports = {
  listProducts, categories, getProduct, createReview, deleteReview,
  getCart, addToCart, updateCart, removeFromCart, clearCart,
  myOrders, checkout, getOrder, cancelOrder,
  getPublicProfile, updateProfile, changeEmail, clearNotice,
};
