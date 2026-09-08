<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Restaurant;
use App\Models\User;
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
     */
    public function register(Request $request): JsonResponse
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

        $token = $user->createToken('auth_token')->plainTextToken;

        $message = match ($role) {
            'restaurant' => 'Registration successful. Your restaurant application is pending admin approval.',
            default => 'Registration successful.',
        };

        return response()->json([
            'success' => true,
            'message' => $message,
            'data' => [
                'user' => $user->fresh(),
                'token' => $token,
                'token_type' => 'Bearer',
            ],
        ], 201);
    }

    /**
     * Login user and create token
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
     * Logout user (Revoke token)
     */
    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

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
