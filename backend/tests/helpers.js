'use strict';
const request = require('supertest');
const { seed } = require('../src/seed/seed');
const labState = require('../src/labs/labState');
const { createApp } = require('../src/app');
const { sequelize } = require('../src/models');

const CREDS = {
  admin: { email: 'admin@vulnshop.local', password: 'Admin#VulnShop2026' },
  alice: { email: 'alice@vulnshop.local', password: 'Wonderland#2026' },
  bob: { email: 'bob@vulnshop.local', password: 'Builder#Shop2026' },
};

async function setup() {
  await seed({ force: true });
  await labState.init();
  return createApp();
}

async function login(app, who) {
  const res = await request(app).post('/api/auth/login').send(CREDS[who]);
  if (res.status !== 200) throw new Error(`login ${who} failed: ${res.status} ${JSON.stringify(res.body)}`);
  return res.body.token;
}

const bearer = (t) => ({ Authorization: `Bearer ${t}` });

module.exports = { setup, login, bearer, CREDS, labState, sequelize, request };
