<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Food;
use App\Models\FoodRecommendation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FoodRecommendationController extends Controller
{
    public function show(Request $request, Food $food): JsonResponse
    {
        $recommendation = FoodRecommendation::where('user_id', $request->user()->id)
            ->where('food_id', $food->id)
            ->first();

        return response()->json([
            'success' => true,
            'recommended' => (bool) $recommendation,
            'rating' => $recommendation?->rating,
        ]);
    }

    public function toggle(Request $request, Food $food): JsonResponse
    {
        $validated = $request->validate([
            'rating' => ['required', 'integer', 'min:1', 'max:5'],
        ]);
        $user = $request->user();
        $recommendation = FoodRecommendation::where('user_id', $user->id)
            ->where('food_id', $food->id)
            ->first();

        if ($recommendation) {
            $recommendation->update(['rating' => $validated['rating']]);
            $recommended = true;
        } else {
            FoodRecommendation::create([
                'user_id' => $user->id,
                'food_id' => $food->id,
                'restaurant_id' => $food->restaurant_id,
                'rating' => $validated['rating'],
            ]);
            $recommended = true;
        }

        return response()->json([
            'success' => true,
            'recommended' => $recommended,
            'recommendations_count' => $food->recommendations()->count(),
        ]);
    }
}
