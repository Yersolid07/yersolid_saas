<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Activitylog\Models\Activity;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class ActivityLogTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // Ensure roles exist
        Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);
        Role::firstOrCreate(['name' => 'manager', 'guard_name' => 'web']);
        Role::firstOrCreate(['name' => 'staff', 'guard_name' => 'web']);
        Role::firstOrCreate(['name' => 'customer', 'guard_name' => 'web']);
    }

    public function test_activity_log_is_recorded_when_user_is_created()
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $this->actingAs($admin);

        $userData = [
            'name' => 'Test User',
            'email' => 'testuser@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
            'role' => 'staff',
            'phone' => '081234567890',
            'address' => 'Test Address',
        ];

        $response = $this->post(route('admin.users.store'), $userData);

        $response->assertRedirect(route('admin.users.index'));

        // Check if activity log was created
        $this->assertDatabaseHas('activity_log', [
            'log_name' => 'default',
            'event' => 'created',
            'subject_type' => User::class,
        ]);

        $log = Activity::latest()->first();
        $this->assertEquals(User::class, $log->subject_type);
    }

    public function test_activity_log_is_recorded_when_user_is_updated()
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $targetUser = User::factory()->create(['name' => 'Old Name']);
        $targetUser->assignRole('staff');

        $this->actingAs($admin);

        $response = $this->put(route('admin.users.update', $targetUser), [
            'name' => 'New Name',
            'email' => $targetUser->email,
            'role' => 'staff',
        ]);

        $response->assertRedirect(route('admin.users.index'));

        // Check if activity log was created
        $this->assertDatabaseHas('activity_log', [
            'event' => 'updated',
            'subject_type' => User::class,
            'subject_id' => $targetUser->id,
        ]);

        $log = Activity::latest('id')->first();
        $this->assertStringContainsString('New Name', json_encode($log->properties));
    }

    public function test_activity_log_route_is_protected_and_accessible_by_admin()
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $this->actingAs($admin);

        $response = $this->get(route('admin.activity-logs.index'));
        $response->assertStatus(200);
    }

    public function test_activity_log_route_is_forbidden_for_staff()
    {
        $staff = User::factory()->create();
        $staff->assignRole('staff');

        $this->actingAs($staff);

        $response = $this->get(route('admin.activity-logs.index'));
        $response->assertStatus(403);
    }
}
