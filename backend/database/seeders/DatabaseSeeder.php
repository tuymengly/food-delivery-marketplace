<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Food;
use App\Models\Restaurant;
use App\Models\Rider;
use App\Models\Review;
use App\Models\User;
use App\Models\Voucher;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $testUser = User::updateOrCreate(
            ['email' => 'test@example.com'],
            [
                'name' => 'Test User',
                'password' => Hash::make('password'),
                'role' => 'customer',
                'status' => 'active',
            ]
        );

        $categories = [];
        foreach (['Khmer Food', 'Fast Food', 'Drinks', 'Desserts'] as $name) {
            $categories[$name] = Category::updateOrCreate(
                ['name' => $name],
                ['description' => "Sample {$name} category"]
            );
        }

        $restaurants = [
            [
                'email' => 'phnom-peng-kitchen@example.com',
                'name' => 'Phnom Penh Kitchen',
                'description' => 'Classic Cambodian dishes prepared fresh every day.',
                'address' => 'Street 240, Phnom Penh',
                'phone' => '012 555 101',
                'cuisine' => 'Cambodian, Asian, Rice Dishes, Soups',
                'avg_delivery_time' => '25-35 min',
                'accepts_vouchers' => true,
                'latitude' => 11.5564,
                'longitude' => 104.9282,
                'foods' => [
                    ['name' => 'Beef Lok Lak', 'category' => 'Khmer Food', 'price' => 6.50, 'description' => 'Tender beef with pepper-lime sauce.'],
                    ['name' => 'Chicken Amok', 'category' => 'Khmer Food', 'price' => 5.75, 'description' => 'Traditional coconut curry steamed with banana leaf.'],
                    ['name' => 'Fresh Sugar Cane Juice', 'category' => 'Drinks', 'price' => 2.00, 'description' => 'Freshly pressed sugar cane juice.'],
                ],
            ],
            [
                'email' => 'riverfront-burgers@example.com',
                'name' => 'Riverfront Burgers',
                'description' => 'Handmade burgers, crispy sides, and chilled drinks.',
                'address' => 'Sisowath Quay, Phnom Penh',
                'phone' => '012 555 202',
                'cuisine' => 'American, Burgers, Fast Food, Western',
                'avg_delivery_time' => '20-30 min',
                'accepts_vouchers' => true,
                'latitude' => 11.5650,
                'longitude' => 104.9300,
                'foods' => [
                    ['name' => 'Classic Beef Burger', 'category' => 'Fast Food', 'price' => 7.00, 'description' => 'Grilled beef patty with cheddar and house sauce.'],
                    ['name' => 'Crispy Chicken Burger', 'category' => 'Fast Food', 'price' => 6.50, 'description' => 'Crispy chicken, lettuce, and spicy mayo.'],
                    ['name' => 'Loaded Fries', 'category' => 'Fast Food', 'price' => 3.50, 'description' => 'Golden fries with cheese and herbs.'],
                ],
            ],
            [
                'email' => 'lotus-desserts@example.com',
                'name' => 'Lotus Desserts',
                'description' => 'Small-batch Cambodian sweets and refreshing treats.',
                'address' => 'Street 63, Phnom Penh',
                'phone' => '012 555 303',
                'cuisine' => 'Desserts, Beverages, Tea & Coffee',
                'avg_delivery_time' => '30-40 min',
                'accepts_vouchers' => false,
                'latitude' => 11.5480,
                'longitude' => 104.9215,
                'foods' => [
                    ['name' => 'Mango Sticky Rice', 'category' => 'Desserts', 'price' => 4.25, 'description' => 'Sweet mango with coconut sticky rice.'],
                    ['name' => 'Coconut Jelly', 'category' => 'Desserts', 'price' => 3.00, 'description' => 'Chilled coconut jelly with palm sugar.'],
                    ['name' => 'Iced Lime Tea', 'category' => 'Drinks', 'price' => 2.25, 'description' => 'Bright lime tea served over ice.'],
                ],
            ],
        ];

        foreach ($restaurants as $restaurantData) {
            $restaurantUser = User::updateOrCreate(
                ['email' => $restaurantData['email']],
                [
                    'name' => $restaurantData['name'],
                    'password' => Hash::make('password'),
                    'role' => 'restaurant',
                    'status' => 'active',
                    'phone' => $restaurantData['phone'],
                ]
            );

            $restaurant = Restaurant::updateOrCreate(
                ['user_id' => $restaurantUser->id],
                [
                    'name' => $restaurantData['name'],
                    'description' => $restaurantData['description'],
                    'address' => $restaurantData['address'],
                    'phone' => $restaurantData['phone'],
                    'latitude' => $restaurantData['latitude'],
                    'longitude' => $restaurantData['longitude'],
                    'cuisine' => $restaurantData['cuisine'],
                    'avg_delivery_time' => $restaurantData['avg_delivery_time'],
                    'accepts_vouchers' => $restaurantData['accepts_vouchers'],
                    'status' => 'active',
                ]
            );

            foreach ($restaurantData['foods'] as $foodData) {
                Food::updateOrCreate(
                    ['restaurant_id' => $restaurant->id, 'name' => $foodData['name']],
                    [
                        'category_id' => $categories[$foodData['category']]->id,
                        'description' => $foodData['description'],
                        'price' => $foodData['price'],
                        'status' => 'available',
                    ]
                );
            }
        }

        $riders = [
            ['email' => 'rider.sok@example.com', 'name' => 'Sok Dara', 'phone' => '012 777 101', 'vehicle_type' => 'motorcycle', 'vehicle_number' => '1A-1010', 'latitude' => 11.5560, 'longitude' => 104.9270],
            ['email' => 'rider.chan@example.com', 'name' => 'Chan Vanna', 'phone' => '012 777 202', 'vehicle_type' => 'bicycle', 'vehicle_number' => 'BIKE-202', 'latitude' => 11.5630, 'longitude' => 104.9310],
            ['email' => 'rider.lina@example.com', 'name' => 'Lina Kim', 'phone' => '012 777 303', 'vehicle_type' => 'motorcycle', 'vehicle_number' => '1B-3030', 'latitude' => 11.5490, 'longitude' => 104.9220],
            ['email' => 'rider.virak@example.com', 'name' => 'Virak Chea', 'phone' => '012 777 404', 'vehicle_type' => 'car', 'vehicle_number' => '2A-4040', 'latitude' => 11.5580, 'longitude' => 104.9350],
        ];

        foreach ($riders as $riderData) {
            $riderUser = User::updateOrCreate(
                ['email' => $riderData['email']],
                [
                    'name' => $riderData['name'],
                    'password' => Hash::make('password'),
                    'role' => 'rider',
                    'status' => 'active',
                    'phone' => $riderData['phone'],
                    'vehicle' => $riderData['vehicle_type'],
                ]
            );

            Rider::updateOrCreate(
                ['user_id' => $riderUser->id],
                [
                    'vehicle_type' => $riderData['vehicle_type'],
                    'vehicle_number' => $riderData['vehicle_number'],
                    'phone' => $riderData['phone'],
                    'status' => 'active',
                    'is_available' => true,
                    'is_online' => true,
                    'current_latitude' => $riderData['latitude'],
                    'current_longitude' => $riderData['longitude'],
                    'location_updated_at' => now(),
                ]
            );
        }

        $sampleRatings = [
            'Phnom Penh Kitchen' => 4,
            'Riverfront Burgers' => 5,
            'Lotus Desserts' => 3,
        ];

        foreach ($sampleRatings as $restaurantName => $rating) {
            $restaurant = Restaurant::where('name', $restaurantName)->first();
            if ($restaurant) {
                Review::updateOrCreate(
                    ['restaurant_id' => $restaurant->id, 'comment' => 'Sample marketplace rating'],
                    [
                        'user_id' => $testUser->id,
                        'rating' => $rating,
                        'status' => 'published',
                        'type' => 'restaurant',
                    ]
                );
            }
        }

        $vouchers = [
            [
                'code' => 'SAVE10',
                'discount_type' => 'percent',
                'discount_value' => 10,
                'min_subtotal' => 10,
            ],
            [
                'code' => 'WELCOME5',
                'discount_type' => 'fixed',
                'discount_value' => 5,
                'min_subtotal' => 15,
            ],
            [
                'code' => 'EXPIRED10',
                'discount_type' => 'percent',
                'discount_value' => 10,
                'expires_at' => now()->subDay(),
            ],
        ];

        foreach ($vouchers as $voucherData) {
            Voucher::updateOrCreate(
                ['code' => $voucherData['code']],
                $voucherData
            );
        }
    }
}
