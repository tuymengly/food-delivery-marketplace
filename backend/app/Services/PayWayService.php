<?php

namespace App\Services;

use App\Exceptions\PayWayConfigurationException;
use App\Models\Order;
use App\Support\PaymentStatuses;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class PayWayService
{
    private const SANDBOX_BASE_URL = 'https://checkout-sandbox.payway.com.kh';
    private const PRODUCTION_BASE_URL = 'https://checkout.payway.com.kh';

    /** @var array<string, mixed> */
    private readonly array $config;

    public function __construct()
    {
        $this->config = config('services.payway', []);
    }

    public function isConfigured(): bool
    {
        return filled($this->config['merchant_id'] ?? null)
            && filled($this->config['api_key'] ?? null)
            && filled($this->config['base_url'] ?? null);
    }

    /**
     * @return array<string, mixed>
     */
    public function createQrPayment(Order $order, string $transactionId): array
    {
        $this->ensureConfigured();

        $payload = $this->basePaymentPayload($order, $transactionId);
        $payload['payment_option'] = 'abapay_khqr';
        $payload['qr_image_template'] = (string) ($this->config['qr_image_template'] ?? 'template3_color');
        $payload['hash'] = $this->hashQrPayload($payload);

        $path = '/api/payment-gateway/v1/payments/generate-qr';
        $httpResponse = $this->postJson($path, $payload);
        $response = $httpResponse->json() ?? [];
        $statusCode = (string) data_get($response, 'status.code', '');

        if (! in_array($statusCode, ['0', '00'], true)) {
            $this->logGatewayFailure('PayWay QR creation failed.', $path, $payload, $httpResponse);

            throw new PayWayConfigurationException('PayWay could not create a QR payment.');
        }

        return [
            'provider_transaction_id' => $transactionId,
            'qr_string' => $response['qrString'] ?? $response['qr_string'] ?? null,
            'qr_image' => $response['qrImage'] ?? $response['qr_image'] ?? null,
            'deeplink' => $response['abapay_deeplink'] ?? null,
            'checkout_url' => $response['checkout_qr_url'] ?? null,
            'gateway_response' => $this->redact($response),
            'expires_at' => now()->addMinutes($this->lifetimeMinutes()),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function createCardPayment(Order $order, string $transactionId): array
    {
        $this->ensureConfigured();

        $payload = $this->purchasePayload($order, $transactionId, 'cards');
        $payload['hash'] = $this->hashPurchasePayload($payload);

        $html = $this->postMultipart('/api/payment-gateway/v1/payments/purchase', $payload);

        return [
            'provider_transaction_id' => $transactionId,
            'checkout_html' => $html,
            'gateway_response' => ['content_type' => 'text/html'],
            'expires_at' => now()->addMinutes($this->lifetimeMinutes()),
        ];
    }

    /**
     * @return array{result: string, transaction_id?: string|null, amount?: float|null, currency?: string|null, reference?: string|null, payment_type?: string|null, raw?: array<string, mixed>}
     */
    public function checkTransaction(string $transactionId): array
    {
        $this->ensureConfigured();

        $payload = [
            'req_time' => $this->requestTime(),
            'merchant_id' => (string) $this->config['merchant_id'],
            'tran_id' => $transactionId,
        ];
        $payload['hash'] = $this->hash($payload['req_time'].$payload['merchant_id'].$payload['tran_id']);

        try {
            $response = Http::acceptJson()
                ->timeout($this->timeoutSeconds())
                ->post($this->url('/api/payment-gateway/v1/payments/check-transaction-2'), $payload);
        } catch (ConnectionException) {
            Log::error('PayWay transaction check could not connect.', ['tran_id' => $transactionId]);

            return ['result' => 'error'];
        }

        if ($response->failed()) {
            Log::warning('PayWay transaction check returned an HTTP error.', [
                'tran_id' => $transactionId,
                'http_status' => $response->status(),
            ]);

            return ['result' => 'error'];
        }

        $body = $response->json() ?? [];
        $topStatusCode = (string) data_get($body, 'status.code', '');

        if ($topStatusCode !== '' && $topStatusCode !== '00' && $topStatusCode !== '0') {
            // A non-"00" top-level status means the *request itself* was
            // rejected (bad auth/hash, unapproved IP, malformed params) -
            // not a business payment_status. There is nothing payment-shaped
            // in the body to parse in that case.
            Log::warning('PayWay transaction check request was rejected.', [
                'tran_id' => $transactionId,
                'status_code' => $topStatusCode,
                'status_message' => data_get($body, 'status.message'),
            ]);

            return ['result' => 'error'];
        }

        $data = is_array($body['data'] ?? null) ? $body['data'] : $body;
        // Documented payment_status_code values: 0 APPROVED, 2 PENDING,
        // 3 DECLINED, 4 REFUNDED, 7 CANCELLED. The payment_status string is
        // used only as a fallback when the code is missing/unexpected.
        $paymentStatusCode = (string) ($data['payment_status_code'] ?? '');
        $description = strtolower((string) ($data['payment_status'] ?? ''));

        $result = match (true) {
            $paymentStatusCode === '0', $description === 'approved' => 'success',
            $paymentStatusCode === '2', $description === 'pending' => 'pending',
            $paymentStatusCode === '3', $description === 'declined' => 'failed',
            $paymentStatusCode === '4', $description === 'refunded' => 'failed',
            $paymentStatusCode === '7', $description === 'cancelled' => 'cancelled',
            default => 'not_found',
        };

        // original_amount/original_currency is what WE requested (and what
        // must match our stored payment); payment_amount/payment_currency is
        // what the payer's wallet actually charged them and can legitimately
        // differ (e.g. KHR-equivalent KHQR payments), so it is only a fallback.
        return [
            'result' => $result,
            'transaction_id' => $data['tran_id'] ?? $transactionId,
            'amount' => isset($data['original_amount'])
                ? (float) $data['original_amount']
                : (isset($data['payment_amount']) ? (float) $data['payment_amount'] : null),
            'currency' => $data['original_currency'] ?? $data['payment_currency'] ?? null,
            'reference' => $data['bank_ref'] ?? $data['apv'] ?? null,
            'payment_type' => $data['payment_type'] ?? null,
            'raw' => $this->redact($body),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function callbackPayload(array $payload): array
    {
        return $this->redact($payload);
    }

    private function ensureConfigured(): void
    {
        if (! $this->isConfigured()) {
            throw new PayWayConfigurationException('PayWay is not configured.');
        }
    }

    /**
     * @return array<string, mixed>
     */
    private function basePaymentPayload(Order $order, string $transactionId): array
    {
        $order->loadMissing(['user', 'items']);

        return [
            'req_time' => $this->requestTime(),
            'merchant_id' => (string) $this->config['merchant_id'],
            'tran_id' => $transactionId,
            'amount' => $this->amount($order),
            'items' => $this->items($order),
            'first_name' => $this->firstName((string) ($order->user?->name ?? 'Customer')),
            'last_name' => $this->lastName((string) ($order->user?->name ?? 'Customer')),
            'email' => (string) ($order->user?->email ?? ''),
            'phone' => (string) ($order->user?->phone ?? ''),
            'purchase_type' => 'purchase',
            'callback_url' => base64_encode($this->callbackUrl()),
            'return_deeplink' => null,
            'currency' => $this->currency(),
            'custom_fields' => base64_encode(json_encode(['order_id' => $order->id], JSON_THROW_ON_ERROR)),
            'return_params' => json_encode(['payment_order_id' => $order->id], JSON_THROW_ON_ERROR),
            'payout' => null,
            'lifetime' => $this->lifetimeMinutes(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function purchasePayload(Order $order, string $transactionId, string $paymentOption): array
    {
        $base = $this->basePaymentPayload($order, $transactionId);

        return [
            'req_time' => $base['req_time'],
            'merchant_id' => $base['merchant_id'],
            'tran_id' => $base['tran_id'],
            'amount' => $base['amount'],
            'items' => $base['items'],
            'shipping' => (float) ($order->delivery_fee ?? 0),
            'firstname' => $base['first_name'],
            'lastname' => $base['last_name'],
            'email' => $base['email'],
            'phone' => $base['phone'],
            'type' => 'purchase',
            'payment_option' => $paymentOption,
            'return_url' => base64_encode($this->callbackUrl()),
            'cancel_url' => $this->frontendPaymentUrl($transactionId),
            'continue_success_url' => $this->frontendPaymentUrl($transactionId),
            'return_deeplink' => null,
            'currency' => $base['currency'],
            'custom_fields' => $base['custom_fields'],
            'return_params' => $base['return_params'],
            'payout' => null,
            'lifetime' => $base['lifetime'],
            'additional_params' => null,
            'google_pay_token' => null,
            'skip_success_page' => 1,
            'view_type' => 'hosted_view',
            'payment_gate' => 0,
        ];
    }

    private function hashQrPayload(array $payload): string
    {
        return $this->hash(
            ($payload['req_time'] ?? '')
            .($payload['merchant_id'] ?? '')
            .($payload['tran_id'] ?? '')
            .($payload['amount'] ?? '')
            .($payload['items'] ?? '')
            .($payload['first_name'] ?? '')
            .($payload['last_name'] ?? '')
            .($payload['email'] ?? '')
            .($payload['phone'] ?? '')
            .($payload['purchase_type'] ?? '')
            .($payload['payment_option'] ?? '')
            .($payload['callback_url'] ?? '')
            .($payload['return_deeplink'] ?? '')
            .($payload['currency'] ?? '')
            .($payload['custom_fields'] ?? '')
            .($payload['return_params'] ?? '')
            .($payload['payout'] ?? '')
            .($payload['lifetime'] ?? '')
            .($payload['qr_image_template'] ?? '')
        );
    }

    private function hashPurchasePayload(array $payload): string
    {
        return $this->hash(
            ($payload['req_time'] ?? '')
            .($payload['merchant_id'] ?? '')
            .($payload['tran_id'] ?? '')
            .($payload['amount'] ?? '')
            .($payload['items'] ?? '')
            .($payload['shipping'] ?? '')
            .($payload['firstname'] ?? '')
            .($payload['lastname'] ?? '')
            .($payload['email'] ?? '')
            .($payload['phone'] ?? '')
            .($payload['type'] ?? '')
            .($payload['payment_option'] ?? '')
            .($payload['return_url'] ?? '')
            .($payload['cancel_url'] ?? '')
            .($payload['continue_success_url'] ?? '')
            .($payload['return_deeplink'] ?? '')
            .($payload['currency'] ?? '')
            .($payload['custom_fields'] ?? '')
            .($payload['return_params'] ?? '')
            .($payload['payout'] ?? '')
            .($payload['lifetime'] ?? '')
            .($payload['additional_params'] ?? '')
            .($payload['google_pay_token'] ?? '')
            .($payload['skip_success_page'] ?? '')
        );
    }

    private function hash(string $value): string
    {
        return base64_encode(hash_hmac('sha512', $value, (string) $this->config['api_key'], true));
    }

    private function postJson(string $path, array $payload): Response
    {
        try {
            $response = Http::asJson()
                ->acceptJson()
                ->timeout($this->timeoutSeconds())
                ->post($this->url($path), $payload);
        } catch (ConnectionException) {
            throw new PayWayConfigurationException('Could not connect to PayWay.');
        }

        if ($response->failed()) {
            $this->logGatewayFailure('PayWay HTTP request failed.', $path, $payload, $response);

            throw new PayWayConfigurationException('PayWay returned an HTTP error.');
        }

        return $response;
    }

    /**
     * Logs everything useful for debugging a failed PayWay call without ever
     * writing PAYWAY_API_KEY, the RSA private key, or the request hash
     * (a secret-derived signature) to the log.
     *
     * @param  array<string, mixed>  $payload
     */
    private function logGatewayFailure(string $message, string $path, array $payload, Response $response): void
    {
        Log::error($message, [
            'url' => $this->url($path),
            'merchant_id' => $payload['merchant_id'] ?? null,
            'tran_id' => $payload['tran_id'] ?? null,
            'amount' => $payload['amount'] ?? null,
            'currency' => $payload['currency'] ?? null,
            'http_status' => $response->status(),
            'response_body' => $response->body(),
            'response_json' => $response->json(),
        ]);
    }

    /**
     * @return string
     */
    private function postMultipart(string $path, array $payload): string
    {
        try {
            $response = Http::asMultipart()
                ->timeout($this->timeoutSeconds())
                ->post($this->url($path), $payload);
        } catch (ConnectionException) {
            throw new PayWayConfigurationException('Could not connect to PayWay.');
        }

        if ($response->failed()) {
            throw new PayWayConfigurationException('PayWay returned an HTTP error.');
        }

        return $response->body();
    }

    private function url(string $path): string
    {
        return rtrim((string) $this->config['base_url'], '/').$path;
    }

    private function requestTime(): string
    {
        return now('UTC')->format('YmdHis');
    }

    private function amount(Order $order): string
    {
        $amount = (float) ($order->total_price ?? $order->total ?? 0);

        if ($this->currency() === 'KHR') {
            return (string) (int) round($amount);
        }

        return number_format($amount, 2, '.', '');
    }

    private function currency(): string
    {
        return strtoupper((string) ($this->config['currency'] ?? 'USD'));
    }

    private function items(Order $order): string
    {
        $items = $order->items->take(10)->map(fn ($item) => [
            'name' => mb_substr((string) ($item->food_name ?? 'Item'), 0, 60),
            'quantity' => (int) $item->quantity,
            'price' => (float) $item->price,
        ])->values()->all();

        return base64_encode(json_encode($items, JSON_THROW_ON_ERROR));
    }

    private function firstName(string $name): string
    {
        $parts = preg_split('/\s+/', trim($name)) ?: [];

        return mb_substr($parts[0] ?? 'Customer', 0, 20);
    }

    private function lastName(string $name): string
    {
        $parts = preg_split('/\s+/', trim($name)) ?: [];

        return mb_substr(count($parts) > 1 ? implode(' ', array_slice($parts, 1)) : 'Customer', 0, 20);
    }

    private function callbackUrl(): string
    {
        return rtrim((string) config('app.url'), '/').'/api/payments/payway/callback';
    }

    private function frontendPaymentUrl(string $transactionId): string
    {
        return rtrim((string) config('marketplace.customer_app_url'), '/').'/payment/payway/'.$transactionId;
    }

    private function lifetimeMinutes(): int
    {
        return max(3, (int) ($this->config['payment_lifetime_minutes'] ?? 15));
    }

    private function timeoutSeconds(): int
    {
        return max(1, (int) ($this->config['timeout_seconds'] ?? 15));
    }

    /**
     * @param  array<string, mixed>  $payload
     * @return array<string, mixed>
     */
    private function redact(array $payload): array
    {
        unset($payload['hash'], $payload['merchant_auth']);

        return $payload;
    }
}
