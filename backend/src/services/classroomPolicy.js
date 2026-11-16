'use strict';
/**
 * Classroom (hosted) policy — NOT part of any lab.
 * On a shared server students must be able to exploit the labs without damaging
 * the instance for each other or taking over the instructor account.
 */
const config = require('../config');
const AppError = require('../utils/AppError');

const INSTRUCTOR_EMAIL = 'admin@vulnshop.local';
const SHARED_ACCOUNTS = new Set([
  INSTRUCTOR_EMAIL, 'alice@vulnshop.local', 'bob@vulnshop.local',
  'support@vulnshop.local', 'legacy@vulnshop.local', 'ceo@vulnshop.local',
]);

/** Local: any admin is the instructor. Hosted: only the seeded instructor account. */
function isInstructor(user) {
  if (!user || user.role !== 'admin') return false;
  return config.hosted ? user.email === INSTRUCTOR_EMAIL : true;
}

const isSharedAccount = (user) => Boolean(user && SHARED_ACCOUNTS.has(user.email));

/** Instructor-only when hosted (lab mode control, destructive admin writes). */
function instructorWhenHosted(message) {
  return (req, res, next) => {
    if (!config.hosted || isInstructor(req.user)) return next();
    return next(new AppError(403, message));
  };
}

/** Shared seed accounts are read-only on a hosted lab (otherwise one student could break a lab for all). */
function assertAccountWritable(user, { allowInstructor = false } = {}) {
  if (!config.hosted || !isSharedAccount(user)) return;
  if (allowInstructor && isInstructor(user)) return;
  throw new AppError(403, 'Bu umumiy lab akkaunti — sinf serverida uni o‘zgartirib bo‘lmaydi. O‘z akkauntingizni yarating.');
}

/** Nobody may register / switch to the instructor e-mail on a hosted lab. */
function assertEmailAllowed(email) {
  if (config.hosted && SHARED_ACCOUNTS.has(String(email).toLowerCase())) {
    throw new AppError(409, 'Bu email band');
  }
}

module.exports = { isInstructor, isSharedAccount, instructorWhenHosted, assertAccountWritable, assertEmailAllowed, INSTRUCTOR_EMAIL };
