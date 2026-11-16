'use strict';
// Usage: npm run seed  -> drops all tables and recreates synthetic lab data.
const { connectWithRetry } = require('../config/database');
const { sequelize } = require('../models');
const { seed } = require('./seed');

(async () => {
  try {
    await connectWithRetry(5, 2000);
    const r = await seed({ force: true });
    console.log(`[seed] Ma'lumotlar bazasi qayta yaratildi: ${r.users} foydalanuvchi, ${r.products} mahsulot.`);
    await sequelize.close();
    process.exit(0);
  } catch (err) {
    console.error('[seed] Xato:', err);
    process.exit(1);
  }
})();
