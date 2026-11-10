<?php

namespace App\Services\Bi;

use Carbon\Carbon;

/**
 * BiInsightService — Menghasilkan insight & rekomendasi ACTIONABLE dari data.
 * Murni rules-based (deterministik). TIDAK ada LLM di sini.
 * Setiap insight punya: type (peluang/perhatian/risiko/test), severity, judul, detail, tindakan.
 */
class BiInsightService
{
    public function generate(array $fin, array $menu, array $cust, array $fac, array $ops, array $inv, Carbon $from, Carbon $to): array
    {
        $insights = [];

        // ── Keuangan ────────────────────────────────────────────
        $daily = collect($fin['daily'] ?? []);
        $weekdays = $daily->filter(fn ($d) => in_array(Carbon::parse($d['date'])->dayOfWeek, [5, 6, 0]));
        $totalRevenue = (float) $fin['total_revenue'];
        $weekdayRevenue = (float) $weekdays->sum('revenue');
        $weekdayShare = $totalRevenue > 0 ? $weekdayRevenue / $totalRevenue * 100 : 0;
        if ($weekdayShare > 35) {
            $insights[] = [
                'type' => 'peluang', 'severity' => 'success',
                'title' => 'Akhir pekan menyumbang '.round($weekdayShare, 0).'% omzet',
                'detail' => 'Jumat–Minggu adalah puncak. Siapkan stok bahan utama 1 hari sebelumnya dan tambah staf dapur.',
                'action' => 'Rencanakan pembelian besar di hari Kamis, rotasi staf pada Jumat–Minggu.',
            ];
        }

        if ($fin['gross_margin_pct'] < 25) {
            $insights[] = [
                'type' => 'perhatian', 'severity' => 'warning',
                'title' => 'Margin kotor hanya '.$fin['gross_margin_pct'].'%',
                'detail' => 'Margin < 25% artinya biaya makan atau pengeluaran terlalu tinggi relatif omzet.',
                'action' => 'Audit kategori expense terbesar dan harga pokok menu yang paling banyak terjual.',
            ];
        }

        if ($fin['refund_amount'] > 500000) {
            $insights[] = [
                'type' => 'risiko', 'severity' => 'danger',
                'title' => 'Refund Rp'.number_format((float) $fin['refund_amount'], 0, ',', '.').' periode ini',
                'detail' => 'Refund besar mengindikasikan masalah layanan atau ketersediaan menu.',
                'action' => 'Kaji penyebab refund dari riwayat pesanan; perbaiki proses sebelum jadi kebiasaan.',
            ];
        }

        // ── Menu ────────────────────────────────────────────────
        $top = collect($menu['top'] ?? []);
        if ($top->count() > 0) {
            $t = $top->first();
            $insights[] = [
                'type' => 'peluang', 'severity' => 'success',
                'title' => '“'.$t['name'].'” menu terlaris ('.$t['qty'].' porsi)',
                'detail' => 'Produk andalan ini wajib stoknya selalu aman; jangan sampai habis saat puncak.',
                'action' => 'Pastikan stok bahan baku produk ini cukup sebelum akhir pekan.',
            ];
        }

        $cashCows = $menu['quadrants']['cash_cow'] ?? [];
        if (count($cashCows) > 0) {
            $cc = $cashCows[0];
            $insights[] = [
                'type' => 'perhatian', 'severity' => 'warning',
                'title' => '“'.$cc['name'].'” laris tapi margin tipis ('.$cc['margin_pct'].'%)',
                'detail' => 'Menu ini banyak terjual tapi keuntungan per porsi kecil. Naikkan harga kecil atau efisiensi bahan.',
                'action' => 'Evaluasi harga pokok; negosiasi pemasok; uji kenaikan harga 5–10%.',
            ];
        }

        $questions = $menu['quadrants']['question'] ?? [];
        if (count($questions) > 0) {
            $q = $questions[0];
            $insights[] = [
                'type' => 'test', 'severity' => 'info',
                'title' => '“'.$q['name'].'” margin bagus ('.$q['margin_pct'].'%) tapi kurang laku',
                'detail' => 'Potensi untung besar belum dimanfaatkan. Coba promosi atau bundling.',
                'action' => 'Uji sebagai paket atau rekomendasi pelayan selama 2 minggu, ukur kenaikan penjualan.',
            ];
        }

        $dogs = $menu['quadrants']['dog'] ?? [];
        if (count($dogs) > 2) {
            $insights[] = [
                'type' => 'perhatian', 'severity' => 'warning',
                'title' => count($dogs).' menu kurang laku & margin rendah',
                'detail' => 'Menu ini mengikat modal stok dan tenaga tanpa hasil. Evaluasi resep atau pensiunkan.',
                'action' => 'Pertimbangkan hapus/ubah resep, atau jadikan menu musiman saja.',
            ];
        }

        // ── Pelanggan ───────────────────────────────────────────
        if ($cust['repeat_rate_pct'] < 30 && $cust['unique_customers'] > 0) {
            $insights[] = [
                'type' => 'perhatian', 'severity' => 'warning',
                'title' => 'Tingkat pelanggan kembali '.$cust['repeat_rate_pct'].'%',
                'detail' => 'Banyak pelanggan sekali datang. Belum ada alasan untuk kembali.',
                'action' => 'Program kunjungan ke-N, voucher personal, atau menu musiman yang memancing repeat.',
            ];
        }

        if ($cust['avg_rating'] !== null && $cust['avg_rating'] < 4.3) {
            $insights[] = [
                'type' => 'risiko', 'severity' => 'danger',
                'title' => 'Rating rata-rata '.$cust['avg_rating'].' (dari '.$cust['review_count'].' ulasan)',
                'detail' => 'Rating < 4.3 perlu ditindaklanjuti; ulasan negatif tak terdeteksi lebih lama lagi.',
                'action' => 'Notifikasi ulasan ≤3 bintang dalam 24 jam; follow-up service recovery.',
            ];
        }

        // ── Operasional ─────────────────────────────────────────
        if ($ops['stale_count'] > 0) {
            $insights[] = [
                'type' => 'risiko', 'severity' => $ops['stale_count'] > 5 ? 'danger' : 'warning',
                'title' => $ops['stale_count'].' pesanan dibayar tapi belum selesai > 15 menit',
                'detail' => 'Dapur mungkin kewalahan atau ada order yang terlewat. Cek Monitor Dapur.',
                'action' => 'Periksa antrean dapur; tambah staf pada jam sibuk bila berulang.',
            ];
        }

        // ── Stok ────────────────────────────────────────────────
        if ($inv['menu_stockout_count'] > 0) {
            $insights[] = [
                'type' => 'risiko', 'severity' => $inv['menu_stockout_count'] > 10 ? 'danger' : 'warning',
                'title' => $inv['menu_stockout_count'].' menu stok habis tapi masih aktif',
                'detail' => 'Menu tampil di POS tapi akan gagal saat dipesan; bikin pengalaman buruk.',
                'action' => 'Isi stok atau nonaktifkan menu yang memang habis.',
            ];
        }

        if ($inv['low_stock']->count() > 0) {
            $insights[] = [
                'type' => 'perhatian', 'severity' => 'warning',
                'title' => $inv['low_stock']->count().' bahan di bawah stok minimum',
                'detail' => $inv['low_stock']->take(3)->map(fn ($l) => $l['name'].' ('.$l['stock'].' '.$l['unit'].')')->implode(', ').($inv['low_stock']->count() > 3 ? '…' : ''),
                'action' => 'Susun daftar belanja prioritas untuk bahan-bahan ini.',
            ];
        }

        return $insights;
    }
}
