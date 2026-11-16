'use strict';
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

async function hashPassword(plain) {
  return bcrypt.hash(plain, 12);
}

// Supports bcrypt and *legacy* unsalted MD5 hashes (seeded legacy account, see Sensitive Data lab).
async function verifyPassword(plain, hash) {
  if (/^[a-f0-9]{32}$/i.test(hash)) {
    const md5 = crypto.createHash('md5').update(String(plain)).digest('hex');
    return crypto.timingSafeEqual(Buffer.from(md5), Buffer.from(hash.toLowerCase()));
  }
  return bcrypt.compare(String(plain), hash);
}

const COMMON = new Set([
  '123456', '123456789', 'password', 'qwerty', '12345678', '111111', '1234567890', 'admin', 'admin123',
  'letmein', 'welcome', 'iloveyou', 'sunshine', 'password1', 'qwerty123', 'abc123', 'monkey', 'dragon',
  'parol', 'parol123', 'toshkent', 'uzbekistan', 'password123!', 'qwerty123456',
]);

/** Secure password policy (NIST SP 800-63B inspired + complexity rules for teaching). */
function checkPasswordPolicy(password) {
  const p = typeof password === 'string' ? password : '';
  const errors = [];
  if (p.length < 12) errors.push('Kamida 12 ta belgi bo‘lishi kerak');
  if (p.length > 128) errors.push('Ko‘pi bilan 128 ta belgi');
  if (!/[a-z]/.test(p)) errors.push('Kamida bitta kichik harf');
  if (!/[A-Z]/.test(p)) errors.push('Kamida bitta katta harf');
  if (!/[0-9]/.test(p)) errors.push('Kamida bitta raqam');
  if (!/[^A-Za-z0-9]/.test(p)) errors.push('Kamida bitta maxsus belgi');
  if (COMMON.has(p.toLowerCase())) errors.push('Juda keng tarqalgan parol');
  return { valid: errors.length === 0, errors };
}

module.exports = { hashPassword, verifyPassword, checkPasswordPolicy };
