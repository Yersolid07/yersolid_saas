# Restaurant & Resort Management System

<p align="center">
  <b>All-in-One POS, Kitchen Display, Reservation, Facility Booking, QR Table, Inventory & BI</b><br>
  <i>Laravel 12 · Inertia.js · React 19 · Tailwind CSS · MySQL · Spatie Permission</i>
</p>

---

## 🌐 English

Modern, production-ready management system for restaurants, cafés, resorts, and recreation venues.
One codebase covers front-of-house (POS, reservations, QR-table ordering), back-of-house (KDS,
inventory, purchasing), and management (reports, BI dashboard, roles).

### Features
- **Point of Sale (POS)** — dine-in / takeaway, smart cart, cash calculation, thermal receipt printing
- **Kitchen Display System (KDS)** — real-time order queue (paid orders only), bump/timer
- **Reservations** — gazebos, tables, day-use, coupons, online payment (Tripay)
- **QR Table Ordering** — per-table QR codes, guest order without app
- **Ticketing** — separate ticket cashier (attraction tickets)
- **Facility booking** — pools, villas, gazebos, booked-date calendar
- **Inventory** — warehouse + café stock, in/out transactions, low-stock alerts, daily stock
- **Financial reports** — ledger, P&L, comprehensive / cafe / inventory / reservation reports (PDF & Excel)
- **BI Dashboard** — HPP (COGS), revenue trends, KPIs, decision center
- **Roles** — admin / manager / staff / customer / guest (Spatie Permission)
- **Invoicing & notifications** — printable invoice, email/WhatsApp templates
- **Multi-language ready** — Indonesian UI, English docs

### Tech stack
| Layer | Tech |
|---|---|
| Backend | Laravel 12, PHP 8.2+ |
| Frontend | Inertia.js, React 19, Tailwind CSS, Framer Motion |
| DB | MySQL 8 / MariaDB (SQLite for dev) |
| Cache / Queue / WS | Redis (optional), database fallback, Laravel Reverb |
| Payment | Tripay (VA, QRIS, retail, e-wallet) |
| Print | ESC/POS Bluetooth + browser print |
| Auth | Laravel Breeze + Spatie Permission + Google OAuth |

### Quick install
See [`INSTALL.md`](INSTALL.md) (English) or [`INSTALL.id.md`](INSTALL.id.md) (Bahasa Indonesia).

```bash
composer install && npm install
cp .env.example .env && php artisan key:generate
php artisan migrate --seed
npm run build
php artisan serve
```

### License
MIT — see [`LICENSE`](LICENSE). Commercial tiers (Basic / Pro / Extended) are sold separately on Gumroad;
see `LICENSE_TIERS.md`.

---

## 🇮🇩 Bahasa Indonesia

Sistem manajemen restoran, kafe, resor, dan tempat rekreasi all-in-one yang siap produksi.
Satu codebase mencakup front-of-house (POS, reservasi, pesan via QR meja), back-of-house
(KDS dapur, inventori, pembelian), dan manajemen (laporan, dasbor BI, hak akses per peran).

### Fitur Unggulan
- **Point of Sale (POS)** — dine-in / bawa pulang, keranjang pintar, kalkulator kembalian, cetak struk termal
- **Kitchen Display System (KDS)** — antrean pesanan real-time (hanya yang sudah bayar), bump/timer
- **Reservasi** — gazebo, meja, day-use, kupon, pembayaran online (Tripay)
- **Pesan via QR Meja** — QR code per meja, tamu pesan tanpa aplikasi
- **Tiket** — kasir tiket terpisah (tiket wahana)
- **Pemesanan fasilitas** — kolam, villa, gazebo, kalender tanggal terisi
- **Inventori** — gudang + stok kafe, transaksi masuk/keluar, peringatan stok tipis, stok harian
- **Laporan keuangan** — buku besar, laba-rugi, laporan komprehensif / kafe / inventori / reservasi (PDF & Excel)
- **Dasbor BI** — HPP, tren pendapatan, KPI, pusat keputusan
- **Peran** — admin / manager / staff / customer / guest (Spatie Permission)
- **Faktur & notifikasi** — faktur cetak, template email/WhatsApp
- **Siap multi-bahasa** — UI Bahasa Indonesia, dokumentasi EN/ID

### Tech stack
| Lapisan | Teknologi |
|---|---|
| Backend | Laravel 12, PHP 8.2+ |
| Frontend | Inertia.js, React 19, Tailwind CSS, Framer Motion |
| DB | MySQL 8 / MariaDB (SQLite untuk dev) |
| Cache / Queue / WS | Redis (opsional), fallback database, Laravel Reverb |
| Pembayaran | Tripay (VA, QRIS, retail, e-wallet) |
| Cetak | ESC/POS Bluetooth + print browser |
| Auth | Laravel Breeze + Spatie Permission + Google OAuth |

### Instalasi cepat
Lihat [`INSTALL.id.md`](INSTALL.id.md) (Bahasa Indonesia) atau [`INSTALL.md`](INSTALL.md) (English).

```bash
composer install && npm install
cp .env.example .env && php artisan key:generate
php artisan migrate --seed
npm run build
php artisan serve
```

### Lisensi
MIT — lihat [`LICENSE`](LICENSE). Tier komersial (Basic / Pro / Extended) dijual terpisah di Gumroad;
lihat `LICENSE_TIERS.md`.
