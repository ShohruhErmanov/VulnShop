'use strict';
const { Review, Product, User, sequelize } = require('../models');
const labs = require('../labs/labState');
const AppError = require('../utils/AppError');

const ENTITIES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#x27;', '/': '&#x2F;' };

/** Contextual HTML encoding (used by secure mode and by the XSS verification test). */
function escapeHtml(input) {
  return String(input).replace(/[&<>"'/]/g, (c) => ENTITIES[c]);
}

/**
 * Input handling for review comments — Stored XSS lab.
 * VULNERABLE: comment stored verbatim; the front-end renders it as HTML.
 * SECURE: markup is stripped on input, the front-end renders text only (output encoding by React).
 */
function sanitizeComment(comment) {
  if (labs.isVulnerable('xss')) return String(comment);
  return String(comment).replace(/<[^>]*>?/g, '').replace(/[<>]/g, '').trim();
}

async function create(user, productId, { rating, comment }) {
  const product = await Product.findOne({ where: { id: productId, isPublished: true } });
  if (!product) throw new AppError(404, 'Mahsulot topilmadi');
  const clean = sanitizeComment(comment);
  if (!clean) throw new AppError(400, 'Sharh matni bo‘sh bo‘lmasligi kerak');

  const review = await Review.create({ productId, userId: user.id, rating, comment: clean });
  const avg = await Review.findOne({
    where: { productId },
    attributes: [[sequelize.fn('AVG', sequelize.col('rating')), 'avg']],
    raw: true,
  });
  product.rating = Math.round(Number(avg.avg || rating) * 10) / 10;
  await product.save();
  return Review.findByPk(review.id, { include: [{ model: User, as: 'author', attributes: ['id', 'name'] }] });
}

async function remove(user, reviewId) {
  const review = await Review.findByPk(reviewId);
  if (!review) throw new AppError(404, 'Sharh topilmadi');
  if (review.userId !== user.id && user.role !== 'admin') throw new AppError(403, 'Bu sharhni o‘chira olmaysiz');
  await review.destroy();
}

module.exports = { create, remove, sanitizeComment, escapeHtml };
