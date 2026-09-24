<?php

namespace Tests\Feature;

use App\Models\Address;
use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Category;
use App\Models\Delivery;
use App\Models\Food;
use App\Models\Order;
use App\Models\Restaurant;
use App\Models\Rider;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class DeliverySystemTest extends TestCase
{
    use RefreshDatabase;

    public function test_rider_can_create_their_profile(): void
    {
        $user = User::factory()->create(['role' => 'rider']);
        Sanctum::actingAs($user);

        $this->postJson('/api/rider/profile', $this->riderProfileData())
            ->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.user_id', $user->id)
            ->assertJsonPath('data.vehicle_type', 'motorcycle');
    }

    public function test_customer_cannot_access_rider_profile_apis(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'customer']));

        $this->getJson('/api/rider/profile')
            ->assertForbidden()
            ->assertJsonPath('success', false);
    }

    public function test_rider_can_update_availability(): void
    {
        $rider = $this->createRider();
        Sanctum::actingAs($rider->user);

        $this->putJson('/api/rider/availability', [
            'is_available' => false,
        ])
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.is_available', false);
    }

    public function test_customer_cannot_access_rider_delivery_apis(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'customer']));

        $this->getJson('/api/rider/deliveries')
            ->assertForbidden()
            ->assertJsonPath('success', false);
    }

    public function test_order_creates_a_pending_delivery(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);
        $address = Address::create([...$this->addressData(), 'user_id' => $user->id]);
        $this->createCartItem($user, 1);

        $response = $this->postJson('/api/orders', [
            'address_id' => $address->id,
        ])->assertCreated();

        $this->assertDatabaseHas('deliveries', [
            'order_id' => $response->json('data.id'),
            'status' => 'pending',
            'rider_id' => null,
        ]);
    }

    public function test_authorized_user_can_assign_an_available_rider(): void
    {
        $owner = User::factory()->create(['role' => 'restaurant']);
        $restaurant = Restaurant::create([
            'user_id' => $owner->id,
            'name' => 'Owner Restaurant',
            'address' => 'One Street',
            'phone' => '012345678',
            'status' => 'active',
        ]);
        // Riders may only be attached once the restaurant marked the order
        // ready for pickup.
        $order = $this->createOrderWithPendingDelivery($restaurant, 'ready');
        $rider = $this->createRider();
        Sanctum::actingAs($owner);

        $this->postJson("/api/orders/{$order->id}/assign-rider", [
            'rider_id' => $rider->id,
        ])
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.delivery.status', 'assigned')
            ->assertJsonPath('data.delivery.rider_id', $rider->id);

        $this->assertFalse($rider->refresh()->is_available);
    }

    public function test_cannot_assign_an_unavailable_rider(): void
    {
        $owner = User::factory()->create(['role' => 'restaurant']);
        $restaurant = Restaurant::create([
            'user_id' => $owner->id,
            'name' => 'Owner Restaurant',
            'address' => 'One Street',
            'phone' => '012345678',
            'status' => 'active',
        ]);
        $order = $this->createOrderWithPendingDelivery($restaurant, 'ready');
        $rider = $this->createRider(['is_available' => false]);
        Sanctum::actingAs($owner);

        $this->postJson("/api/orders/{$order->id}/assign-rider", [
            'rider_id' => $rider->id,
        ])
            ->assertUnprocessable()
            ->assertJsonPath('success', false)
            ->assertJsonValidationErrors(['rider_id']);
    }

    public function test_restaurant_owner_cannot_assign_a_rider_to_another_restaurants_order(): void
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
        $order = $this->createOrderWithPendingDelivery($otherRestaurant, 'ready');
        $rider = $this->createRider();
        Sanctum::actingAs($owner);

        $this->postJson("/api/orders/{$order->id}/assign-rider", [
            'rider_id' => $rider->id,
        ])
            ->assertForbidden();
    }

    public function test_cannot_assign_a_rider_before_the_restaurant_marks_the_order_ready(): void
    {
        $owner = User::factory()->create(['role' => 'restaurant']);
        $restaurant = Restaurant::create([
            'user_id' => $owner->id,
            'name' => 'Owner Restaurant',
            'address' => 'One Street',
            'phone' => '012345678',
            'status' => 'active',
        ]);
        // Still with the restaurant (PENDING_RESTAURANT / PREPARING).
        $order = $this->createOrderWithPendingDelivery($restaurant, 'preparing');
        $rider = $this->createRider();
        Sanctum::actingAs($owner);

        $this->postJson("/api/orders/{$order->id}/assign-rider", [
            'rider_id' => $rider->id,
        ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['status']);

        $this->assertDatabaseHas('deliveries', [
            'order_id' => $order->id,
            'rider_id' => null,
            'status' => 'pending',
        ]);
        $this->assertTrue($rider->refresh()->is_available);
    }

    /**
     * The frontend must never be able to pick its own rider - a customer
     * (who owns neither a restaurant nor an admin role) has no path to this
     * endpoint at all, regardless of what rider_id it sends.
     */
    public function test_customer_cannot_manually_assign_a_rider(): void
    {
        $order = $this->createOrderWithPendingDelivery(Restaurant::create([
            'user_id' => User::factory()->create(['role' => 'restaurant'])->id,
            'name' => 'Owner Restaurant',
            'address' => 'One Street',
            'phone' => '012345678',
            'status' => 'active',
        ]), 'ready');
        $rider = $this->createRider();
        Sanctum::actingAs(User::factory()->create(['role' => 'customer']));

        $this->postJson("/api/orders/{$order->id}/assign-rider", [
            'rider_id' => $rider->id,
        ])
            ->assertForbidden();

        $this->assertTrue($rider->refresh()->is_available);
    }

    public function test_rider_can_see_their_assigned_deliveries(): void
    {
        $rider = $this->createRider();
        $delivery = $this->createAssignedDelivery($rider);
        Sanctum::actingAs($rider->user);

        $this->getJson('/api/rider/deliveries')
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.0.id', $delivery->id);
    }

    public function test_rider_cannot_access_another_riders_delivery(): void
    {
        $rider = $this->createRider();
        $otherRider = $this->createRider();
        $delivery = $this->createAssignedDelivery($otherRider);
        Sanctum::actingAs($rider->user);

        $this->getJson("/api/rider/deliveries/{$delivery->id}")
            ->assertNotFound();
    }

    public function test_rider_can_accept_an_assigned_delivery(): void
    {
        $rider = $this->createRider();
        $delivery = $this->createAssignedDelivery($rider);
        Sanctum::actingAs($rider->user);

        $this->postJson("/api/rider/deliveries/{$delivery->id}/accept")
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.status', 'assigned');
    }

    /**
     * A rider must never be able to accept an order the restaurant has not
     * finished preparing, even if a delivery row for it somehow says
     * "assigned" (legacy/hand-edited data).
     */
    public function test_rider_cannot_accept_a_delivery_whose_order_is_not_ready_for_pickup(): void
    {
        $rider = $this->createRider();
        $order = $this->createOrderWithPendingDelivery(null, 'preparing');
        $delivery = $order->delivery;
        $delivery->update(['rider_id' => $rider->id, 'status' => 'assigned']);

        Sanctum::actingAs($rider->user);

        $this->postJson("/api/rider/deliveries/{$delivery->id}/accept")
            ->assertUnprocessable()
            ->assertJsonPath('success', false);

        $this->assertSame('assigned', $delivery->refresh()->status);
    }

    public function test_rider_can_pickup_delivery(): void
    {
        $rider = $this->createRider();
        $delivery = $this->createAssignedDelivery($rider);
        Sanctum::actingAs($rider->user);

        $this->postJson("/api/rider/deliveries/{$delivery->id}/pickup")
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.status', 'picked_up');

        $this->assertNotNull($delivery->refresh()->picked_up_at);
    }

    public function test_rider_can_start_delivery(): void
    {
        $rider = $this->createRider();
        $delivery = $this->createAssignedDelivery($rider, ['status' => 'picked_up']);
        Sanctum::actingAs($rider->user);

        $this->postJson("/api/rider/deliveries/{$delivery->id}/start")
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.status', 'delivering');

        $this->assertSame('delivering', $delivery->order->refresh()->status);
    }

    public function test_rider_can_complete_delivery(): void
    {
        $rider = $this->createRider(['is_available' => false]);
        $delivery = $this->createAssignedDelivery($rider, ['status' => 'delivering']);
        Sanctum::actingAs($rider->user);

        $this->postJson("/api/rider/deliveries/{$delivery->id}/deliver")
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.status', 'delivered');

        $this->assertNotNull($delivery->refresh()->delivered_at);
    }

    public function test_completing_delivery_updates_order_status(): void
    {
        $rider = $this->createRider(['is_available' => false]);
        $delivery = $this->createAssignedDelivery($rider, ['status' => 'delivering']);
        Sanctum::actingAs($rider->user);

        $this->postJson("/api/rider/deliveries/{$delivery->id}/deliver")
            ->assertOk();

        $this->assertSame('delivered', $delivery->order->refresh()->status);
    }

    public function test_completing_delivery_makes_rider_available_again(): void
    {
        $rider = $this->createRider(['is_available' => false]);
        $delivery = $this->createAssignedDelivery($rider, ['status' => 'delivering']);
        Sanctum::actingAs($rider->user);

        $this->postJson("/api/rider/deliveries/{$delivery->id}/deliver")
            ->assertOk();

        $this->assertTrue($rider->refresh()->is_available);
    }

    public function test_invalid_delivery_status_transitions_are_rejected(): void
    {
        $rider = $this->createRider();
        $delivery = $this->createAssignedDelivery($rider, ['status' => 'delivered']);
        Sanctum::actingAs($rider->user);

        $this->postJson("/api/rider/deliveries/{$delivery->id}/pickup")
            ->assertUnprocessable()
            ->assertJsonPath('success', false)
            ->assertJsonValidationErrors(['status']);
    }

    /**
     * @param  array<string, mixed>  $overrides
     */
    private function createRider(array $overrides = []): Rider
    {
        return Rider::create([
            'user_id' => User::factory()->create(['role' => 'rider'])->id,
            ...$this->riderProfileData(),
            // Eligible by default: online, available and parked at the
            // restaurant with a fresh location fix, which is what the
            // assignment rules require.
            'is_online' => true,
            'current_latitude' => 11.5564,
            'current_longitude' => 104.9282,
            'location_updated_at' => now(),
            ...$overrides,
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function riderProfileData(): array
    {
        return [
            'vehicle_type' => 'motorcycle',
            'vehicle_number' => 'PP-1234',
            'phone' => '012345678',
            'status' => 'active',
            'is_available' => true,
        ];
    }

    /**
     * @param  array<string, mixed>  $overrides
     */
    private function createAssignedDelivery(Rider $rider, array $overrides = []): Delivery
    {
        // A delivery is only ever assigned while the order is
        // READY_FOR_PICKUP - that is the state the restaurant/rider flow
        // actually produces, so the fixtures use it too.
        $order = $this->createOrderWithPendingDelivery(null, 'ready');
        $delivery = $order->delivery;
        $delivery->update([
            'rider_id' => $rider->id,
            'status' => 'assigned',
            ...$overrides,
        ]);

        return $delivery->refresh();
    }

    private function createOrderWithPendingDelivery(?Restaurant $restaurant = null, string $status = 'pending'): Order
    {
        $user = User::factory()->create();
        $address = Address::create([...$this->addressData(), 'user_id' => $user->id]);
        $order = Order::create([
            'user_id' => $user->id,
            'restaurant_id' => $restaurant?->id,
            'address_id' => $address->id,
            'status' => $status,
            'subtotal' => 9.00,
            'delivery_fee' => 1.50,
            'total' => 10.50,
        ]);
        $order->delivery()->create(['status' => 'pending']);

        return $order->refresh();
    }

    /**
     * @return array<string, mixed>
     */
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

    private function createCartItem(User $user, int $quantity): CartItem
    {
        $cart = Cart::create(['user_id' => $user->id]);

        return CartItem::create([
            'cart_id' => $cart->id,
            'food_id' => $this->createFood()->id,
            'quantity' => $quantity,
        ]);
    }

    private function createFood(): Food
    {
        $restaurant = Restaurant::create([
            'user_id' => User::factory()->create(['role' => 'restaurant'])->id,
            'name' => 'City Bites',
            'description' => 'Simple local food.',
            'address' => '100 Main Road',
            'phone' => '012345678',
            'image' => null,
            'status' => 'active',
        ]);
        $category = Category::create([
            'name' => 'Rice',
            'description' => 'Rice dishes.',
        ]);

        return Food::create([
            'restaurant_id' => $restaurant->id,
            'category_id' => $category->id,
            'name' => 'Chicken Rice',
            'description' => 'Steamed chicken with rice.',
            'price' => 4.50,
            'image' => null,
            'status' => 'available',
        ]);
    }
}
