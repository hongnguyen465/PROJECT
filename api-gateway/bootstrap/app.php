<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        //
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->expectsJson(),
        );

        $exceptions->render(function (\Throwable $e, Request $request) {
            if ($request->is('api/*') || $request->expectsJson()) {
                $status = 500;
                $code = 'INTERNAL_ERROR';
                $message = 'Lỗi hệ thống máy chủ, vui lòng thử lại sau.';
                $details = null;

                if ($e instanceof \Symfony\Component\HttpKernel\Exception\NotFoundHttpException) {
                    $status = 404;
                    $code = 'NOT_FOUND';
                    $message = 'Đường dẫn hoặc tài nguyên không tìm thấy.';
                } elseif ($e instanceof \Symfony\Component\HttpKernel\Exception\MethodNotAllowedHttpException) {
                    $status = 405;
                    $code = 'METHOD_NOT_ALLOWED';
                    $message = 'Phương thức HTTP không được hỗ trợ.';
                } elseif ($e instanceof \Illuminate\Validation\ValidationException) {
                    $status = 422;
                    $code = 'VALIDATION_ERROR';
                    $message = $e->getMessage() ?: 'Dữ liệu không hợp lệ.';
                    $details = $e->errors();
                } elseif ($e instanceof \Illuminate\Auth\AuthenticationException) {
                    $status = 401;
                    $code = 'UNAUTHORIZED';
                    $message = 'Bạn chưa đăng nhập hoặc phiên đăng nhập đã hết hạn.';
                } elseif ($e instanceof \Symfony\Component\HttpKernel\Exception\HttpExceptionInterface) {
                    $status = $e->getStatusCode();
                    $code = 'ERROR_' . $status;
                    $message = $e->getMessage() ?: 'Đã có lỗi xảy ra.';
                }

                $errorPayload = [
                    'success' => false,
                    'error' => [
                        'code' => $code,
                        'message' => $message,
                    ],
                ];

                if ($details) {
                    $errorPayload['error']['details'] = $details;
                }

                return response()->json($errorPayload, $status);
            }
        });
    })->create();
