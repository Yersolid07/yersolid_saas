<?php

namespace App\Http\Controllers\Staff;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PaymentController extends Controller
{
    public function index(Request $request): Response
    {
        $payments = Payment::query()
            ->with(['reservation.user', 'reservation.facility', 'foodOrder.user'])
            ->when($request->status, fn ($q) => $q->where('payment_status', $request->status))
            ->when($request->method, fn ($q) => $q->where('payment_method', $request->method))
            ->when($request->date_from, fn ($q) => $q->whereDate('created_at', '>=', $request->date_from))
            ->when($request->date_to, fn ($q) => $q->whereDate('created_at', '<=', $request->date_to))
            ->latest()
            ->paginate(15)
            ->withQueryString();

        $stats = [
            'total_today' => Payment::whereDate('created_at', today())->where('payment_status', 'success')->sum('amount'),
            'total_month' => Payment::whereMonth('created_at', now()->month)->where('payment_status', 'success')->sum('amount'),
            'pending_count' => Payment::where('payment_status', 'pending')->count(),
        ];

        return Inertia::render('Staff/Payments/Index', [
            'payments' => $payments,
            'filters' => $request->only(['status', 'method', 'date_from', 'date_to']),
            'stats' => $stats,
        ]);
    }

    public function verify(Request $request, Payment $payment)
    {
        $request->validate([
            'payment_status' => 'required|in:success,pending,failed',
        ]);

        $payment->update([
            'payment_status' => $request->payment_status,
            'verified_by' => auth()->id(),
            'verified_at' => now(),
        ]);

        return back()->with('success', 'Status pembayaran diperbarui.');
    }
}
