<?php

namespace App\Http\Controllers;

use App\Models\Facility;
use App\Models\FinancialTransaction;
use App\Models\FoodOrder;
use App\Models\Payment;
use App\Models\Reservation;
use App\Models\Review;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(Request $request): Response
    {
        $user = auth()->user();

        if ($user->hasAnyRole(['admin', 'manager'])) {
            return $this->adminDashboard($request);
        }

        if ($user->hasRole('staff')) {
            return $this->staffDashboard($request);
        }

        return $this->customerDashboard();
    }

    private function getDateRange(Request $request): array
    {
        $range = $request->query('date_range', 'today');
        $start = now();
        $end = now();

        switch ($range) {
            case 'week':
                $start = now()->startOfWeek();
                $end = now()->endOfWeek();
                break;
            case 'month':
                $start = now()->startOfMonth();
                $end = now()->endOfMonth();
                break;
            case 'year':
                $start = now()->startOfYear();
                $end = now()->endOfYear();
                break;
            case 'custom':
                if ($request->has('start_date') && $request->has('end_date')) {
                    $start = Carbon::parse($request->query('start_date'))->startOfDay();
                    $end = Carbon::parse($request->query('end_date'))->endOfDay();
                }
                break;
            case 'today':
            default:
                $start = now()->startOfDay();
                $end = now()->endOfDay();
                break;
        }

        return [$start, $end];
    }

    private function getFinancialStats($startDate, $endDate): array
    {
        $income = FinancialTransaction::where('type', 'income')
            ->whereBetween('transaction_date', [$startDate->toDateString(), $endDate->toDateString()])
            ->sum('amount');

        $expense = FinancialTransaction::where('type', 'expense')
            ->whereBetween('transaction_date', [$startDate->toDateString(), $endDate->toDateString()])
            ->sum('amount');

        return [
            'income' => $income,
            'expense' => $expense,
            'net' => $income - $expense,
        ];
    }

    private function adminDashboard(Request $request): Response
    {
        [$startDate, $endDate] = $this->getDateRange($request);
        $dateRange = $request->query('date_range', 'today');

        $today = now()->toDateString();
        $thisMonth = now()->month;
        $thisYear = now()->year;

        $financials = $this->getFinancialStats($startDate, $endDate);

        $stats = [
            'total_reservations' => Reservation::whereBetween('created_at', [$startDate, $endDate])->count(),
            'pending_reservations' => Reservation::whereBetween('created_at', [$startDate, $endDate])->where('status', 'pending')->count(),
            'confirmed_today' => Reservation::where('check_in_date', $today)->where('status', 'confirmed')->count(),

            // Replaced with dynamic financials
            'revenue_range' => $financials['income'],
            'expense_range' => $financials['expense'],
            'net_range' => $financials['net'],

            'total_customers' => User::role('customer')
                ->whereBetween('created_at', [$startDate, $endDate])->count(),
            'active_food_orders' => FoodOrder::whereIn('status', ['pending', 'preparing', 'ready'])
                ->whereBetween('created_at', [$startDate, $endDate])->count(),
            'average_rating' => Review::where('is_public', true)
                ->whereBetween('created_at', [$startDate, $endDate])->avg('rating'),
            'tickets_sold_range' => Reservation::whereHas('facility', function ($q) {
                $q->where('type', 'ticket')
                    ->orWhere('type', 'tiket')
                    ->orWhere('type', 'pool')
                    ->orWhere('type', 'gazebo')
                    ->orWhere('name', 'like', '%tiket%')
                    ->orWhere('name', 'like', '%ticket%');
            })->whereBetween('check_in_date', [$startDate->toDateString(), $endDate->toDateString()])
                ->where('status', 'confirmed')->sum('guest_count'),
        ];

        $recent_reservations = Reservation::with(['user', 'facility'])
            ->latest()
            ->limit(8)
            ->get();

        $dbChart = FinancialTransaction::where('type', 'income')
            ->whereBetween('transaction_date', [$startDate->toDateString(), $endDate->toDateString()])
            ->select(
                DB::raw('DATE(transaction_date) as date'),
                DB::raw('SUM(amount) as total')
            )
            ->groupBy('date')
            ->orderBy('date')
            ->pluck('total', 'date');

        $revenue_chart = collect();

        if ($dateRange === 'year') {
            $dbChartMonth = FinancialTransaction::where('type', 'income')
                ->whereBetween('transaction_date', [$startDate->toDateString(), $endDate->toDateString()])
                ->select(
                    DB::raw('MONTH(transaction_date) as month'),
                    DB::raw('SUM(amount) as total')
                )
                ->groupBy('month')
                ->pluck('total', 'month');

            for ($i = 1; $i <= 12; $i++) {
                $monthDate = now()->startOfYear()->addMonths($i - 1);
                $revenue_chart->push([
                    'date' => $monthDate->toDateString(), // e.g. 2026-01-01
                    'total' => $dbChartMonth->get($i, 0),
                ]);
            }
        } else {
            for ($date = $startDate->copy(); $date->lte($endDate); $date->addDay()) {
                $dateStr = $date->toDateString();
                $revenue_chart->push([
                    'date' => $dateStr,
                    'total' => $dbChart->get($dateStr, 0),
                ]);
            }
        }

        $facility_occupancy = Facility::withCount([
            'reservations as active_reservations_count' => fn ($q) => $q->whereIn('status', ['confirmed'])
                ->whereBetween('check_in_date', [$startDate->toDateString(), $endDate->toDateString()]),
        ])->get(['id', 'name', 'type']);

        $recent_reviews = Review::with(['user', 'reservation.facility'])
            ->where('is_public', true)
            ->latest()
            ->limit(5)
            ->get();

        return Inertia::render('Dashboard/Admin', [
            'stats' => $stats,
            'recentReservations' => $recent_reservations,
            'revenueChart' => $revenue_chart,
            'facilityOccupancy' => $facility_occupancy,
            'recentReviews' => $recent_reviews,
            'filters' => $request->only(['date_range', 'start_date', 'end_date']),
        ]);
    }

    private function staffDashboard(Request $request): Response
    {
        [$startDate, $endDate] = $this->getDateRange($request);
        $today = now()->toDateString();
        $financials = $this->getFinancialStats($startDate, $endDate);

        return Inertia::render('Dashboard/Staff', [
            'financials' => $financials,
            'filters' => $request->only(['date_range', 'start_date', 'end_date']),
            'todayCheckIns' => Reservation::with(['user', 'facility'])
                ->where('check_in_date', $today)
                ->whereIn('status', ['confirmed'])
                ->get(),
            'todayCheckOuts' => Reservation::with(['user', 'facility'])
                ->where('check_out_date', $today)
                ->whereIn('status', ['confirmed'])
                ->get(),
            'activeFoodOrders' => FoodOrder::with(['user', 'items.menuItem'])
                ->whereIn('status', ['pending', 'preparing', 'ready'])
                ->latest()
                ->get(),
            'pendingPayments' => Payment::with(['reservation.user'])
                ->where('payment_status', 'pending')
                ->latest()
                ->limit(10)
                ->get(),
        ]);
    }

    private function customerDashboard(): Response
    {
        $user = auth()->user();

        return Inertia::render('Dashboard/Customer', [
            'upcomingReservations' => Reservation::with('facility')
                ->where('user_id', $user->id)
                ->upcoming()
                ->get(),
            'recentReservations' => Reservation::with(['facility', 'payment', 'review'])
                ->where('user_id', $user->id)
                ->latest()
                ->limit(5)
                ->get(),
            'recentOrders' => FoodOrder::with('items.menuItem')
                ->where('user_id', $user->id)
                ->latest()
                ->limit(5)
                ->get(),
        ]);
    }
}
