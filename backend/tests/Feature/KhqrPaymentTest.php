<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\Payment;
use App\Models\Rider;
use App\Models\Restaurant;
use App\Models\User;
use App\Notifications\DeliveryAssignedNotification;
use App\Notifications\OrderPaidNotification;
use App\Support\PaymentStatuses;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Notification;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class KhqrPaymentTest extends TestCase
{
    use RefreshDatabase;

    public function test_customer_can_create_a_khqr_payment_for_their_order(): void
    {
        // KHQR generation is offline (no HTTP call) - only verification
        // talks to the network, so no Http::fake() is needed here at all.
        $user = User::factory()->create();
        Sanctum::actingAs($user);
        $order = $this->createOrderForUser($user, 12.50);

        $response = $this->postJson('/api/payments/khqr', ['order_id' => $order->id])
            ->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.status', PaymentStatuses::PENDING)
            ->assertJsonPath('data.amount', 12.5)
            ->assertJsonPath('data.currency', 'USD')
            ->assertJsonPath('data.provider', 'bakong');

        $this->assertNotEmpty($response->json('data.qr_string'));
        $this->assertDatabaseHas('payments', [
            'order_id' => $order->id,
            'provider' => 'bakong',
            'status' => PaymentStatuses::PENDING,
        ]);
        $this->assertSame(PaymentStatuses::PENDING, $order->fresh()->payment_status);
        $this->assertSame('khqr', $order->fresh()->payment_method);
    }

    public function test_payment_stays_pending_when_bakong_has_not_seen_the_transaction_yet(): void
    {
        [$user, $order, $payment] = $this->createPendingPayment();
        Http::fake([
            '*check_transaction_by_md5*' => Http::response([
                'data' => null,
                'errorCode' => 1,
                'responseCode' => 1,
                'responseMessage' => 'Transaction could not be found. Please check and try again.',
            ]),
        ]);

        Sanctum::actingAs($user);
        $this->getJson("/api/payments/{$payment->id}")
            ->assertOk()
            ->assertJsonPath('data.status', PaymentStatuses::PENDING);

        $this->assertSame(PaymentStatuses::PENDING, $payment->fresh()->status);
        $this->assertSame(PaymentStatuses::PENDING, $order->fresh()->payment_status);
    }

    public function test_successful_bakong_verification_marks_payment_and_order_paid(): void
    {
        [$user, $order, $payment] = $this->createPendingPayment(amount: 12.50);
        Http::fake([
            '*check_transaction_by_md5*' => Http::response([
                'responseCode' => 0,
                'responseMessage' => 'Getting transaction successfully.',
                'data' => [
                    'hash' => 'abc123hash',
                    'fromAccountId' => 'customer@bank',
                    'toAccountId' => 'merchant_test@devb',
                    'currency' => 'USD',
                    'amount' => 12.50,
                    'description' => 'test',
                ],
            ]),
        ]);

        Sanctum::actingAs($user);
        $this->getJson("/api/payments/{$payment->id}")
            ->assertOk()
            ->assertJsonPath('data.status', PaymentStatuses::PAID);

        $payment->refresh();
        $this->assertSame(PaymentStatuses::PAID, $payment->status);
        $this->assertSame('abc123hash', $payment->bakong_transaction_hash);
        $this->assertNotNull($payment->paid_at);
        $this->assertSame(PaymentStatuses::PAID, $order->fresh()->payment_status);
    }

    public function test_verified_khqr_payment_hands_the_order_to_the_restaurant_and_never_to_a_rider(): void
    {
        Notification::fake();

        [$user, $restaurantOwner, $riderUser, $rider, $order, $delivery, $payment] = $this->createKhqrDeliveryScenario();

        $this->assertNull($delivery->fresh()->rider_id);
        $this->assertTrue((bool) $rider->fresh()->is_available);

        Http::fake([
            '*check_transaction_by_md5*' => Http::response([
                'responseCode' => 0,
                'responseMessage' => 'ok',
                'data' => [
                    'hash' => 'dispatch-hash',
                    'fromAccountId' => 'customer@bank',
                    'toAccountId' => 'merchant_test@devb',
                    'currency' => 'USD',
                    'amount' => 12.50,
                ],
            ]),
        ]);

        Sanctum::actingAs($user);
        $this->getJson("/api/payments/{$payment->id}")
            ->assertOk()
            ->assertJsonPath('data.status', PaymentStatuses::PAID);

        // Payment confirmed -> PENDING_RESTAURANT. Rider matching must NOT run
        // here: a rider may only be assigned once the restaurant has accepted,
        // prepared and marked the order READY_FOR_PICKUP.
        $this->assertSame('pending', $order->fresh()->status);
        $this->assertNull($delivery->fresh()->rider_id);
        $this->assertSame('pending', $delivery->fresh()->status);
        $this->assertTrue((bool) $rider->fresh()->is_available);

        Notification::assertSentTo($restaurantOwner, OrderPaidNotification::class);
        Notification::assertNotSentTo($riderUser, DeliveryAssignedNotification::class);
    }

    public function test_paid_khqr_delivery_order_reaches_a_rider_only_after_the_restaurant_marks_it_ready(): void
    {
        Notification::fake();

        [$user, $restaurantOwner, $riderUser, $rider, $order, $delivery, $payment] = $this->createKhqrDeliveryScenario();

        Http::fake([
            '*check_transaction_by_md5*' => Http::response([
                'responseCode' => 0,
                'responseMessage' => 'ok',
                'data' => [
                    'hash' => 'ready-hash',
                    'fromAccountId' => 'customer@bank',
                    'toAccountId' => 'merchant_test@devb',
                    'currency' => 'USD',
                    'amount' => 12.50,
                ],
            ]),
        ]);

        Sanctum::actingAs($user);
        $this->getJson("/api/payments/{$payment->id}")
            ->assertOk()
            ->assertJsonPath('data.status', PaymentStatuses::PAID);
        $this->assertNull($delivery->fresh()->rider_id);

        // The restaurant accepts -> prepares -> marks it ready. Only now does
        // the nearest eligible rider get the delivery.
        Sanctum::actingAs($restaurantOwner);
        $this->patchJson("/api/restaurant/orders/{$order->id}/status", ['status' => 'Preparing'])->assertOk();
        $this->patchJson("/api/restaurant/orders/{$order->id}/status", ['status' => 'Ready'])
            ->assertOk()
            ->assertJsonPath('assigned_rider_id', $rider->id);

        $this->assertSame($rider->id, $delivery->fresh()->rider_id);
        $this->assertSame('assigned', $delivery->fresh()->status);
        // The order stays READY_FOR_PICKUP until the rider collects the food.
        $this->assertSame('ready', $order->fresh()->status);
        $this->assertFalse((bool) $rider->fresh()->is_available);

        Notification::assertSentTo($riderUser, DeliveryAssignedNotification::class);
    }

    public function test_pickup_order_payment_notifies_the_restaurant_owner_but_no_rider(): void
    {
        Notification::fake();

        $user = User::factory()->create();
        $restaurantOwner = User::factory()->create(['role' => 'restaurant']);
        $restaurant = Restaurant::create([
            'user_id' => $restaurantOwner->id,
            'name' => 'Pickup Restaurant',
            'address' => '1 Street',
            'phone' => '012345678',
            'status' => 'active',
        ]);
        $order = Order::create([
            'user_id' => $user->id,
            'restaurant_id' => $restaurant->id,
            'status' => 'pending',
            'order_type' => 'pickup',
            'subtotal' => 6.00,
            'delivery_fee' => 0,
            'total' => 6.00,
            'total_price' => 6.00,
            'payment_method' => 'khqr',
            'payment_status' => PaymentStatuses::PENDING,
        ]);
        $payment = Payment::create([
            'order_id' => $order->id,
            'payment_method' => 'khqr',
            'provider' => 'bakong',
            'amount' => 6.00,
            'currency' => 'USD',
            'status' => PaymentStatuses::PENDING,
            'qr_string' => '00020101021129190015merchant_test@devb...test',
            'md5' => 'pickup-md5',
            'expires_at' => now()->addMinutes(15),
        ]);

        Http::fake([
            '*check_transaction_by_md5*' => Http::response([
                'responseCode' => 0,
                'responseMessage' => 'ok',
                'data' => [
                    'hash' => 'pickup-hash',
                    'fromAccountId' => 'customer@bank',
                    'toAccountId' => 'merchant_test@devb',
                    'currency' => 'USD',
                    'amount' => 6.00,
                ],
            ]),
        ]);

        Sanctum::actingAs($user);
        $this->getJson("/api/payments/{$payment->id}")
            ->assertOk()
            ->assertJsonPath('data.status', PaymentStatuses::PAID);

        Notification::assertSentTo($restaurantOwner, OrderPaidNotification::class);
        // Pickup orders never have a delivery/rider, so nothing else should
        // have gone out - just the one owner notification.
        Notification::assertCount(1);
    }

    public function test_failed_bakong_verification_marks_payment_failed(): void
    {
        [$user, $order, $payment] = $this->createPendingPayment();
        Http::fake([
            '*check_transaction_by_md5*' => Http::response([
                'data' => null,
                'errorCode' => 3,
                'responseCode' => 1,
                'responseMessage' => 'Transaction failed.',
            ]),
        ]);

        Sanctum::actingAs($user);
        $this->getJson("/api/payments/{$payment->id}")
            ->assertOk()
            ->assertJsonPath('data.status', PaymentStatuses::FAILED);

        $this->assertSame(PaymentStatuses::FAILED, $payment->fresh()->status);
        $this->assertSame(PaymentStatuses::FAILED, $order->fresh()->payment_status);
    }

    public function test_malformed_bakong_response_is_handled_without_crashing_or_marking_paid(): void
    {
        [$user, , $payment] = $this->createPendingPayment();
        Http::fake([
            // No responseCode/data at all - simulates an invalid/unexpected
            // body for this md5 lookup rather than a well-formed failure.
            '*check_transaction_by_md5*' => Http::response(['unexpected' => 'shape'], 200),
        ]);

        Sanctum::actingAs($user);
        $this->getJson("/api/payments/{$payment->id}")
            ->assertOk()
            ->assertJsonPath('data.status', PaymentStatuses::PENDING);

        $this->assertSame(PaymentStatuses::PENDING, $payment->fresh()->status);
    }

    public function test_bakong_daily_quota_exhaustion_surfaces_a_notice_without_failing_the_payment(): void
    {
        // Reproduces the real incident this was diagnosed from: Bakong's
        // Open API for Developers token enforces its own daily request
        // quota, independent of anything wrong with this specific
        // transaction. The payment must stay pending (the real status is
        // still unknown, not negative) while the customer gets a reason
        // instead of a silent, unexplained spinner.
        [$user, , $payment] = $this->createPendingPayment();
        Http::fake([
            '*check_transaction_by_md5*' => Http::response([
                'responseCode' => 1,
                'responseMessage' => 'Daily request limit of 100 exceeded. Please try again tomorrow.',
                'errorCode' => 17,
                'data' => null,
            ], 200),
        ]);

        Sanctum::actingAs($user);
        $this->getJson("/api/payments/{$payment->id}")
            ->assertOk()
            ->assertJsonPath('data.status', PaymentStatuses::PENDING)
            ->assertJsonPath('data.verification_notice', 'Daily request limit of 100 exceeded. Please try again tomorrow.');

        $this->assertSame(PaymentStatuses::PENDING, $payment->fresh()->status);
    }

    public function test_verification_is_idempotent_and_only_paid_once(): void
    {
        [$user, , $payment] = $this->createPendingPayment(amount: 5.00);
        Http::fake([
            '*check_transaction_by_md5*' => Http::response([
                'responseCode' => 0,
                'responseMessage' => 'ok',
                'data' => [
                    'hash' => 'dup-hash-1',
                    'fromAccountId' => 'customer@bank',
                    'toAccountId' => 'merchant_test@devb',
                    'currency' => 'USD',
                    'amount' => 5.00,
                ],
            ]),
        ]);

        Sanctum::actingAs($user);
        $this->getJson("/api/payments/{$payment->id}")->assertOk()->assertJsonPath('data.status', PaymentStatuses::PAID);
        $firstPaidAt = $payment->fresh()->paid_at;

        // Second poll after it's already paid must be a pure read - no
        // second Bakong call, and no change to when it was paid.
        $this->getJson("/api/payments/{$payment->id}")->assertOk()->assertJsonPath('data.status', PaymentStatuses::PAID);

        $this->assertSame($firstPaidAt->toIso8601String(), $payment->fresh()->paid_at->toIso8601String());
        Http::assertSentCount(1);
    }

    public function test_same_bakong_transaction_cannot_pay_two_different_orders(): void
    {
        $user = User::factory()->create();
        $orderA = $this->createOrderForUser($user, 8.00);
        $orderB = $this->createOrderForUser($user, 8.00);

        Payment::create([
            'order_id' => $orderA->id,
            'payment_method' => 'khqr',
            'provider' => 'bakong',
            'amount' => 8.00,
            'currency' => 'USD',
            'status' => PaymentStatuses::PAID,
            'md5' => 'md5-a',
            'bakong_transaction_hash' => 'shared-hash',
            'paid_at' => now(),
        ]);
        $orderA->update(['payment_status' => PaymentStatuses::PAID]);

        $paymentB = Payment::create([
            'order_id' => $orderB->id,
            'payment_method' => 'khqr',
            'provider' => 'bakong',
            'amount' => 8.00,
            'currency' => 'USD',
            'status' => PaymentStatuses::PENDING,
            'md5' => 'md5-b',
            'expires_at' => now()->addMinutes(15),
        ]);

        Http::fake([
            '*check_transaction_by_md5*' => Http::response([
                'responseCode' => 0,
                'responseMessage' => 'ok',
                'data' => [
                    // Same real-world Bakong transaction hash as order A's
                    // already-paid payment - must NOT be allowed to pay B too.
                    'hash' => 'shared-hash',
                    'fromAccountId' => 'customer@bank',
                    'toAccountId' => 'merchant_test@devb',
                    'currency' => 'USD',
                    'amount' => 8.00,
                ],
            ]),
        ]);

        Sanctum::actingAs($user);
        $this->getJson("/api/payments/{$paymentB->id}")
            ->assertOk()
            ->assertJsonPath('data.status', PaymentStatuses::FAILED);

        $this->assertSame(PaymentStatuses::FAILED, $paymentB->fresh()->status);
        $this->assertSame(PaymentStatuses::PAID, $orderA->fresh()->payment_status);
    }

    public function test_amount_or_currency_mismatch_is_rejected_even_if_bakong_reports_success(): void
    {
        [$user, , $payment] = $this->createPendingPayment(amount: 20.00);
        Http::fake([
            '*check_transaction_by_md5*' => Http::response([
                'responseCode' => 0,
                'responseMessage' => 'ok',
                'data' => [
                    'hash' => 'mismatch-hash',
                    'fromAccountId' => 'customer@bank',
                    'toAccountId' => 'merchant_test@devb',
                    'currency' => 'USD',
                    'amount' => 1.00,
                ],
            ]),
        ]);

        Sanctum::actingAs($user);
        $this->getJson("/api/payments/{$payment->id}")
            ->assertOk()
            ->assertJsonPath('data.status', PaymentStatuses::FAILED);
    }

    public function test_a_customer_cannot_view_or_pay_for_another_customers_order(): void
    {
        $owner = User::factory()->create();
        $stranger = User::factory()->create();
        $order = $this->createOrderForUser($owner, 9.99);

        Sanctum::actingAs($stranger);
        $this->postJson('/api/payments/khqr', ['order_id' => $order->id])->assertForbidden();

        $payment = Payment::create([
            'order_id' => $order->id,
            'payment_method' => 'khqr',
            'provider' => 'bakong',
            'amount' => 9.99,
            'currency' => 'USD',
            'status' => PaymentStatuses::PENDING,
            'md5' => 'md5-owner',
            'expires_at' => now()->addMinutes(15),
        ]);

        $this->getJson("/api/payments/{$payment->id}")->assertForbidden();
    }

    public function test_cannot_create_a_khqr_payment_for_an_already_paid_order(): void
    {
        $user = User::factory()->create();
        $order = $this->createOrderForUser($user, 15.00);
        $order->update(['payment_status' => PaymentStatuses::PAID]);
        Payment::create([
            'order_id' => $order->id,
            'payment_method' => 'khqr',
            'provider' => 'bakong',
            'amount' => 15.00,
            'currency' => 'USD',
            'status' => PaymentStatuses::PAID,
            'md5' => 'already-paid-md5',
            'paid_at' => now(),
        ]);

        Sanctum::actingAs($user);
        $this->postJson('/api/payments/khqr', ['order_id' => $order->id])->assertStatus(409);

        $this->assertSame(1, Payment::where('order_id', $order->id)->count());
    }

    public function test_repeated_create_calls_reuse_the_active_pending_payment_instead_of_duplicating(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);
        $order = $this->createOrderForUser($user, 7.25);

        $this->postJson('/api/payments/khqr', ['order_id' => $order->id])->assertCreated();
        $this->postJson('/api/payments/khqr', ['order_id' => $order->id])->assertOk();

        $this->assertSame(1, Payment::where('order_id', $order->id)->count());
    }

    public function test_bakong_api_failure_leaves_payment_pending_instead_of_crashing(): void
    {
        [$user, , $payment] = $this->createPendingPayment();
        Http::fake([
            '*check_transaction_by_md5*' => Http::response(['message' => 'Internal Server Error'], 500),
        ]);

        Sanctum::actingAs($user);
        $this->getJson("/api/payments/{$payment->id}")
            ->assertOk()
            ->assertJsonPath('data.status', PaymentStatuses::PENDING);

        $this->assertSame(PaymentStatuses::PENDING, $payment->fresh()->status);
    }

    public function test_missing_bakong_configuration_prevents_khqr_creation_without_crashing(): void
    {
        config(['khqr.bakong_token' => null]);

        $user = User::factory()->create();
        $order = $this->createOrderForUser($user, 10.00);
        Sanctum::actingAs($user);

        $this->postJson('/api/payments/khqr', ['order_id' => $order->id])
            ->assertStatus(500)
            ->assertJsonPath('success', false);

        $this->assertDatabaseMissing('payments', ['order_id' => $order->id]);
    }

    public function test_expired_khqr_payment_is_marked_expired_on_status_check(): void
    {
        [$user, $order, $payment] = $this->createPendingPayment();
        $payment->update(['expires_at' => now()->subMinute()]);

        Http::fake(); // Bakong must not be called at all once expired.

        Sanctum::actingAs($user);
        $this->getJson("/api/payments/{$payment->id}")
            ->assertOk()
            ->assertJsonPath('data.status', PaymentStatuses::EXPIRED);

        Http::assertNothingSent();
        $this->assertSame(PaymentStatuses::EXPIRED, $order->fresh()->payment_status);
    }

    /**
     * @return array{0: User, 1: Order, 2: Payment}
     */
    private function createPendingPayment(float $amount = 10.00): array
    {
        $user = User::factory()->create();
        $order = $this->createOrderForUser($user, $amount);
        $payment = Payment::create([
            'order_id' => $order->id,
            'payment_method' => 'khqr',
            'provider' => 'bakong',
            'amount' => $amount,
            'currency' => 'USD',
            'status' => PaymentStatuses::PENDING,
            'qr_string' => '00020101021129190015merchant_test@devb...test',
            'md5' => md5(uniqid('khqr', true)),
            'expires_at' => now()->addMinutes(15),
        ]);
        $order->update(['payment_status' => PaymentStatuses::PENDING]);

        return [$user, $order, $payment];
    }

    /**
     * A delivery order paid via KHQR (pending payment, geocoded restaurant
     * owned by $restaurantOwner, one eligible rider waiting at the restaurant).
     *
     * @return array{0: User, 1: User, 2: User, 3: Rider, 4: Order, 5: Delivery, 6: Payment}
     */
    private function createKhqrDeliveryScenario(): array
    {
        $user = User::factory()->create();
        $restaurantOwner = User::factory()->create(['role' => 'restaurant']);
        $restaurant = Restaurant::create([
            'user_id' => $restaurantOwner->id,
            'name' => 'Dispatch Restaurant',
            'address' => '1 Street',
            'phone' => '012345678',
            'status' => 'active',
            'latitude' => 11.5564,
            'longitude' => 104.9282,
        ]);
        $address = $user->addresses()->create([
            'label' => 'Home',
            'recipient_name' => $user->name,
            'phone' => '012345678',
            'address' => 'Customer Street',
            'latitude' => 11.5600,
            'longitude' => 104.9300,
            'is_default' => true,
        ]);
        $riderUser = User::factory()->create(['role' => 'rider']);
        $rider = Rider::create([
            'user_id' => $riderUser->id,
            'vehicle_type' => 'bike',
            'vehicle_number' => 'PP-123',
            'phone' => '012345678',
            'status' => 'active',
            'is_available' => true,
            'is_online' => true,
            'current_latitude' => 11.5570,
            'current_longitude' => 104.9290,
            'location_updated_at' => now(),
        ]);
        $order = Order::create([
            'user_id' => $user->id,
            'restaurant_id' => $restaurant->id,
            'address_id' => $address->id,
            'status' => 'pending',
            'order_type' => 'delivery',
            'subtotal' => 12.50,
            'delivery_fee' => 0,
            'total' => 12.50,
            'total_price' => 12.50,
            'payment_method' => 'khqr',
            'payment_status' => PaymentStatuses::PENDING,
        ]);
        $delivery = $order->delivery()->create(['status' => 'pending']);
        $payment = Payment::create([
            'order_id' => $order->id,
            'payment_method' => 'khqr',
            'provider' => 'bakong',
            'amount' => 12.50,
            'currency' => 'USD',
            'status' => PaymentStatuses::PENDING,
            'qr_string' => '00020101021129190015merchant_test@devb...test',
            'md5' => 'dispatch-md5',
            'expires_at' => now()->addMinutes(15),
        ]);

        return [$user, $restaurantOwner, $riderUser, $rider, $order, $delivery, $payment];
    }

    private function createOrderForUser(User $user, float $total): Order
    {
        $restaurant = Restaurant::create([
            'user_id' => User::factory()->create(['role' => 'restaurant'])->id,
            'name' => 'Test Restaurant',
            'address' => '1 Street',
            'phone' => '012345678',
            'status' => 'active',
        ]);

        return Order::create([
            'user_id' => $user->id,
            'restaurant_id' => $restaurant->id,
            'status' => 'pending',
            'subtotal' => $total,
            'delivery_fee' => 0,
            'total' => $total,
            'total_price' => $total,
            'payment_method' => 'khqr',
        ]);
    }
}
