<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'google' => [
        'client_id' => env('GOOGLE_CLIENT_ID'),
        'client_secret' => env('GOOGLE_CLIENT_SECRET'),
        'redirect' => env('GOOGLE_REDIRECT_URI'),
    ],

    /*
    |--------------------------------------------------------------------------
    | Bakong (NBC) KHQR payment gateway
    |--------------------------------------------------------------------------
    |
    | BAKONG_TOKEN is a secret issued by the National Bank of Cambodia's
    | Bakong Open API and is only ever read from the environment here - it
    | must never be hardcoded, logged, or returned from any API response.
    | account_id/merchant_name/merchant_city are NOT secret - they are the
    | receiving-account details embedded directly in the KHQR string that
    | customers scan, and identify the platform's own Bakong account (every
    | order is collected into this single account, then paid out internally
    | - see PaymentController's existing payout endpoints).
    |
    */
    'bakong' => [
        'api_url' => env('BAKONG_API_URL', 'https://api-bakong.nbc.gov.kh'),
        'token' => env('BAKONG_TOKEN'),
        'account_id' => env('BAKONG_ACCOUNT_ID'),
        'merchant_name' => env('BAKONG_MERCHANT_NAME', 'Food Delivery Marketplace'),
        'merchant_city' => env('BAKONG_MERCHANT_CITY', 'Phnom Penh'),
        'merchant_category_code' => env('BAKONG_MERCHANT_CATEGORY_CODE', '5999'),
        'currency' => env('BAKONG_CURRENCY', 'USD'),
        'khqr_expiry_minutes' => (int) env('BAKONG_KHQR_EXPIRY_MINUTES', 15),
        'verify_timeout_seconds' => (int) env('BAKONG_VERIFY_TIMEOUT_SECONDS', 15),
    ],

    /*
    |--------------------------------------------------------------------------
    | ABA PayWay payment gateway
    |--------------------------------------------------------------------------
    |
    | PayWay credentials are consumed only by Laravel. Do not expose these
    | values to React. Sandbox is the default until PAYWAY_ENV=production.
    |
    */
    'payway' => [
        'env' => env('PAYWAY_ENV', 'sandbox'),
        'base_url' => env('PAYWAY_BASE_URL', env('PAYWAY_ENV', 'sandbox') === 'production'
            ? 'https://checkout.payway.com.kh'
            : 'https://checkout-sandbox.payway.com.kh'),
        'merchant_id' => env('PAYWAY_MERCHANT_ID'),
        'api_key' => env('PAYWAY_API_KEY'),
        'rsa_private_key' => env('PAYWAY_RSA_PRIVATE_KEY'),
        'currency' => env('PAYWAY_CURRENCY', 'USD'),
        'qr_image_template' => env('PAYWAY_QR_IMAGE_TEMPLATE', 'template3_color'),
        'payment_lifetime_minutes' => (int) env('PAYWAY_PAYMENT_LIFETIME_MINUTES', 15),
        'timeout_seconds' => (int) env('PAYWAY_TIMEOUT_SECONDS', 15),
    ],

];
