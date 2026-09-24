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
use App\Notifications\DeliveryAssignedNotification;
use App\Notifications\OrderRejectedNotification;
use App\Services\RiderMatchingService;
use App\Support\OrderStatuses;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * Covers the marketplace's rider-assignment business rules end to end:
 *
 *   customer -> payment -> PENDING_RESTAURANT
 *   restaurant accept -> PREPARING
 *   restaurant ready -> READY_FOR_PICKUP -> nearest ELIGIBLE rider (or none)
 *   rider accept -> PICKED_UP -> DELIVERING -> DELIVERED
 *   restaurant reject -> CANCELLED, never a rider
 */
class RiderAutoAssignmentTest extends TestCase
{
    use RefreshDatabase;

    private const RESTAURANT_LAT = 11.5564;
    private const RESTAURANT_LNG = 104.9282;
    private const ADDRESS_LAT = 11.5625;
    private const ADDRESS_LNG = 104.9160;

    public function test_no_rider_is_assigned_or_notified_while_the_restaurant_is_still_deciding(): void
    {
        Notification::fake();

        $rider = $this->createOnlineRider('Waiting Rider', self::RESTAURANT_LAT, self::RESTAURANT_LNG);
        [$customer] = $this->createScenario();

        $order = $this->placeDeliveryOrder($customer);

        // PENDING_RESTAURANT: the restaurant has not accepted yet.
        $this->assertSame(OrderStatuses::PENDING, $order->status);
        $this->assertDatabaseHas('deliveries', [
            'order_id' => $order->id,
            'rider_id' => null,
            'status' => 'pending',
        ]);
        $this->assertTrue((bool) $rider->refresh()->is_available);

        // The rider dashboard does not list it, so there is nothing to accept.
        Sanctum::actingAs($rider->user);
        $this->getJson('/api/driver/orders')
            ->assertOk()
            ->assertJsonCount(0, 'data.available_requests')
            ->assertJsonPath('data.active_order', null);

        Notification::assertNothingSent();
    }

    public function test_no_rider_is_assigned_while_the_restaurant_is_preparing(): void
    {
        Notification::fake();

        $rider = $this->createOnlineRider('Waiting Rider', self::RESTAURANT_LAT, self::RESTAURANT_LNG);
        [$customer, $restaurant] = $this->createScenario();

        $order = $this->placeDeliveryOrder($customer);

        $this->markOrderStatus($restaurant, $order, 'Accepted')->assertOk();
        $this->markOrderStatus($restaurant, $order, 'Preparing')
            ->assertOk()
            ->assertJsonPath('assigned_rider_id', null);

        $this->assertDatabaseHas('deliveries', ['order_id' => $order->id, 'rider_id' => null, 'status' => 'pending']);
        $this->assertTrue((bool) $rider->refresh()->is_available);
        Notification::assertNothingSent();
    }

    public function test_restaurant_marking_the_order_ready_assigns_the_nearest_eligible_rider(): void
    {
        Notification::fake();

        [$customer, $restaurant] = $this->createScenario();
        $nearRider = $this->createOnlineRider('Near Rider', 11.5580, 104.9290);
        $farRider = $this->createOnlineRider('Far Rider', 12.7000, 105.9000);

        $order = $this->placeDeliveryOrder($customer);

        // Accept -> PREPARING. The nearest rider is still untouched.
        $this->markOrderStatus($restaurant, $order, 'Preparing')
            ->assertOk()
            ->assertJsonPath('status', 'Preparing')
            ->assertJsonPath('assigned_rider_id', null);

        // READY_FOR_PICKUP is what triggers automatic assignment.
        $this->markOrderStatus($restaurant, $order, 'Ready')
            ->assertOk()
            ->assertJsonPath('status', 'Ready')
            ->assertJsonPath('assigned_rider_id', $nearRider->id);

        $this->assertDatabaseHas('deliveries', [
            'order_id' => $order->id,
            'rider_id' => $nearRider->id,
            'status' => 'assigned',
        ]);
        // The order stays READY_FOR_PICKUP until the rider collects the food.
        $this->assertSame(OrderStatuses::READY, $order->refresh()->status);
        $this->assertFalse((bool) $nearRider->refresh()->is_available);
        $this->assertTrue((bool) $farRider->refresh()->is_available);

        Notification::assertSentTo($nearRider->user, DeliveryAssignedNotification::class);
        Notification::assertNotSentTo($farRider->user, DeliveryAssignedNotification::class);

        // It shows up as that rider's own active delivery.
        Sanctum::actingAs($nearRider->user);
        $this->getJson('/api/driver/orders')
            ->assertOk()
            ->assertJsonPath('data.active_order.real_id', $order->id)
            ->assertJsonPath('data.active_order.delivery_status', 'assigned')
            ->assertJsonCount(0, 'data.available_requests');
    }

    public function test_assigned_rider_can_accept_pick_up_deliver_and_finish_the_order(): void
    {
        [$customer, $restaurant] = $this->createScenario();
        $rider = $this->createOnlineRider('Rider', self::RESTAURANT_LAT, self::RESTAURANT_LNG);

        $order = $this->placeDeliveryOrder($customer);
        $this->markOrderStatus($restaurant, $order, 'Preparing')->assertOk();
        $this->markOrderStatus($restaurant, $order, 'Ready')->assertOk();

        $delivery = $order->refresh()->delivery;

        Sanctum::actingAs($rider->user);
        $this->postJson("/api/rider/deliveries/{$delivery->id}/accept")
            ->assertOk()
            ->assertJsonPath('data.rider_id', $rider->id);
        $this->postJson("/api/rider/deliveries/{$delivery->id}/pickup")->assertOk();
        $this->assertSame(OrderStatuses::DELIVERING, $order->refresh()->status);

        $this->postJson("/api/rider/deliveries/{$delivery->id}/start")->assertOk();
        $this->postJson("/api/rider/deliveries/{$delivery->id}/deliver")->assertOk();

        $this->assertSame(OrderStatuses::DELIVERED, $order->refresh()->status);
        $this->assertSame('delivered', $delivery->refresh()->status);
        $this->assertTrue((bool) $rider->refresh()->is_available);
    }

    public function test_restaurant_rejection_cancels_the_order_and_never_touches_a_rider(): void
    {
        Notification::fake();

        [$customer, $restaurant] = $this->createScenario();
        $rider = $this->createOnlineRider('Near Rider', self::RESTAURANT_LAT, self::RESTAURANT_LNG);

        $order = $this->placeDeliveryOrder($customer);

        // "Rejected" is the marketplace alias of the canonical CANCELLED.
        $this->markOrderStatus($restaurant, $order, 'Rejected')
            ->assertOk()
            ->assertJsonPath('status', 'Cancelled')
            ->assertJsonPath('assigned_rider_id', null);

        $this->assertSame(OrderStatuses::CANCELLED, $order->refresh()->status);
        $this->assertDatabaseHas('deliveries', [
            'order_id' => $order->id,
            'rider_id' => null,
            'status' => 'cancelled',
        ]);
        $this->assertTrue((bool) $rider->refresh()->is_available);

        Notification::assertSentTo($customer, OrderRejectedNotification::class);
        Notification::assertNotSentTo($rider->user, DeliveryAssignedNotification::class);

        // The customer still sees their cancelled order.
        Sanctum::actingAs($customer);
        $this->getJson('/api/orders')
            ->assertOk()
            ->assertJsonPath('orders.0.status', 'Cancelled');
    }

    public function test_cancelling_an_order_that_already_has_a_rider_frees_the_rider_and_cancels_the_delivery(): void
    {
        Notification::fake();

        [$customer, $restaurant] = $this->createScenario();
        $rider = $this->createOnlineRider('Near Rider', self::RESTAURANT_LAT, self::RESTAURANT_LNG);

        $order = $this->placeDeliveryOrder($customer);
        $this->markOrderStatus($restaurant, $order, 'Preparing')->assertOk();
        $this->markOrderStatus($restaurant, $order, 'Ready')->assertOk();
        $this->assertFalse((bool) $rider->refresh()->is_available);

        $this->markOrderStatus($restaurant, $order, 'Cancelled')->assertOk();

        $this->assertSame(OrderStatuses::CANCELLED, $order->refresh()->status);
        $this->assertDatabaseHas('deliveries', ['order_id' => $order->id, 'status' => 'cancelled']);
        $this->assertTrue((bool) $rider->refresh()->is_available);
        Notification::assertSentTo($customer, OrderRejectedNotification::class);
    }

    public function test_without_an_eligible_rider_the_order_waits_in_ready_for_pickup_until_one_becomes_available(): void
    {
        [$customer, $restaurant] = $this->createScenario();

        $order = $this->placeDeliveryOrder($customer);
        $this->markOrderStatus($restaurant, $order, 'Preparing')->assertOk();
        $this->markOrderStatus($restaurant, $order, 'Ready')
            ->assertOk()
            ->assertJsonPath('assigned_rider_id', null);

        // No rider was eligible: the order stays READY_FOR_PICKUP, unassigned -
        // it is never handed to an arbitrary rider.
        $this->assertSame(OrderStatuses::READY, $order->refresh()->status);
        $this->assertDatabaseHas('deliveries', ['order_id' => $order->id, 'rider_id' => null, 'status' => 'pending']);

        // A rider comes online with a fresh location, but is still not available.
        $riderUser = User::factory()->create(['role' => 'rider']);
        $rider = $this->createRiderProfile($riderUser, ['is_online' => false, 'is_available' => false]);
        Sanctum::actingAs($riderUser);

        $this->putJson('/api/rider/location', ['latitude' => self::RESTAURANT_LAT, 'longitude' => self::RESTAURANT_LNG])
            ->assertOk();
        $this->putJson('/api/rider/online-status', ['is_online' => true])->assertOk();
        $this->assertDatabaseHas('deliveries', ['order_id' => $order->id, 'rider_id' => null, 'status' => 'pending']);

        // Becoming available is the retry trigger.
        $this->putJson('/api/rider/availability', ['is_available' => true])->assertOk();

        $this->assertDatabaseHas('deliveries', [
            'order_id' => $order->id,
            'rider_id' => $rider->id,
            'status' => 'assigned',
        ]);
        $this->assertSame(OrderStatuses::READY, $order->refresh()->status);
        $this->assertFalse((bool) $rider->refresh()->is_available);
    }

    public function test_a_busy_rider_is_skipped_even_when_they_are_closer(): void
    {
        [$customer, $restaurant] = $this->createScenario();
        $busyRider = $this->createOnlineRider('Busy Rider', 11.5565, 104.9283, ['is_available' => false]);
        $availableRider = $this->createOnlineRider('Available Rider', 11.5900, 104.9500);

        $order = $this->placeDeliveryOrder($customer);
        $this->markOrderStatus($restaurant, $order, 'Preparing')->assertOk();

        $this->markOrderStatus($restaurant, $order, 'Ready')
            ->assertOk()
            ->assertJsonPath('assigned_rider_id', $availableRider->id);

        $this->assertDatabaseHas('deliveries', [
            'order_id' => $order->id,
            'rider_id' => $availableRider->id,
            'status' => 'assigned',
        ]);
        $this->assertFalse((bool) $busyRider->refresh()->is_available);
        $this->assertFalse((bool) $availableRider->refresh()->is_available);
    }

    public function test_riders_with_a_missing_or_stale_location_are_ignored(): void
    {
        [$customer, $restaurant] = $this->createScenario();

        $noLocationRider = $this->createOnlineRider('No Location Rider', null, null);
        $staleRider = $this->createOnlineRider('Stale Rider', 11.5565, 104.9283, [
            'location_updated_at' => now()->subMinutes(RiderMatchingService::ONLINE_STALE_AFTER_MINUTES + 1),
        ]);
        $freshRider = $this->createOnlineRider('Fresh Rider', 12.7000, 105.9000);

        $order = $this->placeDeliveryOrder($customer);
        $this->markOrderStatus($restaurant, $order, 'Preparing')->assertOk();

        $this->markOrderStatus($restaurant, $order, 'Ready')
            ->assertOk()
            ->assertJsonPath('assigned_rider_id', $freshRider->id);

        // The two ineligible riders were not touched.
        $this->assertTrue((bool) $noLocationRider->refresh()->is_available);
        $this->assertTrue((bool) $staleRider->refresh()->is_available);
        $this->assertFalse((bool) $freshRider->refresh()->is_available);
    }

    // -----------------------------------------------------------------
    // Cases 8 & 9: no double-claiming, riders only see their own work
    // -----------------------------------------------------------------

    public function test_two_riders_cannot_claim_the_same_ready_order_from_the_pool(): void
    {
        [$customer, $restaurant] = $this->createScenario();

        $order = $this->placeDeliveryOrder($customer);
        $this->markOrderStatus($restaurant, $order, 'Preparing')->assertOk();
        // No rider online yet, so the ready order stays in the open pool.
        $this->markOrderStatus($restaurant, $order, 'Ready')
            ->assertOk()
            ->assertJsonPath('assigned_rider_id', null);

        $riderAUser = User::factory()->create(['role' => 'rider', 'status' => 'Active']);
        $riderA = $this->createRiderProfile($riderAUser);

        $riderBUser = User::factory()->create(['role' => 'rider', 'status' => 'Active']);
        $riderB = $this->createRiderProfile($riderBUser);

        // Both riders can see the open request...
        Sanctum::actingAs($riderAUser);
        $this->getJson('/api/driver/orders')
            ->assertOk()
            ->assertJsonCount(1, 'data.available_requests')
            ->assertJsonPath('data.available_requests.0.real_id', $order->id);

        Sanctum::actingAs($riderBUser);
        $this->getJson('/api/driver/orders')->assertOk()->assertJsonCount(1, 'data.available_requests');

        // ...but only the first one wins it.
        Sanctum::actingAs($riderAUser);
        $this->patchJson("/api/driver/orders/{$order->id}/status", ['status' => 'accepted'])->assertOk();

        Sanctum::actingAs($riderBUser);
        $this->patchJson("/api/driver/orders/{$order->id}/status", ['status' => 'accepted'])
            ->assertUnprocessable();

        $this->assertDatabaseHas('deliveries', [
            'order_id' => $order->id,
            'rider_id' => $riderA->id,
            'status' => 'assigned',
        ]);
        $this->assertTrue((bool) $riderB->refresh()->is_available);
        // Claiming the delivery does not move the order out of READY_FOR_PICKUP.
        $this->assertSame(OrderStatuses::READY, $order->refresh()->status);
    }

    public function test_a_rider_cannot_claim_or_see_an_order_that_is_not_ready_for_pickup(): void
    {
        [$customer, $restaurant] = $this->createScenario();

        $order = $this->placeDeliveryOrder($customer);
        $this->markOrderStatus($restaurant, $order, 'Preparing')->assertOk();

        $riderUser = User::factory()->create(['role' => 'rider', 'status' => 'Active']);
        $this->createRiderProfile($riderUser);

        Sanctum::actingAs($riderUser);
        $this->getJson('/api/driver/orders')->assertOk()->assertJsonCount(0, 'data.available_requests');

        $this->patchJson("/api/driver/orders/{$order->id}/status", ['status' => 'accepted'])
            ->assertUnprocessable();

        $this->assertDatabaseHas('deliveries', ['order_id' => $order->id, 'rider_id' => null, 'status' => 'pending']);
    }

    /**
     * A rider giving up a claimed delivery puts it back in the open pool
     * instead of keeping it stuck to them - and the backend must not
     * immediately hand the very same order back to that same rider.
     */
    public function test_a_rider_can_release_a_claimed_delivery_and_is_not_re_assigned_it(): void
    {
        [$customer, $restaurant] = $this->createScenario();

        $order = $this->placeDeliveryOrder($customer);
        $this->markOrderStatus($restaurant, $order, 'Preparing')->assertOk();
        // No rider online yet, so the ready order waits in the open pool.
        $this->markOrderStatus($restaurant, $order, 'Ready')->assertOk();

        $riderUser = User::factory()->create(['role' => 'rider', 'status' => 'Active']);
        $rider = $this->createRiderProfile($riderUser);
        Sanctum::actingAs($riderUser);

        $this->patchJson("/api/driver/orders/{$order->id}/status", ['status' => 'accepted'])->assertOk();
        $this->assertFalse((bool) $rider->refresh()->is_available);

        $this->patchJson("/api/driver/orders/{$order->id}/status", ['status' => 'cancelled'])->assertOk();

        // Freed up, delivery back in the pool, and NOT handed straight back.
        $this->assertTrue((bool) $rider->refresh()->is_available);
        $this->assertDatabaseHas('deliveries', [
            'order_id' => $order->id,
            'rider_id' => null,
            'status' => 'pending',
        ]);
        $this->assertSame(OrderStatuses::READY, $order->refresh()->status);
    }

    public function test_finishing_a_delivery_lets_the_rider_pick_up_another_waiting_ready_order(): void
    {
        [$customerA, $restaurantA] = $this->createScenario();
        $firstOrder = $this->placeDeliveryOrder($customerA);
        $this->markOrderStatus($restaurantA, $firstOrder, 'Preparing')->assertOk();
        // No rider online yet: the order waits in the open pool.
        $this->markOrderStatus($restaurantA, $firstOrder, 'Ready')->assertOk();

        $riderUser = User::factory()->create(['role' => 'rider', 'status' => 'Active']);
        $rider = $this->createRiderProfile($riderUser);
        Sanctum::actingAs($riderUser);
        $this->patchJson("/api/driver/orders/{$firstOrder->id}/status", ['status' => 'accepted'])->assertOk();

        // A second order becomes ready while this rider is busy - nobody else
        // is online, so it also waits in the pool.
        [$customerB, $restaurantB] = $this->createScenario();
        $secondOrder = $this->placeDeliveryOrder($customerB);
        $this->markOrderStatus($restaurantB, $secondOrder, 'Preparing')->assertOk();
        $this->markOrderStatus($restaurantB, $secondOrder, 'Ready')
            ->assertOk()
            ->assertJsonPath('assigned_rider_id', null);

        // Completing the first delivery frees the rider, which immediately
        // matches them to the waiting ready order.
        Sanctum::actingAs($riderUser);
        $deliveryId = $firstOrder->refresh()->delivery->id;
        $this->postJson("/api/rider/deliveries/{$deliveryId}/pickup")->assertOk();
        $this->postJson("/api/rider/deliveries/{$deliveryId}/start")->assertOk();
        $this->postJson("/api/rider/deliveries/{$deliveryId}/deliver")->assertOk();

        $this->assertDatabaseHas('deliveries', [
            'order_id' => $secondOrder->id,
            'rider_id' => $rider->id,
            'status' => 'assigned',
        ]);
        $this->assertFalse((bool) $rider->refresh()->is_available);
    }

    public function test_a_rider_only_sees_deliveries_assigned_to_their_own_account(): void
    {
        $riderA = $this->createOnlineRider('Rider A', self::RESTAURANT_LAT, self::RESTAURANT_LNG);

        [$customerA, $restaurantA] = $this->createScenario();
        $orderA = $this->placeDeliveryOrder($customerA);
        $this->markOrderStatus($restaurantA, $orderA, 'Preparing')->assertOk();
        $this->markOrderStatus($restaurantA, $orderA, 'Ready')->assertOk();

        // Rider A is busy now, so the second order can only go to rider B.
        $riderB = $this->createOnlineRider('Rider B', self::RESTAURANT_LAT, self::RESTAURANT_LNG);

        [$customerB, $restaurantB] = $this->createScenario();
        $orderB = $this->placeDeliveryOrder($customerB);
        $this->markOrderStatus($restaurantB, $orderB, 'Preparing')->assertOk();
        $this->markOrderStatus($restaurantB, $orderB, 'Ready')->assertOk();

        $deliveryB = $orderB->refresh()->delivery;

        Sanctum::actingAs($riderA->user);
        $this->getJson('/api/rider/deliveries')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.order_id', $orderA->id);
        // Rider B's delivery is invisible (404), not just hidden in the list.
        $this->getJson("/api/rider/deliveries/{$deliveryB->id}")->assertNotFound();
        $this->getJson('/api/driver/orders')->assertOk()->assertJsonPath('data.active_order.real_id', $orderA->id);

        Sanctum::actingAs($riderB->user);
        $this->getJson('/api/driver/orders')->assertOk()->assertJsonPath('data.active_order.real_id', $orderB->id);
        $this->assertDatabaseHas('deliveries', ['order_id' => $orderB->id, 'rider_id' => $riderB->id, 'status' => 'assigned']);
    }

    public function test_two_orders_marked_ready_back_to_back_do_not_double_book_the_only_rider(): void
    {
        Notification::fake();

        $rider = $this->createOnlineRider('Only Rider', self::RESTAURANT_LAT, self::RESTAURANT_LNG);

        [$customerA, $restaurantA] = $this->createScenario();
        $orderA = $this->placeDeliveryOrder($customerA);

        [$customerB, $restaurantB] = $this->createScenario();
        $orderB = $this->placeDeliveryOrder($customerB);

        foreach ([[$restaurantA, $orderA], [$restaurantB, $orderB]] as [$restaurant, $order]) {
            $this->markOrderStatus($restaurant, $order, 'Preparing')->assertOk();
            $this->markOrderStatus($restaurant, $order, 'Ready')->assertOk();
        }

        // Exactly one order got the rider - never both.
        $this->assertSame(1, Delivery::where('rider_id', $rider->id)->count());
        $this->assertFalse((bool) $rider->refresh()->is_available);

        // The losing order is still READY_FOR_PICKUP waiting for a rider.
        $waiting = Order::with('delivery')
            ->whereIn('id', [$orderA->id, $orderB->id])
            ->get()
            ->first(fn (Order $order) => $order->delivery?->rider_id === null);

        $this->assertNotNull($waiting);
        $this->assertSame(OrderStatuses::READY, $waiting->status);
        $this->assertSame('pending', $waiting->delivery->status);
    }

    // -----------------------------------------------------------------
    // Manual assignment (restaurant/admin) obeys the same rules
    // -----------------------------------------------------------------

    public function test_manual_assignment_is_rejected_until_the_order_is_ready_for_pickup(): void
    {
        [$customer, $restaurant] = $this->createScenario();
        $rider = $this->createOnlineRider('Rider', self::RESTAURANT_LAT, self::RESTAURANT_LNG);

        $order = $this->placeDeliveryOrder($customer);
        $this->markOrderStatus($restaurant, $order, 'Preparing')->assertOk();

        Sanctum::actingAs($restaurant->user);
        $this->postJson("/api/orders/{$order->id}/assign-rider", ['rider_id' => $rider->id])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['status']);

        $this->assertDatabaseHas('deliveries', ['order_id' => $order->id, 'rider_id' => null, 'status' => 'pending']);
        $this->assertTrue((bool) $rider->refresh()->is_available);
    }

    public function test_manual_assignment_requires_an_eligible_rider_and_then_marks_the_rider_busy(): void
    {
        Notification::fake();

        [$customer, $restaurant] = $this->createScenario();

        // Ineligible on purpose: offline, no location fix at all.
        $offlineRiderUser = User::factory()->create(['role' => 'rider']);
        $offlineRider = $this->createRiderProfile($offlineRiderUser, [
            'is_online' => false,
            'current_latitude' => null,
            'current_longitude' => null,
            'location_updated_at' => null,
        ]);

        $order = $this->placeDeliveryOrder($customer);
        $this->markOrderStatus($restaurant, $order, 'Preparing')->assertOk();
        $this->markOrderStatus($restaurant, $order, 'Ready')->assertOk();

        Sanctum::actingAs($restaurant->user);
        $this->postJson("/api/orders/{$order->id}/assign-rider", ['rider_id' => $offlineRider->id])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['rider_id']);

        // An eligible rider is accepted and becomes busy immediately.
        $eligibleRider = $this->createOnlineRider('Eligible Rider', self::RESTAURANT_LAT, self::RESTAURANT_LNG);

        $this->postJson("/api/orders/{$order->id}/assign-rider", ['rider_id' => $eligibleRider->id])
            ->assertOk()
            ->assertJsonPath('rider_id', $eligibleRider->id)
            ->assertJsonPath('data.delivery.status', 'assigned');

        $this->assertFalse((bool) $eligibleRider->refresh()->is_available);
        Notification::assertSentTo($eligibleRider->user, DeliveryAssignedNotification::class);

        // A second rider can never be attached to the same order.
        $otherRider = $this->createOnlineRider('Other Rider', self::RESTAURANT_LAT, self::RESTAURANT_LNG);
        $this->postJson("/api/orders/{$order->id}/assign-rider", ['rider_id' => $otherRider->id])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['rider_id']);
    }

    public function test_driver_dashboard_order_payload_includes_restaurant_and_dropoff_coordinates(): void
    {
        [$customer, $restaurant] = $this->createScenario();

        $order = $this->placeDeliveryOrder($customer);
        $this->markOrderStatus($restaurant, $order, 'Preparing')->assertOk();
        $this->markOrderStatus($restaurant, $order, 'Ready')->assertOk();

        $riderUser = User::factory()->create(['role' => 'rider', 'status' => 'Active']);
        $this->createRiderProfile($riderUser);
        Sanctum::actingAs($riderUser);
        $this->patchJson("/api/driver/orders/{$order->id}/status", ['status' => 'accepted'])->assertOk();

        $this->getJson('/api/driver/orders')
            ->assertOk()
            ->assertJsonPath('data.active_order.real_id', $order->id)
            ->assertJsonPath('data.active_order.restaurant_lat', self::RESTAURANT_LAT)
            ->assertJsonPath('data.active_order.restaurant_lng', self::RESTAURANT_LNG)
            ->assertJsonPath('data.active_order.dropoff_lat', self::ADDRESS_LAT)
            ->assertJsonPath('data.active_order.dropoff_lng', self::ADDRESS_LNG);
    }

    /**
     * Identity always resolves per Sanctum token, never by device/session:
     * three rider accounts exercised from the same test client are still
     * three distinct riders.
     */
    public function test_multiple_rider_accounts_are_identified_by_their_own_authenticated_token_not_by_device(): void
    {
        $riderAUser = User::factory()->create(['role' => 'rider']);
        $riderA = $this->createRiderProfile($riderAUser);

        $riderBUser = User::factory()->create(['role' => 'rider']);
        $riderB = $this->createRiderProfile($riderBUser);

        Sanctum::actingAs($riderAUser);
        $this->putJson('/api/rider/location', ['latitude' => 11.1111, 'longitude' => 104.1111])->assertOk();
        $this->putJson('/api/rider/online-status', ['is_online' => true])->assertOk();

        Sanctum::actingAs($riderBUser);
        $this->putJson('/api/rider/location', ['latitude' => 22.2222, 'longitude' => 104.2222])->assertOk();
        $this->putJson('/api/rider/online-status', ['is_online' => false])->assertOk();

        $this->assertDatabaseHas('riders', [
            'id' => $riderA->id,
            'current_latitude' => 11.1111,
            'current_longitude' => 104.1111,
            'is_online' => true,
        ]);
        $this->assertDatabaseHas('riders', [
            'id' => $riderB->id,
            'current_latitude' => 22.2222,
            'current_longitude' => 104.2222,
            'is_online' => false,
        ]);
    }

    // -----------------------------------------------------------------
    // Helpers
    // -----------------------------------------------------------------

    /**
     * A geocoded restaurant with food on the menu, plus a customer with one
     * of those dishes already in their cart, ready to check out.
     *
     * @return array{0: User, 1: Restaurant}
     */
    private function createScenario(bool $geocodeRestaurant = true): array
    {
        $restaurant = $this->createRestaurant($geocodeRestaurant);
        $customer = User::factory()->create(['role' => 'customer']);

        $cart = Cart::create(['user_id' => $customer->id]);
        CartItem::create([
            'cart_id' => $cart->id,
            'food_id' => $this->createFood($restaurant)->id,
            'quantity' => 1,
        ]);

        return [$customer, $restaurant];
    }

    /**
     * Places a real delivery order through the customer API. The order is
     * PENDING_RESTAURANT with an unassigned delivery - no rider yet.
     */
    private function placeDeliveryOrder(User $customer): Order
    {
        Sanctum::actingAs($customer);

        $address = Address::create([...$this->addressData(), 'user_id' => $customer->id]);

        $orderId = $this->postJson('/api/orders', [
            'address_id' => $address->id,
            'order_type' => 'delivery',
            'payment_method' => 'cash',
        ])
            ->assertCreated()
            ->json('data.id');

        return Order::findOrFail($orderId);
    }

    /**
     * PATCHes an order's status as the restaurant owner - exactly what the
     * restaurant dashboard's Accept / Mark Preparing / Mark Ready / Reject
     * buttons do.
     */
    private function markOrderStatus(Restaurant $restaurant, Order $order, string $status): \Illuminate\Testing\TestResponse
    {
        Sanctum::actingAs($restaurant->user);

        return $this->patchJson("/api/restaurant/orders/{$order->id}/status", ['status' => $status]);
    }

    /**
     * @param  array<string, mixed>  $overrides
     */
    private function createOnlineRider(string $name, ?float $lat, ?float $lng, array $overrides = []): Rider
    {
        $user = User::factory()->create(['role' => 'rider', 'name' => $name]);

        return $this->createRiderProfile($user, [
            'current_latitude' => $lat,
            'current_longitude' => $lng,
            'location_updated_at' => $lat === null ? null : now(),
            ...$overrides,
        ]);
    }

    /**
     * @param  array<string, mixed>  $overrides
     */
    private function createRiderProfile(User $user, array $overrides = []): Rider
    {
        return Rider::create([
            'user_id' => $user->id,
            'vehicle_type' => 'motorcycle',
            'vehicle_number' => 'AB-' . random_int(1000, 9999),
            'phone' => '012345678',
            'status' => 'active',
            'is_available' => true,
            'is_online' => true,
            'current_latitude' => self::RESTAURANT_LAT,
            'current_longitude' => self::RESTAURANT_LNG,
            'location_updated_at' => now(),
            ...$overrides,
        ]);
    }

    private function createRestaurant(bool $geocode = true): Restaurant
    {
        return Restaurant::create([
            'user_id' => User::factory()->create(['role' => 'restaurant'])->id,
            'name' => 'City Bites',
            'description' => 'Simple local food.',
            'address' => '100 Main Road',
            'latitude' => $geocode ? self::RESTAURANT_LAT : null,
            'longitude' => $geocode ? self::RESTAURANT_LNG : null,
            'phone' => '012345678',
            'image' => null,
            'status' => 'active',
        ]);
    }

    private function createFood(Restaurant $restaurant): Food
    {
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
}
