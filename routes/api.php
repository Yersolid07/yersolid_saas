<?php

use App\Http\Controllers\Api\V1\PublicController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes — Versioned (v1)
|--------------------------------------------------------------------------
| All endpoints are prefixed with /api/v1. Future breaking changes get
| a new prefix (v2) without disturbing v1 consumers.
|
| Current scope: public, read-only resources + order tracking.
| No auth required (public data only).
*/

Route::prefix('v1')->group(function () {
    Route::get('facilities', [PublicController::class, 'facilities']);
    Route::get('menu-items', [PublicController::class, 'menuItems']);
    Route::get('food-orders/{order}/status', [PublicController::class, 'foodOrderStatus']);
});
