<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ReportTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;

    protected function setUp(): void
    {
        parent::setUp();

        // roles seeded in TestCase::setUp()

        $this->admin = User::factory()->create();
        $this->admin->assignRole('admin');
    }

    public function test_admin_can_export_reservations_pdf()
    {
        $response = $this->actingAs($this->admin)->get(route('admin.reports.pdf', [
            'period_from' => now()->startOfMonth()->toDateString(),
            'period_to' => now()->endOfMonth()->toDateString(),
        ]));

        $response->assertStatus(200);
        $response->assertHeader('Content-Type', 'application/pdf');
    }

    public function test_admin_can_export_reservations_excel()
    {
        $response = $this->actingAs($this->admin)->get(route('admin.reports.excel', [
            'period_from' => now()->startOfMonth()->toDateString(),
            'period_to' => now()->endOfMonth()->toDateString(),
        ]));

        $response->assertStatus(200);
        $response->assertHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    }
}
