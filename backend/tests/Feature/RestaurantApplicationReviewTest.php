<?php

namespace Tests\Feature;

use App\Models\Restaurant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class RestaurantApplicationReviewTest extends TestCase
{
    use RefreshDatabase;

    private function pendingApplication(): Restaurant
    {
        $owner = User::factory()->create(['role' => 'restaurant', 'email' => 'owner@example.com']);

        return Restaurant::create([
            'user_id' => $owner->id,
            'name' => 'Pending Kitchen',
            'address' => '1 Street',
            'phone' => '012000000',
            'description' => 'A cozy place.',
            'cuisine' => 'Khmer',
            'status' => 'pending',
            'documents' => [
                ['name' => 'Business License', 'url' => 'https://res.cloudinary.com/demo/license.pdf'],
            ],
            'photos' => ['https://res.cloudinary.com/demo/photo1.jpg'],
        ]);
    }

    public function test_only_admin_can_list_restaurant_applications(): void
    {
        $this->pendingApplication();
        Sanctum::actingAs(User::factory()->create(['role' => 'customer']));

        $this->getJson('/api/admin/restaurants')->assertForbidden();
    }

    public function test_admin_can_list_and_filter_restaurant_applications(): void
    {
        $pending = $this->pendingApplication();
        Restaurant::create([
            'user_id' => User::factory()->create(['role' => 'restaurant'])->id,
            'name' => 'Active Kitchen',
            'address' => '2 Street',
            'phone' => '012111111',
            'status' => 'active',
        ]);

        Sanctum::actingAs(User::factory()->create(['role' => 'admin']));

        $this->getJson('/api/admin/restaurants?status=pending')
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $pending->id)
            ->assertJsonPath('data.0.user.email', 'owner@example.com');

        $this->getJson('/api/admin/restaurants')
            ->assertOk()
            ->assertJsonCount(2, 'data');
    }

    public function test_admin_can_view_full_application_detail_with_documents(): void
    {
        $restaurant = $this->pendingApplication();
        Sanctum::actingAs(User::factory()->create(['role' => 'admin']));

        $this->getJson("/api/admin/restaurants/{$restaurant->id}")
            ->assertOk()
            ->assertJsonPath('data.id', $restaurant->id)
            ->assertJsonPath('data.user.email', 'owner@example.com')
            ->assertJsonPath('data.documents.0.name', 'Business License')
            ->assertJsonPath('data.photos.0', 'https://res.cloudinary.com/demo/photo1.jpg');
    }

    public function test_public_endpoints_never_expose_submitted_documents(): void
    {
        $restaurant = $this->pendingApplication();
        $restaurant->update(['status' => 'active']);

        $this->getJson("/api/restaurants/{$restaurant->id}")
            ->assertOk()
            ->assertJsonMissingPath('data.documents');

        $this->getJson('/api/restaurants')
            ->assertOk()
            ->assertJsonMissingPath('data.0.documents');
    }

    public function test_owner_can_see_their_own_documents_and_rejection_reason(): void
    {
        $restaurant = $this->pendingApplication();
        $restaurant->update(['status' => 'rejected', 'rejection_reason' => 'Missing business license photo.']);

        Sanctum::actingAs($restaurant->user);

        $this->getJson('/api/restaurant/profile')
            ->assertOk()
            ->assertJsonPath('data.status', 'rejected')
            ->assertJsonPath('data.rejection_reason', 'Missing business license photo.')
            ->assertJsonPath('data.documents.0.name', 'Business License');
    }

    public function test_admin_can_approve_pending_application(): void
    {
        $restaurant = $this->pendingApplication();
        $restaurant->update(['rejection_reason' => 'previous note']);
        Sanctum::actingAs(User::factory()->create(['role' => 'admin']));

        $this->putJson("/api/admin/restaurants/{$restaurant->id}/approve")
            ->assertOk()
            ->assertJsonPath('data.status', 'active');

        $restaurant->refresh();
        $this->assertSame('active', $restaurant->status);
        $this->assertNull($restaurant->rejection_reason);
    }

    public function test_rejecting_an_application_requires_a_reason(): void
    {
        $restaurant = $this->pendingApplication();
        Sanctum::actingAs(User::factory()->create(['role' => 'admin']));

        $this->putJson("/api/admin/restaurants/{$restaurant->id}/reject", [])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['rejection_reason']);

        $this->assertSame('pending', $restaurant->fresh()->status);
    }

    public function test_admin_can_reject_pending_application_with_reason(): void
    {
        $restaurant = $this->pendingApplication();
        Sanctum::actingAs(User::factory()->create(['role' => 'admin']));

        $this->putJson("/api/admin/restaurants/{$restaurant->id}/reject", [
            'rejection_reason' => 'Address could not be verified.',
        ])
            ->assertOk()
            ->assertJsonPath('data.status', 'rejected');

        $restaurant->refresh();
        $this->assertSame('rejected', $restaurant->status);
        $this->assertSame('Address could not be verified.', $restaurant->rejection_reason);
    }

    public function test_only_admin_can_approve_or_reject_applications(): void
    {
        $restaurant = $this->pendingApplication();
        Sanctum::actingAs(User::factory()->create(['role' => 'customer']));

        $this->putJson("/api/admin/restaurants/{$restaurant->id}/approve")->assertForbidden();
        $this->putJson("/api/admin/restaurants/{$restaurant->id}/reject", [
            'rejection_reason' => 'Nope',
        ])->assertForbidden();

        $this->assertSame('pending', $restaurant->fresh()->status);
    }

    public function test_legacy_status_endpoint_supports_rejected_status_with_reason(): void
    {
        $restaurant = $this->pendingApplication();
        Sanctum::actingAs(User::factory()->create(['role' => 'admin']));

        $this->putJson("/api/restaurants/{$restaurant->id}/status", ['status' => 'rejected'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['rejection_reason']);

        $this->putJson("/api/restaurants/{$restaurant->id}/status", [
            'status' => 'rejected',
            'rejection_reason' => 'Duplicate application.',
        ])->assertOk();

        $restaurant->refresh();
        $this->assertSame('rejected', $restaurant->status);
        $this->assertSame('Duplicate application.', $restaurant->rejection_reason);
    }

    public function test_owner_can_submit_opening_hours_photos_and_documents_via_profile(): void
    {
        $restaurant = $this->pendingApplication();
        Sanctum::actingAs($restaurant->user);

        $this->putJson('/api/restaurant/profile', [
            'name' => $restaurant->name,
            'address' => $restaurant->address,
            'phone' => $restaurant->phone,
            'opening_hours' => [
                'monday' => ['open' => '09:00', 'close' => '22:00', 'closed' => false],
                'sunday' => ['open' => null, 'close' => null, 'closed' => true],
            ],
            'photos' => [
                'https://res.cloudinary.com/demo/photo1.jpg',
                'https://res.cloudinary.com/demo/photo2.jpg',
            ],
            'documents' => [
                ['name' => 'Food Safety Certificate', 'url' => 'https://res.cloudinary.com/demo/cert.pdf'],
            ],
        ])
            ->assertOk()
            ->assertJsonPath('data.opening_hours.monday.open', '09:00')
            ->assertJsonPath('data.photos.1', 'https://res.cloudinary.com/demo/photo2.jpg')
            ->assertJsonPath('data.documents.0.name', 'Food Safety Certificate');

        $this->assertSame('pending', $restaurant->fresh()->status);
    }

    /**
     * The restaurant map picker (customer-frontend/admin-restaurant location
     * feature) saves through this same endpoint - without latitude/longitude
     * in its validation rules the coordinates would be silently dropped and
     * RiderMatchingService could never place this restaurant.
     */
    public function test_owner_can_save_the_restaurants_map_coordinates_via_profile(): void
    {
        $restaurant = $this->pendingApplication();
        Sanctum::actingAs($restaurant->user);

        $this->putJson('/api/restaurant/profile', [
            'name' => $restaurant->name,
            'address' => $restaurant->address,
            'phone' => $restaurant->phone,
            'latitude' => 11.5564,
            'longitude' => 104.9282,
        ])
            ->assertOk()
            ->assertJsonPath('data.latitude', '11.5564000')
            ->assertJsonPath('data.longitude', '104.9282000');

        $this->assertEquals(11.5564, (float) $restaurant->fresh()->latitude);
        $this->assertEquals(104.9282, (float) $restaurant->fresh()->longitude);
    }
}
