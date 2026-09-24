<?php

return [

    /*
    |--------------------------------------------------------------------------
    | KHQR payments - direct Bakong (National Bank of Cambodia) Open API
    |--------------------------------------------------------------------------
    |
    | The third-party KHQR.LINK wrapper API is not used - its own
    | authorization layer rejected our Bakong ID and left that unresolved
    | on their side (see BakongService's docblock). This talks to NBC's
    | real Bakong Open API directly instead: KHQR generation is done
    | offline via fidele007/bakong-khqr-php (no network call, no auth
    | needed for that part), and payment verification calls Bakong's own
    | POST /v1/check_transaction_by_md5 with bakong_token as a bearer
    | token.
    |
    | bakong_token is a secret issued by NBC and must only ever be read
    | from the environment here - never hardcoded, logged, or returned
    | from any API response. bakong_id/merchant_name/merchant_city are NOT
    | secret - they are embedded directly in the KHQR code shown to
    | customers - but this file is still Laravel-only, never sent to React
    | (see BakongService, the only thing that reads this).
    |
    */

    'bakong_api_url' => env('KHQR_BAKONG_API_URL', 'https://api-bakong.nbc.gov.kh'),
    'bakong_token' => env('KHQR_BAKONG_TOKEN'),
    'bakong_id' => env('KHQR_BAKONG_ID'),
    'merchant_name' => env('KHQR_MERCHANT_NAME', 'Food Delivery Marketplace'),
    'merchant_city' => env('KHQR_MERCHANT_CITY', 'Phnom Penh'),
    'merchant_category_code' => env('KHQR_MERCHANT_CATEGORY_CODE', '5999'),
    'currency' => env('KHQR_CURRENCY', 'USD'),
    'payment_lifetime_minutes' => (int) env('KHQR_PAYMENT_LIFETIME_MINUTES', 15),
    'timeout_seconds' => (int) env('KHQR_TIMEOUT_SECONDS', 60),

];
