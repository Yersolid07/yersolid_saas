<?php

namespace App\Services\Bi;

use App\Models\Facility;
use App\Models\FinancialTransaction;
use App\Models\FoodOrder;
use App\Models\FoodOrderItem;
use App\Models\Inventory;
use App\Models\InventoryTransaction;
use App\Models\MenuItem;
use App\Models\Payment;
use App\Models\Reservation;
use App\Models\Review;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Collection;

/**
 * BiQueryService — SEMUA query data untuk Pusat Keputusan Bisnis.
 * Deterministik murni: tidak ada LLM, tidak ada random, tidak ada heuristik subjektif.
 * Setiap method menerima periode [Carbon $from, Carbon $to] dan channel filter.
 */
class BiQueryService
{
    // ─────────────────────────────────────────────────────────────
    // KPI KEUNGAN
    // ─────────────────────────────────────────────────────────────
    public function financial(Carbon $from, Carbon $to): array
    {
        $trans = FinancialTransaction::whereBetween('transaction_date', [$from->toDateString(), $to->toDateString()])->get();

        $income = $trans->where('type', 'income')->sum('amount');
        $expense = $trans->where('type', 'expense')->sum('amount');

        $revReservation = $trans->where('type', 'income')
            ->whereIn('category', ['reservation', 'reservation_dp', 'reservation_pelunasan'])->sum('amount');
        $revCafe = $trans->where('type', 'income')->where('category', 'cafe')->sum('amount');
        $revOther = $trans->where('type', 'income')
            ->whereNotIn('category', ['reservation', 'reservation_dp', 'reservation_pelunasan', 'cafe'])->sum('amount');

        // Breakdown cafe: makanan vs tiket berbasis order nyata (proporsi item).
        $orders = FoodOrder::with('items.menuItem')
            ->whereBetween('created_at', [$from, $to])
            ->where('payment_status', 'paid')->get();

        $foodSum = 0;
        $ticketSum = 0;
        foreach ($orders as $o) {
            foreach ($o->items as $it) {
                $sub = $it->price * $it->quantity;
                if ($it->menuItem && $it->menuItem->category === 'tiket') {
                    $ticketSum += $sub;
                } else {
                    $foodSum += $sub;
                }
            }
        }
        $totalItems = $foodSum + $ticketSum;
        $ticketRev = $totalItems > 0 ? ($ticketSum / $totalItems) * $revCafe : 0;
        $foodRev = $revCafe - $ticketRev;

        // Fee gateway & refund
        $gatewayFee = Payment::whereBetween('created_at', [$from, $to])
            ->where('payment_status', 'success')->sum('fee_merchant');
        $refund = $trans->where('type', 'expense')->where('category', 'refund')->sum('amount');

        // Metode pembayaran
        $payMethods = Payment::whereBetween('created_at', [$from, $to])
            ->where('payment_status', 'success')
            ->selectRaw('payment_method, COUNT(*) n, SUM(amount) total')
            ->groupBy('payment_method')->orderByDesc('total')->get()
            ->map(fn ($p) => ['method' => $p->payment_method ?: 'unknown', 'count' => (int) $p->n, 'total' => (float) $p->total]);

        // Kategori expense breakdown
        $expCat = $trans->where('type', 'expense')
            ->groupBy('category')
            ->map(fn ($g, $c) => ['category' => $c, 'amount' => (float) $g->sum('amount'), 'count' => $g->count()])
            ->sortByDesc('amount')->values()->all();

        $net = $income - $expense;

        return [
            'total_revenue' => (float) $income,
            'total_expense' => (float) $expense,
            'net_profit' => (float) $net,
            'gross_margin_pct' => $income > 0 ? round(($income - $expense) / $income * 100, 1) : 0,
            'revenue_reservations' => (float) $revReservation,
            'revenue_cafe' => (float) $revCafe,
            'revenue_food' => (float) $foodRev,
            'revenue_tickets' => (float) $ticketRev,
            'revenue_other' => (float) $revOther,
            'gateway_fee' => (float) $gatewayFee,
            'refund_amount' => (float) $refund,
            'payment_methods' => $payMethods,
            'expense_categories' => $expCat,
            'daily' => $this->financialDaily($trans),
        ];
    }

    private function financialDaily(Collection $trans): array
    {
        return $trans->groupBy(fn ($t) => Carbon::parse($t->transaction_date)->toDateString())
            ->map(fn ($g, $d) => [
                'date' => $d,
                'revenue' => (float) $g->where('type', 'income')->sum('amount'),
                'expense' => (float) $g->where('type', 'expense')->sum('amount'),
                'profit' => (float) $g->where('type', 'income')->sum('amount') - $g->where('type', 'expense')->sum('amount'),
            ])->values()->all();
    }

    // ─────────────────────────────────────────────────────────────
    // STOK / INVENTORI
    // ─────────────────────────────────────────────────────────────
    public function inventory(Carbon $from, Carbon $to): array
    {
        $movements = InventoryTransaction::whereBetween('created_at', [$from, $to])->get();

        $in = $movements->where('type', 'in');
        $out = $movements->where('type', 'out');
        $adj = $movements->where('type', 'adjustment');

        $items = Inventory::with('menuItem')->get();
        $stockValue = 0;
        $stockout = 0;
        $suspicious = [];
        $lowStock = [];
        $itemRows = [];

        foreach ($items as $inv) {
            // GUARD DATA KOTOR (Jer): item "Kasbon*" dan placeholder stok raksasa
            // (>100rb) bukan barang dagang nyata — mereka mengacaukan nilai stok
            // (kasbon saja Rp1,35 T). Dikumpulkan terpisah sebagai temuan.
            $isKasbon = str_contains(strtolower($inv->name), 'kasbon');
            $isAbnormal = (float) $inv->current_stock > 100000;
            if ($isKasbon || $isAbnormal) {
                $suspicious[] = [
                    'name' => $inv->name,
                    'stock' => (float) $inv->current_stock,
                    'price' => (float) ($inv->price_per_unit ?: 0),
                    'reason' => $isKasbon ? 'kasbon' : 'stok abnormal >100rb',
                    'location' => $inv->location,
                ];

                continue;
            }
            $value = (float) $inv->current_stock * (float) ($inv->price_per_unit ?: 0);
            $stockValue += $value;
            $isOut = (float) $inv->current_stock <= 0;
            if ($isOut) {
                $stockout++;
            }
            if ($inv->minimum_stock && (float) $inv->current_stock <= (float) $inv->minimum_stock) {
                $lowStock[] = [
                    'name' => $inv->name,
                    'stock' => (float) $inv->current_stock,
                    'min' => (float) $inv->minimum_stock,
                    'unit' => $inv->unit,
                    'location' => $inv->location,
                ];
            }
            $itemRows[] = [
                'name' => $inv->name,
                'location' => $inv->location,
                'unit' => $inv->unit,
                'current' => (float) $inv->current_stock,
                'min' => (float) $inv->minimum_stock,
                'value' => $value,
                'price_per_unit' => (float) ($inv->price_per_unit ?: 0),
            ];
        }

        // Menu stockout (current_stock <= 0 tapi aktif)
        $menuStockout = MenuItem::where('is_available', true)->where('current_stock', '<=', 0)
            ->get(['id', 'name', 'category', 'current_stock']);

        // Menu stok abnormal (> 100.000 — placeholder tanpa batas)
        $menuAbnormal = MenuItem::where('current_stock', '>', 100000)
            ->get(['id', 'name', 'category', 'current_stock', 'daily_stock']);

        return [
            'stock_value' => (float) $stockValue,
            'stockout_count' => $stockout,
            'suspicious_inventory' => $suspicious,
            'menu_stockout_count' => $menuStockout->count(),
            'menu_stockout' => $menuStockout,
            'menu_abnormal' => $menuAbnormal,
            'low_stock' => collect($lowStock)->sortBy(fn ($l) => $l['stock'] - $l['min'])->values(),
            'items' => collect($itemRows)->sortByDesc('value')->values(),
            'in_value' => (float) $in->sum('quantity'),
            'in_cost' => (float) $in->sum('cost'),
            'out_value' => (float) $out->sum('quantity'),
            'adjustment_value' => (float) $adj->sum('quantity'),
            'transactions' => $movements->sortByDesc('created_at')->take(20)->map(fn ($m) => [
                'name' => $m->inventory->name ?? 'Bahan dihapus',
                'type' => $m->type,
                'qty' => (float) $m->quantity,
                'cost' => (float) $m->cost,
                'stock_after' => (float) $m->stock_after,
                'user' => $m->user->name ?? '-',
                'at' => $m->created_at,
            ])->values(),
        ];
    }

    // ─────────────────────────────────────────────────────────────
    // MENU / PRODUK (popularitas × margin, BCG)
    // ─────────────────────────────────────────────────────────────
    public function menu(Carbon $from, Carbon $to): array
    {
        $rows = FoodOrderItem::with('menuItem')
            ->join('food_orders', 'food_order_items.order_id', '=', 'food_orders.id')
            ->whereBetween('food_orders.created_at', [$from, $to])
            ->where('food_orders.payment_status', 'paid')
            ->selectRaw('food_order_items.menu_item_id,
                SUM(food_order_items.quantity) as qty,
                SUM(food_order_items.quantity * food_order_items.price) as revenue')
            ->groupBy('food_order_items.menu_item_id')
            ->orderByDesc('qty')
            ->get();

        $menu = MenuItem::all()->keyBy('id');

        $list = $rows->filter(fn ($r) => $r->menu_item_id && $menu->has($r->menu_item_id))
            ->map(function ($r) use ($menu) {
                $mi = $menu[$r->menu_item_id];
                $price = (float) $mi->price ?: 1;
                $cost = (float) ($mi->cost_price ?: 0);
                $revenue = (float) $r->revenue;
                $gross = $revenue - ($cost * (int) $r->qty);
                $margin = $revenue > 0 ? $gross / $revenue * 100 : 0;

                return [
                    'id' => $mi->id,
                    'name' => $mi->name,
                    'category' => $mi->category,
                    'qty' => (int) $r->qty,
                    'revenue' => $revenue,
                    'price' => $price,
                    'cost' => $cost,
                    'gross_profit' => $gross,
                    'margin_pct' => round($margin, 1),
                ];
            });

        $maxQty = max(1, (int) $list->max('qty'));
        $maxMargin = max(1, (float) $list->max('margin_pct'));
        $avgMargin = $list->avg('margin_pct') ?: 0;

        // Kuadran BCG
        $quadrants = ['star' => [], 'cash_cow' => [], 'question' => [], 'dog' => []];
        foreach ($list as $item) {
            $popular = $item['qty'] >= $maxQty * 0.5;
            $profitable = $item['margin_pct'] >= $avgMargin;
            if ($popular && $profitable) {
                $quadrants['star'][] = $item;
            } elseif ($popular) {
                $quadrants['cash_cow'][] = $item;
            } elseif ($profitable) {
                $quadrants['question'][] = $item;
            } else {
                $quadrants['dog'][] = $item;
            }
        }

        return [
            'items' => $list->sortByDesc('revenue')->values(),
            'top' => $list->sortByDesc('qty')->take(10)->values(),
            'bottom' => $list->sortBy('qty')->take(5)->values(),
            'quadrants' => $quadrants,
            'avg_margin_pct' => round($avgMargin, 1),
            'cost_coverage_pct' => $list->where('cost', '>', 0)->count() > 0
                ? round($list->where('cost', '>', 0)->count() / $list->count() * 100, 1) : 0,
        ];
    }

    // ─────────────────────────────────────────────────────────────
    // PELANGGAN (RFM + funnel)
    // ─────────────────────────────────────────────────────────────
    public function customers(Carbon $from, Carbon $to): array
    {
        // Order per user_id (registered) + guest
        $orders = FoodOrder::whereBetween('created_at', [$from, $to])
            ->with('user')->get();

        $userOrders = $orders->filter(fn ($o) => $o->user_id);
        $guestOrders = $orders->filter(fn ($o) => ! $o->user_id);

        $uniqueUsers = $userOrders->pluck('user_id')->unique();
        $userCount = $uniqueUsers->count();

        // RFM sederhana: user aktif dalam periode
        $rfm = [];
        foreach ($uniqueUsers as $uid) {
            $uo = $userOrders->where('user_id', $uid);
            $rfm[$uid] = [
                'orders' => $uo->count(),
                'spend' => (float) $uo->sum('total_amount'),
                'last' => $uo->max('created_at'),
            ];
        }

        $repeat = collect($rfm)->filter(fn ($r) => $r['orders'] > 1);
        $repeatRate = $userCount > 0 ? round($repeat->count() / $userCount * 100, 1) : 0;

        // New vs returning dalam periode
        $newCustomers = 0;
        $returning = 0;
        foreach ($uniqueUsers as $uid) {
            $u = User::find($uid);
            if (! $u) {
                continue;
            }
            $firstOrder = FoodOrder::where('user_id', $uid)->min('created_at');
            $isNew = $firstOrder && Carbon::parse($firstOrder)->between($from, $to);
            if ($isNew) {
                $newCustomers++;
            } else {
                $returning++;
            }
        }

        // Reservasi: guest count sebagai visitors
        $res = Reservation::whereBetween('check_in_date', [$from->toDateString(), $to->toDateString()])->get();
        $visitors = (int) $res->sum('guest_count');

        // Funnel order web (jika channel web): keranjang→bayar approximated
        $aov = count($orders) > 0 ? (float) $orders->sum('total_amount') / count($orders) : 0;

        // Reviews
        $reviews = Review::where('is_public', true)->whereBetween('created_at', [$from, $to]);
        $avgRating = $reviews->avg('rating');
        $reviewCount = $reviews->count();

        return [
            'unique_customers' => $userCount,
            'guest_orders' => $guestOrders->count(),
            'total_orders' => $orders->count(),
            'avg_order_value' => $aov,
            'repeat_rate_pct' => $repeatRate,
            'new_customers' => $newCustomers,
            'returning_customers' => $returning,
            'visitors' => $visitors,
            'avg_rating' => $avgRating ? round((float) $avgRating, 2) : null,
            'review_count' => $reviewCount,
            'segments' => [
                'baru' => $newCustomers,
                'loyal' => $repeat->filter(fn ($r) => $r['orders'] >= 3)->count(),
                'berpotensi' => $repeat->filter(fn ($r) => $r['orders'] == 2)->count(),
                'berisiko' => $repeat->filter(fn ($r) => $r['orders'] >= 1)->count(),
            ],
        ];
    }

    // ─────────────────────────────────────────────────────────────
    // RESERVASI & FASILITAS (occupancy, revenue per unit)
    // ─────────────────────────────────────────────────────────────
    public function facilities(Carbon $from, Carbon $to): array
    {
        $facilities = Facility::all();
        $res = Reservation::whereBetween('check_in_date', [$from->toDateString(), $to->toDateString()])
            ->with('facility')->get();

        $rows = $facilities->map(function ($f) use ($res) {
            $fr = $res->where('facility_id', $f->id);
            $revenue = (float) $fr->sum('total_amount');
            $paid = $fr->where('payment_status', 'paid')->count();
            $cancelled = $fr->where('status', 'cancelled')->count();

            return [
                'id' => $f->id,
                'name' => $f->name,
                'type' => $f->type,
                'capacity' => (int) $f->capacity,
                'reservations' => $fr->count(),
                'paid' => $paid,
                'cancelled' => $cancelled,
                'revenue' => $revenue,
                'cancellation_rate_pct' => $fr->count() > 0 ? round($cancelled / $fr->count() * 100, 1) : 0,
            ];
        })->sortByDesc('revenue')->values()->all();

        // Occupancy: hari terisi / hari tersedia (kapasitas × hari periode)
        $days = max(1, (int) $from->diffInDays($to) + 1);
        $totalCapacityDays = $facilities->sum('capacity') * $days;
        $occupiedUnitDays = $res->whereIn('status', ['confirmed', 'completed'])->sum('guest_count');
        $occupancy = $totalCapacityDays > 0 ? round($occupiedUnitDays / $totalCapacityDays * 100, 2) : 0;

        return [
            'rows' => $rows,
            'total_reservations' => $res->count(),
            'confirmed' => $res->where('status', 'confirmed')->count(),
            'cancelled' => $res->where('status', 'cancelled')->count(),
            'completed' => $res->where('status', 'completed')->count(),
            'cancellation_rate_pct' => $res->count() > 0 ? round($res->where('status', 'cancelled')->count() / $res->count() * 100, 1) : 0,
            'occupancy_rate_pct' => $occupancy,
            'revenue_per_available' => $totalCapacityDays > 0 ? round(collect($rows)->sum('revenue') / $totalCapacityDays, 0) : 0,
        ];
    }

    // ─────────────────────────────────────────────────────────────
    // OPERASIONAL (jam sibuk, waktu proses, beban dapur)
    // ─────────────────────────────────────────────────────────────
    public function operations(Carbon $from, Carbon $to): array
    {
        $orders = FoodOrder::whereBetween('created_at', [$from, $to])->get();

        // Pesanan per jam (hari 0-6)
        $heatmap = array_fill(0, 7, array_fill(0, 24, 0));
        foreach ($orders as $o) {
            $d = (int) $o->created_at->dayOfWeek;
            $h = (int) $o->created_at->hour;
            $heatmap[$d][$h]++;
        }

        // Waktu proses rata-rata: created_at → updated_at (approximation)
        $prepTimes = $orders->filter(fn ($o) => $o->status === 'delivered' || $o->status === 'completed')
            ->map(fn ($o) => (int) $o->created_at->diffInMinutes($o->updated_at))
            ->filter(fn ($m) => $m > 0);
        $avgPrep = $prepTimes->count() > 0 ? round($prepTimes->avg(), 1) : 0;

        // Pesanan pending lama (hanya yang masuk akal — backlog > 24 jam dianggap
        // data basi dan di-flag, bukan ditampilkan sebagai "tertunda aktif").
        $staleAll = FoodOrder::whereIn('status', ['pending', 'preparing', 'ready'])
            ->where('payment_status', 'paid')
            ->where('created_at', '<', now()->subMinutes(15))
            ->with('user')->get(['id', 'status', 'created_at', 'total_amount', 'user_id']);

        $staleOrders = $staleAll->filter(fn ($o) => $o->created_at->diffInMinutes(now()) < 24 * 60)
            ->map(fn ($o) => [
                'id' => $o->id,
                'status' => $o->status,
                'minutes' => (int) $o->created_at->diffInMinutes(now()),
                'total' => (float) $o->total_amount,
            ])->values();

        // Backlog basi (>24 jam) — data kualitas rendah yang perlu ditindaklanjuti
        $backlog = $staleAll->filter(fn ($o) => $o->created_at->diffInMinutes(now()) >= 24 * 60)->count();

        // Beban per status
        $byStatus = $orders->groupBy('status')->map->count();

        return [
            'heatmap' => $heatmap,
            'avg_prep_minutes' => $avgPrep,
            'stale_orders' => $staleOrders,
            'stale_count' => $staleOrders->count(),
            'backlog_days_old' => $backlog,
            'orders_by_status' => $byStatus,
            'total_orders' => $orders->count(),
        ];
    }

    // ─────────────────────────────────────────────────────────────
    // RISIKO & KUALITAS DATA
    // ─────────────────────────────────────────────────────────────
    public function risks(Carbon $from, Carbon $to): array
    {
        $risks = [];

        // 1. Menu stok 0 tapi aktif
        $stockout = MenuItem::where('is_available', true)->where('current_stock', '<=', 0)->count();
        if ($stockout > 0) {
            $risks[] = ['key' => 'stockout', 'severity' => $stockout > 10 ? 'critical' : 'warning',
                'title' => "{$stockout} menu stok habis tapi masih aktif",
                'action' => 'Isi stok di Stok Harian Cafe, atau nonaktifkan menu yang memang habis total.'];
        }

        // 2. Data stok abnormal (>100rb placeholder)
        $abnormal = MenuItem::where('current_stock', '>', 100000)->count();
        if ($abnormal > 0) {
            $risks[] = ['key' => 'abnormal', 'severity' => 'warning',
                'title' => "{$abnormal} menu punya stok > 100rb (placeholder tanpa batas)",
                'action' => 'Konfirmasi apakah ini memang tak-terbatas; pertimbangkan daily_stock = null untuk item tersebut.'];
        }

        // 3. Pembayaran pending lama
        $pending = Payment::where('payment_status', 'pending')
            ->where('created_at', '<', now()->subHours(24))->count();
        if ($pending > 0) {
            $risks[] = ['key' => 'pending_pay', 'severity' => $pending > 10 ? 'warning' : 'info',
                'title' => "{$pending} pembayaran pending > 24 jam",
                'action' => 'Hubungi pelanggan atau tandai gagal bila kedaluwarsa.'];
        }

        // 4. Order lama belum selesai (hanya backlog aktif < 24 jam)
        $stale = FoodOrder::whereIn('status', ['pending', 'preparing', 'ready'])
            ->where('payment_status', 'paid')
            ->where('created_at', '<', now()->subMinutes(15))
            ->where('created_at', '>', now()->subHours(24))->count();
        if ($stale > 0) {
            $risks[] = ['key' => 'stale_order', 'severity' => $stale > 5 ? 'warning' : 'info',
                'title' => "{$stale} pesanan dibayar tapi > 15 menit belum selesai",
                'action' => 'Cek Monitor Dapur; pastikan dapur tidak kewalahan.'];
        }

        // 5. Expense melonjak vs periode sebelumnya
        $curExp = FinancialTransaction::where('type', 'expense')->whereBetween('transaction_date', [$from->toDateString(), $to->toDateString()])->sum('amount');
        $prevFrom = $from->copy()->subDays($from->diffInDays($to) + 1);
        $prevTo = $from->copy()->subDay();
        $prevExp = FinancialTransaction::where('type', 'expense')->whereBetween('transaction_date', [$prevFrom->toDateString(), $prevTo->toDateString()])->sum('amount');
        if ($prevExp > 0) {
            $chg = ($curExp - $prevExp) / $prevExp * 100;
            if ($chg > 25) {
                $risks[] = ['key' => 'expense_surge', 'severity' => 'warning',
                    'title' => 'Pengeluaran naik '.round($chg, 1).'% vs periode sebelumnya',
                    'action' => 'Periksa kategori expense terbesar (lihat tab Keuangan).'];
            }
        }

        // 6. Reservasi unpaid mendekati check-in
        $near = Reservation::where('payment_status', 'unpaid')
            ->whereIn('status', ['confirmed', 'pending'])
            ->whereBetween('check_in_date', [now()->toDateString(), now()->addDays(2)->toDateString()])->count();
        if ($near > 0) {
            $risks[] = ['key' => 'unpaid_near', 'severity' => 'info',
                'title' => "{$near} reservasi belum lunas dalam 2 hari ke depan",
                'action' => 'Hubungi tamu untuk pelunasan sebelum check-in.'];
        }

        // 7. Inventory adjustment sering (data quality)
        $adj = InventoryTransaction::where('type', 'adjustment')->whereBetween('created_at', [$from, $to])->count();
        if ($adj > 10) {
            $risks[] = ['key' => 'many_adjust', 'severity' => 'info',
                'title' => "{$adj} penyesuaian stok manual periode ini",
                'action' => 'Selisih stok sering menandakan pencatatan kurang rapi; cek ulang SOP gudang.'];
        }

        // 8. Refund besar
        $refund = FinancialTransaction::where('type', 'expense')->where('category', 'refund')->whereBetween('transaction_date', [$from->toDateString(), $to->toDateString()])->sum('amount');
        if ($refund > 1000000) {
            $risks[] = ['key' => 'big_refund', 'severity' => 'warning',
                'title' => 'Refund Rp'.number_format($refund, 0, ',', '.').' periode ini',
                'action' => 'Kaji penyebab refund (menu tidak tersedia, pembatalan, kualitas).'];
        }

        return collect($risks)->sortByDesc(fn ($r) => $r['severity'] === 'critical' ? 2 : ($r['severity'] === 'warning' ? 1 : 0))->values()->all();
    }
}
