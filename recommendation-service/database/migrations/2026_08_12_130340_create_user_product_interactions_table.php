<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('user_product_interactions', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');    // Tham chiếu Auth Service
            $table->unsignedBigInteger('product_id'); // Tham chiếu Catalog Service
            $table->string('interaction_type', 30);
            $table->unsignedTinyInteger('weight');
            $table->timestamps();

            $table->index(['user_id', 'product_id', 'interaction_type'], 'upi_user_product_type_idx');
        });
    }

    public function down(): void {
        Schema::dropIfExists('user_product_interactions');
    }
};