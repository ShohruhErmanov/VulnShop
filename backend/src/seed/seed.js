'use strict';
const crypto = require('crypto');
const { sequelize, User, Product, Review, Order, OrderItem, LabSetting } = require('../models');
const { hashPassword } = require('../utils/passwords');
const FLAGS = require('../labs/flags');
const config = require('../config');

// ALL DATA BELOW IS SYNTHETIC. Card numbers are public test numbers; e-mails use the reserved .local TLD.
const USERS = [
  { name: 'Admin Boshqaruvchi', email: 'admin@vulnshop.local', password: 'Admin#VulnShop2026', role: 'admin', phone: '+998 90 000 00 01', address: 'Toshkent, Lab ko‘chasi 1', cardNumber: '4111 1111 1111 1111', apiKey: FLAGS['sensitive-data'], bio: 'Do‘kon administratori' },
  { name: 'Alice Karimova', email: 'alice@vulnshop.local', password: 'Wonderland#2026', role: 'customer', phone: '+998 90 000 00 02', address: 'Samarqand, Registon 12', cardNumber: '5555 5555 5555 4444', apiKey: 'ak_test_alice_7f3c9a', bio: 'Gadjetlarni yaxshi ko‘raman' },
  { name: 'Bob Toshmatov', email: 'bob@vulnshop.local', password: 'Builder#Shop2026', role: 'customer', phone: '+998 90 000 00 03', address: 'Buxoro, Ark 5', cardNumber: '3782 822463 10005', apiKey: 'ak_test_bob_19bd44', bio: 'Geymer va musiqachi' },
  { name: 'Support Operator', email: 'support@vulnshop.local', password: '123456', role: 'customer', phone: '+998 90 000 00 04', address: 'Toshkent, Support ofisi', cardNumber: '6011 1111 1111 1117', apiKey: 'ak_test_support_0c1d', bio: 'Mijozlarni qo‘llab-quvvatlash', privateNote: `Ichki eslatma: ${FLAGS['weak-password']}` },
  { name: 'Legacy Account', email: 'legacy@vulnshop.local', md5: 'sunshine', role: 'customer', phone: '+998 90 000 00 05', address: 'Namangan, Eski shahar', cardNumber: '4000 0566 5566 5556', apiKey: 'ak_test_legacy_aa01', bio: '2015-yildan beri mijoz (eski tizimdan ko‘chirilgan)' },
  { name: 'CEO Direktor', email: 'ceo@vulnshop.local', random: true, role: 'admin', phone: '+998 90 000 00 06', address: 'Toshkent, Bosh ofis', cardNumber: '4242 4242 4242 4242', apiKey: 'ak_test_ceo_d00d', bio: 'VulnShop asoschisi', privateNote: `Direktor eslatmasi: ${FLAGS['broken-auth']}` },
];

const P = (name, category, price, stock, rating, description, manualFile) => ({ name, category, price, stock, rating, description, manualFile });
const PRODUCTS = [
  P('Aurora Pro Wireless Headphones', 'Audio', 249.0, 34, 4.7, 'Faol shovqinni bostirish (ANC), 40 soat batareya, Hi-Res audio va multipoint Bluetooth 5.3.', 'manual-aurora-headphones.txt'),
  P('Pulse Mini Bluetooth Speaker', 'Audio', 79.0, 80, 4.4, 'IP67 suv o‘tkazmaydigan korpus, 360° ovoz, 18 soat ishlash vaqti.', null),
  P('Studio One Monitor Speakers', 'Audio', 329.0, 12, 4.8, 'Studiya darajasidagi 5" monitor karnaylar, tekis chastota javobi.', null),
  P('Nimbus 14 Ultrabook', 'Laptops', 1299.0, 9, 4.6, '14" 2.8K OLED ekran, 32 GB RAM, 1 TB NVMe SSD, 1.2 kg alyuminiy korpus.', 'manual-nimbus-ultrabook.txt'),
  P('Titan 16 Creator Laptop', 'Laptops', 2199.0, 5, 4.9, 'RTX grafika, 16" 165Hz mini-LED ekran, kontent yaratuvchilar uchun.', null),
  P('Orbit X Smartphone', 'Phones', 899.0, 25, 4.5, '6.7" AMOLED 120Hz, 200 MP kamera, 5000 mAh batareya, 65W tez quvvatlash.', 'manual-orbit-x.txt'),
  P('Orbit Lite Smartphone', 'Phones', 399.0, 60, 4.2, 'Arzon va kuchli: 6.4" ekran, 50 MP kamera, 2 kunlik batareya.', null),
  P('Vector Smartwatch S2', 'Wearables', 299.0, 40, 4.3, 'EKG, SpO2, GPS, 14 kunlik batareya va 100+ sport rejimi.', null),
  P('Flex Fitness Band', 'Wearables', 59.0, 120, 4.1, 'Uyqu va yurak urishini kuzatish, 21 kun batareya.', null),
  P('Glide Mechanical Keyboard', 'Accessories', 149.0, 45, 4.7, 'Hot-swap switchlar, PBT keycaplar, RGB, simsiz 2.4 GHz rejim.', 'manual-glide-keyboard.txt'),
  P('Precision Wireless Mouse', 'Accessories', 69.0, 70, 4.5, '26K DPI sensor, 70 soat batareya, ergonomik dizayn.', null),
  P('USB-C 8-in-1 Hub', 'Accessories', 49.0, 150, 4.0, '4K HDMI, 100W PD, SD/microSD, 3x USB-A, Ethernet.', null),
  P('Nova Gaming Console', 'Gaming', 499.0, 15, 4.8, '4K 120 FPS, 1 TB SSD, ray tracing va orqaga moslik.', null),
  P('Raptor Pro Controller', 'Gaming', 89.0, 55, 4.4, 'Hall-effect stiklar, almashtiriladigan tugmalar, past kechikish.', null),
  P('Lumen Smart Bulb (4-pack)', 'Smart Home', 39.0, 200, 4.2, '16 mln rang, ovozli boshqaruv, jadval va sahnalar.', null),
  P('Sentinel Security Camera', 'Smart Home', 129.0, 30, 4.3, '2K tungi ko‘rish, lokal saqlash, harakatni aniqlash.', null),
];

const HIDDEN = {
  name: 'Prototype X — Internal Only', category: 'Laptops', price: 9999.0, stock: 1, rating: 0, isPublished: false,
  description: `Chiqarilmagan prototip. Ichki ma'lumot: ${FLAGS.sqli}`,
};

const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

async function seed({ force = false } = {}) {
  if (force) await sequelize.sync({ force: true });
  else await sequelize.sync();

  const users = [];
  for (const u of USERS) {
    let passwordHash;
    if (u.md5) passwordHash = crypto.createHash('md5').update(u.md5).digest('hex'); // legacy unsalted MD5
    else if (u.random) passwordHash = await hashPassword(crypto.randomBytes(32).toString('hex'));
    // Hosted classroom: the instructor password comes from INSTRUCTOR_PASSWORD (the documented one is public).
    else if (u.role === 'admin' && config.hosted) passwordHash = await hashPassword(config.instructorPassword);
    else passwordHash = await hashPassword(u.password);
    const { password, md5, random, ...data } = u;
    users.push(await User.create({ ...data, passwordHash }));
  }
  const [admin, alice, bob] = users;

  const products = [];
  for (const p of [...PRODUCTS, HIDDEN]) {
    products.push(await Product.create({ ...p, slug: slugify(p.name), imageUrl: null }));
  }

  const reviews = [
    [0, alice, 5, 'Shovqin bostirish ajoyib, metroda ham jimjitlik!'],
    [0, bob, 4, 'Ovoz zo‘r, lekin quloqqa biroz og‘irroq.'],
    [3, alice, 5, 'Ekran nihoyatda yorqin, batareya kun bo‘yi yetadi.'],
    [5, bob, 4, 'Kamera kunduzi juda yaxshi, tunda o‘rtacha.'],
    [9, bob, 5, 'Yozish tajribasi zo‘r, switchlarni almashtirish oson.'],
    [12, alice, 5, 'Grafika va tezlik — 10/10.'],
  ];
  for (const [idx, user, rating, comment] of reviews) {
    await Review.create({ productId: products[idx].id, userId: user.id, rating, comment });
  }

  const mkOrder = async (user, status, items, address, note) => {
    const total = items.reduce((s, [i, q]) => s + products[i].price * q, 0);
    const order = await Order.create({ userId: user.id, status, total, shippingAddress: address, note });
    for (const [i, q] of items) {
      await OrderItem.create({ orderId: order.id, productId: products[i].id, productName: products[i].name, quantity: q, unitPrice: products[i].price });
    }
    return order;
  };
  await mkOrder(admin, 'delivered', [[4, 1], [9, 2]], 'Toshkent, Bosh ofis (maxfiy)', `Ichki buyurtma. Xaridlar bo‘limi kodi: ${FLAGS.idor}`);
  await mkOrder(alice, 'shipped', [[0, 1], [11, 1]], alice.address, 'Iltimos, eshik oldiga qoldiring');
  await mkOrder(alice, 'paid', [[7, 1]], alice.address, null);
  await mkOrder(bob, 'delivered', [[12, 1], [13, 2]], bob.address, 'Sovg‘a qog‘oziga o‘rang');

  await LabSetting.destroy({ where: {} });
  return { users: users.length, products: products.length };
}

async function seedIfEmpty() {
  const count = await User.count();
  if (count === 0) {
    const r = await seed();
    console.log(`[seed] ${r.users} ta foydalanuvchi, ${r.products} ta mahsulot yaratildi.`);
  }
}

module.exports = { seed, seedIfEmpty, USERS };
