<?php

namespace Database\Seeders;

use App\Models\Facility;
use Illuminate\Database\Seeder;

class FacilitySeeder extends Seeder
{
    public function run(): void
    {
        $facilities = [
            [
                'name' => 'Mujair',
                'type' => 'gazebo',
                'description' => 'Ukuran: 3x3 m, kapasitas 5-10 orang, 4 kursi 1 meja',
                'capacity' => 10,
                'price_per_day' => 100000.00,
                'price_per_hour' => null,
                'image_url' => '/storage/facilities/Mujair.jpeg',
                'is_active' => true,
            ],
            [
                'name' => 'Nilem',
                'type' => 'gazebo',
                'description' => 'Ukuran: 3x3 m, kapasitas 5-10 orang, 4 kursi 1 meja',
                'capacity' => 10,
                'price_per_day' => 100000.00,
                'price_per_hour' => null,
                'image_url' => '/storage/facilities/Nile.jpeg',
                'is_active' => true,
            ],
            [
                'name' => 'Pilek',
                'type' => 'gazebo',
                'description' => 'Ukuran: 3x3 m, kapasitas 5-10 orang, 4 kursi 1 meja',
                'capacity' => 10,
                'price_per_day' => 100000.00,
                'price_per_hour' => null,
                'image_url' => '/storage/facilities/Pilek.jpeg',
                'is_active' => true,
            ],
            [
                'name' => 'Kosey',
                'type' => 'gazebo',
                'description' => 'Ukuran: 3x3 m, kapasitas 5-10 orang, 4 kursi 1 meja',
                'capacity' => 10,
                'price_per_day' => 100000.00,
                'price_per_hour' => null,
                'image_url' => '/storage/facilities/Kosey.jpeg',
                'is_active' => true,
            ],
            [
                'name' => 'Kesa',
                'type' => 'gazebo',
                'description' => 'Ukuran: 3x6 m, kapasitas 15-20 orang, 10 kursi 3 meja',
                'capacity' => 20,
                'price_per_day' => 150000.00,
                'price_per_hour' => null,
                'image_url' => '/storage/facilities/Kesah.jpeg',
                'is_active' => true,
            ],
            [
                'name' => 'Pongkor 1',
                'type' => 'gazebo',
                'description' => 'Ukuran: 6x6 m, kapasitas 25-35 orang, 16 kursi 4 meja',
                'capacity' => 35,
                'price_per_day' => 250000.00,
                'price_per_hour' => null,
                'image_url' => '/storage/facilities/Pongkor1.jpeg',
                'is_active' => true,
            ],
            [
                'name' => 'Pongkor 2',
                'type' => 'gazebo',
                'description' => 'Ukuran: 6x6 m, kapasitas 25-35 orang, 16 kursi 4 meja',
                'capacity' => 35,
                'price_per_day' => 250000.00,
                'price_per_hour' => null,
                'image_url' => '/storage/facilities/Pongkor2.jpeg',
                'is_active' => true,
            ],
            [
                'name' => 'Tewasen',
                'type' => 'gazebo',
                'description' => 'Ukuran: 12x6 m, kapasitas 100 orang, 50 kursi 10 meja',
                'capacity' => 100,
                'price_per_day' => 500000.00,
                'price_per_hour' => null,
                'image_url' => '/storage/facilities/Tewasen.jpeg',
                'is_active' => true,
            ],
        ];

        // Clear existing facilities and re-seed
        Facility::query()->delete();

        foreach ($facilities as $facility) {
            Facility::create($facility);
        }
    }
}
