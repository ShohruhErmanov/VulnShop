'use strict';
module.exports = {
  introduction: 'Security Misconfiguration — dasturiy ta’minot to‘g‘ri yozilgan bo‘lsa ham, noto‘g‘ri sozlamalar tufayli yuzaga keladigan zaifliklar: ochiq qolgan debug endpointlar, batafsil xato xabarlari, xavfsizlik sarlavhalarining yo‘qligi, haddan tashqari ochiq CORS. VulnShop’da zaif rejimda bularning barchasi mavjud.',
  theory: [
    'Debug/diagnostika endpointlari ishlab chiqishda qulay, ammo production’da konfiguratsiya va sirlarni oshkor qiladi.',
    'Batafsil xato xabarlari (stack trace, SQL, fayl yo‘llari) tajovuzkorga ilova tuzilmasi haqida ma’lumot beradi.',
    'Xavfsizlik sarlavhalari: Content-Security-Policy, Strict-Transport-Security, X-Content-Type-Options, X-Frame-Options/frame-ancestors, Referrer-Policy.',
    'CORS: har qanday Origin’ni aks ettirish va credentials’ga ruxsat berish boshqa saytlarga foydalanuvchi nomidan javoblarni o‘qish imkonini beradi.',
    'Texnologiya “barmoq izi” sarlavhalari (X-Powered-By) ma’lum zaifliklarni qidirishni osonlashtiradi.',
  ],
  scenario: '2019-yilda Capital One’dagi sizib chiqish noto‘g‘ri sozlangan WAF va ortiqcha huquqlar tufayli 100 milliondan ortiq mijoz ma’lumotlariga ta’sir qildi. Ko‘plab hodisalarda ochiq qolgan Elasticsearch/MongoDB serverlari yoki debug panellar ham sabab bo‘lgan.',
  vulnerableCode: {
    file: 'backend/src/middleware/security.js, errorHandler.js, controllers/systemController.js',
    language: 'javascript',
    code: `// VULNERABLE: unutilgan debug endpoint
router.get('/debug/config', (req, res) => res.json({ database: config.db, jwt: {...} }));

// VULNERABLE: batafsil xatolar
res.status(status).json({ error: err.message, sql: err.sql, stack: err.stack, cwd: process.cwd() });

// VULNERABLE: har qanday Origin + credentials
cors({ origin: true, credentials: true });

// VULNERABLE: helmet yo'q, texnologiya sarlavhalari
res.setHeader('X-Powered-By', 'Express 4.21.1');
res.setHeader('X-Debug-Mode', 'enabled');`,
    explanation: [
      'Debug endpoint autentifikatsiyasiz va DB parametrlari kabi maxfiy sozlamalarni qaytaradi.',
      'Xato javoblari ichki tuzilmani ochib beradi va boshqa zaifliklarni (SQLi) topishni osonlashtiradi.',
      'CORS siyosati ishonchli manbalarni cheklamaydi.',
      'Xavfsizlik sarlavhalari yo‘qligi XSS va clickjacking ta’sirini kuchaytiradi.',
    ],
  },
  practical: {
    objective: 'Ilovaning konfiguratsiya holatini audit qiling va xavfsiz rejimdagi o‘zgarishlarni hujjatlashtiring.',
    tasks: [
      'DevTools → Network’da istalgan API javobining sarlavhalarini ikkala rejimda solishtiring va jadvalga yozing.',
      'routes/index.js dagi barcha endpointlarni ko‘rib chiqing va production’da bo‘lmasligi kerak bo‘lganlarini aniqlang.',
      'Mavjud bo‘lmagan mahsulot yoki noto‘g‘ri JSON yuborib, xato javobining tarkibini ikkala rejimda solishtiring.',
      'securityheaders.com mezonlari asosida secure rejimdagi sarlavhalarni baholang.',
      '“Tuzatishni tekshirish”ni bajaring.',
    ],
    hints: [
      'Ishlab chiquvchilar qoldirib ketgan “vaqtinchalik” yo‘llar ko‘pincha /debug, /status, /config kabi nomlarga ega.',
      'Flag debug konfiguratsiyasi bilan bog‘liq.',
    ],
  },
  testing: {
    tools: ['Brauzer DevTools', 'curl -I', 'Mozilla Observatory (lokal muqobil: sarlavhalarni qo‘lda tekshirish)', 'Jest + Supertest'],
    steps: [
      'Secure rejimda Content-Security-Policy va X-Content-Type-Options sarlavhalari borligini tasdiqlang.',
      '“npm test” orqali Misconfiguration testlarini ishga tushiring.',
    ],
    expected: 'Zaif rejimda debug endpoint ochiq, xatolar stack trace bilan, CORS har qanday manbani aks ettiradi. Xavfsiz rejimda debug endpoint 404, xatolar umumiy va requestId bilan, helmet sarlavhalari mavjud, CORS faqat allow-list.',
  },
  secureCode: {
    file: 'backend/src/middleware/security.js + errorHandler.js (secure)',
    language: 'javascript',
    code: `app.disable('x-powered-by');
app.use(helmet({ contentSecurityPolicy: { useDefaults: true,
  directives: { 'default-src': ["'self'"], 'frame-ancestors': ["'none'"] } } }));

app.use(cors({
  origin: (origin, cb) => cb(null, !origin || ALLOWED_ORIGINS.includes(origin)),
  credentials: true,
}));

// Umumiy xato + correlation id; tafsilot faqat server logida
const requestId = crypto.randomUUID();
console.error(\`[\${requestId}]\`, err);
res.status(500).json({ error: 'Ichki server xatosi', requestId });

// Debug yo'llari production build'ga umuman kirmaydi
if (process.env.NODE_ENV !== 'production') app.use('/debug', debugRouter);`,
    explanation: [
      'Xavfsizlik sozlamalari standart holatda yoqilgan bo‘ladi (secure by default).',
      'Xato tafsilotlari faqat server logida, foydalanuvchiga esa korrelyatsiya ID’si beriladi.',
      'Konfiguratsiya muhitga qarab avtomatik farqlanadi — VulnShop’ning o‘zi ham production rejimida barcha laboratoriyalarni o‘chiradi.',
    ],
    checklist: ['Debug endpointlar production’da yo‘q', 'Umumiy xato xabarlari', 'helmet / xavfsizlik sarlavhalari', 'CORS allow-list', 'X-Powered-By o‘chirilgan', 'Konfiguratsiya auditi avtomatlashtirilgan'],
  },
  quiz: [
    { q: 'Production’da stack trace ko‘rsatish nima uchun xavfli?', options: ['Sekinlashtiradi', 'Ichki tuzilmani oshkor qiladi', 'Hech qanday xavf yo‘q', 'Faqat dizaynni buzadi'], answer: 1, explanation: 'Fayl yo‘llari, kutubxonalar va SQL tajovuzkorga xarita beradi.' },
    { q: 'CORS’da origin: true va credentials: true birga qanday xavf tug‘diradi?', options: ['Hech qanday', 'Har qanday sayt foydalanuvchi nomidan javoblarni o‘qiy oladi', 'Faqat sekinlik', 'SQLi'], answer: 1, explanation: 'Har qanday Origin aks ettirilib, cookie bilan so‘rov javoblari o‘qiladi.' },
    { q: 'Qaysi sarlavha clickjacking’dan himoya qiladi?', options: ['frame-ancestors / X-Frame-Options', 'Content-Length', 'Accept-Language', 'ETag'], answer: 0, explanation: 'Sahifani begona saytlarda iframe ichida ochishni taqiqlaydi.' },
    { q: 'Express’da qaysi middleware xavfsizlik sarlavhalarini qo‘shadi?', options: ['morgan', 'helmet', 'body-parser', 'multer'], answer: 1, explanation: 'helmet bir qator xavfsizlik sarlavhalarini o‘rnatadi.' },
  ],
  homework: [
    'Production uchun xavfsizlik konfiguratsiyasi checklist’ini tuzing (kamida 10 band).',
    'CI pipeline’ga xavfsizlik sarlavhalarini avtomatik tekshiradigan test qo‘shish rejasini yozing.',
    'docker-compose.yml faylini audit qiling: qaysi portlar qayerga ochiq va nima uchun?',
  ],
};
