<?php

namespace Tests\Feature;

use App\Models\Address;
use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Category;
use App\Models\Food;
use App\Models\Order;
use App\Models\Restaurant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class CustomerOrderFlowTest extends TestCase
{
    use RefreshDatabase;

    public function test_authenticated_user_can_create_address(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $this->postJson('/api/addresses', $this->addressData())
            ->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.user_id', $user->id)
            ->assertJsonPath('data.is_default', true);
    }

    public function test_user_cannot_access_another_users_address(): void
    {
        Sanctum::actingAs(User::factory()->create());
        $otherUser = User::factory()->create();
        $address = Address::create([
            ...$this->addressData(),
            'user_id' => $otherUser->id,
        ]);

        $this->getJson("/api/addresses/{$address->id}")
            ->assertNotFound();
    }

    public function test_authenticated_user_can_add_food_to_cart(): void
    {
        Sanctum::actingAs(User::factory()->create());
        $food = $this->createFood();

        $this->postJson('/api/cart/items', [
            'food_id' => $food->id,
            'quantity' => 2,
        ])
            ->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.items.0.food.id', $food->id)
            ->assertJsonPath('data.subtotal', '9.00');
    }

    public function test_user_can_update_cart_quantity(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);
        $item = $this->createCartItem($user, 1);

        $this->putJson("/api/cart/items/{$item->id}", [
            'quantity' => 3,
        ])
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.items.0.quantity', 3)
            ->assertJsonPath('data.subtotal', '13.50');
    }

    public function test_user_can_remove_cart_item(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);
        $item = $this->createCartItem($user, 1);

        $this->deleteJson("/api/cart/items/{$item->id}")
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonCount(0, 'data.items')
            ->assertJsonPath('data.subtotal', '0.00');
    }

    public function test_unauthenticated_user_cannot_access_cart(): void
    {
        $this->getJson('/api/cart')
            ->assertUnauthorized();
    }

    public function test_unavailable_food_cannot_be_added_to_cart(): void
    {
        Sanctum::actingAs(User::factory()->create());
        $food = $this->createFood(['status' => 'unavailable']);

        $this->postJson('/api/cart/items', [
            'food_id' => $food->id,
            'quantity' => 1,
        ])
            ->assertUnprocessable()
            ->assertJsonPath('success', false)
            ->assertJsonValidationErrors(['food_id']);
    }

    public function test_adding_the_same_food_increases_quantity(): void
    {
        Sanctum::actingAs(User::factory()->create());
        $food = $this->createFood();

        $this->postJson('/api/cart/items', [
            'food_id' => $food->id,
            'quantity' => 1,
        ])->assertCreated();

        $this->postJson('/api/cart/items', [
            'food_id' => $food->id,
            'quantity' => 2,
        ])
            ->assertCreated()
            ->assertJsonCount(1, 'data.items')
            ->assertJsonPath('data.items.0.quantity', 3)
            ->assertJsonPath('data.subtotal', '13.50');
    }

    public function test_authenticated_user_can_create_order_from_cart(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);
        $address = Address::create([...$this->addressData(), 'user_id' => $user->id]);
        $this->createCartItem($user, 2);

        $this->postJson('/api/orders', [
            'address_id' => $address->id,
        ])
            ->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.user_id', $user->id)
            ->assertJsonPath('data.status', 'pending')
            ->assertJsonCount(1, 'data.items');
    }

    public function test_order_calculates_totals_correctly(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);
        $address = Address::create([...$this->addressData(), 'user_id' => $user->id]);
        $this->createCartItem($user, 2);

        $this->postJson('/api/orders', ['address_id' => $address->id])
            ->assertCreated()
            ->assertJsonPath('data.subtotal', '9.00')
            ->assertJsonPath('data.delivery_fee', '1.50')
            ->assertJsonPath('data.service_fee', '0.30')
            ->assertJsonPath('data.total', '10.80');
    }

    public function test_order_stores_food_name_and_price(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);
        $address = Address::create([...$this->addressData(), 'user_id' => $user->id]);
        $food = $this->createFood(['name' => 'Original Name', 'price' => 7.25]);
        $cart = Cart::create(['user_id' => $user->id]);
        CartItem::create(['cart_id' => $cart->id, 'food_id' => $food->id, 'quantity' => 1]);

        $response = $this->postJson('/api/orders', ['address_id' => $address->id])
            ->assertCreated()
            ->assertJsonPath('data.items.0.food_name', 'Original Name')
            ->assertJsonPath('data.items.0.price', '7.25');

        $this->assertDatabaseHas('order_items', [
            'order_id' => $response->json('data.id'),
            'food_name' => 'Original Name',
            'price' => 7.25,
        ]);
    }

    public function test_cart_is_cleared_after_successful_order(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);
        $address = Address::create([...$this->addressData(), 'user_id' => $user->id]);
        $cart = Cart::create(['user_id' => $user->id]);
        CartItem::create(['cart_id' => $cart->id, 'food_id' => $this->createFood()->id, 'quantity' => 1]);

        $this->postJson('/api/orders', ['address_id' => $address->id])
            ->assertCreated();

        $this->assertDatabaseCount('cart_items', 0);
    }

    public function test_user_cannot_access_another_users_order(): void
    {
        Sanctum::actingAs(User::factory()->create());
        $otherUser = User::factory()->create();
        $address = Address::create([...$this->addressData(), 'user_id' => $otherUser->id]);
        $order = Order::create([
            'user_id' => $otherUser->id,
            'address_id' => $address->id,
            'status' => 'pending',
            'subtotal' => 9.00,
            'delivery_fee' => 1.50,
            'total' => 10.50,
        ]);

        $this->getJson("/api/orders/{$order->id}")
            ->assertNotFound();
    }

    public function test_order_list_only_returns_the_authenticated_users_orders(): void
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();
        Sanctum::actingAs($user);

        $userAddress = Address::create([...$this->addressData(), 'user_id' => $user->id]);
        $otherAddress = Address::create([...$this->addressData(), 'user_id' => $otherUser->id]);
        Order::create(['user_id' => $user->id, 'address_id' => $userAddress->id, 'subtotal' => 4.00, 'delivery_fee' => 1.00, 'status' => 'pending', 'total' => 5.00]);
        Order::create(['user_id' => $otherUser->id, 'address_id' => $otherAddress->id, 'subtotal' => 6.00, 'delivery_fee' => 1.00, 'status' => 'pending', 'total' => 7.00]);

        $this->getJson('/api/orders')
            ->assertOk()
            ->assertJsonCount(1, 'orders')
            ->assertJsonPath('orders.0.customer', $user->name);
    }

    public function test_empty_cart_cannot_create_order(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);
        $address = Address::create([...$this->addressData(), 'user_id' => $user->id]);

        $this->postJson('/api/orders', ['address_id' => $address->id])
            ->assertUnprocessable()
            ->assertJsonPath('success', false)
            ->assertJsonValidationErrors(['cart']);
    }

    public function test_user_cannot_use_another_users_address(): void
    {
        Sanctum::actingAs($user = User::factory()->create());
        $otherUser = User::factory()->create();
        $address = Address::create([...$this->addressData(), 'user_id' => $otherUser->id]);
        $this->createCartItem($user, 1);

        $this->postJson('/api/orders', ['address_id' => $address->id])
            ->assertUnprocessable()
            ->assertJsonPath('success', false)
            ->assertJsonValidationErrors(['address_id']);
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

    /**
     * @param  array<string, mixed>  $overrides
     */
    private function createFood(array $overrides = []): Food
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
            ...$overrides,
        ]);
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
}
