<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

Route::get('/payment/momo/callback', function (Request $request) {
    $orderService  = rtrim((string) config('services.microservices.order', 'http://127.0.0.1:8003'), '/');
    $frontendUrl   = rtrim((string) config('app.frontend_url', 'http://localhost:5173'), '/');

    // Forward callback to Order Service to update payment status in DB
    Http::get("{$orderService}/payment/momo/callback", $request->query());

    $status = (string) $request->input('resultCode', '0') === '0' ? 'success' : 'failed';
    return redirect("{$frontendUrl}/orders?status={$status}");
})->name('payment.momo.callback');

Route::post('/payment/momo/ipn', function (Request $request) {
    $orderService = rtrim((string) config('services.microservices.order', 'http://127.0.0.1:8003'), '/');
    $response     = Http::post("{$orderService}/payment/momo/ipn", $request->all());
    return response($response->body(), $response->status(), $response->headers());
})->name('payment.momo.ipn');
