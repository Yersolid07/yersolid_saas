<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DashboardTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // roles seeded in TestCase::setUp()
        $this->withoutVite();
    }

    public function test_admin_dashboard_renders_successfully()
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $response = $this->actingAs($admin)->get(route('dashboard'));

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page->component('Dashboard/Admin'));
    }

    public function test_staff_dashboard_renders_successfully()
    {
        $staff = User::factory()->create();
        $staff->assignRole('staff');

        $response = $this->actingAs($staff)->get(route('dashboard'));

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page->component('Dashboard/Staff'));
    }

    public function test_customer_dashboard_renders_successfully()
    {
        $customer = User::factory()->create();
        $customer->assignRole('customer');

        $response = $this->actingAs($customer)->get(route('dashboard'));

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page->component('Dashboard/Customer'));
    }
}
