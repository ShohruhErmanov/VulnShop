'use strict';
module.exports = {
  introduction: 'Cross-Site Request Forgery (CSRF) — brauzer cookie’larni avtomatik yuborishidan foydalanib, foydalanuvchi bilmagan holda uning nomidan holatni o‘zgartiruvchi so‘rov yuborilishi. VulnShop’da zaif rejimda email o‘zgartirish endpointi faqat sessiya cookie’siga tayanadi va anti-CSRF tokenini talab qilmaydi.',
  theory: [
    'Brauzer saytga tegishli cookie’larni so‘rov qaysi sahifadan boshlanganidan qat’i nazar yuboradi (SameSite cheklovlaridan tashqari).',
    'CSRF faqat cookie (yoki boshqa avtomatik yuboriladigan hisob ma’lumotlari) bilan autentifikatsiya qilinganda ishlaydi. Authorization: Bearer sarlavhasi brauzer tomonidan avtomatik qo‘shilmaydi.',
    '“Same-site” va “same-origin” farqi: localhost:5173 va localhost:8080 turli origin, lekin bir xil site — shuning uchun SameSite yolg‘iz o‘zi har doim yetarli emas.',
    'Himoya: sinxronlashtirilgan yoki double-submit anti-CSRF token, SameSite=Strict/Lax cookie, Origin/Referer tekshiruvi, muhim amallar uchun qayta autentifikatsiya.',
  ],
  scenario: '2008-yilda bir nechta uy routerlari va bank saytlarida CSRF zaifliklari orqali DNS sozlamalari yoki hisob ma’lumotlarini foydalanuvchi bilmagan holda o‘zgartirish mumkin bo‘lgan. Email o‘zgartirish ayniqsa xavfli — keyin “parolni tiklash” orqali hisob to‘liq egallanadi.',
  vulnerableCode: {
    file: 'backend/src/middleware/csrf.js, backend/src/middleware/auth.js',
    language: 'javascript',
    code: `// Auth: Bearer bo'lmasa, cookie'dan token olinadi
if (req.cookies.vs_token) return { token: req.cookies.vs_token, source: 'cookie' };

// VULNERABLE: holatni o'zgartiruvchi so'rovlar uchun CSRF tekshiruvi yo'q
function csrfProtection(req, res, next) {
  return next();
}

router.post('/account/email', authenticate, csrfProtection, ..., changeEmail);
// + express.urlencoded() yoqilgan — oddiy HTML forma ham qabul qilinadi`,
    explanation: [
      'Sessiya cookie’si avtomatik yuboriladi — server so‘rov foydalanuvchining o‘z ilovasidan kelganini bilmaydi.',
      'Hech qanday maxfiy, oldindan aytib bo‘lmaydigan token talab qilinmaydi.',
      'Oddiy forma formatini qabul qilish CORS preflight’siz so‘rov yuborishga imkon beradi.',
    ],
  },
  practical: {
    objective: 'CSRF uchun zarur shartlarni kod va cookie sozlamalari darajasida tahlil qiling va xavfsiz rejimdagi himoyani tasdiqlang.',
    tasks: [
      'auth.js dagi extractToken() ni o‘qing: server autentifikatsiyani qaysi manbalardan qabul qiladi?',
      'DevTools → Application → Cookies’da vs_token cookie’sining HttpOnly va SameSite qiymatlarini ikkala rejimda yozib oling.',
      'Profil sahifasida email o‘zgartirilganda Network’dagi so‘rov sarlavhalarini tekshiring: X-CSRF-Token sarlavhasi bormi?',
      'CSRF hujumi uchun zarur bo‘lgan uchta shartni sanab, VulnShop’ning zaif rejimi har biriga qanday mos kelishini tushuntiring.',
      'Secure rejimga o‘ting va “Tuzatishni tekshirish”ni bajaring.',
    ],
    hints: [
      'Uchta shart: muhim amal, faqat cookie’ga asoslangan sessiya, oldindan aytib bo‘ladigan so‘rov parametrlari.',
      'Flag muvaffaqiyatli cross-site so‘rovdan keyin profildagi xavfsizlik bildirishnomasida paydo bo‘ladi.',
    ],
  },
  testing: {
    tools: ['Brauzer DevTools', 'Burp Suite (CSRF PoC generatorini faqat o‘z lokal labingizda tushunish uchun)', 'Jest + Supertest'],
    steps: [
      'Secure rejimda cookie bilan, lekin CSRF tokensiz POST /api/account/email so‘rovi 403 qaytarishini testda tasdiqlang.',
      '“npm test” orqali CSRF testlarini ishga tushiring.',
    ],
    expected: 'Zaif rejimda cookie bilan kelgan tokensiz so‘rov emailni o‘zgartiradi. Xavfsiz rejimda cookie orqali autentifikatsiya qilingan holatni o‘zgartiruvchi so‘rovlar mos X-CSRF-Token sarlavhasisiz 403 bilan rad etiladi, cookie esa SameSite=Strict.',
  },
  secureCode: {
    file: 'backend/src/middleware/csrf.js (secure)',
    language: 'javascript',
    code: `// GET /api/auth/csrf — token beriladi (cookie + javob tanasi)
const token = crypto.randomBytes(32).toString('hex');
res.cookie('vs_csrf', token, { httpOnly: true, sameSite: 'strict' });
res.json({ csrfToken: token });

// Holatni o'zgartiruvchi so'rovlar
function csrfProtection(req, res, next) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  if (req.auth.source === 'header') return next(); // Bearer — CSRF qilib bo'lmaydi
  if (!safeEqual(req.get('x-csrf-token'), req.cookies.vs_csrf)) {
    return next(new AppError(403, "CSRF token yo'q yoki noto'g'ri"));
  }
  next();
}

// Frontend (axios): har bir so'rovga sarlavha qo'shiladi
api.defaults.headers.common['X-CSRF-Token'] = csrfToken;`,
    explanation: [
      'Boshqa sayt maxsus sarlavha qo‘sha olmaydi va tokenni o‘qiy olmaydi (Same-Origin Policy).',
      'Taqqoslash vaqtga chidamli (timingSafeEqual).',
      'SameSite=Strict qo‘shimcha qatlam, Bearer tokenlar esa tabiatan CSRF’ga chidamli.',
    ],
    checklist: ['Anti-CSRF token', 'SameSite cookie', 'GET so‘rovlar holatni o‘zgartirmaydi', 'Muhim amallar uchun qayta autentifikatsiya', 'Origin tekshiruvi (qo‘shimcha)'],
  },
  quiz: [
    { q: 'CSRF nima uchun ishlaydi?', options: ['Brauzer cookie’larni avtomatik yuboradi', 'Server SQL’ni noto‘g‘ri quradi', 'Parol zaif', 'HTTPS yo‘q'], answer: 0, explanation: 'Avtomatik yuboriladigan hisob ma’lumotlari CSRF’ning asosi.' },
    { q: 'Authorization: Bearer sarlavhasi bilan ishlaydigan API CSRF’ga zaifmi?', options: ['Ha, har doim', 'Odatda yo‘q, chunki brauzer uni avtomatik qo‘shmaydi', 'Faqat GET’da', 'Faqat Firefox’da'], answer: 1, explanation: 'Sarlavha faqat JavaScript tomonidan qo‘shiladi, boshqa sayt esa uni qo‘sha olmaydi.' },
    { q: 'localhost:5173 va localhost:8080 bir xil “site”mi?', options: ['Ha, portlar site’ga ta’sir qilmaydi', 'Yo‘q', 'Faqat HTTPS’da', 'Faqat Chrome’da'], answer: 0, explanation: 'Site sxema va ro‘yxatdan o‘tgan domen bilan aniqlanadi; port faqat origin’ga ta’sir qiladi.' },
    { q: 'Qaysi biri CSRF’dan asosiy himoya?', options: ['Anti-CSRF token', 'Uzun parol', 'Gzip', 'CDN'], answer: 0, explanation: 'Boshqa sayt bilmaydigan maxfiy token so‘rovning haqiqiyligini isbotlaydi.' },
  ],
  homework: [
    'Synchronizer token va double-submit cookie usullarini solishtiring (afzallik va kamchiliklar).',
    'Ilovadagi barcha holatni o‘zgartiruvchi endpointlarni ro‘yxatlang va har biri CSRF’dan himoyalanganmi, tekshiring.',
    'Email o‘zgartirish uchun joriy parolni so‘rash (re-authentication) funksiyasini loyihalang.',
  ],
};
