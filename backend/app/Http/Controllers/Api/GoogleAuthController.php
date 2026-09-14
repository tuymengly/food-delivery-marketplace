<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\OtpCode;
use App\Models\Restaurant;
use App\Models\User;
use App\Services\OtpService;
use GuzzleHttp\Exception\ClientException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Laravel\Socialite\Facades\Socialite;
use Laravel\Socialite\Two\User as SocialiteUser;
use Throwable;

/**
 * "Continue with Google" for the public marketplace.
 *
 * This is a pure browser-redirect flow (frontend link -> here -> Google ->
 * here -> frontend), not an XHR/JSON endpoint, so every response is a
 * redirect - errors included - rather than a JSON payload. On success this
 * never hands back a Sanctum token directly - like AuthController's
 * register()/login(), Google sign-in only ever completes via an OTP
 * challenge (OtpCode::PURPOSE_GOOGLE_LOGIN), so the browser is sent to
 * customer-frontend's OTP page with a ?challenge=/&purpose= pair instead of
 * a ?token=. That page verifies the code, gets the real Sanctum token from
 * POST /api/auth/otp/verify, and only then applies the existing role-based
 * redirect (customer stays; restaurant/rider/admin hand off to
 * admin-restaurant) - the same single redirect logic every login path uses,
 * rather than a second copy of it living here.
 *
 * Like AuthController::register(), this can only ever create 'customer' or
 * 'restaurant' accounts - admin and rider accounts are never reachable
 * through public registration of any kind (see class docblock there).
 */
class GoogleAuthController extends Controller
{
    private const ALLOWED_ROLES = ['customer', 'restaurant'];

    /**
     * Step 1: send the browser to Google's consent screen.
     *
     * The intended role travels in the OAuth `state` param (not trusted for
     * anything privileged - see callback(), which re-validates it against
     * the same whitelist regardless of what arrives). Socialite's
     * ->stateless() is used so this works without a shared session between
     * the frontend origin and this API, matching the rest of the API being
     * stateless/token-based.
     */
    public function redirect(Request $request): RedirectResponse
    {
        if (! $this->isGoogleConfigured()) {
            Log::error('Google OAuth redirect blocked: GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET is not set in .env.');

            return $this->toLogin('not_configured');
        }

        $role = $this->sanitizeRole($request->query('role'));

        $state = base64_encode(json_encode([
            'role' => $role,
            'nonce' => Str::random(24),
        ]));

        return Socialite::driver('google')
            ->stateless()
            ->with(['state' => $state])
            ->redirect();
    }

    /**
     * Step 2: Google redirects back here with ?code=&state=.
     *
     * Each stage below (fetching the Google identity vs. creating/loading
     * our own User row) is wrapped in its own try/catch and reports a
     * distinct ?google_error= code. This matters because "Google rejected
     * the request" (misconfigured client id/secret, expired code) and "our
     * own account-creation logic threw" are different bugs with different
     * fixes - collapsing them into one generic message is exactly what made
     * this failure hard to diagnose from the frontend alone. The specific
     * exception is always logged server-side (never sent to the browser).
     */
    public function callback(Request $request, OtpService $otpService): RedirectResponse
    {
        if (! $this->isGoogleConfigured()) {
            Log::error('Google OAuth callback blocked: GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET is not set in .env.');

            return $this->toLogin('not_configured');
        }

        try {
            /** @var SocialiteUser $googleUser */
            $googleUser = Socialite::driver('google')->stateless()->user();
        } catch (ClientException $e) {
            // Google's own token endpoint rejected the request - almost
            // always a credentials/config mismatch (missing or wrong
            // GOOGLE_CLIENT_SECRET, wrong GOOGLE_CLIENT_ID, or a redirect_uri
            // that doesn't exactly match what's registered in Google Cloud
            // Console) rather than anything the end user did.
            $body = (string) $e->getResponse()?->getBody();
            Log::error('Google OAuth token exchange rejected by Google.', [
                'status' => $e->getResponse()?->getStatusCode(),
                'body' => $body,
            ]);

            return $this->toLogin('oauth_exchange_failed');
        } catch (Throwable $e) {
            // Anything else: expired/reused authorization code, user denied
            // consent, malformed state, network failure to Google, etc.
            Log::warning('Google OAuth callback failed before a Google identity could be retrieved.', [
                'exception' => $e::class,
                'error' => $e->getMessage(),
            ]);

            return $this->toLogin('auth_failed');
        }

        $email = $googleUser->getEmail();

        if (! $email) {
            return $this->toLogin('no_email');
        }

        $requestedRole = $this->sanitizeRole($this->decodeStateRole($request->query('state')));

        // Look up any existing account first (plain reads - no need for a
        // transaction here). Google sign-in is a public/customer-facing
        // feature: an existing account is only allowed through it if that
        // account's role is itself one of the public roles. A rider or admin
        // account must keep using the normal email/password login - Google
        // never creates those roles, and it must not become a side-door
        // login for them either (see class docblock).
        $existingUser = User::where('google_id', $googleUser->getId())->first()
            ?? User::where('email', $email)->first();

        if ($existingUser && ! in_array(strtolower($existingUser->role), self::ALLOWED_ROLES, true)) {
            Log::warning('Google sign-in attempted on a non-public-role account; rejected.', [
                'user_id' => $existingUser->id,
                'role' => $existingUser->role,
            ]);

            return $this->toLogin('role_not_supported');
        }

        try {
            $user = DB::transaction(function () use ($googleUser, $email, $requestedRole, $existingUser): User {
                // 1) Already linked to this exact Google account, or an
                // existing account for this (verified) email address - link
                // google_id if missing and log in as that user. The existing
                // role is never touched, whatever the frontend asked for.
                if ($existingUser) {
                    if (! $existingUser->google_id) {
                        $existingUser->forceFill(['google_id' => $googleUser->getId()])->save();
                    }

                    return $existingUser;
                }

                // 2) Brand new account. $requestedRole is already clamped to
                // customer/restaurant by sanitizeRole() above.
                $newUser = User::create([
                    'name' => $googleUser->getName() ?: $googleUser->getNickname() ?: 'Google User',
                    'email' => $email,
                    'google_id' => $googleUser->getId(),
                    // Google-authenticated accounts never log in with a
                    // password, but the column is NOT NULL, so store an
                    // unguessable random hash - nobody is ever told this value.
                    'password' => Hash::make(Str::random(40)),
                    'role' => $requestedRole,
                    'status' => 'Active',
                    'profile_image' => $googleUser->getAvatar(),
                    'email_verified_at' => now(),
                ]);

                if ($requestedRole === 'restaurant') {
                    Restaurant::create([
                        'user_id' => $newUser->id,
                        'name' => $newUser->name . "'s Restaurant",
                        'address' => 'Not set yet',
                        'phone' => 'Not set yet',
                        // Always pending, exactly like AuthController::register() -
                        // only an admin can activate it via the existing
                        // PUT /restaurants/{restaurant}/status endpoint.
                        'status' => 'pending',
                    ]);
                }

                return $newUser;
            });
        } catch (Throwable $e) {
            // A real bug in our own account creation, not a Google/OAuth
            // problem - report it as such so it isn't mistaken for a
            // credentials issue.
            Log::error('Google OAuth succeeded but local account creation failed.', [
                'exception' => $e::class,
                'error' => $e->getMessage(),
                'email' => $email,
            ]);

            return $this->toLogin('account_error');
        }

        $challenge = $otpService->issueChallenge($user, OtpCode::PURPOSE_GOOGLE_LOGIN);

        return redirect()->away($this->toOtpPage($challenge));
    }

    private function isGoogleConfigured(): bool
    {
        return filled(config('services.google.client_id'))
            && filled(config('services.google.client_secret'));
    }

    private function toLogin(string $errorCode): RedirectResponse
    {
        $customerAppUrl = rtrim(config('marketplace.customer_app_url'), '/');

        return redirect()->away($customerAppUrl . '/login?google_error=' . $errorCode);
    }

    private function sanitizeRole(?string $role): string
    {
        return in_array($role, self::ALLOWED_ROLES, true) ? $role : 'customer';
    }

    private function decodeStateRole(?string $state): ?string
    {
        if (! $state) {
            return null;
        }

        $decoded = json_decode(base64_decode($state, true) ?: '', true);

        return is_array($decoded) ? ($decoded['role'] ?? null) : null;
    }

    /**
     * customer-frontend is the one canonical place OTP is entered for every
     * role (see AuthController's login()/register() using the same page) -
     * admin-restaurant has no login UI of its own and only ever receives a
     * finished session via the existing ?token= handoff, which only happens
     * after OTP succeeds there.
     */
    private function toOtpPage(array $challenge): string
    {
        $customerAppUrl = rtrim(config('marketplace.customer_app_url'), '/');

        $query = http_build_query([
            'challenge' => $challenge['challenge_token'],
            'purpose' => $challenge['purpose'],
            'email' => $challenge['masked_email'],
        ]);

        return $customerAppUrl . '/verify-otp?' . $query;
    }
}
