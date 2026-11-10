<?php

namespace App\Services;

use App\Models\Coupon;
use App\Models\Facility;
use App\Models\Reservation;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ReservationService
{
    /**
     * Create a new reservation.
     *
     * @param  array  $validated  Validated data
     * @param  int|null  $userId  User ID
     * @param  string|null  $sessionId  Session ID
     *
     * @throws ValidationException
     * @throws \Exception
     */
    public function createReservation(array $validated, ?int $userId, ?string $sessionId): Reservation
    {
        $checkIn = Carbon::parse($validated['check_in_date']);
        $checkOut = Carbon::parse($validated['check_out_date']);

        $facility = Facility::findOrFail($validated['facility_id']);

        $days = 1;

        // Handle time, pricing calculation, and midnight crossover
        if (! empty($validated['check_in_time']) && ! empty($validated['check_out_time'])) {
            $checkInTime = Carbon::parse($validated['check_in_time']);
            $checkOutTime = Carbon::parse($validated['check_out_time']);

            // Midnight crossover
            if ($checkOutTime->lt($checkInTime)) {
                $checkOutTime->addDay();
                if ($checkIn->isSameDay($checkOut) || in_array($facility->type, ['gazebo', 'pool'])) {
                    $checkOut = $checkIn->copy()->addDay();
                    $validated['check_out_date'] = $checkOut->toDateString();
                }
            } elseif (in_array($facility->type, ['gazebo', 'pool'])) {
                // If not crossing midnight, enforce same day check-out for gazebo/pool
                $checkOut = $checkIn->copy();
                $validated['check_out_date'] = $checkOut->toDateString();
            }

            $days = max($checkIn->diffInDays($checkOut), 1);
            // If they just book for a few hours over midnight, it's 1 day billing cycle for the hour multiplier
            if ($checkIn->diffInDays($checkOut) === 1 && $checkOutTime->diffInHours($checkInTime) < 24) {
                $days = 1;
            }
        }

        // Calculate base total for facility
        $total = 0;
        $ticketFacility = Facility::where('type', 'ticket')->where('is_active', true)->first();
        $ticketPrice = $ticketFacility ? ($ticketFacility->final_price ?? 10000) : 10000;

        $guestCount = $validated['guest_count'] ?? 1;

        if ($facility->type === 'ticket') {
            $total = ($facility->final_price ?? 0) * $guestCount;
        } else {
            if (! empty($validated['check_in_time']) && ! empty($validated['check_out_time'])) {
                $hours = max($checkInTime->diffInHours($checkOutTime), 1);
                if ($facility->price_per_hour > 0) {
                    $facilityTotal = $facility->price_per_hour * $hours * $days;
                } else {
                    $facilityTotal = ($facility->final_price ?? 0) * $days;
                }
            } else {
                if (in_array($facility->type, ['gazebo', 'pool'])) {
                    $checkOut = $checkIn->copy();
                    $validated['check_out_date'] = $checkOut->toDateString();
                }
                $days = max($checkIn->diffInDays($checkOut), 1);
                $facilityTotal = ($facility->final_price ?? 0) * $days;
            }

            // Total = Facility Cost (Tiket masuk dipisah)
            $total = $facilityTotal;
        }

        return DB::transaction(function () use (&$validated, $total, $userId, $sessionId) {
            // PESSIMISTIC LOCK: Lock the facility to prevent concurrent identical bookings
            $facility = Facility::where('id', $validated['facility_id'])->lockForUpdate()->firstOrFail();

            // Check availability inside the lock (skip for tickets as they don't have time constraints)
            if ($facility->type !== 'ticket' && ! $facility->isAvailable($validated['check_in_date'], $validated['check_out_date'], $validated['check_in_time'] ?? null, $validated['check_out_time'] ?? null)) {
                throw ValidationException::withMessages([
                    'check_in_date' => 'Fasilitas tidak tersedia untuk tanggal/jam yang dipilih.',
                ]);
            }

            if ($facility->type === 'homestay' && $validated['check_in_date'] === $validated['check_out_date']) {
                throw ValidationException::withMessages([
                    'check_out_date' => 'Untuk penginapan, tanggal check-out harus berbeda hari.',
                ]);
            }

            $discountAmount = 0;
            if (! empty($validated['coupon_code'])) {
                // Pessimistic lock on Coupon
                $coupon = Coupon::where('code', $validated['coupon_code'])->lockForUpdate()->first();
                if ($coupon && $coupon->isValid($total)) {
                    $discountAmount = $coupon->calculateDiscount($total);
                    $coupon->increment('used_count');
                } else {
                    throw ValidationException::withMessages([
                        'coupon_code' => 'Kupon tidak valid atau syarat belum terpenuhi.',
                    ]);
                }
            }

            $finalTotal = max(0, $total - $discountAmount);

            $guaranteeFee = 0;
            if ($facility->type === 'homestay') {
                $guaranteeFee = 100000;
            }

            return Reservation::create([
                ...$validated,
                'user_id' => $userId,
                'session_id' => $sessionId,
                // unique_code is auto-generated by Reservation::booted()
                'total_amount' => $finalTotal,
                'guarantee_fee' => $guaranteeFee,
                'discount_amount' => $discountAmount,
                'status' => 'pending',
                'payment_status' => 'unpaid',
            ]);
        });
    }
}
