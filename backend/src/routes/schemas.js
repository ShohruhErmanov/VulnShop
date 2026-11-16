'use strict';
const Joi = require('joi');

const id = Joi.object({ id: Joi.number().integer().positive().required() });
const email = Joi.string().trim().lowercase().email({ tlds: { allow: false } }).max(190);

module.exports = {
  id,
  register: Joi.object({
    name: Joi.string().trim().min(2).max(120).required(),
    email: email.required(),
    // Length/complexity rules live in authService (they depend on the Weak Password lab mode).
    password: Joi.string().max(128).required(),
  }),
  login: Joi.object({ email: email.required(), password: Joi.string().max(128).required() }),
  changePassword: Joi.object({
    currentPassword: Joi.string().max(128).required(),
    newPassword: Joi.string().max(128).required(),
  }),
  productQuery: Joi.object({
    // Free text on purpose: the SQLi lab needs raw payloads to reach the service layer.
    search: Joi.string().allow('').max(500).default(''),
    category: Joi.string().allow('').max(120).default(''),
    sort: Joi.string().valid('newest', 'price_asc', 'price_desc', 'rating').default('newest'),
  }),
  review: Joi.object({
    rating: Joi.number().integer().min(1).max(5).required(),
    comment: Joi.string().trim().min(1).max(2000).required(),
  }),
  cartAdd: Joi.object({
    productId: Joi.number().integer().positive().required(),
    quantity: Joi.number().integer().min(1).max(50).default(1),
  }),
  cartUpdate: Joi.object({ quantity: Joi.number().integer().min(1).max(50).required() }),
  checkout: Joi.object({
    shippingAddress: Joi.string().trim().min(5).max(255).required(),
    note: Joi.string().trim().allow('').max(500),
  }),
  profile: Joi.object({
    name: Joi.string().trim().min(2).max(120).required(),
    phone: Joi.string().trim().allow('').max(40).pattern(/^[+0-9 ()-]*$/),
    address: Joi.string().trim().allow('').max(255),
    bio: Joi.string().trim().allow('').max(500),
  }),
  changeEmail: Joi.object({ email: email.required() }),
  role: Joi.object({ role: Joi.string().valid('customer', 'admin').required() }),
  orderStatus: Joi.object({ status: Joi.string().valid('pending', 'paid', 'shipped', 'delivered', 'cancelled').required() }),
  product: Joi.object({
    name: Joi.string().trim().min(2).max(160).required(),
    description: Joi.string().trim().min(5).max(5000).required(),
    price: Joi.number().positive().precision(2).max(1000000).required(),
    category: Joi.string().trim().min(2).max(60).required(),
    stock: Joi.number().integer().min(0).max(100000).required(),
    imageUrl: Joi.string().trim().allow('', null).max(255),
    isPublished: Joi.boolean().default(true),
    manualFile: Joi.string().trim().allow('', null).max(120),
  }),
  labMode: Joi.object({ vulnerable: Joi.boolean().required() }),
  flag: Joi.object({ flag: Joi.string().trim().max(200).required() }),
  quiz: Joi.object({ answers: Joi.array().items(Joi.number().integer().min(0).max(10)).max(20).required() }),
  labId: Joi.object({ id: Joi.string().pattern(/^[a-z-]{2,40}$/).required() }),
};
