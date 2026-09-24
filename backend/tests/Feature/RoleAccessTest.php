<?php

namespace Tests\Feature;

use App\Models\Restaurant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * Cross-role API authorization: the role stored on the user row (normalized
 * by App\Support\UserRoles) decides what a token can reach, regardless of
 * anything the frontend keeps in localStorage.
 */
class RoleAccessTest extends TestCase
{
    use RefreshDatabase;

    public function test_login_and_current_user_expose_the_database_role_and_a_canonical_role_key(): void
    {
        $owner = User::factory()->create([
            'email' => 'owner@example.com',
            'password' => 'owner-password',
            'role' => 'restaurant',
        ]);
        Restaurant::create([
            'user_id' => $owner->id,
            'name' => 'Owner Restaurant',
            'address' => 'One Street',
            'phone' => '012345678',
            'status' => 'active',
        ]);

        $token = $this->postJson('/api/login', [
            'email' => 'owner@example.com',
            'password' => 'owner-password',
        ])
            ->assertOk()
            // The raw column value is preserved ...
            ->assertJsonPath('data.user.role', 'restaurant')
            // ... and the canonical role the frontends route on is derived from it.
            ->assertJsonPath('data.user.role_key', 'restaurant_owner')
            ->json('data.token');

        $this->withHeader('Authorization', 'Bearer ' . $token)
            ->getJson('/api/user')
            ->assertOk()
            ->assertJsonPath('data.user.role', 'restaurant')
            ->assertJsonPath('data.user.role_key', 'restaurant_owner');
    }

    public function test_legacy_role_spellings_resolve_to_the_same_canonical_role(): void
    {
        $legacyOwner = User::factory()->create(['email' => 'legacy@example.com', 'role' => 'Restaurant Admin']);
        $legacyRider = User::factory()->create(['email' => 'legacy-rider@example.com', 'role' => 'Driver']);

        $this->assertSame('restaurant_owner', $legacyOwner->role_key);
        $this->assertSame('rider', $legacyRider->role_key);
    }

    public function test_customer_cannot_reach_restaurant_owner_or_rider_or_admin_apis(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'customer']));

        $this->getJson('/api/restaurant/orders')->assertForbidden();
        $this->getJson('/api/restaurant/profile')->assertForbidden();
        $this->postJson('/api/categories', ['name' => 'Snacks'])->assertForbidden();
        $this->postJson('/api/foods', ['name' => 'Fried Rice'])->assertForbidden();
        $this->getJson('/api/rider/profile')->assertForbidden();
        $this->getJson('/api/driver/orders')->assertForbidden();
        $this->getJson('/api/admin/users')->assertForbidden();
    }

    public function test_restaurant_owner_cannot_reach_rider_or_admin_apis(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'restaurant']));

        $this->getJson('/api/rider/deliveries')->assertForbidden();
        $this->getJson('/api/driver/orders')->assertForbidden();
        $this->getJson('/api/admin/users')->assertForbidden();
    }

    public function test_rider_cannot_reach_restaurant_owner_apis(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'rider']));

        $this->getJson('/api/restaurant/orders')->assertForbidden();
        $this->getJson('/api/restaurant/stats')->assertForbidden();
        $this->postJson('/api/categories', ['name' => 'Snacks'])->assertForbidden();
    }

    public function test_each_role_can_still_reach_its_own_portal(): void
    {
        $customer = User::factory()->create(['role' => 'customer']);
        Sanctum::actingAs($customer);
        $this->getJson('/api/user')->assertOk();
        $this->getJson('/api/cart')->assertOk();
        $this->postJson('/api/logout')->assertOk();

        $owner = User::factory()->create(['role' => 'restaurant']);
        Restaurant::create([
            'user_id' => $owner->id,
            'name' => 'Owner Restaurant',
            'address' => 'One Street',
            'phone' => '012345678',
            'status' => 'active',
        ]);
        Sanctum::actingAs($owner);
        $this->getJson('/api/restaurant/orders')->assertOk();

        $rider = User::factory()->create(['role' => 'rider']);
        Sanctum::actingAs($rider);
        $this->getJson('/api/driver/orders')->assertOk();

        Sanctum::actingAs(User::factory()->create(['role' => 'admin']));
        $this->getJson('/api/admin/users')->assertOk();
    }

    public function test_an_unknown_role_is_denied_rather_than_treated_as_a_customer(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'mystery']));

        $this->getJson('/api/user')->assertOk()->assertJsonPath('data.user.role_key', null);
        $this->getJson('/api/restaurant/orders')->assertForbidden();
        $this->getJson('/api/driver/orders')->assertForbidden();
    }

    /**
     * The cross-role flow that used to misroute a restaurant owner: log in,
     * log out, then log in as a different role. Each login must report its own
     * role, the revoked token must stop working, and GET /api/user (which the
     * frontends use on every start/refresh) must answer with the role that is
     * currently in the database.
     */
    public function test_switching_roles_after_logout_never_inherits_the_previous_role(): void
    {
        $owner = User::factory()->create([
            'email' => 'owner-switch@example.com',
            'password' => 'owner-password',
            'role' => 'restaurant',
        ]);
        Restaurant::create([
            'user_id' => $owner->id,
            'name' => 'Owner Restaurant',
            'address' => 'One Street',
            'phone' => '012345678',
            'status' => 'active',
        ]);
        User::factory()->create([
            'email' => 'customer-switch@example.com',
            'password' => 'customer-password',
            'role' => 'customer',
        ]);

        // 1. Restaurant owner logs in.
        $ownerToken = $this->postJson('/api/login', [
            'email' => 'owner-switch@example.com',
            'password' => 'owner-password',
        ])
            ->assertOk()
            ->assertJsonPath('data.user.role_key', 'restaurant_owner')
            ->json('data.token');

        $this->withHeader('Authorization', 'Bearer ' . $ownerToken)
            ->getJson('/api/user')
            ->assertOk()
            ->assertJsonPath('data.user.role_key', 'restaurant_owner');

        // 2. Logs out - the token is revoked in the database and stops working.
        // (The guard is forgotten between requests because Laravel caches the
        // resolved user instance for the duration of a single test method -
        // the same caveat noted in
        // AuthApiTest::test_password_reset_revokes_existing_sanctum_tokens.)
        $this->withHeader('Authorization', 'Bearer ' . $ownerToken)
            ->postJson('/api/logout')
            ->assertOk();

        $this->assertSame(0, $owner->tokens()->count());
        $this->app['auth']->forgetGuards();

        $this->withHeader('Authorization', 'Bearer ' . $ownerToken)
            ->getJson('/api/user')
            ->assertUnauthorized();

        // 3. A customer logs in on the same browser session.
        $customerToken = $this->postJson('/api/login', [
            'email' => 'customer-switch@example.com',
            'password' => 'customer-password',
        ])
            ->assertOk()
            // Never the previous user's role.
            ->assertJsonPath('data.user.role_key', 'user')
            ->json('data.token');

        $this->app['auth']->forgetGuards();

        $this->withHeader('Authorization', 'Bearer ' . $customerToken)
            ->getJson('/api/user')
            ->assertOk()
            ->assertJsonPath('data.user.role_key', 'user');

        // 4. And back to the restaurant owner, which must report its own role again.
        $this->postJson('/api/login', [
            'email' => 'owner-switch@example.com',
            'password' => 'owner-password',
        ])
            ->assertOk()
            ->assertJsonPath('data.user.role_key', 'restaurant_owner');
    }

    /**
     * A role change made in the database (e.g. an admin promoting an account)
     * must win over anything a frontend cached: the very next GET /api/user
     * answers with the new role.
     */
    public function test_the_database_role_wins_over_a_stale_frontend_value(): void
    {
        $user = User::factory()->create([
            'email' => 'promoted@example.com',
            'password' => 'promoted-password',
            'role' => 'customer',
        ]);

        $token = $this->postJson('/api/login', [
            'email' => 'promoted@example.com',
            'password' => 'promoted-password',
        ])->assertJsonPath('data.user.role_key', 'user')->json('data.token');

        $user->update(['role' => 'restaurant']);

        $this->withHeader('Authorization', 'Bearer ' . $token)
            ->getJson('/api/user')
            ->assertOk()
            ->assertJsonPath('data.user.role', 'restaurant')
            ->assertJsonPath('data.user.role_key', 'restaurant_owner');
    }
}
