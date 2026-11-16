# Render’ga joylash (sinf serveri)

VulnShop’ni o‘quvchilar bitta havola orqali ochishi uchun **hosted classroom** rejimida Render’ga joylash mumkin. Bu rejimda lablar zaif holatda ishlaydi, lekin quyidagi himoyalar avtomatik yoqiladi.

## Hosted rejimdagi himoyalar

| Himoya | Nima qiladi |
|---|---|
| Sinf kodi darvozasi | Har qanday sahifa va API’dan oldin `LAB_ACCESS_CODE` so‘raladi. Botlar, skanerlar va begonalar ilovaga yetib bormaydi |
| Domen allow-list | Faqat `PUBLIC_HOSTS` va Render’ning `*.onrender.com` manziliga javob beradi |
| Majburiy sozlamalar | Kod, instruktor paroli yoki `JWT_SECRET` bo‘lmasa, server ishga tushmaydi |
| Instruktor himoyasi | `admin@vulnshop.local` paroli `INSTRUCTOR_PASSWORD` dan olinadi (hujjatlardagi parol ishlamaydi). Soxta yoki zaif imzolangan token bilan instruktor nomidan kirib bo‘lmaydi |
| Lab rejimlari | Faqat instruktor almashtiradi (o‘quvchi almashtirsa, hammaga ta’sir qilardi) |
| O‘quvchilar bir-biriga zarar yetkaza olmaydi | BAC labida admin ma’lumotlarini o‘qish ochiq, lekin o‘chirish/o‘zgartirish bloklangan. IDOR’da begona buyurtmani ko‘rish mumkin, lekin bekor qilib bo‘lmaydi. Umumiy seed akkauntlari (alice, bob, support...) o‘zgartirilmaydi. Saqlangan XSS faqat sharh muallifining o‘z brauzerida ishga tushadi |
| Indekslash yo‘q | `X-Robots-Tag: noindex` |
| Fayl sandbox | Path Traversal faqat `storage/` ichida |

## 1. Kodni GitHub’ga yuklash

Render kodni GitHub (yoki GitLab) repozitoriysidan oladi. Shaxsiy (private) repozitoriy tavsiya etiladi.

```bash
git remote add origin https://github.com/<foydalanuvchi>/vulnshop.git
```
```bash
git push -u origin main
```

## 2. Render’da yaratish

1. https://dashboard.render.com → **New → Blueprint** → repozitoriyni tanlang (`render.yaml` avtomatik o‘qiladi).
2. So‘ralgan qiymatlarni kiriting:

| O‘zgaruvchi | Misol | Izoh |
|---|---|---|
| `LAB_ACCESS_CODE` | `kiber-guruh-7-2026` | O‘quvchilarga beriladigan sinf kodi (≥ 10 belgi). Kurs tugagach almashtiring |
| `INSTRUCTOR_PASSWORD` | uzun tasodifiy parol | `admin@vulnshop.local` uchun (≥ 12 belgi). O‘quvchilarga bermang |
| `PUBLIC_HOSTS` | `lab.sizningdomen.uz` | O‘z domeningiz. Hozircha domen bo‘lmasa, bo‘sh qoldiring — `*.onrender.com` avtomatik qo‘shiladi |
| `JWT_SECRET` | avtomatik | Render o‘zi yaratadi |

   > `LAB_ACCESS_CODE` va `INSTRUCTOR_PASSWORD` ni bo‘sh qoldirsangiz ham bo‘ladi: server ularni `JWT_SECRET` dan avtomatik hosil qiladi (har restartda bir xil) va **Logs** bo‘limida ko‘rsatadi — `LAB_ACCESS_CODE = sinf-…` va `INSTRUCTOR_PASSWORD = Inst#…` qatorlarini qidiring. O‘zingiz qiymat bersangiz, sizniki ishlatiladi.

3. **Apply** → build 3–5 daqiqa davom etadi. Tayyor bo‘lgach `https://vulnshop-lab.onrender.com` kabi manzil chiqadi.

Blueprint’siz qo‘lda: **New → Web Service** → repozitoriy → Runtime: **Docker** → Health Check Path: `/healthz` → yuqoridagi o‘zgaruvchilarni qo‘shing.

## 3. O‘z domeningizni ulash

1. Render → servis → **Settings → Custom Domains → Add** → masalan `lab.sizningdomen.uz`.
2. Domen provayderingizda (DNS) Render ko‘rsatgan **CNAME** yozuvini qo‘shing: `lab` → `vulnshop-lab.onrender.com`.
3. Render HTTPS sertifikatini avtomatik beradi.
4. **Environment** bo‘limida `PUBLIC_HOSTS=lab.sizningdomen.uz` ekanini tekshiring va servisni qayta ishga tushiring.

## 4. O‘quvchilarga nima beriladi

- Havola: `https://lab.sizningdomen.uz`
- Sinf kodi: `LAB_ACCESS_CODE` qiymati
- O‘quvchi o‘z akkauntini yaratadi (faqat sun’iy email, masalan `ism@student.test`) yoki `alice@vulnshop.local` / `Wonderland#2026` dan foydalanadi.

## 5. Darsni olib borish

1. Instruktor `admin@vulnshop.local` + `INSTRUCTOR_PASSWORD` bilan kiradi.
2. **Topish bosqichi:** Lab Dashboard → “Hammasini zaif” (yoki kerakli labni). O‘quvchilar flag topadi.
3. **Tuzatish bosqichi:** instruktor labni xavfsiz rejimga o‘tkazadi → o‘quvchilar “Tuzatishni tekshirish” orqali “Tuzatilgan” belgisini oladi va testni topshiradi.
4. Natijalar: **O‘quvchilar progressi** sahifasi.

## Render tariflari haqida muhim

| Tarif | Xususiyat |
|---|---|
| **Free** | 15 daqiqa faoliyatsizlikdan keyin servis uxlaydi (birinchi ochilish ~1 daqiqa). Disk vaqtinchalik: **har bir qayta ishga tushishda ma’lumotlar (akkauntlar, progress) boshlang‘ich holatga qaytadi** |
| **Starter + Persistent Disk** | Doim yoqiq. Progress saqlanadi: Render → **Disks → Add** → Mount path `/app/data` (1 GB yetarli) |

Ma’lumotlarni boshlang‘ich holatga qaytarish: Render → **Manual Deploy → Restart** (Free) yoki diskni tozalash (Starter).

## Xavfsizlik bo‘yicha tavsiyalar

- Sinf kodini faqat o‘quvchilarga bering; kurs tugagach almashtiring yoki servisni to‘xtating (**Suspend**).
- Servisni faqat kurs davomida yoqiq qoldiring.
- Repozitoriyni private qiling: `INSTRUCTOR_GUIDE.md` da javoblar kaliti bor.
- O‘quvchilarga ruxsatsiz sinov taqiqlanishini va faqat shu lab domeniga sinov o‘tkazish mumkinligini eslating.

## Mahalliy tekshirish (ixtiyoriy)

Render image’ini o‘z kompyuteringizda sinash:

```bash
docker build -t vulnshop-render .
```
```bash
docker run --rm -p 127.0.0.1:10000:10000 -e LAB_ACCESS_CODE=test-code-123 -e INSTRUCTOR_PASSWORD=Test#Instructor2026 -e PUBLIC_HOSTS=localhost -e JWT_SECRET=0123456789abcdef0123456789abcdef0123 vulnshop-render
```

→ http://localhost:10000
