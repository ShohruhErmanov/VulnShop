'use strict';
const labs = require('../labs/labState');
const { isInstructor, isSharedAccount } = require('./classroomPolicy');

const LAB = 'sensitive-data';

function maskCard(card) {
  if (!card) return null;
  const digits = String(card).replace(/\D/g, '');
  return `•••• •••• •••• ${digits.slice(-4)}`;
}

/**
 * Public profile (anyone can view, e.g. review authors).
 * VULNERABLE: returns the raw database row — password hash, full card number, API key, phone, address...
 * SECURE: explicit allow-list DTO with only public fields.
 */
function publicProfile(user) {
  if (labs.isVulnerable(LAB)) {
    const raw = user.get({ plain: true });
    // privateNote/notice hold other labs' flags; excluded so labs don't spoil each other.
    delete raw.privateNote;
    delete raw.notice;
    return raw;
  }
  return {
    id: user.id,
    name: user.name,
    bio: user.bio || null,
    role: user.role === 'admin' ? 'admin' : 'customer',
    memberSince: user.createdAt,
  };
}

/** The account owner's own profile (GET /api/auth/me). */
function selfProfile(user) {
  const base = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    phone: user.phone,
    address: user.address,
    bio: user.bio,
    privateNote: user.privateNote,
    notice: user.notice,
    createdAt: user.createdAt,
    instructor: isInstructor(user),
    sharedAccount: isSharedAccount(user),
  };
  if (labs.isVulnerable(LAB)) {
    // VULNERABLE: full card number and secrets returned to the browser (ends up in caches, logs, XSS reach).
    return { ...base, cardNumber: user.cardNumber, apiKey: user.apiKey, passwordHash: user.passwordHash };
  }
  return { ...base, cardNumber: maskCard(user.cardNumber), apiKey: user.apiKey ? `${user.apiKey.slice(0, 4)}…` : null };
}

/** Admin user list row. */
function adminRow(user) {
  if (labs.isVulnerable(LAB)) return publicProfile(user);
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    phone: user.phone,
    createdAt: user.createdAt,
  };
}

module.exports = { publicProfile, selfProfile, adminRow, maskCard };
