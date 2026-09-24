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
use App\Services\RiderMatchingService;

class RestaurantController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Restaurant::query()
            ->with('user:id,name,email,role')
            ->withAvg(['reviews as rating' => fn ($review) => $review->where('status', 'published')], 'rating')
            ->withCount(['reviews as reviews_count' => fn ($review) => $review->where('status', 'published')])
            ->where('status', 'active');

        $cuisines = collect(explode(',', (string) $request->query('cuisines', '')))
            ->map(fn (string $cuisine) => trim($cuisine))
            ->filter()
            ->values();

        if ($cuisines->isNotEmpty()) {
            $cuisineOperator = DB::getDriverName() === 'pgsql' ? 'ilike' : 'like';
            $query->where(function ($restaurantQuery) use ($cuisines, $cuisineOperator): void {
                foreach ($cuisines as $cuisine) {
                    $restaurantQuery->orWhere('cuisine', $cuisineOperator, '%' . $cuisine . '%');
                }
            });
        }

        if ($request->boolean('accepts_vouchers')) {
            $query->where('accepts_vouchers', true);
        }

        $latitude = $request->query('latitude');
        $longitude = $request->query('longitude');
        $hasCoordinates = is_numeric($latitude) && is_numeric($longitude);

        if ($hasCoordinates) {
            $distanceExpression = '(6371 * acos(cos(radians(?)) * cos(radians(latitude)) * cos(radians(longitude) - radians(?)) + sin(radians(?)) * sin(radians(latitude))))';
            $query->select('restaurants.*')->selectRaw("{$distanceExpression} as distance_km", [$latitude, $longitude, $latitude]);
        }

        switch ($request->query('sort', 'relevance')) {
            case 'fastest':
                if (DB::getDriverName() === 'pgsql') {
                    $query->orderByRaw("NULLIF(regexp_replace(avg_delivery_time, '[^0-9]', '', 'g'), '')::numeric ASC NULLS LAST");
                } else {
                    $query->orderBy('avg_delivery_time');
                }
                break;
            case 'distance':
                if ($hasCoordinates) {
                    DB::getDriverName() === 'pgsql'
                        ? $query->orderByRaw('distance_km ASC NULLS LAST')
                        : $query->orderBy('distance_km');
                } else {
                    $query->latest();
                }
                break;
            case 'rating':
                DB::getDriverName() === 'pgsql'
                    ? $query->orderByRaw('rating DESC NULLS LAST')->latest()
                    : $query->orderByDesc('rating')->latest();
                break;
            default:
                $query->latest();
                break;
        }

        $restaurants = $query->get();

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

        // Only an admin may set a restaurant's status directly; anyone else
        // creating a restaurant gets 'pending' regardless of what they sent,
        // so approval can only happen through the admin-only status endpoint.
        if (! $this->isAdmin($request)) {
            $validated['status'] = 'pending';
        }

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

    /**
     * Admin-only: list restaurant applications across every status, for the
     * "Restaurant Applications" review screen. Unlike index(), this is not
     * filtered to active restaurants and exposes submitted documents.
     */
    public function adminIndex(Request $request): JsonResponse
    {
        $query = Restaurant::query()
            ->with('user:id,name,email,role')
            ->latest();

        $status = $request->query('status');
        if ($status && strtolower($status) !== 'all') {
            $query->where('status', strtolower($status));
        }

        $restaurants = $query->get()->each->makeVisible('documents');

        return response()->json([
            'success' => true,
            'message' => 'Restaurant applications retrieved successfully.',
            'data' => $restaurants,
        ]);
    }

    /**
     * Admin-only: full application detail for the review screen, including
     * submitted documents which stay hidden on the public show() endpoint.
     */
    public function adminShow(Restaurant $restaurant): JsonResponse
    {
        $restaurant->load('user:id,name,email,role')->makeVisible('documents');

        return response()->json([
            'success' => true,
            'message' => 'Restaurant application retrieved successfully.',
            'data' => $restaurant,
        ]);
    }

    /**
     * Admin-only: approve a pending restaurant application. Approved
     * restaurants become active and visible to customers.
     */
    public function approve(Restaurant $restaurant): JsonResponse
    {
        $restaurant->update([
            'status' => 'active',
            'rejection_reason' => null,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Restaurant application approved successfully.',
            'data' => $restaurant->load('user:id,name,email,role'),
        ]);
    }

    /**
     * Admin-only: reject a pending restaurant application. A reason is
     * required so the owner can see why they were rejected.
     */
    public function reject(Request $request, Restaurant $restaurant): JsonResponse
    {
        $validated = $request->validate([
            'rejection_reason' => ['required', 'string', 'max:2000'],
        ]);

        $restaurant->update([
            'status' => 'rejected',
            'rejection_reason' => $validated['rejection_reason'],
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Restaurant application rejected.',
            'data' => $restaurant->load('user:id,name,email,role'),
        ]);
    }

    public function update(Request $request, Restaurant $restaurant, CloudinaryImageService $imageService): JsonResponse
    {
        $restaurant = $this->findUserRestaurant($request, $restaurant);
        $validated = $request->validate($this->rules());
        $this->validateUploadedImage($request);

        // Status changes must go through the admin-only updateStatus()
        // endpoint — otherwise an owner could self-approve their own
        // pending restaurant through this general-purpose update route.
        if (! $this->isAdmin($request)) {
            unset($validated['status']);
        }

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
            'status' => ['required', 'string', Rule::in(['active', 'inactive', 'pending', 'rejected'])],
            'rejection_reason' => ['required_if:status,rejected', 'nullable', 'string', 'max:2000'],
        ]);

        $status = strtolower($validated['status']);
        $restaurant->update([
            'status' => $status,
            'rejection_reason' => $status === 'rejected' ? $validated['rejection_reason'] : null,
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
            'cuisine' => ['nullable', 'string', 'max:500'],
            'accepts_vouchers' => ['sometimes', 'boolean'],
            'latitude' => ['nullable', 'numeric', 'between:-90,90'],
            'longitude' => ['nullable', 'numeric', 'between:-180,180'],
            // កែសម្រួលឱ្យទទួលយកទាំង String ឬ File រូបភាព
            'image' => ['nullable', 'sometimes'],
            'status' => ['sometimes', 'string', Rule::in(['active', 'inactive', 'pending', 'rejected'])],
            ...$this->applicationDetailRules(),
        ];
    }

    /**
     * Validation rules shared by owner-submitted "restaurant application"
     * details reviewed by admins: opening hours, photo gallery, and
     * supporting documents (business license, ID, etc.).
     *
     * @return array<string, mixed>
     */
    private function applicationDetailRules(): array
    {
        return [
            'opening_hours' => ['nullable', 'array'],
            'photos' => ['nullable', 'array', 'max:10'],
            'photos.*' => ['string', 'max:2048'],
            'documents' => ['nullable', 'array', 'max:10'],
            'documents.*.name' => ['nullable', 'string', 'max:255'],
            'documents.*.url' => ['required', 'string', 'max:2048'],
        ];
    }

    private function findUserRestaurant(Request $request, Restaurant $restaurant): Restaurant
    {
        $user = $request->user();

        // អនុញ្ញាតបើជា admin, super_admin ឬម្ចាស់ហាងផ្ទាល់
        if ($user && ($this->isAdmin($request) || $user->id === $restaurant->user_id)) {
            return $restaurant;
        }

        abort(403, 'You do not have permission to modify this restaurant.');
    }

    private function isAdmin(Request $request): bool
    {
        $role = strtolower((string) $request->user()?->role);

        return in_array($role, ['admin', 'super_admin', 'super admin'], true);
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
            'data' => $restaurant->load('user:id,name,email,role')->makeVisible('documents'),
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
            'latitude' => ['nullable', 'numeric', 'between:-90,90'],
            'longitude' => ['nullable', 'numeric', 'between:-180,180'],
            'delivery_fee' => ['nullable', 'numeric'],
            'min_order' => ['nullable', 'numeric'],
            'avg_delivery_time' => ['nullable', 'string', 'max:50'],
            'email' => [
                'nullable',
                'email',
                Rule::unique('users', 'email')->ignore($user->id),
            ],
            ...$this->applicationDetailRules(),
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
            'data' => $restaurant->fresh()->load('user:id,name,email,role')->makeVisible('documents'),
        ]);
    }

    // ទាញយកបញ្ជី Rider ដែលនៅជិត Restaurant នេះ (Online + Available)
    public function nearbyRiders(Request $request, Restaurant $restaurant, RiderMatchingService $matcher): JsonResponse
    {
        $restaurant = $this->findUserRestaurant($request, $restaurant);

        if ($restaurant->latitude === null || $restaurant->longitude === null) {
            return response()->json([
                'success' => false,
                'message' => 'This restaurant does not have coordinates set yet.',
                'data' => [],
            ]);
        }

        $riders = $matcher->nearestRiders((float) $restaurant->latitude, (float) $restaurant->longitude)
            ->map(fn ($rider) => [
                'id' => $rider->id,
                'name' => $rider->user?->name,
                'vehicle_type' => $rider->vehicle_type,
                'vehicle_number' => $rider->vehicle_number,
                'distance_km' => $rider->distance_km,
            ]);

        return response()->json([
            'success' => true,
            'message' => 'Nearby riders retrieved successfully.',
            'data' => $riders,
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
