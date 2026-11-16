'use strict';
const crypto = require('crypto');
const labs = require('../labs/labState');
const AppError = require('../utils/AppError');

const CSRF_COOKIE = 'vs_csrf';
const CSRF_HEADER = 'x-csrf-token';

function issueCsrfToken(req, res) {
  const token = crypto.randomBytes(32).toString('hex');
  res.cookie(CSRF_COOKIE, token, { httpOnly: true, secure: require('../config').hosted, sameSite: 'strict', path: '/' });
  return token;
}

function safeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

/**
 * CSRF lab protection for state-changing account endpoints.
 * VULNERABLE: accepts the ambient session cookie with no anti-CSRF token at all.
 * SECURE: requests authenticated by a cookie must present a double-submit token in a custom header.
 *         (Bearer-token requests are not CSRF-able: browsers never attach them automatically.)
 */
function csrfProtection(req, res, next) {
  if (labs.isVulnerable('csrf')) return next();
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  if (req.auth && req.auth.source === 'header') return next();
  const headerToken = req.get(CSRF_HEADER);
  const cookieToken = req.cookies && req.cookies[CSRF_COOKIE];
  if (!safeEqual(headerToken, cookieToken)) {
    return next(new AppError(403, 'CSRF token yo‘q yoki noto‘g‘ri'));
  }
  return next();
}

module.exports = { csrfProtection, issueCsrfToken, CSRF_COOKIE, CSRF_HEADER };
