'use strict';
const crypto = require('crypto');
const express = require('express');
const rateLimit = require('express-rate-limit');
const config = require('../config');

/**
 * HOSTED MODE ACCESS GATE — not part of any lab.
 * Every request (UI and API) requires a signed cookie obtained by entering the class access code.
 * Keeps the vulnerable lab away from scanners, bots and anyone outside the class.
 */
const GATE_COOKIE = 'vs_gate';
const TTL_MS = 12 * 60 * 60 * 1000;

const key = () => crypto.createHmac('sha256', config.jwt.secret).update('vulnshop-gate').digest();
const sign = (exp) => `${exp}.${crypto.createHmac('sha256', key()).update(String(exp)).digest('hex')}`;

function isValid(value) {
  if (typeof value !== 'string' || !value.includes('.')) return false;
  const [exp] = value.split('.');
  const expected = sign(exp);
  if (expected.length !== value.length) return false;
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(value)) && Number(exp) > Date.now();
}

function codeMatches(input) {
  const a = crypto.createHash('sha256').update(String(input || '')).digest();
  const b = crypto.createHash('sha256').update(config.accessCode).digest();
  return crypto.timingSafeEqual(a, b);
}

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function page(error) {
  return `<!doctype html><html lang="uz"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow"><title>VulnShop — Sinfga kirish</title>
<style>*{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;background:linear-gradient(135deg,#312e81,#6d28d9,#a21caf);color:#0f172a;padding:16px}
.c{background:#fff;border-radius:20px;padding:32px;width:100%;max-width:380px;box-shadow:0 20px 60px rgba(0,0,0,.3)}h1{margin:0 0 4px;font-size:22px}p{margin:0 0 20px;color:#64748b;font-size:14px;line-height:1.5}
input{width:100%;padding:12px 14px;border:1px solid #cbd5e1;border-radius:12px;font-size:15px;margin-bottom:12px}button{width:100%;padding:12px;border:0;border-radius:12px;background:#4f46e5;color:#fff;font-weight:600;font-size:15px;cursor:pointer}
.e{background:#fef2f2;color:#b91c1c;padding:10px 12px;border-radius:10px;font-size:13px;margin-bottom:12px}small{display:block;margin-top:16px;color:#94a3b8;font-size:12px}</style></head>
<body><form class="c" method="post" action="/gate"><h1>VulnShop Security Lab</h1><p>Bu kiberxavfsizlik kursi uchun yopiq o‘quv laboratoriyasi. O‘qituvchingiz bergan sinf kodini kiriting.</p>
${error ? `<div class="e">${esc(error)}</div>` : ''}<input type="password" name="code" placeholder="Sinf kodi" autocomplete="off" required autofocus><button type="submit">Kirish</button>
<small>Ilova ataylab zaif. Real shaxsiy ma’lumotlaringizni kiritmang.</small></form></body></html>`;
}

const gateLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: 'draft-7', legacyHeaders: false });

const router = express.Router();
router.get('/gate', (req, res) => res.type('html').send(page()));
router.post('/gate', gateLimiter, express.urlencoded({ extended: false, limit: '2kb' }), (req, res) => {
  if (!codeMatches(req.body && req.body.code)) return res.status(401).type('html').send(page('Kod noto‘g‘ri.'));
  // SameSite=None so the CSRF lab's cross-site request can still pass the gate (it is a gate, not a lab control).
  res.cookie(GATE_COOKIE, sign(Date.now() + TTL_MS), { httpOnly: true, secure: true, sameSite: 'none', maxAge: TTL_MS, path: '/' });
  return res.redirect(303, '/');
});

function classroomGate(req, res, next) {
  if (!config.hosted) return next();
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  if (req.path === '/gate') return router(req, res, next);
  if (isValid(req.cookies && req.cookies[GATE_COOKIE])) return next();
  if (req.path.startsWith('/api/')) return res.status(401).json({ error: 'Sinf kirish kodi talab qilinadi', gate: true });
  return res.redirect(302, '/gate');
}

module.exports = { classroomGate, GATE_COOKIE, sign };
