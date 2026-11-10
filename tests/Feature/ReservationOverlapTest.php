<?php

namespace Tests\Feature;

use App\Models\Facility;
use App\Models\Reservation;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class ReservationOverlapTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Role::firstOrCreate(['name' => 'customer']);
        Role::firstOrCreate(['name' => 'admin']);
        Role::firstOrCreate(['name' => 'staff']);
        Role::firstOrCreate(['name' => 'manager']);
    }

    public function test_cannot_book_gazebo_with_overlapping_time()
    {
        $user = User::factory()->create();
        $user->assignRole('customer');
        $facility = Facility::create([
            'name' => 'Gazebo Test',
            'type' => 'gazebo',
            'capacity' => 10,
            'price_per_day' => 100000,
            'price_per_hour' => 10000,
            'is_active' => true,
        ]);

        // Existing booking 10:00 to 14:00
        Reservation::create([
            'user_id' => $user->id,
            'facility_id' => $facility->id,
            'check_in_date' => '2027-12-10',
            'check_out_date' => '2027-12-10',
            'check_in_time' => '10:00:00',
            'check_out_time' => '14:00:00',
            'status' => 'confirmed',
            'total_amount' => 100000,
            'guest_count' => 1,
        ]);

        // Attempt overlapping booking 12:00 to 16:00
        $response = $this->actingAs($user)->post(route('customer.reservations.store'), [
            'facility_id' => $facility->id,
            'check_in_date' => '2027-12-10',
            'check_out_date' => '2027-12-10',
            'check_in_time' => '12:00',
            'check_out_time' => '16:00',
            'guest_count' => 2,
            'payment_method' => 'tripay',
            'customer_name' => 'John Doe',
            'customer_email' => 'john@example.com',
            'customer_phone' => '08123456789',
        ]);

        if ($response->status() !== 302) {
            dump($response->getContent());
        }
        $response->assertSessionHasErrors('check_in_date'); // Should fail availability check
    }

    public function test_can_book_gazebo_with_non_overlapping_time()
    {
        $user = User::factory()->create();
        $user->assignRole('customer');
        $facility = Facility::create([
            'name' => 'Gazebo Test 2',
            'type' => 'gazebo',
            'capacity' => 10,
            'price_per_day' => 100000,
            'price_per_hour' => 10000,
            'is_active' => true,
        ]);

        // Existing booking 10:00 to 12:00
        Reservation::create([
            'user_id' => $user->id,
            'facility_id' => $facility->id,
            'check_in_date' => '2027-12-10',
            'check_out_date' => '2027-12-10',
            'check_in_time' => '10:00:00',
            'check_out_time' => '12:00:00',
            'status' => 'confirmed',
            'total_amount' => 100000,
            'guest_count' => 1,
        ]);

        // Attempt non-overlapping booking 12:00 to 14:00
        $response = $this->actingAs($user)->post(route('customer.reservations.store'), [
            'facility_id' => $facility->id,
            'check_in_date' => '2027-12-10',
            'check_out_date' => '2027-12-10',
            'check_in_time' => '12:00',
            'check_out_time' => '14:00',
            'guest_count' => 2,
            'payment_method' => 'tripay',
            'customer_name' => 'John Doe',
            'customer_email' => 'john@example.com',
            'customer_phone' => '08123456789',
        ]);

        if ($response->status() !== 302) {
            dump($response->getContent());
        }
        if (session('errors')) {
            dump(session('errors'));
        }
        $response->assertSessionHasNoErrors();
        $this->assertDatabaseCount('reservations', 2);
    }
}
