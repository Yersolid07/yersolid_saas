<?php

namespace App\Http\Controllers\Staff;

use App\Http\Controllers\Controller;
use App\Models\FoodOrder;
use App\Models\QRCode;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TableStatusController extends Controller
{
    /**
     * Compute real-time status for all tables (from QR codes).
     * Shared by KDS map and other views.
     *
     * Optimized: a single query fetches all active orders, then grouped
     * in PHP — avoids the previous N+1 (one FoodOrder query per table).
     */
    public static function tableStatuses(): array
    {
        $tables = QRCode::with('gazebo')
            ->where('location_type', 'table')
            ->orderBy('table_number')
            ->get(['id', 'label', 'table_number', 'image_path', 'gazebo_id']);

        // A table is occupied while there is an order associated with it that
        // is NOT yet completed or cancelled (i.e., status pending, preparing,
        // ready, delivered). Payment status does NOT affect occupancy – a
        // table remains occupied from the moment an order is placed until the
        // staff marks the order as completed (and cleans the table).
        $activeOrders = FoodOrder::selectRaw('*, UPPER(TRIM(table_number)) as norm_table')
            ->whereNotIn('status', ['completed', 'cancelled'])
            ->whereNotNull('table_number')
            ->where('table_number', '<>', '')
            ->get()
            ->groupBy('norm_table');

        return $tables->map(function ($table) use ($activeOrders) {
            $normTable = strtoupper(trim($table->table_number));
            $tableOrders = $activeOrders->get($normTable);
            $activeOrder = $tableOrders ? $tableOrders->sortByDesc('created_at')->first() : null;

            $isOccupied = (bool) $activeOrder;

            return [
                'id' => $table->id,
                'label' => $table->label,
                'table_number' => $table->table_number,
                'gazebo_id' => $table->gazebo_id,
                'gazebo_name' => $table->gazebo?->name,
                'image_path' => $table->image_path,
                'status' => $isOccupied ? 'occupied' : 'available',
                'order' => $isOccupied ? [
                    'id' => $activeOrder->id,
                    'status' => $activeOrder->status,
                    'customer' => $activeOrder->customer_name,
                    'items_count' => $activeOrder->items->count(),
                    'total' => $activeOrder->total_amount,
                ] : null,
            ];
        })->all();
    }

    /**
     * Real-time table map for KDS / display screen.
     * Returns all tables (from QR codes) with current occupancy status.
     */
    public function map(): Response
    {
        return Inertia::render('Staff/FoodOrders/TableMap', [
            'tables' => self::tableStatuses(),
        ]);
    }

    /**
     * Public API: list of available (free) tables for customer web ordering.
     */
    public function available(Request $request)
    {
        $statuses = self::tableStatuses();
        $available = array_values(array_filter($statuses, fn ($t) => $t['status'] === 'available'));

        if ($request->wantsJson()) {
            return response()->json($available);
        }

        return $available;
    }
}
