<?php

namespace App\Http\Middleware;

use App\Models\Setting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Schema;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $cmsSettings = Cache::remember('cms_settings', 60 * 24, function () {
            if (Schema::hasTable('settings')) {
                return Setting::pluck('value', 'key')->toArray();
            }

            return [];
        });

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $request->user() ? [
                    ...$request->user()->only('id', 'name', 'email', 'phone', 'address', 'avatar'),
                    'avatar_url' => $request->user()->avatar_url,
                    'roles' => $request->user()->roles->map->only('name'),
                    'permissions' => $request->user()->getAllPermissions()->map->only('name'),
                    'unreadNotifications' => fn () => Cache::remember('user_notifications_'.$request->user()->id, 30, fn () => $request->user()->unreadNotifications()->take(5)->get()),
                    'unreadCount' => fn () => Cache::remember('user_notifications_count_'.$request->user()->id, 30, fn () => $request->user()->unreadNotifications()->count()),
                ] : null,
            ],
            'roles' => $request->user() ? $request->user()->getRoleNames() : [],
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
                'warning' => fn () => $request->session()->get('warning'),
                'print_order_id' => fn () => $request->session()->get('print_order_id'),
                'print_order_data' => fn () => $request->session()->get('print_order_data'),
                'change_amount' => fn () => $request->session()->get('change_amount'),
                'checkout_url' => fn () => $request->session()->get('checkout_url'),
                'qr_url' => fn () => $request->session()->get('qr_url'),
                'payment_id' => fn () => $request->session()->get('payment_id'),
                'print_ticket_id' => fn () => $request->session()->get('print_ticket_id'),
                'order_details' => fn () => $request->session()->get('order_details'),
            ],
            'cms_settings' => $cmsSettings,
        ];
    }
}
