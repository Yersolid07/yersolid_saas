<?php

namespace Tests\Feature;

use App\Models\MenuItem;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\Test;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class DailyStockControllerTest extends TestCase
{
    use RefreshDatabase;

    #[Test]
    public function bulk_update_updates_all_stocks_correctly()
    {
        Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);
        Role::firstOrCreate(['name' => 'manager', 'guard_name' => 'web']);
        Role::firstOrCreate(['name' => 'staff', 'guard_name' => 'web']);

        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $item1 = MenuItem::create([
            'name' => 'Item A',
            'category' => 'makanan',
            'is_available' => true,
            'current_stock' => 10,
            'price' => 10000,
        ]);

        $item2 = MenuItem::create([
            'name' => 'Item B',
            'category' => 'makanan',
            'is_available' => true,
            'current_stock' => 5,
            'price' => 20000,
        ]);

        $response = $this->actingAs($admin)->postJson(route('staff.daily-stock.update'), [
            'stocks' => [
                ['id' => $item1->id, 'current_stock' => 50],
                ['id' => $item2->id, 'current_stock' => 100],
            ],
        ]);

        // Just ensure it doesn't crash and redirects back
        $response->assertStatus(302);

        $this->assertEquals(50, $item1->fresh()->current_stock);
        $this->assertEquals(100, $item2->fresh()->current_stock);
    }
}
