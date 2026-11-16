'use strict';
const jwt = require('jsonwebtoken');
const config = require('../config');
const labs = require('../labs/labState');
const AppError = require('../utils/AppError');
const { isInstructor } = require('./classroomPolicy');

const LAB = 'broken-auth';

function signSecure(user) {
  return jwt.sign({ sub: String(user.id), role: user.role }, config.jwt.secret, {
    algorithm: 'HS256',
    expiresIn: '1h',
    issuer: config.jwt.issuer,
    audience: config.jwt.audience,
  });
}

function verifySecure(token) {
  return jwt.verify(token, config.jwt.secret, {
    algorithms: ['HS256'],
    issuer: config.jwt.issuer,
    audience: config.jwt.audience,
  });
}

/** Issue an access token for a user. */
function sign(user) {
  // Classroom server: the instructor always gets a strongly signed token (not part of the lab).
  if (config.hosted && isInstructor(user)) return signSecure(user);
  if (labs.isVulnerable(LAB)) {
    // VULNERABLE: hard-coded weak secret, 30 day lifetime, sensitive claims in payload.
    return jwt.sign({ sub: user.id, email: user.email, role: user.role }, config.jwt.weakSecret, { expiresIn: '30d' });
  }
  // SECURE: strong random secret, explicit algorithm, short lifetime, issuer/audience binding.
  return signSecure(user);
}

/** Verify a token and return its payload. `_strong` marks a properly verified secure token. */
function verify(token) {
  try {
    if (labs.isVulnerable(LAB)) {
      if (config.hosted) {
        try { return { ...verifySecure(token), _strong: true }; } catch (_) { /* fall through to lab path */ }
      }
      // VULNERABLE: trusts the algorithm chosen by the token itself — "alg":"none" is accepted unsigned.
      const decoded = jwt.decode(token, { complete: true });
      if (!decoded) throw new Error('malformed token');
      if (String(decoded.header.alg).toLowerCase() === 'none') {
        return { ...decoded.payload, _unsigned: true };
      }
      return jwt.verify(token, config.jwt.weakSecret);
    }
    // SECURE: algorithm allow-list, issuer and audience checks, expiry enforced.
    return { ...verifySecure(token), _strong: true };
  } catch (err) {
    throw new AppError(401, 'Token yaroqsiz yoki muddati o‘tgan');
  }
}

module.exports = { sign, verify };
