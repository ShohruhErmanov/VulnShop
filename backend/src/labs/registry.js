'use strict';
/** Static metadata for the 10 security labs. Learning content lives in ./content/<id>.js */
const LABS = [
  { id: 'sqli', order: 1, title: 'SQL Injection', short: 'SQLi', owasp: 'A03:2021 – Injection', module: 'Product Catalog — qidiruv', endpoint: 'GET /api/products?search=', difficulty: 'O‘rta', points: 150, icon: 'Database' },
  { id: 'xss', order: 2, title: 'Cross-Site Scripting', short: 'XSS', owasp: 'A03:2021 – Injection', module: 'Product Details — sharhlar, Catalog — qidiruv sarlavhasi', endpoint: 'POST /api/products/:id/reviews', difficulty: 'O‘rta', points: 150, icon: 'Code2' },
  { id: 'bac', order: 3, title: 'Broken Access Control', short: 'BAC', owasp: 'A01:2021 – Broken Access Control', module: 'Admin Dashboard API', endpoint: 'GET /api/admin/*', difficulty: 'Oson', points: 100, icon: 'ShieldOff' },
  { id: 'idor', order: 4, title: 'Insecure Direct Object Reference', short: 'IDOR', owasp: 'A01:2021 – Broken Access Control', module: 'Order Management', endpoint: 'GET /api/orders/:id', difficulty: 'Oson', points: 100, icon: 'KeyRound' },
  { id: 'broken-auth', order: 5, title: 'Broken Authentication', short: 'Auth', owasp: 'A07:2021 – Identification & Authentication Failures', module: 'User Login / JWT', endpoint: 'POST /api/auth/login, GET /api/auth/me', difficulty: 'Qiyin', points: 200, icon: 'LockOpen' },
  { id: 'weak-password', order: 6, title: 'Weak Password Policy', short: 'Password', owasp: 'A07:2021 – Identification & Authentication Failures', module: 'User Registration / Login', endpoint: 'POST /api/auth/register', difficulty: 'Oson', points: 100, icon: 'Asterisk' },
  { id: 'misconfig', order: 7, title: 'Security Misconfiguration', short: 'Misconfig', owasp: 'A05:2021 – Security Misconfiguration', module: 'Server konfiguratsiyasi', endpoint: 'GET /api/debug/config', difficulty: 'Oson', points: 100, icon: 'Settings2' },
  { id: 'sensitive-data', order: 8, title: 'Sensitive Data Exposure', short: 'Data', owasp: 'A02:2021 – Cryptographic Failures', module: 'User Profile API', endpoint: 'GET /api/users/:id', difficulty: 'O‘rta', points: 150, icon: 'Eye' },
  { id: 'csrf', order: 9, title: 'Cross-Site Request Forgery', short: 'CSRF', owasp: 'A01:2021 – Broken Access Control', module: 'User Profile — email o‘zgartirish', endpoint: 'POST /api/account/email', difficulty: 'O‘rta', points: 150, icon: 'Repeat' },
  { id: 'path-traversal', order: 10, title: 'Path Traversal', short: 'Traversal', owasp: 'A01:2021 – Broken Access Control', module: 'Product Details — qo‘llanma yuklab olish', endpoint: 'GET /api/files/download?file=', difficulty: 'O‘rta', points: 150, icon: 'FolderTree' },
];

const LAB_IDS = LABS.map((l) => l.id);
const getLab = (id) => LABS.find((l) => l.id === id);

module.exports = { LABS, LAB_IDS, getLab };
