<?php

namespace Database\Factories;

use App\Models\Facility;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Facility>
 */
class FacilityFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => $this->faker->company,
            'type' => 'gazebo',
            'description' => $this->faker->sentence,
            'capacity' => 4,
            'price_per_day' => 150000,
            'is_active' => true,
        ];
    }
}
