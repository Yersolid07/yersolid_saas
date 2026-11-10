<?php

namespace App\Http\Controllers\Staff;

use App\Http\Controllers\Controller;
use App\Models\FinancialTransaction;
use App\Models\FoodOrder;
use App\Models\FoodOrderItem;
use App\Models\Payment;
use App\Models\User;
use App\Notifications\FoodOrderStatusUpdated;
use App\Notifications\NewFoodOrder;
use App\Services\StockService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Notification;
use Inertia\Inertia;
use Inertia\Response;

class FoodOrderController extends Controller
{
    public function index(Request $request): Response
    {
        // Query dasar: pesanan lunas ATAU punya user staff/admin/manager
        $baseQuery = function () {
            return FoodOrder::with(['items.menuItem', 'reservation.facility', 'user'])
                ->where(function ($query) {
                    $query->where('payment_status', 'paid')
                        ->orWhereHas('user', function ($q) {
                            $q->role(['staff', 'manager', 'admin']);
                        });
                });
        };

        // Semua pesanan aktif (pending/preparing/ready) — tidak dibatasi
        $activeOrders = (clone $baseQuery())
            ->whereIn('status', ['pending', 'preparing', 'ready'])
            ->latest()
            ->get();

        // #3 Antrean kasir: pesanan online yang menunggu ACC (belum masuk KDS)
        $awaitingOrders = FoodOrder::with(['items.menuItem', 'user', 'payment'])
            ->where('status', 'awaiting_cashier')
            ->latest()
            ->get();

        // Pesanan delivered (Selesai) — batasi 50 terbaru agar board tidak berat
        $deliveredOrders = (clone $baseQuery())
            ->where('status', 'delivered')
            ->latest()
            ->limit(50)
            ->get();

        return Inertia::render('Staff/FoodOrders/Index', [
            'activeOrders' => $activeOrders->concat($deliveredOrders),
            'awaitingOrders' => $awaitingOrders,
        ]);
    }

    public function kds(): Response
    {
        // Alur: BAYAR DULU baru makanan dibuat, DAN kasir harus ACC.
        // Jadi KDS hanya menampilkan order yang SUDAH LUNAS (atau dibuat oleh staff/internal)
        // DAN sudah lolos gerbang kasir (status 'pending', bukan 'awaiting_cashier').
        // Counter-pickup items (snack, aqua, minuman botol) diambil langsung di kasir -> tidak masuk KDS.
        $orders = FoodOrder::with([
            'items' => function ($query) {
                $query->whereHas('menuItem', function ($q) {
                    $q->where('is_counter_pickup', false)
                        ->whereIn('category', ['makanan', 'minuman', 'snack', 'dessert']);
                })->with('menuItem');
            },
            'reservation.facility',
            'user',
        ])
            ->whereDate('created_at', today())
            ->whereIn('status', ['pending', 'preparing', 'ready', 'delivered'])
            ->where(function ($query) {
                $query->where('payment_status', 'paid')
                    ->orWhereHas('user', function ($q) {
                        $q->role(['staff', 'manager', 'admin']);
                    });
            })
            ->whereHas('items', function ($query) {
                $query->whereHas('menuItem', function ($q) {
                    $q->where('is_counter_pickup', false)
                        ->whereIn('category', ['makanan', 'minuman', 'snack', 'dessert']);
                });
            })
            ->oldest()
            ->get();

        return Inertia::render('Staff/FoodOrders/KDS', [
            'orders' => $orders,
            'tables' => TableStatusController::tableStatuses(),
        ]);
    }

    public function updateStatus(Request $request, FoodOrder $order)
    {
        $validated = $request->validate([
            'status' => 'required|in:preparing,ready,delivered,completed,cancelled',
            'payment_status' => 'nullable|in:unpaid,paid',
        ]);

        DB::transaction(function () use ($order, $validated) {
            // If cancelling, restore daily stock for items that were deducted
            if ($validated['status'] === 'cancelled' && $order->status !== 'cancelled') {
                $order->load('items.menuItem');
                foreach ($order->items as $item) {
                    if ($item->menuItem && $item->menuItem->current_stock !== null) {
                        $item->menuItem->increment('current_stock', $item->quantity);
                        $item->menuItem->update(['daily_stock' => $item->menuItem->current_stock]);
                    }
                }
            }

            $order->update([
                'status' => $validated['status'],
                'payment_status' => $validated['payment_status'] ?? $order->payment_status,
            ]);

            // If Paid and Cancelled, issue a refund transaction
            if ($validated['status'] === 'cancelled' && ($order->payment_status === 'paid' || $order->payment_status === 'refunded')) {
                if ($order->payment_status !== 'refunded') {
                    $order->update(['payment_status' => 'refunded']);
                }

                FinancialTransaction::create([
                    'type' => 'expense',
                    'category' => 'cafe',
                    'amount' => $order->total_amount ?? 0,
                    'description' => "Refund Pembatalan POS: {$order->id}",
                    'reference_id' => $order->id,
                    'transaction_date' => now()->toDateString(),
                    'user_id' => auth()->id(),
                ]);
            }
        });

        if ($order->user) {
            $order->fresh()->user?->notify(new FoodOrderStatusUpdated($order, $validated['status']));
        }

        return back()->with('success', 'Status order diperbarui.');
    }

    public function updateTimer(Request $request, FoodOrder $order)
    {
        $validated = $request->validate([
            'estimated_ready_at' => 'required|date',
        ]);

        $order->update([
            'estimated_ready_at' => $validated['estimated_ready_at'],
        ]);

        return back()->with('success', 'Waktu estimasi diperbarui.');
    }

    /**
     * #3 GERBANG KASIR — ACC pesanan online.
     *
     * Order online (dibuat lewat /pesanan/baru, status 'awaiting_cashier') baru
     * boleh masuk dapur setelah kasir menekan ACC di POS.
     * Setelah ACC: status -> 'pending' sehingga muncul di KDS, dan notifikasi
     * dapur dikirim.
     */
    public function approve(Request $request, FoodOrder $order)
    {
        if ($order->status !== 'awaiting_cashier') {
            return back()->with('error', 'Pesanan ini tidak dalam antrean konfirmasi kasir.');
        }

        DB::transaction(function () use ($order) {
            $order->update(['status' => 'pending']);

            // Pastikan order online yang sudah dibayar punya baris payment &
            // tercatat di ledger meskipun webhook terlambat.
            if ($order->payment_status === 'paid' && ! $order->payment) {
                $payment = Payment::create([
                    'food_order_id' => $order->id,
                    'amount' => $order->total_amount,
                    'payment_method' => 'tripay',
                    'payment_status' => 'success',
                    'payment_date' => now(),
                ]);
                $payment->markAsSuccess();
            }
        });

        $fresh = $order->fresh(['items.menuItem']);
        $hasFood = $fresh->items->contains(
            fn ($i) => $i->menuItem && in_array($i->menuItem->category, ['makanan', 'minuman', 'snack', 'dessert'])
        );

        if ($hasFood) {
            $kitchen = User::role(['staff', 'manager', 'admin'])->get();
            if ($kitchen->isNotEmpty()) {
                Notification::send($kitchen, new NewFoodOrder($fresh));
            }
        } elseif ($fresh->status === 'pending') {
            // Non-food only: langsung selesai.
            $fresh->update(['status' => 'delivered']);
        }

        return back()->with('success', 'Pesanan disetujui dan diteruskan ke dapur.');
    }

    /**
     * #3 GERBANG KASIR — Tolak / refund pesanan online.
     *
     * Jika sudah dibayar, catat refund expense + kembalikan stok menu
     * (barang belum dibuat, stok yang sudah dipotong saat order dibuat dikembalikan).
     */
    public function reject(Request $request, FoodOrder $order, StockService $stock)
    {
        $validated = $request->validate([
            'reason' => 'nullable|string|max:255',
            'refund' => 'nullable|boolean',
        ]);

        if (! in_array($order->status, ['awaiting_cashier', 'pending'], true)) {
            return back()->with('error', 'Pesanan ini sudah diproses dapur dan tidak dapat ditolak. Gunakan pembatalan/refund.');
        }

        DB::transaction(function () use ($order, $validated, $stock) {
            $order->load('items.menuItem');

            // Kembalikan stok menu (StockService = jalur resmi, tetap ter-audit)
            foreach ($order->items as $item) {
                if ($item->menuItem) {
                    $stock->moveMenuStock($item->menuItem, (int) $item->quantity, 'Tolak pesanan online '.substr($order->id, 0, 8));
                }
            }

            $shouldRefund = ($validated['refund'] ?? true) && $order->payment_status === 'paid';

            $order->update([
                'status' => 'cancelled',
                'payment_status' => $shouldRefund ? 'refunded' : $order->payment_status,
                'notes' => trim(($order->notes ?? '')."\n[DITOLAK KASIR] ".($validated['reason'] ?? 'Tanpa alasan')),
            ]);

            if ($shouldRefund) {
                $order->payment?->update(['payment_status' => 'refunded']);
                FinancialTransaction::create([
                    'type' => 'expense',
                    'category' => 'cafe',
                    'amount' => $order->total_amount ?? 0,
                    'description' => 'Refund Tolak Kasir Pesanan Online #'.substr($order->id, 0, 8),
                    'reference_id' => $order->id,
                    'transaction_date' => now()->toDateString(),
                    'user_id' => auth()->id(),
                ]);
            }
        });

        if ($order->user) {
            try {
                $order->user->notify(new FoodOrderStatusUpdated($order, 'cancelled'));
            } catch (\Throwable $e) {
                Log::warning('FoodOrder reject notify failed: '.$e->getMessage());
            }
        }

        return back()->with('success', 'Pesanan ditolak'.($order->payment_status === 'refunded' ? ' dan dana dikembalikan.' : '.'));
    }

    public function destroy(FoodOrder $order, StockService $stock)
    {
        // Allow cancellation of unpaid active orders (pending/preparing/ready).
        // Paid orders must go through refund, not hard-delete, to keep ledger intact.
        if ($order->payment_status === 'paid') {
            abort(403, 'Pesanan yang sudah dibayar tidak dapat dihapus. Lakukan refund/cancel melalui menu Pembayaran.');
        }

        if (! in_array($order->status, ['pending', 'preparing', 'ready', 'cancelled'])) {
            abort(403, 'Hanya pesanan yang belum selesai (pending/preparing/ready/cancelled) yang dapat dihapus.');
        }

        DB::transaction(function () use ($order) {
            // Restore stock for items that were deducted
            foreach ($order->items as $item) {
                if ($item->menuItem && $item->menuItem->current_stock !== null) {
                    $item->menuItem->increment('current_stock', $item->quantity);
                    $item->menuItem->update(['daily_stock' => $item->menuItem->current_stock]);
                }
            }

            // Hapus financial transactions (income/expense) agar laporan sinkron
            FinancialTransaction::where('reference_id', $order->id)->delete();

            // Hapus payments & item baris agar tidak ada orphan record
            $order->payment()->delete();
            $order->items()->delete();
            $order->delete();
        });

        return back()->with('success', 'Pesanan aktif berhasil dihapus, stok dikembalikan, dan laporan keuangan disesuaikan.');
    }

    /**
     * Tandai status SATU item dalam pesanan (KDS per-item).
     * Item: pending -> preparing -> ready -> delivered.
     * Setelah item diubah, status order di-recompute otomatis dari item terbawah:
     *   - semua delivered        -> order delivered
     *   - ada ready (belum all)   -> order ready
     *   - ada preparing           -> order preparing
     *   - semua pending           -> order pending
     */
    public function updateItemStatus(Request $request, FoodOrder $order, FoodOrderItem $item)
    {
        // Pastikan item memang milik order ini
        if ($item->order_id !== $order->id) {
            abort(404);
        }

        $validated = $request->validate([
            'status' => 'required|in:pending,preparing,ready,delivered',
        ]);

        DB::transaction(function () use ($order, $item, $validated) {
            $item->update(['status' => $validated['status']]);

            // Recompute order status dari item terburuk (prioritas tertinggi):
            // delivered < ready < preparing < pending  (pending = paling awal, paling "butuh kerja")
            $order->load('items');
            $statuses = $order->items->pluck('status')->unique()->values()->toArray();

            if (in_array('pending', $statuses, true)) {
                $orderStatus = 'pending';
            } elseif (in_array('preparing', $statuses, true)) {
                $orderStatus = 'preparing';
            } elseif (in_array('ready', $statuses, true)) {
                $orderStatus = 'ready';
            } else {
                // semua delivered
                $orderStatus = 'delivered';
            }

            if ($orderStatus !== $order->status) {
                $order->update(['status' => $orderStatus]);
                if ($order->user) {
                    try {
                        $order->user->notify(new FoodOrderStatusUpdated($order, $orderStatus));
                    } catch (\Throwable $e) {
                        // Notifikasi gagal jangan sampai membatalkan update status
                        Log::warning('FoodOrder notify failed: '.$e->getMessage());
                    }
                }
            }
        });

        return back()->with('success', 'Status item diperbarui.');
    }
}
