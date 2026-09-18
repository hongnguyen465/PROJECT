<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['user_id', 'order_number', 'total_amount', 'status', 'shipping_address', 'phone', 'order_code', 'coupon_id', 'shipping_name', 'shipping_phone', 'subtotal', 'shipping_fee', 'discount_amount', 'order_status', 'payment_status', 'payment_method', 'ghn_code', 'note'])]
class Order extends Model
{
    protected $fillable = [
        'user_id',
        'order_number',
        'order_code',
        'coupon_id',
        'shipping_name',
        'shipping_phone',
        'phone',
        'shipping_address',
        'subtotal',
        'shipping_fee',
        'discount_amount',
        'total_amount',
        'status',
        'order_status',
        'payment_status',
        'payment_method',
        'ghn_code',
        'note',
    ];
    protected function casts(): array
    {
        return [
            'user_id' => 'integer',
            'coupon_id' => 'integer',
            'total_amount' => 'decimal:2',
            'subtotal' => 'decimal:2',
            'shipping_fee' => 'decimal:2',
            'discount_amount' => 'decimal:2',
        ];
    }

    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    public function coupon(): BelongsTo
    {
        return $this->belongsTo(Coupon::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function paymentTransactions(): HasMany
    {
        return $this->hasMany(PaymentTransaction::class);
    }

    public function getTotalPriceAttribute(): float
    {
        return (float) ($this->total_amount ?? 0);
    }
}