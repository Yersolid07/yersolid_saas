<?php

namespace Tests\Feature;

use App\Models\Facility;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ReservationTest extends TestCase
{
    use RefreshDatabase;

    public function test_cannot_double_book_facility()
    {
        $user = User::create([
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => bcrypt('password'),
        ]);

        $facility = Facility::create([
            'name' => 'Homestay A',
            'type' => 'homestay',
            'price_per_day' => 100000,
        ]);

        $today = Carbon::today()->addDays(5)->toDateString();
        $tomorrow = Carbon::today()->addDays(6)->toDateString();

        // First booking
        $response1 = $this->actingAs($user)->post(route('customer.reservations.store'), [
            'facility_id' => $facility->id,
            'check_in_date' => $today,
            'check_out_date' => $tomorrow,
            'guest_count' => 2,
            'payment_method' => 'cash',
            'customer_name' => 'John Doe',
            'customer_email' => 'john@example.com',
            'customer_phone' => '08123456789',
        ]);

        // Assert first booking is successful (redirects to show)
        $response1->assertRedirect();
        $this->assertDatabaseCount('reservations', 1);

        // Second booking on same dates
        $response2 = $this->actingAs($user)->post(route('customer.reservations.store'), [
            'facility_id' => $facility->id,
            'check_in_date' => $today,
            'check_out_date' => $tomorrow,
            'guest_count' => 2,
            'payment_method' => 'cash',
            'customer_name' => 'Jane Doe',
            'customer_email' => 'jane@example.com',
            'customer_phone' => '08123456789',
        ]);

        // Expect validation error for check_in_date
        $response2->assertSessionHasErrors(['check_in_date']);

        // Assert no second booking was created
        $this->assertDatabaseCount('reservations', 1);
    }
}
