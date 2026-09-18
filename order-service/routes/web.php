<?php

use App\Http\Controllers\User\MomoController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

/*
|--------------------------------------------------------------------------
| Third-party Webhooks & Callbacks (MoMo IPN & Redirect)
|--------------------------------------------------------------------------
| - Không dùng middleware 'auth' vì MoMo gọi tự động.
| - CSRF đã được bypass trong bootstrap/app.php.
|--------------------------------------------------------------------------
*/
Route::post('/payment/momo/ipn', [MomoController::class, 'ipn'])->name('payment.momo.ipn');
Route::get('/payment/momo/callback', [MomoController::class, 'callback'])->name('payment.momo.callback');

Route::prefix('user')->name('user.')->group(function () {
    Route::get('/orders/{order}/pay/momo', [MomoController::class, 'payAgain'])->name('orders.momo.pay');
    Route::get('/orders/{order}/start-momo', [MomoController::class, 'start'])->name('orders.momo.start');
});
