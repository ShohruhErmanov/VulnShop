'use strict';
const { Op } = require('sequelize');
const { sequelize, Product, Review, User } = require('../models');
const labs = require('../labs/labState');
const AppError = require('../utils/AppError');

const COLUMNS = ['id', 'name', 'slug', 'description', 'price', 'imageUrl', 'category', 'stock', 'rating'];
const SORTS = {
  newest: [['id', 'DESC']],
  price_asc: [['price', 'ASC']],
  price_desc: [['price', 'DESC']],
  rating: [['rating', 'DESC']],
};
const SORT_SQL = { newest: 'id DESC', price_asc: 'price ASC', price_desc: 'price DESC', rating: 'rating DESC' };

/**
 * Product catalog search — SQL Injection lab.
 */
async function search({ search = '', category = '', sort = 'newest' } = {}) {
  const order = SORTS[sort] ? sort : 'newest';

  if (labs.isVulnerable('sqli')) {
    // VULNERABLE: user input is concatenated straight into the SQL string.
    let sql = `SELECT ${COLUMNS.join(', ')} FROM products WHERE isPublished = 1 AND name LIKE '%${search}%'`;
    if (category) sql += ` AND category = '${category}'`;
    sql += ` ORDER BY ${SORT_SQL[order]}`;
    const [rows] = await sequelize.query(sql);
    return rows;
  }

  // SECURE: ORM query builder -> parameterized statement; LIKE wildcards escaped.
  const escaped = String(search).replace(/[\\%_]/g, (c) => `\\${c}`);
  const where = { isPublished: true, name: { [Op.like]: `%${escaped}%` } };
  if (category) where.category = category;
  return Product.findAll({ where, attributes: COLUMNS, order: SORTS[order], raw: true });
}

async function categories() {
  const rows = await Product.findAll({
    where: { isPublished: true },
    attributes: [[sequelize.fn('DISTINCT', sequelize.col('category')), 'category']],
    raw: true,
  });
  return rows.map((r) => r.category).sort();
}

async function getById(id) {
  const product = await Product.findOne({
    where: { id, isPublished: true },
    include: [{
      model: Review,
      include: [{ model: User, as: 'author', attributes: ['id', 'name'] }],
    }],
    order: [[Review, 'id', 'DESC']],
  });
  if (!product) throw new AppError(404, 'Mahsulot topilmadi');
  return product;
}

module.exports = { search, categories, getById, COLUMNS };
