<?php

namespace Tests\Feature;

use App\Models\Address;
use App\Models\Category;
use App\Models\Delivery;
use App\Models\Food;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Restaurant;
use App\Models\Rider;
use App\Models\User;
use App\Services\OrderFinanceCalculator;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class OrderFinanceTest extends TestCase
{
    use RefreshDatabase;

    public function test_order_creation_persists_the_financial_breakdown(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);
        $address = Address::create([...$this->addressData(), 'user_id' => $user->id]);
        $this->createCartItem($user, $this->createFood(['price' => 20.00]), 1);

        $response = $this->postJson('/api/orders', ['address_id' => $address->id])
            ->assertCreated();

        $order = Order::findOrFail($response->json('data.id'));
        $expected = OrderFinanceCalculator::breakdown(
            (float) $order->subtotal,
            (float) $order->delivery_fee,
            (float) $order->total
        );

        $this->assertEqualsWithDelta($expected['restaurant_amount'], (float) $order->restaurant_amount, 0.01);
        $this->assertEqualsWithDelta($expected['rider_amount'], (float) $order->rider_amount, 0.01);
        $this->assertEqualsWithDelta($expected['platform_profit'], (float) $order->platform_profit, 0.01);

        // The three shares reconcile back to what the customer actually paid.
        $sum = (float) $order->restaurant_amount + (float) $order->rider_amount + (float) $order->platform_profit;
        $this->assertEqualsWithDelta((float) $order->total, $sum, 0.01);
    }

    public function test_admin_wallet_reflects_platform_profit_not_gross_customer_payment(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $restaurant = Restaurant::create($this->restaurantData());
        $order = $this->createSettledOrder($restaurant, subtotal: 20.00, deliveryFee: 2.00, total: 22.00);

        Sanctum::actingAs($admin);

        $response = $this->getJson('/api/admin/payments')->assertOk();

        // $22 gross, but the platform only actually keeps $2 - the admin
        // wallet must reflect that $2, never the full $22 customers paid.
        $this->assertEquals(22.0, $response->json('data.stats.total_volume'));
        $this->assertEquals(18.0, $response->json('data.stats.restaurant_payouts'));
        $this->assertEquals(2.0, $response->json('data.stats.rider_payouts'));
        $this->assertEquals(2.0, $response->json('data.stats.platform_revenue'));
        $this->assertEquals(2.0, $response->json('data.stats.admin_wallet_balance'));

        $this->assertNotEquals(22.0, $response->json('data.stats.admin_wallet_balance'));
    }

    public function test_restaurant_sales_earnings_uses_the_stored_restaurant_share(): void
    {
        $owner = User::factory()->create(['role' => 'restaurant']);
        $restaurant = Restaurant::create([...$this->restaurantData(), 'user_id' => $owner->id]);
        $this->createSettledOrder($restaurant, subtotal: 20.00, deliveryFee: 2.00, total: 22.00);

        Sanctum::actingAs($owner);

        $response = $this->getJson('/api/restaurant/sales')->assertOk();

        // Restaurant nets $18 (subtotal minus commission), not $22*0.9=$19.80
        // (the old flat-90%-of-total guess, which wrongly included the
        // delivery fee that belongs to the rider).
        $this->assertEquals(18.0, $response->json('stats.netEarnings'));
    }

    public function test_rider_earnings_use_the_stored_rider_share_not_the_full_order_total(): void
    {
        $riderUser = User::factory()->create(['role' => 'rider', 'status' => 'Online']);
        $rider = Rider::create([
            'user_id' => $riderUser->id,
            'vehicle_type' => 'motorcycle',
            'vehicle_number' => 'PP-1234',
            'phone' => '012345678',
            'status' => 'active',
            'is_available' => true,
        ]);
        $restaurant = Restaurant::create($this->restaurantData());
        $order = $this->createSettledOrder($restaurant, subtotal: 20.00, deliveryFee: 2.00, total: 22.00);
        $order->delivery()->create([
            'rider_id' => $rider->id,
            'status' => 'delivered',
            'delivered_at' => now(),
        ]);

        Sanctum::actingAs($riderUser);

        $response = $this->getJson('/api/driver/orders')->assertOk();

        $this->assertSame('$2.00', $response->json('data.summary.today_earnings'));
        $this->assertNotSame('$22.00', $response->json('data.summary.today_earnings'));
    }

    private function createSettledOrder(Restaurant $restaurant, float $subtotal, float $deliveryFee, float $total): Order
    {
        $customer = User::factory()->create();
        $address = Address::create([...$this->addressData(), 'user_id' => $customer->id]);
        $category = Category::create(['name' => 'Rice', 'description' => 'Rice dishes.']);
        $food = Food::create([
            'restaurant_id' => $restaurant->id,
            'category_id' => $category->id,
            'name' => 'Chicken Rice',
            'description' => 'Steamed chicken with rice.',
            'price' => $subtotal,
            'status' => 'available',
        ]);

        $breakdown = OrderFinanceCalculator::breakdown($subtotal, $deliveryFee, $total);

        $order = Order::create([
            'user_id' => $customer->id,
            'restaurant_id' => $restaurant->id,
            'address_id' => $address->id,
            'status' => 'delivered',
            'subtotal' => $subtotal,
            'delivery_fee' => $deliveryFee,
            'total' => $total,
            'total_price' => $total,
            ...$breakdown,
        ]);

        OrderItem::create([
            'order_id' => $order->id,
            'food_id' => $food->id,
            'food_name' => $food->name,
            'price' => $food->price,
            'quantity' => 1,
            'subtotal' => $subtotal,
        ]);

        return $order->refresh();
    }

    private function createFood(array $overrides = []): Food
    {
        $restaurant = Restaurant::create($this->restaurantData());
        $category = Category::create(['name' => 'Rice', 'description' => 'Rice dishes.']);

        return Food::create([
            'restaurant_id' => $restaurant->id,
            'category_id' => $category->id,
            'name' => 'Chicken Rice',
            'description' => 'Steamed chicken with rice.',
            'price' => 4.50,
            'status' => 'available',
            ...$overrides,
        ]);
    }

    private function createCartItem(User $user, Food $food, int $quantity): void
    {
        $cart = \App\Models\Cart::create(['user_id' => $user->id]);
        \App\Models\CartItem::create([
            'cart_id' => $cart->id,
            'food_id' => $food->id,
            'quantity' => $quantity,
        ]);
    }

    private function restaurantData(): array
    {
        return [
            'user_id' => User::factory()->create(['role' => 'restaurant'])->id,
            'name' => 'City Bites',
            'description' => 'Simple local food.',
            'address' => '100 Main Road',
            'phone' => '012345678',
            'status' => 'active',
        ];
    }

    private function addressData(): array
    {
        return [
            'label' => 'Home',
            'recipient_name' => 'Test Customer',
            'phone' => '012345678',
            'address' => '100 Main Road',
            'latitude' => 11.5564,
            'longitude' => 104.9282,
            'is_default' => true,
        ];
    }
}
