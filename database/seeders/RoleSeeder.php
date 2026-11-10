<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class RoleSeeder extends Seeder
{
    public function run(): void
    {
        // Reset cached roles and permissions
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        // Create permissions
        $permissions = [
            // Facility permissions
            'view facilities',
            'create facilities',
            'edit facilities',
            'delete facilities',

            // Reservation permissions
            'view all reservations',
            'view own reservations',
            'create reservations',
            'edit reservations',
            'cancel reservations',
            'confirm reservations',
            'complete reservations',

            // Food order permissions
            'view all food orders',
            'view own food orders',
            'create food orders',
            'update food order status',

            // Payment permissions
            'view all payments',
            'view own payments',
            'create payments',
            'verify payments',

            // Menu permissions
            'view menu',
            'manage menu',

            // User permissions
            'view users',
            'manage users',
            'assign roles',

            // Review permissions
            'view reviews',
            'manage reviews',
            'create reviews',

            // Report permissions
            'view reports',
            'export reports',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission, 'guard_name' => 'web']);
        }

        // Create roles and assign permissions
        $adminRole = Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);
        $adminRole->givePermissionTo(Permission::all()); // Admin has all permissions

        $managerRole = Role::firstOrCreate(['name' => 'manager', 'guard_name' => 'web']);
        $managerRole->givePermissionTo([
            'view facilities', 'create facilities', 'edit facilities',
            'view all reservations', 'create reservations', 'edit reservations',
            'cancel reservations', 'confirm reservations', 'complete reservations',
            'view all food orders', 'create food orders', 'update food order status',
            'view all payments', 'create payments', 'verify payments',
            'view menu', 'manage menu',
            'view users',
            'view reviews', 'manage reviews',
            'view reports', 'export reports',
        ]);

        $staffRole = Role::firstOrCreate(['name' => 'staff', 'guard_name' => 'web']);
        $staffRole->givePermissionTo([
            'view facilities',
            'view all reservations', 'confirm reservations', 'complete reservations',
            'view all food orders', 'update food order status',
            'view all payments',
            'view menu',
            'view reviews',
        ]);

        $customerRole = Role::firstOrCreate(['name' => 'customer', 'guard_name' => 'web']);
        $customerRole->givePermissionTo([
            'view facilities',
            'view own reservations', 'create reservations', 'cancel reservations',
            'view own food orders', 'create food orders',
            'view own payments',
            'view menu',
            'create reviews',
        ]);

        Role::firstOrCreate(['name' => 'guest', 'guard_name' => 'web']);
    }
}
