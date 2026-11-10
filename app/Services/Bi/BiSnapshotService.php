<?php

namespace App\Services\Bi;

use App\Models\BiDailySnapshot;
use App\Models\Facility;
use App\Models\FinancialTransaction;
use App\Models\FoodOrder;
use App\Models\Inventory;
use App\Models\InventoryTransaction;
use App\Models\MenuItem;
use App\Models\Payment;
use App\Models\Reservation;
use App\Models\User;
use Carbon\Carbon;

/**
 * BiSnapshotService — Agregasi harian ringan untuk BI.
 * Diisi lewat command `bi:snapshot` (scheduler). Deterministik, tanpa LLM.
 * Membuat KPI cepat tersedia tanpa query berat di tiap render dashboard.
 */
class BiSnapshotService
{
    public function generateFor(Carbon $date): BiDailySnapshot
    {
        $day = $date->toDateString();
        $start = $date->copy()->startOfDay();
        $end = $date->copy()->endOfDay();

        $trans = FinancialTransaction::whereBetween('transaction_date', [$day, $day])->get();
        $revenue = (float) $trans->where('type', 'income')->sum('amount');
        $expense = (float) $trans->where('type', 'expense')->sum('amount');
        $refund = (float) $trans->where('type', 'expense')->where('category', 'refund')->sum('amount');
        $gatewayFee = (float) Payment::whereBetween('created_at', [$start, $end])
            ->where('payment_status', 'success')->sum('fee_merchant');

        $res = Reservation::whereBetween('created_at', [$start, $end])->get();
        $food = FoodOrder::whereBetween('created_at', [$start, $end])->get();
        $aov = $food->count() > 0 ? (float) $food->sum('total_amount') / $food->count() : 0;

        // Pelanggan: user pertama kali order di hari ini vs yang sudah pernah
        $userIds = $food->whereNotNull('user_id')->pluck('user_id')->unique();
        $newCust = 0;
        $returning = 0;
        foreach ($userIds as $uid) {
            $first = FoodOrder::where('user_id', $uid)->min('created_at');
            if ($first && Carbon::parse($first)->between($start, $end)) {
                $newCust++;
            } else {
                $returning++;
            }
        }

        // Stok: nilai & stockout.
        // GUARD DATA KOTOR (Jer): item "Kasbon*" dan placeholder stok raksasa
        // (>100rb) bukan barang dagang nyata — mereka mengacaukan nilai stok
        // (kasbon saja Rp1,35 T). Nilai stok dihitung HANYA dari barang wajar.
        $stockValue = 0;
        $stockout = 0;
        $suspicious = 0;
        foreach (Inventory::all() as $inv) {
            $isKasbon = str_contains(strtolower($inv->name), 'kasbon');
            $isAbnormal = (float) $inv->current_stock > 100000;
            if ($isKasbon || $isAbnormal) {
                $suspicious++;

                continue;
            }
            $stockValue += (float) $inv->current_stock * (float) ($inv->price_per_unit ?: 0);
            if ((float) $inv->current_stock <= 0) {
                $stockout++;
            }
        }
        $menuStockout = MenuItem::where('is_available', true)->where('current_stock', '<=', 0)->count();

        // Waste (adjustment keluar / loss)
        $waste = (float) InventoryTransaction::whereBetween('created_at', [$start, $end])
            ->where('type', 'adjustment')->where('quantity', '<', 0)->sum('cost');

        // Occupancy
        $facilities = Facility::all();
        $resOnDay = Reservation::where('check_in_date', $day)->whereIn('status', ['confirmed', 'completed'])->get();
        $capacityDays = max(1, $facilities->sum('capacity'));
        $occupied = (int) $resOnDay->sum('guest_count');
        $occupancy = $capacityDays > 0 ? round($occupied / $capacityDays * 100, 2) : 0;

        return BiDailySnapshot::updateOrCreate(
            ['date' => $day],
            [
                'revenue' => $revenue,
                'expense' => $expense,
                'net_profit' => $revenue - $expense,
                'avg_order_value' => $aov,
                'reservations_count' => $res->count(),
                'reservations_paid' => $res->where('payment_status', 'paid')->count(),
                'reservations_cancelled' => $res->where('status', 'cancelled')->count(),
                'food_orders_count' => $food->count(),
                'food_orders_paid' => $food->where('payment_status', 'paid')->count(),
                'food_orders_cancelled' => $food->where('status', 'cancelled')->count(),
                'visitors' => (int) $res->sum('guest_count'),
                'new_customers' => $newCust,
                'returning_customers' => $returning,
                'stock_value' => $stockValue,
                'stockout_count' => $stockout,
                'waste_value' => $waste,
                'occupancy_rate' => $occupancy,
                'refund_amount' => $refund,
                'gateway_fee' => $gatewayFee,
                'generated_at' => now(),
            ]
        );
    }

    /**
     * Generate snapshot untuk rentang tanggal. Batasi default 90 hari ke belakang.
     */
    public function generateRange(Carbon $from, Carbon $to): int
    {
        $count = 0;
        for ($d = $from->copy(); $d->lte($to); $d->addDay()) {
            $this->generateFor($d->copy());
            $count++;
        }

        return $count;
    }
}
