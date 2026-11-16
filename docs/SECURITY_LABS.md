# Security Labs

## Laboratoriya tizimi qanday ishlaydi

Har bir laboratoriya uchta qismdan iborat:

1. **Ilova ichidagi zaif kod tarmog‘i** — real funksiya (masalan, katalog qidiruvi) zaif rejimda xato usulda ishlaydi.
2. **Xavfsiz kod tarmog‘i** — o‘sha funksiyaning to‘g‘ri amalga oshirilishi.
3. **O‘quv moduli** — 9 bo‘lim: Kirish → Nazariya → Real hodisa → Zaif kod tahlili → Amaliy lab → Xavfsizlik testi → Xavfsiz kod → Test (quiz) → Uy vazifasi.

### Progress

| Holat | Qanday erishiladi | Ball |
|---|---|---|
| **Topilgan** | Zaif rejimda yashiringan `VULNSHOP{...}` flagni topib yuborish | lab balli |
| **Tuzatilgan** | Labni xavfsiz rejimga o‘tkazib, “Tuzatishni tekshirish” orqali avtomatik verifier himoyani tasdiqlashi | ½ lab balli |
| **Test** | Quiz’dan ≥ 70% | — |

- **Security score** = xavfsiz rejimdagi lablar ulushi.
- **Lab completion** = (topilgan + tuzatilgan + topshirilgan testlar) / 30.
- Instruktor (admin) barcha o‘quvchilar progressini “O‘quvchilar progressi” sahifasida ko‘radi.

## Laboratoriyalar ro‘yxati

| ID | Nomi | Qiyinlik | Ball | Zaif kod joyi |
|---|---|---|---|---|
| `sqli` | SQL Injection | O‘rta | 150 | `services/productService.js → search()` |
| `xss` | Cross-Site Scripting | O‘rta | 150 | `services/reviewService.js`, `pages/ProductDetail.jsx`, `pages/Catalog.jsx`, `controllers/authController.js` |
| `bac` | Broken Access Control | Oson | 100 | `middleware/auth.js → adminGate()` |
| `idor` | IDOR | Oson | 100 | `services/orderService.js → getForUser()` |
| `broken-auth` | Broken Authentication | Qiyin | 200 | `services/tokenService.js`, `services/authService.js`, `middleware/rateLimit.js` |
| `weak-password` | Weak Password Policy | Oson | 100 | `services/authService.js → validateNewPassword()` |
| `misconfig` | Security Misconfiguration | Oson | 100 | `middleware/security.js`, `middleware/errorHandler.js`, `controllers/systemController.js` |
| `sensitive-data` | Sensitive Data Exposure | O‘rta | 150 | `services/userSerializer.js` |
| `csrf` | CSRF | O‘rta | 150 | `middleware/csrf.js`, `middleware/auth.js` |
| `path-traversal` | Path Traversal | O‘rta | 150 | `services/fileService.js → resolveDocument()` |

Har bir zaiflikning batafsil tahlili: [VULNERABILITY_GUIDE.md](VULNERABILITY_GUIDE.md).

## Xavfsizlik cheklovlari (lab’ni himoyalash)

| Cheklov | Amalga oshirilishi |
|---|---|
| Faqat loopback | `server.js`: lab rejimida `HOST` faqat `127.0.0.1`/`localhost`/`::1`; Docker ichida `ALLOW_CONTAINER_BIND=true` bilan `0.0.0.0`, lekin compose portlarni faqat `127.0.0.1` ga ochadi |
| Lokal so‘rovlar | `middleware/localOnly.js`: manba IP loopback yoki xususiy (Docker) tarmoq bo‘lishi **va** `Host` sarlavhasi localhost bo‘lishi shart (DNS rebinding’dan himoya) |
| Production’da zaifliklar o‘chiq | `APP_MODE=production` yoki `NODE_ENV=production` → `isVulnerable()` doimo `false`, rejim almashtirish 403, debug endpoint 404, qisqa `JWT_SECRET` bilan ishga tushmaydi |
| Fayl sandbox | Path Traversal zaif rejimida ham o‘qish `backend/storage` bilan cheklangan — host kompyuterdagi fayllarga yetib bo‘lmaydi |
| Izolyatsiya | MySQL’ning porti ochilmagan, `internal` tarmoqda internetga chiqish yo‘q; backend konteyneri read-only FS, `cap_drop: ALL`, `no-new-privileges`, root bo‘lmagan foydalanuvchi |
| Sun’iy ma’lumotlar | `.local` emaillar, ommaviy test karta raqamlari, soxta kalitlar |
| Tashqi hujum funksiyasi yo‘q | Ilovada boshqa tizimlarga so‘rov yuboruvchi biror funksiya yo‘q; fix-verifierlar faqat ilovaning o‘z funksiyalarini jarayon ichida chaqiradi |

Bu cheklovlar labning bir qismi **emas** — ularni o‘chirmang.

### Hosted classroom rejimi (`LAB_DEPLOYMENT=hosted`)

Sinf serverida (masalan, Render) localhost cheklovi o‘rniga quyidagilar ishlaydi: sinf kodi darvozasi, domen allow-list, majburiy maxfiy sozlamalar, instruktor akkaunti himoyasi, lab rejimlarini faqat instruktor almashtirishi va o‘quvchilar bir-biriga zarar yetkaza olmasligi. Batafsil: [DEPLOY_RENDER.md](DEPLOY_RENDER.md).
