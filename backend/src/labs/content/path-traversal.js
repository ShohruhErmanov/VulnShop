'use strict';
module.exports = {
  introduction: 'Path Traversal (Directory Traversal) — foydalanuvchi bergan fayl nomi orqali ilova ruxsat etilgan papkadan tashqaridagi fayllarni o‘qishi. VulnShop’da mahsulot qo‘llanmalarini yuklab olish funksiyasi zaif rejimda fayl yo‘lini tekshirmaydi. Xavfsizlik uchun laboratoriya sandbox’i o‘qishni har doim backend/storage papkasi bilan cheklaydi.',
  theory: [
    'Ildiz sabab: foydalanuvchi kiritmasi fayl tizimi yo‘lining bir qismi sifatida ishlatiladi va yakuniy (kanonik) yo‘l tekshirilmaydi.',
    'Nisbiy yo‘l segmentlari (ota papkaga o‘tish), absolyut yo‘llar, turli kodlashlar va OS’ga xos ajratuvchilar oddiy filtrlarni chetlab o‘tishi mumkin.',
    'Oqibatlar: konfiguratsiya fayllari, sirlar, zaxira nusxalar va boshqa ilova ma’lumotlarini o‘qish; yozish funksiyasi bo‘lsa — kodni almashtirish.',
    'Himoya: fayllarni ID orqali tanlash (foydalanuvchi yo‘l bermaydi), basename + qat’iy allow-list pattern, kanonik yo‘lni hisoblab, u ruxsat etilgan papka ichida ekanini tekshirish, minimal fayl tizimi huquqlari.',
  ],
  scenario: '2021-yilda Apache HTTP Server 2.4.49 dagi path traversal zaifligi (CVE-2021-41773) faol ekspluatatsiya qilindi va tez orada yamoq chiqarilishi talab qilindi. Fortinet SSL VPN’dagi shunga o‘xshash zaiflik (CVE-2018-13379) orqali minglab qurilmalarning VPN hisob ma’lumotlari sizib chiqqan.',
  vulnerableCode: {
    file: 'backend/src/services/fileService.js → resolveDocument()',
    language: 'javascript',
    code: `// VULNERABLE: kiritma to'g'ridan-to'g'ri yo'lga qo'shiladi
const target = path.join(DOCS_DIR, name);

// LAB SAFETY SANDBOX (o'quv maqsadida): o'qish faqat backend/storage ichida
if (!target.startsWith(STORAGE_ROOT + path.sep)) {
  throw new AppError(403, 'Lab sandbox: storage/ papkasidan tashqariga chiqish bloklangan');
}
return target;`,
    explanation: [
      'path.join() nisbiy segmentlarni normallashtiradi — natijada yakuniy yo‘l documents/ papkasidan chiqib ketishi mumkin.',
      'Fayl nomi formati tekshirilmaydi.',
      'Sandbox tekshiruvi laboratoriya xavfsizligi uchun: u storage/ ichidagi boshqa papkalarga kirishga ruxsat beradi, lekin kompyuteringizdagi real fayllarni himoya qiladi. Real ilovada chegara aynan documents/ bo‘lishi kerak.',
    ],
  },
  practical: {
    objective: 'Fayl yo‘lini hal qilish (resolution) mantiqini tahlil qiling va kanonik yo‘l tekshiruvining ahamiyatini tushuning.',
    tasks: [
      'Mahsulot sahifasidagi “Qo‘llanmani yuklab olish” tugmasi qaysi endpointga qanday parametr bilan murojaat qilishini aniqlang.',
      'backend/storage papkasining tuzilmasini ko‘rib chiqing: qaysi fayllar ochiq bo‘lishi kerak, qaysilari yo‘q?',
      'Node.js REPL’da path.join() va path.resolve() ning nisbiy segmentlar bilan qanday ishlashini o‘z kompyuteringizda xavfsiz misollar bilan o‘rganing.',
      'resolveDocument() ning ikkala tarmog‘ini solishtiring: xavfsiz tarmoqdagi har bir tekshiruv qaysi xavfni bartaraf qiladi?',
      'Secure rejimga o‘ting va “Tuzatishni tekshirish”ni bajaring.',
    ],
    hints: [
      'Muhimi — kiritma qanday ko‘rinishi emas, u hal qilingandan keyin yo‘l qayerga ishora qilishi.',
      'Flag storage ichidagi ochiq bo‘lmasligi kerak bo‘lgan papkada.',
    ],
  },
  testing: {
    tools: ['Node.js REPL', 'Brauzer DevTools', 'Jest + Supertest'],
    steps: [
      'Secure rejimda faqat documents/ ichidagi to‘g‘ri formatdagi fayl nomlari qabul qilinishini va boshqa barcha kiritmalar 400 qaytarishini tasdiqlang.',
      '“npm test” orqali Path Traversal testlarini ishga tushiring.',
    ],
    expected: 'Zaif rejimda documents/ papkasidan tashqaridagi (lekin storage/ ichidagi) fayllar o‘qilishi mumkin; storage/ dan tashqariga chiqish sandbox tomonidan har doim bloklanadi. Xavfsiz rejimda faqat allow-list patternga mos oddiy fayl nomlari qabul qilinadi.',
  },
  secureCode: {
    file: 'backend/src/services/fileService.js (secure)',
    language: 'javascript',
    code: `// 1) Faqat oddiy fayl nomi: papka segmentlari yo'q, qat'iy pattern
if (path.basename(name) !== name || !/^[a-z0-9][a-z0-9-]*\\.(txt|pdf|md)$/i.test(name)) {
  throw new AppError(400, 'Fayl nomi yaroqsiz');
}
// 2) Kanonik yo'l ruxsat etilgan papka ichida bo'lishi shart
const target = path.resolve(DOCS_DIR, name);
if (!target.startsWith(DOCS_DIR + path.sep)) throw new AppError(400, 'Fayl nomi yaroqsiz');

// Eng yaxshisi: foydalanuvchi yo'l emas, ID beradi
const doc = await Document.findByPk(req.params.id);  // fayl yo'li DB'da`,
    explanation: [
      'Bir nechta mustaqil qatlam: format allow-list, basename va kanonik yo‘l tekshiruvi.',
      'Qora ro‘yxat (masalan, faqat ma’lum belgilar ketma-ketligini o‘chirish) chetlab o‘tilishi mumkin — allow-list ishonchliroq.',
      'Ilova jarayoni faqat kerakli papkalarni o‘qish huquqiga ega bo‘lishi kerak (Docker’da read-only mount).',
    ],
    checklist: ['Fayllar ID orqali tanlanadi', 'basename + allow-list pattern', 'Kanonik yo‘l tekshiruvi', 'Minimal fayl tizimi huquqlari', 'Regressiya testi'],
  },
  quiz: [
    { q: 'Path Traversal’ning ildiz sababi?', options: ['Kiritma fayl yo‘liga tekshiruvsiz qo‘shilishi', 'Zaif parol', 'CORS', 'Eski brauzer'], answer: 0, explanation: 'Yakuniy yo‘l ruxsat etilgan papka ichida ekanligi tekshirilmaydi.' },
    { q: 'Qaysi yondashuv ishonchliroq?', options: ['Xavfli belgilar ketma-ketligini o‘chirish (blacklist)', 'Allow-list + kanonik yo‘l tekshiruvi', 'Fayl nomini katta harfga o‘tkazish', 'Base64'], answer: 1, explanation: 'Blacklist kodlash va variantlar bilan chetlab o‘tiladi.' },
    { q: 'path.resolve() dan keyin nimani tekshirish kerak?', options: ['Fayl hajmini', 'Natija ruxsat etilgan papka bilan boshlanishini', 'Fayl yaratilgan sanani', 'Hech narsani'], answer: 1, explanation: 'Kanonik yo‘l bazaviy papka ichida bo‘lishi shart.' },
    { q: 'Eng xavfsiz dizayn qaysi?', options: ['Foydalanuvchi to‘liq yo‘l beradi', 'Foydalanuvchi ID beradi, yo‘l serverda saqlanadi', 'Yo‘l cookie’da', 'Yo‘l URL hash’ida'], answer: 1, explanation: 'Foydalanuvchi yo‘lni umuman boshqarmasa, traversal imkonsiz.' },
  ],
  homework: [
    'Fayllarni ID orqali yuklab olish uchun endpoint loyihalang (DB modeli va route).',
    'Docker’da storage/documents papkasini read-only mount qilish konfiguratsiyasini yozing.',
    'Windows va Linux’dagi yo‘l ajratuvchilari farqi traversal himoyasiga qanday ta’sir qilishini tushuntiring.',
  ],
};
