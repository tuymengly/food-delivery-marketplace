<?php

namespace Tests\Feature;

use Tests\TestCase;

/**
 * CORS is environment-driven (backend/config/cors.php) so the same code works
 * for the pinned localhost dev ports and for the deployed Render frontends.
 * These tests lock in that two-origin setup without hardcoding a deployment
 * URL anywhere.
 */
class CorsConfigurationTest extends TestCase
{
    public function test_customer_and_admin_origins_are_allowed_by_default(): void
    {
        $allowed = config('cors.allowed_origins');

        $this->assertContains('http://localhost:5174', $allowed);
        $this->assertContains('http://localhost:5173', $allowed);
    }

    public function test_preflight_from_the_admin_app_origin_is_allowed(): void
    {
        $response = $this->call('OPTIONS', '/api/user', [], [], [], [
            'HTTP_ORIGIN' => 'http://localhost:5173',
            'HTTP_ACCESS_CONTROL_REQUEST_METHOD' => 'GET',
            'HTTP_ACCESS_CONTROL_REQUEST_HEADERS' => 'authorization,content-type',
        ]);

        $response->assertNoContent();
        $this->assertSame('http://localhost:5173', $response->headers->get('Access-Control-Allow-Origin'));
    }

    public function test_preflight_from_the_customer_app_origin_is_allowed(): void
    {
        $response = $this->call('OPTIONS', '/api/user', [], [], [], [
            'HTTP_ORIGIN' => 'http://localhost:5174',
            'HTTP_ACCESS_CONTROL_REQUEST_METHOD' => 'POST',
            'HTTP_ACCESS_CONTROL_REQUEST_HEADERS' => 'authorization,content-type',
        ]);

        $response->assertNoContent();
        $this->assertSame('http://localhost:5174', $response->headers->get('Access-Control-Allow-Origin'));
    }

    public function test_allowed_origins_are_an_explicit_environment_driven_list_not_a_wildcard(): void
    {
        // A "*" origin would let any site call this API with the browser's
        // blessing; the list is built from CORS_ALLOWED_ORIGINS (falling back
        // to CUSTOMER_APP_URL/ADMIN_APP_URL + the localhost dev ports), so a
        // Render deployment only has to set environment variables.
        $allowed = config('cors.allowed_origins');

        $this->assertIsArray($allowed);
        $this->assertNotEmpty($allowed);
        $this->assertNotContains('*', $allowed);
        $this->assertContains('api/*', config('cors.paths'));
    }

    public function test_this_api_authenticates_with_bearer_tokens_not_cross_site_cookies(): void
    {
        // Becomes relevant if a deployment ever switches to Sanctum's
        // cookie-based SPA auth: CORS must then set
        // CORS_SUPPORTS_CREDENTIALS=true and the frontend hosts must be listed
        // in SANCTUM_STATEFUL_DOMAINS. Today both frontends use the
        // Authorization header, so credentialed CORS stays off.
        $this->assertFalse(config('cors.supports_credentials'));

        $stateful = config('sanctum.stateful');

        // Sanctum stores these as host[:port], not full URLs.
        foreach (['localhost:5173', 'localhost:5174'] as $frontendHost) {
            $this->assertContains($frontendHost, $stateful);
            $this->assertContains('http://' . $frontendHost, config('cors.allowed_origins'));
        }
    }
}