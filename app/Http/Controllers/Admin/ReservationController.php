<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Facility;
use App\Models\FinancialTransaction;
use App\Models\MenuItem;
use App\Models\Payment;
use App\Models\Reservation;
use App\Notifications\ReservationStatusUpdated;
use App\Services\PaymentService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class ReservationController extends Controller
{
    public function index(Request $request): Response
    {
        $reservations = Reservation::query()
            ->with(['user', 'facility'])
            ->when($request->search, fn ($q) => $q->whereHas('user', fn ($u) => $u->where('name', 'like', "%{$request->search}%")))
            ->when($request->status, fn ($q) => $q->where('status', $request->status))
            ->when($request->facility_id, fn ($q) => $q->where('facility_id', $request->facility_id))
            ->when($request->date_from, fn ($q) => $q->where('check_in_date', '>=', $request->date_from))
            ->when($request->date_to, fn ($q) => $q->where('check_in_date', '<=', $request->date_to))
            ->latest()
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Admin/Reservations/Index', [
            'reservations' => $reservations,
            'filters' => $request->only(['search', 'status', 'facility_id', 'date_from', 'date_to']),
            'facilities' => Facility::active()->get(['id', 'name']),
            'stats' => [
                'total' => Reservation::count(),
                'pending' => Reservation::where('status', 'pending')->count(),
                'confirmed' => Reservation::where('status', 'confirmed')->count(),
                'today' => Reservation::today()->count(),
            ],
        ]);
    }

    public function show(Reservation $reservation): Response
    {
        $reservation->load([
            'user', 'facility', 'foodOrders.items.menuItem', 'review',
            'payments' => fn ($q) => $q->latest(),
        ]);

        $reservation->total_paid = (float) $reservation->payments()
            ->where('payment_status', 'success')
            ->sum('amount');

        return Inertia::render('Admin/Reservations/Show', [
            'reservation' => $reservation,
        ]);
    }

    public function updateStatus(Request $request, Reservation $reservation)
    {
        $validated = $request->validate([
            'status' => 'required|in:confirmed,cancelled,completed',
            'refund_method' => 'nullable|in:manual,tripay',
            'note' => 'nullable|string|max:500',
        ]);

        // Business rules
        if ($validated['status'] === 'confirmed' && $reservation->status !== 'pending') {
            return back()->with('error', 'Hanya reservasi pending yang dapat dikonfirmasi.');
        }

        if ($validated['status'] === 'completed' && $reservation->status !== 'confirmed') {
            return back()->with('error', 'Hanya reservasi confirmed yang dapat di-complete.');
        }

        DB::transaction(function () use ($reservation, $validated) {
            $reservation->update(['status' => $validated['status']]);

            if ($validated['status'] === 'cancelled') {
                // SOP: batal sewa = HANGUS (DP/guarantee TIDAK dikembalikan).
                // Refund HANYA kalau staff eksplisit pilih refund_method (manual/tripay).
                $refundMethod = $validated['refund_method'] ?? null;

                if ($refundMethod && $reservation->payment_status === 'paid') {
                    $reservation->update(['payment_status' => 'refunded']);

                    FinancialTransaction::create([
                        'type' => 'expense',
                        'category' => 'reservation',
                        'amount' => $reservation->total_amount ?? 0,
                        'description' => "Refund Pembatalan Reservasi ({$refundMethod}): {$reservation->id}",
                        'reference_id' => $reservation->id,
                        'transaction_date' => now()->toDateString(),
                        'user_id' => auth()->id(),
                    ]);
                }
                // Jika tidak ada refund_method -> HANGUS (payment_status tetap paid/dp).

                $reservation->load('foodOrders.items');
                foreach ($reservation->foodOrders as $foodOrder) {
                    if ($foodOrder->status !== 'cancelled') {
                        $foodOrder->update(['status' => 'cancelled']);

                        // Refund food order hanya kalau ikut refund_method
                        if ($refundMethod && $foodOrder->payment_status === 'paid') {
                            $foodOrder->update(['payment_status' => 'refunded']);
                            FinancialTransaction::create([
                                'type' => 'expense',
                                'category' => 'cafe',
                                'amount' => $foodOrder->total_amount ?? 0,
                                'description' => "Refund Pembatalan POS (via Reservasi, {$refundMethod}): {$foodOrder->id}",
                                'reference_id' => $foodOrder->id,
                                'transaction_date' => now()->toDateString(),
                                'user_id' => auth()->id(),
                            ]);
                        }

                        foreach ($foodOrder->items as $item) {
                            if ($item->menu_item_id) {
                                MenuItem::where('id', $item->menu_item_id)
                                    ->whereNotNull('current_stock')
                                    ->increment('current_stock', $item->quantity);
                                $item->menuItem->update(['daily_stock' => $item->menuItem->current_stock]);
                            }
                        }
                    }
                }
            }
        });

        if ($reservation->user) {
            $reservation->user->notify(new ReservationStatusUpdated($reservation, $validated['status']));
        }

        return back()->with('success', "Status reservasi diubah ke {$validated['status']}.");
    }

    /**
     * #4 — Catat DP secara MANUAL (kasir).
     *
     * Dipakai untuk reservasi walk-in / reservasi yang dibuat di luar aplikasi.
     * Nominal default Rp 100.000 (PaymentService::DP_FLAT_AMOUNT) tapi bisa
     * diubah kasir bila tamu membayar berbeda. Tercatat sebagai:
     *  - Payment(payment_type='deposit') agar muncul di riwayat pembayaran
     *  - FinancialTransaction(category='reservation_dp') agar laporan
     *    membedakan DP dari pelunasan (bukan tercampur sebagai 'reservation').
     */
    public function recordDp(Request $request, Reservation $reservation, PaymentService $paymentService)
    {
        $validated = $request->validate([
            'amount' => 'nullable|numeric|min:1',
            'method' => 'required|in:cash,qris,tripay,transfer',
            'note' => 'nullable|string|max:255',
        ]);

        if ($reservation->dp_paid_at) {
            return back()->with('error', 'DP reservasi ini sudah tercatat sebelumnya.');
        }

        $amount = (float) ($validated['amount'] ?? PaymentService::DP_FLAT_AMOUNT);
        $maxDp = (float) $reservation->total_amount;

        if ($amount > $maxDp) {
            return back()->with('error', 'Nominal DP melebihi total tagihan reservasi (Rp '.number_format($maxDp, 0, ',', '.').').');
        }

        DB::transaction(function () use ($reservation, $validated, $amount) {
            $payment = Payment::create([
                'reservation_id' => $reservation->id,
                'payment_type' => 'deposit',
                'amount' => $amount,
                'payment_method' => $validated['method'],
                'payment_status' => 'success',
                'payment_date' => now(),
                'tripay_reference' => null,
            ]);

            FinancialTransaction::create([
                'type' => 'income',
                'category' => 'reservation_dp',
                'amount' => $amount,
                'description' => 'DP Reservasi ('.strtoupper($validated['method']).') '.($validated['note'] ?? '').' — '.substr($reservation->id, 0, 8),
                'reference_id' => $payment->id,
                'transaction_date' => now()->toDateString(),
                'user_id' => auth()->id(),
            ]);

            $reservation->update([
                'dp_amount' => $amount,
                'dp_paid_at' => now(),
                'payment_status' => $reservation->payment_status === 'unpaid' ? 'dp_paid' : $reservation->payment_status,
            ]);
        });

        return back()->with('success', 'DP Rp '.number_format($amount, 0, ',', '.').' berhasil dicatat.');
    }

    /**
     * #4 — Pelunasan sisa tagihan (kasir tunai/QRIS atau online Tripay).
     * Hanya mencatat sisa (total - sudah dibayar), tidak pernah melebihi.
     */
    public function settle(Request $request, Reservation $reservation, PaymentService $paymentService)
    {
        $validated = $request->validate([
            'method' => 'required|in:cash,qris,tripay,transfer',
        ]);

        $remaining = $reservation->remaining_amount;

        if ($remaining <= 0.01) {
            return back()->with('error', 'Reservasi ini sudah lunas.');
        }

        if ($validated['method'] === 'tripay') {
            try {
                $result = $paymentService->createForReservation(
                    $reservation,
                    'tripay',
                    'QRIS',
                    'pelunasan'
                );
                $payment = $result['payment'];
                $checkoutUrl = $result['checkout_url'] ?? null;

                // createForReservation memakai total; untuk pelunasan kita set eksplisit.
                $payment->update(['amount' => $remaining, 'payment_type' => 'pelunasan']);

                return redirect()->away($checkoutUrl);
            } catch (\Throwable $e) {
                return back()->with('error', 'Gagal membuat pembayaran online: '.$e->getMessage());
            }
        }

        DB::transaction(function () use ($reservation, $validated, $remaining) {
            $payment = Payment::create([
                'reservation_id' => $reservation->id,
                'payment_type' => 'pelunasan',
                'amount' => $remaining,
                'payment_method' => $validated['method'],
                'payment_status' => 'success',
                'payment_date' => now(),
            ]);

            FinancialTransaction::create([
                'type' => 'income',
                'category' => 'reservation_pelunasan',
                'amount' => $remaining,
                'description' => 'Pelunasan Reservasi ('.strtoupper($validated['method']).') — '.substr($reservation->id, 0, 8),
                'reference_id' => $payment->id,
                'transaction_date' => now()->toDateString(),
                'user_id' => auth()->id(),
            ]);

            $reservation->update(['payment_status' => 'paid']);
        });

        return back()->with('success', 'Pelunasan Rp '.number_format($remaining, 0, ',', '.').' berhasil dicatat.');
    }

    public function calendar(Request $request): Response
    {
        $month = $request->get('month', now()->month);
        $year = $request->get('year', now()->year);

        $reservations = Reservation::query()
            ->with(['facility', 'user'])
            ->whereYear('check_in_date', $year)
            ->whereMonth('check_in_date', $month)
            ->whereNotIn('status', ['cancelled'])
            ->get();

        return Inertia::render('Admin/Reservations/Calendar', [
            'reservations' => $reservations,
            'month' => $month,
            'year' => $year,
        ]);
    }

    /**
     * Hapus reservasi beserta payment & transaksi keuangan terkait.
     * Berguna untuk membersihkan tiket masuk / reservasi yang salah input.
     * Hard-delete (model Reservation tidak soft-delete).
     */
    public function destroy(Reservation $reservation)
    {
        // Safety: hanya izinkan hapus untuk tiket (facility type=ticket)
        // atau reservasi yang belum aktif (pending/cancelled).
        $isTicket = $reservation->facility && $reservation->facility->type === 'ticket';
        if (! $isTicket && ! in_array($reservation->status, ['pending', 'cancelled'])) {
            return back()->with('error', 'Hanya tiket atau reservasi pending/cancelled yang dapat dihapus.');
        }

        DB::transaction(function () use ($reservation) {
            // Hapus financial transactions terkait (income/expense) by reference_id.
            // reference_id unik = reservasi ini, hapus SEMUA type agar laporan sinkron.
            FinancialTransaction::where('reference_id', $reservation->id)->delete();

            // Hapus payment terkait (Reservation has ONE payment via HasOne).
            // Juga bersihkan financial tx yang reference ke payment->id (fee gateway).
            $resPayment = $reservation->payment;
            if ($resPayment) {
                FinancialTransaction::where('reference_id', $resPayment->id)->delete();
                $resPayment->delete();
            }

            // Hapus food orders terkait (beserta financial_tx & items agar tidak orphan)
            foreach ($reservation->foodOrders as $foodOrder) {
                FinancialTransaction::where('reference_id', $foodOrder->id)->delete();
                $foodPayment = $foodOrder->payment;
                if ($foodPayment) {
                    FinancialTransaction::where('reference_id', $foodPayment->id)->delete();
                    $foodPayment->delete();
                }
                $foodOrder->items()->delete();
                $foodOrder->delete();
            }
            $reservation->delete();
        });

        return back()->with('success', 'Reservasi/tiket berhasil dihapus secara permanen (termasuk payment & transaksi keuangan).');
    }
}
