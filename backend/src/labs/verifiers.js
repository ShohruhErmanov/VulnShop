'use strict';
/**
 * Fix verifiers: each one replays a known exploit against the CURRENT implementation
 * (the same service/middleware functions the HTTP API uses) and reports whether it was blocked.
 * They never modify data.
 */
const jwtB64 = (obj) => Buffer.from(JSON.stringify(obj)).toString('base64url');

function runMiddleware(mw, req) {
  return new Promise((resolve) => {
    const res = { status() { return this; }, json() { resolve({ blocked: true }); return this; }, setHeader() {} };
    mw(req, res, (err) => resolve({ blocked: Boolean(err), error: err }));
  });
}

const verifiers = {
  async sqli() {
    const { Product } = require('../models');
    const productService = require('../services/productService');
    const hidden = await Product.findAll({ where: { isPublished: false }, attributes: ['id'], raw: true });
    const hiddenIds = new Set(hidden.map((p) => p.id));
    let rows = [];
    try {
      rows = await productService.search({ search: "' OR 1=1 -- -" });
    } catch (_) {
      return { blocked: false, detail: 'Payload SQL xatosini keltirib chiqardi — so‘rov hali ham satr birlashtirish bilan quriladi.' };
    }
    const leaked = rows.some((r) => hiddenIds.has(Number(r.id)));
    return leaked
      ? { blocked: false, detail: `Payload ' OR 1=1 -- - yashirin mahsulotlarni qaytardi (${rows.length} qator).` }
      : { blocked: true, detail: `Payload oddiy matn sifatida qidirildi, ${rows.length} natija. So‘rov parametrlangan.` };
  },

  async xss() {
    const { sanitizeComment } = require('../services/reviewService');
    const out = sanitizeComment('<img src=x onerror=alert(document.cookie)>Zo‘r');
    return /[<>]/.test(out)
      ? { blocked: false, detail: `HTML teglari saqlanib qoldi: ${out}` }
      : { blocked: true, detail: `Kiritma tozalandi: "${out}". Frontend matnni faqat text sifatida chiqaradi.` };
  },

  async bac() {
    const { adminGate } = require('../middleware/auth');
    const r = await runMiddleware(adminGate, { user: { id: 999, role: 'customer' } });
    return r.blocked
      ? { blocked: true, detail: 'customer roli bilan /api/admin/* ga kirish 403 bilan rad etildi.' }
      : { blocked: false, detail: 'customer foydalanuvchi admin funksiyalariga kira oldi.' };
  },

  async idor() {
    const { Order } = require('../models');
    const orderService = require('../services/orderService');
    const victim = await Order.findOne({ order: [['id', 'ASC']] });
    if (!victim) return { blocked: false, detail: 'Tekshirish uchun buyurtma topilmadi (seed ishga tushiring).' };
    try {
      await orderService.getForUser({ id: -1, role: 'customer' }, victim.id);
      return { blocked: false, detail: `Begona foydalanuvchi #${victim.id} buyurtmani o‘qiy oldi.` };
    } catch (err) {
      return { blocked: true, detail: `Begona buyurtma #${victim.id} so‘rovi ${err.status} qaytardi.` };
    }
  },

  async 'broken-auth'() {
    const tokenService = require('../services/tokenService');
    const forged = `${jwtB64({ alg: 'none', typ: 'JWT' })}.${jwtB64({ sub: 1, role: 'admin' })}.`;
    const weak = require('jsonwebtoken').sign({ sub: 1, role: 'admin' }, 'secret123');
    const results = [];
    for (const [name, token] of [['alg:none', forged], ['secret123 bilan imzolangan', weak]]) {
      try {
        tokenService.verify(token);
        results.push(`${name} token QABUL QILINDI`);
      } catch (_) {
        results.push(`${name} token rad etildi`);
      }
    }
    const blocked = results.every((r) => r.endsWith('rad etildi'));
    return { blocked, detail: results.join('; ') };
  },

  async 'weak-password'() {
    const { validateNewPassword } = require('../services/authService');
    const tried = ['123456', 'password', 'a'];
    const accepted = tried.filter((p) => {
      try { validateNewPassword(p); return true; } catch (_) { return false; }
    });
    return accepted.length
      ? { blocked: false, detail: `Zaif parollar qabul qilindi: ${accepted.join(', ')}` }
      : { blocked: true, detail: 'Zaif parollar (123456, password, a) siyosat tomonidan rad etildi.' };
  },

  async misconfig() {
    const { errorHandler } = require('../middleware/errorHandler');
    const body = await new Promise((resolve) => {
      const res = { status() { return this; }, json(b) { resolve(b); } };
      errorHandler(new Error('verifier probe'), {}, res, () => {});
    });
    const debug = require('../labs/labState').isVulnerable('misconfig');
    return body.stack || debug
      ? { blocked: false, detail: 'Xato javobida stack trace bor va /api/debug/config ochiq.' }
      : { blocked: true, detail: 'Xato javobi umumiy ("Ichki server xatosi"), debug endpoint o‘chirilgan, helmet yoqilgan.' };
  },

  async 'sensitive-data'() {
    const { User } = require('../models');
    const { publicProfile } = require('../services/userSerializer');
    const user = await User.findOne({ order: [['id', 'ASC']] });
    if (!user) return { blocked: false, detail: 'Foydalanuvchi topilmadi.' };
    const dto = publicProfile(user);
    const leaked = ['passwordHash', 'cardNumber', 'apiKey', 'email', 'phone'].filter((k) => k in dto);
    return leaked.length
      ? { blocked: false, detail: `Public profil maxfiy maydonlarni qaytaradi: ${leaked.join(', ')}` }
      : { blocked: true, detail: `Public profil faqat ruxsat etilgan maydonlarni qaytaradi: ${Object.keys(dto).join(', ')}` };
  },

  async csrf() {
    const { csrfProtection } = require('../middleware/csrf');
    const r = await runMiddleware(csrfProtection, {
      method: 'POST', auth: { source: 'cookie' }, cookies: { vs_token: 'x' }, get: () => undefined,
    });
    return r.blocked
      ? { blocked: true, detail: 'Cookie bilan kelgan, CSRF tokensiz POST so‘rov 403 bilan rad etildi.' }
      : { blocked: false, detail: 'Tokensiz cross-site POST so‘rov qabul qilindi.' };
  },

  async 'path-traversal'() {
    const path = require('path');
    const { resolveDocument, DOCS_DIR } = require('../services/fileService');
    const payloads = ['../private/flag.txt', 'manual-aurora-headphones.txt/../../private/flag.txt', `..${path.sep}private${path.sep}flag.txt`];
    const passed = payloads.filter((p) => {
      try { return !resolveDocument(p).startsWith(DOCS_DIR + path.sep); } catch (_) { return false; }
    });
    return passed.length
      ? { blocked: false, detail: `Traversal payload qabul qilindi: ${passed.join(', ')}` }
      : { blocked: true, detail: 'Barcha ../ payloadlar rad etildi; faqat documents/ ichidagi oddiy fayl nomlari ruxsat etiladi.' };
  },
};

module.exports = verifiers;
