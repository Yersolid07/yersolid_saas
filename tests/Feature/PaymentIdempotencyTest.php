<?php

namespace Tests\Feature;

use App\Models\FoodOrder;
use App\Models\MenuItem;
use App\Models\Payment;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class PaymentIdempotencyTest extends TestCase
{
    use RefreshDatabase;

    #[Test]
    public function mark_as_success_is_idempotent()
    {
        $order = FoodOrder::create([
            'total_amount' => 100000,
            'order_type' => 'dine_in',
            'payment_status' => 'pending',
            'status' => 'pending',
        ]);

        $payment = Payment::create([
            'food_order_id' => $order->id,
            'amount' => 100000,
            'payment_method' => 'cash',
            'payment_status' => 'pending',
        ]);

        $this->assertDatabaseCount('financial_transactions', 0);

        // First call should record income
        $payment->markAsSuccess('TRX-123');
        $this->assertEquals('success', $payment->fresh()->payment_status);
        $this->assertDatabaseCount('financial_transactions', 1);

        // Second call should NOT record income again
        $payment->markAsSuccess('TRX-123');
        $this->assertDatabaseCount('financial_transactions', 1);
    }

    #[Test]
    public function mark_as_failed_is_idempotent_and_prevents_duplicate_stock_refunds()
    {
        $menuItem = MenuItem::create([
            'name' => 'Nasi Goreng',
            'category' => 'makanan',
            'is_available' => true,
            'daily_stock' => 50,
            'current_stock' => 45, // Assuming 5 were ordered
            'price' => 20000,
        ]);

        $order = FoodOrder::create([
            'total_amount' => 100000,
            'order_type' => 'dine_in',
            'payment_status' => 'pending',
            'status' => 'pending',
        ]);

        $order->items()->create([
            'menu_item_id' => $menuItem->id,
            'quantity' => 5,
            'price' => 20000,
        ]);

        $payment = Payment::create([
            'food_order_id' => $order->id,
            'amount' => 100000,
            'payment_method' => 'cash',
            'payment_status' => 'pending',
        ]);

        // First failure call should refund stock (45 + 5 = 50)
        $payment->markAsFailed();
        $this->assertEquals('failed', $payment->fresh()->payment_status);
        $this->assertEquals(50, $menuItem->fresh()->current_stock);
        $this->assertEquals('cancelled', $order->fresh()->status);

        // Second failure call should NOT refund stock again
        $payment->markAsFailed();
        $this->assertEquals(50, $menuItem->fresh()->current_stock);
    }
}
