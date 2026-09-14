<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\Concerns\InteractsWithOtp;
use Tests\TestCase;

class AuthApiTest extends TestCase
{
    use RefreshDatabase;
    use InteractsWithOtp;

    public function test_user_can_register_and_receives_an_otp_challenge_not_a_token(): void
    {
        Notification::fake();

        $response = $this->postJson('/api/register', [
            'name' => 'Test Customer',
            'email' => 'customer@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.otp_required', true)
            ->assertJsonPath('data.purpose', 'registration')
            ->assertJsonStructure([
                'success',
                'message',
                'data' => ['otp_required', 'challenge_token', 'purpose', 'masked_email', 'expires_in', 'resend_available_in'],
            ])
            ->assertJsonMissing(['token'])
            ->assertJsonMissingPath('data.user');

        $this->assertDatabaseHas('users', ['email' => 'customer@example.com']);
    }

    public function test_correct_registration_otp_verifies_and_issues_a_token(): void
    {
        Notification::fake();

        $response = $this->postJson('/api/register', [
            'name' => 'Test Customer',
            'email' => 'customer@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);
        $challengeToken = $response->json('data.challenge_token');
        $user = User::where('email', 'customer@example.com')->firstOrFail();
        $this->assertNull($user->email_verified_at);
        $code = $this->capturedOtpCodeFor($user);

        $verify = $this->postJson('/api/auth/otp/verify', [
            'challenge_token' => $challengeToken,
            'purpose' => 'registration',
            'code' => $code,
        ]);

        $verify
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.user.role', 'customer')
            ->assertJsonStructure([
                'data' => ['user' => ['id', 'name', 'email', 'role'], 'token', 'token_type'],
            ])
            ->assertJsonMissing(['password']);

        $this->assertNotNull($user->refresh()->email_verified_at);
    }

    public function test_wrong_registration_otp_fails_and_does_not_issue_a_token(): void
    {
        Notification::fake();

        $response = $this->postJson('/api/register', [
            'name' => 'Test Customer',
            'email' => 'customer@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);
        $challengeToken = $response->json('data.challenge_token');
        $user = User::where('email', 'customer@example.com')->firstOrFail();
        $realCode = $this->capturedOtpCodeFor($user);
        $wrongCode = $realCode === '000000' ? '111111' : '000000';

        $this->postJson('/api/auth/otp/verify', [
            'challenge_token' => $challengeToken,
            'purpose' => 'registration',
            'code' => $wrongCode,
        ])
            ->assertUnprocessable()
            ->assertJsonPath('success', false)
            ->assertJsonMissing(['token']);

        $this->assertNull($user->refresh()->email_verified_at);
    }

    public function test_registration_otp_expires(): void
    {
        Notification::fake();

        $response = $this->postJson('/api/register', [
            'name' => 'Test Customer',
            'email' => 'customer@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);
        $challengeToken = $response->json('data.challenge_token');
        $user = User::where('email', 'customer@example.com')->firstOrFail();
        $code = $this->capturedOtpCodeFor($user);

        $this->travel(6)->minutes();

        $this->postJson('/api/auth/otp/verify', [
            'challenge_token' => $challengeToken,
            'purpose' => 'registration',
            'code' => $code,
        ])
            ->assertUnprocessable()
            ->assertJsonPath('success', false)
            ->assertJsonFragment(['code' => ['This code has expired. Please request a new code.']]);
    }

    public function test_registration_otp_cannot_be_reused(): void
    {
        Notification::fake();

        $response = $this->postJson('/api/register', [
            'name' => 'Test Customer',
            'email' => 'customer@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);
        $challengeToken = $response->json('data.challenge_token');
        $user = User::where('email', 'customer@example.com')->firstOrFail();
        $code = $this->capturedOtpCodeFor($user);

        $payload = ['challenge_token' => $challengeToken, 'purpose' => 'registration', 'code' => $code];
        $this->postJson('/api/auth/otp/verify', $payload)->assertOk();

        $this->postJson('/api/auth/otp/verify', $payload)
            ->assertUnprocessable()
            ->assertJsonFragment(['code' => ['This code has already been used.']]);
    }

    public function test_registration_otp_attempt_limit_locks_the_code(): void
    {
        Notification::fake();

        $response = $this->postJson('/api/register', [
            'name' => 'Test Customer',
            'email' => 'customer@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);
        $challengeToken = $response->json('data.challenge_token');
        $user = User::where('email', 'customer@example.com')->firstOrFail();
        $realCode = $this->capturedOtpCodeFor($user);
        $wrongCode = $realCode === '000000' ? '111111' : '000000';

        for ($i = 0; $i < 5; $i++) {
            $this->postJson('/api/auth/otp/verify', [
                'challenge_token' => $challengeToken,
                'purpose' => 'registration',
                'code' => $wrongCode,
            ])->assertUnprocessable();
        }

        // Even the correct code is now rejected - the challenge is dead.
        $this->postJson('/api/auth/otp/verify', [
            'challenge_token' => $challengeToken,
            'purpose' => 'registration',
            'code' => $realCode,
        ])
            ->assertUnprocessable()
            ->assertJsonFragment(['code' => ['This code has expired. Please request a new code.']]);
    }

    public function test_otp_resend_cooldown_blocks_immediate_resend(): void
    {
        Notification::fake();

        $response = $this->postJson('/api/register', [
            'name' => 'Test Customer',
            'email' => 'customer@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);
        $challengeToken = $response->json('data.challenge_token');

        $this->postJson('/api/auth/otp/resend', [
            'challenge_token' => $challengeToken,
            'purpose' => 'registration',
        ])
            ->assertStatus(429)
            ->assertJsonPath('success', false)
            ->assertJsonStructure(['retry_after']);
    }

    public function test_otp_resend_succeeds_after_cooldown_and_invalidates_the_old_code(): void
    {
        Notification::fake();

        $response = $this->postJson('/api/register', [
            'name' => 'Test Customer',
            'email' => 'customer@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);
        $challengeToken = $response->json('data.challenge_token');
        $user = User::where('email', 'customer@example.com')->firstOrFail();
        $firstCode = $this->capturedOtpCodeFor($user);

        $this->travel(61)->seconds();

        $resend = $this->postJson('/api/auth/otp/resend', [
            'challenge_token' => $challengeToken,
            'purpose' => 'registration',
        ]);
        $resend->assertOk()->assertJsonPath('data.otp_required', true);
        $newChallengeToken = $resend->json('data.challenge_token');
        $this->assertNotSame($challengeToken, $newChallengeToken);

        // The old challenge token no longer resolves to anything usable.
        $this->postJson('/api/auth/otp/verify', [
            'challenge_token' => $challengeToken,
            'purpose' => 'registration',
            'code' => $firstCode,
        ])->assertUnprocessable();
    }

    public function test_user_cannot_register_as_admin(): void
    {
        $response = $this->postJson('/api/register', [
            'name' => 'Admin Attempt',
            'email' => 'admin-attempt@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'role' => 'admin',
        ]);

        $response
            ->assertUnprocessable()
            ->assertJsonPath('success', false)
            ->assertJsonValidationErrors(['role']);
    }

    public function test_user_cannot_register_as_rider(): void
    {
        $response = $this->postJson('/api/register', [
            'name' => 'Rider Attempt',
            'email' => 'rider-attempt@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'role' => 'rider',
        ]);

        $response
            ->assertUnprocessable()
            ->assertJsonPath('success', false)
            ->assertJsonValidationErrors(['role']);
    }

    public function test_correct_password_logs_in_directly_with_no_otp(): void
    {
        Notification::fake();
        User::factory()->create([
            'email' => 'customer@example.com',
            'password' => 'password123',
            'role' => 'restaurant',
        ]);

        $response = $this->postJson('/api/login', [
            'email' => 'customer@example.com',
            'password' => 'password123',
        ]);

        $response
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.user.role', 'restaurant')
            ->assertJsonStructure([
                'data' => ['user', 'token', 'token_type'],
            ])
            ->assertJsonMissing(['password'])
            ->assertJsonMissingPath('data.otp_required');

        // Login is single-factor now - it must never touch the OTP system.
        Notification::assertNothingSent();
    }

    public function test_login_returns_unauthorized_for_invalid_credentials(): void
    {
        Notification::fake();
        User::factory()->create([
            'email' => 'customer@example.com',
            'password' => 'password123',
        ]);

        $response = $this->postJson('/api/login', [
            'email' => 'customer@example.com',
            'password' => 'wrong-password',
        ]);

        $response
            ->assertUnauthorized()
            ->assertJsonPath('success', false);

        Notification::assertNothingSent();
    }

    public function test_authenticated_user_can_be_retrieved_and_logged_out(): void
    {
        $user = User::factory()->create();

        $loginResponse = $this->postJson('/api/login', [
            'email' => $user->email,
            'password' => 'password',
        ]);
        $token = $loginResponse->json('data.token');

        $this->withToken($token)
            ->getJson('/api/user')
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.user.email', $user->email)
            ->assertJsonMissing(['password']);

        $this->withToken($token)
            ->postJson('/api/logout')
            ->assertOk()
            ->assertJsonPath('success', true);
    }

    public function test_otp_is_never_returned_in_any_api_response(): void
    {
        Notification::fake();

        $response = $this->postJson('/api/register', [
            'name' => 'Test Customer',
            'email' => 'customer@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);
        $user = User::where('email', 'customer@example.com')->firstOrFail();
        $code = $this->capturedOtpCodeFor($user);

        $this->assertStringNotContainsString($code, $response->getContent());
    }

    public function test_otp_is_stored_hashed_not_in_plaintext(): void
    {
        Notification::fake();

        $this->postJson('/api/register', [
            'name' => 'Test Customer',
            'email' => 'customer@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);
        $user = User::where('email', 'customer@example.com')->firstOrFail();
        $code = $this->capturedOtpCodeFor($user);

        $otp = $user->otpCodes()->latest()->first();
        $this->assertNotSame($code, $otp->otp_hash);
        $this->assertTrue(\Illuminate\Support\Facades\Hash::check($code, $otp->otp_hash));
    }

    public function test_user_can_reset_password_through_a_password_reset_otp(): void
    {
        Notification::fake();
        $user = User::factory()->create(['email' => 'reset@example.com', 'password' => 'old-password']);

        $forgot = $this->postJson('/api/auth/password/forgot', ['email' => $user->email])
            ->assertOk()
            ->assertJsonPath('data.otp_required', true)
            ->assertJsonPath('data.purpose', 'password_reset')
            ->assertJsonMissingPath('data.token');

        $code = $this->capturedOtpCodeFor($user);
        $challengeToken = $forgot->json('data.challenge_token');

        $this->postJson('/api/auth/otp/verify', [
            'challenge_token' => $challengeToken,
            'purpose' => 'password_reset',
            'code' => $code,
        ])
            ->assertOk()
            ->assertJsonPath('data.password_reset_required', true)
            ->assertJsonMissingPath('data.token');

        $this->postJson('/api/auth/password/reset', [
            'challenge_token' => $challengeToken,
            'password' => 'new-password',
            'password_confirmation' => 'new-password',
        ])->assertOk()->assertJsonMissingPath('data.token');

        $this->assertTrue(\Illuminate\Support\Facades\Hash::check('new-password', $user->refresh()->password));
    }

    public function test_password_reset_cannot_set_a_password_before_otp_verification(): void
    {
        Notification::fake();
        $user = User::factory()->create(['email' => 'unverified-reset@example.com']);
        $challenge = $this->postJson('/api/auth/password/forgot', ['email' => $user->email])
            ->json('data.challenge_token');

        $this->postJson('/api/auth/password/reset', [
            'challenge_token' => $challenge,
            'password' => 'new-password',
            'password_confirmation' => 'new-password',
        ])->assertUnprocessable()->assertJsonValidationErrors(['challenge_token']);
    }

    public function test_google_only_user_can_establish_a_password_through_reset_otp(): void
    {
        Notification::fake();
        $user = User::factory()->create([
            'email' => 'google-only@example.com',
            'google_id' => 'google-only-id',
        ]);

        $challenge = $this->postJson('/api/auth/password/forgot', ['email' => $user->email])
            ->json('data.challenge_token');
        $code = $this->capturedOtpCodeFor($user);

        $this->postJson('/api/auth/otp/verify', [
            'challenge_token' => $challenge,
            'purpose' => 'password_reset',
            'code' => $code,
        ])->assertOk();

        $this->postJson('/api/auth/password/reset', [
            'challenge_token' => $challenge,
            'password' => 'google-password',
            'password_confirmation' => 'google-password',
        ])->assertOk();

        $this->assertTrue(\Illuminate\Support\Facades\Hash::check('google-password', $user->refresh()->password));
    }

    public function test_forgot_password_for_an_unknown_email_responds_identically_without_creating_anything(): void
    {
        Notification::fake();

        $response = $this->postJson('/api/auth/password/forgot', ['email' => 'nobody@example.com']);

        // Same 200/shape as a real account, so the response itself can't be
        // used to probe which emails are registered.
        $response
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.otp_required', true)
            ->assertJsonPath('data.purpose', 'password_reset')
            ->assertJsonStructure([
                'data' => ['otp_required', 'challenge_token', 'purpose', 'masked_email', 'expires_in', 'resend_available_in'],
            ]);

        Notification::assertNothingSent();
        $this->assertDatabaseCount('otp_codes', 0);

        // The decoy token is well-formed but resolves to nothing real.
        $this->postJson('/api/auth/otp/verify', [
            'challenge_token' => $response->json('data.challenge_token'),
            'purpose' => 'password_reset',
            'code' => '123456',
        ])->assertUnprocessable();
    }

    public function test_password_reset_challenge_cannot_be_replayed_after_a_successful_reset(): void
    {
        Notification::fake();
        $user = User::factory()->create(['email' => 'replay@example.com', 'password' => 'old-password']);

        $challengeToken = $this->postJson('/api/auth/password/forgot', ['email' => $user->email])
            ->json('data.challenge_token');
        $code = $this->capturedOtpCodeFor($user);

        $this->postJson('/api/auth/otp/verify', [
            'challenge_token' => $challengeToken,
            'purpose' => 'password_reset',
            'code' => $code,
        ])->assertOk();

        $this->postJson('/api/auth/password/reset', [
            'challenge_token' => $challengeToken,
            'password' => 'first-new-password',
            'password_confirmation' => 'first-new-password',
        ])->assertOk();

        // Same already-verified token, tried again with a different password.
        $this->postJson('/api/auth/password/reset', [
            'challenge_token' => $challengeToken,
            'password' => 'second-new-password',
            'password_confirmation' => 'second-new-password',
        ])->assertUnprocessable();

        $this->assertTrue(Hash::check('first-new-password', $user->refresh()->password));
    }

    public function test_password_reset_revokes_existing_sanctum_tokens(): void
    {
        Notification::fake();
        $user = User::factory()->create(['email' => 'revoke@example.com', 'password' => 'old-password']);
        $user->createToken('auth_token');
        $user->createToken('another_device');
        $this->assertSame(2, $user->tokens()->count());

        $challengeToken = $this->postJson('/api/auth/password/forgot', ['email' => $user->email])
            ->json('data.challenge_token');
        $code = $this->capturedOtpCodeFor($user);
        $this->postJson('/api/auth/otp/verify', [
            'challenge_token' => $challengeToken,
            'purpose' => 'password_reset',
            'code' => $code,
        ])->assertOk();
        $this->postJson('/api/auth/password/reset', [
            'challenge_token' => $challengeToken,
            'password' => 'brand-new-password',
            'password_confirmation' => 'brand-new-password',
        ])->assertOk();

        // Every prior session - not just the one used to request the reset -
        // is revoked, straight at the database level (see the guard-caching
        // note above for why this isn't asserted via a second live request).
        $this->assertSame(0, $user->tokens()->count());
    }

    public function test_wrong_password_reset_otp_fails_and_leaves_the_password_unchanged(): void
    {
        Notification::fake();
        $user = User::factory()->create(['email' => 'wrong-reset@example.com', 'password' => 'old-password']);

        $challengeToken = $this->postJson('/api/auth/password/forgot', ['email' => $user->email])
            ->json('data.challenge_token');
        $realCode = $this->capturedOtpCodeFor($user);
        $wrongCode = $realCode === '000000' ? '111111' : '000000';

        $this->postJson('/api/auth/otp/verify', [
            'challenge_token' => $challengeToken,
            'purpose' => 'password_reset',
            'code' => $wrongCode,
        ])->assertUnprocessable();

        $this->assertTrue(Hash::check('old-password', $user->refresh()->password));
    }

    #[DataProvider('passwordResetRoleProvider')]
    public function test_password_reset_works_for_every_role(string $role): void
    {
        Notification::fake();
        $user = User::factory()->create(['email' => "{$role}@example.com", 'password' => 'old-password', 'role' => $role]);

        $challengeToken = $this->postJson('/api/auth/password/forgot', ['email' => $user->email])
            ->json('data.challenge_token');
        $code = $this->capturedOtpCodeFor($user);
        $this->postJson('/api/auth/otp/verify', [
            'challenge_token' => $challengeToken,
            'purpose' => 'password_reset',
            'code' => $code,
        ])->assertOk();
        $this->postJson('/api/auth/password/reset', [
            'challenge_token' => $challengeToken,
            'password' => 'role-new-password',
            'password_confirmation' => 'role-new-password',
        ])->assertOk();

        $this->assertTrue(Hash::check('role-new-password', $user->refresh()->password));

        // The reset account can immediately log in (single-factor, like
        // anyone else) with the new password.
        $this->postJson('/api/login', ['email' => $user->email, 'password' => 'role-new-password'])
            ->assertOk()
            ->assertJsonStructure(['data' => ['user', 'token', 'token_type']]);
    }

    public static function passwordResetRoleProvider(): array
    {
        return [
            'customer' => ['customer'],
            'restaurant owner' => ['restaurant'],
            'rider' => ['rider'],
            'admin' => ['admin'],
        ];
    }

    public function test_password_reset_is_rate_limited(): void
    {
        $user = User::factory()->create(['email' => 'throttle-reset@example.com']);

        for ($i = 0; $i < 5; $i++) {
            $this->postJson('/api/auth/password/forgot', ['email' => $user->email]);
        }

        $this->postJson('/api/auth/password/forgot', ['email' => $user->email])
            ->assertStatus(429);
    }
}
