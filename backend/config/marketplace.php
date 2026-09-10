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
];
