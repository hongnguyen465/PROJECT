<?php

namespace App\Services;

use App\Models\Order;
use App\Models\PaymentTransaction;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Http;

class MomoService
{
    public function createPayment(Order $order, PaymentTransaction $transaction): array
    {
        $endpoint = config('services.momo.endpoint', 'https://test-payment.momo.vn/v2/gateway/api/create');
        $partnerCode = config('services.momo.partner_code', env('MOMO_PARTNER_CODE', 'MOMOBKUN20180529'));
        $accessKey = config('services.momo.access_key', env('MOMO_ACCESS_KEY', 'klm05TvNBzhg7h7j'));
        $secretKey = config('services.momo.secret_key', env('MOMO_SECRET_KEY', 'at67qH6mk8w5Y1nAyMoYKMWACiEi2bsa'));
        $orderInfo = 'Thanh toan don hang #' . ($order->order_code ?? $order->order_number ?? $order->id);
        $amount = (string) ((int) ($order->total_amount ?? $order->total_price ?? 0));
        $orderId = $order->id . '_' . $transaction->id . '_' . time();
        $redirectUrl = config('services.momo.redirect_url')
            ?: rtrim((string) config('app.url', 'http://localhost:8003'), '/') . '/payment/momo/callback';
        $ipnUrl = config('services.momo.ipn_url')
            ?: rtrim((string) config('app.url', 'http://localhost:8003'), '/') . '/payment/momo/ipn';
        $extraData = (string) $order->id;
        $requestId = (string) time();
        $requestType = config('services.momo.request_type', env('MOMO_REQUEST_TYPE', 'payWithATM'));

        $rawHash = 'accessKey=' . $accessKey .
            '&amount=' . $amount .
            '&extraData=' . $extraData .
            '&ipnUrl=' . $ipnUrl .
            '&orderId=' . $orderId .
            '&orderInfo=' . $orderInfo .
            '&partnerCode=' . $partnerCode .
            '&redirectUrl=' . $redirectUrl .
            '&requestId=' . $requestId .
            '&requestType=' . $requestType;

        $data = [
            'partnerCode' => $partnerCode,
            'partnerName' => config('services.momo.partner_name', env('APP_NAME', 'Striker Sport')),
            'storeId'     => config('services.momo.store_id', 'StrikerStore'),
            'requestId'   => $requestId,
            'amount'      => $amount,
            'orderId'     => $orderId,
            'orderInfo'   => $orderInfo,
            'redirectUrl' => $redirectUrl,
            'ipnUrl'      => $ipnUrl,
            'lang'        => 'vi',
            'extraData'   => $extraData,
            'requestType' => $requestType,
            'signature'   => hash_hmac('sha256', $rawHash, $secretKey),
        ];

        $transaction->update([
            'gateway_order_id' => $orderId,
            'request_payload' => $data,
        ]);

        try {
            $response = Http::timeout(5)->withOptions([
                'verify' => filter_var(config('services.momo.verify_ssl', false), FILTER_VALIDATE_BOOLEAN),
            ])->post($endpoint, $data);

            $result = $response->json() ?? [];
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::warning('MoMo HTTP post warning: ' . $e->getMessage());
            $result = [
                'resultCode' => 99,
                'message' => 'Lỗi kết nối tới MoMo: ' . $e->getMessage(),
            ];
        }

        $transaction->update([
            'response_payload' => $result,
            'result_code' => isset($result['resultCode']) ? (int) $result['resultCode'] : null,
            'message' => $result['message'] ?? null,
            'status' => isset($result['payUrl']) ? 'initiated' : 'failed',
        ]);

        return $result;
    }

    public function isSuccessful(array $payload): bool
    {
        return (string) ($payload['resultCode'] ?? '') === '0';
    }

    public function markPaid(PaymentTransaction $transaction, array $payload): void
    {
        $transaction->update([
            'transaction_id' => $payload['transId'] ?? null,
            'result_code' => (int) ($payload['resultCode'] ?? 0),
            'message' => $payload['message'] ?? null,
            'response_payload' => $payload,
            'status' => 'paid',
            'paid_at' => Carbon::now(),
        ]);
    }

    public function markFailed(PaymentTransaction $transaction, array $payload): void
    {
        $transaction->update([
            'transaction_id' => $payload['transId'] ?? null,
            'result_code' => isset($payload['resultCode']) ? (int) $payload['resultCode'] : null,
            'message' => $payload['message'] ?? null,
            'response_payload' => $payload,
            'status' => 'failed',
        ]);
    }

    public function isValidSuccessfulResponse(array $payload): bool
    {
        return $this->isValidResponse($payload) && $this->isSuccessful($payload);
    }

    public function isValidResponse(array $payload): bool
    {
        if (!isset($payload['signature'])) {
            return false;
        }

        $accessKey = config('services.momo.access_key', 'klm05TvNBzhg7h7j');
        $secretKey = config('services.momo.secret_key', 'at67qH6mk8w5Y1nAyMoYKMWACiEi2bsa');

        $rawHash = 'accessKey=' . $accessKey .
            '&amount=' . ($payload['amount'] ?? '') .
            '&extraData=' . ($payload['extraData'] ?? '') .
            '&message=' . ($payload['message'] ?? '') .
            '&orderId=' . ($payload['orderId'] ?? '') .
            '&orderInfo=' . ($payload['orderInfo'] ?? '') .
            '&orderType=' . ($payload['orderType'] ?? '') .
            '&partnerCode=' . ($payload['partnerCode'] ?? '') .
            '&payType=' . ($payload['payType'] ?? '') .
            '&requestId=' . ($payload['requestId'] ?? '') .
            '&responseTime=' . ($payload['responseTime'] ?? '') .
            '&resultCode=' . ($payload['resultCode'] ?? '') .
            '&transId=' . ($payload['transId'] ?? '');

        return hash_equals(
            hash_hmac('sha256', $rawHash, $secretKey),
            (string) $payload['signature']
        );
    }

    public function orderId(array $payload): ?int
    {
        $orderId = $payload['extraData'] ?? null;
        return is_numeric($orderId) ? (int) $orderId : null;
    }
}
