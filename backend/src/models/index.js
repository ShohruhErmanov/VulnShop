'use strict';
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const User = sequelize.define('users', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(120), allowNull: false },
  email: { type: DataTypes.STRING(190), allowNull: false, unique: true },
  passwordHash: { type: DataTypes.STRING(255), allowNull: false },
  role: { type: DataTypes.ENUM('customer', 'admin'), allowNull: false, defaultValue: 'customer' },
  phone: { type: DataTypes.STRING(40) },
  address: { type: DataTypes.STRING(255) },
  bio: { type: DataTypes.STRING(500) },
  // Synthetic sensitive fields (fake data only) used by the Sensitive Data Exposure lab
  cardNumber: { type: DataTypes.STRING(32) },
  apiKey: { type: DataTypes.STRING(120) },
  // Lab-only fields: never exposed except to the account owner via /auth/me
  privateNote: { type: DataTypes.STRING(255) },
  notice: { type: DataTypes.STRING(255) },
});

const Product = sequelize.define('products', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(160), allowNull: false },
  slug: { type: DataTypes.STRING(180), allowNull: false, unique: true },
  description: { type: DataTypes.TEXT, allowNull: false },
  price: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  imageUrl: { type: DataTypes.STRING(255) },
  category: { type: DataTypes.STRING(60), allowNull: false },
  stock: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  rating: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
  isPublished: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  manualFile: { type: DataTypes.STRING(120) },
});

const Review = sequelize.define('reviews', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  rating: { type: DataTypes.INTEGER, allowNull: false },
  comment: { type: DataTypes.TEXT, allowNull: false },
});

const CartItem = sequelize.define('cart_items', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  quantity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
});

const Order = sequelize.define('orders', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  status: { type: DataTypes.ENUM('pending', 'paid', 'shipped', 'delivered', 'cancelled'), allowNull: false, defaultValue: 'pending' },
  total: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  shippingAddress: { type: DataTypes.STRING(255), allowNull: false },
  note: { type: DataTypes.STRING(500) },
});

const OrderItem = sequelize.define('order_items', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  productName: { type: DataTypes.STRING(160), allowNull: false },
  quantity: { type: DataTypes.INTEGER, allowNull: false },
  unitPrice: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
});

const LabSetting = sequelize.define('lab_settings', {
  labId: { type: DataTypes.STRING(40), primaryKey: true },
  vulnerable: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
});

const LabProgress = sequelize.define('lab_progress', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  labId: { type: DataTypes.STRING(40), allowNull: false },
  discovered: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  discoveredAt: { type: DataTypes.DATE },
  fixed: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  fixedAt: { type: DataTypes.DATE },
  quizScore: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  quizPassed: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
}, { indexes: [{ unique: true, fields: ['userId', 'labId'] }] });

// Associations
User.hasMany(Review, { foreignKey: 'userId', onDelete: 'CASCADE' });
Review.belongsTo(User, { foreignKey: 'userId', as: 'author' });
Product.hasMany(Review, { foreignKey: 'productId', onDelete: 'CASCADE' });
Review.belongsTo(Product, { foreignKey: 'productId' });

User.hasMany(CartItem, { foreignKey: 'userId', onDelete: 'CASCADE' });
CartItem.belongsTo(User, { foreignKey: 'userId' });
Product.hasMany(CartItem, { foreignKey: 'productId', onDelete: 'CASCADE' });
CartItem.belongsTo(Product, { foreignKey: 'productId', as: 'product' });

User.hasMany(Order, { foreignKey: 'userId', onDelete: 'CASCADE' });
Order.belongsTo(User, { foreignKey: 'userId', as: 'customer' });
Order.hasMany(OrderItem, { foreignKey: 'orderId', as: 'items', onDelete: 'CASCADE' });
OrderItem.belongsTo(Order, { foreignKey: 'orderId' });
OrderItem.belongsTo(Product, { foreignKey: 'productId', as: 'product', constraints: false });

User.hasMany(LabProgress, { foreignKey: 'userId', onDelete: 'CASCADE' });
LabProgress.belongsTo(User, { foreignKey: 'userId', as: 'student' });

module.exports = { sequelize, User, Product, Review, CartItem, Order, OrderItem, LabSetting, LabProgress };
