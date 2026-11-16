'use strict';
// Hosted classroom mode: access gate, domain allow-list, instructor protection, no cross-student damage.
process.env.LAB_DEPLOYMENT = 'hosted';
process.env.PUBLIC_HOSTS = 'lab.example.test';
process.env.LAB_ACCESS_CODE = 'class-code-2026';
process.env.INSTRUCTOR_PASSWORD = 'Instructor#Secret2026';
process.env.JWT_SECRET = 'hosted-test-secret-that-is-long-enough-1234567890';

const jwt = require('jsonwebtoken');
const { setup, labState, sequelize, request } = require('./helpers');

const HOST = 'lab.example.test';
let app;
let gate;

const req = (method, path) => request(app)[method](path).set('Host', HOST).set('Cookie', gate);
const login = async (email, password) => {
  const res = await req('post', '/api/auth/login').send({ email, password });
  if (res.status !== 200) throw new Error(`${email}: ${res.status} ${JSON.stringify(res.body)}`);
  return res.body.token;
};
const auth = (t) => ({ Authorization: `Bearer ${t}` });

beforeAll(async () => {
  app = await setup();
  await labState.setAll(true);
  const res = await request(app).post('/gate').set('Host', HOST).type('form').send({ code: 'class-code-2026' });
  gate = res.headers['set-cookie'].find((c) => c.startsWith('vs_gate=')).split(';')[0];
});
afterAll(() => sequelize.close());

describe('Access gate and domains', () => {
  test('health check needs nothing', async () => {
    expect((await request(app).get('/healthz')).text).toBe('ok');
  });
  test('unknown domain is rejected', async () => {
    expect((await request(app).get('/api/health').set('Host', 'evil.example.com')).status).toBe(403);
  });
  test('no gate cookie: API 401, pages redirect to /gate', async () => {
    const api = await request(app).get('/api/health').set('Host', HOST);
    expect(api.status).toBe(401);
    expect(api.body.gate).toBe(true);
    const page = await request(app).get('/lab').set('Host', HOST);
    expect(page.status).toBe(302);
    expect(page.headers.location).toBe('/gate');
  });
  test('wrong code is rejected, gate cookie is HttpOnly + Secure', async () => {
    const bad = await request(app).post('/gate').set('Host', HOST).type('form').send({ code: 'nope' });
    expect(bad.status).toBe(401);
    const ok = await request(app).post('/gate').set('Host', HOST).type('form').send({ code: 'class-code-2026' });
    const cookie = ok.headers['set-cookie'].join(';');
    expect(cookie).toMatch(/HttpOnly/);
    expect(cookie).toMatch(/Secure/);
  });
  test('with gate cookie the lab works and reports hosted deployment', async () => {
    const res = await req('get', '/api/health');
    expect(res.status).toBe(200);
    expect(res.body.deployment).toBe('hosted');
    expect(res.body.labs.sqli).toBe(true);
  });
});

describe('Instructor protection', () => {
  test('documented default admin password does not work; INSTRUCTOR_PASSWORD does', async () => {
    const res = await req('post', '/api/auth/login').send({ email: 'admin@vulnshop.local', password: 'Admin#VulnShop2026' });
    expect(res.status).not.toBe(200);
    const token = await login('admin@vulnshop.local', 'Instructor#Secret2026');
    const me = await req('get', '/api/auth/me').set(auth(token));
    expect(me.body.user.instructor).toBe(true);
  });
  test('a token signed with the weak lab secret cannot impersonate the instructor', async () => {
    const weak = jwt.sign({ sub: 1, role: 'admin' }, 'secret123');
    expect((await req('get', '/api/auth/me').set(auth(weak))).status).toBe(401);
  });
  test('students cannot change lab modes; instructor can', async () => {
    const student = await login('alice@vulnshop.local', 'Wonderland#2026');
    expect((await req('put', '/api/labs/sqli/mode').set(auth(student)).send({ vulnerable: false })).status).toBe(403);
    expect((await req('put', '/api/labs/modes').set(auth(student)).send({ vulnerable: false })).status).toBe(403);
    const instructor = await login('admin@vulnshop.local', 'Instructor#Secret2026');
    const res = await req('put', '/api/labs/sqli/mode').set(auth(instructor)).send({ vulnerable: true });
    expect(res.status).toBe(200);
  });
  test('registering with the instructor e-mail is impossible', async () => {
    const res = await req('post', '/api/auth/register').send({ name: 'Impostor', email: 'admin@vulnshop.local', password: 'x' });
    expect(res.status).toBe(409);
  });
});

describe('Labs stay exploitable for reading, but students cannot damage the shared instance', () => {
  let student;
  beforeAll(async () => { student = await login('bob@vulnshop.local', 'Builder#Shop2026'); });

  test('BAC: admin reads still open in vulnerable mode, destructive writes blocked', async () => {
    expect((await req('get', '/api/admin/stats').set(auth(student))).status).toBe(200);
    expect((await req('delete', '/api/admin/products/1').set(auth(student))).status).toBe(403);
    expect((await req('delete', '/api/admin/users/2').set(auth(student))).status).toBe(403);
    expect((await req('patch', '/api/admin/users/3/role').set(auth(student)).send({ role: 'admin' })).status).toBe(403);
  });
  test('IDOR: foreign order readable, but cannot be cancelled', async () => {
    expect((await req('get', '/api/orders/2').set(auth(student))).status).toBe(200);
    expect((await req('post', '/api/orders/2/cancel').set(auth(student))).status).toBe(404);
  });
  test('shared seed accounts are read-only', async () => {
    expect((await req('post', '/api/account/email').set(auth(student)).send({ email: 'bob9@vulnshop.local' })).status).toBe(403);
    expect((await req('post', '/api/account/password').set(auth(student)).send({ currentPassword: 'Builder#Shop2026', newPassword: 'x' })).status).toBe(403);
  });
  test('students can use their own accounts normally', async () => {
    const reg = await req('post', '/api/auth/register').send({ name: 'Student', email: 'student1@class.test', password: 'pass' });
    expect(reg.status).toBe(201);
    const res = await req('post', '/api/account/email').set(auth(reg.body.token)).send({ email: 'student1b@class.test' });
    expect(res.status).toBe(200);
  });
});
