<?php

namespace Tests\Feature;

use App\Models\Setting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SettingTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // Create roles first
        // roles seeded in TestCase::setUp()
        // roles seeded in TestCase::setUp()

        $this->admin = User::factory()->create();
        $this->admin->assignRole('admin');

        $this->customer = User::factory()->create();
        $this->customer->assignRole('customer');
    }

    public function test_admin_can_view_settings_page()
    {
        $response = $this->actingAs($this->admin)->get(route('admin.settings.index'));

        $response->assertStatus(200);
    }

    public function test_customer_cannot_view_settings_page()
    {
        $response = $this->actingAs($this->customer)->get(route('admin.settings.index'));

        $response->assertStatus(403);
    }

    public function test_admin_can_update_settings()
    {
        $response = $this->actingAs($this->admin)->post(route('admin.settings.update'), [
            'hero_title' => 'Updated Title by Admin',
        ]);

        $response->assertStatus(302);
        $this->assertDatabaseHas('settings', [
            'key' => 'hero_title',
            'value' => 'Updated Title by Admin',
        ]);
    }

    public function test_public_pages_show_dynamic_settings()
    {
        Setting::set('site_name', 'Dynamic Awesome Resort');

        $response = $this->get('/');

        $response->assertStatus(200);
        $response->assertSee('Dynamic Awesome Resort');
    }
}
