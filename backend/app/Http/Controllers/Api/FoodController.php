<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Food;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class FoodController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(): JsonResponse
    {
        $foods = Food::with(['restaurant', 'category'])->latest()->get();

        return response()->json([
            'success' => true,
            'message' => 'Foods retrieved successfully.',
            'data' => $foods,
        ]);
    }
    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request): JsonResponse
    {
        $validatedData = $request->validate($this->rules());

        if (empty($validatedData['image'])) {
            $validatedData['image'] = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100&auto=format&fit=crop&q=80';
        }
        $food = Food::create($validatedData);
        return response()->json([
            'success' => true,
            'message' => 'Food created successfully.',
            'data' => $food->load(['restaurant', 'category']),
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Food $food): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => 'Food retrieved successfully.',
            'data' => $food->load(['restaurant', 'category']),
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Food $food): JsonResponse
    {
        $validatedData = $request->validate($this->rules());

        $food->update($validatedData);

        return response()->json([
            'success' => true,
            'message' => 'Food updated successfully.',
            'data' => $food->load(['restaurant', 'category']),
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
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
     * Validation rules for store and update.
     * 
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