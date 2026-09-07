<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Restaurant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use App\Services\CloudinaryImageService;

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

    public function store(Request $request, CloudinaryImageService $imageService): JsonResponse
    {
        $validated = $request->validate($this->rules());
        $this->validateUploadedImage($request);
        $user = $request->user();

        if ($this->isRestaurantUser($request)) {
            $restaurantId = Restaurant::where('user_id', $user->id)->value('id');
            abort_unless($restaurantId, 403, 'Restaurant profile not found.');
            $validated['restaurant_id'] = $restaurantId;
        }

        if ($request->hasFile('image')) {
            $validated['image'] = $imageService->upload($request->file('image'), 'categories');
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

    public function update(Request $request, Category $category, CloudinaryImageService $imageService): JsonResponse
    {
        $this->ensureCategoryManager($request);
        $this->ensureCategoryAccess($request, $category);
        $validated = $request->validate($this->rules());
        $this->validateUploadedImage($request);

        if ($request->hasFile('image')) {
            $validated['image'] = $imageService->upload($request->file('image'), 'categories');
        }

        $category->update($validated);

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

        if ($category->foods()->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'This category cannot be deleted while it has food items. Move or delete the food items first.',
            ], 422);
        }

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
            'image' => ['nullable'],
        ];
    }

    private function validateUploadedImage(Request $request): void
    {
        if ($request->hasFile('image')) {
            $request->validate([
                'image' => ['file', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
            ]);
        } elseif ($request->filled('image')) {
            $request->validate([
                'image' => ['string', 'max:2048'],
            ]);
        }
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
