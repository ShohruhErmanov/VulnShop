'use strict';
// Production mode must force every lab into secure mode, regardless of stored settings.
process.env.APP_MODE = 'production';
process.env.JWT_SECRET = 'test-production-secret-that-is-long-enough-1234567890';

const { setup, login, bearer, labState, sequelize, request } = require('./helpers');
const { LabSetting } = require('../src/models');
const { LAB_IDS } = require('../src/labs/registry');
const config = require('../src/config');

let app;
beforeAll(async () => {
  app = await setup();
  // Even if the database says "vulnerable", production must ignore it.
  await LabSetting.update({ vulnerable: true }, { where: {} });
  await labState.init();
});
afterAll(() => sequelize.close());

test('config reports production and labs disabled', () => {
  expect(config.appMode).toBe('production');
  expect(config.labEnabled).toBe(false);
});

test('every lab is reported secure', async () => {
  for (const id of LAB_IDS) expect(labState.isVulnerable(id)).toBe(false);
  const res = await request(app).get('/api/health');
  expect(Object.values(res.body.labs).every((v) => v === false)).toBe(true);
});

test('lab mode cannot be switched on', async () => {
  const token = await login(app, 'admin');
  const res = await request(app).put('/api/labs/sqli/mode').set(bearer(token)).send({ vulnerable: true });
  expect(res.status).toBe(403);
  const all = await request(app).put('/api/labs/modes').set(bearer(token)).send({ vulnerable: true });
  expect(all.status).toBe(403);
});

test('debug endpoint does not exist', async () => {
  expect((await request(app).get('/api/debug/config')).status).toBe(404);
});

test('short JWT secret is refused in production', () => {
  jest.isolateModules(() => {
    process.env.JWT_SECRET = 'short';
    expect(() => require('../src/config')).toThrow(/JWT_SECRET/);
  });
});
