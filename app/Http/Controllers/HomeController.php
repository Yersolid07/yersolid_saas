<?php

namespace App\Http\Controllers;

use App\Models\Banner;
use App\Models\Facility;
use App\Models\FoodOrder;
use App\Models\MenuItem;
use App\Models\Review;
use App\Models\Setting;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;

class HomeController extends Controller
{
    public function index()
    {
        $facilities = Cache::remember('home_facilities', 3600, function () {
            return Facility::where('is_active', true)
                ->whereNotIn('type', ['ticket', 'tiket'])
                ->withCount('reservations')
                ->orderByDesc('reservations_count')
                ->take(3)
                ->get();
        });

        // Get top available menu items (cache 1 hour)
        $menuItems = Cache::remember('home_menu_items', 3600, function () {
            return MenuItem::where('is_available', true)
                ->orderByDesc('price')
                ->take(4)
                ->get();
        });

        // Get reviews with 5 stars (cache 1 hour)
        $reviews = Cache::remember('home_reviews', 3600, function () {
            return Review::with(['user:id,name,avatar'])
                ->where('is_visible', true)
                ->where('rating', 5)
                ->latest()
                ->take(5)
                ->get();
        });

        // Get all settings (cache 24 hours)
        $settings = Cache::remember('cms_settings', 86400, function () {
            return Setting::all()->keyBy('key')->map(function ($setting) {
                return $setting->value;
            })->toArray();
        });

        // Get banners (cache 1 hour)
        $banners = Cache::remember('home_banners', 3600, function () {
            return Banner::where('is_active', true)
                ->orderBy('sort_order')
                ->get();
        });

        // ── Guest Order Tracking ──────────────────────────────────────────────
        // If a non-authenticated guest has an active order from this session,
        // pass the summary so Welcome.jsx can show a "resume tracking" banner.
        $guestActiveOrder = null;
        if (! auth()->check() && session()->has('guest_order_id')) {
            $guestActiveOrder = FoodOrder::where('id', session('guest_order_id'))
                ->whereNotIn('status', ['delivered', 'cancelled'])
                ->select(['id', 'status', 'payment_status', 'total_amount'])
                ->first();

            // Clean up stale session key if order is gone or complete
            if (! $guestActiveOrder) {
                session()->forget('guest_order_id');
            }
        }

        return Inertia::render('Welcome', [
            'facilities' => $facilities,
            'menuItems' => $menuItems,
            'reviews' => $reviews,
            'siteSettings' => $settings,
            'banners' => $banners,
            'guestActiveOrder' => $guestActiveOrder,
        ]);
    }
}
