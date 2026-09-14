<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('categories', 'description')) {
            Schema::table('categories', function (Blueprint $table): void {
                $table->text('description')->nullable()->after('slug');
            });
        }

        Schema::table('products', function (Blueprint $table): void {
            if (! Schema::hasColumn('products', 'sku')) {
                $table->string('sku', 100)->unique()->after('slug');
            }

            if (! Schema::hasColumn('products', 'price')) {
                $table->decimal('price', 12, 2)->after('description');
            }

            if (! Schema::hasColumn('products', 'stock')) {
                $table->unsignedInteger('stock')->default(0)->after('price');
            }

            if (! Schema::hasColumn('products', 'brand')) {
                $table->string('brand')->after('stock');
            }

            if (! Schema::hasColumn('products', 'image_url')) {
                $table->string('image_url')->nullable()->after('brand');
            }
        });

        if (Schema::hasColumn('products', 'brand_id')) {
            Schema::table('products', function (Blueprint $table): void {
                $table->dropForeign(['brand_id']);
                $table->dropIndex(['brand_id', 'is_active']);
                $table->dropColumn('brand_id');
            });
        }
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table): void {
            if (Schema::hasColumn('products', 'brand_id') === false) {
                $table->foreignId('brand_id')->nullable()->constrained('brands')->nullOnDelete();
            }

            foreach (['sku', 'price', 'stock', 'brand', 'image_url'] as $column) {
                if (Schema::hasColumn('products', $column)) {
                    $table->dropColumn($column);
                }
            }
        });

        if (Schema::hasColumn('categories', 'description')) {
            Schema::table('categories', function (Blueprint $table): void {
                $table->dropColumn('description');
            });
        }
    }
};