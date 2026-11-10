# Installation Guide — Bahasa Indonesia

Paket ini berupa codebase Laravel 12 + Inertia (React 19) yang sudah bersih. Tidak ada data, foto,
atau kredensial khusus venue tertentu — konten demo dibuat oleh seeder dan bersifat generik.

## Kebutuhan
- PHP >= 8.2 (diuji dengan PHP 8.4)
- MySQL 8 / MariaDB 10.6+ (atau SQLite untuk uji cepat)
- Node.js >= 20
- Composer 2
- Redis (opsional untuk cache/broadcast; jika tidak ada, fallback ke cache database)

## Langkah

1. **Install dependensi**
   ```bash
   composer install
   npm install
   ```

2. **Setup environment**
   ```bash
   cp .env.example .env
   php artisan key:generate
   ```
   Edit `.env`:
   - `APP_URL` — domain Anda
   - `DB_*` — kredensial database Anda
   - `TRIPAY_*` — (opsional) kunci payment gateway Tripay jika ingin pembayaran online

3. **Database**
   ```bash
   php artisan migrate --seed
   ```
   Seeder membuat role/permission, pengaturan demo, dan user demo dengan email **example.com**
   (password default `password` — segera ganti).

4. **Build frontend**
   ```bash
   npm run build
   ```

5. **Storage link (untuk upload gambar)**
   ```bash
   php artisan storage:link
   ```

6. **Jalankan**
   ```bash
   php artisan serve
   ```
   Atau arahkan vhost nginx ke `public/`.

## Catatan Produksi
- Set `APP_ENV=production`, `APP_DEBUG=false`.
- Queue worker: `php artisan queue:work` (atau pakai `ecosystem.config.cjs` dengan pm2).
- Scheduler: `php artisan schedule:work`.
- Reverb (websocket, opsional): `php artisan reverb:start`.
- HTTPS via Cloudflare atau Let's Encrypt; set `SESSION_SECURE_COOKIE=true` hanya di atas HTTPS.

## Login pertama
Setelah `php artisan migrate --seed`, login dengan admin demo dari `AdminUserSeeder`
(email berakhiran `@example.com`, password `password`). Segera ganti password dan email.
