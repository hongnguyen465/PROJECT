<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('cart_items', 'price')) {
            Schema::table('cart_items', function (Blueprint $table): void {
                $table->decimal('price', 12, 2)->default(0)->after('quantity');
            });
        }

        if (! Schema::hasIndex('cart_items', ['cart_id', 'product_id'])) {
            Schema::table('cart_items', function (Blueprint $table): void {
                $table->unique(['cart_id', 'product_id']);
            });
        }

        if (! Schema::hasColumn('orders', 'order_number')) {
            Schema::table('orders', function (Blueprint $table): void {
                $table->string('order_number', 50)->unique()->after('id');
            });
        }

        if (! Schema::hasColumn('orders', 'status')) {
            Schema::table('orders', function (Blueprint $table): void {
                $table->enum('status', ['pending', 'paid', 'cancelled'])->default('pending')->after('total_amount');
            });
        }

        if (! Schema::hasColumn('orders', 'phone')) {
            Schema::table('orders', function (Blueprint $table): void {
                $table->string('phone', 30)->after('shipping_address');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('orders', 'phone')) {
            Schema::table('orders', function (Blueprint $table): void {
                $table->dropColumn('phone');
            });
        }

        if (Schema::hasColumn('orders', 'status')) {
            Schema::table('orders', function (Blueprint $table): void {
                $table->dropColumn('status');
            });
        }

        if (Schema::hasColumn('orders', 'order_number')) {
            Schema::table('orders', function (Blueprint $table): void {
                $table->dropUnique(['order_number']);
                $table->dropColumn('order_number');
            });
        }

        if (Schema::hasColumn('cart_items', 'price')) {
            Schema::table('cart_items', function (Blueprint $table): void {
                $table->dropColumn('price');
            });
        }
    }
};