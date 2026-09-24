<?php

use App\Http\Controllers\Api\AddressController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CartController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\DriverController;
use App\Http\Controllers\Api\EmailController;
use App\Http\Controllers\Api\FoodController;
use App\Http\Controllers\Api\FoodRecommendationController;
use App\Http\Controllers\Api\GoogleAuthController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\RestaurantController;
use App\Http\Controllers\Api\ReviewController;
use App\Http\Controllers\Api\RiderDeliveryController;
use App\Http\Controllers\Api\RiderProfileController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\VoucherController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// Public Auth Routes
// Neither of these completes authentication by itself anymore - both return
// an OTP challenge that must be finished via /auth/otp/verify before a
// Sanctum token is issued (see AuthController).
Route::post('/register', [AuthController::class, 'register'])->middleware('throttle:10,1');
Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:10,1');
Route::post('/auth/password/forgot', [AuthController::class, 'forgotPassword'])->middleware('throttle:5,1');
Route::post('/auth/password/reset', [AuthController::class, 'resetPassword'])->middleware('throttle:10,1');

// OTP challenge completion, shared by register/login/Google sign-in - see
// OtpService and OtpCode::PURPOSES.
Route::post('/auth/otp/verify', [AuthController::class, 'verifyOtp'])->middleware('throttle:20,1');
Route::post('/auth/otp/resend', [AuthController::class, 'resendOtp'])->middleware('throttle:10,1');

// Google OAuth ("Continue with Google") - browser-redirect flow, not JSON.
// Only ever creates/links 'customer' or 'restaurant' accounts; see
// GoogleAuthController for the role whitelist enforced server-side. Like
// register/login above, this hands back an OTP challenge, not a token.
Route::get('/auth/google/redirect', [GoogleAuthController::class, 'redirect'])->middleware('throttle:20,1');
Route::get('/auth/google/callback', [GoogleAuthController::class, 'callback'])->middleware('throttle:20,1');

// Protected Routes (Sanctum Auth)
//
// Role-specific endpoints additionally pass through the 'role' gate
// (App\Http\Middleware\EnsureUserHasRole, resolved via App\Support\UserRoles)
// so a token alone is never enough to reach another portal's API - changing
// localStorage or typing a URL can't get a customer into restaurant-owner,
// rider or admin endpoints.
Route::middleware('auth:sanctum')->group(function (): void {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'user']);
    Route::put('/profile', [AuthController::class, 'updateUserProfile']);
    Route::put('/change-password', [AuthController::class, 'changePassword']);

    // Restaurant Profile & Settings Routes
    Route::get('/restaurant/profile', [RestaurantController::class, 'profile'])->middleware('role:restaurant_owner,admin');
    Route::match(['post', 'put'], '/restaurant/profile', [RestaurantController::class, 'updateProfile'])->middleware('role:restaurant_owner,admin');
    Route::get('/restaurant/stats', [DashboardController::class, 'restaurantStats'])->middleware('role:restaurant_owner,admin');
    Route::get('/restaurant/sales', [DashboardController::class, 'restaurantSales'])->middleware('role:restaurant_owner,admin');

    // Protected marketplace write routes (restaurant-owner / admin only)
    Route::post('/restaurants', [RestaurantController::class, 'store'])->middleware('role:restaurant_owner,admin');
    Route::put('/restaurants/{restaurant}', [RestaurantController::class, 'update'])->middleware('role:restaurant_owner,admin');
    Route::delete('/restaurants/{restaurant}', [RestaurantController::class, 'destroy'])->middleware('role:restaurant_owner,admin');

    Route::put('/restaurants/{restaurant}/status', [RestaurantController::class, 'updateStatus'])
        ->middleware('admin');

    Route::get('/restaurants/{restaurant}/nearby-riders', [RestaurantController::class, 'nearbyRiders'])->middleware('role:restaurant_owner,admin');

    Route::post('/categories', [CategoryController::class, 'store'])->middleware('role:restaurant_owner,admin');
    Route::match(['post', 'put'], '/categories/{category}', [CategoryController::class, 'update'])->middleware('role:restaurant_owner,admin');
    Route::delete('/categories/{category}', [CategoryController::class, 'destroy'])->middleware('role:restaurant_owner,admin');

    Route::post('/foods', [FoodController::class, 'store'])->middleware('role:restaurant_owner,admin');
    Route::put('/foods/{food}', [FoodController::class, 'update'])->middleware('role:restaurant_owner,admin');
    Route::delete('/foods/{food}', [FoodController::class, 'destroy'])->middleware('role:restaurant_owner,admin');
    Route::post('/foods/{food}/recommend', [FoodRecommendationController::class, 'toggle'])->middleware('role:restaurant_owner,admin');
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
    Route::post('/vouchers/validate', [VoucherController::class, 'validateCode']);

    // Customer payments via KHQR.LINK. Creation always validates the amount
    // server-side from the order's own stored total; showPayment is the
    // only path that can mark a payment (and its order) PAID - it verifies
    // against KHQR.LINK itself, never trusting the frontend's word for it.
    Route::post('/payments/khqr', [PaymentController::class, 'createKhqrPayment']);
    Route::get('/payments/{payment}', [PaymentController::class, 'showPayment']);

    Route::get('/rider/profile', [RiderProfileController::class, 'show'])->middleware('role:rider');
    Route::post('/rider/profile', [RiderProfileController::class, 'store'])->middleware('role:rider');
    Route::put('/rider/profile', [RiderProfileController::class, 'update'])->middleware('role:rider');
    Route::put('/rider/availability', [RiderProfileController::class, 'availability'])->middleware('role:rider');
    Route::put('/rider/location', [RiderProfileController::class, 'updateLocation'])->middleware('role:rider');
    Route::put('/rider/online-status', [RiderProfileController::class, 'updateOnlineStatus'])->middleware('role:rider');

    Route::get('/rider/deliveries', [RiderDeliveryController::class, 'index'])->middleware('role:rider');
    Route::get('/rider/deliveries/{delivery}', [RiderDeliveryController::class, 'show'])->middleware('role:rider');
    Route::post('/rider/deliveries/{delivery}/accept', [RiderDeliveryController::class, 'accept'])->middleware('role:rider');
    Route::post('/rider/deliveries/{delivery}/pickup', [RiderDeliveryController::class, 'pickup'])->middleware('role:rider');
    Route::post('/rider/deliveries/{delivery}/start', [RiderDeliveryController::class, 'start'])->middleware('role:rider');
    Route::post('/rider/deliveries/{delivery}/deliver', [RiderDeliveryController::class, 'deliver'])->middleware('role:rider');
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
Route::middleware(['auth:sanctum', 'role:restaurant_owner,admin'])->group(function (): void {
    Route::get('/restaurant/orders', [OrderController::class, 'index']);
    Route::post('/restaurant/orders', [OrderController::class, 'store']);
    Route::patch('/restaurant/orders/{id}/status', [OrderController::class, 'updateStatus']);
    Route::put('/restaurant/orders/{id}/status', [OrderController::class, 'updateStatus']);
});

// Restaurant Reviews
Route::middleware(['auth:sanctum', 'role:restaurant_owner,admin'])->group(function (): void {
    Route::get('/restaurant/reviews', [ReviewController::class, 'index']);
    Route::post('/restaurant/reviews', [ReviewController::class, 'store']);
    Route::post('/restaurant/reviews/{review}/reply', [ReviewController::class, 'reply']);
    Route::delete('/restaurant/reviews/{review}', [ReviewController::class, 'destroy']);
});

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

    // Restaurant Applications (registration review workflow)
    Route::get('/restaurants', [RestaurantController::class, 'adminIndex']);
    Route::get('/restaurants/{restaurant}', [RestaurantController::class, 'adminShow']);
    Route::put('/restaurants/{restaurant}/approve', [RestaurantController::class, 'approve']);
    Route::put('/restaurants/{restaurant}/reject', [RestaurantController::class, 'reject']);
});

// Admin Dashboard & Payments Routes (Aligned with /admin/dashboard/stats)
Route::middleware(['auth:sanctum', 'admin'])->group(function () {
    Route::get('/admin/dashboard/stats', [DashboardController::class, 'stats']);
    Route::get('/admin/payments', [PaymentController::class, 'getStatsAndTransactions']);
    Route::post('/admin/payments/payout', [PaymentController::class, 'processPayout']);
    Route::post('/admin/payments/calculate', [PaymentController::class, 'calculatePayout']);
});

// Driver Dashboard Routes (self-service; requires an approved rider/driver account)
Route::middleware(['auth:sanctum', 'role:rider'])->group(function (): void {
    Route::get('/driver/orders', [DriverController::class, 'orders']);
    Route::patch('/driver/orders/{id}/status', [DriverController::class, 'updateOrderStatus']);
    Route::put('/driver/orders/{id}/status', [DriverController::class, 'updateOrderStatus']);
});

// Admin: Send rider credentials email
Route::middleware(['auth:sanctum', 'admin'])->group(function (): void {
    Route::post('/admin/drivers/send-credentials', [EmailController::class, 'sendRiderCredentials']);
});

// Driver Resource Route (admin management only)
Route::middleware(['auth:sanctum', 'admin'])->group(function (): void {
    Route::apiResource('drivers', DriverController::class);
});
