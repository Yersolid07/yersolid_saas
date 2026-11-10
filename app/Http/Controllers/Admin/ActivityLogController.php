<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Spatie\Activitylog\Models\Activity;

class ActivityLogController extends Controller
{
    public function index(Request $request)
    {
        $query = Activity::with(['causer', 'subject'])->latest();

        if ($request->filled('log_name')) {
            $query->where('log_name', $request->log_name);
        }

        if ($request->filled('event')) {
            $query->where('event', $request->event);
        }

        if ($request->filled('causer_id')) {
            $query->where('causer_id', $request->causer_id);
        }

        if ($request->filled('subject_type')) {
            // Map simple names to full class names
            $subjectMap = [
                'user' => 'App\Models\User',
                'reservation' => 'App\Models\Reservation',
                'food_order' => 'App\Models\FoodOrder',
                'menu_item' => 'App\Models\MenuItem',
                'inventory' => 'App\Models\Inventory',
                'financial_transaction' => 'App\Models\FinancialTransaction',
                'facility' => 'App\Models\Facility',
                'setting' => 'App\Models\Setting',
            ];
            $mappedType = $subjectMap[$request->subject_type] ?? $request->subject_type;
            $query->where('subject_type', $mappedType);
        }

        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        $logs = $query->paginate(20)->withQueryString();

        // Fetch users for the filter dropdown
        $users = User::select('id', 'name')->orderBy('name')->get();

        return Inertia::render('Admin/ActivityLogs/Index', [
            'logs' => $logs,
            'filters' => $request->only(['log_name', 'event', 'causer_id', 'subject_type', 'date_from', 'date_to']),
            'users' => $users,
        ]);
    }
}
