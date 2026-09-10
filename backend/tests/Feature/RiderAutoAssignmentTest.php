<?php

namespace Tests\Feature;

use App\Models\Address;
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

class RiderAutoAssignmentTest extends TestCase
{
    use RefreshDatabase;

    private const RESTAURANT_LAT = 11.5564;
    private const RESTAURANT_LNG = 104.9282;
    private const ADDRESS_LAT = 11.5625;
    private const ADDRESS_LNG = 104.9160;

    public function test_order_creation_auto_assigns_the_nearest_online_rider(): void
    {
        $nearRider = $this->createOnlineRider('Near Rider', 11.5580, 104.9290);
        $farRider = $this->createOnlineRider('Far Rider', 12.7000, 105.9000);

        $user = User::factory()->create();
        Sanctum::actingAs($user);
        $address = Address::create([...$this->addressData(), 'user_id' => $user->id]);
        $this->createCartItem($user, 1);

        $response = $this->postJson('/api/orders', ['address_id' => $address->id])
            ->assertCreated()
            ->assertJsonPath('data.status', 'accepted')
            ->assertJsonPath('data.delivery.rider_id', $nearRider->id);

        $this->assertDatabaseHas('deliveries', [
            'order_id' => $response->json('data.id'),
            'rider_id' => $nearRider->id,
            'status' => 'assigned',
        ]);
        $this->assertDatabaseHas('riders', [
            'id' => $nearRider->id,
            'is_available' => false,
        ]);
        $this->assertDatabaseHas('riders', [
            'id' => $farRider->id,
            'is_available' => true,
        ]);
    }

    public function test_order_creation_leaves_order_pending_when_no_rider_online(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);
        $address = Address::create([...$this->addressData(), 'user_id' => $user->id]);
        $this->createCartItem($user, 1);

        $response = $this->postJson('/api/orders', ['address_id' => $address->id])
            ->assertCreated()
            ->assertJsonPath('data.status', 'pending');

        $this->assertDatabaseHas('deliveries', [
            'order_id' => $response->json('data.id'),
            'rider_id' => null,
            'status' => 'pending',
        ]);
    }

    public function test_order_creation_skips_assignment_when_restaurant_has_no_coordinates(): void
    {
        $this->createOnlineRider('Near Rider', 11.5580, 104.9290);

        $user = User::factory()->create();
        Sanctum::actingAs($user);
        $address = Address::create([...$this->addressData(), 'user_id' => $user->id]);
        $this->createCartItem($user, 1, geocodeRestaurant: false);

        $this->postJson('/api/orders', ['address_id' => $address->id])
            ->assertCreated()
            ->assertJsonPath('data.status', 'pending');
    }

    public function test_rider_can_push_location_and_toggle_online_status(): void
    {
        $user = User::factory()->create(['role' => 'rider']);
        Sanctum::actingAs($user);
        $rider = Rider::create([
            'user_id' => $user->id,
            'vehicle_type' => 'motorcycle',
            'vehicle_number' => 'AB-1234',
            'phone' => '012345678',
        ]);

        $this->putJson('/api/rider/location', ['latitude' => 11.5580, 'longitude' => 104.9290])
            ->assertOk()
            ->assertJsonPath('data.id', $rider->id);

        $this->putJson('/api/rider/online-status', ['is_online' => true])
            ->assertOk()
            ->assertJsonPath('data.is_online', true);

        $this->assertDatabaseHas('riders', [
            'id' => $rider->id,
            'current_latitude' => 11.5580,
            'current_longitude' => 104.9290,
            'is_online' => true,
        ]);
    }

    public function test_non_rider_cannot_push_location(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'customer']));

        $this->putJson('/api/rider/location', ['latitude' => 11.5580, 'longitude' => 104.9290])
            ->assertForbidden();

        $this->putJson('/api/rider/online-status', ['is_online' => true])
            ->assertForbidden();
    }

    private function createOnlineRider(string $name, float $lat, float $lng): Rider
    {
        $user = User::factory()->create(['role' => 'rider', 'name' => $name]);

        return Rider::create([
            'user_id' => $user->id,
            'vehicle_type' => 'motorcycle',
            'vehicle_number' => 'AB-' . random_int(1000, 9999),
            'phone' => '012345678',
            'status' => 'active',
            'is_available' => true,
            'is_online' => true,
            'current_latitude' => $lat,
            'current_longitude' => $lng,
            'location_updated_at' => now(),
        ]);
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
            'latitude' => self::ADDRESS_LAT,
            'longitude' => self::ADDRESS_LNG,
            'is_default' => true,
        ];
    }

    private function createCartItem(User $user, int $quantity, bool $geocodeRestaurant = true): CartItem
    {
        $cart = Cart::create(['user_id' => $user->id]);

        return CartItem::create([
            'cart_id' => $cart->id,
            'food_id' => $this->createFood($geocodeRestaurant)->id,
            'quantity' => $quantity,
        ]);
    }

    private function createFood(bool $geocodeRestaurant): Food
    {
        $restaurant = Restaurant::create([
            'user_id' => User::factory()->create(['role' => 'restaurant'])->id,
            'name' => 'City Bites',
            'description' => 'Simple local food.',
            'address' => '100 Main Road',
            'latitude' => $geocodeRestaurant ? self::RESTAURANT_LAT : null,
            'longitude' => $geocodeRestaurant ? self::RESTAURANT_LNG : null,
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
