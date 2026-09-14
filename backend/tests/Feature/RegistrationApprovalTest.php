<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Restaurant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class RegistrationApprovalTest extends TestCase
{
    use RefreshDatabase;

    public function test_public_registration_rejects_rider_role(): void
    {
        $this->postJson('/api/register', [
            'name' => 'New Rider',
            'email' => 'rider@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'role' => 'rider',
        ])
            ->assertUnprocessable()
            ->assertJsonPath('success', false)
            ->assertJsonValidationErrors(['role']);

        $this->assertDatabaseMissing('users', ['email' => 'rider@example.com']);
    }

    public function test_admin_can_create_rider_account_and_rider_can_use_delivery_apis(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'admin']));

        $response = $this->postJson('/api/drivers', [
            'name' => 'New Rider',
            'email' => 'rider@example.com',
            'phone' => '012345678',
            'vehicle' => 'Moto',
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.role', 'rider')
            ->assertJsonPath('data.status', 'Online')
            ->assertJsonStructure(['data' => ['temporary_password']]);

        $temporaryPassword = $response->json('data.temporary_password');
        $rider = User::where('email', 'rider@example.com')->firstOrFail();

        // The rider can log in with the credentials the admin generated...
        $this->postJson('/api/login', [
            'email' => 'rider@example.com',
            'password' => $temporaryPassword,
        ])->assertOk();

        // ...and immediately use rider-only functionality, no separate
        // approval step needed since the admin already vetted them.
        Sanctum::actingAs($rider);
        $this->getJson('/api/driver/orders')->assertOk();
    }

    public function test_only_admin_can_create_rider_accounts(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'customer']));

        $this->postJson('/api/drivers', [
            'name' => 'New Rider',
            'email' => 'rider3@example.com',
            'phone' => '012345678',
            'vehicle' => 'Moto',
        ])->assertForbidden();

        $this->assertDatabaseMissing('users', ['email' => 'rider3@example.com']);
    }

    public function test_restaurant_registration_creates_pending_restaurant(): void
    {
        $response = $this->postJson('/api/register', [
            'name' => 'Owner Name',
            'email' => 'owner@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'role' => 'restaurant',
            'restaurant_name' => 'Tasty Bites',
            'restaurant_address' => '99 Food Street',
            'restaurant_phone' => '012999888',
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.otp_required', true)
            ->assertJsonPath('data.purpose', 'registration')
            ->assertJsonStructure([
                'data' => ['challenge_token', 'masked_email', 'expires_in', 'resend_available_in'],
            ])
            ->assertJsonMissingPath('data.user')
            ->assertJsonMissingPath('data.token');

        $this->assertDatabaseHas('restaurants', [
            'name' => 'Tasty Bites',
            'status' => 'pending',
        ]);
    }

    public function test_pending_restaurant_owner_cannot_create_food_or_categories(): void
    {
        $owner = User::factory()->create(['role' => 'restaurant']);
        $restaurant = Restaurant::create([
            'user_id' => $owner->id,
            'name' => 'Pending Kitchen',
            'address' => '1 Street',
            'phone' => '012000000',
            'status' => 'pending',
        ]);
        $category = Category::create(['name' => 'Rice', 'description' => 'Rice dishes.']);
        Sanctum::actingAs($owner);

        $this->postJson('/api/categories', ['name' => 'Snacks'])
            ->assertForbidden();

        $this->postJson('/api/foods', [
            'restaurant_id' => $restaurant->id,
            'category_id' => $category->id,
            'name' => 'Fried Rice',
            'price' => 3.5,
        ])->assertForbidden();
    }

    public function test_approved_restaurant_owner_can_create_categories(): void
    {
        $owner = User::factory()->create(['role' => 'restaurant']);
        Restaurant::create([
            'user_id' => $owner->id,
            'name' => 'Active Kitchen',
            'address' => '1 Street',
            'phone' => '012000000',
            'status' => 'active',
        ]);
        Sanctum::actingAs($owner);

        $this->postJson('/api/categories', ['name' => 'Snacks'])
            ->assertCreated()
            ->assertJsonPath('success', true);
    }

    public function test_restaurant_owner_cannot_self_approve_via_update(): void
    {
        $owner = User::factory()->create(['role' => 'restaurant']);
        $restaurant = Restaurant::create([
            'user_id' => $owner->id,
            'name' => 'Pending Kitchen',
            'address' => '1 Street',
            'phone' => '012000000',
            'status' => 'pending',
        ]);
        Sanctum::actingAs($owner);

        $this->putJson("/api/restaurants/{$restaurant->id}", [
            'name' => 'Pending Kitchen',
            'address' => '1 Street',
            'phone' => '012000000',
            'status' => 'active',
        ])->assertOk();

        $this->assertSame('pending', $restaurant->fresh()->status);
    }

    public function test_admin_can_approve_restaurant_via_status_endpoint(): void
    {
        $owner = User::factory()->create(['role' => 'restaurant']);
        $restaurant = Restaurant::create([
            'user_id' => $owner->id,
            'name' => 'Pending Kitchen',
            'address' => '1 Street',
            'phone' => '012000000',
            'status' => 'pending',
        ]);

        Sanctum::actingAs(User::factory()->create(['role' => 'admin']));
        $this->putJson("/api/restaurants/{$restaurant->id}/status", ['status' => 'active'])
            ->assertOk();

        $this->assertSame('active', $restaurant->fresh()->status);
    }
}
