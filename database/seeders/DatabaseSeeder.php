<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Create roles
        $this->call([
            RoleSeeder::class,
            FacilitySeeder::class,
            MenuItemSeeder::class,
            AdminUserSeeder::class,
        ]);
    }
}
