<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['code', 'title', 'description', 'type', 'value', 'min_order_amount', 'max_discount_amount', 'usage_limit', 'used_count', 'limit_per_user', 'is_active', 'is_deleted', 'starts_at', 'expires_at'])]
class Coupon extends Model
{
    protected function casts(): array
    {
        return [
            'value' => 'decimal:2',
            'min_order_amount' => 'decimal:2',
            'max_discount_amount' => 'decimal:2',
            'usage_limit' => 'integer',
            'used_count' => 'integer',
            'limit_per_user' => 'integer',
            'is_active' => 'boolean',
            'is_deleted' => 'boolean',
            'starts_at' => 'datetime',
            'expires_at' => 'datetime',
        ];
    }

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }
}
