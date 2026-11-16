'use strict';
module.exports = {
  introduction: 'Weak Password Policy — ilova foydalanuvchilarga qisqa, oddiy yoki keng tarqalgan parollarni o‘rnatishga ruxsat beradi. VulnShop’da zaif rejimda ro‘yxatdan o‘tishda bitta belgili parol ham qabul qilinadi va eski akkauntlardagi zaif parollar tekshirilmaydi.',
  theory: [
    'Parol kuchi uning uzunligi va oldindan aytib bo‘lmasligiga bog‘liq. Keng tarqalgan parollar ro‘yxatlari (sizib chiqqan bazalardan) birinchi navbatda sinab ko‘riladi.',
    'NIST SP 800-63B tavsiyalari: kamida 8 (yaxshisi 12+) belgi, sizib chiqqan/keng tarqalgan parollar ro‘yxatiga qarshi tekshirish, majburiy davriy almashtirishdan voz kechish, parol menejerlari va uzun iboralarni qo‘llab-quvvatlash.',
    'Zaif parol siyosati Broken Authentication bilan birga (rate limit yo‘q) ayniqsa xavfli.',
    'Parollarni saqlash: faqat sekin, tuzli xesh algoritmlari (bcrypt, scrypt, Argon2). MD5/SHA1 kabi tez xeshlar yaroqsiz.',
  ],
  scenario: 'Har yili e’lon qilinadigan eng ko‘p ishlatiladigan parollar ro‘yxatida “123456” va “password” yetakchilik qilmoqda. 2012-yildagi LinkedIn sizib chiqishida tuzsiz SHA1 xeshlar tufayli millionlab parollar tez tiklangan.',
  vulnerableCode: {
    file: 'backend/src/services/authService.js → validateNewPassword()',
    language: 'javascript',
    code: `// VULNERABLE: faqat bo'sh emasligi tekshiriladi
function validateNewPassword(password) {
  if (!password || String(password).length < 1) {
    throw new AppError(400, 'Parol kiritilmagan');
  }
}

// Login'da mavjud zaif parollar qayta tekshirilmaydi`,
    explanation: [
      'Uzunlik, murakkablik va keng tarqalgan parollar ro‘yxati tekshirilmaydi.',
      'Siyosat o‘zgarganda eski zaif parollar ham amal qilishda davom etadi.',
      'Seed ma’lumotlarida zaif parolli test akkauntlari mavjud — real tizimlarda ham shunday “unutilgan” akkauntlar uchraydi.',
    ],
  },
  practical: {
    objective: 'Parol siyosatini ikkala rejimda sinab, zaif akkauntlar xavfini baholang va himoyani tasdiqlang.',
    tasks: [
      'Ro‘yxatdan o‘tish sahifasida turli uzunlik va murakkablikdagi parollarni ikkala rejimda sinab ko‘ring va qaysilari qabul qilinishini jadvalga yozing.',
      'utils/passwords.js dagi checkPasswordPolicy() qoidalarini o‘qing va NIST tavsiyalari bilan solishtiring.',
      'Seed faylidagi test akkauntlarini ko‘rib chiqing: qaysi biri siyosatga mos kelmaydi va nima uchun?',
      'Secure rejimda siyosatga mos bo‘lmagan parol bilan kirishda nima sodir bo‘lishini kuzating.',
      '“Tuzatishni tekshirish”ni bajaring.',
    ],
    hints: [
      'Tashkilotlardagi “support” yoki “test” akkauntlari ko‘pincha eng zaif bo‘g‘in bo‘ladi.',
      'Flag zaif parolli akkauntning shaxsiy eslatmasida.',
    ],
  },
  testing: {
    tools: ['Brauzer', 'Jest + Supertest'],
    steps: [
      'Ikkala rejimda ro‘yxatdan o‘tish javoblarini (201 yoki 400 + xatolar ro‘yxati) solishtiring.',
      '“npm test” orqali parol siyosati testlarini ishga tushiring.',
    ],
    expected: 'Zaif rejimda istalgan bo‘sh bo‘lmagan parol qabul qilinadi. Xavfsiz rejimda 12+ belgi, katta/kichik harf, raqam, maxsus belgi talab qilinadi, keng tarqalgan parollar rad etiladi va siyosatga mos bo‘lmagan eski parollar bilan kirish bloklanadi.',
  },
  secureCode: {
    file: 'backend/src/utils/passwords.js → checkPasswordPolicy()',
    language: 'javascript',
    code: `function checkPasswordPolicy(password) {
  const errors = [];
  if (password.length < 12) errors.push("Kamida 12 ta belgi");
  if (!/[a-z]/.test(password)) errors.push('Kichik harf');
  if (!/[A-Z]/.test(password)) errors.push('Katta harf');
  if (!/[0-9]/.test(password)) errors.push('Raqam');
  if (!/[^A-Za-z0-9]/.test(password)) errors.push('Maxsus belgi');
  if (COMMON.has(password.toLowerCase())) errors.push('Keng tarqalgan parol');
  return { valid: errors.length === 0, errors };
}

// Saqlash: bcrypt (cost 12)
const hash = await bcrypt.hash(password, 12);`,
    explanation: [
      'Server tomonidagi tekshiruv majburiy — frontend tekshiruvi faqat qulaylik uchun.',
      'Keng tarqalgan parollar ro‘yxati real loyihada Have I Been Pwned k-anonymity API yoki katta lug‘at bilan almashtiriladi.',
      'Foydalanuvchiga aniq xatolar ro‘yxati qaytariladi — bu UX’ni yaxshilaydi.',
    ],
    checklist: ['Minimal uzunlik 12+', 'Keng tarqalgan parollar rad etiladi', 'bcrypt/Argon2 bilan xeshlash', 'Eski zaif parollarni almashtirishga majburlash', 'Parol menejerlari qo‘llab-quvvatlanadi'],
  },
  quiz: [
    { q: 'Parol kuchiga eng ko‘p ta’sir qiluvchi omil?', options: ['Uzunlik va oldindan aytib bo‘lmaslik', 'Faqat raqamlar', 'Har oy almashtirish', 'Foydalanuvchi ismi'], answer: 0, explanation: 'Uzunlik kombinatsiyalar sonini eksponensial oshiradi.' },
    { q: 'NIST majburiy davriy parol almashtirishni tavsiya qiladimi?', options: ['Ha, har oy', 'Yo‘q, faqat buzilish belgisi bo‘lsa', 'Ha, har kuni', 'Faqat adminlar uchun'], answer: 1, explanation: 'Majburiy almashtirish odatda zaifroq, oldindan aytiladigan parollarga olib keladi.' },
    { q: 'Parollarni saqlash uchun qaysi algoritm mos?', options: ['MD5', 'SHA1', 'bcrypt / Argon2', 'Base64'], answer: 2, explanation: 'Sekin, tuzli algoritmlar offline taxminni qimmatlashtiradi.' },
    { q: 'Parol siyosati qayerda majburiy tekshirilishi kerak?', options: ['Faqat frontend’da', 'Serverda', 'Faqat email orqali', 'Hech qayerda'], answer: 1, explanation: 'Frontend tekshiruvini chetlab o‘tish oson.' },
  ],
  homework: [
    'Have I Been Pwned “Pwned Passwords” k-anonymity modelini o‘rganib, uni ilovaga qanday qo‘shishni tavsiflang.',
    'Parol kuchi indikatori (zxcvbn) bilan ro‘yxatdan o‘tish formasini yaxshilash rejasini yozing.',
    'Legacy MD5 xeshlarni foydalanuvchi keyingi kirishida bcrypt’ga ko‘chirish (rehash) algoritmini yozing.',
  ],
};
