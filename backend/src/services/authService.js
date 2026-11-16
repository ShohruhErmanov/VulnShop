'use strict';
const { User } = require('../models');
const labs = require('../labs/labState');
const AppError = require('../utils/AppError');
const { hashPassword, verifyPassword, checkPasswordPolicy } = require('../utils/passwords');
const tokenService = require('./tokenService');
const { assertAccountWritable, assertEmailAllowed } = require('./classroomPolicy');

// Bcrypt hash used to equalize response timing when the email does not exist (computed once).
let dummyHashPromise;
const dummyHash = () => (dummyHashPromise = dummyHashPromise || hashPassword('vulnshop-timing-equalizer'));

/**
 * Weak Password Policy lab.
 * VULNERABLE: any non-empty password is accepted ("1", "123456", "password"...).
 * SECURE: length + complexity + common-password deny-list.
 */
function validateNewPassword(password) {
  if (labs.isVulnerable('weak-password')) {
    if (!password || String(password).length < 1) throw new AppError(400, 'Parol kiritilmagan');
    return;
  }
  const { valid, errors } = checkPasswordPolicy(password);
  if (!valid) throw new AppError(400, 'Parol xavfsizlik siyosatiga mos emas', errors);
}

async function register({ name, email, password }) {
  validateNewPassword(password);
  assertEmailAllowed(email);
  const exists = await User.findOne({ where: { email } });
  if (exists) throw new AppError(409, 'Bu email bilan foydalanuvchi mavjud');
  const user = await User.create({
    name,
    email,
    passwordHash: await hashPassword(password),
    role: 'customer',
    cardNumber: '4000 0000 0000 0002',
  });
  return { user, token: tokenService.sign(user) };
}

async function login({ email, password }) {
  const user = await User.findOne({ where: { email } });
  const vulnerableAuth = labs.isVulnerable('broken-auth');

  if (!user) {
    // VULNERABLE: distinct message enables user enumeration.
    if (vulnerableAuth) throw new AppError(404, `Foydalanuvchi topilmadi: ${email}`);
    await verifyPassword(password, await dummyHash()); // SECURE: similar timing for unknown emails
    throw new AppError(401, 'Email yoki parol noto‘g‘ri');
  }

  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) {
    if (vulnerableAuth) throw new AppError(401, 'Parol noto‘g‘ri');
    throw new AppError(401, 'Email yoki parol noto‘g‘ri');
  }

  // SECURE password policy also applies to existing accounts: weak legacy passwords must be reset.
  if (!labs.isVulnerable('weak-password') && !checkPasswordPolicy(password).valid) {
    throw new AppError(403, 'Parolingiz yangi xavfsizlik siyosatiga mos emas. Administrator orqali parolni tiklang.');
  }

  return { user, token: tokenService.sign(user) };
}

async function changePassword(user, { currentPassword, newPassword }) {
  assertAccountWritable(user, { allowInstructor: true });
  const ok = await verifyPassword(currentPassword, user.passwordHash);
  if (!ok) throw new AppError(400, 'Joriy parol noto‘g‘ri');
  validateNewPassword(newPassword);
  user.passwordHash = await hashPassword(newPassword);
  await user.save();
}

module.exports = { register, login, changePassword, validateNewPassword };
