<?php

use App\Http\Controllers\OrderController;
use App\Http\Controllers\User\MomoController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

/*
|--------------------------------------------------------------------------
| 🚚 THIRD-PARTY WEBHOOKS & CALLBACKS (GHN, MOMO IPN)
|--------------------------------------------------------------------------
| NOTE: 
| - Không dùng middleware 'auth' vì bên thứ 3 (GHN, MoMo) gọi sang tự động.
| - Đã được bypass CSRF trong bootstrap/app.php.
|--------------------------------------------------------------------------
*/
Route::post('/payment/momo/ipn', [\App\Http\Controllers\User\MomoController::class, 'ipn'])->name('payment.momo.ipn');
Route::get('/payment/momo/callback', [\App\Http\Controllers\User\MomoController::class, 'callback'])->name('payment.momo.callback');

Route::prefix('user')->name('user.')->group(function () {
    // Payment
    Route::get('/payment', [OrderController::class, 'paymentIndex'])->name('payment.index');
    Route::post('/payment/process', [OrderController::class, 'processPayment'])->name('payment.process');
    Route::get('/orders/{order}/pay/momo', [MomoController::class, 'payAgain'])->name('orders.momo.pay');
    Route::get('/orders/{order}/start-momo', [MomoController::class, 'start'])->name('orders.momo.start');
    Route::get('/orders', [OrderController::class, 'index'])->name('orders.index');
});
