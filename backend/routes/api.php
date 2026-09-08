<?php

use App\Http\Controllers\Api\AddressController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CartController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\DriverController;
use App\Http\Controllers\Api\FoodController;
use App\Http\Controllers\Api\FoodRecommendationController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\RestaurantController;
use App\Http\Controllers\Api\ReviewController;
use App\Http\Controllers\Api\RiderDeliveryController;
use App\Http\Controllers\Api\RiderProfileController;
use App\Http\Controllers\Api\UserController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// Public Auth Routes
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Public Dashboard Route (Restaurant Stats)
Route::get('/restaurant/stats', [DashboardController::class, 'restaurantStats']);
Route::get('/restaurant/sales', [DashboardController::class, 'restaurantSales']);

// Protected Routes (Sanctum Auth)
Route::middleware('auth:sanctum')->group(function (): void {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'user']);

    // Restaurant Profile & Settings Routes (បានកែសម្រួលដើម្បីទទួលយក GET, POST និង PUT)
    Route::get('/restaurant/profile', [RestaurantController::class, 'profile']);
    Route::match(['post', 'put'], '/restaurant/profile', [RestaurantController::class, 'updateProfile']);

    // Protected marketplace write routes
    Route::post('/restaurants', [RestaurantController::class, 'store']);
    Route::put('/restaurants/{restaurant}', [RestaurantController::class, 'update']);
    Route::delete('/restaurants/{restaurant}', [RestaurantController::class, 'destroy']);

    Route::put('/restaurants/{restaurant}/status', [RestaurantController::class, 'updateStatus'])
        ->middleware('admin');

    Route::post('/categories', [CategoryController::class, 'store']);
    Route::match(['post', 'put'], '/categories/{category}', [CategoryController::class, 'update']);
    Route::delete('/categories/{category}', [CategoryController::class, 'destroy']);

    Route::post('/foods', [FoodController::class, 'store']);
    Route::put('/foods/{food}', [FoodController::class, 'update']);
    Route::delete('/foods/{food}', [FoodController::class, 'destroy']);
    Route::post('/foods/{food}/recommend', [FoodRecommendationController::class, 'toggle']);
    Route::get('/foods/{food}/recommendation', [FoodRecommendationController::class, 'show']);

    Route::get('/addresses', [AddressController::class, 'index']);
    Route::post('/addresses', [AddressController::class, 'store']);
    Route::get('/addresses/{address}', [AddressController::class, 'show']);
    Route::put('/addresses/{address}', [AddressController::class, 'update']);
    Route::delete('/addresses/{address}', [AddressController::class, 'destroy']);

    Route::get('/cart', [CartController::class, 'show']);
    Route::post('/cart/items', [CartController::class, 'addItem']);
    Route::put('/cart/items/{cartItem}', [CartController::class, 'updateItem']);
    Route::delete('/cart/items/{cartItem}', [CartController::class, 'removeItem']);
    Route::delete('/cart', [CartController::class, 'clear']);

    Route::post('/orders', [OrderController::class, 'store']);
    Route::get('/orders', [OrderController::class, 'index']);
    Route::get('/orders/{order}', [OrderController::class, 'show']);
    Route::post('/orders/{order}/cancel', [OrderController::class, 'cancel']);
    Route::post('/orders/{order}/assign-rider', [OrderController::class, 'assignRider']);

    Route::get('/rider/profile', [RiderProfileController::class, 'show']);
    Route::post('/rider/profile', [RiderProfileController::class, 'store']);
    Route::put('/rider/profile', [RiderProfileController::class, 'update']);
    Route::put('/rider/availability', [RiderProfileController::class, 'availability']);

    Route::get('/rider/deliveries', [RiderDeliveryController::class, 'index']);
    Route::get('/rider/deliveries/{delivery}', [RiderDeliveryController::class, 'show']);
    Route::post('/rider/deliveries/{delivery}/accept', [RiderDeliveryController::class, 'accept']);
    Route::post('/rider/deliveries/{delivery}/pickup', [RiderDeliveryController::class, 'pickup']);
    Route::post('/rider/deliveries/{delivery}/start', [RiderDeliveryController::class, 'start']);
    Route::post('/rider/deliveries/{delivery}/deliver', [RiderDeliveryController::class, 'deliver']);
});

// Category Routes
Route::get('/categories', [CategoryController::class, 'index']);
Route::get('/categories/{category}', [CategoryController::class, 'show']);

// Restaurant Routes
Route::get('/restaurants', [RestaurantController::class, 'index']);
Route::get('/restaurants/{restaurant}', [RestaurantController::class, 'show']);

// Food Public Read Routes
Route::get('/foods', [FoodController::class, 'index']);
Route::get('/foods/{food}', [FoodController::class, 'show']);

// --------------------------------------------------------------------------
// Order Routes ( Restaurant Panel & Postman API )
// --------------------------------------------------------------------------
Route::get('/restaurant/orders', [OrderController::class, 'index']);
Route::post('/restaurant/orders', [OrderController::class, 'store']);
Route::patch('/restaurant/orders/{id}/status', [OrderController::class, 'updateStatus']);
Route::put('/restaurant/orders/{id}/status', [OrderController::class, 'updateStatus']);

// Restaurant Reviews
Route::get('/restaurant/reviews', [ReviewController::class, 'index']);
Route::post('/restaurant/reviews', [ReviewController::class, 'store']);
Route::post('/restaurant/reviews/{review}/reply', [ReviewController::class, 'reply']);
Route::delete('/restaurant/reviews/{review}', [ReviewController::class, 'destroy']);

// Admin Routes ( Super Admin Panel )
Route::prefix('admin')->middleware(['auth:sanctum', 'admin'])->group(function () {
    // Admin Profile & Settings Routes
    Route::get('/profile', [UserController::class, 'getProfile']);
    Route::put('/profile', [UserController::class, 'updateProfile']);
    Route::put('/change-password', [UserController::class, 'updatePassword']);

    // User Management
    Route::get('/users', [UserController::class, 'index']);
    Route::post('/users', [UserController::class, 'store']);
    Route::put('/users/{id}', [UserController::class, 'update']);
    Route::delete('/users/{id}', [UserController::class, 'destroy']);

    // Admin Orders Management
    Route::get('/orders', [OrderController::class, 'index']);
    Route::patch('/orders/{id}/status', [OrderController::class, 'updateStatus']);
    Route::put('/orders/{id}/status', [OrderController::class, 'updateStatus']);

    // Admin Reviews Management
    Route::get('/reviews', [ReviewController::class, 'index']);
    Route::patch('/reviews/{review}/status', [ReviewController::class, 'updateStatus']);
    Route::post('/reviews/{review}/reply', [ReviewController::class, 'reply']);
});

// Admin Dashboard & Payments Routes (Aligned with /admin/dashboard/stats)
Route::middleware(['auth:sanctum', 'admin'])->group(function () {
    Route::get('/admin/dashboard/stats', [DashboardController::class, 'stats']);
    Route::get('/admin/payments', [PaymentController::class, 'getStatsAndTransactions']);
    Route::post('/admin/payments/payout', [PaymentController::class, 'processPayout']);
});

// Driver Dashboard Routes (self-service; requires an approved rider/driver account)
Route::middleware('auth:sanctum')->group(function (): void {
    Route::get('/driver/orders', [DriverController::class, 'orders']);
    Route::patch('/driver/orders/{id}/status', [DriverController::class, 'updateOrderStatus']);
    Route::put('/driver/orders/{id}/status', [DriverController::class, 'updateOrderStatus']);
});

// Driver Resource Route (admin management only)
Route::middleware(['auth:sanctum', 'admin'])->group(function (): void {
    Route::apiResource('drivers', DriverController::class);
});
