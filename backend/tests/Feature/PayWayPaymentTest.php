<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\Payment;
use App\Models\Restaurant;
use App\Models\User;
use App\Support\PaymentStatuses;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * Covers the ABA PayWay Sandbox flow specifically: generate-qr creation,
 * check-transaction-2 verification, and the public pushback/callback route.
 * Bakong-specific KHQR coverage lives in KhqrPaymentTest.
 */
class PayWayPaymentTest extends TestCase
{
    use RefreshDatabase;

    public function test_creating_a_payway_payment_hashes_and_posts_the_documented_generate_qr_fields(): void
    {
        Http::fake([
            '*generate-qr*' => Http::response([
                'status' => ['code' => '00', 'message' => 'Success!'],
                'qrString' => '00020101021129190015merchant_test@devb...test',
                'qrImage' => 'data:image/png;base64,fake',
                'abapay_deeplink' => 'abamobilepay://payment?tran_id=fake',
            ]),
        ]);

        [$user, $order] = $this->createUserAndOrder(9.90);
        Sanctum::actingAs($user);

        $this->postJson('/api/payments/payway', ['order_id' => $order->id, 'payment_method' => 'khqr'])
            ->assertCreated()
            ->assertJsonPath('data.amount', 9.9)
            ->assertJsonPath('data.currency', 'USD');

        Http::assertSent(function ($request) use ($order) {
            if (! str_contains($request->url(), 'generate-qr')) {
                return false;
            }

            $expectedHash = base64_encode(hash_hmac('sha512',
                $request['req_time'].$request['merchant_id'].$request['tran_id'].$request['amount']
                    .$request['items'].$request['first_name'].$request['last_name'].$request['email']
                    .$request['phone'].$request['purchase_type'].$request['payment_option']
                    .$request['callback_url'].($request['return_deeplink'] ?? '').$request['currency']
                    .$request['custom_fields'].$request['return_params'].($request['payout'] ?? '')
                    .$request['lifetime'].$request['qr_image_template'],
                'payway-test-key', true));

            return $request['merchant_id'] === 'payway-test-merchant'
                && $request['payment_option'] === 'abapay_khqr'
                && $request['amount'] === '9.90'
                && preg_match('/^\d{14}$/', $request['req_time']) === 1
                && $request['hash'] === $expectedHash;
        });

        $this->assertSame(PaymentStatuses::PENDING, $order->fresh()->payment_status);
    }

    public function test_status_check_marks_payway_payment_paid_when_check_transaction_2_reports_approved(): void
    {
        [$user, $order, $payment] = $this->createPendingPayWayPayment(amount: 9.90);
        Http::fake([
            '*check-transaction-2*' => Http::response([
                'status' => ['code' => '00', 'message' => 'success'],
                'data' => [
                    'tran_id' => $payment->provider_transaction_id,
                    'payment_status_code' => 0,
                    'payment_status' => 'APPROVED',
                    'original_amount' => 9.90,
                    'original_currency' => 'USD',
                    'apv' => '123456',
                ],
            ]),
        ]);

        Sanctum::actingAs($user);
        $this->getJson("/api/payments/{$payment->id}")
            ->assertOk()
            ->assertJsonPath('data.status', PaymentStatuses::PAID);

        $this->assertSame(PaymentStatuses::PAID, $payment->fresh()->status);
        $this->assertSame(PaymentStatuses::PAID, $order->fresh()->payment_status);
        $this->assertNotNull($payment->fresh()->paid_at);
    }

    public function test_status_check_leaves_payment_pending_while_check_transaction_2_reports_pending(): void
    {
        [$user, , $payment] = $this->createPendingPayWayPayment();
        Http::fake([
            '*check-transaction-2*' => Http::response([
                'status' => ['code' => '00', 'message' => 'success'],
                'data' => ['payment_status_code' => 2, 'payment_status' => 'PENDING'],
            ]),
        ]);

        Sanctum::actingAs($user);
        $this->getJson("/api/payments/{$payment->id}")
            ->assertOk()
            ->assertJsonPath('data.status', PaymentStatuses::PENDING);

        $this->assertSame(PaymentStatuses::PENDING, $payment->fresh()->status);
    }

    public function test_status_check_marks_payway_payment_failed_when_declined(): void
    {
        [$user, $order, $payment] = $this->createPendingPayWayPayment();
        Http::fake([
            '*check-transaction-2*' => Http::response([
                'status' => ['code' => '00', 'message' => 'success'],
                'data' => ['payment_status_code' => 3, 'payment_status' => 'DECLINED'],
            ]),
        ]);

        Sanctum::actingAs($user);
        $this->getJson("/api/payments/{$payment->id}")
            ->assertOk()
            ->assertJsonPath('data.status', PaymentStatuses::FAILED);

        $this->assertSame(PaymentStatuses::FAILED, $order->fresh()->payment_status);
    }

    public function test_status_check_marks_payway_payment_failed_when_cancelled(): void
    {
        [, , $payment] = $this->createPendingPayWayPayment();
        Http::fake([
            '*check-transaction-2*' => Http::response([
                'status' => ['code' => '00', 'message' => 'success'],
                'data' => ['payment_status_code' => 7, 'payment_status' => 'CANCELLED'],
            ]),
        ]);

        Sanctum::actingAs($this->reloadOwner($payment));
        $this->getJson("/api/payments/{$payment->id}")
            ->assertOk()
            ->assertJsonPath('data.status', PaymentStatuses::FAILED);
    }

    public function test_amount_mismatch_from_payway_is_rejected_even_when_status_is_approved(): void
    {
        [$user, $order, $payment] = $this->createPendingPayWayPayment(amount: 20.00);
        Http::fake([
            '*check-transaction-2*' => Http::response([
                'status' => ['code' => '00', 'message' => 'success'],
                'data' => [
                    'payment_status_code' => 0,
                    'payment_status' => 'APPROVED',
                    'original_amount' => 1.00,
                    'original_currency' => 'USD',
                ],
            ]),
        ]);

        Sanctum::actingAs($user);
        $this->getJson("/api/payments/{$payment->id}")
            ->assertOk()
            ->assertJsonPath('data.status', PaymentStatuses::FAILED);

        $this->assertSame(PaymentStatuses::FAILED, $order->fresh()->payment_status);
    }

    public function test_callback_triggers_server_side_verification_instead_of_trusting_the_payload(): void
    {
        [, $order, $payment] = $this->createPendingPayWayPayment(amount: 5.00);
        Http::fake([
            // The callback body itself claims success, but only the
            // authoritative check-transaction-2 call may confirm payment.
            '*check-transaction-2*' => Http::response([
                'status' => ['code' => '00', 'message' => 'success'],
                'data' => [
                    'payment_status_code' => 0,
                    'payment_status' => 'APPROVED',
                    'original_amount' => 5.00,
                    'original_currency' => 'USD',
                ],
            ]),
        ]);

        $this->postJson('/api/payments/payway/callback', [
            'tran_id' => $payment->provider_transaction_id,
            'apv' => '654321',
            'status' => '0',
        ])->assertOk()->assertJsonPath('data.status', PaymentStatuses::PAID);

        Http::assertSent(fn ($request) => str_contains($request->url(), 'check-transaction-2'));
        $this->assertSame(PaymentStatuses::PAID, $order->fresh()->payment_status);
    }

    public function test_duplicate_callback_is_idempotent(): void
    {
        [, $order, $payment] = $this->createPendingPayWayPayment(amount: 5.00);
        Http::fake([
            '*check-transaction-2*' => Http::response([
                'status' => ['code' => '00', 'message' => 'success'],
                'data' => [
                    'payment_status_code' => 0,
                    'payment_status' => 'APPROVED',
                    'original_amount' => 5.00,
                    'original_currency' => 'USD',
                ],
            ]),
        ]);

        $callback = ['tran_id' => $payment->provider_transaction_id, 'apv' => '654321', 'status' => '0'];

        $this->postJson('/api/payments/payway/callback', $callback)->assertOk();
        $firstPaidAt = $payment->fresh()->paid_at;

        $this->postJson('/api/payments/payway/callback', $callback)
            ->assertOk()
            ->assertJsonPath('data.status', PaymentStatuses::PAID);

        $this->assertSame($firstPaidAt->toIso8601String(), $payment->fresh()->paid_at->toIso8601String());
        $this->assertSame(PaymentStatuses::PAID, $order->fresh()->payment_status);
    }

    public function test_callback_for_unknown_transaction_id_is_rejected(): void
    {
        $this->postJson('/api/payments/payway/callback', ['tran_id' => 'does-not-exist'])
            ->assertNotFound();
    }

    public function test_cannot_create_a_payway_payment_for_an_already_paid_order(): void
    {
        [$user, $order] = $this->createUserAndOrder(15.00);
        $order->update(['payment_status' => PaymentStatuses::PAID]);
        Payment::create([
            'order_id' => $order->id,
            'payment_method' => 'khqr',
            'provider' => 'payway',
            'provider_transaction_id' => 'ALREADY-PAID',
            'amount' => 15.00,
            'currency' => 'USD',
            'status' => PaymentStatuses::PAID,
            'paid_at' => now(),
        ]);

        Sanctum::actingAs($user);
        $this->postJson('/api/payments/payway', ['order_id' => $order->id])->assertStatus(409);
    }

    /**
     * @return array{0: User, 1: Order}
     */
    private function createUserAndOrder(float $total): array
    {
        $user = User::factory()->create();
        $restaurant = Restaurant::create([
            'user_id' => User::factory()->create(['role' => 'restaurant'])->id,
            'name' => 'Test Restaurant',
            'address' => '1 Street',
            'phone' => '012345678',
            'status' => 'active',
        ]);

        $order = Order::create([
            'user_id' => $user->id,
            'restaurant_id' => $restaurant->id,
            'status' => 'pending',
            'subtotal' => $total,
            'delivery_fee' => 0,
            'total' => $total,
            'total_price' => $total,
            'payment_method' => 'khqr',
        ]);

        return [$user, $order];
    }

    /**
     * @return array{0: User, 1: Order, 2: Payment}
     */
    private function createPendingPayWayPayment(float $amount = 9.90): array
    {
        [$user, $order] = $this->createUserAndOrder($amount);
        $payment = Payment::create([
            'order_id' => $order->id,
            'payment_method' => 'khqr',
            'provider' => 'payway',
            'provider_transaction_id' => 'O'.$order->id.'K'.now('UTC')->format('His'),
            'amount' => $amount,
            'currency' => 'USD',
            'status' => PaymentStatuses::PENDING,
            'qr_string' => '00020101021129190015merchant_test@devb...test',
            'expires_at' => now()->addMinutes(15),
        ]);
        $order->update(['payment_status' => PaymentStatuses::PENDING]);

        return [$user, $order, $payment];
    }

    private function reloadOwner(Payment $payment): User
    {
        return $payment->order->user;
    }
}
