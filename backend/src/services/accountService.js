'use strict';
const { User } = require('../models');
const labs = require('../labs/labState');
const config = require('../config');
const FLAGS = require('../labs/flags');
const AppError = require('../utils/AppError');

const { assertAccountWritable, assertEmailAllowed } = require('./classroomPolicy');

async function updateProfile(user, { name, phone, address, bio }) {
  assertAccountWritable(user, { allowInstructor: true });
  Object.assign(user, { name, phone: phone || null, address: address || null, bio: bio || null });
  await user.save();
  return user;
}

function isCrossSite(req) {
  const origin = req.get('origin') || req.get('referer');
  if (!origin) return false;
  try {
    return !config.corsOrigins.includes(new URL(origin).origin);
  } catch (_) {
    return true;
  }
}

/**
 * Change e-mail — CSRF lab target.
 * The anti-CSRF control itself is the csrfProtection middleware; this service only records
 * a lab "security event" when a forged cross-site request succeeded in vulnerable mode.
 */
async function changeEmail(req, { email }) {
  const user = req.user;
  assertAccountWritable(user);
  assertEmailAllowed(email);
  const taken = await User.findOne({ where: { email } });
  if (taken && taken.id !== user.id) throw new AppError(409, 'Bu email band');
  user.email = email;
  if (labs.isVulnerable('csrf') && req.auth.source === 'cookie' && isCrossSite(req)) {
    user.notice = `Xavfsizlik hodisasi: emailingiz boshqa saytdan o‘zgartirildi! ${FLAGS.csrf}`;
  }
  await user.save();
  return user;
}

module.exports = { updateProfile, changeEmail };
