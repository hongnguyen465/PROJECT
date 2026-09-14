<?php

use App\Http\Controllers\GatewayController;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Route;

Route::get('/payment/momo/callback', function (Illuminate\Http\Request $request) {
    $orderService = rtrim((string) config('services.microservices.order', 'http://127.0.0.1:8003'), '/');

    // 1. Gọi sang Order Service để ghi nhận trạng thái thanh toán đơn hàng vào Database
    Http::get("{$orderService}/payment/momo/callback", $request->query());

    // 2. Trả về chuyển hướng trực tiếp cho trình duyệt về trang đơn hàng Frontend React
    return redirect('http://localhost:5173/orders?status=success');
});

Route::any('/auth/{any?}', [GatewayController::class, 'auth'])->where('any', '.*');
Route::any('/addresses/{any?}', [GatewayController::class, 'auth'])->where('any', '.*');
Route::any('/categories/{any?}', [GatewayController::class, 'catalog'])->where('any', '.*');
Route::any('/products/{any?}', [GatewayController::class, 'catalog'])->where('any', '.*');
Route::any('/brands/{any?}', [GatewayController::class, 'catalog'])->where('any', '.*');
Route::any('/cart/{any?}', [GatewayController::class, 'order'])->where('any', '.*');
Route::any('/orders/{any?}', [GatewayController::class, 'order'])->where('any', '.*');
Route::any('/coupons/{any?}', [GatewayController::class, 'order'])->where('any', '.*');
Route::any('/reviews/{any?}', [GatewayController::class, 'order'])->where('any', '.*');
Route::any('/shipping/{any?}', [GatewayController::class, 'order'])->where('any', '.*');
Route::any('/payments/{any?}', [GatewayController::class, 'payment'])->where('any', '.*');
Route::any('/payment/{any?}', [GatewayController::class, 'order'])->where('any', '.*');
