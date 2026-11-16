'use strict';
const authService = require('../services/authService');
const { selfProfile } = require('../services/userSerializer');
const { issueCsrfToken } = require('../middleware/csrf');
const { AUTH_COOKIE } = require('../middleware/auth');
const labs = require('../labs/labState');
const FLAGS = require('../labs/flags');
const config = require('../config');

const XSS_COOKIE = 'vs_support_session';

function setAuthCookie(res, token) {
  const secureCsrf = !labs.isVulnerable('csrf');
  // Hosted (HTTPS, real cross-site): the vulnerable CSRF mode mimics a legacy SameSite=None cookie.
  let sameSite = secureCsrf ? 'strict' : 'lax';
  if (config.hosted && !secureCsrf) sameSite = 'none';
  res.cookie(AUTH_COOKIE, token, {
    httpOnly: true,
    secure: config.hosted,
    sameSite,
    maxAge: secureCsrf ? 60 * 60 * 1000 : 30 * 24 * 60 * 60 * 1000,
    path: '/',
  });
}

/**
 * XSS lab target: a "support session" cookie WITHOUT HttpOnly, readable by injected JavaScript.
 * In secure mode the cookie is removed (sensitive cookies must be HttpOnly).
 */
function syncXssCookie(res) {
  if (labs.isVulnerable('xss')) {
    res.cookie(XSS_COOKIE, FLAGS.xss, { httpOnly: false, secure: config.hosted, sameSite: 'lax', path: '/' });
  } else {
    res.clearCookie(XSS_COOKIE, { path: '/' });
  }
}

async function register(req, res) {
  const { user, token } = await authService.register(req.body);
  setAuthCookie(res, token);
  syncXssCookie(res);
  res.status(201).json({ token, user: selfProfile(user) });
}

async function login(req, res) {
  const { user, token } = await authService.login(req.body);
  setAuthCookie(res, token);
  syncXssCookie(res);
  res.json({ token, user: selfProfile(user) });
}

function logout(req, res) {
  res.clearCookie(AUTH_COOKIE, { path: '/' });
  res.clearCookie(XSS_COOKIE, { path: '/' });
  res.json({ ok: true });
}

function me(req, res) {
  syncXssCookie(res);
  res.json({ user: selfProfile(req.user), unsignedToken: Boolean(req.auth.payload && req.auth.payload._unsigned) });
}

function csrf(req, res) {
  res.json({ csrfToken: issueCsrfToken(req, res) });
}

async function changePassword(req, res) {
  await authService.changePassword(req.user, req.body);
  res.json({ ok: true, message: 'Parol yangilandi' });
}

module.exports = { register, login, logout, me, csrf, changePassword, setAuthCookie };
