# O‘rnatish (INSTALLATION)

## Talablar

| Usul | Talab |
|---|---|
| Docker | Docker Desktop 4.x+ (Compose v2) |
| Lokal | Node.js 18+ (20 tavsiya), npm 9+; MySQL ixtiyoriy (SQLite bilan ham ishlaydi) |

## 1-usul: Docker Compose

```bash
docker compose up --build
```

- Frontend: http://localhost:8080
- API (Burp/Postman uchun): http://localhost:4000/api
- MySQL tashqariga ochilmaydi (faqat ichki tarmoq).

Birinchi ishga tushishda ma’lumotlar bazasi avtomatik yaratiladi va sun’iy ma’lumotlar bilan to‘ldiriladi.

Foydali buyruqlar:

```bash
docker compose logs -f backend
```
```bash
docker compose down
```
```bash
docker compose down -v
```
(`-v` — ma’lumotlar bazasini butunlay tozalaydi; keyingi ishga tushishda qayta seed qilinadi.)

Production (barcha lablar xavfsiz) rejimida ishga tushirish:

```bash
APP_MODE=production JWT_SECRET=$(openssl rand -hex 32) docker compose up --build
```

## 2-usul: Lokal (Docker’siz)

### Backend

```bash
cd backend
npm install
cp .env.example .env
```

`.env` faylida `DB_DIALECT=sqlite` qilsangiz MySQL kerak emas (fayl: `backend/vulnshop.sqlite`). MySQL ishlatish uchun `DB_DIALECT=mysql` va `DB_*` qiymatlarini sozlang.

> npm 11 `sqlite3` o‘rnatish skriptini bloklashi mumkin. Agar “Could not locate the bindings file” xatosi chiqsa: `npm install-scripts approve sqlite3 && npm rebuild sqlite3`.

```bash
npm start
```

API: http://127.0.0.1:4000/api. Ma’lumotlarni qayta yaratish: `npm run seed`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Ilova: http://localhost:5173 (`/api` so‘rovlari backendga proxy qilinadi).

## Test akkauntlari (sun’iy)

| Email | Parol | Rol | Izoh |
|---|---|---|---|
| admin@vulnshop.local | `Admin#VulnShop2026` | admin | Instruktor / administrator |
| alice@vulnshop.local | `Wonderland#2026` | customer | Asosiy o‘quvchi akkaunti |
| bob@vulnshop.local | `Builder#Shop2026` | customer | Ikkinchi foydalanuvchi (IDOR/BAC taqqoslash) |

Boshqa seed akkauntlar laboratoriyalarning bir qismi — ularni o‘quvchilar o‘zlari aniqlashlari kerak. O‘zingiz ham istalgancha akkaunt yaratishingiz mumkin (faqat `@vulnshop.local` kabi sun’iy emaillar).

## Muammolarni hal qilish

| Belgi | Yechim |
|---|---|
| `403 VulnShop lab rejimida faqat localhost orqali ishlaydi` | Ilovani `localhost` yoki `127.0.0.1` orqali oching. Boshqa hostname kerak bo‘lsa `EXTRA_ALLOWED_HOSTS` ga qo‘shing. |
| Backend `HOST=... ruxsat etilmaydi` deb to‘xtaydi | Lab rejimida faqat loopback ga bog‘lanish mumkin. `HOST=127.0.0.1` qiling. |
| Docker’da backend `db` ni kutib qoladi | MySQL birinchi ishga tushishi 30–60 soniya oladi; `docker compose logs db`. |
| Lab rejimini almashtirgandan keyin tizimdan chiqib ketdim | Broken Auth labi token formatini o‘zgartiradi. Ilova yangi token beradi; muammo bo‘lsa qayta kiring. |
| Port band | `docker-compose.yml` dagi `127.0.0.1:8080` yoki `127.0.0.1:4000` ni o‘zgartiring (host_ip ni o‘zgartirmang!). |
