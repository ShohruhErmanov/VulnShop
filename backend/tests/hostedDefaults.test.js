'use strict';
// Hosted mode without LAB_ACCESS_CODE / INSTRUCTOR_PASSWORD: values are derived from JWT_SECRET.
const { checkPasswordPolicy } = require('../src/utils/passwords');

const load = (env) => {
  let cfg;
  jest.isolateModules(() => {
    Object.assign(process.env, env);
    delete process.env.LAB_ACCESS_CODE;
    delete process.env.INSTRUCTOR_PASSWORD;
    cfg = require('../src/config');
  });
  return cfg;
};

const BASE = { LAB_DEPLOYMENT: 'hosted', PUBLIC_HOSTS: 'lab.example.test' };

test('derived values are stable, strong and reported', () => {
  const a = load({ ...BASE, JWT_SECRET: 'a'.repeat(48) });
  const b = load({ ...BASE, JWT_SECRET: 'a'.repeat(48) });
  expect(a.accessCode).toMatch(/^sinf-[0-9a-f]{10}$/);
  expect(a.accessCode).toBe(b.accessCode);
  expect(a.instructorPassword).toBe(b.instructorPassword);
  expect(checkPasswordPolicy(a.instructorPassword).valid).toBe(true);
  expect(Object.keys(a.generatedSecrets).sort()).toEqual(['INSTRUCTOR_PASSWORD', 'LAB_ACCESS_CODE']);
});

test('different JWT_SECRET gives different values', () => {
  const a = load({ ...BASE, JWT_SECRET: 'a'.repeat(48) });
  const c = load({ ...BASE, JWT_SECRET: 'c'.repeat(48) });
  expect(a.accessCode).not.toBe(c.accessCode);
  expect(a.instructorPassword).not.toBe(c.instructorPassword);
});

test('without a strong JWT_SECRET hosted mode still refuses to start', () => {
  expect(() => load({ ...BASE, JWT_SECRET: 'short' })).toThrow(/Hosted rejim/);
});
