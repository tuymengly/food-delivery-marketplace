<?php

use Illuminate\Cookie\Middleware\EncryptCookies;
use Illuminate\Foundation\Http\Middleware\ValidateCsrfToken;
use Laravel\Sanctum\Http\Middleware\AuthenticateSession;
use Laravel\Sanctum\Sanctum;

/**
 * Sanctum stores stateful domains as host[:port] (no scheme). The localhost
 * entries below are development defaults; on Render set
 * SANCTUM_STATEFUL_DOMAINS to the deployed frontend hosts. Blank and
 * duplicated entries are dropped so a placeholder APP_URL can't inject
 * garbage into the list.
 *
 * @return list<string>
 */
$statefulDomains = static function (): array {
    $configured = env('SANCTUM_STATEFUL_DOMAINS');

    if (filled($configured)) {
        return array_values(array_unique(array_filter(
            array_map('trim', explode(',', (string) $configured)),
            static fn (string $host): bool => $host !== ''
        )));
    }

    return array_values(array_unique(array_filter([
        'localhost',
        'localhost:3000',
        'localhost:5173',
        'localhost:5174',
        '127.0.0.1',
        '127.0.0.1:8000',
        '127.0.0.1:5173',
        '127.0.0.1:5174',
        '::1',
        Sanctum::currentApplicationUrlWithPort(),
        // Sanctum::currentRequestHost(),
    ], static fn (?string $host): bool => filled($host))));
};

return [

    /*
    |--------------------------------------------------------------------------
    | Stateful Domains
    |--------------------------------------------------------------------------
    |
    | Requests from the following domains / hosts will receive stateful API
    | authentication cookies. Typically, these should include your local
    | and production domains which access your API via a frontend SPA.
    |
    | This API authenticates with Sanctum bearer tokens (Authorization
    | header) rather than cookies, so these values only matter if a future
    | deployment switches to cookie-based SPA auth. Override them per
    | environment on Render:
    |
    |   SANCTUM_STATEFUL_DOMAINS=<customer-frontend>.onrender.com,<admin-restaurant>.onrender.com
    |
    | The defaults below are local-development only.
    |
    */

    'stateful' => $statefulDomains(),

    /*
    |--------------------------------------------------------------------------
    | Sanctum Guards
    |--------------------------------------------------------------------------
    |
    | This array contains the authentication guards that will be checked when
    | Sanctum is trying to authenticate a request. If none of these guards
    | are able to authenticate the request, Sanctum will use the bearer
    | token that's present on an incoming request for authentication.
    |
    */

    'guard' => ['web'],

    /*
    |--------------------------------------------------------------------------
    | Expiration Minutes
    |--------------------------------------------------------------------------
    |
    | This value controls the number of minutes until an issued token will be
    | considered expired. This will override any values set in the token's
    | "expires_at" attribute, but first-party sessions are not affected.
    |
    | Null (the default) keeps tokens valid until they are explicitly
    | revoked via POST /api/logout, which is what the frontends rely on.
    | Set SANCTUM_TOKEN_EXPIRATION=<minutes> per environment to expire
    | tokens automatically; both frontends treat the resulting 401 as
    | "session over" and clear their stored authentication state.
    |
    */

    'expiration' => env('SANCTUM_TOKEN_EXPIRATION') ? (int) env('SANCTUM_TOKEN_EXPIRATION') : null,

    /*
    |--------------------------------------------------------------------------
    | Token Prefix
    |--------------------------------------------------------------------------
    |
    | Sanctum can prefix new tokens in order to take advantage of numerous
    | security scanning initiatives maintained by open source platforms
    | that notify developers if they commit tokens into repositories.
    |
    | See: https://docs.github.com/en/code-security/secret-scanning/about-secret-scanning
    |
    */

    'token_prefix' => env('SANCTUM_TOKEN_PREFIX', ''),

    /*
    |--------------------------------------------------------------------------
    | Sanctum Middleware
    |--------------------------------------------------------------------------
    |
    | When authenticating your first-party SPA with Sanctum you may need to
    | customize some of the middleware Sanctum uses while processing the
    | request. You may change the middleware listed below as required.
    |
    */

    'middleware' => [
        'authenticate_session' => AuthenticateSession::class,
        'encrypt_cookies' => EncryptCookies::class,
        'validate_csrf_token' => ValidateCsrfToken::class,
    ],

];
