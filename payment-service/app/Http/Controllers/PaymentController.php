<?php

namespace App\Http\Controllers;

use App\Models\Payment;
use App\Models\PaymentSetting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class PaymentController extends Controller
{
    /**
     * Get active VietQR / Payment settings.
     *
     * @group Payment Management
     */
    public function getSettings(): JsonResponse
    {
        $setting = PaymentSetting::firstOrCreate(
            ['is_active' => true],
            [
                'bank_code' => 'MB',
                'bank_name' => 'MBBank (Ngân hàng Quân Đội)',
                'account_number' => '0977777777',
                'account_name' => 'STRIKER SPORT PRO',
                'syntax_prefix' => 'STR',
                'template' => 'compact2',
            ]
        );

        return response()->json([
            'success' => true,
            'message' => 'Lấy cấu hình thanh toán thành công.',
            'data' => $setting,
            'errors' => null,
        ]);
    }

    /**
     * Update VietQR / Payment settings.
     *
     * @group Payment Management
     */
    public function updateSettings(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'bank_code' => ['required', 'string', 'max:50'],
            'bank_name' => ['sometimes', 'nullable', 'string', 'max:100'],
            'account_number' => ['required', 'string', 'max:50'],
            'account_name' => ['required', 'string', 'max:100'],
            'syntax_prefix' => ['sometimes', 'nullable', 'string', 'max:50'],
            'template' => ['sometimes', 'nullable', 'string', 'max:30'],
        ]);

        $setting = PaymentSetting::first();
        if (!$setting) {
            $setting = PaymentSetting::create($validated);
        } else {
            $setting->update($validated);
        }

        return response()->json([
            'success' => true,
            'message' => 'Cập nhật cấu hình thanh toán thành công.',
            'data' => $setting->fresh(),
            'errors' => null,
        ]);
    }

    /**
     * Generate VietQR Quick Link dynamically from DB settings.
     *
     * @group Payment Management
     */
    public function generateVietQR(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'amount' => ['required', 'numeric', 'min:0'],
            'order_id' => ['sometimes', 'nullable'],
            'order_code' => ['sometimes', 'nullable', 'string'],
            'description' => ['sometimes', 'nullable', 'string'],
        ]);

        $setting = PaymentSetting::firstOrCreate(
            ['is_active' => true],
            [
                'bank_code' => 'MB',
                'bank_name' => 'MBBank (Ngân hàng Quân Đội)',
                'account_number' => '0977777777',
                'account_name' => 'STRIKER SPORT PRO',
                'syntax_prefix' => 'STR',
                'template' => 'compact2',
            ]
        );

        $orderIdentifier = $validated['order_code'] ?? $validated['order_id'] ?? ('ORD-' . time());
        $syntaxPrefix = $setting->syntax_prefix ?: 'STR';
        $transferSyntax = $validated['description'] ?? "{$syntaxPrefix} {$orderIdentifier}";

        $bankCode = trim($setting->bank_code);
        $accountNo = trim($setting->account_number);
        $template = $setting->template ?: 'compact2';
        $amount = (int) $validated['amount'];
        $accountName = trim($setting->account_name);

        $query = http_build_query([
            'amount' => $amount,
            'addInfo' => $transferSyntax,
            'accountName' => $accountName,
        ]);

        $vietQrUrl = "https://img.vietqr.io/image/{$bankCode}-{$accountNo}-{$template}.png?{$query}";

        return response()->json([
            'success' => true,
            'message' => 'Tạo mã VietQR Quick Link thành công.',
            'data' => [
                'vietqr_url' => $vietQrUrl,
                'qr_url' => $vietQrUrl,
                'bank_code' => $bankCode,
                'bank_name' => $setting->bank_name,
                'account_number' => $accountNo,
                'account_name' => $accountName,
                'amount' => $amount,
                'transfer_syntax' => $transferSyntax,
            ],
            'errors' => null,
        ]);
    }

    /**
     * Initialize a payment transaction for an order.
     *
     * @group Payment Management
     */
    public function processPayment(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'order_id' => ['required', 'integer', 'min:1'],
            'user_id' => ['required', 'integer', 'min:1'],
            'payment_method' => ['sometimes', 'in:cod,vnpay,momo,bank_transfer'],
            'amount' => ['required', 'numeric', 'min:0'],
            'order_code' => ['sometimes', 'nullable', 'string'],
        ]);

        $paymentMethod = $validated['payment_method'] ?? 'cod';

        $payment = Payment::updateOrCreate(
            ['order_id' => $validated['order_id']],
            [
                'user_id' => $validated['user_id'],
                'payment_method' => $paymentMethod,
                'transaction_id' => null,
                'amount' => $validated['amount'],
                'status' => 'pending',
                'paid_at' => null,
            ],
        );

        $responseData = $payment->toArray();

        // If VietQR / Bank Transfer, attach dynamic QR Quick Link generated from DB settings
        if ($paymentMethod === 'bank_transfer') {
            $setting = PaymentSetting::firstOrCreate(
                ['is_active' => true],
                [
                    'bank_code' => 'MB',
                    'bank_name' => 'MBBank (Ngân hàng Quân Đội)',
                    'account_number' => '0977777777',
                    'account_name' => 'STRIKER SPORT PRO',
                    'syntax_prefix' => 'STR',
                    'template' => 'compact2',
                ]
            );

            $orderCode = $validated['order_code'] ?? ('ORD-' . $validated['order_id']);
            $syntaxPrefix = $setting->syntax_prefix ?: 'STR';
            $transferSyntax = "{$syntaxPrefix} {$orderCode}";

            $query = http_build_query([
                'amount' => (int) $validated['amount'],
                'addInfo' => $transferSyntax,
                'accountName' => $setting->account_name,
            ]);

            $responseData['vietqr'] = [
                'vietqr_url' => "https://img.vietqr.io/image/{$setting->bank_code}-{$setting->account_number}-{$setting->template}.png?{$query}",
                'bank_code' => $setting->bank_code,
                'bank_name' => $setting->bank_name,
                'account_number' => $setting->account_number,
                'account_name' => $setting->account_name,
                'amount' => (int) $validated['amount'],
                'transfer_syntax' => $transferSyntax,
            ];
        }

        return response()->json([
            'success' => true,
            'message' => 'Khởi tạo thông tin thanh toán thành công.',
            'data' => $responseData,
            'errors' => null,
        ], 201);
    }

    /**
     * Get the payment status for an order.
     *
     * @group Payment Management
     */
    public function getPaymentStatus(Request $request): JsonResponse
    {
        $validated = $request->validate(['order_id' => ['required', 'integer', 'min:1']]);
        $payment = Payment::where('order_id', $validated['order_id'])->first();

        if (! $payment) {
            return response()->json([
                'success' => false,
                'message' => 'Không tìm thấy thông tin thanh toán cho đơn hàng này.',
                'data' => null,
                'errors' => ['order_id' => ['Thông tin thanh toán không tồn tại.']],
            ], 404);
        }

        return response()->json([
            'success' => true,
            'message' => 'Lấy trạng thái thanh toán thành công.',
            'data' => $payment,
            'errors' => null,
        ]);
    }

    /**
     * Process a payment gateway callback.
     *
     * @group Payment Management
     */
    public function handleCallback(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'order_id' => ['required', 'integer', 'min:1'],
            'status' => ['required', 'in:completed,failed'],
            'transaction_id' => ['nullable', 'string', 'max:255'],
            'payment_method' => ['sometimes', 'in:cod,vnpay,momo,bank_transfer'],
        ]);

        $payment = DB::transaction(function () use ($validated): Payment {
            $payment = Payment::where('order_id', $validated['order_id'])->lockForUpdate()->first();
            abort_unless($payment, 404, 'Không tìm thấy giao dịch thanh toán.');

            $payment->update([
                'status' => $validated['status'],
                'transaction_id' => $validated['transaction_id'] ?? $payment->transaction_id,
                'payment_method' => $validated['payment_method'] ?? $payment->payment_method,
                'paid_at' => $validated['status'] === 'completed' ? Carbon::now() : null,
            ]);

            return $payment->fresh();
        });

        return response()->json([
            'success' => true,
            'message' => 'Xử lý callback thanh toán thành công.',
            'data' => $payment,
            'errors' => null,
        ]);
    }
}