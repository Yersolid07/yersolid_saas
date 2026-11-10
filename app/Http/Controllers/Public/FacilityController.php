<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Models\Facility;
use App\Models\Reservation;
use App\Models\Review;
use Carbon\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class FacilityController extends Controller
{
    public function index(): Response
    {
        $facilities = Facility::active()
            ->whereNotIn('type', ['ticket', 'tiket'])
            ->withCount('reservations')
            ->get();

        $avgRating = Review::where('is_public', true)->avg('rating');

        return Inertia::render('Public/Facilities', [
            'facilities' => $facilities,
            'avgRating' => $avgRating,
        ]);
    }

    public function show(Facility $facility): Response
    {
        $reviews = Review::with('user')
            ->whereHas('reservation', fn ($q) => $q->where('facility_id', $facility->id))
            ->where('is_public', true)
            ->latest()
            ->limit(10)
            ->get();

        return Inertia::render('Public/FacilityDetail', [
            'facility' => $facility,
            'reviews' => $reviews,
            'avgRating' => $reviews->avg('rating'),
        ]);
    }

    public function bookedDates(Facility $facility)
    {
        $reservations = Reservation::where('facility_id', $facility->id)
            ->whereIn('status', ['confirmed', 'pending'])
            ->where('check_in_date', '>=', now()->toDateString())
            ->get(['check_in_date', 'check_out_date']);

        $bookedDates = [];
        foreach ($reservations as $res) {
            // Include dates from check-in to check-out (excluding check-out day if it's purely checkout, but we'll include all to be safe and disable the whole range)
            // Wait, usually check-out day is available for check-in.
            // Let's disable the dates strictly between check_in and check_out. Check-in day is blocked, check-out day is available for check-in.
            $checkIn = Carbon::parse($res->check_in_date);
            $checkOut = Carbon::parse($res->check_out_date);

            // Loop from checkIn to checkOut minus 1 day.
            for ($d = $checkIn; $d->lt($checkOut); $d->addDay()) {
                $bookedDates[] = $d->format('Y-m-d');
            }
            // If it's a 1-day booking (check-in == check-out, though unlikely), block it.
            if ($res->check_in_date === $res->check_out_date) {
                $bookedDates[] = $res->check_in_date;
            }
        }

        return response()->json(array_values(array_unique($bookedDates)));
    }
}
