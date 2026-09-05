<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('reviews', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id')->index();       // Tham chiếu Auth Service
            $table->unsignedBigInteger('product_id')->index();    // Tham chiếu Catalog Service
            $table->unsignedBigInteger('order_item_id')->unique(); // Tham chiếu Order Service
            $table->unsignedTinyInteger('rating');
            $table->text('comment')->nullable();
            $table->boolean('is_visible')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void {
        Schema::dropIfExists('reviews');
    }
};