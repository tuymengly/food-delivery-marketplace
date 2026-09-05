<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Restaurant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CategoryController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Category::latest();

        $user = $request->user() ?: auth('sanctum')->user();

        if ($this->isRestaurantUser($request)) {
            $restaurantIds = Restaurant::where('user_id', $user->id)->pluck('id');
            $query->withCount(['foods' => fn ($foodQuery) => $foodQuery->whereIn('restaurant_id', $restaurantIds)]);
            $query->where(function ($categoryQuery) use ($restaurantIds): void {
                $categoryQuery->whereIn('restaurant_id', $restaurantIds)
                    ->orWhere(function ($globalQuery) use ($restaurantIds): void {
                        $globalQuery->whereNull('restaurant_id')
                            ->whereHas('foods', fn ($foodQuery) => $foodQuery->whereIn('restaurant_id', $restaurantIds));
                    });
            });
        } else {
            $query->withCount('foods');
        }

        $categories = $query->get();

        return response()->json([
            'success' => true,
            'message' => 'Categories retrieved successfully.',
            'data' => $categories,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate($this->rules());
        $user = $request->user();

        if ($this->isRestaurantUser($request)) {
            $restaurantId = Restaurant::where('user_id', $user->id)->value('id');
            abort_unless($restaurantId, 403, 'Restaurant profile not found.');
            $validated['restaurant_id'] = $restaurantId;
        }

        $category = Category::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Category created successfully.',
            'data' => $category,
        ], 201);
    }

    public function show(Category $category): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => 'Category retrieved successfully.',
            'data' => $category->load('foods.restaurant'),
        ]);
    }

    public function update(Request $request, Category $category): JsonResponse
    {
        $this->ensureCategoryManager($request);
        $this->ensureCategoryAccess($request, $category);
        $category->update($request->validate($this->rules()));

        return response()->json([
            'success' => true,
            'message' => 'Category updated successfully.',
            'data' => $category,
        ]);
    }

    public function destroy(Request $request, Category $category): JsonResponse
    {
        $this->ensureCategoryManager($request);
        $this->ensureCategoryAccess($request, $category);
        $category->delete();

        return response()->json([
            'success' => true,
            'message' => 'Category deleted successfully.',
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
        ];
    }

    private function ensureCategoryManager(Request $request): void
    {
        $role = strtolower((string) $request->user()?->role);
        if (! in_array($role, ['admin', 'super_admin', 'super admin', 'restaurant', 'restaurant admin'], true)) {
            abort(403, 'Only administrators or restaurant owners can modify categories.');
        }
    }

    private function ensureCategoryAccess(Request $request, Category $category): void
    {
        $role = strtolower((string) $request->user()?->role);
        if (in_array($role, ['admin', 'super_admin', 'super admin'], true)) return;

        $ownedRestaurantIds = Restaurant::where('user_id', $request->user()->id)->pluck('id');
        abort_unless($category->restaurant_id && $ownedRestaurantIds->contains($category->restaurant_id), 403, 'You can only manage categories for your own restaurant.');
    }

    private function isRestaurantUser(Request $request): bool
    {
        $user = $request->user() ?: auth('sanctum')->user();

        return in_array(strtolower((string) $user?->role), ['restaurant', 'restaurant admin'], true);
    }
}
