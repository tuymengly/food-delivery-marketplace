<?php

namespace Tests\Feature;

use App\Models\Restaurant;
use App\Models\User;
use GuzzleHttp\Exception\ClientException;
use GuzzleHttp\Psr7\Request as PsrRequest;
use GuzzleHttp\Psr7\Response as PsrResponse;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Socialite\Facades\Socialite;
use Laravel\Socialite\Two\User as SocialiteUser;
use Illuminate\Support\Facades\Notification;
use Mockery;
use Tests\Concerns\InteractsWithOtp;
use Tests\TestCase;

class GoogleAuthTest extends TestCase
{
    use RefreshDatabase;
    use InteractsWithOtp;

    protected function setUp(): void
    {
        parent::setUp();

        // Fake-but-present credentials so the isGoogleConfigured() guard
        // passes and every test below exercises the real OAuth logic. The
        // one exception - test_missing_client_secret_is_reported_clearly() -
        // explicitly blanks these out to reproduce the real production bug.
        config([
            'services.google.client_id' => 'test-client-id.apps.googleusercontent.com',
            'services.google.client_secret' => 'test-client-secret',
        ]);
    }

    private function mockGoogleUser(string $id, string $email, string $name = 'Google User'): void
    {
        $socialiteUser = Mockery::mock(SocialiteUser::class);
        $socialiteUser->shouldReceive('getId')->andReturn($id);
        $socialiteUser->shouldReceive('getEmail')->andReturn($email);
        $socialiteUser->shouldReceive('getName')->andReturn($name);
        $socialiteUser->shouldReceive('getNickname')->andReturn(null);
        $socialiteUser->shouldReceive('getAvatar')->andReturn('https://example.com/avatar.png');

        Socialite::shouldReceive('driver->stateless->user')->andReturn($socialiteUser);
    }

    private function stateFor(string $role): string
    {
        return base64_encode(json_encode(['role' => $role, 'nonce' => 'test']));
    }

    public function test_redirect_endpoint_sends_browser_to_google(): void
    {
        $response = $this->get('/api/auth/google/redirect?role=customer');

        $response->assertRedirect();
        $this->assertStringContainsString('accounts.google.com', $response->headers->get('Location'));
    }

    public function test_new_customer_can_register_via_google(): void
    {
        Notification::fake();
        $this->mockGoogleUser('google-1', 'newcustomer@example.com', 'New Customer');

        $response = $this->get('/api/auth/google/callback?state=' . $this->stateFor('customer'));

        $response->assertRedirect();
        $location = $response->headers->get('Location');
        $this->assertStringContainsString('/verify-otp?', $location);
        $this->assertStringContainsString('purpose=google_login', $location);

        $user = User::where('email', 'newcustomer@example.com')->firstOrFail();
        $this->assertSame('customer', $user->role);
        $this->assertSame('google-1', $user->google_id);
        $this->assertNotNull($user->email_verified_at);
    }

    public function test_new_restaurant_owner_can_register_via_google_and_stays_pending(): void
    {
        Notification::fake();
        $this->mockGoogleUser('google-2', 'newowner@example.com', 'New Owner');

        $response = $this->get('/api/auth/google/callback?state=' . $this->stateFor('restaurant'));

        $response->assertRedirect();
        $this->assertStringContainsString('/verify-otp?', $response->headers->get('Location'));

        $user = User::where('email', 'newowner@example.com')->firstOrFail();
        $this->assertSame('restaurant', $user->role);

        $this->assertDatabaseHas('restaurants', [
            'user_id' => $user->id,
            'status' => 'pending',
        ]);
    }

    public function test_google_customer_otp_verification_issues_a_customer_token(): void
    {
        Notification::fake();
        $this->mockGoogleUser('google-14', 'verifycustomer@example.com', 'Verify Customer');

        $response = $this->get('/api/auth/google/callback?state=' . $this->stateFor('customer'));
        parse_str((string) parse_url($response->headers->get('Location'), PHP_URL_QUERY), $query);

        $user = User::where('email', 'verifycustomer@example.com')->firstOrFail();
        $verify = $this->postJson('/api/auth/otp/verify', [
            'challenge_token' => $query['challenge'],
            'purpose' => $query['purpose'],
            'code' => $this->capturedOtpCodeFor($user),
        ]);

        $verify
            ->assertOk()
            ->assertJsonPath('data.user.role', 'customer')
            ->assertJsonStructure(['data' => ['token', 'token_type']]);
    }

    public function test_google_restaurant_otp_verification_preserves_restaurant_role(): void
    {
        Notification::fake();
        $this->mockGoogleUser('google-15', 'verifyowner@example.com', 'Verify Owner');

        $response = $this->get('/api/auth/google/callback?state=' . $this->stateFor('restaurant'));
        parse_str((string) parse_url($response->headers->get('Location'), PHP_URL_QUERY), $query);

        $user = User::where('email', 'verifyowner@example.com')->firstOrFail();
        $verify = $this->postJson('/api/auth/otp/verify', [
            'challenge_token' => $query['challenge'],
            'purpose' => 'google_login',
            'code' => $this->capturedOtpCodeFor($user),
        ]);

        $verify
            ->assertOk()
            ->assertJsonPath('data.user.role', 'restaurant')
            ->assertJsonStructure(['data' => ['token', 'token_type']]);
        $this->assertDatabaseHas('restaurants', ['user_id' => $user->id, 'status' => 'pending']);
    }

    public function test_google_otp_cannot_be_verified_as_a_different_purpose(): void
    {
        Notification::fake();
        $this->mockGoogleUser('google-16', 'wrongpurpose@example.com');

        $response = $this->get('/api/auth/google/callback?state=' . $this->stateFor('customer'));
        parse_str((string) parse_url($response->headers->get('Location'), PHP_URL_QUERY), $query);
        $user = User::where('email', 'wrongpurpose@example.com')->firstOrFail();

        $this->postJson('/api/auth/otp/verify', [
            'challenge_token' => $query['challenge'],
            'purpose' => 'registration',
            'code' => $this->capturedOtpCodeFor($user),
        ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['challenge_token']);
    }

    public function test_existing_google_user_logs_in_without_creating_a_duplicate(): void
    {
        $existing = User::factory()->create([
            'email' => 'returning@example.com',
            'google_id' => 'google-3',
            'role' => 'customer',
        ]);

        $this->mockGoogleUser('google-3', 'returning@example.com', 'Returning User');

        $this->get('/api/auth/google/callback?state=' . $this->stateFor('customer'))
            ->assertRedirect();

        $this->assertSame(1, User::where('email', 'returning@example.com')->count());
        $this->assertSame($existing->id, User::where('email', 'returning@example.com')->first()->id);
    }

    public function test_existing_email_password_user_can_link_google_without_duplicate_or_role_change(): void
    {
        $existing = User::factory()->create([
            'email' => 'owner@example.com',
            'google_id' => null,
            'role' => 'restaurant',
        ]);

        // Attacker/careless frontend tries to request role=customer for an
        // account that is actually a restaurant owner - the existing role
        // must never be overwritten.
        $this->mockGoogleUser('google-4', 'owner@example.com', 'Owner Name');

        $this->get('/api/auth/google/callback?state=' . $this->stateFor('customer'))
            ->assertRedirect();

        $this->assertSame(1, User::where('email', 'owner@example.com')->count());
        $existing->refresh();
        $this->assertSame('google-4', $existing->google_id);
        $this->assertSame('restaurant', $existing->role);
    }

    public function test_google_cannot_create_an_admin_account(): void
    {
        $this->mockGoogleUser('google-5', 'wannabe-admin@example.com', 'Wannabe Admin');

        $this->get('/api/auth/google/callback?state=' . $this->stateFor('admin'))
            ->assertRedirect();

        $user = User::where('email', 'wannabe-admin@example.com')->firstOrFail();
        $this->assertSame('customer', $user->role);
    }

    public function test_google_cannot_create_a_rider_account(): void
    {
        $this->mockGoogleUser('google-6', 'wannabe-rider@example.com', 'Wannabe Rider');

        $this->get('/api/auth/google/callback?state=' . $this->stateFor('rider'))
            ->assertRedirect();

        $user = User::where('email', 'wannabe-rider@example.com')->firstOrFail();
        $this->assertSame('customer', $user->role);
    }

    public function test_redirect_endpoint_also_clamps_unknown_roles_to_customer(): void
    {
        // Simulates someone hitting /redirect with role=admin: the state it
        // produces should still only ever resolve to customer downstream.
        $response = $this->get('/api/auth/google/redirect?role=admin');
        $response->assertRedirect();

        $location = $response->headers->get('Location');
        parse_str((string) parse_url($location, PHP_URL_QUERY), $query);
        $decoded = json_decode(base64_decode($query['state']), true);

        $this->assertSame('customer', $decoded['role']);
    }

    public function test_invalid_google_authentication_redirects_to_login_with_error(): void
    {
        Socialite::shouldReceive('driver->stateless->user')
            ->andThrow(new \Exception('invalid_grant'));

        $response = $this->get('/api/auth/google/callback?state=' . $this->stateFor('customer'));

        $response->assertRedirect();
        $this->assertStringContainsString('/login?google_error=', $response->headers->get('Location'));
        $this->assertSame(0, User::count());
    }

    public function test_missing_client_secret_is_reported_clearly_instead_of_hitting_google(): void
    {
        // Reproduces the real production bug: GOOGLE_CLIENT_SECRET="" in
        // .env. Both endpoints must fail fast with a specific error code
        // instead of round-tripping to Google and surfacing a generic
        // "auth_failed"/"cancelled or failed" message.
        config(['services.google.client_secret' => '']);

        $redirectResponse = $this->get('/api/auth/google/redirect?role=customer');
        $redirectResponse->assertRedirect();
        $this->assertStringContainsString('google_error=not_configured', $redirectResponse->headers->get('Location'));
        $this->assertStringNotContainsString('accounts.google.com', (string) $redirectResponse->headers->get('Location'));

        $callbackResponse = $this->get('/api/auth/google/callback?state=' . $this->stateFor('customer'));
        $callbackResponse->assertRedirect();
        $this->assertStringContainsString('google_error=not_configured', $callbackResponse->headers->get('Location'));
        $this->assertSame(0, User::count());
    }

    public function test_google_token_exchange_rejection_is_reported_as_oauth_exchange_failed(): void
    {
        // Simulates exactly what Google's token endpoint returns for a
        // missing/incorrect client secret: HTTP 400 with an OAuth error body.
        $request = new PsrRequest('POST', 'https://www.googleapis.com/oauth2/v4/token');
        $response = new PsrResponse(400, [], json_encode([
            'error' => 'invalid_request',
            'error_description' => 'client_secret is missing.',
        ]));

        Socialite::shouldReceive('driver->stateless->user')
            ->andThrow(new ClientException('400 Bad Request', $request, $response));

        $callbackResponse = $this->get('/api/auth/google/callback?state=' . $this->stateFor('customer'));

        $callbackResponse->assertRedirect();
        $this->assertStringContainsString('google_error=oauth_exchange_failed', $callbackResponse->headers->get('Location'));
        $this->assertSame(0, User::count());
    }

    public function test_unrecognized_role_string_is_rejected_and_clamped_to_customer(): void
    {
        $this->mockGoogleUser('google-9', 'garbage-role@example.com', 'Garbage Role');

        $this->get('/api/auth/google/callback?state=' . $this->stateFor('super-hacker-role'))
            ->assertRedirect();

        $user = User::where('email', 'garbage-role@example.com')->firstOrFail();
        $this->assertSame('customer', $user->role);
    }

    public function test_existing_rider_account_cannot_sign_in_with_google(): void
    {
        // Riders are created exclusively by an admin (see RiderCreationTest)
        // and must keep using the normal email/password login - Google is a
        // public/customer-facing feature and must never become a side-door
        // into a rider account, even without changing its role.
        $rider = User::factory()->create([
            'email' => 'rider@example.com',
            'role' => 'rider',
            'google_id' => null,
        ]);

        $this->mockGoogleUser('google-10', 'rider@example.com', 'Rider Name');

        $response = $this->get('/api/auth/google/callback?state=' . $this->stateFor('customer'));

        $response->assertRedirect();
        $this->assertStringContainsString('google_error=role_not_supported', $response->headers->get('Location'));

        $rider->refresh();
        $this->assertSame('rider', $rider->role);
        $this->assertNull($rider->google_id);
        $this->assertSame(1, User::where('email', 'rider@example.com')->count());
    }

    public function test_existing_admin_account_cannot_sign_in_with_google(): void
    {
        $admin = User::factory()->create([
            'email' => 'admin@example.com',
            'role' => 'admin',
            'google_id' => null,
        ]);

        $this->mockGoogleUser('google-11', 'admin@example.com', 'Admin Name');

        $response = $this->get('/api/auth/google/callback?state=' . $this->stateFor('customer'));

        $response->assertRedirect();
        $this->assertStringContainsString('google_error=role_not_supported', $response->headers->get('Location'));

        $admin->refresh();
        $this->assertSame('admin', $admin->role);
        $this->assertNull($admin->google_id);
    }

    public function test_customer_callback_redirects_to_the_configured_customer_app_url(): void
    {
        // Uses deliberately distinct dummy URLs (rather than the real
        // CUSTOMER_APP_URL/ADMIN_APP_URL from .env) so this test fails loudly
        // if the two ever get swapped again - exactly the production bug
        // that sent a Google sign-in to the wrong React app.
        config([
            'marketplace.customer_app_url' => 'http://customer.test',
            'marketplace.admin_app_url' => 'http://admin.test',
        ]);

        $this->mockGoogleUser('google-12', 'customer-target@example.com');

        $response = $this->get('/api/auth/google/callback?state=' . $this->stateFor('customer'));

        $location = $response->headers->get('Location');
        $this->assertStringStartsWith('http://customer.test/verify-otp?', $location);
        $this->assertStringContainsString('purpose=google_login', $location);
        $this->assertStringNotContainsString('admin.test', $location);
    }

    public function test_restaurant_callback_redirects_to_the_customer_otp_app_url_before_role_redirect(): void
    {
        config([
            'marketplace.customer_app_url' => 'http://customer.test',
            'marketplace.admin_app_url' => 'http://admin.test',
        ]);

        $this->mockGoogleUser('google-13', 'restaurant-target@example.com');

        $response = $this->get('/api/auth/google/callback?state=' . $this->stateFor('restaurant'));

        $location = $response->headers->get('Location');
        $this->assertStringStartsWith('http://customer.test/verify-otp?', $location);
        $this->assertStringContainsString('purpose=google_login', $location);
        $this->assertStringNotContainsString('admin.test', $location);
    }

    public function test_google_restaurant_signup_still_requires_admin_approval(): void
    {
        $this->mockGoogleUser('google-8', 'pendingowner@example.com', 'Pending Owner');

        $this->get('/api/auth/google/callback?state=' . $this->stateFor('restaurant'))
            ->assertRedirect();

        $owner = User::where('email', 'pendingowner@example.com')->firstOrFail();
        $restaurant = Restaurant::where('user_id', $owner->id)->firstOrFail();
        $this->assertSame('pending', $restaurant->status);

        // Pending owners are still blocked from restaurant-write endpoints,
        // exactly like an email/password signup (see RegistrationApprovalTest).
        \Laravel\Sanctum\Sanctum::actingAs($owner);
        $this->postJson('/api/categories', ['name' => 'Snacks'])->assertForbidden();
    }
}
