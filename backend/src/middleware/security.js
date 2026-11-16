'use strict';
const helmet = require('helmet');
const cors = require('cors');
const config = require('../config');
const labs = require('../labs/labState');

const LAB = 'misconfig';

const helmetSecure = helmet({
  contentSecurityPolicy: {
    useDefaults: true,
    directives: { 'default-src': ["'self'"], 'frame-ancestors': ["'none'"] },
  },
  crossOriginResourcePolicy: { policy: 'same-site' },
});

// SECURE CORS: explicit allow-list of trusted front-end origins.
const corsSecure = cors({
  origin(origin, cb) {
    if (!origin || config.corsOrigins.includes(origin)) return cb(null, true);
    return cb(null, false);
  },
  credentials: true,
});

// VULNERABLE CORS: reflects ANY origin and allows credentials.
const corsVulnerable = cors({ origin: true, credentials: true });

/** Security headers — chosen per request according to the Misconfiguration lab mode. */
function securityHeaders(req, res, next) {
  if (labs.isVulnerable(LAB)) {
    // VULNERABLE: technology fingerprinting headers, no CSP / HSTS / frame protection.
    res.setHeader('X-Powered-By', 'Express 4.21.1');
    res.setHeader('X-Debug-Mode', 'enabled');
    return next();
  }
  return helmetSecure(req, res, next);
}

function dynamicCors(req, res, next) {
  return labs.isVulnerable(LAB) ? corsVulnerable(req, res, next) : corsSecure(req, res, next);
}

module.exports = { securityHeaders, dynamicCors };
