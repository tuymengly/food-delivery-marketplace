<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Food;
use App\Models\Restaurant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class MarketplaceApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_restaurants_can_be_listed(): void
    {
        Restaurant::create($this->restaurantData());

        $this->getJson('/api/restaurants')
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonCount(1, 'data');
    }

    public function test_categories_can_be_listed(): void
    {
        Category::create($this->categoryData());

        $this->getJson('/api/categories')
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonCount(1, 'data');
    }

    public function test_foods_can_be_listed(): void
    {
        $restaurant = Restaurant::create($this->restaurantData());
        $category = Category::create($this->categoryData());

        Food::create($this->foodData($restaurant, $category));

        $this->getJson('/api/foods')
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonCount(1, 'data');
    }

    public function test_authenticated_user_can_create_a_restaurant(): void
    {
        $user = User::factory()->create(['role' => 'restaurant']);
        Sanctum::actingAs($user);

        $this->postJson('/api/restaurants', [
            'name' => 'Market Kitchen',
            'description' => 'Fresh everyday meals.',
            'address' => '12 Market Street',
            'phone' => '012345678',
            'image' => 'restaurants/market-kitchen.jpg',
            'status' => 'active',
        ])
            ->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.user_id', $user->id);

        $this->assertDatabaseHas('restaurants', [
            'user_id' => $user->id,
            'name' => 'Market Kitchen',
        ]);
    }

    public function test_authenticated_user_can_create_a_category(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $this->postJson('/api/categories', [
            'name' => 'Noodles',
            'description' => 'Noodle bowls and soups.',
        ])
            ->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.name', 'Noodles');
    }

    public function test_authenticated_user_can_create_food(): void
    {
        $owner = User::factory()->create(['role' => 'restaurant']);
        Sanctum::actingAs($owner);
        $restaurant = Restaurant::create([
            ...$this->restaurantData(),
            'user_id' => $owner->id,
        ]);
        $category = Category::create($this->categoryData());

        $this->postJson('/api/foods', $this->foodData($restaurant, $category))
            ->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.name', 'Chicken Rice')
            ->assertJsonPath('data.restaurant.id', $restaurant->id)
            ->assertJsonPath('data.category.id', $category->id);
    }

    public function test_unauthenticated_user_cannot_create_protected_resources(): void
    {
        $restaurant = Restaurant::create($this->restaurantData());
        $category = Category::create($this->categoryData());

        $this->postJson('/api/restaurants', $this->restaurantData())->assertUnauthorized();
        $this->postJson('/api/categories', $this->categoryData())->assertUnauthorized();
        $this->postJson('/api/foods', $this->foodData($restaurant, $category))->assertUnauthorized();
    }

    public function test_food_validation_rejects_invalid_price(): void
    {
        Sanctum::actingAs(User::factory()->create());
        $restaurant = Restaurant::create($this->restaurantData());
        $category = Category::create($this->categoryData());

        $this->postJson('/api/foods', [
            ...$this->foodData($restaurant, $category),
            'price' => -1,
        ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['price']);
    }

    public function test_food_validation_rejects_nonexistent_restaurant_and_category(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $this->postJson('/api/foods', [
            'restaurant_id' => 999,
            'category_id' => 999,
            'name' => 'Ghost Dish',
            'description' => 'Should not be accepted.',
            'price' => 5.50,
            'status' => 'available',
        ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['restaurant_id', 'category_id']);
    }

    /**
     * @return array<string, mixed>
     */
    private function restaurantData(): array
    {
        return [
            'user_id' => User::factory()->create(['role' => 'restaurant'])->id,
            'name' => 'City Bites',
            'description' => 'Simple local food.',
            'address' => '100 Main Road',
            'phone' => '012345678',
            'image' => null,
            'status' => 'active',
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function categoryData(): array
    {
        return [
            'name' => 'Rice',
            'description' => 'Rice dishes.',
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function foodData(Restaurant $restaurant, Category $category): array
    {
        return [
            'restaurant_id' => $restaurant->id,
            'category_id' => $category->id,
            'name' => 'Chicken Rice',
            'description' => 'Steamed chicken with rice.',
            'price' => 4.50,
            'image' => null,
            'status' => 'available',
        ];
    }
}
