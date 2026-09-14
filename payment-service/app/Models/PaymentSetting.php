<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['bank_code', 'bank_name', 'account_number', 'account_name', 'syntax_prefix', 'template', 'is_active'])]
class PaymentSetting extends Model
{
    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }
}
