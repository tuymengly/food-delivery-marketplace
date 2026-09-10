<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class RiderCreationTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_create_a_rider_account_with_temporary_credentials(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'admin']));

        $response = $this->postJson('/api/drivers', [
            'name' => 'Sokha Mean',
            'email' => 'sokha@example.com',
            'phone' => '012345678',
            'vehicle' => 'Moto',
        ])
            ->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.role', 'rider');

        $this->assertNotEmpty($response->json('data.temporary_password'));
        $this->assertDatabaseHas('users', ['email' => 'sokha@example.com', 'role' => 'rider']);
        $this->assertDatabaseHas('riders', ['phone' => '012345678']);
    }

    public function test_customer_cannot_self_register_as_a_rider(): void
    {
        $this->postJson('/api/register', [
            'name' => 'Wannabe Rider',
            'email' => 'wannabe@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'role' => 'rider',
        ])->assertStatus(422);
    }

    public function test_admin_created_rider_can_immediately_use_the_driver_dashboard(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'admin']));
        $created = $this->postJson('/api/drivers', [
            'name' => 'Sokha Mean',
            'email' => 'sokha@example.com',
            'phone' => '012345678',
            'vehicle' => 'Moto',
        ])->assertCreated();

        $rider = User::where('email', 'sokha@example.com')->firstOrFail();
        Sanctum::actingAs($rider);

        // Before this fix, a freshly admin-created rider had no `riders` row
        // and this endpoint would crash (null rider) the first time they
        // opened the driver dashboard.
        $this->getJson('/api/driver/orders')
            ->assertOk()
            ->assertJsonPath('success', true);
    }

    public function test_admin_can_filter_users_by_role_and_search_term(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'admin']));
        User::factory()->create(['name' => 'Alice Customer', 'email' => 'alice@example.com', 'role' => 'customer']);
        User::factory()->create(['name' => 'Bob Owner', 'email' => 'bob@example.com', 'role' => 'restaurant']);

        $byRole = $this->getJson('/api/admin/users?role=restaurant')->assertOk()->json();
        $this->assertTrue(collect($byRole)->every(fn ($u) => $u['role'] === 'restaurant'));

        $bySearch = $this->getJson('/api/admin/users?search=alice')->assertOk()->json();
        $this->assertCount(1, $bySearch);
        $this->assertSame('alice@example.com', $bySearch[0]['email']);
    }

    public function test_non_admin_cannot_create_rider_accounts(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'customer']));

        $this->postJson('/api/drivers', [
            'name' => 'Sokha Mean',
            'email' => 'sokha2@example.com',
            'phone' => '012345678',
            'vehicle' => 'Moto',
        ])->assertForbidden();
    }
}
