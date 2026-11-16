'use strict';
module.exports = {
  introduction: 'IDOR (Insecure Direct Object Reference) — ilova obyektni foydalanuvchi bergan identifikator bo‘yicha qaytaradi, ammo bu obyekt aynan shu foydalanuvchiga tegishli ekanini tekshirmaydi. VulnShop’da zaif rejimda buyurtma tafsilotlari faqat buyurtma raqami bo‘yicha olinadi.',
  theory: [
    'IDOR — Broken Access Control’ning gorizontal turi: bir xil roldagi boshqa foydalanuvchi ma’lumotlariga kirish.',
    'Ketma-ket ID’lar taxmin qilishni osonlashtiradi, lekin UUID ham avtorizatsiya tekshiruvi o‘rnini bosa olmaydi.',
    'Har bir obyektga murojaatda server “bu obyekt egasi kim va so‘rovchi unga haqlimi?” degan savolni berishi kerak.',
    'Yaxshi amaliyot: so‘rovni egasi bo‘yicha cheklash (WHERE id = ? AND userId = ?) va “mavjud emas” hamda “ruxsat yo‘q” holatlarida bir xil javob (404) qaytarish.',
  ],
  scenario: '2021-yilda Peloton fitnes platformasi API’sida yopiq profillarning shaxsiy ma’lumotlari avtorizatsiyasiz olinishi mumkin bo‘lgan. 2018-yilda USPS’ning “Informed Visibility” API’sida ham millionlab foydalanuvchi ma’lumotlari shu turdagi xato tufayli ochiq qolgan.',
  vulnerableCode: {
    file: 'backend/src/services/orderService.js → getForUser()',
    language: 'javascript',
    code: `// VULNERABLE: faqat ID bo'yicha qidirish, egasi tekshirilmaydi
async function getForUser(user, orderId) {
  const order = await Order.findByPk(orderId, { include });
  if (!order) throw new AppError(404, 'Buyurtma topilmadi');
  return order; // boshqa foydalanuvchining buyurtmasi ham qaytadi
}`,
    explanation: [
      'user parametri funksiyaga uzatiladi, lekin so‘rovda umuman ishlatilmaydi.',
      'Buyurtmada manzil, mahsulotlar va izohlar kabi shaxsiy ma’lumotlar bor.',
      'Bekor qilish (cancel) funksiyasi ham shu funksiyadan foydalanadi — demak o‘qishdan tashqari o‘zgartirish ham xavf ostida.',
    ],
  },
  practical: {
    objective: 'Obyekt darajasidagi avtorizatsiya qayerda yo‘qligini aniqlang va xavfsiz rejimda tuzatishni tasdiqlang.',
    tasks: [
      'Buyurtma tafsilotlari sahifasi qaysi API endpointga murojaat qilishini DevTools’da aniqlang.',
      'orderService.getForUser() ning ikkala tarmog‘ini (vulnerable/secure) solishtiring va farqni bir jumlada yozing.',
      'Seed faylidan buyurtmalar kimga tegishli ekanini aniqlang va zaif rejimda qaysi ma’lumotlar xavf ostida ekanini baholang.',
      'Cancel funksiyasiga ham IDOR ta’sir qilishini kod orqali tushuntiring.',
      'Secure rejimga o‘ting va “Tuzatishni tekshirish”ni bajaring.',
    ],
    hints: [
      'Identifikator taxmin qilinishi mumkin bo‘lsa, avtorizatsiya yagona himoya hisoblanadi.',
      'Flag administratorga tegishli buyurtma bilan bog‘liq.',
    ],
  },
  testing: {
    tools: ['Burp Suite (Autorize)', 'Postman', 'Jest + Supertest'],
    steps: [
      'Ikki xil customer akkaunti bilan har biri o‘z buyurtmasini va boshqa akkaunt buyurtmasini ochishga urinishi natijalarini solishtiring.',
      '“npm test” orqali IDOR testini ishga tushiring.',
    ],
    expected: 'Zaif rejimda istalgan buyurtma ochiladi. Xavfsiz rejimda begona buyurtma uchun 404 qaytadi, admin esa barcha buyurtmalarni ko‘ra oladi.',
  },
  secureCode: {
    file: 'backend/src/services/orderService.js (secure)',
    language: 'javascript',
    code: `async function getForUser(user, orderId) {
  const where = user.role === 'admin'
    ? { id: orderId }
    : { id: orderId, userId: user.id };   // so'rov egasi bo'yicha cheklangan
  const order = await Order.findOne({ where, include });
  // 404 (403 emas) — ID mavjudligini ham oshkor qilmaydi
  if (!order) throw new AppError(404, 'Buyurtma topilmadi');
  return order;
}`,
    explanation: [
      'Egalik sharti DB so‘rovining o‘ziga qo‘shilgan — tekshiruvni unutib bo‘lmaydi.',
      'Admin istisnosi aniq va bitta joyda belgilangan.',
      'Bir xil 404 javob ID’larni sanab chiqishdan foydani kamaytiradi.',
    ],
    checklist: ['Har bir obyektga murojaatda egalik tekshiruvi', 'O‘qish va o‘zgartirish bir xil himoyalangan', '404 bilan bir xil javob', 'Ko‘p foydalanuvchili testlar'],
  },
  quiz: [
    { q: 'IDOR qaysi OWASP kategoriyasiga kiradi?', options: ['Injection', 'Broken Access Control', 'Cryptographic Failures', 'SSRF'], answer: 1, explanation: 'IDOR — obyekt darajasidagi avtorizatsiya yo‘qligi.' },
    { q: 'ID’larni UUID’ga almashtirish IDOR’ni to‘liq hal qiladimi?', options: ['Ha', 'Yo‘q, avtorizatsiya tekshiruvi baribir kerak', 'Faqat MySQL’da', 'Faqat GET uchun'], answer: 1, explanation: 'UUID taxminni qiyinlashtiradi, lekin sizib chiqqan ID bilan kirish baribir mumkin.' },
    { q: 'Begona obyekt so‘ralganda qaysi javob afzal?', options: ['200 bo‘sh javob', '404 Not Found', '500', '302 redirect'], answer: 1, explanation: '404 obyekt mavjudligini ham oshkor qilmaydi.' },
    { q: 'Egalik tekshiruvini qayerda qilish eng ishonchli?', options: ['Frontend’da', 'DB so‘rovining WHERE shartida', 'Faqat logda', 'CSS’da'], answer: 1, explanation: 'So‘rovning o‘zida cheklash tekshiruvni chetlab o‘tib bo‘lmaydigan qiladi.' },
  ],
  homework: [
    'Loyihadagi :id parametrli barcha endpointlarni topib, har biri egalikni tekshiradimi yoki yo‘qligini jadvalga yozing.',
    'Cart endpointlari (PATCH/DELETE /api/cart/:itemId) qanday himoyalanganini tahlil qiling.',
    'IDOR uchun ikki foydalanuvchili Jest test yozing.',
  ],
};
