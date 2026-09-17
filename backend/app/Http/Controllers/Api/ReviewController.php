<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Restaurant;
use App\Models\Review;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ReviewController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Review::with([
            'user:id,name',
            'restaurant:id,name',
            'food:id,name',
            'order:id',
        ])->latest();

        if ($request->is('api/restaurant/reviews')) {
            $restaurantId = $this->resolveRestaurantId($request);

            if (!$restaurantId || !Restaurant::whereKey($restaurantId)->exists()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Not Found!',
                ], 404);
            }

            $query->where('restaurant_id', $restaurantId);
        }

        return response()->json([ 
            'success' => true,
            'data' => $query->get(),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'restaurant_id' => ['required', 'integer', 'exists:restaurants,id'],
            'order_id' => ['nullable', 'integer', 'exists:orders,id'],
            'food_id' => ['nullable', 'integer', 'exists:food,id'],
            'rating' => ['required', 'integer', 'min:1', 'max:5'],
            'comment' => ['required', 'string'],
            'reply' => ['nullable', 'string'],
            'status' => ['sometimes', 'string', Rule::in(['published', 'flagged', 'hidden'])],
            'flag_reason' => ['nullable', 'string'],
        ]);
        $validated['user_id'] = $request->user()->id;
        $validated['status'] = $validated['status'] ?? 'published';

        $review = Review::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Review created successfully.',
            'data' => $review->load(['user:id,name', 'restaurant:id,name', 'food:id,name', 'order:id']),
        ], 201);
    }

    public function reply(Request $request, Review $review): JsonResponse
    {
        $this->ensureRestaurantAccess($request, $review);

        $validated = $request->validate([
            'reply' => ['required', 'string'],
        ]);

        $review->update([
            'reply' => $validated['reply'],
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Reply saved successfully.',
            'data' => $review->load(['user:id,name', 'restaurant:id,name', 'food:id,name', 'order:id']),
        ]);
    }

    public function updateStatus(Request $request, Review $review): JsonResponse
    {
        $this->ensureRestaurantAccess($request, $review);

        $validated = $request->validate([
            'status' => ['required', 'string'],
        ]);

        $status = strtolower($validated['status']);

        if (!in_array($status, ['published', 'flagged', 'hidden'], true)) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid review status.',
                'errors' => [
                    'status' => ['The selected status is invalid.'],
                ],
            ], 422);
        }

        $review->update([
            'status' => $status,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Review status updated successfully.',
            'data' => $review->load(['user:id,name', 'restaurant:id,name', 'food:id,name', 'order:id']),
        ]);
    }

    public function destroy(Request $request, Review $review): JsonResponse
    {
        $this->ensureRestaurantAccess($request, $review);
        $review->delete();

        return response()->json([
            'success' => true,
            'message' => 'Review deleted successfully.',
            'data' => null,
        ]);
    }

    private function resolveRestaurantId(Request $request): ?int
    {
        if (in_array(strtolower((string) $request->user()?->role), ['restaurant', 'restaurant admin'], true)) {
            $restaurantId = Restaurant::where('user_id', $request->user()->id)->value('id');
        } elseif ($request->filled('restaurant_id')) {
            return (int) $request->query('restaurant_id');
        }

        $user = $request->user();

        if ($user) {
            $restaurantId = Restaurant::where('user_id', $user->id)->value('id');

            if ($restaurantId) {
                return (int) $restaurantId;
            }
        }

        return (int) Restaurant::query()->value('id');
    }

    private function ensureRestaurantAccess(Request $request, Review $review): void
    {
        $role = strtolower((string) $request->user()?->role);

        if (in_array($role, ['admin', 'super_admin', 'super admin'], true)) {
            return;
        }

        abort_unless(in_array($role, ['restaurant', 'restaurant admin'], true), 403, 'Only restaurant owners and administrators can manage reviews.');

        $ownsReview = Restaurant::where('user_id', $request->user()->id)
            ->whereKey($review->restaurant_id)
            ->exists();

        abort_unless($ownsReview, 403, 'You can only manage reviews for your own restaurant.');
    }
}
