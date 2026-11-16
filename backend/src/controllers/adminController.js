'use strict';
const adminService = require('../services/adminService');

module.exports = {
  stats: async (req, res) => res.json(await adminService.stats()),
  settings: async (req, res) => res.json({ settings: adminService.settings() }),
  listUsers: async (req, res) => res.json({ users: await adminService.listUsers() }),
  updateUserRole: async (req, res) => res.json({ user: await adminService.updateUserRole(req.user, req.params.id, req.body.role) }),
  deleteUser: async (req, res) => {
    await adminService.deleteUser(req.user, req.params.id);
    res.json({ ok: true });
  },
  listProducts: async (req, res) => res.json({ products: await adminService.listProducts() }),
  createProduct: async (req, res) => res.status(201).json({ product: await adminService.createProduct(req.body) }),
  updateProduct: async (req, res) => res.json({ product: await adminService.updateProduct(req.params.id, req.body) }),
  deleteProduct: async (req, res) => {
    await adminService.deleteProduct(req.params.id);
    res.json({ ok: true });
  },
  listOrders: async (req, res) => res.json({ orders: await adminService.listOrders() }),
  updateOrderStatus: async (req, res) => res.json({ order: await adminService.updateOrderStatus(req.params.id, req.body.status) }),
};
