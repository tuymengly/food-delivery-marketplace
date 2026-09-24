<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Rider;
use App\Services\RiderMatchingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class RiderProfileController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        if ($response = $this->ensureRiderUser($request)) {
            return $response;
        }

        $profile = $request->user()->rider;

        if (! $profile) {
            return response()->json([
                'success' => false,
                'message' => 'Rider profile not found.',
                'errors' => [
                    'profile' => ['Create a rider profile first.'],
                ],
            ], 404);
        }

        return response()->json([
            'success' => true,
            'message' => 'Rider profile retrieved successfully.',
            'data' => $profile,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        if ($response = $this->ensureRiderUser($request)) {
            return $response;
        }

        if ($request->user()->rider) {
            return response()->json([
                'success' => false,
                'message' => 'Rider profile already exists.',
                'errors' => [
                    'profile' => ['This user already has a rider profile.'],
                ],
            ], 422);
        }

        $profile = $request->user()->rider()->create($this->validatedProfile($request));

        return response()->json([
            'success' => true,
            'message' => 'Rider profile created successfully.',
            'data' => $profile,
        ], 201);
    }

    public function update(Request $request): JsonResponse
    {
        if ($response = $this->ensureRiderUser($request)) {
            return $response;
        }

        $profile = $request->user()->rider;

        if (! $profile) {
            return response()->json([
                'success' => false,
                'message' => 'Rider profile not found.',
                'errors' => [
                    'profile' => ['Create a rider profile first.'],
                ],
            ], 404);
        }

        $profile->update($this->validatedProfile($request));

        return response()->json([
            'success' => true,
            'message' => 'Rider profile updated successfully.',
            'data' => $profile->refresh(),
        ]);
    }

    public function availability(Request $request): JsonResponse
    {
        if ($response = $this->ensureRiderUser($request)) {
            return $response;
        }

        $validated = $request->validate([
            'is_available' => ['required', 'boolean'],
        ]);

        $profile = $request->user()->rider;

        if (! $profile) {
            return response()->json([
                'success' => false,
                'message' => 'Rider profile not found.',
                'errors' => [
                    'profile' => ['Create a rider profile first.'],
                ],
            ], 404);
        }

        // Query-based write: the model in $profile may have been cached from an
        // earlier read in this request and Eloquent skips an update when
        // nothing is dirty, which would leave the rider unavailable/unmatched.
        Rider::whereKey($profile->id)->update($validated);

        // Coming back available may unblock an order nobody could be matched
        // to earlier (WAITING_FOR_RIDER) - retry it for this rider now rather
        // than waiting for the next order to trigger a fresh match.
        app(RiderMatchingService::class)->assignWaitingDeliveryToRider($profile->refresh());

        return response()->json([
            'success' => true,
            'message' => 'Rider availability updated successfully.',
            'data' => $profile->refresh(),
        ]);
    }

    public function updateLocation(Request $request): JsonResponse
    {
        if ($response = $this->ensureRiderUser($request)) {
            return $response;
        }

        $validated = $request->validate([
            'latitude' => ['required', 'numeric', 'between:-90,90'],
            'longitude' => ['required', 'numeric', 'between:-180,180'],
        ]);

        $profile = $request->user()->rider;

        if (! $profile) {
            return response()->json([
                'success' => false,
                'message' => 'Rider profile not found.',
                'errors' => [
                    'profile' => ['Create a rider profile first.'],
                ],
            ], 404);
        }

        $profile->update([
            'current_latitude' => $validated['latitude'],
            'current_longitude' => $validated['longitude'],
            'location_updated_at' => now(),
        ]);

        // A fresh location fix can also be what makes this rider eligible
        // (the matching query requires a recent location_updated_at) -
        // retry any order still waiting for a rider.
        app(RiderMatchingService::class)->assignWaitingDeliveryToRider($profile->refresh());

        return response()->json([
            'success' => true,
            'message' => 'Rider location updated successfully.',
            'data' => $profile->refresh(),
        ]);
    }

    public function updateOnlineStatus(Request $request): JsonResponse
    {
        if ($response = $this->ensureRiderUser($request)) {
            return $response;
        }

        $validated = $request->validate([
            'is_online' => ['required', 'boolean'],
        ]);

        $profile = $request->user()->rider;

        if (! $profile) {
            return response()->json([
                'success' => false,
                'message' => 'Rider profile not found.',
                'errors' => [
                    'profile' => ['Create a rider profile first.'],
                ],
            ], 404);
        }

        // Query-based for the same reason as availability() above.
        Rider::whereKey($profile->id)->update($validated);

        // Coming online can also unblock a waiting order for the same reason
        // as availability() above.
        app(RiderMatchingService::class)->assignWaitingDeliveryToRider($profile->refresh());

        return response()->json([
            'success' => true,
            'message' => 'Rider online status updated successfully.',
            'data' => $profile->refresh(),
        ]);
    }

    private function ensureRiderUser(Request $request): ?JsonResponse
    {
        if (strtolower((string) $request->user()->role) === 'rider') {
            return null;
        }

        return response()->json([
            'success' => false,
            'message' => 'Only riders can access this endpoint.',
            'errors' => [
                'role' => ['The authenticated user must have the rider role.'],
            ],
        ], 403);
    }

    /**
     * @return array<string, mixed>
     */
    private function validatedProfile(Request $request): array
    {
        return $request->validate([
            'vehicle_type' => ['required', 'string', Rule::in(Rider::VEHICLE_TYPES)],
            'vehicle_number' => ['required', 'string', 'max:50'],
            'phone' => ['required', 'string', 'max:50'],
            'status' => ['sometimes', 'string', Rule::in(Rider::STATUSES)],
            'is_available' => ['sometimes', 'boolean'],
        ]);
    }
}
