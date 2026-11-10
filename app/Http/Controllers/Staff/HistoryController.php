<?php

namespace App\Http\Controllers\Staff;

use App\Http\Controllers\Controller;
use App\Models\FoodOrder;
use App\Models\Reservation;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class HistoryController extends Controller
{
    public function index(Request $request): Response
    {
        $tab = $request->query('tab', 'orders');

        $orders = FoodOrder::query()
            ->with(['items.menuItem', 'reservation.facility', 'user'])
            ->when($request->status, fn ($q) => $q->where('status', $request->status))
            ->when($request->date_from, fn ($q) => $q->whereDate('created_at', '>=', $request->date_from))
            ->when($request->date_to, fn ($q) => $q->whereDate('created_at', '<=', $request->date_to))
            ->latest()
            ->paginate(15)
            ->withQueryString();

        $reservations = Reservation::query()
            ->with(['facility', 'user', 'payment'])
            ->when($request->status, fn ($q) => $q->where('status', $request->status))
            ->when($request->date_from, fn ($q) => $q->whereDate('created_at', '>=', $request->date_from))
            ->when($request->date_to, fn ($q) => $q->whereDate('created_at', '<=', $request->date_to))
            ->latest()
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Staff/History/Index', [
            'tab' => $tab,
            'orders' => $orders,
            'reservations' => $reservations,
            'filters' => $request->only(['status', 'date_from', 'date_to']),
        ]);
    }
}
