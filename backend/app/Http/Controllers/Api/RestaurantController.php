<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Restaurant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class RestaurantController extends Controller
{
    public function index(): JsonResponse
    {
        $restaurants = Restaurant::with('user:id,name,email,role')->latest()->get();

        return response()->json([
            'success' => true,
            'message' => 'Restaurants retrieved successfully.',
            'data' => $restaurants,
        ]);
    }

   public function store(Request $request): JsonResponse
{
    $validated = $request->validate($this->rules());

    // ស្វែងរក User ដែលកំពុង Login ឬយក User ទី១ ដែលមានស្រាប់ក្នុង Database
    $user = $request->user() ?? \App\Models\User::first();

    if (!$user) {
        return response()->json([
            'success' => false,
            'message' => 'សូម Register ឬបង្កើត User យ៉ាងហោចណាស់មួយក្នុង Database ជាមុនសិន!',
        ], 400);
    }

    $restaurant = Restaurant::create([
        ...$validated,
        'user_id' => $user->id,
    ]);

    return response()->json([
        'success' => true,
        'message' => 'Restaurant created successfully.',
        'data' => $restaurant->load('user:id,name,email,role'),
    ], 201);
}
    public function show(Restaurant $restaurant): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => 'Restaurant retrieved successfully.',
            'data' => $restaurant->load(['user:id,name,email,role', 'foods.category']),
        ]);
    }

    public function update(Request $request, Restaurant $restaurant): JsonResponse
    {
        $restaurant = $this->findUserRestaurant($request, $restaurant);
        $validated = $request->validate($this->rules());

        $restaurant->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Restaurant updated successfully.',
            'data' => $restaurant->load('user:id,name,email,role'),
        ]);
    }

    public function updateStatus(Request $request, Restaurant $restaurant): JsonResponse
    {
        $validated = $request->validate([
            'status' => ['required', 'string', Rule::in(['active', 'inactive', 'pending'])],
        ]);

        $restaurant->update([
            'status' => strtolower($validated['status']),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Restaurant status updated successfully.',
            'data' => $restaurant->load('user:id,name,email,role'),
        ]);
    }

    public function destroy(Restaurant $restaurant): JsonResponse
    {
        $restaurant = $this->findUserRestaurant($request, $restaurant);
        $restaurant->delete();

        return response()->json([
            'success' => true,
            'message' => 'Restaurant deleted successfully.',
            'data' => null,
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'address' => ['required', 'string', 'max:255'],
            'phone' => ['required', 'string', 'max:50'],
            'image' => ['nullable', 'string', 'max:255'],
            'status' => ['sometimes', 'string', Rule::in(['active', 'inactive', 'pending'])],
        ];
    }

    private function findUserRestaurant(Request $request, Restaurant $restaurant): Restaurant
    {
        if ($request->user()->role === 'admin' || $request->user()->id === $restaurant->user_id) {
            return $restaurant;
        }

        abort(403, 'You do not have permission to modify this restaurant.');
    }
}
