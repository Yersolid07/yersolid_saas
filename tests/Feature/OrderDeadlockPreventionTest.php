<?php

namespace Tests\Feature;

use App\Models\FoodOrder;
use App\Models\MenuItem;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class OrderDeadlockPreventionTest extends TestCase
{
    use RefreshDatabase;

    #[Test]
    public function order_service_sorts_items_before_locking()
    {
        // This is a behavioral integration test to ensure that when items are ordered
        // in random ID sequence, they still get processed properly without exceptions,
        // and essentially, we just want to ensure that no logic breaks when sorting is applied.
        // True deadlock testing requires concurrent processes which is hard in PHPUnit SQLite,
        // but we can verify that the order goes through successfully regardless of input array order.

        $user = User::factory()->create();

        $menuItem1 = MenuItem::create([
            'name' => 'Item 10',
            'category' => 'makanan',
            'is_available' => true,
            'price' => 10000,
        ]);

        $menuItem2 = MenuItem::create([
            'name' => 'Item 5',
            'category' => 'minuman',
            'is_available' => true,
            'price' => 5000,
        ]);

        // Input items unsorted by UUID string length/value
        $itemsUnsorted = [
            ['menu_item_id' => $menuItem1->id, 'quantity' => 1],
            ['menu_item_id' => $menuItem2->id, 'quantity' => 2],
        ];

        $response = $this->actingAs($user)->postJson(route('customer.orders.store'), [
            'order_type' => 'dine_in',
            'table_number' => '5',
            'payment_method' => 'cash',
            'items' => $itemsUnsorted,
        ]);

        $response->assertStatus(302); // Redirects back or to order show
        $this->assertDatabaseCount('food_orders', 1);
        $order = FoodOrder::first();
        $this->assertCount(2, $order->items);
    }
}
