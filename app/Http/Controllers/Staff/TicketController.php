<?php

namespace App\Http\Controllers\Staff;

use App\Http\Controllers\Controller;
use App\Models\Facility;
use App\Models\Payment;
use App\Models\Reservation;
use App\Services\PaymentService;
use App\Services\ReservationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class TicketController extends Controller
{
    public function index(): Response
    {
        $tickets = Facility::where('is_active', true)->get();

        $activeReservations = Reservation::with(['facility', 'user', 'payment'])
            ->whereDate('check_in_date', today())
            ->latest()
            ->limit(20)
            ->get();

        return Inertia::render('Staff/Tickets/Index', [
            'tickets' => $tickets,
            'activeReservations' => $activeReservations,
            'user' => auth()->user(),
        ]);
    }

    public function store(Request $request, ReservationService $reservationService)
    {
        $validated = $request->validate([
            'facility_id' => 'nullable|exists:facilities,id',
            'quantity' => 'required|integer|min:1',
            'customer_name' => 'nullable|string|max:255',
            'payment_method' => 'required|in:cash,qris,transfer,pay_later',
            'check_in_date' => 'nullable|date',
            'check_out_date' => 'nullable|date|after_or_equal:check_in_date',
            'check_in_time' => 'nullable|string',
            'check_out_time' => 'nullable|string',
        ]);

        if (empty($validated['facility_id'])) {
            $defaultTicket = Facility::where('type', 'ticket')->where('is_active', true)->first();
            if (! $defaultTicket) {
                return back()->withErrors(['facility_id' => 'Tiket Masuk tidak ditemukan di sistem.']);
            }
            $validated['facility_id'] = $defaultTicket->id;
        }

        DB::beginTransaction();
        try {
            $reservationData = [
                'facility_id' => $validated['facility_id'],
                'check_in_date' => $validated['check_in_date'] ?? date('Y-m-d'),
                'check_out_date' => $validated['check_out_date'] ?? date('Y-m-d'),
                'check_in_time' => $validated['check_in_time'] ?? now()->format('H:i'),
                'check_out_time' => $validated['check_out_time'] ?? now()->addHours(4)->format('H:i'),
                'guest_count' => $validated['quantity'],
                'customer_name' => $validated['customer_name'] ?? 'Walk-in Ticket',
                'payment_method' => $validated['payment_method'],
            ];

            // Fix: pass all 3 required args (data, userId, sessionId)
            $reservation = $reservationService->createReservation($reservationData, auth()->id(), null);

            if ($validated['payment_method'] === 'qris') {
                $reservation->update(['status' => 'pending', 'payment_status' => 'unpaid']);

                $paymentService = app(PaymentService::class);
                $result = $paymentService->createForReservation($reservation, 'tripay', 'QRIS');

                if (! empty($result['error'])) {
                    DB::rollBack();

                    return back()->withErrors(['error' => 'Gagal membuat pembayaran QRIS: '.$result['error']]);
                }

                DB::commit();

                return back()->with('success', 'Silakan scan QRIS untuk membayar.')
                    ->with('qr_url', $result['qr_url'] ?? $result['checkout_url'])
                    ->with('payment_id', $result['payment']->id)
                    ->with('print_ticket_id', $reservation->id)
                    ->with('order_details', $reservation);
            }

            if ($validated['payment_method'] === 'pay_later') {
                $reservation->update(['status' => 'confirmed', 'payment_status' => 'unpaid']);
            } else {
                $reservation->update(['status' => 'confirmed', 'payment_status' => 'paid']);
            }

            // Map QRIS to Tripay for the database ENUM (fallback if needed)
            $dbPaymentMethod = $validated['payment_method'];
            if ($dbPaymentMethod === 'qris') {
                $dbPaymentMethod = 'tripay';
            }

            // Create Payment record (the service doesn't auto-create one for POS tickets)
            $payment = Payment::create([
                'reservation_id' => $reservation->id,
                'amount' => $reservation->total_amount,
                'payment_method' => $dbPaymentMethod,
                'payment_status' => 'success',
                'payment_date' => now(),
            ]);

            // Record income in financial ledger
            PaymentService::recordIncome($payment);

            DB::commit();

            // Reload reservation with relations for printing
            $reservation->load(['facility', 'payment']);

            return back()->with('success', 'Tiket berhasil diterbitkan!')
                ->with('print_ticket_id', $reservation->id)
                ->with('order_details', $reservation);
        } catch (\Exception $e) {
            DB::rollBack();

            return back()->withErrors(['error' => 'Gagal menerbitkan tiket: '.$e->getMessage()]);
        }
    }
}
