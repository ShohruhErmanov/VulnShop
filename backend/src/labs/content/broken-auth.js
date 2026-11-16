'use strict';
module.exports = {
  introduction: 'Broken Authentication (OWASP: Identification and Authentication Failures) — autentifikatsiya mexanizmidagi xatolar tufayli tajovuzkor boshqa foydalanuvchi sifatida tizimga kirishi mumkin bo‘lgan holatlar. VulnShop’da zaif rejimda JWT tokenlari bilan bog‘liq bir nechta xato va login jarayonidagi zaifliklar mavjud.',
  theory: [
    'JWT uch qismdan iborat: header (algoritm), payload (da’volar) va imzo. Token ishonchliligi faqat imzo to‘g‘ri tekshirilganda kafolatlanadi.',
    'Keng tarqalgan JWT xatolari: tokenning o‘zi tanlagan algoritmga ishonish (shu jumladan imzosiz “none” algoritmi), taxmin qilinadigan qisqa sirli kalit, juda uzoq amal qilish muddati, issuer/audience tekshirilmasligi.',
    'Login xatolari: “foydalanuvchi topilmadi” va “parol noto‘g‘ri” uchun turli xabarlar (user enumeration), urinishlar sonini cheklamaslik (brute force), javob vaqtidagi farqlar.',
    'Himoya: kuchli tasodifiy sir (≥256 bit), algoritmlar allow-list’i, qisqa muddat, iss/aud tekshiruvi, umumiy xato xabari, rate limiting va MFA.',
  ],
  scenario: 'Bir nechta mashhur JWT kutubxonalarida (2015-yil, CVE-2015-9235 va boshqalar) token header’idagi algoritmga ishonish tufayli imzo tekshiruvini chetlab o‘tish mumkin bo‘lgan. Shuningdek, ko‘plab ilovalarda kodga yozib qo‘yilgan qisqa sirli kalitlar ochiq repozitoriylarda topilgan.',
  vulnerableCode: {
    file: 'backend/src/services/tokenService.js, backend/src/services/authService.js',
    language: 'javascript',
    code: `// VULNERABLE: kodga yozilgan zaif sir, 30 kunlik muddat
jwt.sign({ sub, email, role }, 'secret123', { expiresIn: '30d' });

// VULNERABLE: algoritm token header'idan olinadi
const decoded = jwt.decode(token, { complete: true });
if (decoded.header.alg === 'none') return decoded.payload; // imzosiz qabul!
return jwt.verify(token, 'secret123');

// VULNERABLE: user enumeration
if (!user) throw new AppError(404, 'Foydalanuvchi topilmadi: ' + email);
if (!ok)   throw new AppError(401, 'Parol noto\\'g\\'ri');
// + login endpointida rate limit yo'q`,
    explanation: [
      'Sir qisqa va lug‘atda bor — offline taxmin qilish mumkin, kodda ochiq turibdi.',
      'Server tokenning o‘zi e’lon qilgan algoritmga ishonadi — bu imzo tekshiruvini chetlab o‘tish imkonini beradi.',
      'Turli xato xabarlari qaysi emaillar ro‘yxatdan o‘tganini oshkor qiladi.',
      'Urinishlar cheklanmagani parollarni ko‘p marta sinab ko‘rishga yo‘l ochadi.',
    ],
  },
  practical: {
    objective: 'Token tuzilmasini tahlil qiling, autentifikatsiya xatolarini kod va javoblar darajasida aniqlang, xavfsiz rejimni tasdiqlang.',
    tasks: [
      'Tizimga kiring va o‘z tokeningizni jwt.io kabi dekoderda (yoki base64 dekod orqali) oching: header va payloadda qanday maydonlar bor, muddati qancha?',
      'Ikkala rejimda olingan tokenlarni solishtiring: algoritm, muddat, iss/aud maydonlari.',
      'Mavjud bo‘lmagan email va noto‘g‘ri parol bilan kirishdagi xato xabarlarini ikkala rejimda solishtiring.',
      'tokenService.verify() ning ikkala tarmog‘ini o‘qing va zaif tarmoqdagi mantiqiy xatoni o‘z so‘zlaringiz bilan tushuntiring.',
      'Secure rejimga o‘ting (yangi token avtomatik beriladi) va “Tuzatishni tekshirish”ni bajaring.',
    ],
    hints: [
      'Imzo — tokenning yagona himoyasi. Server imzoni qachon tekshirmayapti?',
      'Flag hech qachon parol bilan tizimga kira olmaydigan akkauntning shaxsiy eslatmasida.',
    ],
  },
  testing: {
    tools: ['jwt.io dekoderi', 'Burp Suite (JWT Editor plagini)', 'Jest + Supertest'],
    steps: [
      'Secure rejimda login rate limit ishlashini tekshiring: bir necha noto‘g‘ri urinishdan keyin 429 javobi kelishi kerak.',
      '“npm test” orqali Broken Auth testlarini ishga tushiring.',
    ],
    expected: 'Zaif rejimda tokenlar uzoq muddatli, zaif sir bilan imzolangan va imzosiz tokenlar ham qabul qilinadi; xato xabarlari foydalanuvchi mavjudligini oshkor qiladi. Xavfsiz rejimda faqat HS256 + kuchli sir + iss/aud bilan imzolangan, 1 soatlik tokenlar qabul qilinadi, xato xabari umumiy va urinishlar cheklangan.',
  },
  secureCode: {
    file: 'backend/src/services/tokenService.js (secure)',
    language: 'javascript',
    code: `// SECURE: kuchli sir muhit o'zgaruvchisidan, qisqa muddat, iss/aud
jwt.sign({ sub: String(user.id), role: user.role }, process.env.JWT_SECRET, {
  algorithm: 'HS256', expiresIn: '1h', issuer: 'vulnshop', audience: 'vulnshop-web',
});

// SECURE: algoritmlar allow-list'i
jwt.verify(token, process.env.JWT_SECRET, {
  algorithms: ['HS256'], issuer: 'vulnshop', audience: 'vulnshop-web',
});

// SECURE: umumiy xabar + rate limit
throw new AppError(401, "Email yoki parol noto'g'ri");
router.post('/auth/login', loginLimiter, ...);`,
    explanation: [
      'Algoritm server tomonidan belgilanadi — token header’i hech narsani hal qilmaydi.',
      'Sir kamida 256 bit, tasodifiy, kodda emas, muhit o‘zgaruvchisida saqlanadi.',
      'Qisqa muddat o‘g‘irlangan token zararini cheklaydi.',
      'Umumiy xabar va o‘xshash javob vaqti user enumeration’ni qiyinlashtiradi.',
    ],
    checklist: ['algorithms allow-list', 'Kuchli sir (env)', 'Qisqa muddat + iss/aud', 'Umumiy xato xabari', 'Login rate limit', 'MFA (tavsiya)'],
  },
  quiz: [
    { q: 'JWT ishonchliligini nima kafolatlaydi?', options: ['Base64 kodlash', 'To‘g‘ri tekshirilgan imzo', 'Payloaddagi rol', 'Uzun muddat'], answer: 1, explanation: 'Base64 shifrlash emas; faqat imzo tokenning o‘zgartirilmaganini isbotlaydi.' },
    { q: 'jwt.verify() da algorithms parametri nima uchun kerak?', options: ['Tezlik uchun', 'Token tanlagan algoritmga ishonmaslik uchun', 'Payloadni shifrlash uchun', 'Kerak emas'], answer: 1, explanation: 'Allow-list algoritmni almashtirish hujumlarini oldini oladi.' },
    { q: '“Foydalanuvchi topilmadi” xabari qanday xavf tug‘diradi?', options: ['Hech qanday', 'User enumeration', 'SQL Injection', 'XSS'], answer: 1, explanation: 'Tajovuzkor qaysi emaillar ro‘yxatdan o‘tganini aniqlay oladi.' },
    { q: 'Brute force’ga qarshi qaysi chora samarali?', options: ['Rate limiting va MFA', 'Uzun URL', 'CORS', 'Gzip'], answer: 0, explanation: 'Urinishlarni cheklash va ikkinchi omil parol taxminini samarasiz qiladi.' },
    { q: 'JWT sirli kaliti qayerda saqlanishi kerak?', options: ['Frontend kodida', 'Git repozitoriyda', 'Muhit o‘zgaruvchisi / secret manager’da', 'Cookie’da'], answer: 2, explanation: 'Sirlar kodda emas, maxfiy konfiguratsiyada saqlanadi.' },
  ],
  homework: [
    'Token bekor qilish (revocation) mexanizmini loyihalang: logout bo‘lganda token qanday yaroqsiz qilinadi?',
    'Refresh token + qisqa access token sxemasini chizing va afzalliklarini yozing.',
    'Login uchun hisobni vaqtincha bloklash siyosatini loyihalang va uning DoS xavfini tahlil qiling.',
  ],
};
