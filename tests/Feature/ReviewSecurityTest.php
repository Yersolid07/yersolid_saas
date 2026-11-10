<?php

namespace Tests\Feature;

use App\Models\Reservation;
use App\Models\Review;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ReviewSecurityTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RoleSeeder::class);
    }

    public function test_user_cannot_submit_duplicate_review_for_same_reservation()
    {
        $user = User::factory()->create();
        $user->assignRole('customer');
        $reservation = Reservation::factory()->create([
            'user_id' => $user->id,
            'status' => 'completed',
        ]);

        // First review
        $response1 = $this->actingAs($user)->post(route('customer.reviews.store'), [
            'reservation_id' => $reservation->id,
            'rating' => 5,
            'comment' => 'Great experience!',
        ]);

        $response1->assertSessionHas('success');
        $this->assertEquals(1, Review::where('reservation_id', $reservation->id)->count());

        // Second review (simulating a double submit race condition bypassing first check)
        $response2 = $this->actingAs($user)->post(route('customer.reviews.store'), [
            'reservation_id' => $reservation->id,
            'rating' => 4,
            'comment' => 'Duplicate attempt',
        ]);

        $response2->assertSessionHas('error', 'Anda sudah memberikan ulasan untuk reservasi ini.');

        // Still only 1 review should exist
        $this->assertEquals(1, Review::where('reservation_id', $reservation->id)->count());
    }
}
