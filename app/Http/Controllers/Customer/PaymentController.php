<?php

namespace App\Http\Controllers\Customer;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use App\Models\Reservation;
use App\Services\PaymentService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PaymentController extends Controller
{
    public function index(): Response
    {
        $reservationIds = Reservation::where('user_id', auth()->id())->pluck('id');

        return Inertia::render('Customer/Payments/Index', [
            'payments' => Payment::with(['reservation.facility'])
                ->whereIn('reservation_id', $reservationIds)
                ->latest()
                ->paginate(10),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'reservation_id' => 'required|exists:reservations,id',
            'payment_method' => 'required|in:tripay,cash',
            'payment_channel' => 'nullable|string',
            'proof_image' => 'nullable|image|max:3072',
        ]);

        $reservation = Reservation::with('facility')->findOrFail($validated['reservation_id']);

        // Authorization check
        if (auth()->check()) {
            if ($reservation->user_id !== auth()->id() && ! auth()->user()->hasRole(['admin', 'manager', 'staff'])) {
                abort(403, 'Akses ditolak.');
            }
        } else {
            if ($reservation->user_id !== null || $reservation->session_id !== session()->getId()) {
                abort(403, 'Sesi Anda tidak cocok dengan reservasi ini.');
            }
        }

        if ($reservation->status === 'cancelled') {
            return back()->with('error', 'Reservasi ini sudah dibatalkan dan tidak dapat dibayar lagi.');
        }

        if ($reservation->payment_status === 'paid') {
            return back()->with('error', 'Reservasi ini sudah dibayar.');
        }

        // If there is already a pending payment, do not create duplicate
        if ($reservation->payment && $reservation->payment->payment_status === 'pending') {
            if (empty($reservation->payment->transaction_id)) {
                // The previous pending payment was stuck (no Tripay reference generated). We can mark it failed and allow a new one.
                $reservation->payment->markAsFailed(['error' => 'Stuck without transaction_id. Overwritten by retry.']);
            } else {
                return back()->with('error', 'Sudah ada pembayaran pending. Silakan cek status pembayaran Anda.');
            }
        }

        // Handle proof image upload (for reference, not for tripay)
        $proofImagePath = null;
        if ($request->hasFile('proof_image')) {
            $proofImagePath = $request->file('proof_image')->store('payments/proofs', 'public');
        }

        $paymentMethod = $validated['payment_method'];
        $paymentChannel = $validated['payment_channel'] ?? null;

        $result = app(PaymentService::class)->createForReservation($reservation, $paymentMethod, $paymentChannel);
        $checkoutUrl = $result['checkout_url'];
        $tripayError = $result['error'] ?? null;

        // If proof uploaded, attach it to payment
        if ($proofImagePath && $result['payment']) {
            $result['payment']->update(['proof_image' => $proofImagePath]);
        }

        if ($checkoutUrl) {
            return Inertia::location($checkoutUrl);
        }

        if ($paymentMethod === 'tripay' && $tripayError) {
            $msg = 'Gagal memproses pembayaran online: '.$tripayError.'. Silakan bayar di kasir.';

            return back()->with('error', $msg);
        }

        if ($paymentMethod === 'cash') {
            return back()->with('success', 'Kami menunggu kedatangan Anda. Silakan bayar di kasir saat kedatangan.');
        }

        return back()->with('success', 'Pembayaran berhasil dicatat. Menunggu verifikasi.');
    }

    public function show(Payment $payment): Response
    {
        $reservation = $payment->reservation;
        if (auth()->check()) {
            if ($reservation && $reservation->user_id !== auth()->id() && ! auth()->user()->hasRole(['admin', 'manager', 'staff'])) {
                abort(403, 'Akses ditolak.');
            }
        } else {
            if ($reservation && ($reservation->user_id !== null || $reservation->session_id !== session()->getId())) {
                abort(403, 'Sesi Anda tidak cocok dengan pembayaran ini.');
            }
        }

        return Inertia::render('Customer/Payments/Show', [
            'payment' => $payment->load(['reservation.facility']),
        ]);
    }
}
