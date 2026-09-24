<?php

namespace Tests\Feature;

use App\Models\Address;
use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Category;
use App\Models\Food;
use App\Models\Restaurant;
use App\Models\User;
use App\Models\Voucher;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class CartCheckoutTest extends TestCase
{
    use RefreshDatabase;

    public function test_delivery_order_persists_order_type_payment_method_and_notes(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);
        $address = Address::create([...$this->addressData(), 'user_id' => $user->id]);
        $this->createCartItem($user, 1);

        $response = $this->postJson('/api/orders', [
            'address_id' => $address->id,
            'order_type' => 'delivery',
            'payment_method' => 'khqr',
            'notes' => 'Please make it less spicy.',
        ])
            ->assertCreated()
            ->assertJsonPath('data.order_type', 'delivery')
            ->assertJsonPath('data.payment_method', 'khqr')
            ->assertJsonPath('data.notes', 'Please make it less spicy.');

        $this->assertDatabaseHas('orders', [
            'id' => $response->json('data.id'),
            'order_type' => 'delivery',
            'payment_method' => 'khqr',
        ]);
    }

    public function test_pickup_order_succeeds_without_address_and_skips_rider_assignment(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);
        $this->createCartItem($user, 1);

        $response = $this->postJson('/api/orders', [
            'order_type' => 'pickup',
            'payment_method' => 'cash',
        ])
            ->assertCreated()
            ->assertJsonPath('data.order_type', 'pickup')
            ->assertJsonPath('data.address_id', null)
            ->assertJsonPath('data.delivery_fee', '0.00')
            ->assertJsonPath('data.service_fee', '0.00');

        // Pickup orders are collected in person, so - unlike delivery
        // orders - no Delivery row should ever be created for them. This is
        // the guard that keeps them out of the rider claim pool (see
        // DriverController::orders(), which also filters by order_type).
        $this->assertDatabaseCount('deliveries', 0);
    }

    public function test_valid_voucher_discounts_the_order_and_increments_usage(): void
    {
        $voucher = Voucher::create([
            'code' => 'SAVE10',
            'discount_type' => 'percent',
            'discount_value' => 10,
            'min_subtotal' => 5,
        ]);

        $user = User::factory()->create();
        Sanctum::actingAs($user);
        $address = Address::create([...$this->addressData(), 'user_id' => $user->id]);
        $this->createCartItem($user, 2); // subtotal = 9.00

        $response = $this->postJson('/api/orders', [
            'address_id' => $address->id,
            'voucher_code' => 'save10',
        ])
            ->assertCreated()
            ->assertJsonPath('data.voucher_code', 'SAVE10')
            ->assertJsonPath('data.discount_amount', '0.90')
            ->assertJsonPath('data.total', '9.90'); // 9.00 + 1.50 + 0.30 - 0.90

        $this->assertDatabaseHas('orders', [
            'id' => $response->json('data.id'),
            'voucher_id' => $voucher->id,
        ]);
        $this->assertSame(1, $voucher->fresh()->times_used);
    }

    public function test_expired_voucher_is_rejected_on_order_creation(): void
    {
        Voucher::create([
            'code' => 'EXPIRED10',
            'discount_type' => 'percent',
            'discount_value' => 10,
            'expires_at' => now()->subDay(),
        ]);

        $user = User::factory()->create();
        Sanctum::actingAs($user);
        $address = Address::create([...$this->addressData(), 'user_id' => $user->id]);
        $this->createCartItem($user, 1);

        $this->postJson('/api/orders', [
            'address_id' => $address->id,
            'voucher_code' => 'EXPIRED10',
        ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['voucher_code']);
    }

    public function test_voucher_validate_endpoint_reports_specific_failure_reasons(): void
    {
        Voucher::create([
            'code' => 'WELCOME5',
            'discount_type' => 'fixed',
            'discount_value' => 5,
            'min_subtotal' => 15,
        ]);
        Voucher::create([
            'code' => 'EXPIRED10',
            'discount_type' => 'percent',
            'discount_value' => 10,
            'expires_at' => now()->subDay(),
        ]);

        Sanctum::actingAs(User::factory()->create());

        $this->postJson('/api/vouchers/validate', ['code' => 'DOES-NOT-EXIST', 'subtotal' => 20])
            ->assertUnprocessable()
            ->assertJsonPath('message', 'This voucher code does not exist.');

        $this->postJson('/api/vouchers/validate', ['code' => 'EXPIRED10', 'subtotal' => 20])
            ->assertUnprocessable()
            ->assertJsonPath('message', 'This voucher has expired.');

        $this->postJson('/api/vouchers/validate', ['code' => 'WELCOME5', 'subtotal' => 10])
            ->assertUnprocessable()
            ->assertJsonPath('message', 'Minimum order of $15.00 required for this voucher.');

        $this->postJson('/api/vouchers/validate', ['code' => 'welcome5', 'subtotal' => 20])
            ->assertOk()
            ->assertJsonPath('data.code', 'WELCOME5')
            ->assertJsonPath('data.discount_amount', 5);
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
