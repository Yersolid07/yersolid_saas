<?php

namespace App\Http\Controllers\Staff;

use App\Http\Controllers\Controller;
use App\Models\FinancialTransaction;
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
    public function index(): Response
    {
        $today = now()->toDateString();

        return Inertia::render('Staff/Reservations/Index', [
            'checkIns' => Reservation::with(['user', 'facility'])
                ->where('check_in_date', $today)
                ->whereIn('status', ['confirmed', 'pending'])
                ->get(),
            'checkOuts' => Reservation::with(['user', 'facility'])
                ->where('check_out_date', $today)
                ->whereIn('status', ['confirmed', 'checked_in'])
                ->get(),
            'pending' => Reservation::with(['user', 'facility'])
                ->whereIn('status', ['pending'])
                ->latest()
                ->limit(20)
                ->get(),
        ]);
    }

    public function updateStatus(Request $request, Reservation $reservation)
    {
        $validated = $request->validate([
            'status' => 'required|in:confirmed,completed,cancelled,checked_in',
        ]);

        $reservation->load('payment', 'user');

        try {
            DB::transaction(function () use ($validated, $reservation) {
                if ($validated['status'] === 'checked_in' && $reservation->payment_status !== 'paid') {
                    if ($reservation->payment_status === 'dp_paid') {
                        $dpAmount = $reservation->payment ? $reservation->payment->amount : 0;
                        $remaining = $reservation->total_amount - $dpAmount + $reservation->guarantee_fee;

                        $pelunasan = Payment::create([
                            'reservation_id' => $reservation->id,
                            'amount' => $remaining,
                            'payment_method' => 'cash',
                            'payment_type' => 'pelunasan',
                            'payment_status' => 'success',
                            'payment_date' => now(),
                        ]);
                        PaymentService::recordIncome($pelunasan);
                        $reservation->update(['payment_status' => 'paid']);
                    } elseif ($reservation->payment && $reservation->payment->payment_method === 'cash') {
                        $reservation->update(['payment_status' => 'paid']);
                        $reservation->payment->markAsSuccess();
                    } else {
                        throw new \Exception('Reservasi belum lunas dan bukan pembayaran cash/DP!');
                    }
                }

                if ($validated['status'] === 'completed' && $reservation->status !== 'completed') {
                    if ($reservation->guarantee_fee > 0) {
                        FinancialTransaction::create([
                            'type' => 'expense',
                            'category' => 'reservation',
                            'amount' => $reservation->guarantee_fee,
                            'description' => 'Pengembalian Jaminan Homestay - '.$reservation->unique_code,
                            'reference_id' => $reservation->id,
                            'transaction_date' => now()->toDateString(),
                            'user_id' => auth()->id() ?? null,
                        ]);
                    }
                }

                $reservation->update(['status' => $validated['status']]);
            });

            // Only notify registered users (guests have no user account)
            if ($reservation->user) {
                $reservation->user->notify(new ReservationStatusUpdated($reservation, $validated['status']));
            }

            return back()->with('success', 'Status berhasil diubah.');
        } catch (\Exception $e) {
            return back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    public function scan()
    {
        return Inertia::render('Staff/Reservations/Scan');
    }

    /**
     * Facility Display System - real-time board mirip KDS.
     * Menampilkan fasilitas yang sedang disewa, check-in hari ini, check-out hari ini.
     */
    public function facilityDisplay(): Response
    {
        $now = now();
        $today = $now->toDateString();

        // Fasilitas yang SEDANG DISEWA (aktif sekarang: confirmed/checked_in, now antara check_in dan check_out)
        // Exclude tiket masuk (bukan sewa/reservasi, hanya hitung jumlah pengunjung)
        $active = Reservation::with(['user', 'facility'])
            ->whereHas('facility', fn ($q) => $q->where('type', '!=', 'ticket'))
            ->whereIn('status', ['confirmed', 'checked_in'])
            ->whereDate('check_in_date', '<=', $today)
            ->whereDate('check_out_date', '>=', $today)
            ->orderBy('check_in_date')
            ->orderBy('check_in_time')
            ->get();

        // Check-in hari ini (belum checked_in)
        $checkIns = Reservation::with(['user', 'facility'])
            ->whereHas('facility', fn ($q) => $q->where('type', '!=', 'ticket'))
            ->whereDate('check_in_date', $today)
            ->whereIn('status', ['confirmed', 'pending'])
            ->orderBy('check_in_time')
            ->get();

        // Check-out hari ini
        $checkOuts = Reservation::with(['user', 'facility'])
            ->whereHas('facility', fn ($q) => $q->where('type', '!=', 'ticket'))
            ->whereDate('check_out_date', $today)
            ->whereIn('status', ['confirmed', 'checked_in'])
            ->orderBy('check_out_time')
            ->get();

        // Tiket masuk hari ini (bukan sewa — hanya dihitung jumlah pengunjung)
        $ticketVisitorsToday = Reservation::whereHas('facility', fn ($q) => $q->where('type', 'ticket'))
            ->whereDate('created_at', $today)
            ->where('status', '!=', 'cancelled')
            ->sum('guest_count');

        return Inertia::render('Staff/Reservations/FacilityDisplay', [
            'active' => $active,
            'checkIns' => $checkIns,
            'checkOuts' => $checkOuts,
            'ticketVisitorsToday' => (int) $ticketVisitorsToday,
        ]);
    }

    public function verify(Request $request)
    {
        $request->validate([
            'unique_code' => 'required|string|exists:reservations,unique_code',
        ], [
            'unique_code.exists' => 'Kode reservasi tidak valid atau tidak ditemukan.',
        ]);

        $reservation = Reservation::with(['user', 'facility', 'payment'])
            ->where('unique_code', $request->unique_code)
            ->firstOrFail();

        // Verify status and payment
        if (! in_array($reservation->payment_status, ['paid', 'dp_paid'])) {
            if (! ($reservation->payment && $reservation->payment->payment_method === 'cash')) {
                return back()->withErrors(['unique_code' => 'Reservasi ini belum lunas. Metode: '.($reservation->payment ? $reservation->payment->payment_method : 'Belum ada').' ('.$reservation->payment_status.')']);
            }
        }

        if (in_array($reservation->status, ['completed', 'cancelled'])) {
            return back()->withErrors(['unique_code' => 'Reservasi sudah selesai atau dibatalkan.']);
        }

        // Optional: Update status to checked_in automatically
        // $reservation->update(['status' => 'checked_in']);

        return back()->with('reservation', $reservation);
    }
}
