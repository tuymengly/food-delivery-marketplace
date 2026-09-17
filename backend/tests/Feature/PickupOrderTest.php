<?php

namespace Tests\Feature;

use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Category;
use App\Models\Food;
use App\Models\Restaurant;
use App\Models\Rider;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class PickupOrderTest extends TestCase
{
    use RefreshDatabase;

    public function test_pickup_order_can_be_placed_without_an_address(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);
        $this->createCartItem($user, 2);

        $this->postJson('/api/orders', ['order_type' => 'pickup'])
            ->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.order_type', 'pickup')
            ->assertJsonPath('data.address_id', null);
    }

    public function test_pickup_order_has_no_delivery_or_service_fee(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);
        $this->createCartItem($user, 2);

        $this->postJson('/api/orders', ['order_type' => 'pickup'])
            ->assertCreated()
            ->assertJsonPath('data.subtotal', '9.00')
            ->assertJsonPath('data.delivery_fee', '0.00')
            ->assertJsonPath('data.service_fee', '0.00')
            ->assertJsonPath('data.total', '9.00');
    }

    public function test_pickup_order_does_not_create_a_delivery_record(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);
        $this->createCartItem($user, 1);

        $response = $this->postJson('/api/orders', ['order_type' => 'pickup'])->assertCreated();

        $this->assertNull($response->json('data.delivery'));
        $this->assertDatabaseCount('deliveries', 0);
    }

    public function test_delivery_order_still_requires_an_address(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);
        $this->createCartItem($user, 1);

        $this->postJson('/api/orders', ['order_type' => 'delivery'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['address_id']);
    }

    public function test_delivery_order_still_creates_a_delivery_record(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);
        $address = $this->createAddress($user);
        $this->createCartItem($user, 1);

        $response = $this->postJson('/api/orders', [
            'order_type' => 'delivery',
            'address_id' => $address->id,
        ])->assertCreated();

        $this->assertDatabaseCount('deliveries', 1);
        $this->assertDatabaseHas('deliveries', ['order_id' => $response->json('data.id'), 'status' => 'pending']);
    }

    public function test_restaurant_owner_can_progress_a_pickup_order_to_completed(): void
    {
        $owner = User::factory()->create(['role' => 'restaurant']);
        $restaurant = Restaurant::create([
            'user_id' => $owner->id,
            'name' => 'City Bites',
            'description' => 'Simple local food.',
            'address' => '100 Main Road',
            'phone' => '012345678',
            'status' => 'active',
        ]);
        $customer = User::factory()->create();
        $order = $this->placePickupOrder($customer, $restaurant);

        Sanctum::actingAs($owner);

        foreach (['accepted', 'preparing', 'ready', 'completed'] as $status) {
            $this->patchJson("/api/restaurant/orders/{$order->id}/status", ['status' => $status])
                ->assertOk()
                ->assertJsonPath('success', true)
                ->assertJsonPath('status', ucfirst($status));
        }

        $this->assertDatabaseHas('orders', ['id' => $order->id, 'status' => 'completed']);
    }

    public function test_assigning_a_rider_to_a_pickup_order_is_rejected(): void
    {
        $owner = User::factory()->create(['role' => 'restaurant']);
        $restaurant = Restaurant::create([
            'user_id' => $owner->id,
            'name' => 'City Bites',
            'description' => 'Simple local food.',
            'address' => '100 Main Road',
            'phone' => '012345678',
            'status' => 'active',
        ]);
        $customer = User::factory()->create();
        $order = $this->placePickupOrder($customer, $restaurant);

        $riderUser = User::factory()->create(['role' => 'rider']);
        $rider = Rider::create([
            'user_id' => $riderUser->id,
            'vehicle_type' => 'motorcycle',
            'vehicle_number' => 'AB-1234',
            'phone' => '012999999',
            'status' => 'active',
            'is_available' => true,
        ]);

        Sanctum::actingAs($owner);

        $this->postJson("/api/orders/{$order->id}/assign-rider", ['rider_id' => $rider->id])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['order_type']);
    }

    public function test_pickup_orders_never_appear_in_the_rider_available_pool(): void
    {
        $owner = User::factory()->create(['role' => 'restaurant']);
        $restaurant = Restaurant::create([
            'user_id' => $owner->id,
            'name' => 'City Bites',
            'description' => 'Simple local food.',
            'address' => '100 Main Road',
            'phone' => '012345678',
            'status' => 'active',
        ]);
        $customer = User::factory()->create();
        $this->placePickupOrder($customer, $restaurant);

        $riderUser = User::factory()->create(['role' => 'rider', 'status' => 'active']);
        Rider::create([
            'user_id' => $riderUser->id,
            'vehicle_type' => 'motorcycle',
            'vehicle_number' => 'AB-1234',
            'phone' => '012999999',
            'status' => 'active',
            'is_available' => true,
        ]);

        Sanctum::actingAs($riderUser);

        $this->getJson('/api/driver/orders')
            ->assertOk()
            ->assertJsonCount(0, 'data.available_requests');
    }

    public function test_restaurant_order_listing_flags_pickup_orders(): void
    {
        $owner = User::factory()->create(['role' => 'restaurant']);
        $restaurant = Restaurant::create([
            'user_id' => $owner->id,
            'name' => 'City Bites',
            'description' => 'Simple local food.',
            'address' => '100 Main Road',
            'phone' => '012345678',
            'status' => 'active',
        ]);
        $customer = User::factory()->create();
        $this->placePickupOrder($customer, $restaurant);

        Sanctum::actingAs($owner);

        $response = $this->getJson('/api/restaurant/orders')->assertOk();

        $this->assertSame('pickup', $response->json('orders.0.order_type'));
        $this->assertSame('100 Main Road', $response->json('orders.0.pickup_location'));
        $this->assertNull($response->json('orders.0.address'));
    }

    private function placePickupOrder(User $customer, Restaurant $restaurant): \App\Models\Order
    {
        Sanctum::actingAs($customer);
        $this->createCartItem($customer, 1, $restaurant);

        $orderId = $this->postJson('/api/orders', ['order_type' => 'pickup'])
            ->assertCreated()
            ->json('data.id');

        return \App\Models\Order::findOrFail($orderId);
    }

    private function createAddress(User $user): \App\Models\Address
    {
        return \App\Models\Address::create([
            'user_id' => $user->id,
            'label' => 'Home',
            'recipient_name' => 'Test Customer',
            'phone' => '012345678',
            'address' => '100 Main Road',
            'latitude' => 11.5564,
            'longitude' => 104.9282,
            'is_default' => true,
        ]);
    }

    /**
     * @param array<string, mixed> $overrides
     */
    private function createFood(?Restaurant $restaurant = null, array $overrides = []): Food
    {
        $restaurant ??= Restaurant::create([
            'user_id' => User::factory()->create(['role' => 'restaurant'])->id,
            'name' => 'City Bites',
            'description' => 'Simple local food.',
            'address' => '100 Main Road',
            'phone' => '012345678',
            'status' => 'active',
        ]);
        $category = Category::firstOrCreate(
            ['name' => 'Rice'],
            ['description' => 'Rice dishes.']
        );

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

    private function createCartItem(User $user, int $quantity, ?Restaurant $restaurant = null): CartItem
    {
        $cart = Cart::create(['user_id' => $user->id]);

        return CartItem::create([
            'cart_id' => $cart->id,
            'food_id' => $this->createFood($restaurant)->id,
            'quantity' => $quantity,
        ]);
    }
}
