<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

use App\Models\Reservation;
use App\Notifications\FeedbackRequestNotification;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schedule;

// Send Feedback Request Email 1 Day after Check-out
Schedule::call(function () {
    $yesterday = now()->subDay()->toDateString();

    $reservations = Reservation::where('check_out_date', $yesterday)
        ->whereIn('status', ['confirmed', 'completed'])
        ->with('user')
        ->get();

    foreach ($reservations as $reservation) {
        if ($reservation->user) {
            $reservation->user->notify(new FeedbackRequestNotification($reservation));
        }
    }
})->dailyAt('09:00');

// BI Daily Snapshot — agregasi deterministik untuk Pusat Keputusan Bisnis
// (dijalankan setiap hari 06:00 WIB / 06:00 +07:00). Tidak ada LLM.
use App\Services\Bi\BiSnapshotService;
Schedule::call(function () {
    app(BiSnapshotService::class)->generateRange(now()->subDays(29)->startOfDay(), now());
})->dailyAt('06:00');
