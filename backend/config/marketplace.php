<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Platform commission rate
    |--------------------------------------------------------------------------
    |
    | The share of a food subtotal (not the delivery fee) that the platform
    | keeps as commission from the restaurant. Stored as a decimal fraction
    | (0.10 = 10%). Applied once, at order creation, and persisted on the
    | order itself so historical orders are never recalculated if this
    | setting changes later.
    |
    */
    'commission_rate' => (float) env('PLATFORM_COMMISSION_RATE', 0.10),

    /*
    |--------------------------------------------------------------------------
    | Frontend app URLs
    |--------------------------------------------------------------------------
    |
    | Where this backend hands browser sessions back to after a redirect-based
    | flow (currently: Google OAuth). Mirrors the CUSTOMER_APP_URL /
    | ADMIN_APP_URL constants already hardcoded as fallbacks in
    | customer-frontend/src/api/app.js and admin-restaurant/src/App.jsx.
    |
    */
    'customer_app_url' => env('CUSTOMER_APP_URL', 'http://localhost:5174'),
    'admin_app_url' => env('ADMIN_APP_URL', 'http://localhost:5173'),
];
