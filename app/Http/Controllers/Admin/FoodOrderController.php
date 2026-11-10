<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\FinancialTransaction;
use App\Models\FoodOrder;
use App\Notifications\FoodOrderStatusUpdated;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class FoodOrderController extends Controller
{
    public function index(Request $request): Response
    {
        $orders = FoodOrder::with(['user', 'items.menuItem', 'reservation'])
            ->when($request->status, fn ($q) => $q->where('status', $request->status))
            ->when($request->type, fn ($q) => $q->where('order_type', $request->type))
            ->when($request->date_from, fn ($q) => $q->whereDate('created_at', '>=', $request->date_from))
            ->when($request->date_to, fn ($q) => $q->whereDate('created_at', '<=', $request->date_to))
            ->when($request->search, fn ($q) => $q->whereHas('user', fn ($u) => $u->where('name', 'like', '%'.$request->search.'%')))
            ->orderBy('created_at', 'desc')
            ->paginate($request->per_page ?? 25)
            ->withQueryString();

        return Inertia::render('Admin/FoodOrders/Index', [
            'orders' => $orders,
            'filters' => $request->only(['status', 'type', 'date_from', 'date_to', 'search']),
            'stats' => [
                'pending' => FoodOrder::where('status', 'pending')->count(),
                'preparing' => FoodOrder::where('status', 'preparing')->count(),
                'ready' => FoodOrder::where('status', 'ready')->count(),
            ],
        ]);
    }

    public function updateStatus(Request $request, FoodOrder $order)
    {
        $validated = $request->validate([
            'status' => 'required|in:preparing,ready,delivered,completed,cancelled',
            'payment_status' => 'nullable|in:unpaid,paid',
        ]);

        DB::transaction(function () use ($order, $validated) {
            $order->update([
                'status' => $validated['status'],
                'payment_status' => $validated['payment_status'] ?? $order->payment_status,
            ]);

            if ($validated['status'] === 'cancelled') {
                // Restore stock if it was cancelled
                $order->load('items.menuItem');
                foreach ($order->items as $item) {
                    if ($item->menuItem && $item->menuItem->current_stock !== null) {
                        $item->menuItem->increment('current_stock', $item->quantity);
                        $item->menuItem->update(['daily_stock' => $item->menuItem->current_stock]);
                    }
                }

                // If Paid, issue a refund transaction
                if ($order->payment_status === 'paid' || $order->payment_status === 'refunded') {
                    // Update to refunded if not already
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
            }
        });

        if ($order->user) {
            $order->user->notify(new FoodOrderStatusUpdated($order, $validated['status']));
        }

        return back()->with('success', "Status order diperbarui ke {$validated['status']}.");
    }

    public function destroy(FoodOrder $order)
    {
        DB::transaction(function () use ($order) {
            // Restore stock if the order hasn't been cancelled yet
            if ($order->status !== 'cancelled') {
                $order->load('items.menuItem');
                foreach ($order->items as $item) {
                    if ($item->menuItem && $item->menuItem->current_stock !== null) {
                        $item->menuItem->increment('current_stock', $item->quantity);
                        $item->menuItem->update(['daily_stock' => $item->menuItem->current_stock]);
                    }
                }
            }

            // Delete ALL associated financial transactions (income + expense) by reference_id.
            // reference_id unik = order ini (income dari PaymentService pakai food_order_id),
            // plus bersihkan potongan payment-gateway yang reference = payment->id.
            FinancialTransaction::where('reference_id', $order->id)->delete();

            // Delete associated payment (FoodOrder has ONE payment via HasOne).
            // Bersihkan juga financial_transactions yang reference ke payment->id
            // (mis. potongan fee Tripay) agar laporan benar-benar sinkron.
            $payment = $order->payment;
            if ($payment) {
                FinancialTransaction::where('reference_id', $payment->id)->delete();
                $payment->delete();
            }

            // Finally delete the order (items will cascade if set up, or we can force it)
            $order->items()->delete();
            $order->delete();
        });

        return back()->with('success', 'Riwayat pesanan berhasil dihapus secara permanen.');
    }
}
