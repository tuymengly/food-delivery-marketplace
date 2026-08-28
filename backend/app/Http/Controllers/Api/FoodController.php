<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Food;
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
        $food = Food::create($request->validate($this->rules()));

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
        $food->update($request->validate($this->rules()));

        return response()->json([
            'success' => true,
            'message' => 'Food updated successfully.',
            'data' => $food->load(['restaurant', 'category']),
        ]);
    }

    public function destroy(Food $food): JsonResponse
    {
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
}
