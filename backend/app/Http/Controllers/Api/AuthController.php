<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\OtpCode;
use App\Models\Restaurant;
use App\Models\User;
use App\Services\OtpService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class AuthController extends Controller
{
    /**
     * Register a new user.
     *
     * Public registration only ever creates customer or restaurant
     * accounts. Admin and rider accounts can never be self-registered —
     * riders are created exclusively by an admin via POST /api/drivers
     * after an off-platform interview, so 'rider' is deliberately absent
     * from the allowed role list below.
     *
     * A Sanctum token is never issued here directly - the account exists
     * once this returns, but is only usable after the OTP challenge this
     * response describes is completed via verifyOtp() (see class docblock
     * there and OtpService).
     */
    public function register(Request $request, OtpService $otpService): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
            'role' => ['sometimes', 'string', 'in:customer,restaurant'],

            // Required only when registering as a restaurant owner.
            'restaurant_name' => ['required_if:role,restaurant', 'nullable', 'string', 'max:255'],
            'restaurant_address' => ['required_if:role,restaurant', 'nullable', 'string', 'max:255'],
            'restaurant_phone' => ['required_if:role,restaurant', 'nullable', 'string', 'max:50'],
            'restaurant_description' => ['nullable', 'string'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $validated = $validator->validated();
        $role = $validated['role'] ?? 'customer';

        $user = DB::transaction(function () use ($validated, $role): User {
            $user = User::create([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'password' => Hash::make($validated['password']),
                'role' => $role,
                // Both public roles are usable immediately; restaurant
                // owners are gated by their Restaurant's own pending
                // status instead (see Category/FoodController), not the
                // user account itself.
                'status' => 'Active',
            ]);

            if ($role === 'restaurant') {
                Restaurant::create([
                    'user_id' => $user->id,
                    'name' => $validated['restaurant_name'],
                    'address' => $validated['restaurant_address'],
                    'phone' => $validated['restaurant_phone'],
                    'description' => $validated['restaurant_description'] ?? null,
                    // Always pending on self-registration; only an admin can
                    // activate it via PUT /restaurants/{restaurant}/status.
                    'status' => 'pending',
                ]);
            }

            return $user;
        });

        $challenge = $otpService->issueChallenge($user, OtpCode::PURPOSE_REGISTRATION);

        $message = match ($role) {
            'restaurant' => 'Registration successful. Your restaurant application is pending admin approval. We sent a verification code to your email.',
            default => 'Registration successful. We sent a verification code to your email.',
        };

        return response()->json([
            'success' => true,
            'message' => $message,
            'data' => $challenge,
        ], 201);
    }

    /**
     * Verify a password and, on success, issue a Sanctum token directly.
     *
     * Email/password login is intentionally single-factor - unlike
     * register() and GoogleAuthController's callback(), which both require
     * an OTP challenge before a token is issued, a correct password alone
     * is enough here. OTP still guards registration, Google sign-in, and
     * password reset (see OtpService) - it was deliberately removed from
     * this endpoint only.
     */
    public function login(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'email' => ['required', 'string', 'email'],
            'password' => ['required', 'string'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $user = User::where('email', $request->email)->first();

        if (! $user || ! Hash::check($request->password, $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid email or password.',
                'errors' => [
                    'email' => ['The provided credentials are incorrect.'],
                ],
            ], 401);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Login successful.',
            'data' => [
                'user' => $user,
                'token' => $token,
                'token_type' => 'Bearer',
            ],
        ]);
    }

    /**
     * Start a password-reset OTP challenge. The response is deliberately
     * identical for known and unknown emails to prevent account enumeration.
     */
    public function forgotPassword(Request $request, OtpService $otpService): JsonResponse
    {
        $validated = Validator::make($request->all(), [
            'email' => ['required', 'string', 'email'],
        ])->validate();

        $user = User::where('email', $validated['email'])->first();

        $challenge = $user
            ? $otpService->issueChallenge($user, OtpCode::PURPOSE_PASSWORD_RESET)
            : $otpService->decoyPasswordResetChallenge($validated['email']);

        return response()->json([
            'success' => true,
            'message' => 'If an account exists for that email, we sent a password reset code.',
            'data' => $challenge,
        ]);
    }

    /**
    * Complete an OTP challenge. Password-reset verification deliberately
    * returns no Sanctum token; it only authorizes the reset-password step.
     */
    public function verifyOtp(Request $request, OtpService $otpService): JsonResponse
    {
        $validated = Validator::make($request->all(), [
            'challenge_token' => ['required', 'string'],
            'purpose' => ['required', 'string', 'in:' . implode(',', OtpCode::PURPOSES)],
            'code' => ['required', 'string'],
        ])->validate();

        $user = $otpService->verify($validated['challenge_token'], $validated['purpose'], $validated['code']);

        if ($validated['purpose'] === OtpCode::PURPOSE_PASSWORD_RESET) {
            return response()->json([
                'success' => true,
                'message' => 'Code verified. You can now set a new password.',
                'data' => ['password_reset_required' => true],
            ]);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Verification successful.',
            'data' => [
                'user' => $user->fresh(),
                'token' => $token,
                'token_type' => 'Bearer',
            ],
        ]);
    }

    /**
     * Invalidate the current code for this challenge and send a fresh one,
     * subject to OtpCode::RESEND_COOLDOWN_SECONDS (see OtpService).
     */
    public function resendOtp(Request $request, OtpService $otpService): JsonResponse
    {
        $validated = Validator::make($request->all(), [
            'challenge_token' => ['required', 'string'],
            'purpose' => ['required', 'string', 'in:' . implode(',', OtpCode::PURPOSES)],
        ])->validate();

        $challenge = $otpService->resend($validated['challenge_token'], $validated['purpose']);

        return response()->json([
            'success' => true,
            'message' => 'A new verification code has been sent.',
            'data' => $challenge,
        ]);
    }

    /**
     * Set a new password using a successfully verified password-reset OTP.
     */
    public function resetPassword(Request $request, OtpService $otpService): JsonResponse
    {
        $validated = Validator::make($request->all(), [
            'challenge_token' => ['required', 'string'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ])->validate();

        $user = $otpService->consumePasswordResetChallenge($validated['challenge_token']);
        $user->forceFill(['password' => Hash::make($validated['password'])])->save();

        // A password reset is a strong signal to end every other active
        // session - otherwise a token stolen before the reset would keep
        // working right through the action meant to lock that attacker out.
        $user->tokens()->delete();

        return response()->json([
            'success' => true,
            'message' => 'Password reset successfully. Please sign in.',
        ]);
    }

    /**
     * Logout user (Revoke token)
     *
     * The token is revoked in the database, so every other app/tab holding
     * the same token (customer-frontend and admin-restaurant run on
     * different origins and therefore have separate localStorage) is
     * invalidated server-side too - each one clears itself on its next
     * request once Laravel answers 401.
     */
    public function logout(Request $request): JsonResponse
    {
        $request->user()?->currentAccessToken()?->delete();

        return response()->json([
            'success' => true,
            'message' => 'Logout successful.',
            'data' => null,
        ]);
    }

    /**
     * Get authenticated user
     */
    public function user(Request $request): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => 'Authenticated user retrieved successfully.',
            'data' => [
                'user' => $request->user(),
            ],
        ]);
    }

    /**
     * Update the authenticated user's own profile.
     */
    public function updateUserProfile(Request $request): JsonResponse
    {
        $user = $request->user();
        $validator = Validator::make($request->all(), [
            'name' => ['required', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:50'],
            'profile_image' => ['nullable', 'url', 'max:2048'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $user->update($validator->validated());

        return response()->json([
            'success' => true,
            'message' => 'Profile updated successfully.',
            'data' => $user->fresh(),
        ]);
    }

    /**
     * Get Admin Profile
     */
    public function profile(Request $request): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => 'Profile retrieved successfully.',
            'data' => $request->user(),
        ]);
    }

    /**
     * Update Admin Profile
     */
    public function updateProfile(Request $request): JsonResponse
    {
        $user = $request->user();

        $validator = Validator::make($request->all(), [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email,' . $user->id],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $user->update($validator->validated());

        return response()->json([
            'success' => true,
            'message' => 'Profile updated successfully.',
            'data' => $user,
        ]);
    }

    /**
     * Change Password
     */
    public function changePassword(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'current_password' => ['required', 'string'],
            'new_password' => ['required', 'string', 'min:8'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $user = $request->user();

        if (! Hash::check($request->current_password, $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'ពាក្យសម្ងាត់ចាស់មិនត្រឹមត្រូវ!',
                'errors' => [
                    'current_password' => ['The provided password does not match our records.'],
                ],
            ], 422);
        }

        $user->update([
            'password' => Hash::make($request->new_password),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Password updated successfully.',
            'data' => null,
        ]);
    }
}
