# Instruktor qo‘llanmasi

> Bu hujjat javoblar kalitini o‘z ichiga oladi — o‘quvchilarga tarqatmang.

## Darsni tayyorlash

1. Har bir o‘quvchi o‘z kompyuterida alohida nusxa ishga tushiradi (`docker compose up --build`). Lab bitta o‘quvchiga mo‘ljallangan: rejimlar global, lekin progress foydalanuvchi bo‘yicha saqlanadi.
2. Instruktor `admin@vulnshop.local` (parol INSTALLATION.md da) bilan kiradi va **O‘quvchilar progressi** sahifasidan foydalanadi.
3. Boshlang‘ich holatga qaytarish: Lab Dashboard → “Hammasini zaif” + “Progressni tozalash”, yoki `docker compose down -v` (yoki lokalda `npm run seed`).

## Tavsiya etilgan kurs rejasi (10 dars × 90 daqiqa)

| Dars | Lab | Asosiy mavzu |
|---|---|---|
| 1 | Kirish + Misconfiguration | Lab muhiti, DevTools, sarlavhalar auditi |
| 2 | BAC | Authentication vs Authorization |
| 3 | IDOR | Obyekt darajasidagi avtorizatsiya |
| 4 | Sensitive Data Exposure | DTO, ma’lumotlar tasnifi |
| 5 | Weak Password Policy | NIST 800-63B, xeshlash |
| 6 | Broken Authentication | JWT tuzilmasi va tekshiruvi |
| 7 | SQL Injection | Parametrlangan so‘rovlar |
| 8 | XSS | Output encoding, CSP, HttpOnly |
| 9 | CSRF | Same-site vs same-origin, tokenlar |
| 10 | Path Traversal + yakuniy hisobot | Kanonik yo‘llar; hisobot taqdimoti |

## Baholash

| Mezon | Ulush |
|---|---|
| Topilgan flaglar | 40% |
| Tasdiqlangan tuzatishlar | 20% |
| Quiz natijalari | 15% |
| Yozma hisobot (STUDENT_GUIDE shabloni) | 15% |
| Uy vazifalari | 10% |

## Javoblar kaliti: flaglar va ularning joylashuvi

Flaglar `backend/src/labs/flags.js` da ham saqlangan.

| Lab | Flag | Qayerda |
|---|---|---|
| sqli | `VULNSHOP{un10n_s3l3ct_h1dd3n_pr0duct}` | Chop etilmagan “Prototype X” mahsulotining tavsifi |
| xss | `VULNSHOP{c00k13_th3ft_v14_st0r3d_xss}` | HttpOnly bo‘lmagan `vs_support_session` cookie qiymati |
| bac | `VULNSHOP{m1ss1ng_funct10n_l3v3l_4uthz}` | `/api/admin/settings` → `internalFlag` |
| idor | `VULNSHOP{0rd3r_numb3r_1_b3l0ngs_t0_4dm1n}` | Administratorning 1-buyurtmasi izohi |
| broken-auth | `VULNSHOP{alg_n0n3_f0rg3d_c30_t0k3n}` | Parol bilan kirib bo‘lmaydigan CEO akkauntining `privateNote` maydoni (`/api/auth/me`) |
| weak-password | `VULNSHOP{123456_1s_n0t_4_p4ssw0rd}` | Support akkauntining `privateNote` maydoni |
| misconfig | `VULNSHOP{d3bug_3ndp01nt_l34ks_c0nf1g}` | `/api/debug/config` → `internalFlag` |
| sensitive-data | `VULNSHOP{4p1_r3turns_t00_much_d4t4}` | Administrator akkauntining `apiKey` maydoni (ochiq profil API’si) |
| csrf | `VULNSHOP{cr0ss_s1t3_3m41l_ch4ng3}` | Cookie bilan, boshqa origin’dan kelgan email o‘zgartirish so‘rovidan keyin profil bildirishnomasi |
| path-traversal | `VULNSHOP{d0t_d0t_sl4sh_3sc4p3}` | `backend/storage/private/flag.txt` |

### Seed akkauntlari (to‘liq ro‘yxat)

| Email | Parol | Lab bilan bog‘liqligi |
|---|---|---|
| admin@vulnshop.local | `Admin#VulnShop2026` | Instruktor |
| alice@vulnshop.local | `Wonderland#2026` | O‘quvchi |
| bob@vulnshop.local | `Builder#Shop2026` | Ikkinchi foydalanuvchi |
| support@vulnshop.local | keng tarqalgan zaif parol (seed.js) | Weak Password |
| legacy@vulnshop.local | tuzsiz MD5 (seed.js) | Sensitive Data (xeshlash muhokamasi) |
| ceo@vulnshop.local | tasodifiy, noma’lum | Broken Authentication |

## Muhokama uchun savollar

- Nima uchun bir nechta “kichik” xato (masalan, XSS + HttpOnly yo‘qligi + batafsil xatolar) birgalikda jiddiy oqibatga olib keladi?
- Qaysi himoyalar defense in depth, qaysilari asosiy nazorat?
- Lab’ning o‘z xavfsizlik cheklovlari (localhost guard, sandbox) qaysi real amaliyotlarga o‘xshaydi?

## Kengaytirish

Yangi lab qo‘shish: `labs/registry.js` ga metadata, `labs/flags.js` ga flag, `labs/content/<id>.js` + `content/index.js`, `labs/verifiers.js` ga verifier, servisda `labs.isVulnerable('<id>')` tarmog‘i va `tests/labs.test.js` ga regressiya testi.

## Xavfsizlik eslatmasi

Ilovani umumiy tarmoqqa yoki internetga ochmang. `docker-compose.yml` dagi `127.0.0.1` bog‘lanishlarini o‘zgartirmang. Sinf serverida markazlashgan nusxa kerak bo‘lsa, uni izolyatsiyalangan VLAN’da va `APP_MODE=lab` bilan faqat dars vaqtida ishlating.
