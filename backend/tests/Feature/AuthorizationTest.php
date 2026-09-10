<?php

namespace Tests\Feature;

use App\Models\Address;
use App\Models\Order;
use App\Models\Restaurant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AuthorizationTest extends TestCase
{
    use RefreshDatabase;

    public function test_restaurant_portal_routes_require_authentication(): void
    {
        $this->getJson('/api/restaurant/orders')->assertUnauthorized();
        $this->getJson('/api/restaurant/reviews')->assertUnauthorized();
        $this->getJson('/api/restaurant/stats')->assertUnauthorized();
        $this->getJson('/api/restaurant/sales')->assertUnauthorized();
    }

    public function test_customer_cannot_access_restaurant_portal_routes(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'customer']));

        $this->getJson('/api/restaurant/orders')->assertForbidden();
        $this->getJson('/api/restaurant/stats')->assertForbidden();
        $this->getJson('/api/restaurant/sales')->assertForbidden();
    }

    public function test_restaurant_owner_cannot_read_another_restaurants_analytics(): void
    {
        $owner = User::factory()->create(['role' => 'restaurant']);
        $otherOwner = User::factory()->create(['role' => 'restaurant']);
        Restaurant::create([
            'user_id' => $owner->id,
            'name' => 'Owner Restaurant',
            'address' => 'One Street',
            'phone' => '012345678',
            'status' => 'active',
        ]);
        $otherRestaurant = Restaurant::create([
            'user_id' => $otherOwner->id,
            'name' => 'Other Restaurant',
            'address' => 'Two Street',
            'phone' => '012345679',
            'status' => 'active',
        ]);
        Sanctum::actingAs($owner);

        $this->getJson('/api/restaurant/stats?restaurant_id=' . $otherRestaurant->id)
            ->assertOk()
            ->assertJsonPath('restaurant_id', Restaurant::where('user_id', $owner->id)->value('id'));
    }

    public function test_restaurant_owner_cannot_view_another_restaurants_order(): void
    {
        $owner = User::factory()->create(['role' => 'restaurant']);
        $otherOwner = User::factory()->create(['role' => 'restaurant']);
        $otherRestaurant = Restaurant::create([
            'user_id' => $otherOwner->id,
            'name' => 'Other Restaurant',
            'address' => 'Two Street',
            'phone' => '012345679',
            'status' => 'active',
        ]);
        $order = $this->createOrderForRestaurant($otherRestaurant);
        Sanctum::actingAs($owner);

        $this->getJson("/api/orders/{$order->id}")->assertNotFound();
    }

    public function test_restaurant_owner_cannot_update_another_restaurants_order_status(): void
    {
        $owner = User::factory()->create(['role' => 'restaurant']);
        $otherOwner = User::factory()->create(['role' => 'restaurant']);
        $otherRestaurant = Restaurant::create([
            'user_id' => $otherOwner->id,
            'name' => 'Other Restaurant',
            'address' => 'Two Street',
            'phone' => '012345679',
            'status' => 'active',
        ]);
        $order = $this->createOrderForRestaurant($otherRestaurant);
        Sanctum::actingAs($owner);

        $this->patchJson("/api/restaurant/orders/{$order->id}/status", ['status' => 'accepted'])
            ->assertForbidden();
    }

    public function test_restaurant_owner_can_only_list_their_own_orders(): void
    {
        $owner = User::factory()->create(['role' => 'restaurant']);
        $restaurant = Restaurant::create([
            'user_id' => $owner->id,
            'name' => 'Owner Restaurant',
            'address' => 'One Street',
            'phone' => '012345678',
            'status' => 'active',
        ]);
        $otherOwner = User::factory()->create(['role' => 'restaurant']);
        $otherRestaurant = Restaurant::create([
            'user_id' => $otherOwner->id,
            'name' => 'Other Restaurant',
            'address' => 'Two Street',
            'phone' => '012345679',
            'status' => 'active',
        ]);
        $this->createOrderForRestaurant($restaurant);
        $this->createOrderForRestaurant($otherRestaurant);
        Sanctum::actingAs($owner);

        $this->getJson('/api/restaurant/orders')
            ->assertOk()
            ->assertJsonCount(1, 'orders')
            ->assertJsonPath('orders.0.restaurant_name', 'Owner Restaurant');
    }

    public function test_invalid_order_status_transition_is_rejected(): void
    {
        $owner = User::factory()->create(['role' => 'restaurant']);
        $restaurant = Restaurant::create([
            'user_id' => $owner->id,
            'name' => 'Owner Restaurant',
            'address' => 'One Street',
            'phone' => '012345678',
            'status' => 'active',
        ]);
        $order = $this->createOrderForRestaurant($restaurant, ['status' => 'pending']);
        Sanctum::actingAs($owner);

        // pending -> delivered is not a legal jump; accepted/preparing/ready must happen first.
        $this->patchJson("/api/restaurant/orders/{$order->id}/status", ['status' => 'delivered'])
            ->assertStatus(422)
            ->assertJsonPath('success', false);

        $this->assertSame('pending', $order->refresh()->status);
    }

    public function test_valid_order_status_transition_is_accepted(): void
    {
        $owner = User::factory()->create(['role' => 'restaurant']);
        $restaurant = Restaurant::create([
            'user_id' => $owner->id,
            'name' => 'Owner Restaurant',
            'address' => 'One Street',
            'phone' => '012345678',
            'status' => 'active',
        ]);
        $order = $this->createOrderForRestaurant($restaurant, ['status' => 'pending']);
        Sanctum::actingAs($owner);

        $this->patchJson("/api/restaurant/orders/{$order->id}/status", ['status' => 'accepted'])
            ->assertOk()
            ->assertJsonPath('success', true);

        $this->assertSame('accepted', $order->refresh()->status);
    }

    private function createOrderForRestaurant(Restaurant $restaurant, array $overrides = []): Order
    {
        $customer = User::factory()->create();
        $address = Address::create([
            'user_id' => $customer->id,
            'label' => 'Home',
            'recipient_name' => 'Test Customer',
            'phone' => '012345678',
            'address' => '100 Main Road',
            'is_default' => true,
        ]);

        return Order::create([
            'user_id' => $customer->id,
            'restaurant_id' => $restaurant->id,
            'address_id' => $address->id,
            'status' => 'pending',
            'subtotal' => 20.00,
            'delivery_fee' => 2.00,
            'total' => 22.00,
            'total_price' => 22.00,
            ...$overrides,
        ]);
    }
}