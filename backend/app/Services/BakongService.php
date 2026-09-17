<?php

namespace App\Services;

use App\Exceptions\BakongConfigurationException;
use Carbon\CarbonInterface;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use KHQR\BakongKHQR;
use KHQR\Exceptions\KHQRException;
use KHQR\Helpers\KHQRData;
use KHQR\Models\IndividualInfo;

/**
 * All communication with the National Bank of Cambodia's Bakong Open API
 * lives here: generating a KHQR string/MD5 for a payment (offline, via the
 * official-spec-compliant fidele007/bakong-khqr-php SDK - see KHQRData's
 * tag table, which matches the published EMVCo-based KHQR standard) and
 * verifying a transaction by MD5 against the real Bakong API.
 *
 * BAKONG_TOKEN is read from config()/env only, and is never included in any
 * log line, exception message, or returned array here.
 */
class BakongService
{
    /** @var array<string, mixed> */
    private readonly array $config;

    public function __construct()
    {
        $this->config = config('services.bakong', []);
    }

    public function isConfigured(): bool
    {
        return filled($this->config['token'] ?? null)
            && filled($this->config['account_id'] ?? null)
            && filled($this->config['api_url'] ?? null);
    }

    public function expectedAccountId(): ?string
    {
        return $this->config['account_id'] ?? null;
    }

    /**
     * Builds and signs a dynamic individual-type KHQR string for the given
     * amount, following the official Bakong KHQR tag structure. This is a
     * pure/offline operation - no network call is made.
     *
     * @return array{qr: string, md5: string, expires_at: CarbonInterface}
     *
     * @throws BakongConfigurationException
     */
    public function generateKhqr(float $amount, string $currency, string $billNumber): array
    {
        if (! filled($this->config['account_id'] ?? null)) {
            throw new BakongConfigurationException('Bakong account is not configured (BAKONG_ACCOUNT_ID missing).');
        }

        $expiryMinutes = max(1, (int) ($this->config['khqr_expiry_minutes'] ?? 15));
        $expiresAt = now()->addMinutes($expiryMinutes);
        $expirationTimestampMs = (string) ((int) round(microtime(true) * 1000) + $expiryMinutes * 60 * 1000);

        try {
            $individualInfo = new IndividualInfo(
                bakongAccountID: (string) $this->config['account_id'],
                merchantName: (string) ($this->config['merchant_name'] ?? 'Merchant'),
                merchantCity: (string) ($this->config['merchant_city'] ?? 'Phnom Penh'),
                currency: $this->currencyCode($currency),
                amount: $amount,
                billNumber: $billNumber,
                expirationTimestamp: $expirationTimestampMs,
                merchantCategoryCode: (string) ($this->config['merchant_category_code'] ?? '5999'),
            );

            $khqrResponse = BakongKHQR::generateIndividual($individualInfo);
        } catch (KHQRException $exception) {
            Log::error('Bakong KHQR generation rejected the given merchant/payment details.', [
                'error' => $exception->getMessage(),
            ]);

            throw new BakongConfigurationException('Unable to generate KHQR code: '.$exception->getMessage(), previous: $exception);
        }

        if ((int) ($khqrResponse->status['code'] ?? 1) !== 0) {
            Log::error('Bakong KHQR generation returned a non-success status.', [
                'message' => $khqrResponse->status['message'] ?? null,
            ]);

            throw new BakongConfigurationException('Unable to generate KHQR code.');
        }

        return [
            'qr' => $khqrResponse->data['qr'],
            'md5' => $khqrResponse->data['md5'],
            'expires_at' => $expiresAt,
        ];
    }

    /**
     * Calls Bakong's POST /v1/check_transaction_by_md5 to verify whether a
     * transaction was actually paid. Never trust a browser's word for this -
     * this is the only source of truth for marking a payment PAID.
     *
     * @return array{
     *     result: 'success'|'not_found'|'failed'|'error',
     *     hash?: string|null,
     *     from_account_id?: string|null,
     *     to_account_id?: string|null,
     *     currency?: string|null,
     *     amount?: float|null,
     *     message?: string,
     * }
     */
    public function verifyTransactionByMd5(string $md5): array
    {
        if (! $this->isConfigured()) {
            throw new BakongConfigurationException('Bakong is not configured (missing BAKONG_TOKEN/BAKONG_API_URL/BAKONG_ACCOUNT_ID).');
        }

        $url = rtrim((string) $this->config['api_url'], '/').'/v1/check_transaction_by_md5';
        $timeout = max(1, (int) ($this->config['verify_timeout_seconds'] ?? 15));

        try {
            $response = Http::withToken((string) $this->config['token'])
                ->acceptJson()
                ->timeout($timeout)
                ->post($url, ['md5' => $md5]);
        } catch (ConnectionException $exception) {
            // Deliberately not logging $exception->getMessage() in full - it
            // can include the request URI with query strings; the token is
            // sent as a header, never a query string, so this is safe, but
            // we keep the logged surface minimal regardless.
            Log::error('Bakong transaction verification could not connect.', ['md5' => $md5]);

            return ['result' => 'error', 'message' => 'Could not reach the Bakong API. Please try again.'];
        }

        if ($response->failed()) {
            Log::error('Bakong transaction verification returned an HTTP error.', [
                'md5' => $md5,
                'http_status' => $response->status(),
            ]);

            return ['result' => 'error', 'message' => 'Bakong API returned an error.'];
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
            ];
        }

        $errorCode = (int) ($body['errorCode'] ?? 0);

        if ($errorCode === 1) {
            return ['result' => 'not_found'];
        }

        if ($errorCode === 3) {
            return ['result' => 'failed'];
        }

        Log::warning('Bakong transaction verification returned an unexpected response.', [
            'md5' => $md5,
            'response_code' => $responseCode,
            'error_code' => $errorCode,
        ]);

        return ['result' => 'error', 'message' => $body['responseMessage'] ?? 'Unexpected Bakong response.'];
    }

    private function currencyCode(string $currency): int
    {
        return strtoupper($currency) === 'KHR' ? KHQRData::CURRENCY_KHR : KHQRData::CURRENCY_USD;
    }
}
