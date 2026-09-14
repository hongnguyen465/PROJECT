<?php

namespace Database\Seeders;

use App\Models\Order;
use App\Models\OrderItem;
use Illuminate\Database\Seeder;

class OrderSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Đơn hàng đã giao thành công (delivered) - có thể viết review
        $order1 = Order::updateOrCreate(
            ['order_code' => 'STR-100001'],
            [
                'order_number' => 'STR-100001',
                'user_id' => 2, // customer@striker.vn
                'shipping_name' => 'Nguyễn Văn An',
                'shipping_phone' => '0977777777',
                'phone' => '0977777777',
                'shipping_address' => 'Số 123 Đường Cầu Giấy, Phường Dịch Vọng Hậu, Quận Cầu Giấy, Hà Nội',
                'subtotal' => 4290000,
                'shipping_fee' => 30000,
                'discount_amount' => 50000,
                'total_amount' => 4270000,
                'order_status' => 'delivered',
                'payment_status' => 'paid',
                'payment_method' => 'bank_transfer',
                'ghn_code' => 'GHN-STR-100001',
                'note' => 'Giao trong giờ hành chính giúp tôi.',
                'created_at' => now()->subDays(5),
                'updated_at' => now()->subDays(2),
            ]
        );

        OrderItem::where('order_id', $order1->id)->delete();
        OrderItem::create([
            'order_id' => $order1->id,
            'product_id' => 1,
            'variant_id' => 1,
            'product_name' => 'Nike Phantom GX Elite FG',
            'sku' => 'STR-NK-PGX-01-41-VOLT',
            'unit_price' => 4290000,
            'quantity' => 1,
            'subtotal' => 4290000,
            'variant_attributes' => ['size' => '41', 'color' => 'Volt'],
        ]);

        // 2. Đơn hàng đang giao (shipping)
        $order2 = Order::updateOrCreate(
            ['order_code' => 'STR-100002'],
            [
                'order_number' => 'STR-100002',
                'user_id' => 2, // customer@striker.vn
                'shipping_name' => 'Nguyễn Văn An',
                'shipping_phone' => '0977777777',
                'phone' => '0977777777',
                'shipping_address' => 'Số 123 Đường Cầu Giấy, Phường Dịch Vọng Hậu, Quận Cầu Giấy, Hà Nội',
                'subtotal' => 3890000,
                'shipping_fee' => 30000,
                'discount_amount' => 0,
                'total_amount' => 3920000,
                'order_status' => 'shipping',
                'payment_status' => 'paid',
                'payment_method' => 'cod',
                'ghn_code' => 'GHN-STR-100002',
                'note' => 'Gọi điện trước khi giao.',
                'created_at' => now()->subDays(2),
                'updated_at' => now()->subDay(),
            ]
        );

        OrderItem::where('order_id', $order2->id)->delete();
        OrderItem::create([
            'order_id' => $order2->id,
            'product_id' => 2,
            'variant_id' => 2,
            'product_name' => 'Adidas Predator Accuracy.1 FG',
            'sku' => 'STR-AD-PRED-02-42-WHITE',
            'unit_price' => 3890000,
            'quantity' => 1,
            'subtotal' => 3890000,
            'variant_attributes' => ['size' => '42', 'color' => 'White'],
        ]);
    }
}
