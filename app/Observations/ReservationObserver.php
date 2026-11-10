<?php

namespace App\Observations;

use App\Models\Reservation;
use App\Models\FinancialTransaction;
use Illuminate\Support\Facades\Auth;

class ReservationObserver
{
    /**
     * Handle the Reservation "updated" event.
     *
     * When a reservation status changes to cancelled, we record a refund
     * transaction (expense) so that income reports stay accurate and
     * expense reports show the refund.
     */
    public function updated(Reservation $reservation)
    {
        // Check if status changed to cancelled and was not already cancelled
        if ($reservation->isDirty('status') &&
            $reservation->status === 'cancelled' &&
            $reservation->getOriginal('status') !== 'cancelled') {

            // Determine amount to refund: total amount that was previously paid.
            // We refund the full total_amount regardless of payment_status,
            // but only if there was a payment (paid or dp_paid) to avoid
            // double counting.
            if (in_array($reservation->payment_status, ['paid', 'dp_paid'])) {
                FinancialTransaction::create([
                    'type'          => 'expense',
                    'category'      => 'refund', // you may add 'refund' to ExpenseCategories if needed
                    'amount'        => $reservation->total_amount,
                    'reference_id'  => $reservation->id,
                    'description'   => 'Pengembalian pembatalan reservasi #' . $reservation->id,
                    'transaction_date' => now()->toDateString(),
                    'user_id'       => Auth::id() ?? null,
                ]);
            }
        }
    }
}