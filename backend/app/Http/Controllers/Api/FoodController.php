<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use App\Models\Food;
use App\Models\Restaurant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use App\Services\CloudinaryImageService;

class FoodController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Food::with(['restaurant', 'category'])
            ->withCount('recommendations')
            ->latest();
        if ($this->isRestaurantUser($request)) {
            $query->whereIn('restaurant_id', $this->ownedRestaurantIds($request));
        }
        $foods = $query->get();
        return response()->json([
            'success' => true,
            'message' => 'Foods retrieved successfully.',
            'data' => $foods,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request, CloudinaryImageService $imageService): JsonResponse
    {
        $validatedData = $request->validate($this->rules());
        $this->validateUploadedImage($request);
        $this->ensureFoodManager($request);

        if ($this->isRestaurantUser($request)) {
            $ownedRestaurantIds = $this->ownedRestaurantIds($request);
            abort_unless(in_array((int) $validatedData['restaurant_id'], $ownedRestaurantIds, true), 403, 'You can only manage food for your own restaurant.');
        }

        if ($request->hasFile('image')) {
            $validatedData['image'] = $imageService->upload($request->file('image'), 'foods');
        } elseif (empty($validatedData['image'])) {
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
    public function update(Request $request, Food $food, CloudinaryImageService $imageService): JsonResponse
    {
        $this->ensureFoodManager($request);
        $validatedData = $request->validate($this->rules());
        $this->validateUploadedImage($request);

        if ($this->isRestaurantUser($request)) {
            abort_unless(in_array((int) $food->restaurant_id, $this->ownedRestaurantIds($request), true), 403, 'You can only manage food for your own restaurant.');
            $validatedData['restaurant_id'] = $food->restaurant_id;
        }

        if ($request->hasFile('image')) {
            $validatedData['image'] = $imageService->upload($request->file('image'), 'foods');
        }

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
    public function destroy(Request $request, Food $food): JsonResponse
    {
        $this->ensureFoodManager($request);
        if ($this->isRestaurantUser($request)) {
            abort_unless(in_array((int) $food->restaurant_id, $this->ownedRestaurantIds($request), true), 403, 'You can only manage food for your own restaurant.');
        }

        if ($food->orderItems()->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'This food cannot be deleted because it is part of an order. Mark it unavailable instead to preserve order history.',
            ], 422);
        }

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
            'image' => ['nullable'],
            'status' => ['sometimes', 'string', Rule::in(['available', 'unavailable'])],
        ];
    }

    private function isRestaurantUser(Request $request): bool
    {
        return in_array(strtolower((string) $this->authenticatedUser($request)?->role), ['restaurant', 'restaurant admin'], true);
    }

    private function ownedRestaurantIds(Request $request): array
    {
        $user = $this->authenticatedUser($request);

        return $user
            ? Restaurant::where('user_id', $user->id)->pluck('id')->map(fn ($id) => (int) $id)->all()
            : [];
    }

    private function authenticatedUser(Request $request)
    {
        return $request->user() ?: auth('sanctum')->user();
    }

    private function ensureFoodManager(Request $request): void
    {
        $role = strtolower((string) $request->user()?->role);

        abort_unless(
            in_array($role, ['admin', 'super_admin', 'super admin', 'restaurant', 'restaurant admin'], true),
            403,
            'You do not have permission to manage food items.'
        );
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
}
