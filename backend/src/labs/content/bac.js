'use strict';
module.exports = {
  introduction: 'Broken Access Control — foydalanuvchi o‘z huquqidan tashqaridagi funksiya yoki ma’lumotlarga kira olishi. OWASP Top 10 (2021) ro‘yxatida 1-o‘rinda turadi. VulnShop’da zaif rejimda admin API faqat “foydalanuvchi tizimga kirganmi?” deb tekshiradi, “u adminmi?” deb tekshirmaydi.',
  theory: [
    'Authentication — “sen kimsan?”; Authorization — “senga nima ruxsat?”. Ko‘p zaifliklar ikkinchi savol unutilganda paydo bo‘ladi.',
    'Vertikal eskalatsiya: oddiy foydalanuvchi admin funksiyalarini bajaradi. Gorizontal eskalatsiya: boshqa foydalanuvchining ma’lumotlariga kiradi (IDOR moduliga qarang).',
    'Frontend’da menyuni yashirish xavfsizlik nazorati emas — API har doim to‘g‘ridan-to‘g‘ri chaqirilishi mumkin.',
    'Tamoyillar: deny by default, har bir so‘rovda server tomonida tekshirish, markazlashgan avtorizatsiya middleware, least privilege, rad etishlarni loglash.',
  ],
  scenario: '2019-yilda First American Financial kompaniyasida yuzlab million moliyaviy hujjat avtorizatsiya tekshiruvisiz havola orqali ochiq bo‘lgan. Server “bu foydalanuvchi bu hujjatni ko‘rishga haqlimi?” degan savolni bermagan.',
  vulnerableCode: {
    file: 'backend/src/middleware/auth.js → adminGate(), backend/src/routes/index.js',
    language: 'javascript',
    code: `// VULNERABLE: faqat autentifikatsiya, rol tekshiruvi yo'q
adminRouter.use(authenticate, adminGate);

function adminGate(req, res, next) {
  // "Admin menyusi frontend'da yashirilgan, demak oddiy foydalanuvchi bilmaydi"
  return next();
}

// Frontend: Sidebar.jsx
{user.role === 'admin' && <NavLink to="/admin">Admin</NavLink>}`,
    explanation: [
      'Server rolni tekshirmaydi — har qanday tizimga kirgan foydalanuvchi /api/admin/* funksiyalaridan foydalana oladi.',
      'Faqat UI darajasida yashirish “security through obscurity” hisoblanadi.',
      'Oqibat: foydalanuvchilar ro‘yxati, rollarni o‘zgartirish, mahsulot va buyurtmalarni boshqarish oddiy mijozga ochiq.',
    ],
  },
  practical: {
    objective: 'Avtorizatsiya matritsasini tuzing va zaif rejimdagi bo‘shliqni aniqlang, so‘ng xavfsiz rejimda tuzatishni tasdiqlang.',
    tasks: [
      'backend/src/routes/index.js dagi barcha /api/admin/* endpointlarni ro‘yxatga oling.',
      'Ikki xil rol (customer va admin) uchun qaysi endpointlarga kirish kutilishini jadvalga yozing (kutilgan natija).',
      'Customer akkaunti bilan tizimga kirib, ilovaning admin bo‘limlari va DevTools → Network’dagi javob kodlarini kuzating (haqiqiy natija).',
      'Kutilgan va haqiqiy natijalar farqini zaiflik sifatida hujjatlashtiring.',
      'Secure rejimga o‘tib, jadvalni qayta to‘ldiring va “Tuzatishni tekshirish”ni bajaring.',
    ],
    hints: [
      'Frontend nimani ko‘rsatishi emas, server nimani qaytarishi muhim.',
      'Flag admin sozlamalari bilan bog‘liq.',
    ],
  },
  testing: {
    tools: ['Burp Suite (Autorize plagini)', 'Postman', 'Jest + Supertest'],
    steps: [
      'Har bir admin endpoint uchun customer, admin va tokensiz holatda javob kodlarini qayd eting.',
      '“npm test” orqali BAC testini ishga tushiring.',
    ],
    expected: 'Zaif rejimda customer admin endpointlaridan 200 javob oladi. Xavfsiz rejimda customer uchun barcha admin endpointlar 403, tokensiz so‘rovlar 401 qaytaradi.',
  },
  secureCode: {
    file: 'backend/src/middleware/auth.js (secure)',
    language: 'javascript',
    code: `function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new AppError(403, 'Faqat administratorlar uchun'));
    }
    next();
  };
}

// Deny by default: butun admin router bitta joyda himoyalanadi
adminRouter.use(authenticate, requireRole('admin'));`,
    explanation: [
      'Rol har doim serverda, DB’dagi foydalanuvchi yozuvidan olinadi (token ichidagi qiymatga ko‘r-ko‘rona ishonilmaydi).',
      'Router darajasidagi middleware yangi endpoint qo‘shilganda ham himoya unutilmasligini ta’minlaydi.',
      'Rad etilgan urinishlarni loglash hujumlarni erta aniqlashga yordam beradi.',
    ],
    checklist: ['Server-side rol tekshiruvi', 'Deny by default', 'Avtorizatsiya testlari CI’da', 'UI yashirishga tayanmaslik'],
  },
  quiz: [
    { q: 'Authentication va Authorization farqi?', options: ['Bir xil narsa', 'Kimlikni tasdiqlash va ruxsatni tekshirish', 'Shifrlash va xeshlash', 'Frontend va backend'], answer: 1, explanation: 'Authentication — kimlik, Authorization — ruxsatlar.' },
    { q: 'Admin menyusini frontend’da yashirish yetarlimi?', options: ['Ha', 'Yo‘q, server har bir so‘rovni tekshirishi shart', 'Faqat HTTPS bo‘lsa', 'Faqat mobil ilovada'], answer: 1, explanation: 'API to‘g‘ridan-to‘g‘ri chaqirilishi mumkin.' },
    { q: 'Oddiy foydalanuvchining admin funksiyasini bajarishi qanday ataladi?', options: ['Gorizontal eskalatsiya', 'Vertikal eskalatsiya', 'Fishing', 'DoS'], answer: 1, explanation: 'Yuqori huquq darajasiga o‘tish — vertikal eskalatsiya.' },
    { q: '“Deny by default” nimani anglatadi?', options: ['Hammasi ochiq, keraklisi yopiladi', 'Hammasi yopiq, keraklisiga ruxsat beriladi', 'IP bo‘yicha bloklash', 'Parolsiz kirish'], answer: 1, explanation: 'Aniq ruxsat berilmagan hamma narsa taqiqlangan.' },
  ],
  homework: [
    'Barcha /api/admin/* endpointlar uchun to‘liq avtorizatsiya matritsasini tuzing.',
    'requireRole() middleware uchun Jest test yozing (customer → 403, admin → 200, tokensiz → 401).',
    'Rad etilgan avtorizatsiya urinishlarini loglaydigan middleware loyihalang.',
  ],
};
