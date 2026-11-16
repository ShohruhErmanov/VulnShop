'use strict';
const express = require('express');
const h = require('../utils/asyncHandler');
const validate = require('../middleware/validate');
const { authenticate, requireAdmin, adminGate } = require('../middleware/auth');
const { csrfProtection } = require('../middleware/csrf');
const { loginRateLimit } = require('../middleware/rateLimit');
const s = require('./schemas');
const auth = require('../controllers/authController');
const shop = require('../controllers/shopController');
const admin = require('../controllers/adminController');
const system = require('../controllers/systemController');
const lab = require('../controllers/labController');
const { isInstructor, instructorWhenHosted } = require('../services/classroomPolicy');
const AppError = require('../utils/AppError');

const router = express.Router();

// System ----------------------------------------------------------------------
router.get('/health', system.health);
router.get('/debug/config', h(system.debugConfig)); // Security Misconfiguration lab

// Auth ------------------------------------------------------------------------
router.post('/auth/register', validate(s.register), h(auth.register));
router.post('/auth/login', loginRateLimit, validate(s.login), h(auth.login));
router.post('/auth/logout', auth.logout);
router.get('/auth/me', authenticate, auth.me);
router.get('/auth/csrf', auth.csrf);

// Catalog -----------------------------------------------------------------------
router.get('/products', validate(s.productQuery, 'query'), h(shop.listProducts));
router.get('/products/categories', h(shop.categories));
router.get('/products/:id', validate(s.id, 'params'), h(shop.getProduct));
router.post('/products/:id/reviews', authenticate, validate(s.id, 'params'), validate(s.review), h(shop.createReview));
router.delete('/reviews/:reviewId', authenticate, h(shop.deleteReview));

// Files (Path Traversal lab) --------------------------------------------------------
router.get('/files', h(system.listDocuments));
router.get('/files/download', h(system.downloadDocument));

// Cart --------------------------------------------------------------------------
router.get('/cart', authenticate, h(shop.getCart));
router.post('/cart', authenticate, validate(s.cartAdd), h(shop.addToCart));
router.patch('/cart/:itemId', authenticate, validate(s.cartUpdate), h(shop.updateCart));
router.delete('/cart/:itemId', authenticate, h(shop.removeFromCart));
router.delete('/cart', authenticate, h(shop.clearCart));

// Orders (IDOR lab) -------------------------------------------------------------------
router.get('/orders', authenticate, h(shop.myOrders));
router.post('/orders', authenticate, validate(s.checkout), h(shop.checkout));
router.get('/orders/:id', authenticate, validate(s.id, 'params'), h(shop.getOrder));
router.post('/orders/:id/cancel', authenticate, validate(s.id, 'params'), h(shop.cancelOrder));

// Users (Sensitive Data Exposure lab) ---------------------------------------------------
router.get('/users/:id', validate(s.id, 'params'), h(shop.getPublicProfile));

// Account (CSRF lab) ----------------------------------------------------------------
router.put('/account/profile', authenticate, csrfProtection, validate(s.profile), h(shop.updateProfile));
router.post('/account/email', authenticate, csrfProtection, validate(s.changeEmail), h(shop.changeEmail));
router.post('/account/password', authenticate, csrfProtection, validate(s.changePassword), h(auth.changePassword));
router.delete('/account/notice', authenticate, h(shop.clearNotice));

// Admin (Broken Access Control lab) -------------------------------------------------------
const adminRouter = express.Router();
adminRouter.use(authenticate, adminGate);
adminRouter.get('/stats', h(admin.stats));
adminRouter.get('/settings', h(admin.settings));
// Classroom server: the BAC lab stays exploitable for READS, but destructive writes are
// instructor-only so one student cannot wipe the shared shop for everyone.
const adminWrite = instructorWhenHosted('Sinf serverida o‘zgartiruvchi admin amallari faqat instruktorga ruxsat etilgan (boshqa o‘quvchilarga zarar yetmasligi uchun).');
adminRouter.get('/users', h(admin.listUsers));
adminRouter.patch('/users/:id/role', adminWrite, validate(s.id, 'params'), validate(s.role), h(admin.updateUserRole));
adminRouter.delete('/users/:id', adminWrite, validate(s.id, 'params'), h(admin.deleteUser));
adminRouter.get('/products', h(admin.listProducts));
adminRouter.post('/products', adminWrite, validate(s.product), h(admin.createProduct));
adminRouter.put('/products/:id', adminWrite, validate(s.id, 'params'), validate(s.product), h(admin.updateProduct));
adminRouter.delete('/products/:id', adminWrite, validate(s.id, 'params'), h(admin.deleteProduct));
adminRouter.get('/orders', h(admin.listOrders));
adminRouter.patch('/orders/:id/status', adminWrite, validate(s.id, 'params'), validate(s.orderStatus), h(admin.updateOrderStatus));
router.use('/admin', adminRouter);

// Security Lab (always securely implemented — not part of any exercise) ----------------------
const instructorOnly = (req, res, next) => (isInstructor(req.user) ? next() : next(new AppError(403, 'Faqat instruktor uchun')));
const modeControl = instructorWhenHosted('Sinf serverida lab rejimlarini faqat instruktor o‘zgartiradi.');
const labRouter = express.Router();
labRouter.use(authenticate);
labRouter.get('/', h(lab.list));
labRouter.get('/dashboard', h(lab.dashboard));
labRouter.get('/students', requireAdmin, instructorOnly, h(lab.students));
labRouter.put('/modes', modeControl, validate(s.labMode), h(lab.setAll));
labRouter.delete('/progress', h(lab.resetProgress));
labRouter.get('/:id', validate(s.labId, 'params'), h(lab.detail));
labRouter.put('/:id/mode', modeControl, validate(s.labId, 'params'), validate(s.labMode), h(lab.setMode));
labRouter.post('/:id/flag', validate(s.labId, 'params'), validate(s.flag), h(lab.submitFlag));
labRouter.post('/:id/verify', validate(s.labId, 'params'), h(lab.verify));
labRouter.post('/:id/quiz', validate(s.labId, 'params'), validate(s.quiz), h(lab.quiz));
router.use('/labs', labRouter);

module.exports = router;
