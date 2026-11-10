<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    public function run(): void
    {
        // Create admin user (demo credentials — change after install)
        $admin = User::firstOrCreate(
            ['email' => 'admin@example.com'],
            [
                'name' => 'Admin User',
                'email' => 'admin@example.com',
                'password' => Hash::make('password'),
                'phone' => '080000000000',
                'address' => 'Your address here',
                'email_verified_at' => now(),
            ]
        );
        $admin->assignRole('admin');

        // Create manager
        $manager = User::firstOrCreate(
            ['email' => 'manager@example.com'],
            [
                'name' => 'Manager User',
                'email' => 'manager@example.com',
                'password' => Hash::make('password'),
                'phone' => '080000000001',
                'address' => 'Your address here',
                'email_verified_at' => now(),
            ]
        );
        $manager->assignRole('manager');

        // Create staff
        $staff = User::firstOrCreate(
            ['email' => 'staff@example.com'],
            [
                'name' => 'Staff User',
                'email' => 'staff@example.com',
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
            ]
        );
        $staff->assignRole('staff');

        // Create demo customer
        $customer = User::firstOrCreate(
            ['email' => 'customer@example.com'],
            [
                'name' => 'Tamu Demo',
                'email' => 'customer@example.com',
                'password' => Hash::make('password'),
                'phone' => '+62811-1234-5678',
                'address' => 'Jakarta Selatan',
                'email_verified_at' => now(),
            ]
        );
        $customer->assignRole('customer');
    }
}
