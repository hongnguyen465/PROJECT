<?php

namespace App\Http\Controllers;

use App\Models\Coupon;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class CouponController extends Controller
{
    /**
     * List all non-deleted coupons with filters.
     *
     * @group Coupon Management
     */
    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'type' => ['nullable', 'string', 'in:ALL,fixed,freeship,percent'],
            'status' => ['nullable', 'string', 'in:ALL,ACTIVE,ENDED'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $now = Carbon::now();

        $coupons = Coupon::query()
            ->when($validated['search'] ?? null, function ($q, $search): void {
                $q->where(function ($sub) use ($search): void {
                    $sub->where('code', 'like', "%{$search}%")
                        ->orWhere('title', 'like', "%{$search}%")
                        ->orWhere('description', 'like', "%{$search}%");
                });
            })
            ->when(($validated['type'] ?? 'ALL') !== 'ALL', fn ($q) => $q->where('type', $validated['type']))
            ->when(($validated['status'] ?? 'ALL') === 'ACTIVE', function ($q) use ($now): void {
                $q->where(function ($sub) use ($now): void {
                    $sub->whereNull('expires_at')
                        ->orWhere('expires_at', '>=', $now);
                });
            })
            ->when(($validated['status'] ?? 'ALL') === 'ENDED', function ($q) use ($now): void {
                $q->where('expires_at', '<', $now);
            })
            ->latest()
            ->paginate($validated['per_page'] ?? 15)
            ->withQueryString();

        return response()->json([
            'success' => true,
            'message' => 'Lấy danh sách mã giảm giá thành công.',
            'data' => $coupons->items(),
            'pagination' => [
                'current_page' => $coupons->currentPage(),
                'per_page' => $coupons->perPage(),
                'total' => $coupons->total(),
                'last_page' => $coupons->lastPage(),
            ],
            'errors' => null,
        ]);
    }

    /**
     * Issue a new coupon.
     *
     * @group Coupon Management
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'code' => ['required', 'string', 'max:50', 'regex:/^[A-Z0-9_-]+$/', 'unique:coupons,code'],
            'title' => ['sometimes', 'nullable', 'string', 'max:255'],
            'description' => ['sometimes', 'nullable', 'string'],
            'type' => ['required', 'string', 'in:fixed,freeship,percent'],
            'value' => ['required', 'numeric', 'min:0'],
            'min_order_amount' => ['nullable', 'numeric', 'min:0'],
            'max_discount_amount' => ['nullable', 'numeric', 'min:0'],
            'usage_limit' => ['nullable', 'integer', 'min:1', 'max:1000000'],
            'expires_at' => ['required', 'date', 'after_or_equal:today'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $validated['code'] = Str::upper(trim($validated['code']));
        $validated['title'] = !empty($validated['title']) ? trim($validated['title']) : $validated['code'];
        $validated['description'] = isset($validated['description']) ? trim($validated['description']) : null;
        $validated['used_count'] = 0;

        if ($validated['type'] === 'freeship') {
            $validated['value'] = 0;
        } elseif ($validated['value'] <= 0) {
            return response()->json([
                'success' => false,
                'message' => 'Giá trị giảm tiền mặt phải lớn hơn 0đ.',
                'data' => null,
                'errors' => ['value' => ['Giá trị giảm phải lớn hơn 0đ.']],
            ], 422);
        }

        $coupon = Coupon::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Phát hành voucher mới thành công.',
            'data' => $coupon,
            'errors' => null,
        ], 201);
    }

    /**
     * Show a coupon.
     *
     * @group Coupon Management
     */
    public function show(Coupon $coupon): JsonResponse
    {
        if ($coupon->trashed()) {
            return response()->json([
                'success' => false,
                'message' => 'Voucher không tồn tại hoặc đã bị xóa.',
                'data' => null,
                'errors' => ['coupon' => ['Voucher đã bị xóa.']],
            ], 404);
        }

        return response()->json([
            'success' => true,
            'message' => 'Lấy thông tin voucher thành công.',
            'data' => $coupon,
            'errors' => null,
        ]);
    }

    /**
     * Update a coupon.
     *
     * @group Coupon Management
     */
    public function update(Request $request, Coupon $coupon): JsonResponse
    {
        if ($coupon->trashed()) {
            return response()->json([
                'success' => false,
                'message' => 'Không thể cập nhật voucher đã bị xóa.',
                'data' => null,
                'errors' => ['coupon' => ['Voucher đã bị xóa.']],
            ], 404);
        }

        $validated = $request->validate([
            'code' => ['sometimes', 'string', 'max:50', 'regex:/^[A-Z0-9_-]+$/', 'unique:coupons,code,'.$coupon->id],
            'title' => ['sometimes', 'nullable', 'string', 'max:255'],
            'description' => ['sometimes', 'nullable', 'string'],
            'type' => ['sometimes', 'string', 'in:fixed,freeship,percent'],
            'value' => ['sometimes', 'numeric', 'min:0'],
            'min_order_amount' => ['nullable', 'numeric', 'min:0'],
            'max_discount_amount' => ['nullable', 'numeric', 'min:0'],
            'usage_limit' => ['nullable', 'integer', 'min:1', 'max:1000000'],
            'expires_at' => ['sometimes', 'date'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        if (isset($validated['code'])) {
            $validated['code'] = Str::upper(trim($validated['code']));
        }
        if (isset($validated['title'])) {
            $validated['title'] = trim($validated['title']);
        }
        if (isset($validated['type']) && $validated['type'] === 'freeship') {
            $validated['value'] = 0;
        }

        $coupon->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Cập nhật voucher thành công.',
            'data' => $coupon->fresh(),
            'errors' => null,
        ]);
    }

    /**
     * Soft delete a coupon.
     *
     * @group Coupon Management
     */
    public function destroy(Coupon $coupon): JsonResponse
    {
        $coupon->delete();

        return response()->json([
            'success' => true,
            'message' => 'Đã xóa voucher thành công (xóa mềm).',
            'data' => null,
            'errors' => null,
        ]);
    }

    /**
     * Apply and validate a coupon code for an order amount.
     *
     * @group Coupon Management
     */
    public function apply(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'code' => ['required_without:coupon_code', 'nullable', 'string'],
            'coupon_code' => ['required_without:code', 'nullable', 'string'],
            'subtotal' => ['sometimes', 'nullable', 'numeric', 'min:0'],
            'order_amount' => ['sometimes', 'nullable', 'numeric', 'min:0'],
            'total' => ['sometimes', 'nullable', 'numeric', 'min:0'],
            'amount' => ['sometimes', 'nullable', 'numeric', 'min:0'],
            'shipping_fee' => ['sometimes', 'nullable', 'numeric', 'min:0'],
        ]);

        $rawCode = $validated['code'] ?? $validated['coupon_code'] ?? $request->input('code') ?? $request->input('coupon_code') ?? '';
        $cleanCode = Str::upper(trim((string) $rawCode));

        $subtotal = (float) (
            $validated['subtotal']
            ?? $validated['order_amount']
            ?? $validated['total']
            ?? $validated['amount']
            ?? $request->input('subtotal')
            ?? $request->input('order_amount')
            ?? $request->input('total')
            ?? 0
        );

        $shippingFee = (float) (
            $validated['shipping_fee']
            ?? $request->input('shipping_fee')
            ?? 30000
        );

        $coupon = Coupon::where('code', $cleanCode)
            ->first();

        if (! $coupon || ! $coupon->is_active) {
            return response()->json([
                'success' => false,
                'message' => 'Mã giảm giá không tồn tại hoặc đã bị vô hiệu hóa.',
                'data' => null,
                'errors' => ['code' => ['Mã giảm giá không hợp lệ.']],
            ], 422);
        }

        if ($coupon->expires_at && Carbon::parse($coupon->expires_at)->endOfDay()->isPast()) {
            return response()->json([
                'success' => false,
                'message' => 'Mã giảm giá này đã hết hạn sử dụng.',
                'data' => null,
                'errors' => ['code' => ['Mã giảm giá đã hết hạn.']],
            ], 422);
        }

        if ($coupon->usage_limit && $coupon->used_count >= $coupon->usage_limit) {
            return response()->json([
                'success' => false,
                'message' => 'Mã giảm giá này đã hết lượt sử dụng.',
                'data' => null,
                'errors' => ['code' => ['Mã giảm giá đã hết lượt.']],
            ], 422);
        }

        if ($subtotal > 0 && $subtotal < (float) $coupon->min_order_amount) {
            return response()->json([
                'success' => false,
                'message' => 'Đơn hàng tối thiểu '.number_format($coupon->min_order_amount, 0, ',', '.').'đ để sử dụng mã này.',
                'data' => null,
                'errors' => ['subtotal' => ['Chưa đạt giá trị đơn tối thiểu.']],
            ], 422);
        }

        $discountAmount = 0;
        if ($coupon->type === 'fixed') {
            $discountAmount = min($subtotal > 0 ? $subtotal : (float) $coupon->value, (float) $coupon->value);
        } elseif ($coupon->type === 'percent') {
            $rawDiscount = ($subtotal * (float) $coupon->value) / 100;
            $discountAmount = ($coupon->max_discount_amount && (float) $coupon->max_discount_amount > 0)
                ? min($rawDiscount, (float) $coupon->max_discount_amount)
                : $rawDiscount;
        } elseif ($coupon->type === 'freeship') {
            $discountAmount = $shippingFee;
        }

        return response()->json([
            'success' => true,
            'message' => 'Áp dụng mã giảm giá thành công.',
            'data' => [
                'coupon' => $coupon,
                'discount_amount' => $discountAmount,
                'type' => $coupon->type,
                'code' => $coupon->code,
            ],
            'coupon' => $coupon,
            'discount_amount' => $discountAmount,
            'type' => $coupon->type,
            'code' => $coupon->code,
            'errors' => null,
        ]);
    }
}
