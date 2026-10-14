<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Restaurant;
use App\Models\Review;
use App\Support\OrderStatuses;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

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

    /**
     * Reviews the authenticated customer already left for the dishes in one
     * order. The customer's order history uses this to tell which dishes of a
     * finished order are still waiting for a rating.
     */
    public function orderIndex(Request $request, Order $order): JsonResponse
    {
        $this->ensureOrderOwner($request, $order);

        return response()->json([
            'success' => true,
            'data' => $order->reviews()
                ->where('type', Review::TYPE_FOOD)
                ->with(['food:id,name,image', 'restaurant:id,name'])
                ->latest()
                ->get(),
        ]);
    }

    /**
     * Rate one dish of a finished order (1-5 stars, optional comment).
     *
     * Only the customer who placed the order may rate it, only once it has
     * actually reached them (delivered/completed - see OrderStatuses::SETTLED),
     * and only a dish that really was part of that order. The restaurant is
     * copied from the order, so a client can never file a rating against
     * someone else's kitchen. Rating the same dish again updates the existing
     * review instead of stacking up duplicates.
     */
    public function storeOrderItem(Request $request, Order $order): JsonResponse
    {
        $this->ensureOrderOwner($request, $order);

        $validated = $request->validate([
            'food_id' => ['required', 'integer', 'exists:food,id'],
            'rating' => ['required', 'integer', 'min:1', 'max:5'],
            'comment' => ['nullable', 'string', 'max:1000'],
        ]);

        if (! OrderStatuses::isSettled($order->status)) {
            throw ValidationException::withMessages([
                'order' => ['You can only rate the food in an order once it has been completed.'],
            ]);
        }

        $foodId = (int) $validated['food_id'];

        if (! $order->items()->where('food_id', $foodId)->exists()) {
            throw ValidationException::withMessages([
                'food_id' => ['This dish was not part of the order.'],
            ]);
        }

        $review = DB::transaction(function () use ($order, $request, $foodId, $validated): Review {
            // Locking the order row serialises concurrent submissions for the
            // same order, so a double tap can't create two reviews for one
            // dish: the second transaction only finds the row once the first
            // has committed, and re-uses it.
            $locked = Order::whereKey($order->id)->lockForUpdate()->firstOrFail();

            $review = Review::firstOrNew([
                'user_id' => $request->user()->id,
                'order_id' => $locked->id,
                'food_id' => $foodId,
            ]);

            $review->fill([
                'restaurant_id' => $locked->restaurant_id,
                'rating' => $validated['rating'],
                'comment' => $validated['comment'] ?? '',
                'type' => Review::TYPE_FOOD,
                'status' => 'published',
            ])->save();

            return $review;
        });

        return response()->json([
            'success' => true,
            'message' => 'Review saved successfully.',
            'data' => $review->load(['food:id,name,image', 'restaurant:id,name']),
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

    /**
     * A 404 (not a 403) for somebody else's order, mirroring
     * OrderController::show: whether another customer placed an order is not
     * this customer's business to find out.
     */
    private function ensureOrderOwner(Request $request, Order $order): void
    {
        abort_unless($order->user_id === $request->user()->id, 404);
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
