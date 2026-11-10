<?php

namespace Tests\Feature;

use App\Models\MenuItem;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\Test;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class FoodOrderTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        // Ensure roles exist for notification queries
        foreach (['admin', 'manager', 'staff', 'customer'] as $role) {
            Role::firstOrCreate(['name' => $role, 'guard_name' => 'web']);
        }
    }

    #[Test]
    public function customer_cannot_order_out_of_stock_item()
    {
        $user = User::factory()->create();
        $user->assignRole('customer');

        $menuItem = MenuItem::create([
            'name' => 'Test Item',
            'category' => 'makanan',
            'is_available' => true,
            'daily_stock' => 5,
            'current_stock' => 5,
            'price' => 20000,
        ]);

        $response = $this->actingAs($user)->post(route('customer.orders.store'), [
            'order_type' => 'dine_in',
            'table_number' => '1',
            'payment_method' => 'cash',
            'items' => [
                ['menu_item_id' => $menuItem->id, 'quantity' => 10], // More than stock
            ],
        ]);

        $response->assertSessionHasErrors();
        $this->assertDatabaseCount('food_orders', 0);
        $this->assertEquals(5, $menuItem->fresh()->current_stock);
    }

    #[Test]
    public function customer_cannot_order_when_daily_stock_is_zero()
    {
        // This was the original bug: daily_stock = 0 was bypassed
        $user = User::factory()->create();
        $user->assignRole('customer');

        $menuItem = MenuItem::create([
            'name' => 'Sold Out Item',
            'category' => 'makanan',
            'is_available' => true,
            'daily_stock' => 10,   // Staff has set max to 10
            'current_stock' => 0,   // But today's stock is exhausted
            'price' => 15000,
        ]);

        $response = $this->actingAs($user)->post(route('customer.orders.store'), [
            'order_type' => 'dine_in',
            'table_number' => '1',
            'payment_method' => 'cash',
            'items' => [
                ['menu_item_id' => $menuItem->id, 'quantity' => 1],
            ],
        ]);

        $response->assertSessionHasErrors();
        $this->assertDatabaseCount('food_orders', 0);
        // Stock must remain at 0 — not go negative
        $this->assertEquals(0, $menuItem->fresh()->current_stock);
    }

    #[Test]
    public function customer_can_order_item_without_daily_stock_tracking()
    {
        // Items with daily_stock = null are unlimited
        $user = User::factory()->create();
        $user->assignRole('customer');

        $menuItem = MenuItem::create([
            'name' => 'Unlimited Item',
            'category' => 'minuman',
            'is_available' => true,
            'daily_stock' => null,  // No stock tracking
            'current_stock' => 0,
            'price' => 10000,
        ]);

        $response = $this->actingAs($user)->post(route('customer.orders.store'), [
            'order_type' => 'dine_in',
            'table_number' => '1',
            'payment_method' => 'cash',
            'items' => [
                ['menu_item_id' => $menuItem->id, 'quantity' => 5],
            ],
        ]);

        // Should succeed — no stock tracking means unlimited
        $response->assertSessionDoesntHaveErrors();
        $this->assertDatabaseCount('food_orders', 1);
    }

    #[Test]
    public function stock_is_decremented_after_successful_order()
    {
        $user = User::factory()->create();
        $user->assignRole('customer');

        $menuItem = MenuItem::create([
            'name' => 'Limited Item',
            'category' => 'makanan',
            'is_available' => true,
            'daily_stock' => 10,
            'current_stock' => 10,
            'price' => 25000,
        ]);

        $this->actingAs($user)->post(route('customer.orders.store'), [
            'order_type' => 'dine_in',
            'table_number' => '1',
            'payment_method' => 'cash',
            'items' => [
                ['menu_item_id' => $menuItem->id, 'quantity' => 3],
            ],
        ]);

        // Stock should be decremented by the ordered quantity
        $this->assertEquals(7, $menuItem->fresh()->current_stock);
    }
}
