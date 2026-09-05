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
                    'message' => 'រកមិនឃើញទិន្នន័យហាងឡើយ!',
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
        $review = Review::create($request->validate([
            'restaurant_id' => ['required', 'integer', 'exists:restaurants,id'],
            'user_id' => ['nullable', 'integer', 'exists:users,id'],
            'order_id' => ['nullable', 'integer', 'exists:orders,id'],
            'food_id' => ['nullable', 'integer', 'exists:food,id'],
            'rating' => ['required', 'integer', 'min:1', 'max:5'],
            'comment' => ['required', 'string'],
            'reply' => ['nullable', 'string'],
            'status' => ['sometimes', 'string', Rule::in(['published', 'flagged', 'hidden'])],
            'flag_reason' => ['nullable', 'string'],
        ]));

        return response()->json([
            'success' => true,
            'message' => 'Review created successfully.',
            'data' => $review->load(['user:id,name', 'restaurant:id,name', 'food:id,name', 'order:id']),
        ], 201);
    }

    public function reply(Request $request, Review $review): JsonResponse
    {
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

    public function destroy(Review $review): JsonResponse
    {
        $review->delete();

        return response()->json([
            'success' => true,
            'message' => 'Review deleted successfully.',
            'data' => null,
        ]);
    }

    private function resolveRestaurantId(Request $request): ?int
    {
        if ($request->filled('restaurant_id')) {
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
}
