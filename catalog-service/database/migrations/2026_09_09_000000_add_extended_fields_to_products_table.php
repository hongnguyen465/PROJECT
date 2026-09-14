<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table): void {
            if (! Schema::hasColumn('products', 'old_price')) {
                $table->decimal('old_price', 12, 2)->nullable()->after('price');
            }

            if (! Schema::hasColumn('products', 'images')) {
                $table->json('images')->nullable()->after('image_url');
            }

            if (! Schema::hasColumn('products', 'colors')) {
                $table->json('colors')->nullable()->after('images');
            }

            if (! Schema::hasColumn('products', 'sizes')) {
                $table->json('sizes')->nullable()->after('colors');
            }

            if (! Schema::hasColumn('products', 'is_deleted')) {
                $table->boolean('is_deleted')->default(false)->index()->after('is_active');
            }
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table): void {
            foreach (['old_price', 'images', 'colors', 'sizes', 'is_deleted'] as $column) {
                if (Schema::hasColumn('products', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
