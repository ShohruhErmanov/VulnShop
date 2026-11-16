'use strict';
module.exports = {
  introduction: 'SQL Injection (SQLi) — foydalanuvchi kiritgan ma’lumot SQL so‘rovining kod qismi sifatida talqin qilinishi natijasida yuzaga keladigan zaiflik. VulnShop katalogidagi qidiruv funksiyasi zaif rejimda so‘rovni satrlarni birlashtirish orqali quradi. Ushbu modulda siz bu xatoni kod darajasida tanib olishni, uning oqibatlarini tushunishni va parametrlangan so‘rovlar bilan tuzatishni o‘rganasiz.',
  theory: [
    'Ildiz sabab: ma’lumot (data) va kod (SQL grammatikasi) bitta satrga aralashtiriladi. Kiritmadagi maxsus belgilar so‘rov tuzilmasini o‘zgartirishi mumkin bo‘lib qoladi.',
    'Asosiy turlari: In-band (xato xabarlari yoki natijalar to‘g‘ridan-to‘g‘ri ko‘rinadi), Blind (natija faqat javob farqi yoki vaqt orqali seziladi), Out-of-band (ma’lumot boshqa kanal orqali chiqadi).',
    'Oqibatlar: ruxsatsiz ma’lumotlarni o‘qish (masalan, chop etilmagan mahsulotlar yoki foydalanuvchilar jadvali), ma’lumotlarni o‘zgartirish, autentifikatsiyani chetlab o‘tish.',
    'ORM ishlatish o‘z-o‘zidan himoya emas: xom SQL (sequelize.query) ichiga satr qo‘shilsa, zaiflik saqlanib qoladi.',
    'Asosiy himoya — parametrlangan so‘rovlar (prepared statements / bind). Qo‘shimcha qatlamlar: identifikatorlar uchun allow-list, DB foydalanuvchisiga minimal huquq, SQL xatolarini foydalanuvchiga ko‘rsatmaslik.',
  ],
  scenario: '2023-yilda MOVEit Transfer platformasidagi SQL Injection zaifligi (CVE-2023-34362) minglab tashkilotlarning ma’lumotlari sizib chiqishiga olib keldi. Ildiz sabab — veb-ilova kiritmasi so‘rovga xavfsiz tarzda uzatilmagan edi. Bu holat bitta “oddiy” qidiruv yoki filtr maydoni ham butun ma’lumotlar bazasi uchun eshik bo‘lishi mumkinligini ko‘rsatadi.',
  vulnerableCode: {
    file: 'backend/src/services/productService.js → search()',
    language: 'javascript',
    code: `// VULNERABLE — kiritma SQL matniga qo'shilmoqda
let sql = \`SELECT id, name, slug, description, price, imageUrl, category, stock, rating
           FROM products
           WHERE isPublished = 1 AND name LIKE '%\${search}%'\`;
if (category) sql += \` AND category = '\${category}'\`;
sql += \` ORDER BY \${SORT_SQL[order]}\`;
const [rows] = await sequelize.query(sql);`,
    explanation: [
      'search va category qiymatlari hech qanday ajratishsiz SQL satriga joylashtiriladi.',
      'sequelize.query() xom SQL bajaradi — ORM’ning avtomatik parametrlash himoyasi bu yerda ishlamaydi.',
      'isPublished = 1 sharti biznes-qoida (yashirin mahsulotlarni ko‘rsatmaslik) vazifasini bajaradi; so‘rov tuzilmasi o‘zgarsa, bu qoida ham buzilishi mumkin.',
      'Saralash qismi allow-list (SORT_SQL) orqali tanlangani uchun xavfsiz — bu farqga e’tibor bering.',
    ],
  },
  practical: {
    objective: 'Zaif va xavfsiz rejimlardagi xatti-harakat farqini kuzating, zaif kod qatorini aniqlang va tuzatishni tekshiring.',
    tasks: [
      'Zaif kodni o‘qing va kiritma qaysi qatorda SQL grammatikasiga aralashishini belgilang.',
      'DevTools → Network bo‘limida katalog qidiruvi qaysi endpointga qanday parametrlar bilan murojaat qilishini yozib oling.',
      'Oddiy qidiruv so‘zlari va maxsus belgilar (masalan, tirnoq yoki foiz belgisi) bilan javoblarni ikkala rejimda solishtiring: xato xabari, natijalar soni, javob vaqti.',
      'Ma’lumotlar bazasida chop etilmagan (isPublished = 0) yozuvlar borligini seed faylidan aniqlang va zaif rejimda ular nima uchun xavf ostida ekanini tushuntiring.',
      'Lab sahifasida rejimni “Secure” ga o‘tkazing va “Tuzatishni tekshirish” tugmasi orqali himoyani tasdiqlang.',
    ],
    hints: [
      'Savol bering: “Kiritma qiymatmi yoki kodmi?” — qayerda bu chegara yo‘qolyapti?',
      'Misconfiguration lab zaif rejimda bo‘lsa, batafsil xato xabarlari tahlilni osonlashtiradi — bu ikki zaiflik qanday bir-birini kuchaytirishini o‘ylang.',
      'Flag yashirin mahsulot bilan bog‘liq.',
    ],
  },
  testing: {
    tools: ['Brauzer DevTools', 'Burp Suite Community (faqat localhost)', 'Jest + Supertest'],
    steps: [
      'Ikkala rejimda bir xil qidiruv so‘rovlarini yuborib, javoblarni jadvalga yozing.',
      'backend/tests/labs.test.js dagi SQLi testini o‘qing va uni “npm test” bilan ishga tushiring.',
      'Secure rejimda “Tuzatishni tekshirish” natijasini qayd eting.',
    ],
    expected: 'Zaif rejimda maxsus belgilar so‘rov tuzilmasiga ta’sir qiladi (xato yoki kutilmagan natijalar). Xavfsiz rejimda har qanday kiritma faqat qidiruv matni sifatida ishlanadi, yashirin mahsulotlar hech qachon qaytmaydi.',
  },
  secureCode: {
    file: 'backend/src/services/productService.js → search() (secure branch)',
    language: 'javascript',
    code: `// SECURE — ORM query builder => parametrlangan so'rov
const escaped = String(search).replace(/[\\\\%_]/g, (c) => '\\\\' + c);
const where = { isPublished: true, name: { [Op.like]: '%' + escaped + '%' } };
if (category) where.category = category;
return Product.findAll({ where, attributes: COLUMNS, order: SORTS[order], raw: true });

// Xom SQL zarur bo'lsa — replacements bilan:
await sequelize.query(
  'SELECT id, name FROM products WHERE isPublished = 1 AND name LIKE :q',
  { replacements: { q: '%' + escaped + '%' }, type: QueryTypes.SELECT }
);`,
    explanation: [
      'Qiymatlar SQL matnidan alohida uzatiladi — drayver ularni hech qachon kod sifatida bajarmaydi.',
      'LIKE uchun % va _ belgilari ekranlanadi, shunda foydalanuvchi qidiruv mantig‘ini kengaytira olmaydi.',
      'Identifikatorlar (ustun nomlari, saralash yo‘nalishi) parametrlanmaydi, shuning uchun allow-list ishlatiladi.',
    ],
    checklist: ['Hamma joyda parametrlangan so‘rov', 'Identifikatorlar uchun allow-list', 'DB foydalanuvchisiga minimal huquq', 'SQL xatolari foydalanuvchiga ko‘rsatilmaydi', 'Regressiya testi mavjud'],
  },
  quiz: [
    { q: 'SQL Injection’ning ildiz sababi nima?', options: ['Ma’lumotlar bazasining eskirgan versiyasi', 'Kiritmaning SQL kodi bilan aralashib ketishi', 'HTTPS ishlatilmasligi', 'Parolning qisqaligi'], answer: 1, explanation: 'Ma’lumot va kod ajratilmaganda kiritma SQL grammatikasining bir qismiga aylanadi.' },
    { q: 'Qaysi usul SQLi’dan eng ishonchli himoya qiladi?', options: ['Tirnoqlarni olib tashlash', 'Parametrlangan so‘rovlar', 'Kiritmani base64 qilish', 'Faqat frontend’da tekshirish'], answer: 1, explanation: 'Prepared statement qiymatni koddan tuzilmaviy ajratadi; qora ro‘yxat filtrlari esa chetlab o‘tilishi mumkin.' },
    { q: 'ORM ishlatilsa ham SQLi qachon paydo bo‘lishi mumkin?', options: ['Hech qachon', 'Xom SQL ichiga satr qo‘shilganda', 'Faqat MySQL’da', 'Faqat GET so‘rovlarda'], answer: 1, explanation: 'sequelize.query() kabi xom SQL funksiyalariga satr birlashtirilsa, ORM himoyasi yo‘qoladi.' },
    { q: 'ORDER BY ustuni foydalanuvchidan olinsa, to‘g‘ri yechim?', options: ['Bind parametr sifatida uzatish', 'Allow-list orqali tanlash', 'Tirnoqqa o‘rash', 'Hech narsa qilmaslik'], answer: 1, explanation: 'Identifikatorlarni bind qilib bo‘lmaydi — faqat oldindan ruxsat etilgan qiymatlardan tanlash kerak.' },
    { q: 'Batafsil SQL xato xabarlarini foydalanuvchiga ko‘rsatish nimaga olib keladi?', options: ['Tezlikni oshiradi', 'Tajovuzkorga so‘rov tuzilmasi haqida ma’lumot beradi', 'Hech narsaga', 'Xavfsizlikni oshiradi'], answer: 1, explanation: 'Xato xabarlari so‘rov tuzilmasi va DB turini oshkor qiladi — bu Security Misconfiguration bilan bog‘liq.' },
  ],
  homework: [
    'Loyihadagi barcha sequelize.query() chaqiruvlarini toping va har biri xavfsizmi yoki yo‘qligini asoslab jadval tuzing.',
    'search() funksiyasining xavfsiz versiyasini xom SQL + replacements bilan qayta yozing va Jest test qo‘shing.',
    'DB foydalanuvchisi uchun minimal huquqlar (faqat kerakli jadvallarga SELECT/INSERT/UPDATE) ro‘yxatini tuzing va nima uchun bu SQLi oqibatlarini kamaytirishini tushuntiring.',
  ],
};
