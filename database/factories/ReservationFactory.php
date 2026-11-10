<?php

namespace Database\Factories;

use App\Models\Facility;
use App\Models\Reservation;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Reservation>
 */
class ReservationFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'facility_id' => Facility::factory(),
            'check_in_date' => now()->toDateString(),
            'check_out_date' => now()->addDays(1)->toDateString(),
            'guest_count' => 2,
            'total_amount' => 150000,
            'status' => 'pending',
            'payment_status' => 'unpaid',
            'unique_code' => 'WK-'.strtoupper($this->faker->lexify('??????')),
        ];
    }
}
