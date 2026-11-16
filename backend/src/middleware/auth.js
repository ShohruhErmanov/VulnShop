'use strict';
const { User } = require('../models');
const tokenService = require('../services/tokenService');
const labs = require('../labs/labState');
const AppError = require('../utils/AppError');
const config = require('../config');
const { isInstructor } = require('../services/classroomPolicy');

const AUTH_COOKIE = 'vs_token';

function extractToken(req) {
  const header = req.headers.authorization || '';
  if (header.startsWith('Bearer ')) return { token: header.slice(7).trim(), source: 'header' };
  if (req.cookies && req.cookies[AUTH_COOKIE]) return { token: req.cookies[AUTH_COOKIE], source: 'cookie' };
  return { token: null, source: null };
}

async function resolveUser(req) {
  const { token, source } = extractToken(req);
  if (!token) return null;
  const payload = tokenService.verify(token);
  const user = await User.findByPk(payload.sub);
  if (!user) throw new AppError(401, 'Foydalanuvchi topilmadi');
  // Classroom server: forged/weak tokens can never impersonate the instructor (not part of the lab).
  if (config.hosted && isInstructor(user) && !payload._strong) throw new AppError(401, 'Token yaroqsiz yoki muddati o‘tgan');
  req.auth = { source, payload };
  return user;
}

async function authenticate(req, res, next) {
  try {
    const user = await resolveUser(req);
    if (!user) throw new AppError(401, 'Avtorizatsiya talab qilinadi');
    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

async function optionalAuth(req, res, next) {
  try {
    req.user = await resolveUser(req);
  } catch (_) {
    req.user = null;
  }
  next();
}

/** Always-enforced admin check (used by lab/instructor endpoints that are NOT part of any lab). */
function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') return next(new AppError(403, 'Faqat administratorlar uchun'));
  return next();
}

/**
 * Broken Access Control lab gate for /api/admin/*.
 * VULNERABLE: only checks that the caller is logged in ("the UI hides the admin menu anyway").
 * SECURE: enforces role-based authorization on the server for every admin function.
 */
function adminGate(req, res, next) {
  if (labs.isVulnerable('bac')) return next();
  return requireAdmin(req, res, next);
}

module.exports = { authenticate, optionalAuth, requireAdmin, adminGate, AUTH_COOKIE };
