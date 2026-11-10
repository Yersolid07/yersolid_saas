<?php

namespace App\Http\Controllers\Staff;

use App\Http\Controllers\Controller;
use App\Models\FinancialTransaction;
use App\Models\Payment;
use App\Models\PosClosing;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PosClosingController extends Controller
{
    public function index()
    {
        $today = Carbon::today();

        // Find expected cash for today.
        // We calculate all successful cash payments made today based on payment_date
        $cashPayments = Payment::where('payment_method', 'cash')
            ->where('payment_status', 'success')
            ->whereDate('payment_date', $today)
            ->sum('amount');

        // Include tripay in QRIS calculation since QRIS is routed through Tripay
        $qrisPayments = Payment::whereIn('payment_method', ['qris', 'tripay'])
            ->where('payment_status', 'success')
            ->whereDate('payment_date', $today)
            ->sum('amount');

        $transferPayments = Payment::where('payment_method', 'transfer')
            ->where('payment_status', 'success')
            ->whereDate('payment_date', $today)
            ->sum('amount');

        $edcPayments = Payment::where('payment_method', 'edc')
            ->where('payment_status', 'success')
            ->whereDate('payment_date', $today)
            ->sum('amount');

        $ewalletPayments = Payment::where('payment_method', 'ewallet')
            ->where('payment_status', 'success')
            ->whereDate('payment_date', $today)
            ->sum('amount');

        return Inertia::render('Staff/PosClosing', [
            'expectedCash' => (float) $cashPayments,
            'expectedQris' => (float) $qrisPayments,
            'expectedTransfer' => (float) $transferPayments,
            'expectedEdc' => (float) $edcPayments,
            'expectedEwallet' => (float) $ewalletPayments,
            'today' => $today->format('Y-m-d'),
            'alreadyClosed' => PosClosing::where('date', $today->toDateString())->exists(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'closing_balance' => 'required|numeric|min:0',
            'cash_100k' => 'required|integer|min:0',
            'cash_50k' => 'required|integer|min:0',
            'cash_20k' => 'required|integer|min:0',
            'cash_10k' => 'required|integer|min:0',
            'cash_5k' => 'required|integer|min:0',
            'cash_2k' => 'required|integer|min:0',
            'cash_1k' => 'required|integer|min:0',
            'coins' => 'required|integer|min:0',
            'note' => 'nullable|string',

            // Non-cash expected (from system)
            'qris_expected' => 'required|numeric|min:0',
            'transfer_expected' => 'required|numeric|min:0',
            'edc_expected' => 'required|numeric|min:0',
            'ewallet_expected' => 'required|numeric|min:0',

            // Non-cash actual (input by cashier)
            'qris_actual' => 'required|numeric|min:0',
            'transfer_actual' => 'required|numeric|min:0',
            'edc_actual' => 'required|numeric|min:0',
            'ewallet_actual' => 'required|numeric|min:0',
        ]);

        $actualCash =
            ($validated['cash_100k'] * 100000) +
            ($validated['cash_50k'] * 50000) +
            ($validated['cash_20k'] * 20000) +
            ($validated['cash_10k'] * 10000) +
            ($validated['cash_5k'] * 5000) +
            ($validated['cash_2k'] * 2000) +
            ($validated['cash_1k'] * 1000) +
            $validated['coins'];

        $closing = PosClosing::create([
            'user_id' => auth()->id(),
            'date' => Carbon::today(),
            'opening_balance' => 0,
            'closing_balance' => $validated['closing_balance'],
            'actual_balance' => $actualCash,
            'difference' => $actualCash - $validated['closing_balance'],
            'cash_100k' => $validated['cash_100k'],
            'cash_50k' => $validated['cash_50k'],
            'cash_20k' => $validated['cash_20k'],
            'cash_10k' => $validated['cash_10k'],
            'cash_5k' => $validated['cash_5k'],
            'cash_2k' => $validated['cash_2k'],
            'cash_1k' => $validated['cash_1k'],
            'coins' => $validated['coins'],
            'total_cash_calculated' => $actualCash,
            'note' => $validated['note'],

            'qris_expected' => $validated['qris_expected'],
            'qris_actual' => $validated['qris_actual'],
            'transfer_expected' => $validated['transfer_expected'],
            'transfer_actual' => $validated['transfer_actual'],
            'edc_expected' => $validated['edc_expected'],
            'edc_actual' => $validated['edc_actual'],
            'ewallet_expected' => $validated['ewallet_expected'],
            'ewallet_actual' => $validated['ewallet_actual'],
        ]);

        // Process differences for all payment types
        $differences = [
            'Tunai' => $actualCash - $validated['closing_balance'],
            'QRIS' => $validated['qris_actual'] - $validated['qris_expected'],
            'Transfer' => $validated['transfer_actual'] - $validated['transfer_expected'],
            'EDC' => $validated['edc_actual'] - $validated['edc_expected'],
            'E-Wallet' => $validated['ewallet_actual'] - $validated['ewallet_expected'],
        ];

        foreach ($differences as $method => $diff) {
            if (abs($diff) > 0) {
                FinancialTransaction::create([
                    'type' => $diff > 0 ? 'income' : 'expense',
                    'category' => 'other',
                    'amount' => abs($diff),
                    'description' => ($diff > 0 ? 'Selisih Lebih (Overage) Kasir '.$method : 'Selisih Kurang (Shortage) Kasir '.$method).' - '.Carbon::today()->format('d M Y'),
                    'reference_id' => $closing->id,
                    'transaction_date' => Carbon::today(),
                    'user_id' => auth()->id(),
                ]);
            }
        }

        return redirect()->route('dashboard')->with('success', 'Laporan tutup kasir harian berhasil disimpan.');
    }
}
