<?php

namespace Database\Seeders;

use App\Models\Address;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Xóa tài khoản mẫu cũ nếu có
        User::whereIn('email', ['admin@gmail.com', 'customer@gmail.com'])->delete();

        // 1. Tài khoản Admin chuẩn
        $admin = User::updateOrCreate(
            ['email' => 'admin@striker.vn'],
            [
                'name' => 'Quản Trị Viên Striker',
                'phone_number' => '0988888888',
                'password' => Hash::make('password123'),
                'role' => 'admin',
                'avatar' => 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
                'email_verified_at' => now(),
                'is_active' => true,
            ]
        );

        // 2. Tài khoản Khách hàng (Customer) chuẩn
        $customer = User::updateOrCreate(
            ['email' => 'customer@striker.vn'],
            [
                'name' => 'Nguyễn Văn An',
                'phone_number' => '0977777777',
                'password' => Hash::make('password123'),
                'role' => 'user',
                'avatar' => 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80',
                'email_verified_at' => now(),
                'is_active' => true,
            ]
        );

        // 3. Sổ địa chỉ mẫu cho Customer
        Address::updateOrCreate(
            [
                'user_id' => $customer->id,
                'phone' => '0977777777',
                'street_address' => 'Số 123 Đường Cầu Giấy',
            ],
            [
                'recipient_name' => 'Nguyễn Văn An',
                'province' => 'Hà Nội',
                'district' => 'Quận Cầu Giấy',
                'ward' => 'Phường Dịch Vọng Hậu',
                'is_default' => true,
            ]
        );

        Address::updateOrCreate(
            [
                'user_id' => $customer->id,
                'phone' => '0977777777',
                'street_address' => 'Tầng 18 Tòa nhà Landmark 81, 720A Điện Biên Phủ',
            ],
            [
                'recipient_name' => 'Nguyễn Văn An (Văn phòng)',
                'province' => 'Hồ Chí Minh',
                'district' => 'Quận Bình Thạnh',
                'ward' => 'Phường 22',
                'is_default' => false,
            ]
        );
    }
}