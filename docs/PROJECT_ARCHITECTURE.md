# Loyiha arxitekturasi

## Umumiy ko‘rinish

```
Brauzer ──► Frontend (React + Vite / nginx :8080) ──/api──► Backend (Express :4000) ──► MySQL / SQLite
                                                              │
                                                              ├── labState  (har bir lab: zaif | xavfsiz)
                                                              └── storage/  (lab sandbox fayllari)
```

Docker’da: `db` faqat `internal` (internetga chiqishsiz) tarmoqda; `backend` `internal` + `web` tarmoqlarida; `frontend` (nginx) `web` tarmog‘ida. Host’ga faqat `127.0.0.1:8080` va `127.0.0.1:4000` ochiladi.

## Texnologiyalar

| Qatlam | Stack |
|---|---|
| Backend | Node.js 20, Express 4, Sequelize 6 (MySQL 8 / SQLite), JWT (jsonwebtoken), bcryptjs, Joi, helmet, cors, express-rate-limit |
| Frontend | React 18, Vite 5, Tailwind CSS 3, React Router 6, Axios, Lucide |
| Test | Jest + Supertest (backend), Vitest + Testing Library (frontend), ESLint |
| Infra | Docker, Docker Compose, nginx |

## Papkalar tuzilmasi

```
backend/
  src/
    config/        index.js (env, lab/production rejimi), database.js (Sequelize + retry)
    models/        User, Product, Review, CartItem, Order, OrderItem, LabSetting, LabProgress
    middleware/    localOnly, auth (authenticate/requireAdmin/adminGate), security (helmet/CORS),
                   csrf, rateLimit, validate (Joi), errorHandler
    services/      biznes mantiq: auth, token, product, review, cart, order, admin, account,
                   file, userSerializer, lab
    controllers/   HTTP qatlami: auth, shop, admin, system, lab
    routes/        index.js (barcha marshrutlar), schemas.js (Joi sxemalari)
    labs/          registry (metadata), labState (rejimlar), flags, verifiers, content/ (10 modul)
    seed/          seed.js (sun’iy ma’lumotlar), run.js (npm run seed)
    app.js         Express ilovasi (middleware zanjiri)
    server.js      ishga tushirish + xavfsizlik tekshiruvlari
  storage/         documents/ (ochiq qo‘llanmalar), private/ (lab maqsadlari)
  tests/           api.test.js, labs.test.js, production.test.js
frontend/
  src/
    api/client.js  Axios (token, CSRF sarlavhasi, 401 handler)
    context/       Auth, Cart, Lab, Theme, Toast
    components/    Layout (sidebar/topbar), ui (Button, Badge, Modal, Skeleton, StatCard, ProgressRing...),
                   ProductCard, CodeBlock, ProtectedRoute, icons
    pages/         Catalog, ProductDetail, Cart, Orders, OrderDetail, Profile, PublicProfile, Auth,
                   admin/*, lab/* (LabDashboard, LabModule, Quiz, Instructor)
    utils/         format, useApi
docs/              7 ta hujjat
docker-compose.yml
```

## Qatlamlar (Clean Architecture)

1. **Routes** — URL, middleware zanjiri va Joi validatsiyasi.
2. **Controllers** — HTTP ↔ servis tarjimasi (status kodlari, cookie).
3. **Services** — biznes mantiq. Zaif/xavfsiz tarmoqlar aynan shu yerda: `if (labs.isVulnerable('<id>')) { ... } else { ... }`.
4. **Models** — Sequelize modellari va bog‘lanishlar.

Xatolar `AppError(status, message, details)` orqali tashlanadi va markaziy `errorHandler` da qayta ishlanadi.

## Lab rejimlari mexanizmi

- `labs/labState.js` — har bir lab holati `lab_settings` jadvalida saqlanadi va xotirada keshlanadi.
- `isVulnerable(id)` — **production’da doimo `false`** (`config.labEnabled === false`).
- `PUT /api/labs/:id/mode` — lab rejimini almashtiradi (production’da 403).
- `labs/verifiers.js` — har bir lab uchun joriy servis/middleware funksiyalarini ma’lum xavfli kiritma bilan sinab, himoya ishlayotganini qaytaradi (ma’lumotlarni o‘zgartirmaydi).

## REST API

| Metod | Yo‘l | Tavsif | Auth |
|---|---|---|---|
| GET | /api/health | Holat va lab rejimlari | — |
| POST | /api/auth/register, /api/auth/login, /api/auth/logout | Autentifikatsiya | — |
| GET | /api/auth/me | Joriy foydalanuvchi | ✔ |
| GET | /api/auth/csrf | Anti-CSRF token | — |
| GET | /api/products?search=&category=&sort= | Katalog | — |
| GET | /api/products/categories, /api/products/:id | Kategoriyalar, mahsulot | — |
| POST | /api/products/:id/reviews · DELETE /api/reviews/:id | Sharhlar | ✔ |
| GET/POST/PATCH/DELETE | /api/cart, /api/cart/:itemId | Savatcha | ✔ |
| GET/POST | /api/orders, /api/orders/:id, /api/orders/:id/cancel | Buyurtmalar | ✔ |
| GET | /api/users/:id | Ochiq profil | — |
| PUT/POST/DELETE | /api/account/profile, /email, /password, /notice | Akkaunt | ✔ |
| GET | /api/files, /api/files/download?file= | Hujjatlar | — |
| * | /api/admin/stats, settings, users, products, orders | Admin | ✔ admin* |
| GET | /api/debug/config | Misconfiguration lab (xavfsiz rejimda 404) | — |
| * | /api/labs, /dashboard, /:id, /:id/mode, /:id/flag, /:id/verify, /:id/quiz, /modes, /progress, /students | Security Lab | ✔ |

\* Admin rol tekshiruvi Broken Access Control labining xavfsiz rejimida majburiy.

## Ma’lumotlar modeli

`users` 1—N `reviews`, `cart_items`, `orders`, `lab_progress`; `products` 1—N `reviews`, `cart_items`; `orders` 1—N `order_items`; `lab_settings(labId, vulnerable)`.
