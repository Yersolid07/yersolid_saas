<?php

namespace App\Providers;

use App\Http\ViewComposers\SeoMetaComposer;
use Illuminate\Support\Facades\View;
use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Vite::prefetch(concurrency: 3);
        View::composer('*', SeoMetaComposer::class);
        \App\Models\Reservation::observe(\App\Observations\ReservationObserver::class);
    }
}
