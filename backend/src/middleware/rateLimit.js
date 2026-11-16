'use strict';
const rateLimit = require('express-rate-limit');
const labs = require('../labs/labState');

// SECURE: max 5 failed login attempts per IP+email per 15 minutes.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  skipSuccessfulRequests: true,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  keyGenerator: (req) => `${req.ip}|${String((req.body && req.body.email) || '').toLowerCase()}`,
  message: { error: 'Juda ko‘p urinish. 15 daqiqadan so‘ng qayta urinib ko‘ring.' },
});

/** Broken Authentication lab: brute-force protection only in secure mode. */
function loginRateLimit(req, res, next) {
  if (labs.isVulnerable('broken-auth')) return next();
  return loginLimiter(req, res, next);
}

// General API limiter (always on) — keeps the lab usable but prevents runaway scripts.
const apiLimiter = rateLimit({ windowMs: 60 * 1000, limit: require('../config').apiRateLimit, standardHeaders: 'draft-7', legacyHeaders: false });

module.exports = { loginRateLimit, apiLimiter, loginLimiter };
