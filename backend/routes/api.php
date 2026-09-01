<?php
// use App\Http\Controllers\Api\AuthController;
// use App\Http\Controllers\Api\CategoryController;
// use App\Http\Controllers\Api\FoodController;
// use App\Http\Controllers\Api\RestaurantController;
// use Illuminate\Support\Facades\Route;
// Route::post('/register', [AuthController::class, 'register']);
// Route::post('/login', [AuthController::class, 'login']);
// Route::middleware('auth:sanctum')->group(function (): void {
//     Route::post('/logout', [AuthController::class, 'logout']);
//     Route::get('/user', [AuthController::class, 'user']);

//     Route::post('/restaurants', [RestaurantController::class, 'store']);
//     Route::put('/restaurants/{restaurant}', [RestaurantController::class, 'update']);
//     Route::delete('/restaurants/{restaurant}', [RestaurantController::class, 'destroy']);

//     Route::post('/categories', [CategoryController::class, 'store']);
//     Route::put('/categories/{category}', [CategoryController::class, 'update']);
//     Route::delete('/categories/{category}', [CategoryController::class, 'destroy']);

//     Route::post('/foods', [FoodController::class, 'store']);
//     Route::put('/foods/{food}', [FoodController::class, 'update']);
//     Route::delete('/foods/{food}', [FoodController::class, 'destroy']);
// });

// Route::get('/restaurants', [RestaurantController::class, 'index']);
// Route::get('/restaurants/{restaurant}', [RestaurantController::class, 'show']);

// Route::get('/categories', [CategoryController::class, 'index']);
// Route::get('/categories/{category}', [CategoryController::class, 'show']);

// Route::get('/foods', [FoodController::class, 'index']);
// Route::get('/foods/{food}', [FoodController::class, 'show']);

// use App\Http\Controllers\Api\AuthController;
// use App\Http\Controllers\Api\CategoryController;
// use App\Http\Controllers\Api\FoodController;
// use App\Http\Controllers\Api\RestaurantController;
// use Illuminate\Support\Facades\Route;
// Route::post('/register', [AuthController::class, 'register']);
// Route::post('/login', [AuthController::class, 'login']);
// Route::middleware('auth:sanctum')->group(function (): void {
//     Route::post('/logout', [AuthController::class, 'logout']);
//     Route::get('/user', [AuthController::class, 'user']);

//     Route::post('/restaurants', [RestaurantController::class, 'store']);
//     Route::put('/restaurants/{restaurant}', [RestaurantController::class, 'update']);
//     Route::delete('/restaurants/{restaurant}', [RestaurantController::class, 'destroy']);

//     Route::post('/categories', [CategoryController::class, 'store']);
//     Route::put('/categories/{category}', [CategoryController::class, 'update']);
//     Route::delete('/categories/{category}', [CategoryController::class, 'destroy']);

//     Route::post('/foods', [FoodController::class, 'store']);
//     Route::put('/foods/{food}', [FoodController::class, 'update']);
//     Route::delete('/foods/{food}', [FoodController::class, 'destroy']);
// });

// Route::get('/restaurants', [RestaurantController::class, 'index']);
// Route::get('/restaurants/{restaurant}', [RestaurantController::class, 'show']);

// Route::get('/categories', [CategoryController::class, 'index']);
// Route::get('/categories/{category}', [CategoryController::class, 'show']);

// Route::get('/foods', [FoodController::class, 'index']);
// Route::get('/foods/{food}', [FoodController::class, 'show']);

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\FoodController;
use App\Http\Controllers\Api\RestaurantController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\DriverController;
use App\Http\Controllers\Api\ReviewController;
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

    // Protected marketplace write routes
    Route::post('/restaurants', [RestaurantController::class, 'store']);
    Route::put('/restaurants/{restaurant}', [RestaurantController::class, 'update']);
    Route::put('/restaurants/{restaurant}/status', [RestaurantController::class, 'updateStatus']);
    Route::delete('/restaurants/{restaurant}', [RestaurantController::class, 'destroy']);

    Route::post('/categories', [CategoryController::class, 'store']);
    Route::put('/categories/{category}', [CategoryController::class, 'update']);
    Route::delete('/categories/{category}', [CategoryController::class, 'destroy']);

    Route::post('/foods', [FoodController::class, 'store']);
    Route::put('/foods/{food}', [FoodController::class, 'update']);
    Route::delete('/foods/{food}', [FoodController::class, 'destroy']);
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

// --------------------------------------------------------------------------
// Admin Routes ( Super Admin Panel )
// --------------------------------------------------------------------------
Route::prefix('admin')->group(function () {
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
Route::get('/admin/dashboard/stats', [DashboardController::class, 'stats']);
Route::get('/admin/payments', [PaymentController::class, 'getStatsAndTransactions']);
Route::post('/admin/payments/payout', [PaymentController::class, 'processPayout']);

// Driver Dashboard Routes
Route::get('/driver/orders', [DriverController::class, 'orders']);
Route::patch('/driver/orders/{id}/status', [DriverController::class, 'updateOrderStatus']);
Route::put('/driver/orders/{id}/status', [DriverController::class, 'updateOrderStatus']);

// Driver Resource Route
Route::apiResource('drivers', DriverController::class);
