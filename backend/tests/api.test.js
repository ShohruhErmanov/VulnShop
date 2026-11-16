'use strict';
const { setup, login, bearer, labState, sequelize, request } = require('./helpers');

let app;
beforeAll(async () => {
  app = await setup();
  await labState.setAll(false); // functional tests run against the secure implementation
});
afterAll(() => sequelize.close());

describe('System', () => {
  test('health endpoint reports lab mode', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.mode).toBe('lab');
    expect(Object.keys(res.body.labs)).toHaveLength(10);
  });

  test('local-only guard rejects non-local Host headers', async () => {
    const res = await request(app).get('/api/health').set('Host', 'vulnshop.example.com');
    expect(res.status).toBe(403);
  });

  test('unknown endpoint returns 404', async () => {
    expect((await request(app).get('/api/nope')).status).toBe(404);
  });
});

describe('Authentication', () => {
  test('register -> me -> logout', async () => {
    const reg = await request(app).post('/api/auth/register')
      .send({ name: 'Test Student', email: 'student@vulnshop.local', password: 'Str0ng#Passw0rd!' });
    expect(reg.status).toBe(201);
    expect(reg.body.token).toBeTruthy();
    const me = await request(app).get('/api/auth/me').set(bearer(reg.body.token));
    expect(me.status).toBe(200);
    expect(me.body.user.email).toBe('student@vulnshop.local');
    expect(me.body.user.passwordHash).toBeUndefined();
    expect((await request(app).post('/api/auth/logout')).status).toBe(200);
  });

  test('duplicate e-mail is rejected', async () => {
    const res = await request(app).post('/api/auth/register')
      .send({ name: 'Dup', email: 'alice@vulnshop.local', password: 'Str0ng#Passw0rd!' });
    expect(res.status).toBe(409);
  });

  test('invalid payload returns 400 with details', async () => {
    const res = await request(app).post('/api/auth/register').send({ email: 'not-an-email' });
    expect(res.status).toBe(400);
    expect(Array.isArray(res.body.details)).toBe(true);
  });

  test('protected route without token returns 401', async () => {
    expect((await request(app).get('/api/cart')).status).toBe(401);
  });

  test('change password', async () => {
    const reg = await request(app).post('/api/auth/register')
      .send({ name: 'Pw User', email: 'pw@vulnshop.local', password: 'Str0ng#Passw0rd!' });
    const res = await request(app).post('/api/account/password').set(bearer(reg.body.token))
      .send({ currentPassword: 'Str0ng#Passw0rd!', newPassword: 'An0ther#Str0ngOne' });
    expect(res.status).toBe(200);
    const ok = await request(app).post('/api/auth/login').send({ email: 'pw@vulnshop.local', password: 'An0ther#Str0ngOne' });
    expect(ok.status).toBe(200);
  });
});

describe('Catalog, reviews, cart, orders', () => {
  let token;
  beforeAll(async () => { token = await login(app, 'bob'); });

  test('list, filter and sort products', async () => {
    const all = await request(app).get('/api/products');
    expect(all.status).toBe(200);
    expect(all.body.count).toBe(16);
    const audio = await request(app).get('/api/products?category=Audio&sort=price_asc');
    expect(audio.body.products.every((p) => p.category === 'Audio')).toBe(true);
    const prices = audio.body.products.map((p) => Number(p.price));
    expect(prices).toEqual([...prices].sort((a, b) => a - b));
    const cats = await request(app).get('/api/products/categories');
    expect(cats.body.categories).toContain('Laptops');
  });

  test('product detail with reviews; unpublished product is 404', async () => {
    const res = await request(app).get('/api/products/1');
    expect(res.status).toBe(200);
    expect(res.body.product.reviews.length).toBeGreaterThan(0);
    expect((await request(app).get('/api/products/17')).status).toBe(404);
  });

  test('create review updates rating', async () => {
    const res = await request(app).post('/api/products/2/reviews').set(bearer(token)).send({ rating: 5, comment: 'Juda yaxshi' });
    expect(res.status).toBe(201);
    expect(res.body.review.author.name).toBe('Bob Toshmatov');
  });

  test('cart CRUD and checkout -> order -> cancel', async () => {
    let res = await request(app).post('/api/cart').set(bearer(token)).send({ productId: 2, quantity: 2 });
    expect(res.status).toBe(201);
    const itemId = res.body.items[0].id;
    res = await request(app).patch(`/api/cart/${itemId}`).set(bearer(token)).send({ quantity: 3 });
    expect(res.body.count).toBe(3);
    await request(app).post('/api/cart').set(bearer(token)).send({ productId: 9, quantity: 1 });
    res = await request(app).delete(`/api/cart/${itemId}`).set(bearer(token));
    expect(res.body.items).toHaveLength(1);
    expect((await request(app).post('/api/cart').set(bearer(token)).send({ productId: 2, quantity: 999 })).status).toBe(400);

    res = await request(app).post('/api/orders').set(bearer(token)).send({ shippingAddress: 'Buxoro, Ark 5' });
    expect(res.status).toBe(201);
    const order = res.body.order;
    expect(Number(order.total)).toBe(59);
    expect((await request(app).get('/api/cart').set(bearer(token))).body.count).toBe(0);

    const mine = await request(app).get('/api/orders').set(bearer(token));
    expect(mine.body.orders.some((o) => o.id === order.id)).toBe(true);
    res = await request(app).post(`/api/orders/${order.id}/cancel`).set(bearer(token));
    expect(res.body.order.status).toBe('cancelled');
  });

  test('empty cart checkout is rejected', async () => {
    const res = await request(app).post('/api/orders').set(bearer(token)).send({ shippingAddress: 'Buxoro, Ark 5' });
    expect(res.status).toBe(400);
  });

  test('profile update', async () => {
    const res = await request(app).put('/api/account/profile').set(bearer(token))
      .send({ name: 'Bob T.', phone: '+998 90 111 22 33', address: 'Buxoro', bio: 'Salom' });
    expect(res.status).toBe(200);
    expect(res.body.user.name).toBe('Bob T.');
  });

  test('document download (legit file)', async () => {
    const res = await request(app).get('/api/files/download?file=manual-orbit-x.txt');
    expect(res.status).toBe(200);
    expect(res.text).toContain('Orbit X');
  });
});

describe('Admin CRUD', () => {
  let token;
  beforeAll(async () => { token = await login(app, 'admin'); });

  test('stats, users, orders', async () => {
    const stats = await request(app).get('/api/admin/stats').set(bearer(token));
    expect(stats.status).toBe(200);
    expect(stats.body.users).toBeGreaterThanOrEqual(6);
    const users = await request(app).get('/api/admin/users').set(bearer(token));
    expect(users.body.users[0].passwordHash).toBeUndefined();
    const orders = await request(app).get('/api/admin/orders').set(bearer(token));
    expect(orders.body.orders.length).toBeGreaterThan(0);
    const upd = await request(app).patch('/api/admin/orders/2/status').set(bearer(token)).send({ status: 'delivered' });
    expect(upd.body.order.status).toBe('delivered');
  });

  test('product create / update / delete', async () => {
    const data = { name: 'Lab Test Product', description: 'Test tavsifi', price: 10.5, category: 'Accessories', stock: 3, isPublished: true };
    let res = await request(app).post('/api/admin/products').set(bearer(token)).send(data);
    expect(res.status).toBe(201);
    const id = res.body.product.id;
    res = await request(app).put(`/api/admin/products/${id}`).set(bearer(token)).send({ ...data, price: 12 });
    expect(Number(res.body.product.price)).toBe(12);
    expect((await request(app).delete(`/api/admin/products/${id}`).set(bearer(token))).status).toBe(200);
    expect((await request(app).get(`/api/products/${id}`)).status).toBe(404);
  });

  test('role change and user delete', async () => {
    const reg = await request(app).post('/api/auth/register')
      .send({ name: 'Temp', email: 'temp@vulnshop.local', password: 'Str0ng#Passw0rd!' });
    const id = reg.body.user.id;
    const role = await request(app).patch(`/api/admin/users/${id}/role`).set(bearer(token)).send({ role: 'admin' });
    expect(role.body.user.role).toBe('admin');
    expect((await request(app).delete(`/api/admin/users/${id}`).set(bearer(token))).status).toBe(200);
  });
});
