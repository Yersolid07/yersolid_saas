<?php

namespace Tests\Feature;

use App\Models\Inventory;
use App\Models\User;
use Database\Seeders\AdminUserSeeder;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class InventoryConcurrencyTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RoleSeeder::class);
        $this->seed(AdminUserSeeder::class);
    }

    public function test_inventory_transaction_handles_deduction_correctly()
    {
        $admin = User::where('email', 'admin@example.com')->first();

        $inventory = Inventory::create([
            'name' => 'Beras',
            'unit' => 'kg',
            'current_stock' => 10,
            'minimum_stock' => 5,
        ]);

        $response = $this->actingAs($admin)->post(route('admin.inventories.transaction', $inventory->id), [
            'type' => 'out',
            'quantity' => 2,
            'notes' => 'Test out',
        ]);

        $response->assertSessionHas('success');

        $this->assertEquals(8, $inventory->fresh()->current_stock);
        $this->assertDatabaseHas('inventory_transactions', [
            'inventory_id' => $inventory->id,
            'type' => 'out',
            'quantity' => 2,
            'stock_after' => 8,
        ]);
    }

    public function test_inventory_transaction_prevents_negative_stock()
    {
        $admin = User::where('email', 'admin@example.com')->first();

        $inventory = Inventory::create([
            'name' => 'Beras',
            'unit' => 'kg',
            'current_stock' => 10,
            'minimum_stock' => 5,
        ]);

        $response = $this->actingAs($admin)->post(route('admin.inventories.transaction', $inventory->id), [
            'type' => 'out',
            'quantity' => 12,
            'notes' => 'Test out',
        ]);

        $response->assertStatus(422);

        $this->assertEquals(10, $inventory->fresh()->current_stock);
    }
}
