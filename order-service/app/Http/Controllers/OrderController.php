<?php

namespace App\Http\Controllers;

use App\Models\Cart;
use App\Models\Coupon;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\PaymentTransaction;
use App\Services\GhnService;
use App\Services\MomoService;
use Carbon\Carbon;
use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class OrderController extends Controller
{
    public function __construct(
        protected GhnService $ghnService
    ) {}

    /**
     * Create an order from items or user's cart.
     *
     * @group Order Management
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'user_id' => ['sometimes', 'nullable', 'integer', 'min:1'],
            'name' => ['sometimes', 'nullable', 'string', 'max:100'],
            'shipping_name' => ['sometimes', 'nullable', 'string', 'max:100'],
            'phone' => ['required', 'string', 'regex:/^(0|\+84)[0-9]{8,11}$/'],
            'address' => ['sometimes', 'nullable', 'string'],
            'shipping_address' => ['sometimes', 'nullable', 'string'],
            'to_district_id' => ['sometimes', 'nullable'],
            'to_ward_code' => ['sometimes', 'nullable'],
            'shipping_fee' => ['sometimes', 'numeric', 'min:0'],
            'discount_amount' => ['sometimes', 'numeric', 'min:0'],
            'payment_method' => ['sometimes', 'string', 'in:cod,momo,bank_transfer'],
            'coupon_id' => ['sometimes', 'nullable', 'integer', 'exists:coupons,id'],
            'coupon_code' => ['sometimes', 'nullable', 'string'],
            'note' => ['sometimes', 'nullable', 'string'],
            'items' => ['sometimes', 'array'],
            'items.*.product_id' => ['required_with:items', 'integer', 'min:1'],
            'items.*.product_name' => ['sometimes', 'nullable', 'string'],
            'items.*.name' => ['sometimes', 'nullable', 'string'],
            'items.*.price' => ['required_with:items', 'numeric', 'min:0'],
            'items.*.quantity' => ['required_with:items', 'integer', 'min:1'],
            'items.*.size' => ['sometimes', 'nullable', 'string'],
            'items.*.selectedSize' => ['sometimes', 'nullable', 'string'],
            'items.*.color' => ['sometimes', 'nullable', 'string'],
            'items.*.selectedColor' => ['sometimes', 'nullable', 'string'],
            'items.*.sku' => ['sometimes', 'nullable', 'string'],
        ]);

        try {
            $orderData = DB::transaction(function () use ($validated, $request): array {
                $userId = (int) $validated['user_id'];
                $cart = Cart::where('user_id', $userId)->with('items')->lockForUpdate()->first();

                // Determine items to order
                $orderItemsData = [];
                if (!empty($validated['items'])) {
                    $orderItemsData = $validated['items'];
                } elseif ($cart && $cart->items->isNotEmpty()) {
                    foreach ($cart->items as $ci) {
                        $orderItemsData[] = [
                            'product_id' => $ci->product_id,
                            'product_name' => $ci->product_name ?? ('Sản phẩm #' . $ci->product_id),
                            'price' => (float) $ci->price,
                            'quantity' => (int) $ci->quantity,
                            'size' => $ci->size ?? null,
                            'color' => $ci->color ?? null,
                            'sku' => $ci->sku ?? ('PRODUCT-' . $ci->product_id),
                        ];
                    }
                }

                if (empty($orderItemsData)) {
                    abort(422, 'Không thể tạo đơn hàng từ danh sách sản phẩm trống.');
                }

                $subtotal = collect($orderItemsData)->sum(function ($item) {
                    $p = (float) ($item['price'] ?? 0);
                    $q = (int) ($item['quantity'] ?? 1);
                    return $p * $q;
                });

                $shippingFee = (float) ($validated['shipping_fee'] ?? 30000);
                $discountAmount = (float) ($validated['discount_amount'] ?? 0);
                $couponId = $validated['coupon_id'] ?? null;
                $coupon = null;

                // 1. Validate and Apply Coupon strictly if provided
                if (!empty($validated['coupon_code']) || !empty($couponId)) {
                    $couponQuery = Coupon::query()->where('is_deleted', false)->where('is_active', true)->lockForUpdate();
                    if (!empty($couponId)) {
                        $coupon = $couponQuery->where('id', $couponId)->first();
                    } else {
                        $coupon = $couponQuery->where('code', Str::upper(trim($validated['coupon_code'])))->first();
                    }

                    if (!$coupon) {
                        abort(422, 'Mã giảm giá không tồn tại hoặc đã bị vô hiệu hóa.');
                    }

                    // Check expiration
                    if ($coupon->expires_at && Carbon::parse($coupon->expires_at)->endOfDay()->isPast()) {
                        abort(422, 'Mã giảm giá này đã hết hạn sử dụng.');
                    }

                    // Check usage limit
                    if ($coupon->usage_limit && $coupon->used_count >= $coupon->usage_limit) {
                        abort(422, 'Mã giảm giá này đã hết lượt sử dụng.');
                    }

                    // Check min order amount
                    if ($subtotal < (float) $coupon->min_order_amount) {
                        abort(422, 'Đơn hàng tối thiểu ' . number_format($coupon->min_order_amount, 0, ',', '.') . 'đ để sử dụng mã này.');
                    }

                    // Calculate discount
                    if ($coupon->type === 'fixed') {
                        $discountAmount = min($subtotal, (float) $coupon->value);
                    } elseif ($coupon->type === 'freeship') {
                        $freeshipDiscount = min($shippingFee, (float) ($coupon->value > 0 ? $coupon->value : $shippingFee));
                        $discountAmount = $freeshipDiscount;
                        $shippingFee = max(0, $shippingFee - $freeshipDiscount);
                    }

                    $coupon->increment('used_count');
                    $couponId = $coupon->id;
                }

                $totalAmount = max(0, $subtotal + $shippingFee - ($coupon && $coupon->type === 'freeship' ? 0 : $discountAmount));

                // 2. Call catalog-service to deduct stock in real time
                $catalogUrl = rtrim((string) config('services.catalog.base_url', 'http://127.0.0.1:8002'), '/');
                $deductPayload = [
                    'items' => collect($orderItemsData)->map(fn ($item) => [
                        'product_id' => (int) $item['product_id'],
                        'quantity' => (int) $item['quantity'],
                    ])->values()->all(),
                ];

                try {
                    $catalogResponse = Http::timeout(3)->post("{$catalogUrl}/api/products/deduct-stock", $deductPayload);
                    if (!$catalogResponse->successful()) {
                        $errBody = $catalogResponse->json();
                        $errMsg = $errBody['message'] ?? $errBody['error']['message'] ?? null;
                        if ($errMsg) {
                            Log::warning('Catalog stock deduction warning: ' . $errMsg);
                        }
                    }
                } catch (Exception $e) {
                    Log::warning('Cannot connect to Catalog Service to deduct stock: ' . $e->getMessage());
                }

                // 3. Create Order Record
                $orderNumber = 'ORD-' . now()->format('Ymd') . '-' . Str::upper(Str::random(6));
                $shippingName = $validated['name'] ?? $validated['shipping_name'] ?? 'Khách hàng';
                $shippingAddress = $validated['address'] ?? $validated['shipping_address'] ?? '';
                $order = Order::create([
                    'user_id' => $userId,
                    'order_number' => $orderNumber,
                    'order_code' => $orderNumber,
                    'coupon_id' => $couponId,
                    'shipping_name' => $shippingName,
                    'shipping_phone' => $validated['phone'],
                    'shipping_address' => $shippingAddress,
                    'phone' => $validated['phone'],
                    'subtotal' => $subtotal,
                    'shipping_fee' => $shippingFee,
                    'discount_amount' => $discountAmount,
                    'total_amount' => $totalAmount,
                    'order_status' => 'pending',
                    'status' => 'pending',
                    'payment_status' => 'unpaid',
                    'payment_method' => $validated['payment_method'] ?? 'cod',
                    'note' => $validated['note'] ?? null,
                ]);

                // 4. Save Snapshots into Order Items
                foreach ($orderItemsData as $item) {
                    $pid = (int) $item['product_id'];
                    $name = $item['product_name'] ?? $item['name'] ?? null;
                    if (empty($name)) {
                        $name = 'Product #' . $pid;

                        try {
                            $prodRes = Http::timeout(2)->get("{$catalogUrl}/api/products/{$pid}");
                            if ($prodRes->successful()) {
                                $pData = $prodRes->json();
                                $name = $pData['data']['name'] ?? $pData['name'] ?? ('Product #' . $pid);
                            }
                        } catch (Exception) {
                            $name = 'Product #' . $pid;
                        }
                    }

                    $price = (float) $item['price'];
                    $qty = (int) $item['quantity'];
                    $size = $item['size'] ?? $item['selectedSize'] ?? null;
                    $color = $item['color'] ?? $item['selectedColor'] ?? null;
                    $sku = $item['sku'] ?? ('STR-' . $pid . ($size ? '-' . $size : '') . ($color ? '-' . Str::upper($color) : ''));

                    $order->items()->create([
                        'product_id' => $pid,
                        'variant_id' => $pid,
                        'product_name' => $name,
                        'variant_attributes' => [
                            'size' => $size,
                            'color' => $color,
                        ],
                        'sku' => $sku,
                        'unit_price' => $price,
                        'quantity' => $qty,
                        'subtotal' => $price * $qty,
                    ]);
                }

                // 5. Clean up user's cart
                if ($cart) {
                    $cart->items()->delete();
                }

                // 6. Record PaymentTransaction & Generate MoMo Pay URL if momo
                $payUrl = null;
                if ($order->payment_method === 'momo') {
                    $transaction = PaymentTransaction::create([
                        'order_id' => $order->id,
                        'gateway' => 'momo',
                        'amount' => $order->total_amount,
                        'status' => 'pending',
                    ]);

                    try {
                        $momoService = app(\App\Services\MomoService::class);
                        $momoRes = $momoService->createPayment($order, $transaction);
                        $payUrl = $momoRes['payUrl'] ?? null;
                    } catch (\Exception $ex) {
                        Log::warning('MoMo create payment warning in store: ' . $ex->getMessage());
                    }
                } elseif ($order->payment_method === 'cod') {
                    PaymentTransaction::create([
                        'order_id' => $order->id,
                        'gateway' => 'cod',
                        'amount' => $order->total_amount,
                        'status' => 'pending',
                        'message' => 'Thanh toán khi nhận hàng (COD)',
                    ]);
                }

                return [
                    'order' => $order->load(['items', 'coupon', 'paymentTransactions']),
                    'pay_url' => $payUrl,
                ];
            });

            return response()->json([
                'success' => true,
                'message' => 'Đặt hàng thành công.',
                'data' => $orderData['order'],
                'pay_url' => $orderData['pay_url'],
                'errors' => null,
            ], 201);
        } catch (Exception $e) {
            $code = $e->getCode();
            $statusCode = is_numeric($code) && (int) $code >= 400 && (int) $code < 600 ? (int) $code : 422;

            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'data' => null,
                'errors' => ['order' => [$e->getMessage()]],
            ], $statusCode);
        }
    }

    /**
     * View payment checkout page.
     */
    public function paymentIndex(Request $request)
    {
        $cart = session('cart', []);
        $subtotal = collect($cart)->sum(fn ($item) => ((float) ($item['price'] ?? 0)) * ((int) ($item['quantity'] ?? 1)));

        return view('user.payment.index', [
            'cart' => $cart,
            'subtotal' => $subtotal,
            'user' => Auth::user(),
        ]);
    }

    /**
     * Process order payment from web form.
     *
     * @group Order Management
     */
    public function processPayment(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:100',
            'phone' => ['required', 'regex:/^0(3|5|7|8|9)\d{8}$/'],
            'address' => 'required|string|max:255',
            'to_district_id' => 'required|integer',
            'to_ward_code' => 'required|string',
            'payment_method' => 'required|in:cod,momo',
        ]);

        $cart = session('cart', []);
        if (empty($cart)) {
            if ($request->wantsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Không thể thanh toán vì giỏ hàng trống.',
                ], 422);
            }
            return redirect()->route('user.cart.index')->with('error', 'Không thể thanh toán vì giỏ hàng trống.');
        }

        // 1. Tính tổng tiền hàng
        $subtotal = collect($cart)->sum(fn ($item) => ((float) ($item['price'] ?? 0)) * ((int) ($item['quantity'] ?? 1)));
        $totalWeight = collect($cart)->sum(fn ($item) => 200 * ((int) ($item['quantity'] ?? 1)));

        // 2. Tính lại phí ship chuẩn xác từ GHN
        $shippingFee = 30000;
        try {
            $feeResponse = $this->ghnService->calculateFee(
                (int) $request->to_district_id,
                (string) $request->to_ward_code,
                max(100, $totalWeight)
            );
            if (!empty($feeResponse['total'])) {
                $shippingFee = (float) $feeResponse['total'];
            }
        } catch (\Exception $e) {
            Log::warning('GHN calculate fee error in processPayment: ' . $e->getMessage());
        }

        $finalTotal = $subtotal + $shippingFee;

        // 3. Tạo đơn hàng và chi tiết đơn hàng trong Database
        $order = DB::transaction(function () use ($request, $shippingFee, $subtotal, $finalTotal, $cart) {
            $orderNumber = 'ORD-' . now()->format('Ymd') . '-' . Str::upper(Str::random(6));
            $order = Order::create([
                'user_id' => Auth::id() ?? 1,
                'order_number' => $orderNumber,
                'order_code' => $orderNumber,
                'name' => $request->name,
                'shipping_name' => $request->name,
                'address' => $request->address,
                'shipping_address' => $request->address,
                'phone' => $request->phone,
                'shipping_phone' => $request->phone,
                'subtotal' => $subtotal,
                'shipping_fee' => $shippingFee,
                'total_amount' => $finalTotal,
                'status' => 'pending',
                'order_status' => 'pending',
                'payment_status' => 'unpaid',
                'payment_method' => $request->payment_method,
            ]);

            foreach ($cart as $item) {
                $pid = (int) ($item['id'] ?? $item['product_id'] ?? 1);
                $pPrice = (float) ($item['price'] ?? 0);
                $pQty = (int) ($item['quantity'] ?? 1);
                $order->items()->create([
                    'product_id' => $pid,
                    'variant_id' => $pid,
                    'product_name' => $item['name'] ?? ('Product #' . $pid),
                    'variant_attributes' => [],
                    'sku' => $item['sku'] ?? ('STR-' . $pid),
                    'unit_price' => $pPrice,
                    'quantity' => $pQty,
                    'subtotal' => $pPrice * $pQty,
                ]);
            }

            return $order;
        });

        // Xóa session giỏ hàng
        session()->forget('cart');

        // 4. Phân luồng thanh toán
        if ($request->payment_method === 'momo') {
            PaymentTransaction::create([
                'order_id' => $order->id,
                'gateway' => 'momo',
                'amount' => $order->total_amount,
                'status' => 'pending',
            ]);

            if ($request->wantsJson()) {
                return response()->json([
                    'success' => true,
                    'message' => 'Khởi tạo đơn hàng MoMo thành công.',
                    'data' => $order,
                    'redirect_url' => route('user.orders.momo.start', $order),
                ]);
            }

            return redirect()->route('user.orders.momo.start', $order);
        }

        // Nhánh COD: Tạo vận đơn GHN
        PaymentTransaction::create([
            'order_id' => $order->id,
            'gateway' => 'cod',
            'amount' => $order->total_amount,
            'status' => 'pending',
            'message' => 'Thanh toán khi nhận hàng',
        ]);

        try {
            $order->load('items');
            $ghnOrderResponse = $this->ghnService->createShippingOrder($order);
            if (!empty($ghnOrderResponse['order_code'])) {
                $order->update([
                    'status' => 'cod_ordered',
                    'order_status' => 'shipping',
                    'ghn_code' => $ghnOrderResponse['order_code'],
                ]);

                if ($request->wantsJson()) {
                    return response()->json([
                        'success' => true,
                        'message' => 'Đặt hàng thành công! Mã vận đơn GHN: ' . $ghnOrderResponse['order_code'],
                        'data' => $order,
                    ]);
                }

                return redirect()->route('user.orders.index')
                    ->with('success', 'Đặt hàng thành công! Mã vận đơn GHN: ' . $ghnOrderResponse['order_code']);
            }
        } catch (\Exception $e) {
            Log::error('GHN COD Order Failed: ' . $e->getMessage());
        }

        $order->update(['status' => 'cod_ordered']);

        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'message' => 'Đặt hàng thành công nhưng chưa thể tạo vận đơn GHN tự động.',
                'data' => $order,
            ]);
        }

        return redirect()->route('user.orders.index')
            ->with('warning', 'Đặt hàng thành công nhưng chưa thể tạo vận đơn GHN tự động.');
    }

    /**
     * List orders (supports admin & user scoping).
     *
     * @group Order Management
     */
    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'user_id' => ['sometimes', 'nullable', 'integer', 'min:1'],
            'status' => ['sometimes', 'nullable', 'string'],
            'search' => ['sometimes', 'nullable', 'string'],
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:100'],
        ]);

        $orders = Order::with(['user', 'items', 'coupon', 'paymentTransactions'])
            ->when($validated['user_id'] ?? null, fn ($q, $uid) => $q->where('user_id', $uid))
            ->when($validated['status'] ?? null, function ($q, $st): void {
                if ($st !== 'all' && $st !== 'ALL') {
                    $q->where(function ($sub) use ($st) {
                        $sub->where('order_status', $st)
                            ->orWhere('status', $st);
                    });
                }
            })
            ->when($validated['search'] ?? null, function ($q, $search): void {
                $q->where(function ($sub) use ($search): void {
                    $sub->where('order_number', 'like', "%{$search}%")
                        ->orWhere('order_code', 'like', "%{$search}%")
                        ->orWhere('id', 'like', "%{$search}%")
                        ->orWhere('shipping_name', 'like', "%{$search}%")
                        ->orWhere('shipping_phone', 'like', "%{$search}%")
                        ->orWhere('ghn_code', 'like', "%{$search}%");
                });
            })
            ->latest()
            ->paginate($validated['per_page'] ?? 15)
            ->withQueryString();

        $pendingCount = Order::where(function ($q) {
            $q->whereIn('order_status', ['pending', 'processing'])
              ->orWhereIn('status', ['pending', 'processing']);
        })->count();

        $stats = [
            'total' => Order::count(),
            'pending' => $pendingCount,
            'shipping' => Order::where('order_status', 'shipping')->orWhere('status', 'shipping')->count(),
            'delivered' => Order::whereIn('order_status', ['delivered', 'paid'])->orWhereIn('status', ['delivered', 'paid'])->count(),
            'cancelled' => Order::where('order_status', 'cancelled')->orWhere('status', 'cancelled')->count(),
        ];

        if (! $request->wantsJson() && ! $request->is('api/*')) {
            return view('user.orders.index', [
                'orders' => $orders,
                'stats' => $stats,
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Lấy danh sách đơn hàng thành công.',
            'data' => $orders->items(),
            'stats' => $stats,
            'pagination' => [
                'current_page' => $orders->currentPage(),
                'per_page' => $orders->perPage(),
                'total' => $orders->total(),
                'last_page' => $orders->lastPage(),
            ],
            'errors' => null,
        ]);
    }

    /**
     * Get order statistics for Admin.
     */
    public function stats(): JsonResponse
    {
        $pendingCount = Order::where(function ($q) {
            $q->whereIn('order_status', ['pending', 'processing'])
              ->orWhereIn('status', ['pending', 'processing']);
        })->count();

        return response()->json([
            'success' => true,
            'data' => [
                'total' => Order::count(),
                'pending' => $pendingCount,
                'shipping' => Order::where('order_status', 'shipping')->orWhere('status', 'shipping')->count(),
                'delivered' => Order::whereIn('order_status', ['delivered', 'paid'])->orWhereIn('status', ['delivered', 'paid'])->count(),
                'cancelled' => Order::where('order_status', 'cancelled')->orWhere('status', 'cancelled')->count(),
            ],
        ]);
    }

    /**
     * Show an order by ID.
     *
     * @group Order Management
     */
    public function show(Order $order): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => 'Lấy thông tin đơn hàng thành công.',
            'data' => $order->load(['items', 'coupon']),
            'errors' => null,
        ]);
    }

    /**
     * Update order status or payment status (Admin).
     *
     * @group Order Management
     */
    public function updateStatus(Request $request, Order $order): JsonResponse
    {
        $validated = $request->validate([
            'order_status' => ['sometimes', 'string', 'in:pending,processing,shipping,delivered,cancelled'],
            'payment_status' => ['sometimes', 'string', 'in:unpaid,pending,paid,failed,refunded'],
            'ghn_code' => ['sometimes', 'nullable', 'string', 'max:100'],
        ]);

        if (isset($validated['order_status'])) {
            $order->order_status = $validated['order_status'];
            $order->status = $validated['order_status'];
        }
        if (isset($validated['payment_status'])) {
            $order->payment_status = $validated['payment_status'];
        }
        if (isset($validated['ghn_code'])) {
            $order->ghn_code = trim($validated['ghn_code']);
        }

        $order->save();

        return response()->json([
            'success' => true,
            'message' => 'Cập nhật trạng thái đơn hàng thành công.',
            'data' => $order->fresh()->load('items'),
            'errors' => null,
        ]);
    }

    /**
     * Create GHN shipping order and persist ghn_code.
     *
     * @group Order Management
     */
    public function createGhnShipping(Request $request, Order $order): JsonResponse
    {
        $validated = $request->validate([
            'to_district_id' => ['sometimes', 'integer'],
            'to_ward_code' => ['sometimes', 'string'],
        ]);

        try {
            $ghnResponse = $this->ghnService->createShippingOrder($order, $validated);
            $ghnOrderCode = $ghnResponse['order_code'] ?? null;

            if (! $ghnOrderCode) {
                throw new Exception('Không nhận được mã vận đơn từ GHN API.');
            }

            $order->update([
                'ghn_code' => $ghnOrderCode,
                'order_status' => 'shipping',
                'status' => 'shipping',
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Đã tạo vận đơn GHN thành công: '.$ghnOrderCode,
                'data' => [
                    'order' => $order->fresh()->load('items'),
                    'ghn_code' => $ghnOrderCode,
                    'ghn_details' => $ghnResponse,
                ],
                'errors' => null,
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Tạo đơn GHN thất bại: '.$e->getMessage(),
                'data' => null,
                'errors' => ['ghn' => [$e->getMessage()]],
            ], 422);
        }
    }
}