<?php

use App\Http\Controllers\AddressController;
use App\Http\Controllers\AuthController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Auth Routes — forwarded từ API Gateway (prefix: /auth/...)
|--------------------------------------------------------------------------
| Mọi request từ Frontend đều đi qua API Gateway với path /auth/... nên
| tất cả routes cần nằm trong prefix 'auth'. Các route root-level được
| giữ để hỗ trợ gọi trực tiếp khi test (không qua Gateway).
|--------------------------------------------------------------------------
*/

// Public routes (direct call support — không qua Gateway prefix)
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
Route::post('/verify-email', [AuthController::class, 'verifyEmail']);
Route::post('/resend-otp', [AuthController::class, 'resendOtp']);

Route::middleware('auth:api')->group(function (): void {
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);

    Route::get('/addresses', [AddressController::class, 'index']);
    Route::post('/addresses', [AddressController::class, 'store']);
    Route::put('/addresses/{address}', [AddressController::class, 'update']);
    Route::patch('/addresses/{address}', [AddressController::class, 'update']);
    Route::delete('/addresses/{address}', [AddressController::class, 'destroy']);
    Route::patch('/addresses/{address}/set-default', [AddressController::class, 'setDefault']);
});

// Admin User Management routes (direct access)
Route::get('/admin/users', [AuthController::class, 'adminUsers']);
Route::patch('/admin/users/{id}/toggle-status', [AuthController::class, 'adminToggleStatus']);

// Auth-prefixed routes (called via API Gateway: /auth/login, /auth/me, ...)
Route::prefix('auth')->group(function (): void {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
    Route::post('/verify-email', [AuthController::class, 'verifyEmail']);
    Route::post('/resend-otp', [AuthController::class, 'resendOtp']);

    // Admin User Management routes (via Gateway: /auth/admin/users)
    Route::get('/admin/users', [AuthController::class, 'adminUsers']);
    Route::patch('/admin/users/{id}/toggle-status', [AuthController::class, 'adminToggleStatus']);

    Route::middleware('auth:api')->group(function (): void {
        Route::get('/me', [AuthController::class, 'me']);
        Route::post('/logout', [AuthController::class, 'logout']);

        Route::get('/addresses', [AddressController::class, 'index']);
        Route::post('/addresses', [AddressController::class, 'store']);
        Route::put('/addresses/{address}', [AddressController::class, 'update']);
        Route::patch('/addresses/{address}', [AddressController::class, 'update']);
        Route::delete('/addresses/{address}', [AddressController::class, 'destroy']);
        Route::patch('/addresses/{address}/set-default', [AddressController::class, 'setDefault']);
    });
});