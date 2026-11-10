<?php

namespace App\Http\Controllers\Staff;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use Illuminate\Http\JsonResponse;

class PaymentStatusController extends Controller
{
    public function show(string $id): JsonResponse
    {
        $payment = Payment::findOrFail($id);

        return response()->json([
            'status' => $payment->payment_status,
        ]);
    }
}
