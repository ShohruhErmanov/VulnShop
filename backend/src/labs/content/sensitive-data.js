'use strict';
module.exports = {
  introduction: 'Sensitive Data Exposure (OWASP 2021: Cryptographic Failures) — maxfiy ma’lumotlarning (parol xeshlari, karta raqamlari, API kalitlari) keraksiz joyda ko‘rsatilishi yoki zaif himoyalanishi. VulnShop’da zaif rejimda ochiq profil API’si foydalanuvchi yozuvini to‘liq qaytaradi va bitta eski akkaunt tuzsiz MD5 xesh bilan saqlangan.',
  theory: [
    'API haddan tashqari ko‘p ma’lumot qaytarishi (excessive data exposure) — frontend kerakli maydonlarni “filtrlaydi” deb o‘ylash xatosi.',
    'DTO (Data Transfer Object) / allow-list serializer — har bir endpoint uchun faqat kerakli maydonlar aniq ro‘yxatlanadi.',
    'Ma’lumotlarni maskalash: karta raqamining faqat oxirgi 4 raqami, API kalitining prefiksi.',
    'Kriptografik xatolar: parollarni tez xeshlar (MD5, SHA1) bilan tuzsiz saqlash, ma’lumotlarni shifrlamasdan uzatish yoki saqlash.',
    'Ma’lumotlarni minimallashtirish: keraksiz ma’lumot umuman saqlanmasa, u sizib chiqmaydi.',
  ],
  scenario: '2018-yilda bir nechta ijtimoiy tarmoq va fitnes ilovalari API’lari frontend’da ko‘rsatilmaydigan maydonlarni (email, telefon, aniq joylashuv) ham qaytargani aniqlangan. OWASP API Security Top 10’da bu holat “Excessive Data Exposure” sifatida alohida ajratilgan.',
  vulnerableCode: {
    file: 'backend/src/services/userSerializer.js → publicProfile(), selfProfile()',
    language: 'javascript',
    code: `// VULNERABLE: DB yozuvi to'liq qaytariladi
function publicProfile(user) {
  return user.get({ plain: true });
  // => passwordHash, email, phone, address, cardNumber, apiKey ...
}

// VULNERABLE: o'z profilida ham to'liq karta raqami va xesh
return { ...base, cardNumber: user.cardNumber, apiKey: user.apiKey, passwordHash: user.passwordHash };

// Legacy akkaunt: tuzsiz MD5 (seed.js)
passwordHash = crypto.createHash('md5').update(password).digest('hex');`,
    explanation: [
      'Ochiq endpoint autentifikatsiyasiz har qanday foydalanuvchi profilini qaytaradi.',
      'Frontend faqat ism va bio’ni ko‘rsatadi, lekin API javobida barcha maydonlar bor.',
      'Tuzsiz MD5 xesh juda tez hisoblanadi va tayyor jadvallar orqali tiklanishi mumkin.',
    ],
  },
  practical: {
    objective: 'API javoblari va UI’da ko‘rinadigan ma’lumotlar o‘rtasidagi farqni aniqlang, ma’lumotlar tasnifini tuzing va himoyani tasdiqlang.',
    tasks: [
      'Mahsulot sahifasidagi sharh muallifi profiliga o‘ting va UI’da nimalar ko‘rinishini yozing.',
      'DevTools → Network’da o‘sha sahifa uchun API javobini oching va UI’da ko‘rinmaydigan maydonlarni ro‘yxatlang.',
      'Har bir maydonni tasniflang: ochiq / ichki / maxfiy / juda maxfiy.',
      'Seed faylidagi xesh formatlarini solishtiring: bcrypt va MD5 farqini tushuntiring.',
      'Secure rejimga o‘ting, javobni qayta tekshiring va “Tuzatishni tekshirish”ni bajaring.',
    ],
    hints: [
      'UI ko‘rsatmagan narsa — yashirilgan narsa emas.',
      'Flag administrator akkauntining maxfiy maydonlaridan birida.',
    ],
  },
  testing: {
    tools: ['Brauzer DevTools', 'Postman', 'Jest + Supertest'],
    steps: [
      'Ikkala rejimda GET /api/users/:id javobidagi maydonlar ro‘yxatini solishtiring.',
      '“npm test” orqali Sensitive Data testlarini ishga tushiring.',
    ],
    expected: 'Zaif rejimda ochiq profil passwordHash, email, telefon, karta raqami va API kalitini qaytaradi. Xavfsiz rejimda faqat id, name, bio, role va memberSince qaytadi; o‘z profilida karta raqami maskalangan.',
  },
  secureCode: {
    file: 'backend/src/services/userSerializer.js (secure)',
    language: 'javascript',
    code: `// SECURE: allow-list DTO
function publicProfile(user) {
  return {
    id: user.id,
    name: user.name,
    bio: user.bio || null,
    role: user.role === 'admin' ? 'admin' : 'customer',
    memberSince: user.createdAt,
  };
}

// SECURE: maskalash
const maskCard = (card) => '•••• •••• •••• ' + String(card).replace(/\\D/g, '').slice(-4);

// SECURE: parollar faqat bcrypt/Argon2 bilan
const hash = await bcrypt.hash(password, 12);`,
    explanation: [
      'Yangi DB ustuni qo‘shilsa ham, u avtomatik ravishda API’ga chiqmaydi — allow-list xavfsizroq.',
      'Maskalash foydalanuvchiga kerakli ma’lumotni beradi, lekin to‘liq qiymatni oshkor qilmaydi.',
      'Real tizimlarda karta raqamlari umuman saqlanmaydi — to‘lov provayderi tokenlari ishlatiladi (PCI DSS).',
    ],
    checklist: ['Har bir endpoint uchun DTO', 'Maxfiy maydonlar maskalangan', 'Parollar sekin xesh bilan', 'Ma’lumotlarni minimallashtirish', 'Javob tarkibi testlarda tekshiriladi'],
  },
  quiz: [
    { q: 'Frontend maydonni ko‘rsatmasa, u xavfsizmi?', options: ['Ha', 'Yo‘q, API javobida baribir ko‘rinadi', 'Faqat HTTPS bo‘lsa', 'Faqat mobil’da'], answer: 1, explanation: 'API javobi DevTools yoki proxy orqali to‘liq ko‘rinadi.' },
    { q: 'API javobini cheklashning eng ishonchli usuli?', options: ['Blacklist (keraksiz maydonlarni o‘chirish)', 'Allow-list DTO', 'Base64 kodlash', 'Gzip'], answer: 1, explanation: 'Allow-list’da yangi maydon avtomatik chiqmaydi.' },
    { q: 'Nima uchun tuzsiz MD5 parol saqlash uchun yaroqsiz?', options: ['Juda sekin', 'Juda tez va tayyor jadvallar mavjud', 'Juda uzun', 'Faqat Windows’da ishlaydi'], answer: 1, explanation: 'Tez xesh offline taxminni arzonlashtiradi, tuz yo‘qligi esa tayyor jadvallarga yo‘l ochadi.' },
    { q: 'Karta raqamlari bilan ishlashda eng yaxshi amaliyot?', options: ['Ochiq matnda saqlash', 'To‘lov provayderi tokenlarini ishlatish', 'MD5 bilan xeshlash', 'Cookie’da saqlash'], answer: 1, explanation: 'Tokenizatsiya PCI DSS talablarini kamaytiradi va riskni pasaytiradi.' },
  ],
  homework: [
    'Loyihadagi barcha API javoblari uchun ma’lumotlar tasnifi jadvalini tuzing.',
    'adminRow() serializer’ini ham audit qiling: administrator uchun qaysi maydonlar haqiqatan kerak?',
    'Legacy MD5 xeshlarni xavfsiz ko‘chirish rejasini yozing.',
  ],
};
