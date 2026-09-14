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
            'type' => ['nullable', 'string', 'in:ALL,fixed,freeship'],
            'status' => ['nullable', 'string', 'in:ALL,ACTIVE,ENDED'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $now = Carbon::now();

        $coupons = Coupon::query()
            ->where('is_deleted', false)
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
                    $sub->whereNull('expires_at')->orWhere('expires_at', '>=', $now->startOfDay());
                })->where(function ($sub): void {
                    $sub->whereNull('usage_limit')->orWhereRaw('used_count < usage_limit');
                });
            })
            ->when(($validated['status'] ?? 'ALL') === 'ENDED', function ($q) use ($now): void {
                $q->where(function ($sub) use ($now): void {
                    $sub->where('expires_at', '<', $now->startOfDay())
                        ->orWhereRaw('used_count >= usage_limit');
                });
            })
            ->latest()
            ->paginate($validated['per_page'] ?? 50);

        return response()->json([
            'success' => true,
            'message' => 'Lấy danh sách voucher thành công.',
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
     * Create a new coupon/voucher.
     *
     * @group Coupon Management
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'code' => ['required', 'string', 'max:50', 'regex:/^[A-Z0-9_-]+$/', 'unique:coupons,code'],
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'type' => ['required', 'string', 'in:fixed,freeship'],
            'value' => ['required', 'numeric', 'min:0'],
            'min_order_amount' => ['nullable', 'numeric', 'min:0'],
            'max_discount_amount' => ['nullable', 'numeric', 'min:0'],
            'usage_limit' => ['nullable', 'integer', 'min:1', 'max:1000000'],
            'expires_at' => ['required', 'date', 'after_or_equal:today'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $validated['code'] = Str::upper(trim($validated['code']));
        $validated['title'] = trim($validated['title']);
        $validated['description'] = isset($validated['description']) ? trim($validated['description']) : null;
        $validated['used_count'] = 0;
        $validated['is_deleted'] = false;

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
        if ($coupon->is_deleted) {
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
        if ($coupon->is_deleted) {
            return response()->json([
                'success' => false,
                'message' => 'Không thể cập nhật voucher đã bị xóa.',
                'data' => null,
                'errors' => ['coupon' => ['Voucher đã bị xóa.']],
            ], 404);
        }

        $validated = $request->validate([
            'code' => ['sometimes', 'string', 'max:50', 'regex:/^[A-Z0-9_-]+$/', 'unique:coupons,code,'.$coupon->id],
            'title' => ['sometimes', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'type' => ['sometimes', 'string', 'in:fixed,freeship'],
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
        $coupon->update(['is_deleted' => true]);

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
            'code' => ['required', 'string'],
            'subtotal' => ['required', 'numeric', 'min:0'],
            'shipping_fee' => ['sometimes', 'numeric', 'min:0'],
        ]);

        $cleanCode = Str::upper(trim($validated['code']));
        $subtotal = (float) $validated['subtotal'];
        $shippingFee = (float) ($validated['shipping_fee'] ?? 30000);

        $coupon = Coupon::where('code', $cleanCode)
            ->where('is_deleted', false)
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

        if ($subtotal < (float) $coupon->min_order_amount) {
            return response()->json([
                'success' => false,
                'message' => 'Đơn hàng tối thiểu '.number_format($coupon->min_order_amount, 0, ',', '.').'đ để sử dụng mã này.',
                'data' => null,
                'errors' => ['subtotal' => ['Chưa đạt giá trị đơn tối thiểu.']],
            ], 422);
        }

        $discountAmount = 0;
        if ($coupon->type === 'fixed') {
            $discountAmount = min($subtotal, (float) $coupon->value);
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
            'errors' => null,
        ]);
    }
}
