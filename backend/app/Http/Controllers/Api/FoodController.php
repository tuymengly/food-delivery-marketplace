<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Food;
use App\Models\Restaurant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class FoodController extends Controller
{
    public function index(): JsonResponse
    {
        $foods = Food::with(['restaurant', 'category'])->latest()->get();

        return response()->json([
            'success' => true,
            'message' => 'Foods retrieved successfully.',
            'data' => $foods,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate($this->rules());

        // Check if user owns the restaurant
        $restaurant = Restaurant::find($validated['restaurant_id']);
        if ($request->user()->role !== 'admin' && $request->user()->id !== $restaurant->user_id) {
            return response()->json([
                'success' => false,
                'message' => 'You do not have permission to create food for this restaurant.',
                'errors' => [
                    'restaurant_id' => ['You must own this restaurant to add food to it.'],
                ],
            ], 403);
        }

        $food = Food::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Food created successfully.',
            'data' => $food->load(['restaurant', 'category']),
        ], 201);
    }

    public function show(Food $food): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => 'Food retrieved successfully.',
            'data' => $food->load(['restaurant', 'category']),
        ]);
    }

    public function update(Request $request, Food $food): JsonResponse
    {
        $this->findUserFood($request, $food);
        $food->update($request->validate($this->rules()));

        return response()->json([
            'success' => true,
            'message' => 'Food updated successfully.',
            'data' => $food->load(['restaurant', 'category']),
        ]);
    }

    public function destroy(Request $request, Food $food): JsonResponse
    {
        $this->findUserFood($request, $food);
        $food->delete();

        return response()->json([
            'success' => true,
            'message' => 'Food deleted successfully.',
            'data' => null,
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function rules(): array
    {
        return [
            'restaurant_id' => ['required', 'integer', 'exists:restaurants,id'],
            'category_id' => ['required', 'integer', 'exists:categories,id'],
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'price' => ['required', 'numeric', 'min:0'],
            'image' => ['nullable', 'string', 'max:255'],
            'status' => ['sometimes', 'string', Rule::in(['available', 'unavailable'])],
        ];
    }

    private function findUserFood(Request $request, Food $food): void
    {
        if (! $food->relationLoaded('restaurant')) {
            $food->load('restaurant');
        }

        if ($request->user()->role === 'admin' || $request->user()->id === $food->restaurant->user_id) {
            return;
        }

        abort(403, 'You do not have permission to modify this food.');
    }
}
