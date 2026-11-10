<?php

use App\Http\Controllers\Admin\ActivityLogController;
use App\Http\Controllers\Admin\BannerController;
use App\Http\Controllers\Admin\BiController;
use App\Http\Controllers\Admin\BiHppController;
use App\Http\Controllers\Admin\CouponController as AdminCouponController;
use App\Http\Controllers\Admin\FacilityController as AdminFacilityController;
use App\Http\Controllers\Admin\FoodOrderController as AdminFoodOrderController;
use App\Http\Controllers\Admin\GazeboController;
use App\Http\Controllers\Admin\InventoryController;
use App\Http\Controllers\Admin\MenuItemController as AdminMenuItemController;
use App\Http\Controllers\Admin\PaymentController as AdminPaymentController;
use App\Http\Controllers\Admin\QRCodeController;
use App\Http\Controllers\Admin\ReportController as AdminReportController;
use App\Http\Controllers\Admin\ReservationController as AdminReservationController;
use App\Http\Controllers\Admin\ReviewController as AdminReviewController;
use App\Http\Controllers\Admin\SettingController as AdminSettingController;
use App\Http\Controllers\Admin\UserController as AdminUserController;
use App\Http\Controllers\Auth\GoogleController;
use App\Http\Controllers\Customer\FoodOrderController as CustomerFoodOrderController;
use App\Http\Controllers\Customer\InvoiceController;
use App\Http\Controllers\Customer\PaymentController as CustomerPaymentController;
use App\Http\Controllers\Customer\ReservationController as CustomerReservationController;
use App\Http\Controllers\Customer\ReviewController as CustomerReviewController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\Public\FacilityController as PublicFacilityController;
use App\Http\Controllers\Public\MenuItemController;
use App\Http\Controllers\Staff\DailyStockController;
use App\Http\Controllers\Staff\FoodOrderController as StaffFoodOrderController;
use App\Http\Controllers\Staff\HistoryController;
use App\Http\Controllers\Staff\InventoryController as StaffInventoryController;
use App\Http\Controllers\Staff\PaymentController as StaffPaymentController;
use App\Http\Controllers\Staff\PaymentStatusController;
use App\Http\Controllers\Staff\PosClosingController;
use App\Http\Controllers\Staff\POSController;
use App\Http\Controllers\Staff\ReservationController as StaffReservationController;
use App\Http\Controllers\Staff\TableStatusController;
use App\Http\Controllers\Staff\TicketController;
use App\Models\Setting;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Public Routes
|--------------------------------------------------------------------------
*/

Route::get('/', [HomeController::class, 'index'])->name('home');
Route::get('/fasilitas', [PublicFacilityController::class, 'index'])->name('facilities.public');
Route::get('/fasilitas/{facility}', [PublicFacilityController::class, 'show'])->name('facilities.public.show');
Route::get('/fasilitas/{facility}/booked-dates', [PublicFacilityController::class, 'bookedDates'])->name('facilities.public.booked-dates');
Route::get('/katalog', [MenuItemController::class, 'index'])->name('catalog.public');
Route::get('/tables/available', [TableStatusController::class, 'available'])->name('tables.available');
// Informational pages
Route::get('/kebijakan-privasi', function () {
    return inertia('Public/PrivacyPolicy', [
        'cms_settings' => Setting::pluck('value', 'key')->toArray(),
    ]);
})->name('privacy');

Route::get('/ketentuan-layanan', function () {
    return inertia('Public/TermsOfService', [
        'cms_settings' => Setting::pluck('value', 'key')->toArray(),
    ]);
})->name('terms');

Route::get('/tentang-kami', function () {
    return inertia('Public/AboutUs', [
        'cms_settings' => Setting::pluck('value', 'key')->toArray(),
    ]);
})->name('about');
// Payment gateway webhooks (no auth)
Route::post('/webhook/tripay', [AdminPaymentController::class, 'tripayWebhook'])->name('webhook.tripay');

Route::prefix('pesanan')->name('customer.orders.')->group(function () {
    Route::get('/baru', [CustomerFoodOrderController::class, 'create'])->name('create');
    Route::post('/', [CustomerFoodOrderController::class, 'store'])->middleware('throttle:3,1')->name('store');
    Route::get('/{order}/track', [CustomerFoodOrderController::class, 'show'])->name('show');
    Route::get('/{order}/print', [InvoiceController::class, 'foodOrder'])->name('print');
});

// Guest & Customer Reservations (Publicly accessible but handled smartly)
Route::prefix('reservasi')->name('customer.reservations.')->group(function () {
    Route::get('/baru', [CustomerReservationController::class, 'create'])->name('create');
    Route::post('/', [CustomerReservationController::class, 'store'])->middleware('throttle:5,1')->name('store');
    Route::post('/cek-kupon', [CustomerReservationController::class, 'checkCoupon'])->name('check-coupon');
    Route::get('/{reservation}', [CustomerReservationController::class, 'show'])->name('show');
    Route::get('/{reservation}/kupon', [CustomerReservationController::class, 'coupon'])->name('coupon');
    Route::get('/{reservation}/print', [InvoiceController::class, 'reservation'])->name('print');
});

/*
|--------------------------------------------------------------------------
| Authenticated Routes
|--------------------------------------------------------------------------
*/

Route::middleware(['auth', 'verified'])->group(function () {

    // Dashboard (role-based)
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

    // Notifications
    Route::get('/notifications', [NotificationController::class, 'index'])->name('notifications.index');
    Route::post('/notifications/{id}/read', [NotificationController::class, 'markAsRead'])->name('notifications.read');
    Route::post('/notifications/read-all', [NotificationController::class, 'markAllAsRead'])->name('notifications.read-all');

    // Profile
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    /*
    |------------------------------------------------------------------
    | Customer Routes
    |------------------------------------------------------------------
    */
    Route::prefix('reservasi')->name('customer.reservations.')->middleware('role:customer|admin|manager|staff')->group(function () {
        Route::get('/', [CustomerReservationController::class, 'index'])->name('index');
        Route::patch('/{reservation}/cancel', [CustomerReservationController::class, 'cancel'])->name('cancel');
    });

    Route::prefix('pesanan')->name('customer.orders.')->middleware('role:customer|admin|manager|staff')->group(function () {
        Route::get('/', [CustomerFoodOrderController::class, 'index'])->name('index');
    });

    Route::prefix('ulasan')->name('customer.reviews.')->middleware('role:customer|admin|manager|staff')->group(function () {
        Route::post('/', [CustomerReviewController::class, 'store'])->middleware('throttle:5,1')->name('store');
        Route::put('/{review}', [CustomerReviewController::class, 'update'])->name('update');
    });

    Route::prefix('pembayaran')->name('customer.payments.')->middleware('role:customer|admin|manager|staff')->group(function () {
        Route::get('/', [CustomerPaymentController::class, 'index'])->name('index');
        Route::post('/', [CustomerPaymentController::class, 'store'])->middleware('throttle:5,1')->name('store');
        Route::get('/{payment}', [CustomerPaymentController::class, 'show'])->name('show');
    });

    /*
    |------------------------------------------------------------------
    | Staff Routes
    |------------------------------------------------------------------
    */
    Route::prefix('staff')->name('staff.')->middleware('role:admin|manager|staff')->group(function () {
        Route::get('/reservations', [StaffReservationController::class, 'index'])->name('reservations.index');
        Route::get('/reservations/scan', [StaffReservationController::class, 'scan'])->name('reservations.scan');
        Route::get('/facility-display', [StaffReservationController::class, 'facilityDisplay'])->name('facility-display');
        Route::get('/table-map', [TableStatusController::class, 'map'])->name('table-map');
        Route::post('/reservations/verify', [StaffReservationController::class, 'verify'])->name('reservations.verify');
        Route::patch('/reservations/{reservation}/status', [StaffReservationController::class, 'updateStatus'])->name('reservations.status');

        Route::get('/history', [HistoryController::class, 'index'])->name('history.index');
        Route::get('/inventory', [StaffInventoryController::class, 'index'])->name('inventory.index');
        Route::post('/inventory/{inventory}/transaction', [StaffInventoryController::class, 'transaction'])->name('inventory.transaction');
        Route::post('/inventory/{inventory}/transfer-to-menu', [StaffInventoryController::class, 'transferToMenu'])->name('inventory.transfer-to-menu');
        Route::get('/payments', [StaffPaymentController::class, 'index'])->name('payments.index');
        Route::patch('/payments/{payment}/verify', [StaffPaymentController::class, 'verify'])->name('payments.verify');

        // POS & Food Orders
        Route::get('/pos', [POSController::class, 'index'])->name('pos.index');
        Route::post('/pos', [POSController::class, 'store'])->name('pos.store');
        Route::get('/pos/print/{order}', [POSController::class, 'print'])->name('pos.print');

        // #3 Gerbang Kasir: pesanan online menunggu ACC sebelum masuk KDS
        Route::post('/food-orders/{order}/approve', [StaffFoodOrderController::class, 'approve'])->name('food-orders.approve');
        Route::post('/food-orders/{order}/reject', [StaffFoodOrderController::class, 'reject'])->name('food-orders.reject');

        // Tiket Masuk Kolam / Fasilitas
        Route::get('/tickets', [TicketController::class, 'index'])->name('tickets.index');
        Route::post('/tickets', [TicketController::class, 'store'])->name('tickets.store');

        Route::get('/food-orders', [StaffFoodOrderController::class, 'index'])->name('food-orders.index');
        Route::delete('/food-orders/{order}', [StaffFoodOrderController::class, 'destroy'])->name('food-orders.destroy');
        Route::patch('/food-orders/{order}/items/{item}/status', [StaffFoodOrderController::class, 'updateItemStatus'])->name('food-orders.items.status');
        Route::get('/kds', [StaffFoodOrderController::class, 'kds'])->name('kds');
        Route::patch('/food-orders/{order}/status', [StaffFoodOrderController::class, 'updateStatus'])->name('food-orders.status');
        Route::patch('/food-orders/{order}/timer', [StaffFoodOrderController::class, 'updateTimer'])->name('food-orders.timer');

        // Daily Stock
        Route::get('/daily-stock', [DailyStockController::class, 'index'])->name('daily-stock.index');
        Route::post('/daily-stock', [DailyStockController::class, 'update'])->name('daily-stock.update');

        // POS Closing
        Route::get('/pos-closing', [PosClosingController::class, 'index'])->name('pos-closing.index');
        Route::post('/pos-closing', [PosClosingController::class, 'store'])->name('pos-closing.store');

        // Polling Payment Status
        Route::get('/payments/{id}/status', [PaymentStatusController::class, 'show'])->name('payments.status');
    });

    /*
    |------------------------------------------------------------------
    | Admin Routes
    |------------------------------------------------------------------
    */
    Route::prefix('admin')->name('admin.')->middleware('role:admin|manager')->group(function () {

        // Inventories
        Route::get('/inventories', [InventoryController::class, 'index'])->name('inventories.index');
        Route::post('/inventories', [InventoryController::class, 'store'])->name('inventories.store');
        Route::put('/inventories/{inventory}', [InventoryController::class, 'update'])->name('inventories.update');
        Route::delete('/inventories/{inventory}', [InventoryController::class, 'destroy'])->name('inventories.destroy');
        Route::post('/inventories/{inventory}/transaction', [InventoryController::class, 'transaction'])->name('inventories.transaction');
        Route::post('/inventories/{inventory}/set-stock', [InventoryController::class, 'setStock'])->name('inventories.set-stock');
        Route::post('/inventories/{inventory}/transfer-to-menu', [InventoryController::class, 'transferToMenu'])->name('inventories.transfer-to-menu');

        // Facilities
        Route::resource('facilities', AdminFacilityController::class);
        Route::patch('facilities/{facility}/toggle-status', [AdminFacilityController::class, 'toggleStatus'])
            ->name('facilities.toggle-status');

        // Gazebos (master data meja, dikelompokkan per gazebo)
        Route::get('gazebos', [GazeboController::class, 'index'])->name('gazebos.index');
        Route::post('gazebos', [GazeboController::class, 'store'])->name('gazebos.store');
        Route::put('gazebos/{gazebo}', [GazeboController::class, 'update'])->name('gazebos.update');
        Route::delete('gazebos/{gazebo}', [GazeboController::class, 'destroy'])->name('gazebos.destroy');
        Route::post('gazebos/{gazebo}/tables', [GazeboController::class, 'addTable'])->name('gazebos.tables.store');
        Route::delete('gazebos/{gazebo}/tables/{table}', [GazeboController::class, 'removeTable'])->name('gazebos.tables.destroy');

        // Reservations
        Route::get('reservations', [AdminReservationController::class, 'index'])->name('reservations.index');
        Route::get('reservations/calendar', [AdminReservationController::class, 'calendar'])->name('reservations.calendar');
        Route::get('reservations/{reservation}', [AdminReservationController::class, 'show'])->name('reservations.show');
        Route::patch('reservations/{reservation}/status', [AdminReservationController::class, 'updateStatus'])->name('reservations.status');
        Route::delete('reservations/{reservation}', [AdminReservationController::class, 'destroy'])->name('reservations.destroy');
        // #4 DP / deposit reservasi — otomatis (online) & manual (walk-in / di luar app)
        Route::post('reservations/{reservation}/dp', [AdminReservationController::class, 'recordDp'])->name('reservations.dp');
        Route::post('reservations/{reservation}/settle', [AdminReservationController::class, 'settle'])->name('reservations.settle');

        // Menu Items
        Route::resource('menu-items', AdminMenuItemController::class);
        Route::patch('menu-items/{menuItem}/toggle', [AdminMenuItemController::class, 'toggleAvailability'])
            ->name('menu-items.toggle');

        // Promo / Coupons
        Route::middleware('role:admin|manager')->group(function () {
            Route::resource('coupons', AdminCouponController::class)->except(['show']);
            Route::patch('coupons/{coupon}/toggle', [AdminCouponController::class, 'toggle'])->name('coupons.toggle');
        });

        // Food Orders
        Route::get('food-orders', [AdminFoodOrderController::class, 'index'])->name('food-orders.index');
        Route::patch('food-orders/{order}/status', [AdminFoodOrderController::class, 'updateStatus'])->name('food-orders.status');
        Route::delete('food-orders/{order}', [AdminFoodOrderController::class, 'destroy'])->name('food-orders.destroy');

        // Payments
        Route::get('payments', [AdminPaymentController::class, 'index'])->name('payments.index');
        Route::post('payments', [AdminPaymentController::class, 'store'])->name('payments.store');
        Route::patch('payments/{payment}/verify', [AdminPaymentController::class, 'verify'])->name('payments.verify');

        // Reviews
        Route::get('reviews', [AdminReviewController::class, 'index'])->name('reviews.index');
        Route::patch('reviews/{review}/toggle-visibility', [AdminReviewController::class, 'toggleVisibility'])->name('reviews.toggle');
        Route::delete('reviews/{review}', [AdminReviewController::class, 'destroy'])->name('reviews.destroy');

        // BI — HPP massal (usulan & simpan)
        Route::post('bi/hpp/propose', [BiHppController::class, 'propose'])->name('bi.hpp.propose');
        Route::post('bi/hpp/apply', [BiHppController::class, 'apply'])->name('bi.hpp.apply');

        // Reports
        Route::get('reports', [AdminReportController::class, 'index'])->name('reports.index');
        Route::get('reports/export-pdf', [AdminReportController::class, 'exportPdf'])->name('reports.pdf');
        Route::get('reports/export-excel', [AdminReportController::class, 'exportExcel'])->name('reports.excel');
        Route::post('reports/transaction', [AdminReportController::class, 'storeTransaction'])->name('reports.store-transaction');

        // Business Intelligence (Pusat Keputusan Bisnis)
        Route::get('bi', [BiController::class, 'index'])->name('bi.index');
        Route::post('bi/decisions', [BiController::class, 'storeDecision'])->name('bi.decisions.store');
        Route::patch('bi/decisions/{decision}', [BiController::class, 'updateDecision'])->name('bi.decisions.update');
        Route::post('bi/snapshot', [BiController::class, 'snapshot'])->name('bi.snapshot');

        // Banners (CMS)
        Route::resource('banners', BannerController::class)->except(['create', 'show', 'edit']);
        Route::patch('banners/{banner}/toggle-status', [BannerController::class, 'toggleStatus'])->name('banners.toggle-status');
        Route::post('banners/reorder', [BannerController::class, 'reorder'])->name('banners.reorder');

        // Admin-only Routes
        Route::middleware('role:admin')->group(function () {
            // Activity Logs
            Route::get('activity-logs', [ActivityLogController::class, 'index'])->name('activity-logs.index');

            // Users & Roles
            Route::resource('users', AdminUserController::class)->except(['show']);
            Route::patch('users/{user}/role', [AdminUserController::class, 'updateRole'])->name('users.role');

            // QR Codes
            Route::get('/qrcodes', [QRCodeController::class, 'index'])->name('qrcodes.index');
            Route::post('/qrcodes/generate', [QRCodeController::class, 'generate'])->name('qrcodes.generate');
            Route::delete('/qrcodes/{qrcode}', [QRCodeController::class, 'destroy'])->name('qrcodes.destroy');

            // Settings
            Route::get('settings', [AdminSettingController::class, 'index'])->name('settings.index');
            Route::post('settings', [AdminSettingController::class, 'update'])->name('settings.update');
            Route::post('settings/reset-data', [AdminSettingController::class, 'resetData'])->name('settings.reset-data');
        });
    });
});

// Google OAuth
Route::get('auth/google', [GoogleController::class, 'redirectToGoogle'])->name('auth.google');
Route::get('auth/google/callback', [GoogleController::class, 'handleGoogleCallback']);

require __DIR__.'/auth.php';
// Sitemap and Robots.txt
use App\Models\Facility;
use App\Models\MenuItem;
use Spatie\Sitemap\Sitemap;
use Spatie\Sitemap\Tags\Url;

Route::get('/sitemap.xml', function () {
    $sitemap = Sitemap::create();

    // Home
    $sitemap->add(Url::create('/')->setPriority(1.0)->setChangeFrequency(Url::CHANGE_FREQUENCY_DAILY));

    // Katalog
    $sitemap->add(Url::create('/katalog')->setPriority(0.9)->setChangeFrequency(Url::CHANGE_FREQUENCY_DAILY));

    // Fasilitas
    $sitemap->add(Url::create('/fasilitas')->setPriority(0.9)->setChangeFrequency(Url::CHANGE_FREQUENCY_DAILY));

    // About
    $sitemap->add(Url::create('/tentang-kami')->setPriority(0.8)->setChangeFrequency(Url::CHANGE_FREQUENCY_MONTHLY));

    // Privacy
    $sitemap->add(Url::create('/kebijakan-privasi')->setPriority(0.8)->setChangeFrequency(Url::CHANGE_FREQUENCY_YEARLY));

    // Terms
    $sitemap->add(Url::create('/ketentuan-layanan')->setPriority(0.8)->setChangeFrequency(Url::CHANGE_FREQUENCY_YEARLY));

    // Facilities detail
    foreach (Facility::all() as $facility) {
        $sitemap->add(Url::create('/fasilitas/'.$facility->id)->setPriority(0.8)->setChangeFrequency(Url::CHANGE_FREQUENCY_WEEKLY));
    }

    // Menu items (available, limit)
    foreach (MenuItem::where('is_available', true)->limit(500)->get() as $item) {
        $slug = $item->slug ?? $item->id;
        $sitemap->add(Url::create('/katalog/'.$slug)->setPriority(0.7)->setChangeFrequency(Url::CHANGE_FREQUENCY_WEEKLY));
    }

    return response($sitemap->render(), 200, ['Content-Type' => 'application/xml']);
});

Route::get('/robots.txt', function () {
    $content = implode("\n", [
        'User-agent: *',
        'Allow: /',
        'Disallow: /staff/',
        'Disallow: /admin/',
        '',
        'Sitemap: '.url('/sitemap.xml'),
    ]);

    return response($content, 200, ['Content-Type' => 'text/plain']);
});
