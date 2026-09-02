<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\CartController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\ReviewController;
use App\Http\Controllers\Api\SellerDashboardController;
use App\Http\Controllers\Api\ChatController;

use App\Http\Controllers\Api\AdminController;

// ====================== AUTH ROUTES ======================
Route::prefix('auth')->group(function () {

    // Public
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/verify-otp', [AuthController::class, 'verifyOtp']);
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
    Route::post('/reset-password', [AuthController::class, 'resetPassword']);

    // Protected
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/profile', [AuthController::class, 'profile']);
        Route::post('/update-profile', [AuthController::class, 'updateProfile']);
        Route::post('/upload-national-id', [AuthController::class, 'uploadNationalId']);
    });
});

// ====================== CATEGORY ROUTES ======================
Route::get('/categories', [CategoryController::class, 'index']);

// Admin only (we will protect later)
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/categories', [CategoryController::class, 'store']);
});

// ====================== PRODUCT ROUTES ======================
Route::get('/products', [ProductController::class, 'index']);
Route::get('/products/{id}', [ProductController::class, 'show']);

Route::middleware('auth:sanctum')->group(function () {
    // Seller routes
    Route::post('/products', [ProductController::class, 'store']);
    Route::get('/my-products', [ProductController::class, 'myProducts']);

    // Admin routes
    Route::get('/admin/products/pending', [ProductController::class, 'pendingProducts']);
    Route::post('/admin/products/{id}/approve', [ProductController::class, 'approve']);
    Route::post('/admin/products/{id}/reject', [ProductController::class, 'reject']);
});

// ====================== CART ROUTES ======================
// Route::middleware('auth:sanctum')->prefix('cart')->group(function () {

Route::middleware('auth:sanctum')->group(function () {
    // Route::get('/', [CartController::class, 'index']);
    // Route::post('/', [CartController::class, 'store']);
    // Route::put('/{itemId}', [CartController::class, 'update']);
    // Route::delete('/{itemId}', [CartController::class, 'destroy']);
    // Route::delete('/', [CartController::class, 'clear']);


    // Cart routes
    Route::get('/cart', [CartController::class, 'index']);
    Route::post('/cart', [CartController::class, 'store']);
    Route::put('/cart/items/{id}', [CartController::class, 'update']);
    Route::delete('/cart/items/{id}', [CartController::class, 'destroy']);
});

// ====================== ORDER ROUTES ======================
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/orders', [OrderController::class, 'store']);
    Route::get('/orders', [OrderController::class, 'myOrders']);
    Route::get('/orders/{id}', [OrderController::class, 'show']);
    Route::get('/seller/orders', [OrderController::class, 'sellerOrders']);
    Route::post('/orders/{id}/status', [OrderController::class, 'updateStatus']);
});

// Review Routes
Route::get('/products/{productId}/reviews', [ReviewController::class, 'productReviews']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/reviews', [ReviewController::class, 'store']);
});
// ====================== SELLER DASHBOARD ROUTES ======================
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/seller/dashboard', [SellerDashboardController::class, 'index']);


    // Seller product management
Route::get('/my-products', [ProductController::class, 'myProducts']);
Route::get('/my-products/{id}', [ProductController::class, 'showMyProduct']);
Route::put('/my-products/{id}', [ProductController::class, 'update']);
Route::delete('/my-products/{id}', [ProductController::class, 'destroy']);
});

// ====================== CHAT ROUTES ======================
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/chat/conversations', [ChatController::class, 'conversations']);
    Route::get('/chat/conversations/{id}/messages', [ChatController::class, 'messages']);
    Route::post('/chat/start', [ChatController::class, 'start']);
    Route::post('/chat/conversations/{id}/send', [ChatController::class, 'send']);
});




Route::middleware('auth:sanctum')->group(function () {

    // Existing routes...

    // Admin routes
    Route::prefix('admin')->group(function () {
        Route::get('/dashboard', [AdminController::class, 'dashboard']);
        Route::get('/users', [AdminController::class, 'users']);
        Route::post('/users/{id}/verify', [AdminController::class, 'verifySeller']);
        Route::put('/users/{id}/role', [AdminController::class, 'updateUserRole']);
        Route::get('/orders', [AdminController::class, 'orders']);
        Route::post('/orders/{id}/status', [AdminController::class, 'updateOrderStatus']);
    });
});