<?php

namespace Tests\Feature;

use App\Models\Facility;
use App\Models\Payment;
use App\Models\Reservation;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TripayWebhookTest extends TestCase
{
    use RefreshDatabase;

    public function test_tripay_webhook_verifies_signature_and_updates_status()
    {
        // Mock config
        config(['services.tripay.private_key' => 'secret']);

        $facility = Facility::create([
            'name' => 'Homestay A',
            'type' => 'homestay',
            'price_per_day' => 100000,
        ]);

        $reservation = Reservation::create([
            'facility_id' => $facility->id,
            'check_in_date' => now()->addDays(5)->toDateString(),
            'check_out_date' => now()->addDays(6)->toDateString(),
            'guest_count' => 2,
            'customer_name' => 'John Doe',
            'customer_email' => 'john@example.com',
            'customer_phone' => '08123456789',
            'total_amount' => 50000,
            'status' => 'pending',
            'payment_status' => 'unpaid',
            'unique_code' => 'TEST1234',
        ]);
        $payment = Payment::create([
            'reservation_id' => $reservation->id,
            'amount' => 50000,
            'payment_method' => 'tripay',
            'payment_status' => 'pending',
            'payment_reference' => 'MERCHANT-123',
        ]);

        $payload = json_encode([
            'merchant_ref' => 'MERCHANT-123',
            'reference' => 'TRIPAY-456',
            'status' => 'PAID',
        ]);

        // Create signature
        $signature = hash_hmac('sha256', $payload, 'secret');

        $response = $this->withHeaders([
            'X-Callback-Signature' => $signature,
        ])->postJson('/webhook/tripay', json_decode($payload, true));

        $response->assertStatus(200);
        $response->assertJson(['success' => true]);

        $this->assertEquals('success', $payment->fresh()->payment_status);
        $this->assertEquals('TRIPAY-456', $payment->fresh()->transaction_id);
    }

    public function test_tripay_webhook_rejects_invalid_signature()
    {
        $response = $this->withHeaders([
            'X-Callback-Signature' => 'invalid-signature',
        ])->postJson('/webhook/tripay', [
            'merchant_ref' => 'MERCHANT-123',
            'status' => 'PAID',
        ]);

        $response->assertStatus(401);
    }
}
