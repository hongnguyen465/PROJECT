<?php
 
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

Route::get('/payment/momo/callback', function (Request $request) {
    $orderService = rtrim((string) config('services.microservices.order', 'http://127.0.0.1:8003'), '/');
    Http::get("{$orderService}/payment/momo/callback", $request->query());
    $status = (string) $request->input('resultCode', '0') === '0' ? 'success' : 'failed';
    return redirect("http://localhost:5173/orders?status={$status}");
})->name('payment.momo.callback');

Route::post('/payment/momo/ipn', function (Request $request) {
    $orderService = rtrim((string) config('services.microservices.order', 'http://127.0.0.1:8003'), '/');
    $response = Http::post("{$orderService}/payment/momo/ipn", $request->all());
    return response($response->body(), $response->status(), $response->headers());
})->name('payment.momo.ipn');

