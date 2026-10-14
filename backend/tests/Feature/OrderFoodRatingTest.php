<?php

namespace Tests\Feature;

use App\Models\Address;
use App\Models\Category;
use App\Models\Food;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Restaurant;
use App\Models\Review;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * A customer may rate the dishes of an order they placed, but only once the
 * order has actually reached them - see ReviewController::storeOrderItem.
 */
class OrderFoodRatingTest extends TestCase
{
    use RefreshDatabase;

    public function test_customer_can_rate_a_dish_of_a_completed_order(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);
        [$order, $food] = $this->createOrderWithFood($user, 'completed');

        $this->postJson("/api/orders/{$order->id}/food-reviews", [
            'food_id' => $food->id,
            'rating' => 5,
            'comment' => 'Excellent portion and still hot.',
        ])
            ->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.rating', 5)
            ->assertJsonPath('data.comment', 'Excellent portion and still hot.')
            ->assertJsonPath('data.food_id', $food->id)
            ->assertJsonPath('data.order_id', $order->id)
            ->assertJsonPath('data.restaurant_id', $food->restaurant_id)
            ->assertJsonPath('data.type', Review::TYPE_FOOD);

        $this->assertDatabaseHas('reviews', [
            'user_id' => $user->id,
            'order_id' => $order->id,
            'food_id' => $food->id,
            'rating' => 5,
        ]);
    }

    public function test_a_rating_can_be_left_without_a_comment(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);
        [$order, $food] = $this->createOrderWithFood($user, 'delivered');

        $this->postJson("/api/orders/{$order->id}/food-reviews", [
            'food_id' => $food->id,
            'rating' => 4,
        ])
            ->assertCreated()
            ->assertJsonPath('data.comment', '');
    }

    public function test_rating_the_same_dish_again_updates_the_existing_review(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);
        [$order, $food] = $this->createOrderWithFood($user, 'completed');

        $this->postJson("/api/orders/{$order->id}/food-reviews", [
            'food_id' => $food->id,
            'rating' => 2,
            'comment' => 'Cold when it arrived.',
        ])->assertCreated();

        $this->postJson("/api/orders/{$order->id}/food-reviews", [
            'food_id' => $food->id,
            'rating' => 4,
            'comment' => 'Second look: it was fine.',
        ])->assertCreated();

        $this->assertDatabaseCount('reviews', 1);
        $this->assertDatabaseHas('reviews', [
            'user_id' => $user->id,
            'order_id' => $order->id,
            'food_id' => $food->id,
            'rating' => 4,
            'comment' => 'Second look: it was fine.',
        ]);
    }

    public function test_dish_cannot_be_rated_before_the_order_is_finished(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);
        [$order, $food] = $this->createOrderWithFood($user, 'delivering');

        $this->postJson("/api/orders/{$order->id}/food-reviews", [
            'food_id' => $food->id,
            'rating' => 5,
        ])
            ->assertUnprocessable()
            ->assertJsonPath('success', false)
            ->assertJsonValidationErrors(['order']);

        $this->assertDatabaseCount('reviews', 0);
    }

    public function test_a_dish_that_was_not_ordered_cannot_be_rated(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);
        [$order] = $this->createOrderWithFood($user, 'completed');
        $otherFood = $this->createFood();

        $this->postJson("/api/orders/{$order->id}/food-reviews", [
            'food_id' => $otherFood->id,
            'rating' => 1,
        ])
            ->assertUnprocessable()
            ->assertJsonPath('success', false)
            ->assertJsonValidationErrors(['food_id']);

        $this->assertDatabaseCount('reviews', 0);
    }

    public function test_customer_cannot_rate_someone_elses_order(): void
    {
        Sanctum::actingAs(User::factory()->create());
        [$order, $food] = $this->createOrderWithFood(User::factory()->create(), 'completed');

        $this->postJson("/api/orders/{$order->id}/food-reviews", [
            'food_id' => $food->id,
            'rating' => 1,
        ])->assertNotFound();

        $this->assertDatabaseCount('reviews', 0);
    }

    public function test_customer_cannot_read_reviews_of_someone_elses_order(): void
    {
        Sanctum::actingAs(User::factory()->create());
        [$order] = $this->createOrderWithFood(User::factory()->create(), 'completed');

        $this->getJson("/api/orders/{$order->id}/food-reviews")
            ->assertNotFound();
    }

    public function test_rating_is_required_to_be_between_one_and_five(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);
        [$order, $food] = $this->createOrderWithFood($user, 'completed');

        $this->postJson("/api/orders/{$order->id}/food-reviews", [
            'food_id' => $food->id,
            'rating' => 0,
        ])->assertJsonValidationErrors(['rating']);

        $this->postJson("/api/orders/{$order->id}/food-reviews", [
            'food_id' => $food->id,
            'rating' => 6,
        ])->assertJsonValidationErrors(['rating']);
    }

    public function test_unauthenticated_user_cannot_rate_food(): void
    {
        [$order, $food] = $this->createOrderWithFood(User::factory()->create(), 'completed');

        $this->postJson("/api/orders/{$order->id}/food-reviews", [
            'food_id' => $food->id,
            'rating' => 5,
        ])->assertUnauthorized();
    }

    public function test_order_food_reviews_lists_only_the_customers_own_ratings(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);
        [$order, $food] = $this->createOrderWithFood($user, 'completed');

        $this->postJson("/api/orders/{$order->id}/food-reviews", [
            'food_id' => $food->id,
            'rating' => 4,
        ])->assertCreated();

        $this->getJson("/api/orders/{$order->id}/food-reviews")
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.food_id', $food->id)
            ->assertJsonPath('data.0.rating', 4);
    }

    /**
     * @return array{0: Order, 1: Food}
     */
    private function createOrderWithFood(User $user, string $status): array
    {
        $food = $this->createFood();
        $order = Order::create([
            'user_id' => $user->id,
            'restaurant_id' => $food->restaurant_id,
            'address_id' => $this->createAddress($user)->id,
            'subtotal' => 4.50,
            'delivery_fee' => 1.50,
            'total' => 6.00,
            'status' => $status,
        ]);

        OrderItem::create([
            'order_id' => $order->id,
            'food_id' => $food->id,
            'food_name' => $food->name,
            'quantity' => 1,
            'price' => 4.50,
            'subtotal' => 4.50,
        ]);

        return [$order, $food];
    }

    private function createFood(): Food
    {
        $restaurant = Restaurant::create([
            'user_id' => User::factory()->create(['role' => 'restaurant'])->id,
            'name' => 'City Bites',
            'description' => 'Simple local food.',
            'address' => '100 Main Road',
            'phone' => '012345678',
            'status' => 'active',
        ]);

        $category = Category::firstOrCreate(
            ['name' => 'Rice'],
            ['description' => 'Rice dishes.'],
        );

        return Food::create([
            'restaurant_id' => $restaurant->id,
            'category_id' => $category->id,
            'name' => 'Chicken Rice',
            'description' => 'Steamed chicken with rice.',
            'price' => 4.50,
            'status' => 'available',
        ]);
    }

    private function createAddress(User $user): Address
    {
        return Address::create([
            'user_id' => $user->id,
            'label' => 'Home',
            'recipient_name' => 'Test Customer',
            'phone' => '012345678',
            'address' => '100 Main Road',
            'is_default' => true,
        ]);
    }
}
