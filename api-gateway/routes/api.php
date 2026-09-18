<?php

use App\Http\Controllers\GatewayController;
use Illuminate\Support\Facades\Route;

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
