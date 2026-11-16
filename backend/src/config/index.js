'use strict';
const path = require('path');
const crypto = require('crypto');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const env = process.env;
const nodeEnv = env.NODE_ENV || 'development';
const requestedMode = (env.APP_MODE || 'lab').toLowerCase();

// SAFETY: production-like environments can never run vulnerable code paths.
const productionLike = nodeEnv === 'production' || requestedMode === 'production';

let jwtSecret = env.JWT_SECRET || '';
if (jwtSecret.length < 32) {
  if (productionLike) {
    throw new Error('[VulnShop] JWT_SECRET must be at least 32 characters in production mode.');
  }
  jwtSecret = crypto.randomBytes(48).toString('hex');
}

const list = (v) => (v || '').split(',').map((s) => s.trim()).filter(Boolean);

// Deployment: "local" (default, loopback only) or "hosted" (classroom server behind an access gate).
const hosted = (env.LAB_DEPLOYMENT || 'local').toLowerCase() === 'hosted';
const publicHosts = [...list(env.PUBLIC_HOSTS), ...list(env.RENDER_EXTERNAL_HOSTNAME)].map((h) => h.toLowerCase());
const accessCode = env.LAB_ACCESS_CODE || '';
const instructorPassword = env.INSTRUCTOR_PASSWORD || '';

if (hosted) {
  // SAFETY: a hosted lab must be gated and bound to known domains — refuse to start otherwise.
  const problems = [];
  if (accessCode.length < 10) problems.push('LAB_ACCESS_CODE (kamida 10 belgi)');
  if (!publicHosts.length) problems.push('PUBLIC_HOSTS (domen nomi)');
  if (instructorPassword.length < 12) problems.push('INSTRUCTOR_PASSWORD (kamida 12 belgi)');
  if ((env.JWT_SECRET || '').length < 32) problems.push('JWT_SECRET (kamida 32 belgi)');
  if (problems.length) throw new Error(`[VulnShop] Hosted rejim uchun majburiy sozlamalar yo‘q: ${problems.join(', ')}`);
}

module.exports = {
  hosted,
  publicHosts,
  accessCode,
  instructorPassword,
  frontendDist: env.FRONTEND_DIST ? path.resolve(env.FRONTEND_DIST) : path.resolve(__dirname, '../../public'),
  apiRateLimit: Number(env.API_RATE_LIMIT || (hosted ? 3000 : 600)),
  nodeEnv,
  isTest: nodeEnv === 'test',
  appMode: productionLike ? 'production' : 'lab',
  labEnabled: !productionLike,
  host: env.HOST || '127.0.0.1',
  port: Number(env.PORT || 4000),
  allowContainerBind: env.ALLOW_CONTAINER_BIND === 'true',
  db: {
    dialect: env.DB_DIALECT || 'mysql',
    host: env.DB_HOST || '127.0.0.1',
    port: Number(env.DB_PORT || 3306),
    name: env.DB_NAME || 'vulnshop',
    user: env.DB_USER || 'vulnshop',
    password: env.DB_PASSWORD || '',
    storage: env.DB_STORAGE === ':memory:' ? ':memory:' : path.resolve(__dirname, '../..', env.DB_STORAGE || './vulnshop.sqlite'),
  },
  jwt: {
    secret: jwtSecret,
    // Intentionally weak secret used ONLY by the Broken Authentication lab.
    weakSecret: 'secret123',
    issuer: 'vulnshop',
    audience: 'vulnshop-web',
  },
  corsOrigins: hosted
    ? publicHosts.map((h) => `https://${h}`)
    : list(env.CORS_ORIGINS || 'http://localhost:5173,http://localhost:8080'),
  allowedHosts: ['localhost', '127.0.0.1', '::1', 'backend', 'vulnshop-backend', ...list(env.EXTRA_ALLOWED_HOSTS)],
  storageRoot: path.resolve(__dirname, '../../storage'),
};
