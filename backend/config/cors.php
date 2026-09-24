<?php

/*
|--------------------------------------------------------------------------
| Cross-Origin Resource Sharing (CORS) Configuration
|--------------------------------------------------------------------------
|
| customer-frontend and admin-restaurant are separate origins from this API
| (two different Vite/Node servers locally, two different Render static
| sites later), so their origins must be allowed here for the browser to
| accept the API responses.
|
| Origins are environment-driven on purpose - never hardcode a deployment
| URL. On Render set one of these as an environment variable:
|
|   CUSTOMER_APP_URL=https://<customer-frontend>.onrender.com
|   ADMIN_APP_URL=https://<admin-restaurant>.onrender.com
|   # ...or list them explicitly (comma separated, overrides the above):
|   CORS_ALLOWED_ORIGINS=https://<customer-frontend>.onrender.com,https://<admin-restaurant>.onrender.com
|   # Regex patterns are also supported for preview/deploy-preview hosts:
|   CORS_ALLOWED_ORIGINS_PATTERNS=#^https://.*\.onrender\.com$#
|
| The localhost fallbacks below only exist so `php artisan serve` plus the
| two pinned Vite dev servers (5173/5174) work out of the box.
|
*/

$defaultOrigins = implode(',', array_filter([
    env('CUSTOMER_APP_URL'),
    env('ADMIN_APP_URL'),
    'http://localhost:5174',
    'http://localhost:5173',
    'http://127.0.0.1:5174',
    'http://127.0.0.1:5173',
]));

// Trim, drop blanks and de-duplicate so the same origin listed twice (e.g.
// CUSTOMER_APP_URL equals the localhost fallback) never reaches the browser.
$toList = static fn (?string $value): array => array_values(array_unique(array_filter(
    array_map('trim', explode(',', (string) $value)),
    static fn (string $origin): bool => $origin !== ''
)));

return [

    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    'allowed_origins' => $toList(env('CORS_ALLOWED_ORIGINS', $defaultOrigins) ?: $defaultOrigins),

    'allowed_origins_patterns' => $toList(env('CORS_ALLOWED_ORIGINS_PATTERNS')),

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => (int) env('CORS_MAX_AGE', 0),

    /*
    | This API authenticates with Sanctum bearer tokens (Authorization
    | header), not cookies, so credentialed CORS is off by default. If a
    | future deployment switches to Sanctum's cookie-based SPA auth, set
    | CORS_SUPPORTS_CREDENTIALS=true *and* list explicit origins above
    | (browsers reject credentials together with a "*" origin).
    */
    'supports_credentials' => filter_var(env('CORS_SUPPORTS_CREDENTIALS', false), FILTER_VALIDATE_BOOLEAN),

];
