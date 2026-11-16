# O‘quvchi qo‘llanmasi

## Qoidalar

1. VulnShop’ni **faqat o‘z kompyuteringizda** (localhost) ishlating.
2. O‘rgangan usullarni faqat o‘zingizga tegishli yoki **yozma ruxsat** berilgan tizimlarda qo‘llang. Ruxsatsiz sinov — qonunbuzarlik.
3. Haqiqiy shaxsiy ma’lumotlarni kiritmang.
4. Lab xavfsizlik cheklovlarini (localhost guard, storage sandbox) o‘chirmang — ular laboratoriyaning bir qismi emas.

## Boshlash

1. Ilovani ishga tushiring ([INSTALLATION.md](INSTALLATION.md)) va `alice@vulnshop.local` bilan kiring yoki o‘z akkauntingizni yarating.
2. Sidebar’dan **Security Lab → Lab Dashboard** ga o‘ting.
3. Do‘kon funksiyalari bilan tanishing: katalog, mahsulot, sharh, savatcha, buyurtma, profil. Zaifliklar aynan shu oddiy funksiyalarda yashiringan.

## Har bir laboratoriya uchun ish tartibi

| Bosqich | Nima qilasiz |
|---|---|
| 1. Kirish va Nazariya | Zaiflik nima, nima uchun paydo bo‘ladi, turlari |
| 2. Real hodisa | Haqiqiy voqea va uning oqibatlari |
| 3. Zaif kod | Kod parchasi va qaysi qator xato ekanini tushunish |
| 4. Amaliy lab | Vazifalarni bajarish: kuzatish, solishtirish, tahlil; flagni topish |
| 5. Xavfsizlik testi | Vositalar va tekshirish bosqichlari |
| 6. Xavfsiz kod | To‘g‘ri yechim va tekshiruv ro‘yxati |
| 7. Tuzatishni tasdiqlash | Xavfsiz rejimga o‘tish → **Tuzatishni tekshirish** |
| 8. Test | Quiz (o‘tish uchun ≥ 70%, qayta topshirish mumkin) |
| 9. Uy vazifasi | Mustaqil tahlil va kod yozish |

## Flaglar

Har bir labda `VULNSHOP{...}` formatidagi flag zaif rejimda ilova ichida yashiringan. Amaliy lab bo‘limidagi yo‘naltiruvchi savollar flag qayerga bog‘liqligini aytadi, lekin uni qanday olishni emas — buni o‘zingiz kod tahlili va kuzatish orqali aniqlaysiz. Flag topilganda lab “Topilgan” deb belgilanadi.

## Foydali vositalar

- **Brauzer DevTools** — Network (so‘rov/javoblar), Application (cookie, localStorage), Console.
- **Burp Suite Community / OWASP ZAP** — faqat `localhost` ga yo‘naltiring.
- **Postman / curl** — API’ni to‘g‘ridan-to‘g‘ri chaqirish (`http://localhost:4000/api` yoki Docker’da ham shu manzil).
- **Manba kodi** — bu white-box lab: `backend/src/services` va `frontend/src/pages` ni o‘qing.

## Ball tizimi

- Flag topish: lab balli (100–200).
- Tuzatishni tasdiqlash: lab ballining yarmi.
- Dashboard: Security score (xavfsiz lablar ulushi), Lab completion (topilgan + tuzatilgan + test / 30).

## Hisobot yozish (tavsiya etilgan shablon)

1. Zaiflik nomi va OWASP kategoriyasi
2. Joylashuv (endpoint, fayl, funksiya)
3. Ildiz sabab (kod darajasida)
4. Ta’sir (qaysi ma’lumot yoki funksiya xavf ostida)
5. Kuzatilgan dalillar (zaif va xavfsiz rejim taqqoslovi, skrinshotlar)
6. Tuzatish tavsiyasi va secure code
7. Tuzatishni tasdiqlovchi test
