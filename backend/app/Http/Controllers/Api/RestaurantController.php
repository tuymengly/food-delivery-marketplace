<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Restaurant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use App\Services\CloudinaryImageService;

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

    public function store(Request $request, CloudinaryImageService $imageService): JsonResponse
    {
        $validated = $request->validate([
            ...$this->rules(),
            'owner_email' => ['nullable', 'email', 'unique:users,email', 'required_with:owner_password'],
            'owner_password' => ['nullable', 'string', 'min:8', 'required_with:owner_email'],
        ]);
        $this->validateUploadedImage($request);

        $ownerEmail = $validated['owner_email'] ?? null;
        $ownerPassword = $validated['owner_password'] ?? null;
        unset($validated['owner_email'], $validated['owner_password']);

        // ដោះស្រាយការបញ្ចូលរូបភាព (Image / Cover Image) បើមានផ្ញើមកជា File
        if ($request->hasFile('image')) {
            $validated['image'] = $imageService->upload($request->file('image'), 'restaurants');
        }

        $existingOwner = $request->user();
        $restaurant = DB::transaction(function () use ($validated, $ownerEmail, $ownerPassword, $existingOwner): Restaurant {
            $user = $ownerEmail
                ? \App\Models\User::create([
                    'name' => $validated['name'],
                    'email' => $ownerEmail,
                    'password' => Hash::make($ownerPassword),
                    'role' => 'Restaurant',
                ])
                : $existingOwner;

            if (! $user) {
                abort(422, 'An owner account is required to create a restaurant.');
            }

            return Restaurant::create([
                ...$validated,
                'user_id' => $user->id,
            ]);
        });

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

    public function update(Request $request, Restaurant $restaurant, CloudinaryImageService $imageService): JsonResponse
    {
        $restaurant = $this->findUserRestaurant($request, $restaurant);
        $validated = $request->validate($this->rules());
        $this->validateUploadedImage($request);

        if ($request->hasFile('image')) {
            $validated['image'] = $imageService->upload($request->file('image'), 'restaurants');
        }

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

    public function destroy(Request $request, Restaurant $restaurant): JsonResponse
    {
        // បានបន្ថែម $request ទៅក្នុងនេះដើម្បីជៀសវាង Undefined variable error
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
            // កែសម្រួលឱ្យទទួលយកទាំង String ឬ File រូបភាព
            'image' => ['nullable', 'sometimes'], 
            'status' => ['sometimes', 'string', Rule::in(['active', 'inactive', 'pending'])],
        ];
    }

    private function findUserRestaurant(Request $request, Restaurant $restaurant): Restaurant
    {
        $user = $request->user();

        // អនុញ្ញាតបើជា admin, super_admin ឬម្ចាស់ហាងផ្ទាល់
        if ($user && ($user->role === 'admin' || $user->role === 'super_admin' || $user->id === $restaurant->user_id)) {
            return $restaurant;
        }

        abort(403, 'You do not have permission to modify this restaurant.');
    }
    // ទាញយក Profile របស់ Restaurant តាម User ដែលកំពុង Login
    public function profile(Request $request): JsonResponse
    {
        $user = $request->user();
        $restaurant = Restaurant::where('user_id', $user->id)->first();

        if (! $restaurant) {
            return response()->json([
                'success' => false,
                'message' => 'Restaurant profile not found for this user.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'message' => 'Restaurant profile retrieved successfully.',
            'data' => $restaurant->load('user:id,name,email,role'),
        ]);
    }

    // អាប់ដេត Profile របស់ Restaurant តាម User ដែលកំពុង Login
    public function updateProfile(Request $request, CloudinaryImageService $imageService): JsonResponse
    {
        $user = $request->user();
        $restaurant = Restaurant::where('user_id', $user->id)->first();

        if (! $restaurant) {
            return response()->json([
                'success' => false,
                'message' => 'Restaurant profile not found.',
            ], 404);
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'address' => ['required', 'string', 'max:255'],
            'phone' => ['required', 'string', 'max:50'],
            'image' => ['nullable', 'sometimes'],
            'cuisine' => ['nullable', 'string', 'max:255'],
            'delivery_fee' => ['nullable', 'numeric'],
            'min_order' => ['nullable', 'numeric'],
            'avg_delivery_time' => ['nullable', 'string', 'max:50'],
            'email' => [
                'nullable',
                'email',
                Rule::unique('users', 'email')->ignore($user->id),
            ],
        ]);
        $this->validateUploadedImage($request, 'cover_image');

        if ($request->hasFile('image')) {
            $validated['image'] = $imageService->upload($request->file('image'), 'restaurants');
        }

        // បើផ្ញើមកជា cover_image ពី frontend
        if ($request->hasFile('cover_image')) {
            $validated['image'] = $imageService->upload($request->file('cover_image'), 'restaurants');
        }

        $email = $validated['email'] ?? null;
        unset($validated['email']);

        DB::transaction(function () use ($restaurant, $user, $validated, $email): void {
            $restaurant->update($validated);
            if ($email && $email !== $user->email) {
                $user->update(['email' => $email]);
            }
        });

        return response()->json([
            'success' => true,
            'message' => 'Profile updated successfully.',
            'data' => $restaurant->fresh()->load('user:id,name,email,role'),
        ]);
    }

    private function validateUploadedImage(Request $request, string $field = 'image'): void
    {
        if ($request->hasFile($field)) {
            $request->validate([
                $field => ['file', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
            ]);
        }
    }
}
