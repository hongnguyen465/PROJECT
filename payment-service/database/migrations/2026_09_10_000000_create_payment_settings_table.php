<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payment_settings', function (Blueprint $table) {
            $table->id();
            $table->string('bank_code', 20)->default('MB');
            $table->string('bank_name', 100)->default('MBBank');
            $table->string('account_number', 50)->default('0977777777');
            $table->string('account_name', 100)->default('NGUYEN VAN A');
            $table->string('syntax_prefix', 50)->default('STR');
            $table->string('template', 30)->default('compact2');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // Insert default setting
        DB::table('payment_settings')->insert([
            'bank_code' => 'MB',
            'bank_name' => 'MBBank (Ngân hàng Quân Đội)',
            'account_number' => '0977777777',
            'account_name' => 'STRIKER SPORT PRO',
            'syntax_prefix' => 'STR',
            'template' => 'compact2',
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('payment_settings');
    }
};
