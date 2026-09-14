<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Extend Coupons Table
        Schema::table('coupons', function (Blueprint $table): void {
            if (! Schema::hasColumn('coupons', 'title')) {
                $table->string('title', 255)->nullable()->after('code');
            }

            if (! Schema::hasColumn('coupons', 'description')) {
                $table->text('description')->nullable()->after('title');
            }

            if (! Schema::hasColumn('coupons', 'is_deleted')) {
                $table->boolean('is_deleted')->default(false)->index()->after('is_active');
            }
        });

        // 2. Extend Orders Table
        Schema::table('orders', function (Blueprint $table): void {
            if (! Schema::hasColumn('orders', 'ghn_code')) {
                $table->string('ghn_code', 100)->nullable()->index()->after('order_status');
            }

            if (! Schema::hasColumn('orders', 'payment_method')) {
                $table->string('payment_method', 30)->default('cod')->after('payment_status');
            }
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table): void {
            foreach (['ghn_code', 'payment_method'] as $column) {
                if (Schema::hasColumn('orders', $column)) {
                    $table->dropColumn($column);
                }
            }
        });

        Schema::table('coupons', function (Blueprint $table): void {
            foreach (['title', 'description', 'is_deleted'] as $column) {
                if (Schema::hasColumn('coupons', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
