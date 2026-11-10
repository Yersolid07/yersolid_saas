<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Facility;
use App\Models\FoodOrder;
use App\Models\MenuItem;

class PublicController extends Controller
{
    // GET /api/v1/facilities
    public function facilities()
    {
        return response()->json([
            'version' => 'v1',
            'data' => Facility::where('is_available', true)->get(),
        ]);
    }

    // GET /api/v1/menu-items
    public function menuItems()
    {
        return response()->json([
            'version' => 'v1',
            'data' => MenuItem::where('is_available', true)->get(),
        ]);
    }

    // GET /api/v1/food-orders/{id}/status  (public tracking, no auth)
    // Mirrors CustomerFoodOrderController@show authorization:
    // - authenticated user may view their own order (staff/admin any)
    // - guest may view guest orders (user_id null) only
    public function foodOrderStatus(FoodOrder $order)
    {
        $user = auth()->user();

        if ($user) {
            if (! $user->hasAnyRole(['admin', 'manager', 'staff']) && $order->user_id !== $user->id) {
                abort(403, 'Anda tidak berhak melihat pesanan ini.');
            }
        } else {
            if ($order->user_id !== null) {
                abort(403, 'Sesi Anda tidak cocok dengan pesanan ini.');
            }
        }

        return response()->json([
            'version' => 'v1',
            'data' => [
                'id' => $order->id,
                'status' => $order->status,
                'payment_status' => $order->payment_status,
                'total_amount' => $order->total_amount,
            ],
        ]);
    }
}
