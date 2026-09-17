<?php

namespace Database\Seeders;

use App\Models\Rider;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    private const PASSWORD = '12345678';

    /**
     * Seed only the login accounts the marketplace launches with: 20
     * restaurant owners and 10 riders. Restaurant profiles, menus,
     * categories, demo customers, orders, reviews, and vouchers are
     * intentionally not seeded here - each owner adds their real
     * restaurant and food information through the website after logging
     * in, and each rider fills in their real vehicle details from the app.
     */
    public function run(): void
    {
        $this->seedAdmin();
        $this->seedRestaurantOwners();
        $this->seedRiders();
    }

    private function seedAdmin(): void
    {
        User::updateOrCreate(
            ['email' => 'menglyeiito2008@gmail.com'],
            [
                'name' => 'Admin',
                'password' => Hash::make('12345678'),
                'role' => 'admin',
                'status' => 'active',
                'email_verified_at' => now(),
            ]
        );
    }

    private function seedRestaurantOwners(): void
    {
        for ($i = 1; $i <= 20; $i++) {
            User::updateOrCreate(
                ['email' => sprintf('restaurant%02d@test.com', $i)],
                [
                    'name' => sprintf('Restaurant Owner %02d', $i),
                    'password' => Hash::make(self::PASSWORD),
                    'role' => 'restaurant',
                    'status' => 'active',
                    'email_verified_at' => now(),
                ]
            );
        }
    }

    private function seedRiders(): void
    {
        for ($i = 1; $i <= 10; $i++) {
            $user = User::updateOrCreate(
                ['email' => sprintf('rider%02d@test.com', $i)],
                [
                    'name' => sprintf('Rider %02d', $i),
                    'password' => Hash::make(self::PASSWORD),
                    'role' => 'rider',
                    'status' => 'active',
                    'email_verified_at' => now(),
                ]
            );

            // A rider needs a `riders` row to use the delivery APIs at all
            // (RiderProfileController/RiderDeliveryController key off
            // $user->rider) - this is required account plumbing, not demo
            // content. Placeholder vehicle details, same convention as an
            // admin-created rider (DriverController::store); the rider
            // replaces them with real info from the driver dashboard.
            Rider::updateOrCreate(
                ['user_id' => $user->id],
                [
                    'vehicle_type' => 'motorcycle',
                    'vehicle_number' => 'PENDING',
                    'phone' => 'N/A',
                    'status' => 'active',
                    'is_available' => true,
                ]
            );
        }
    }
}
