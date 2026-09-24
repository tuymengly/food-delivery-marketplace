<?php

namespace App\Services;

use App\Exceptions\KhqrConfigurationException;
use App\Models\Order;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use KHQR\BakongKHQR;
use KHQR\Exceptions\KHQRException;
use KHQR\Helpers\KHQRData;
use KHQR\Models\IndividualInfo;

/**
 * Client for the direct Bakong (National Bank of Cambodia) Open API. The
 * third-party KHQR.LINK wrapper was tried first, but its own authorization
 * layer rejected our Bakong ID ("Unauthorized bakongid") for reasons
 * outside this codebase's control, so this talks to NBC directly instead:
 *
 * - KHQR generation is entirely offline (no network call, no credential
 *   needed) via the official fidele007/bakong-khqr-php SDK, which builds
 *   an EMVCo-compliant KHQR string/MD5 from the merchant details below.
 * - Payment verification calls Bakong's own real API,
 *   POST https://api-bakong.nbc.gov.kh/v1/check_transaction_by_md5, with
 *   bakong_token sent as a bearer token. This is the only source of truth
 *   for marking a payment PAID - never trust a browser's word for it.
 *
 * bakong_token is never logged, returned from any API response, or sent to
 * React - see config/khqr.php.
 */
class BakongService
{
    /** @var array<string, mixed> */
    private readonly array $config;

    public function __construct()
    {
        $this->config = config('khqr', []);
    }

    public function isConfigured(): bool
    {
        return filled($this->config['bakong_token'] ?? null)
            && filled($this->config['bakong_id'] ?? null)
            && filled($this->config['bakong_api_url'] ?? null);
    }

    public function expectedAccountId(): ?string
    {
        return $this->config['bakong_id'] ?? null;
    }

    /**
     * Builds and signs a dynamic individual-type KHQR string for the given
     * order, following the official Bakong KHQR tag structure. This is a
     * pure/offline operation - no network call is made, so it can't fail
     * because of an API authorization problem.
     *
     * @return array{provider_transaction_id: string, md5: string, qr_string: string, qr_image: null, gateway_response: array<string, mixed>, expires_at: \Illuminate\Support\Carbon}
     */
    public function createPayment(Order $order): array
    {
        $this->ensureConfigured();

        $amount = (float) ($order->total_price ?? $order->total ?? 0);
        $currency = strtoupper((string) ($this->config['currency'] ?? 'USD'));
        $billNumber = 'O'.$order->id.now('UTC')->format('His');
        $expiryMinutes = $this->lifetimeMinutes();
        $expirationTimestampMs = (string) ((int) round(microtime(true) * 1000) + $expiryMinutes * 60 * 1000);

        try {
            $individualInfo = new IndividualInfo(
                bakongAccountID: (string) $this->config['bakong_id'],
                merchantName: (string) ($this->config['merchant_name'] ?? 'Merchant'),
                merchantCity: (string) ($this->config['merchant_city'] ?? 'Phnom Penh'),
                currency: $currency === 'KHR' ? KHQRData::CURRENCY_KHR : KHQRData::CURRENCY_USD,
                amount: $amount,
                billNumber: $billNumber,
                expirationTimestamp: $expirationTimestampMs,
                merchantCategoryCode: (string) ($this->config['merchant_category_code'] ?? '5999'),
            );

            $khqrResponse = BakongKHQR::generateIndividual($individualInfo);
        } catch (KHQRException $exception) {
            Log::error('Bakong KHQR generation rejected the given merchant/payment details.', [
                'order_id' => $order->id,
                'error' => $exception->getMessage(),
            ]);

            throw new KhqrConfigurationException('Unable to generate a KHQR code: '.$exception->getMessage(), previous: $exception);
        }

        if ((int) ($khqrResponse->status['code'] ?? 1) !== 0) {
            Log::error('Bakong KHQR generation returned a non-success status.', [
                'order_id' => $order->id,
                'message' => $khqrResponse->status['message'] ?? null,
            ]);

            throw new KhqrConfigurationException('Unable to generate a KHQR code.');
        }

        return [
            'provider_transaction_id' => $billNumber,
            'md5' => $khqrResponse->data['md5'],
            'qr_string' => $khqrResponse->data['qr'],
            'qr_image' => null,
            'gateway_response' => ['bill_number' => $billNumber],
            'expires_at' => now()->addMinutes($expiryMinutes),
        ];
    }

    /**
     * Calls Bakong's real POST /v1/check_transaction_by_md5 to verify
     * whether a transaction was actually paid.
     *
     * @return array{result: 'success'|'pending'|'failed'|'not_found'|'error', hash?: string|null, from_account_id?: string|null, to_account_id?: string|null, currency?: string|null, amount?: float|null, raw?: array<string, mixed>}
     */
    public function checkPayment(string $md5): array
    {
        $this->ensureConfigured();

        try {
            $response = Http::withToken((string) $this->config['bakong_token'])
                ->acceptJson()
                ->timeout($this->timeoutSeconds())
                ->post($this->url('/v1/check_transaction_by_md5'), ['md5' => $md5]);
        } catch (ConnectionException) {
            // Deliberately not logging the exception message in full - it
            // can include the request URI; the token is sent as a header,
            // never a query string, so this is safe, but we keep the
            // logged surface minimal regardless.
            Log::error('Bakong transaction verification could not connect.', ['md5' => $md5]);

            return ['result' => 'error'];
        }

        if ($response->failed()) {
            Log::warning('Bakong transaction verification returned an HTTP error.', [
                'md5' => $md5,
                'http_status' => $response->status(),
                'response_body' => $this->sanitizeForLog($response->json() ?? $response->body()),
            ]);

            return ['result' => 'error'];
        }

        $body = $response->json() ?? [];
        $responseCode = $body['responseCode'] ?? null;

        // Strict comparison: responseCode is only ever meaningfully 0 when
        // Bakong's body actually says so - a missing/null field must never
        // be coerced into "success" by a loose (int) cast.
        if ($responseCode === 0 && isset($body['data'])) {
            $data = $body['data'];

            return [
                'result' => 'success',
                'hash' => $data['hash'] ?? null,
                'from_account_id' => $data['fromAccountId'] ?? null,
                'to_account_id' => $data['toAccountId'] ?? null,
                'currency' => $data['currency'] ?? null,
                'amount' => isset($data['amount']) ? (float) $data['amount'] : null,
                'raw' => $this->sanitizeForLog($body),
            ];
        }

        $errorCode = (int) ($body['errorCode'] ?? 0);

        if ($errorCode === 1) {
            return ['result' => 'not_found'];
        }

        if ($errorCode === 3) {
            return ['result' => 'failed'];
        }

        // Bakong's own responseMessage (e.g. a daily quota being exhausted)
        // was previously discarded here, leaving only the numeric codes in
        // the log - which isn't enough to tell "briefly unreachable" apart
        // from "permanently blocked for the rest of today" without a live
        // reproduction. Logging it (it never contains credentials) makes
        // this diagnosable from the log alone next time, and passing it
        // back lets the customer see *something* instead of an
        // indefinite, unexplained "pending" spinner.
        $responseMessage = is_string($body['responseMessage'] ?? null) ? $body['responseMessage'] : null;

        Log::warning('Bakong transaction verification returned an unexpected response.', [
            'md5' => $md5,
            'response_code' => $responseCode,
            'error_code' => $errorCode,
            'response_message' => $responseMessage,
        ]);

        return ['result' => 'error', 'message' => $responseMessage];
    }

    /**
     * Redacts anything credential-shaped before it reaches a log line or
     * gets stored in gateway_response. Bakong's own responses shouldn't
     * echo our token back, but this is defense in depth regardless.
     */
    private function sanitizeForLog(mixed $value): mixed
    {
        if (is_array($value)) {
            return collect($value)->map(function ($item, $key) {
                if (is_string($key) && preg_match('/(api[_-]?key|api[_-]?secret|secret|token|password|authorization|bearer|access[_-]?token|private[_-]?key)/i', $key)) {
                    return '[REDACTED]';
                }

                return $this->sanitizeForLog($item);
            })->all();
        }

        if (is_string($value) && strlen($value) > 2000) {
            return substr($value, 0, 2000).'...[truncated]';
        }

        return $value;
    }

    private function ensureConfigured(): void
    {
        if (! $this->isConfigured()) {
            throw new KhqrConfigurationException('Bakong is not configured (missing KHQR_BAKONG_TOKEN/KHQR_BAKONG_ID/KHQR_BAKONG_API_URL).');
        }
    }

    private function url(string $path): string
    {
        return rtrim((string) $this->config['bakong_api_url'], '/').$path;
    }

    /**
     * Floor of 5 minutes is deliberate: a shorter window (this was
     * misconfigured down to 1-2 minutes at one point) lets the KHQR SDK
     * generate a structurally valid, CRC-correct code that nonetheless
     * embeds an expirationTimestamp (tag 99) already in the past by the
     * time a real customer finishes navigating to their banking app and
     * scanning it - which banking apps then surface as "invalid QR", not
     * "expired", making it look like a generation bug when it is really
     * just too little time to pay.
     */
    private function lifetimeMinutes(): int
    {
        return max(5, (int) ($this->config['payment_lifetime_minutes'] ?? 15));
    }

    private function timeoutSeconds(): int
    {
        return max(1, (int) ($this->config['timeout_seconds'] ?? 15));
    }
}
