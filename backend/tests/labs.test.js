'use strict';
/**
 * Secure-mode regression tests for all 10 labs + lab platform features.
 * Vulnerable behaviour is asserted only through the built-in fix verifiers.
 */
const { setup, login, bearer, labState, sequelize, request } = require('./helpers');
const { LAB_IDS } = require('../src/labs/registry');

let app;
beforeAll(async () => { app = await setup(); });
afterAll(() => sequelize.close());

const secure = (id) => labState.setMode(id, false);

describe('Fix verifiers', () => {
  test.each(LAB_IDS)('%s: verifier reports NOT blocked in vulnerable mode and blocked in secure mode', async (id) => {
    await labState.setAll(true);
    const token = await login(app, 'alice');
    const vuln = await request(app).post(`/api/labs/${id}/verify`).set(bearer(token));
    expect(vuln.status).toBe(200);
    expect(vuln.body.blocked).toBe(false);
    expect(vuln.body.fixed).toBe(false);

    await labState.setAll(false);
    const token2 = await login(app, 'alice');
    const fixed = await request(app).post(`/api/labs/${id}/verify`).set(bearer(token2));
    expect(fixed.body.blocked).toBe(true);
    expect(fixed.body.fixed).toBe(true);
  });
});

describe('Secure-mode protections (HTTP level)', () => {
  beforeAll(() => labState.setAll(false));

  test('sqli: special characters are treated as data', async () => {
    const res = await request(app).get('/api/products').query({ search: "'" });
    expect(res.status).toBe(200);
    expect(res.body.count).toBe(0);
  });

  test('xss: markup is stripped from reviews and the non-HttpOnly cookie is not set', async () => {
    const login = await request(app).post('/api/auth/login').send({ email: 'alice@vulnshop.local', password: 'Wonderland#2026' });
    const cookies = (login.headers['set-cookie'] || []).join(';');
    expect(cookies).not.toMatch(/vs_support_session=VULNSHOP/);
    const res = await request(app).post('/api/products/3/reviews').set(bearer(login.body.token))
      .send({ rating: 4, comment: '<b>Qalin</b> matn' });
    expect(res.status).toBe(201);
    expect(res.body.review.comment).toBe('Qalin matn');
  });

  test('bac: customer gets 403 on admin API, guest gets 401', async () => {
    const token = await login(app, 'alice');
    for (const path of ['/api/admin/stats', '/api/admin/users', '/api/admin/settings', '/api/admin/orders']) {
      expect((await request(app).get(path).set(bearer(token))).status).toBe(403);
    }
    expect((await request(app).get('/api/admin/stats')).status).toBe(401);
  });

  test('idor: foreign order returns 404, own order 200, admin sees all', async () => {
    const alice = await login(app, 'alice');
    expect((await request(app).get('/api/orders/1').set(bearer(alice))).status).toBe(404); // admin's order
    expect((await request(app).get('/api/orders/2').set(bearer(alice))).status).toBe(200);
    expect((await request(app).post('/api/orders/4/cancel').set(bearer(alice))).status).toBe(404);
    const admin = await login(app, 'admin');
    expect((await request(app).get('/api/orders/2').set(bearer(admin))).status).toBe(200);
  });

  test('broken-auth: generic error message, short-lived token with iss/aud', async () => {
    const unknown = await request(app).post('/api/auth/login').send({ email: 'nobody@vulnshop.local', password: 'x' });
    const wrong = await request(app).post('/api/auth/login').send({ email: 'bob@vulnshop.local', password: 'x' });
    expect(unknown.status).toBe(401);
    expect(wrong.status).toBe(401);
    expect(unknown.body.error).toBe(wrong.body.error);
    const token = await login(app, 'bob');
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString());
    expect(payload.iss).toBe('vulnshop');
    expect(payload.aud).toBe('vulnshop-web');
    expect(payload.exp - payload.iat).toBe(3600);
    expect(payload.email).toBeUndefined();
  });

  test('broken-auth: login is rate limited after repeated failures', async () => {
    const attempt = () => request(app).post('/api/auth/login').send({ email: 'ratelimit@vulnshop.local', password: 'wrong' });
    for (let i = 0; i < 5; i += 1) expect((await attempt()).status).toBe(401);
    expect((await attempt()).status).toBe(429);
  });

  test('weak-password: weak passwords rejected on register, weak legacy account blocked', async () => {
    const res = await request(app).post('/api/auth/register').send({ name: 'Weak', email: 'weak@vulnshop.local', password: 'short' });
    expect(res.status).toBe(400);
    expect(res.body.details.length).toBeGreaterThan(0);
    const support = await request(app).post('/api/auth/login').send({ email: 'support@vulnshop.local', password: '123456' });
    expect(support.status).toBe(403);
  });

  test('misconfig: no debug endpoint, generic errors, security headers', async () => {
    expect((await request(app).get('/api/debug/config')).status).toBe(404);
    const bad = await request(app).post('/api/auth/login').set('Content-Type', 'application/json').send('{bad json');
    expect(bad.status).toBe(400);
    expect(bad.body.stack).toBeUndefined();
    const res = await request(app).get('/api/health');
    expect(res.headers['content-security-policy']).toBeDefined();
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-powered-by']).toBeUndefined();
    const cors = await request(app).get('/api/health').set('Origin', 'http://evil.localhost:9999');
    expect(cors.headers['access-control-allow-origin']).toBeUndefined();
  });

  test('sensitive-data: public profile is an allow-list DTO, own card number masked', async () => {
    const res = await request(app).get('/api/users/1');
    expect(Object.keys(res.body.user).sort()).toEqual(['bio', 'id', 'memberSince', 'name', 'role']);
    const token = await login(app, 'alice');
    const me = await request(app).get('/api/auth/me').set(bearer(token));
    expect(me.body.user.cardNumber).toMatch(/^•••• •••• •••• \d{4}$/);
    expect(me.body.user.passwordHash).toBeUndefined();
  });

  test('csrf: cookie-authenticated change without token is rejected; with token accepted', async () => {
    const agent = request.agent(app);
    await agent.post('/api/auth/login').send({ email: 'bob@vulnshop.local', password: 'Builder#Shop2026' });
    const denied = await agent.post('/api/account/email').type('form').send({ email: 'bob2@vulnshop.local' });
    expect(denied.status).toBe(403);
    const { body } = await agent.get('/api/auth/csrf');
    const ok = await agent.post('/api/account/email').set('X-CSRF-Token', body.csrfToken).send({ email: 'bob@vulnshop.local' });
    expect(ok.status).toBe(200);
  });

  test('path-traversal: only plain allow-listed filenames are accepted', async () => {
    for (const file of ['../private/flag.txt', 'sub/manual.txt', 'manual.exe', '']) {
      const res = await request(app).get('/api/files/download').query({ file });
      expect(res.status).toBe(400);
    }
    expect((await request(app).get('/api/files/download').query({ file: 'missing-file.txt' })).status).toBe(404);
  });
});

describe('Lab sandbox (vulnerable mode still confined)', () => {
  test('path-traversal cannot leave backend/storage even in vulnerable mode', async () => {
    await labState.setMode('path-traversal', true);
    const res = await request(app).get('/api/files/download').query({ file: '../../package.json' });
    expect(res.status).toBe(403);
    await secure('path-traversal');
  });
});

describe('Learning platform', () => {
  let token;
  beforeAll(async () => {
    await labState.setAll(false);
    token = await login(app, 'alice');
  });

  test('dashboard summary and lab detail without quiz answers', async () => {
    const dash = await request(app).get('/api/labs/dashboard').set(bearer(token));
    expect(dash.status).toBe(200);
    expect(dash.body.summary.total).toBe(10);
    expect(dash.body.summary.securityScore).toBe(100);
    const lab = await request(app).get('/api/labs/sqli').set(bearer(token));
    expect(lab.body.lab.content.quiz[0].answer).toBeUndefined();
    expect(lab.body.lab.content.practical.tasks.length).toBeGreaterThan(0);
  });

  test('flag submission', async () => {
    const wrong = await request(app).post('/api/labs/idor/flag').set(bearer(token)).send({ flag: 'VULNSHOP{nope}' });
    expect(wrong.body.correct).toBe(false);
    const flag = require('../src/labs/flags').idor;
    const right = await request(app).post('/api/labs/idor/flag').set(bearer(token)).send({ flag });
    expect(right.body.correct).toBe(true);
    expect(right.body.progress.discovered).toBe(true);
  });

  test('quiz grading', async () => {
    const quiz = require('../src/labs/content').bac.quiz;
    const res = await request(app).post('/api/labs/bac/quiz').set(bearer(token)).send({ answers: quiz.map((q) => q.answer) });
    expect(res.body.score).toBe(100);
    expect(res.body.passed).toBe(true);
    const bad = await request(app).post('/api/labs/bac/quiz').set(bearer(token)).send({ answers: [0] });
    expect(bad.status).toBe(400);
  });

  test('mode toggle returns a fresh token for broken-auth', async () => {
    const res = await request(app).put('/api/labs/broken-auth/mode').set(bearer(token)).send({ vulnerable: true });
    expect(res.body.vulnerable).toBe(true);
    expect(res.body.token).toBeTruthy();
    const me = await request(app).get('/api/auth/me').set(bearer(res.body.token));
    expect(me.status).toBe(200);
    await secure('broken-auth');
  });

  test('instructor view is admin-only', async () => {
    expect((await request(app).get('/api/labs/students').set(bearer(token))).status).toBe(403);
    const admin = await login(app, 'admin');
    const res = await request(app).get('/api/labs/students').set(bearer(admin));
    expect(res.status).toBe(200);
    expect(res.body.students.find((s) => s.email === 'alice@vulnshop.local').discovered).toBe(1);
  });
});
