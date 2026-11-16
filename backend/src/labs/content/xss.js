'use strict';
module.exports = {
  introduction: 'Cross-Site Scripting (XSS) — foydalanuvchi kiritgan ma’lumot boshqa foydalanuvchining brauzerida HTML/JavaScript sifatida talqin qilinishi. VulnShop’da zaif rejimda mahsulot sharhlari HTML sifatida saqlanadi va chiqariladi (Stored XSS), qidiruv sarlavhasi esa HTML sifatida render qilinadi (DOM-based XSS). Bundan tashqari, “support session” cookie’si HttpOnly bayrog‘isiz o‘rnatiladi.',
  theory: [
    'Stored XSS: zararli kontent serverda saqlanadi va sahifani ochgan har bir foydalanuvchida ishlaydi.',
    'Reflected XSS: kontent so‘rovdan olinib darhol javobga qaytariladi.',
    'DOM-based XSS: zaiflik to‘liq frontend kodida — innerHTML yoki React’dagi dangerouslySetInnerHTML kabi “sink”lar orqali.',
    'Oqibatlar: HttpOnly bo‘lmagan cookie’larni o‘qish, foydalanuvchi nomidan amallar bajarish, sahifani soxtalashtirish.',
    'Himoya qatlamlari: kontekstga mos chiqish kodlash (output encoding), HTML sanitizatsiya (DOMPurify), Content-Security-Policy, sessiya cookie’lari uchun HttpOnly.',
  ],
  scenario: '2018-yilda British Airways saytiga kiritilgan begona skript (Magecart hujumi) yuz minglab mijozlarning to‘lov ma’lumotlarini o‘g‘irladi va kompaniya katta jarimaga tortildi. Brauzerda ishonchsiz skript bajarilsa, sahifadagi barcha ma’lumot xavf ostida qoladi.',
  vulnerableCode: {
    file: 'backend/src/services/reviewService.js, frontend/src/pages/ProductDetail.jsx, frontend/src/pages/Catalog.jsx',
    language: 'jsx',
    code: `// BACKEND (VULNERABLE): sharh o'zgarishsiz saqlanadi
function sanitizeComment(comment) {
  return String(comment);
}

// FRONTEND (VULNERABLE): sharh HTML sifatida chiqariladi
<p dangerouslySetInnerHTML={{ __html: review.comment }} />

// FRONTEND (VULNERABLE): qidiruv so'zi HTML sifatida
<h2 dangerouslySetInnerHTML={{ __html: 'Natijalar: ' + search }} />

// Cookie HttpOnly emas -> JavaScript o'qiy oladi
res.cookie('vs_support_session', value, { httpOnly: false });`,
    explanation: [
      'React matnni avtomatik kodlaydi, ammo dangerouslySetInnerHTML bu himoyani butunlay o‘chiradi.',
      'Server kiritmani tozalamaydi — saqlangan HTML barcha tashrif buyuruvchilar uchun render qilinadi.',
      'HttpOnly bayrog‘isiz cookie document.cookie orqali skriptlarga ochiq.',
      'Bir nechta kichik xato (sanitizatsiya yo‘q + xavfli sink + HttpOnly yo‘q) birgalikda jiddiy oqibatga olib keladi.',
    ],
  },
  practical: {
    objective: 'Zaif “sink”larni aniqlang, cookie bayroqlarini tekshiring va xavfsiz rejimda himoyani tasdiqlang.',
    tasks: [
      'Frontend kodida dangerouslySetInnerHTML ishlatilgan barcha joylarni toping (grep yoki IDE qidiruvi).',
      'Sharh sifatida oddiy formatlash belgilarini (masalan, qalin matn tegi) yozing va ikkala rejimda qanday ko‘rinishini solishtiring — bu HTML talqin qilinyaptimi yoki yo‘qligini ko‘rsatadi.',
      'DevTools → Application → Cookies bo‘limida har bir cookie’ning HttpOnly va SameSite bayroqlarini yozib oling.',
      'Nima uchun aynan HttpOnly bo‘lmagan cookie XSS uchun nishon bo‘lishini tushuntiring.',
      'Secure rejimga o‘ting, sahifani yangilang va “Tuzatishni tekshirish”ni bajaring.',
    ],
    hints: [
      'Zaiflik ikki joyda: ma’lumot qanday saqlanadi va qanday chiqariladi.',
      'Flag HttpOnly bo‘lmagan cookie bilan bog‘liq.',
    ],
  },
  testing: {
    tools: ['Brauzer DevTools', 'Jest + Supertest', 'CSP Evaluator'],
    steps: [
      'Ikkala rejimda saqlangan sharh matnini API javobida (GET /api/products/:id) solishtiring — HTML teglari saqlanadimi?',
      'Secure rejimda javob sarlavhalarida Content-Security-Policy borligini tekshiring (Misconfiguration lab ham secure bo‘lsa).',
      '“npm test” orqali XSS testini ishga tushiring.',
    ],
    expected: 'Zaif rejimda HTML teglari saqlanib, sahifada render qilinadi va support cookie JavaScript’ga ochiq. Xavfsiz rejimda teglar olib tashlanadi, matn oddiy text sifatida ko‘rsatiladi va cookie o‘rnatilmaydi.',
  },
  secureCode: {
    file: 'backend/src/services/reviewService.js + ProductDetail.jsx (secure)',
    language: 'jsx',
    code: `// BACKEND: markup kiritishda olib tashlanadi (defense in depth)
function sanitizeComment(comment) {
  return String(comment).replace(/<[^>]*>?/g, '').replace(/[<>]/g, '').trim();
}

// FRONTEND: React avtomatik kodlaydi (text node)
<p>{review.comment}</p>

// HTML haqiqatan kerak bo'lsa — sanitizatsiya kutubxonasi:
import DOMPurify from 'dompurify';
<p dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(html) }} />

// Sessiya cookie'lari: HttpOnly + SameSite; sarlavhalar: CSP (helmet)
res.cookie('session', token, { httpOnly: true, sameSite: 'strict', secure: true });`,
    explanation: [
      'Asosiy himoya — chiqishda kodlash: React {} ichidagi qiymatni doim text sifatida chiqaradi.',
      'Kiritishda tozalash qo‘shimcha qatlam vazifasini bajaradi.',
      'CSP inline skriptlarni cheklaydi, HttpOnly esa cookie’larni skriptlardan yashiradi.',
    ],
    checklist: ['dangerouslySetInnerHTML yo‘q yoki DOMPurify bilan', 'Sessiya cookie’lari HttpOnly', 'CSP yoqilgan', 'Kiritma uzunligi cheklangan', 'Regressiya testi mavjud'],
  },
  quiz: [
    { q: 'Stored XSS’ning Reflected XSS’dan asosiy farqi?', options: ['Kontent serverda saqlanadi', 'Faqat POST orqali ishlaydi', 'Faqat admin ko‘radi', 'HTTPS’da ishlamaydi'], answer: 0, explanation: 'Stored XSS saqlanib, sahifani ochgan har bir foydalanuvchiga ta’sir qiladi.' },
    { q: 'React’da qaysi atribut avtomatik kodlashni o‘chiradi?', options: ['className', 'dangerouslySetInnerHTML', 'onClick', 'key'], answer: 1, explanation: 'dangerouslySetInnerHTML xom HTML’ni DOM’ga qo‘yadi.' },
    { q: 'Cookie’ni JavaScript’dan qaysi bayroq yashiradi?', options: ['Secure', 'HttpOnly', 'Path', 'Domain'], answer: 1, explanation: 'HttpOnly cookie’ni document.cookie’dan yashiradi.' },
    { q: 'XSS’ga qarshi eng asosiy himoya qaysi?', options: ['Kontekstga mos chiqish kodlash', 'Parolni uzaytirish', 'Rate limiting', 'Ma’lumotlarni shifrlash'], answer: 0, explanation: 'Ma’lumot qaysi kontekstda (HTML, atribut, JS, URL) chiqsa, o‘sha kontekstga mos kodlanishi kerak.' },
    { q: 'Qaysi HTTP sarlavha XSS ta’sirini kamaytiradi?', options: ['Content-Security-Policy', 'Content-Length', 'ETag', 'Accept'], answer: 0, explanation: 'CSP skript manbalarini va inline skriptlarni cheklaydi.' },
  ],
  homework: [
    'Profil “bio” maydoni va boshqa foydalanuvchi kiritmalari qanday render qilinishini tahlil qiling va xulosa yozing.',
    'DOMPurify yordamida sharhlarda faqat <b> va <i> teglariga ruxsat beradigan xavfsiz variant yarating.',
    'Ilova uchun qat’iy CSP siyosatini loyihalang va har bir direktiva nima uchun kerakligini tushuntiring.',
  ],
};
