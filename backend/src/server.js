'use strict';
const config = require('./config');
const { connectWithRetry } = require('./config/database');
const { sequelize } = require('./models');
const labState = require('./labs/labState');
const { seedIfEmpty } = require('./seed/seed');
const { createApp } = require('./app');

const LOOPBACK = ['127.0.0.1', 'localhost', '::1'];

async function main() {
  // SAFETY: refuse to expose the vulnerable lab on a public interface.
  // (Hosted mode may bind publicly only because config validated the access gate + domain allow-list.)
  if (config.labEnabled && !LOOPBACK.includes(config.host) && !config.allowContainerBind && !config.hosted) {
    console.error(`[VulnShop] Lab rejimida HOST=${config.host} ruxsat etilmaydi. Faqat 127.0.0.1 (yoki Docker ichida ALLOW_CONTAINER_BIND=true).`);
    process.exit(1);
  }

  await connectWithRetry();
  await sequelize.sync();
  await seedIfEmpty();
  await labState.init();

  const app = createApp();
  app.listen(config.port, config.host, () => {
    let banner = config.labEnabled
      ? '⚠  LAB MODE — zaif endpointlar faol. Faqat lokal o‘quv muhiti uchun!'
      : '✔  PRODUCTION MODE — barcha laboratoriyalar xavfsiz rejimga majburlangan.';
    if (config.hosted) banner = `🔒 HOSTED CLASSROOM — sinf kodi darvozasi yoqilgan; domenlar: ${config.publicHosts.join(', ')}`;
    console.log(`[VulnShop] API http://${config.host}:${config.port}/api  (${config.db.dialect})`);
    console.log(`[VulnShop] ${banner}`);
    const generated = Object.entries(config.generatedSecrets || {});
    if (generated.length) {
      console.log('[VulnShop] ─────────────────────────────────────────────────────────');
      console.log('[VulnShop] Quyidagi qiymatlar JWT_SECRET dan avtomatik hosil qilindi (har restartda bir xil):');
      for (const [k, v] of generated) console.log(`[VulnShop]   ${k} = ${v}`);
      console.log('[VulnShop] O‘zgartirish uchun ularni Render → Environment bo‘limida o‘zingiz bering.');
      console.log('[VulnShop] ─────────────────────────────────────────────────────────');
    }
  });
}

main().catch((err) => {
  console.error('[VulnShop] Ishga tushirishda xato:', err);
  process.exit(1);
});
