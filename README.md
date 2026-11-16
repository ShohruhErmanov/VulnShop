# VulnShop — Vulnerable E-Commerce Security Lab

VulnShop — kiberxavfsizlik kursi o‘quvchilari uchun **ataylab zaif qilib yaratilgan** internet-do‘kon. Ilova real e-commerce funksiyalariga ega (katalog, savatcha, buyurtmalar, admin panel) va unga OWASP Top 10 asosidagi **10 ta laboratoriya** joylashtirilgan. Har bir laboratoriya **zaif** va **xavfsiz** rejimga ega; o‘quvchi zaiflikni topadi, kodni tahlil qiladi, xavfsiz rejimga o‘tkazib himoyani avtomatik tekshiruv bilan tasdiqlaydi va test topshiradi.

> ⚠️ **Faqat lokal o‘quv muhiti uchun.** API faqat `127.0.0.1` ga bog‘lanadi, lokal bo‘lmagan so‘rovlarni rad etadi va production rejimida barcha zaifliklar avtomatik o‘chiriladi. Barcha ma’lumotlar sun’iy.

## Imkoniyatlar

| Qism | Tarkibi |
|---|---|
| Do‘kon | Ro‘yxatdan o‘tish, login, profil, katalog (qidiruv/filtr/saralash), mahsulot sahifasi, sharhlar, savatcha, checkout, buyurtmalar, bekor qilish, qo‘llanma yuklab olish |
| Admin | Statistika dashboard, mahsulotlar CRUD, buyurtma holatlari, foydalanuvchilar (rol/o‘chirish), sozlamalar |
| Security Lab | Dashboard (zaifliklar, topilgan/tuzatilgan, security score, completion, OWASP kategoriyalari, faollik), 10 ta o‘quv moduli (9 bo‘lim), flag yuborish, rejim almashtirish, avtomatik fix-verifier, test (quiz), instruktor progress jadvali |
| UI | Dark/light mavzu, responsive sidebar, kartalar, toast, skeleton loading, Lucide ikonlar |

## 10 ta laboratoriya

| # | Zaiflik | OWASP 2021 | Modul |
|---|---|---|---|
| 1 | SQL Injection | A03 Injection | Katalog qidiruvi |
| 2 | Cross-Site Scripting | A03 Injection | Sharhlar, qidiruv sarlavhasi |
| 3 | Broken Access Control | A01 | Admin API |
| 4 | IDOR | A01 | Buyurtmalar |
| 5 | Broken Authentication | A07 | Login / JWT |
| 6 | Weak Password Policy | A07 | Ro‘yxatdan o‘tish |
| 7 | Security Misconfiguration | A05 | Server sozlamalari |
| 8 | Sensitive Data Exposure | A02 | Profil API |
| 9 | CSRF | A01 | Email o‘zgartirish |
| 10 | Path Traversal | A01 | Fayl yuklab olish |

## Tezkor ishga tushirish

**Docker (tavsiya etiladi):**
```bash
docker compose up --build
```
→ http://localhost:8080

**Docker’siz (SQLite bilan):**
```bash
cd backend && npm install && npm start
```
```bash
cd frontend && npm install && npm run dev
```
→ http://localhost:5173

Test akkauntlari va batafsil yo‘riqnoma: [docs/INSTALLATION.md](docs/INSTALLATION.md).

**Sinf serveri (Render, havola orqali):** sinf kodi darvozasi va o‘quvchilarni bir-biridan himoyalovchi “hosted classroom” rejimi — [docs/DEPLOY_RENDER.md](docs/DEPLOY_RENDER.md).

## Hujjatlar

- [INSTALLATION.md](docs/INSTALLATION.md) — o‘rnatish, akkauntlar, muammolarni hal qilish
- [DEPLOY_RENDER.md](docs/DEPLOY_RENDER.md) — Render’ga sinf serveri sifatida joylash
- [PROJECT_ARCHITECTURE.md](docs/PROJECT_ARCHITECTURE.md) — arxitektura, papkalar, API
- [SECURITY_LABS.md](docs/SECURITY_LABS.md) — laboratoriyalar tizimi va xavfsizlik cheklovlari
- [VULNERABILITY_GUIDE.md](docs/VULNERABILITY_GUIDE.md) — har bir zaiflik: sabab, aniqlash, tuzatish, secure code, test
- [STUDENT_GUIDE.md](docs/STUDENT_GUIDE.md) — o‘quvchi uchun qo‘llanma
- [INSTRUCTOR_GUIDE.md](docs/INSTRUCTOR_GUIDE.md) — instruktor uchun qo‘llanma (javoblar kaliti)

## Testlar

```bash
cd backend && npm test
```
```bash
cd frontend && npm run lint && npm test && npm run build
```

## Litsenziya va mas’uliyat

Faqat ta’lim maqsadida. Ilovani internetga ochiq serverga joylashtirmang va o‘rganilgan usullarni faqat o‘zingizga tegishli yoki yozma ruxsat olingan tizimlarda qo‘llang.
