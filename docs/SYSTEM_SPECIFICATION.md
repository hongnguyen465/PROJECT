# ĐẶC TẢ KỸ THUẬT HỆ THỐNG (SYSTEM SPECIFICATION)
## DỰ ÁN: CYBER-SPORT E-COMMERCE MICROSERVICES PLATFORM (CRS)
*Phiên bản: 2.0.0 (Reverse Engineered từ Codebase thực tế)*  
*Thời gian tạo: 09/09/2026*

---

# MỤC LỤC
1. [TỔNG QUAN HỆ THỐNG & KIẾN TRÚC MICROSERVICES](#1-tổng-quan-hệ-thống--kiến-trúc-microservices)
2. [DATABASE SCHEMA & QUAN HỆ THỰC THỂ (ERD & TABLES)](#2-database-schema--quan-hệ-thực-thể-erd--tables)
3. [MA TRẬN DỮ LIỆU FRONTEND UI vs BACKEND DB](#3-ma-trận-dữ-liệu-frontend-ui-vs-backend-db)
4. [QUY TẮC KIỂM THỰC INPUT & ĐIỀU KIỆN CHẶN LỖI (VALIDATION)](#4-quy-tắc-kiểm-thực-input--điều-kiện-chặn-lỗi-validation)
5. [DỊCH VỤ TRẠNG THÁI & STATE MACHINES (ENUMS)](#5-dịch-vụ-trạng-thái--state-machines-enums)
6. [API CONTRACTS & GIAO THỨC GIAO TIẾP MICROSERVICES](#6-api-contracts--giao-thức-giao-tiếp-microservices)
7. [BÁO CÁO ĐIỂM LỆCH (MISMATCHES) & GIẢI PHÁP ĐỒNG BỘ HÓA](#7-báo-cáo-điểm-lệch-mismatches--giải-pháp-đồng-bộ-hóa)

---

# 1. TỔNG QUAN HỆ THỐNG & KIẾN TRÚC MICROSERVICES

Hệ thống được thiết kế theo kiến trúc Microservices phân tán, tách biệt hoàn toàn giữa Frontend Single Page Application (SPA), Cổng kết nối API Gateway và 5 Dịch vụ Nghiệp vụ chuyên biệt (Backend Services).

```
+-------------------------------------------------------------------------------+
|                    FRONTEND CLIENT (React 18 + Vite + TS)                     |
|            [Storefront Shop: :5173]  |  [Admin Dashboard: /admin]            |
+-------------------------------------------------------------------------------+
                                        | (HTTP REST / JSON)
                                        v
+-------------------------------------------------------------------------------+
|                         API GATEWAY (Laravel / :8000)                         |
|   Điều hướng Request, Rewrite Prefix, CORS Policy, Rate Limiting & Proxying    |
+-------------------------------------------------------------------------------+
    |                  |                   |                  |               |
    v                  v                   v                  v               v
+------------+  +---------------+  +---------------+  +------------+  +-----------------+
|    AUTH    |  |    CATALOG    |  |     ORDER     |  |  PAYMENT   |  | RECOMMENDATION  |
|  SERVICE   |  |    SERVICE    |  |    SERVICE    |  |  SERVICE   |  |     SERVICE     |
|  (:8001)   |  |    (:8002)    |  |    (:8003)    |  |  (:8004)   |  |     (:8005)     |
+------------+  +---------------+  +---------------+  +------------+  +-----------------+
```

### Bảng Phân Bổ Cổng & Trách Nhiệm Dịch Vụ

| Dịch vụ / Ứng dụng | Port | Công nghệ | Trách nhiệm chính |
| :--- | :--- | :--- | :--- |
| **`crs-frontend`** | `5173` | React 18, TypeScript, TailwindCSS, Lucide Icons, Sonner Toast | Giao diện Storefront (Mua sắm, Giỏ hàng, Đặt hàng VietQR, Xem đơn) & Giao diện Quản trị Admin (Sản phẩm, Đơn hàng, Khách hàng, Voucher, Cài đặt). |
| **`api-gateway`** | `8000` | Laravel 11 | Cổng định tuyến trung tâm. Nhận request từ Frontend và proxy trực tiếp tới các service tương ứng mà không làm lộ URL nội bộ. |
| **`auth-service`** | `8001` | Laravel 11, JWT Auth | Quản lý tài khoản, Đăng ký (Phone/Email), Đăng nhập, Quên mật khẩu, Xác thực OTP, Phân quyền Role (`admin`, `customer`), Sổ địa chỉ. |
| **`catalog-service`**| `8002` | Laravel 11, MySQL | Quản lý Danh mục (`categories`), Thương hiệu (`brands`), Sản phẩm (`products`), Biến thể (`product_variants`), Thư viện ảnh (`product_images`), Tồn kho. |
| **`order-service`** | `8003` | Laravel 11, MySQL | Quản lý Giỏ hàng (`carts`, `cart_items`), Đơn hàng (`orders`, `order_items`), Mã giảm giá (`coupons`, `coupon_usages`), Tích hợp tính phí & tạo đơn GHN. |
| **`payment-service`**| `8004` | Laravel 11, MySQL | Quản lý Giao dịch (`payments`, `payment_transactions`), Tạo mã VietQR ngân hàng (MBBank), Xử lý Callback/Webhook thanh toán. |
| **`recommendation-service`**| `8005` | Laravel 11, MySQL | Thu thập hành vi tương tác (`user_product_interactions`), Đánh giá sản phẩm (`reviews`), Gợi ý sản phẩm liên quan. |

---

# 2. DATABASE SCHEMA & QUAN HỆ THỰC THỂ (ERD & TABLES)

## 2.1. AUTH SERVICE DATABASE (`crs_auth`)

### 1. Bảng `users`
*Mục đích: Lưu trữ thông tin định danh và tài khoản người dùng.*

| Tên Cột | Kiểu Dữ Liệu | Ràng Buộc | Giá Trị Mặc Định | Mô Tả |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `BIGINT UNSIGNED` | `PRIMARY KEY, AUTO_INCREMENT` | | Khóa chính ID người dùng |
| `name` | `VARCHAR(255)` | `NOT NULL` | | Họ và tên khách hàng/quản trị viên |
| `email` | `VARCHAR(255)` | `NULLABLE, UNIQUE` | `NULL` | Địa chỉ email đăng nhập |
| `phone_number` | `VARCHAR(20)` | `NULLABLE, UNIQUE, INDEX` | `NULL` | Số điện thoại đăng nhập/liên hệ |
| `email_verified_at` | `TIMESTAMP` | `NULLABLE` | `NULL` | Thời điểm xác thực email |
| `password` | `VARCHAR(255)` | `NOT NULL` | | Mật khẩu băm (Bcrypt / Argon2) |
| `role` | `VARCHAR(20)` | `NOT NULL, INDEX` | `'customer'` | Phân quyền: `customer`, `admin` |
| `avatar` | `VARCHAR(2048)`| `NULLABLE` | `NULL` | URL ảnh đại diện |
| `is_active` | `BOOLEAN` | `NOT NULL` | `TRUE` | Trạng thái hoạt động tài khoản |
| `remember_token` | `VARCHAR(100)` | `NULLABLE` | `NULL` | Token duy trì đăng nhập |
| `created_at` | `TIMESTAMP` | `NULLABLE` | | Thời điểm tạo |
| `updated_at` | `TIMESTAMP` | `NULLABLE` | | Thời điểm cập nhật cuối |

### 2. Bảng `addresses`
*Mục đích: Lưu sổ địa chỉ giao hàng của người dùng.*

| Tên Cột | Kiểu Dữ Liệu | Ràng Buộc | Giá Trị Mặc Định | Mô Tả |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `BIGINT UNSIGNED` | `PRIMARY KEY, AUTO_INCREMENT` | | Khóa chính địa chỉ |
| `user_id` | `BIGINT UNSIGNED` | `FOREIGN KEY -> users(id) ON DELETE CASCADE` | | ID người dùng sở hữu |
| `recipient_name`| `VARCHAR(255)` | `NOT NULL` | | Tên người nhận hàng |
| `phone` | `VARCHAR(15)` | `NOT NULL` | | Số điện thoại nhận hàng |
| `province` | `VARCHAR(255)` | `NOT NULL` | | Tỉnh / Thành phố |
| `district` | `VARCHAR(255)` | `NOT NULL` | | Quận / Huyện |
| `ward` | `VARCHAR(255)` | `NOT NULL` | | Phường / Xã |
| `street_address`| `VARCHAR(255)` | `NOT NULL` | | Địa chỉ số nhà, tên đường |
| `is_default` | `BOOLEAN` | `NOT NULL` | `FALSE` | Đánh dấu địa chỉ mặc định |
| `created_at` | `TIMESTAMP` | `NULLABLE` | | |
| `updated_at` | `TIMESTAMP` | `NULLABLE` | | |

### 3. Bảng `email_verifications`
*Mục đích: Quản lý mã OTP xác thực email và đặt lại mật khẩu.*

| Tên Cột | Kiểu Dữ Liệu | Ràng Buộc | Giá Trị Mặc Định | Mô Tả |
| :--- | :--- | :--- | :--- | :--- |
| `email` | `VARCHAR(255)` | `PRIMARY KEY` | | Email nhận mã OTP |
| `otp_code` | `VARCHAR(6)` | `NOT NULL` | | Mã số xác thực 6 chữ số |
| `expires_at` | `TIMESTAMP` | `NOT NULL, INDEX` | | Thời điểm hết hạn OTP |

---

## 2.2. CATALOG SERVICE DATABASE (`crs_catalog`)

### 1. Bảng `categories`
*Mục đích: Quản lý danh mục thể thao phân cấp.*

| Tên Cột | Kiểu Dữ Liệu | Ràng Buộc | Giá Trị Mặc Định | Mô Tả |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `BIGINT UNSIGNED` | `PRIMARY KEY, AUTO_INCREMENT` | | Khóa chính danh mục |
| `parent_id` | `BIGINT UNSIGNED` | `NULLABLE, FK -> categories(id) ON DELETE SET NULL` | `NULL` | ID danh mục cha (nếu có) |
| `name` | `VARCHAR(255)` | `NOT NULL` | | Tên danh mục (ví dụ: Giày bóng đá) |
| `slug` | `VARCHAR(255)` | `NOT NULL, UNIQUE` | | Đường dẫn thân thiện URL |
| `description` | `TEXT` | `NULLABLE` | `NULL` | Mô tả danh mục |
| `is_active` | `BOOLEAN` | `NOT NULL` | `TRUE` | Trạng thái hiển thị |
| `created_at` | `TIMESTAMP` | `NULLABLE` | | |
| `updated_at` | `TIMESTAMP` | `NULLABLE` | | |

### 2. Bảng `brands`
*Mục đích: Lưu trữ thương hiệu sản phẩm thể thao (Nike, Adidas, Puma...).*

| Tên Cột | Kiểu Dữ Liệu | Ràng Buộc | Giá Trị Mặc Định | Mô Tả |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `BIGINT UNSIGNED` | `PRIMARY KEY, AUTO_INCREMENT` | | Khóa chính thương hiệu |
| `name` | `VARCHAR(255)` | `NOT NULL` | | Tên thương hiệu |
| `slug` | `VARCHAR(255)` | `NOT NULL, UNIQUE` | | Slug thương hiệu |
| `logo` | `VARCHAR(2048)`| `NULLABLE` | `NULL` | Logo thương hiệu |
| `is_active` | `BOOLEAN` | `NOT NULL` | `TRUE` | Trạng thái |
| `created_at` | `TIMESTAMP` | `NULLABLE` | | |
| `updated_at` | `TIMESTAMP` | `NULLABLE` | | |

### 3. Bảng `products`
*Mục đích: Lưu thông tin sản phẩm trung tâm.*

| Tên Cột | Kiểu Dữ Liệu | Ràng Buộc | Giá Trị Mặc Định | Mô Tả |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `BIGINT UNSIGNED` | `PRIMARY KEY, AUTO_INCREMENT` | | Khóa chính sản phẩm |
| `category_id` | `BIGINT UNSIGNED` | `NOT NULL, FK -> categories(id) ON DELETE RESTRICT` | | Danh mục trực thuộc |
| `name` | `VARCHAR(255)` | `NOT NULL` | | Tên sản phẩm |
| `slug` | `VARCHAR(255)` | `NOT NULL, UNIQUE` | | Slug URL duy nhất |
| `sku` | `VARCHAR(100)` | `NOT NULL, UNIQUE` | | Mã định danh kho SKU chính |
| `brand` | `VARCHAR(255)` | `NOT NULL` | | Tên thương hiệu |
| `description` | `TEXT` | `NULLABLE` | `NULL` | Mô tả chi tiết sản phẩm |
| `price` | `DECIMAL(12, 2)`| `NOT NULL` | `0.00` | Giá bán hiện tại (VNĐ) |
| `old_price` | `DECIMAL(12, 2)`| `NULLABLE` | `NULL` | Giá niêm yết cũ để so sánh |
| `stock` | `INT UNSIGNED` | `NOT NULL` | `0` | Tổng tồn kho khả dụng |
| `image_url` | `VARCHAR(2048)`| `NULLABLE` | `NULL` | Ảnh đại diện chính (thumbnail) |
| `images` | `JSON` | `NULLABLE` | `NULL` | Mảng chứa danh sách link ảnh phụ |
| `colors` | `JSON` | `NULLABLE` | `NULL` | Mảng danh sách màu sắc |
| `sizes` | `JSON` | `NULLABLE` | `NULL` | Mảng danh sách kích thước |
| `is_active` | `BOOLEAN` | `NOT NULL` | `TRUE` | Trạng thái hiển thị bán hàng |
| `is_deleted` | `BOOLEAN` | `NOT NULL, INDEX` | `FALSE` | Cờ xóa mềm (Soft delete) |
| `deleted_at` | `TIMESTAMP` | `NULLABLE` | `NULL` | Thời điểm xóa mềm |
| `created_at` | `TIMESTAMP` | `NULLABLE` | | |
| `updated_at` | `TIMESTAMP` | `NULLABLE` | | |

---

## 2.3. ORDER SERVICE DATABASE (`crs_order`)

### 1. Bảng `carts` & `cart_items`
*Mục đích: Quản lý giỏ hàng người dùng.*
- `carts`: `id` (PK), `user_id` (Unique/Index), `created_at`, `updated_at`.
- `cart_items`: `id` (PK), `cart_id` (FK -> carts), `product_id` (Index), `quantity` (INT), `price` (DECIMAL 12,2), `selected_size` (VARCHAR 50, nullable), `selected_color` (VARCHAR 50, nullable), `created_at`, `updated_at`. Ràng buộc Unique `(cart_id, product_id, selected_size, selected_color)`.

### 2. Bảng `coupons`
*Mục đích: Quản lý mã ưu đãi, voucher khuyến mãi.*

| Tên Cột | Kiểu Dữ Liệu | Ràng Buộc | Giá Trị Mặc Định | Mô Tả |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `BIGINT UNSIGNED` | `PRIMARY KEY, AUTO_INCREMENT` | | Khóa chính voucher |
| `code` | `VARCHAR(50)` | `NOT NULL, UNIQUE` | | Mã nhập ưu đãi (VD: `STRIKER100K`) |
| `title` | `VARCHAR(255)` | `NOT NULL` | | Tiêu đề ưu đãi hiển thị |
| `description` | `TEXT` | `NULLABLE` | `NULL` | Mô tả điều kiện áp dụng |
| `type` | `VARCHAR(20)` | `NOT NULL` | `'fixed'` | Loại giảm: `fixed`, `freeship` |
| `value` | `DECIMAL(12, 2)`| `NOT NULL` | `0.00` | Giá trị giảm (tiền mặt VNĐ hoặc 0) |
| `min_order_amount`| `DECIMAL(12, 2)`| `NOT NULL` | `0.00` | Giá trị đơn hàng tối thiểu |
| `max_discount_amount`| `DECIMAL(12, 2)`| `NULLABLE` | `NULL` | Giới hạn giảm tối đa |
| `usage_limit` | `INT` | `NULLABLE` | `100` | Tổng số lượt phát hành tối đa |
| `used_count` | `INT` | `NOT NULL` | `0` | Số lượt đã được khách sử dụng |
| `limit_per_user`| `INT` | `NOT NULL` | `1` | Số lần tối đa mỗi user được dùng |
| `is_active` | `BOOLEAN` | `NOT NULL, INDEX` | `TRUE` | Bật / Tắt voucher |
| `is_deleted` | `BOOLEAN` | `NOT NULL, INDEX` | `FALSE` | Cờ xóa mềm |
| `starts_at` | `TIMESTAMP` | `NULLABLE` | `NULL` | Thời điểm bắt đầu hiệu lực |
| `expires_at` | `TIMESTAMP` | `NULLABLE, INDEX` | `NULL` | Hạn sử dụng của voucher |
| `created_at` | `TIMESTAMP` | `NULLABLE` | | |
| `updated_at` | `TIMESTAMP` | `NULLABLE` | | |

### 3. Bảng `orders`
*Mục đích: Lưu trữ toàn bộ thông tin đơn hàng và vận chuyển.*

| Tên Cột | Kiểu Dữ Liệu | Ràng Buộc | Giá Trị Mặc Định | Mô Tả |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `BIGINT UNSIGNED` | `PRIMARY KEY, AUTO_INCREMENT` | | Khóa chính đơn hàng |
| `order_number` | `VARCHAR(50)` | `NOT NULL, UNIQUE, INDEX` | | Mã đơn hiển thị (VD: `ORD-20260909-ABC123`) |
| `order_code` | `VARCHAR(50)` | `NOT NULL, UNIQUE` | | Mã định danh đơn hệ thống |
| `user_id` | `BIGINT UNSIGNED` | `NOT NULL, INDEX` | | ID khách hàng (Auth Service) |
| `coupon_id` | `BIGINT UNSIGNED` | `NULLABLE, FK -> coupons(id)`| `NULL` | ID voucher đã áp dụng |
| `shipping_name` | `VARCHAR(100)` | `NOT NULL` | | Tên người nhận hàng |
| `shipping_phone`| `VARCHAR(15)` | `NOT NULL` | | Số điện thoại nhận hàng |
| `shipping_address`| `TEXT` | `NOT NULL` | | Địa chỉ giao nhận chi tiết |
| `subtotal` | `DECIMAL(12, 2)`| `NOT NULL` | `0.00` | Tổng tiền hàng tạm tính |
| `shipping_fee` | `DECIMAL(12, 2)`| `NOT NULL` | `0.00` | Phí vận chuyển (từ GHN API) |
| `discount_amount`| `DECIMAL(12, 2)`| `NOT NULL` | `0.00` | Số tiền được giảm giá |
| `total_amount` | `DECIMAL(12, 2)`| `NOT NULL` | `0.00` | Tổng tiền thực thanh toán |
| `order_status` | `VARCHAR(30)` | `NOT NULL, INDEX` | `'pending'` | Trạng thái: `pending`, `processing`, `shipping`, `delivered`, `cancelled` |
| `payment_status`| `VARCHAR(30)` | `NOT NULL, INDEX` | `'unpaid'` | Trạng thái tiền: `unpaid`, `pending`, `paid`, `failed`, `refunded` |
| `payment_method`| `VARCHAR(30)` | `NOT NULL` | `'cod'` | Phương thức: `cod`, `bank_transfer`, `vnpay`, `momo` |
| `ghn_code` | `VARCHAR(100)` | `NULLABLE, INDEX` | `NULL` | Mã vận đơn GHN chính thức (VD: `GHN-HN-88392`) |
| `note` | `TEXT` | `NULLABLE` | `NULL` | Ghi chú từ khách hàng |
| `created_at` | `TIMESTAMP` | `NULLABLE` | | |
| `updated_at` | `TIMESTAMP` | `NULLABLE` | | |

### 4. Bảng `order_items`
*Mục đích: Chi tiết các mặt hàng trong đơn.*

| Tên Cột | Kiểu Dữ Liệu | Ràng Buộc | Mô Tả |
| :--- | :--- | :--- | :--- |
| `id` | `BIGINT UNSIGNED` | `PRIMARY KEY, AUTO_INCREMENT` | Khóa chính dòng đơn |
| `order_id` | `BIGINT UNSIGNED` | `FOREIGN KEY -> orders(id) ON DELETE CASCADE` | Thuộc đơn hàng nào |
| `product_id` | `BIGINT UNSIGNED` | `NOT NULL, INDEX` | ID sản phẩm (Catalog Service) |
| `variant_id` | `BIGINT UNSIGNED` | `NULLABLE, INDEX` | ID biến thể sản phẩm |
| `product_name` | `VARCHAR(255)` | `NOT NULL` | Tên sản phẩm tại thời điểm mua |
| `sku` | `VARCHAR(100)` | `NOT NULL` | Mã SKU sản phẩm |
| `unit_price` | `DECIMAL(12, 2)`| `NOT NULL` | Đơn giá tại thời điểm mua |
| `quantity` | `INT UNSIGNED` | `NOT NULL` | Số lượng mua |
| `subtotal` | `DECIMAL(12, 2)`| `NOT NULL` | Thành tiền (`unit_price * quantity`) |
| `variant_attributes`| `JSON` | `NULLABLE` | Thuộc tính kích cỡ, màu sắc |

---

## 2.4. PAYMENT SERVICE DATABASE (`crs_payment`)

### 1. Bảng `payments`
- `id` (PK), `order_id` (Unique, BigInt), `user_id` (BigInt), `payment_method` (`enum('cod', 'vnpay', 'momo', 'bank_transfer')`), `transaction_id` (VARCHAR 255, Nullable), `amount` (DECIMAL 12,2), `status` (`enum('pending', 'completed', 'failed', 'refunded')`), `paid_at` (TIMESTAMP Nullable), `timestamps`.

### 2. Bảng `payment_transactions`
- `id` (PK), `payment_id` (FK -> payments), `gateway` (VARCHAR 30), `transaction_code` (VARCHAR 100, Index), `response_code` (VARCHAR 20), `amount` (DECIMAL 12,2), `status` (VARCHAR 30), `raw_payload` (JSON), `timestamps`.

---

# 3. MA TRẬN DỮ LIỆU FRONTEND UI vs BACKEND DB

Bảng đối chiếu toàn diện giữa các giao diện Form/Bảng trên Frontend và Cột cơ sở dữ liệu tương ứng:

| Màn hình UI (Frontend) | Trường / Control trên UI | Kiểu Input trên UI | Bảng Database (Backend) | Tên Cột DB (Backend) | Ghi chú đồng bộ |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Admin Products** (`Products.tsx`) | Tên sản phẩm | Text Input | `products` | `name` | Bắt buộc, max 255 ký tự |
| | Danh mục | Dropdown Select | `products` | `category_id` | Foreign Key tới `categories(id)` |
| | Thương hiệu | Text Input | `products` | `brand` | Tên hãng (Nike, Adidas...) |
| | Giá bán (đ) | Number Input | `products` | `price` | Bắt buộc, min 1.000đ, chặn phím e,+,-,. |
| | Giá niêm yết cũ (đ) | Number Input | `products` | `old_price` | Giá gốc gạch ngang so sánh |
| | Tồn kho | Number Input | `products` | `stock` | Bắt buộc, min 0, max 1.000.000 |
| | Ảnh đại diện (URL) | URL Input / Upload | `products` | `image_url` | Link ảnh chính hiển thị |
| | Album ảnh phụ | Multi-link Input | `products` | `images` | Lưu dạng JSON Array chuỗi URL |
| | Danh sách Màu sắc | Tag Input | `products` | `colors` | Lưu dạng JSON Array chuỗi màu |
| | Danh sách Size | Checkbox / Tag Input | `products` | `sizes` | Lưu dạng JSON Array chuỗi kích thước |
| | Mô tả sản phẩm | Textarea | `products` | `description` | Văn bản mô tả |
| | Nút Xóa (Thùng rác) | Button Confirm | `products` | `is_deleted` | Soft delete, lọc `is_deleted = false` |
| **Admin Orders** (`Orders.tsx`) | Mã đơn hàng | Text Display | `orders` | `order_number` / `order_code` | Mã chuẩn format `ORD-YYYYMMDD-XXXXXX` |
| | Tab Lọc Trạng thái | 5 Tab Filter Buttons | `orders` | `order_status` | `all`, `pending`, `shipping`, `delivered`, `cancelled` |
| | Badge Trạng thái | Dropdown Select / Badge | `orders` | `order_status` | Đổi trạng thái đơn hàng |
| | Trạng thái thanh toán| Badge / Action Button | `orders` | `payment_status` | `unpaid`, `paid`, `refunded` |
| | Nút Tạo Đơn GHN | Action Button | `orders` | `ghn_code` | Gọi GHN Sandbox API, lưu mã vận đơn thật |
| | Tên & SĐT Người nhận | Text Display / Modal | `orders` | `shipping_name`, `shipping_phone` | Thông tin người nhận |
| | Địa chỉ giao hàng | Text Display / Modal | `orders` | `shipping_address` | Địa chỉ chi tiết |
| | Tiền hàng & Phí ship | Currency Format | `orders` | `subtotal`, `shipping_fee`, `total_amount` | Format VNĐ |
| **Admin Customers** (`Customers.tsx`) | Họ tên khách hàng | Text Display | `users` | `name` | Avatar tự động render chữ cái đầu |
| | Email | Text Display | `users` | `email` | Địa chỉ email duy nhất |
| | Số điện thoại | Text Display | `users` | `phone_number` | SĐT định danh tài khoản |
| | Tổng đơn hàng | Calculated Count | `orders` | `COUNT(orders.id)` | Đếm số lượng đơn của `user_id` |
| | Tổng chi tiêu | Calculated Sum | `orders` | `SUM(orders.total_amount)`| Tính tổng tiền đã chi của `user_id` |
| **Admin Vouchers** (`Vouchers.tsx`) | Mã Code Voucher | Text Input + Auto Gen | `coupons` | `code` | Format Upper, Unique, không trùng lặp |
| | Tiêu đề ưu đãi | Text Input | `coupons` | `title` | Tiêu đề hiển thị (bỏ "Ví dụ:") |
| | Mô tả điều kiện | Text Input | `coupons` | `description` | Mô tả chi tiết điều kiện |
| | Loại giảm giá | Dropdown Select | `coupons` | `type` | Chỉ 2 loại: `fixed` và `freeship` |
| | Giá trị giảm | Number / Disabled | `coupons` | `value` | VNĐ với fixed, tự động 0 với freeship |
| | Đơn tối thiểu | Number Input | `coupons` | `min_order_amount` | Giá trị đơn tối thiểu áp dụng |
| | Tổng lượt phát hành | Number Input | `coupons` | `usage_limit` | Max 1.000.000 lượt |
| | Hạn sử dụng | Date Picker | `coupons` | `expires_at` | Ràng buộc `min={today}` |
| | Tab Đang phát hành | Tab Button | `coupons` | `expires_at`, `used_count` | `now <= expires_at AND used < limit` |
| | Tab Đã kết thúc | Tab Button | `coupons` | `expires_at`, `used_count` | `now > expires_at OR used >= limit` |
| | Nút Xóa (Thùng rác) | Button Confirm | `coupons` | `is_deleted` | Soft delete voucher |
| **Shop Checkout** (`Checkout.tsx`) | Tên & SĐT người nhận | Text Input | `orders` | `shipping_name`, `shipping_phone` | Validate Regex SĐT Việt Nam |
| | Tỉnh / Huyện / Xã | Cascading Dropdown | `orders` | `shipping_address` | Tích hợp API Tỉnh/Thành GHN |
| | Chọn Phương thức TT | Radio Buttons | `orders` / `payments` | `payment_method` | `cod`, `bank_transfer` (VietQR), `vnpay` |
| | Nhập Mã Giảm Giá | Text Input + Button | `orders` | `coupon_id` | Kiểm tra tính hợp lệ & trừ tiền trực tiếp |

---

# 4. QUY TẮC KIỂM THỰC INPUT & ĐIỀU KIỆN CHẶN LỖI (VALIDATION)

Chi tiết các ràng buộc kiểm tra dữ liệu đầu vào và các điều kiện chặn lỗi trên toàn hệ thống:

```
+-------------------------------------------------------------------------------------------------------------------------+
|                                           BẢNG QUY TẮC KIỂM THỰC INPUT                                                  |
+----------------------+--------------------+--------------------+-------------------------------+------------------------+
| Màn hình & Form      | Tên Trường         | Kiểu Input         | Ràng buộc Kỹ thuật & Regex    | Xử lý Chặn lỗi UI      |
+----------------------+--------------------+--------------------+-------------------------------+------------------------+
| Form Thêm/Sửa SP     | Giá bán            | type="number"      | min={1000}, numeric           | Chặn onKeyDown: e,E,+,-|
|                      | Tồn kho            | type="number"      | min={0}, max={1000000}, int   | Chặn ký tự đặc biệt    |
|                      | Tên sản phẩm       | type="text"        | required, max 255 chars       | Thông báo khi để trống |
|                      | Ảnh Thumbnail      | type="text" (URL)  | url format                    | Fallback placeholder   |
+----------------------+--------------------+--------------------+-------------------------------+------------------------+
| Form Thêm/Sửa        | Mã Voucher         | type="text"        | uppercase, unique             | Check trùng mã trước   |
| Voucher              |                    |                    |                               | khi lưu vào DB/State   |
|                      | Tiêu đề            | type="text"        | required, sạch chữ "Ví dụ:"   | Bắt buộc nhập          |
|                      | Giá trị giảm       | type="number"      | fixed > 0; freeship = 0       | Disabled khi freeship  |
|                      | Tổng số lượt       | type="number"      | min={1}, max={1000000}        | Báo lỗi khi > 1 triệu  |
|                      | Hạn sử dụng        | type="date"        | min={todayDateStr}            | Chặn chọn ngày quá khứ |
+----------------------+--------------------+--------------------+-------------------------------+------------------------+
| Form Đặt hàng        | Số điện thoại      | type="tel"         | /^0(3|5|7|8|9)\d{8}$/         | Báo lỗi SĐT VN sai     |
| Checkout             | Họ và tên          | type="text"        | required, min 2 chars         | Bắt buộc nhập          |
|                      | Địa chỉ số nhà     | type="text"        | required                      | Bắt buộc nhập          |
|                      | Tỉnh/Huyện/Xã      | select             | required                      | Bắt buộc chọn 3 cấp    |
+----------------------+--------------------+--------------------+-------------------------------+------------------------+
| Form Đăng nhập       | Số điện thoại      | type="text"        | valid phone / email           | Trim khoảng trắng      |
| & Đăng ký            | Mật khẩu           | type="password"    | min 6 chars                   | Báo mật khẩu quá ngắn  |
|                      | Mã OTP             | type="text"        | 6 digits regex /^\d{6}$/      | Auto focus 6 ô         |
+----------------------+--------------------+--------------------+-------------------------------+------------------------+
```

---

# 5. DỊCH VỤ TRẠNG THÁI & STATE MACHINES (ENUMS)

## 5.1. Vòng Đời Trạng Thái Đơn Hàng (`OrderStatus`)

```
             +------------+
             |  PENDING   | (Đơn vừa tạo, chờ xác nhận)
             +------------+
                   |
         +---------+---------+
         |                   |
         v                   v
+------------------+  +---------------+
|    PROCESSING    |  |   CANCELLED   | (Hủy bởi khách hoặc admin)
|   (Đang đóng gói)|  +---------------+
+------------------+
         |
         v
+------------------+
|     SHIPPING     | (Đã bàn giao cho đơn vị vận chuyển GHN)
|  (Đang giao hàng)|
+------------------+
         |
         v
+------------------+
|    DELIVERED     | (Khách đã nhận hàng thành công)
|  (Hoàn tất đơn)  |
+------------------+
```

## 5.2. Vòng Đời Trạng Thái Thanh Toán (`PaymentStatus`)

- `unpaid`: Đơn hàng chưa thanh toán (áp dụng cho đơn COD hoặc vừa tạo mã VietQR).
- `pending`: Đang chờ xác nhận giao dịch từ Webhook ngân hàng / cổng thanh toán.
- `paid` / `completed`: Đã nhận đủ tiền từ khách hàng, cập nhật thời gian `paid_at`.
- `failed`: Giao dịch bị từ chối hoặc hết thời gian quét mã QR (Timeout).
- `refunded`: Đơn hàng bị hủy sau khi đã thanh toán, hệ thống hoàn tiền lại cho khách.

## 5.3. Trạng Thái & Phân Loại Voucher (`CouponType` & `StatusTab`)

- **Loại Voucher (`CouponType`)**:
  1. `fixed`: Giảm theo số tiền mặt cố định VNĐ (Ví dụ: Giảm 50.000đ, Giảm 100.000đ).
  2. `freeship`: Miễn phí vận chuyển toàn bộ (Tự động set giá trị giảm = 0đ, hệ thống trừ 100% phí ship tại Checkout).
- **Tab Phân Loại Giao Diện**:
  - `🟢 Đang phát hành`: `is_deleted == false` **AND** `now <= expires_at` **AND** `used_count < usage_limit`.
  - `🔴 Đã kết thúc`: `is_deleted == false` **AND** (`now > expires_at` **OR** `used_count >= usage_limit`).

---

# 6. API CONTRACTS & GIAO THỨC GIAO TIẾP MICROSERVICES

Tất cả các API được gọi qua API Gateway (`http://localhost:8000/api/...`):

### 1. Catalog APIs
- `GET /api/products`: Lấy danh sách sản phẩm (hỗ trợ `category_id`, `search`, `page`, `per_page`).
- `GET /api/products/{id}`: Lấy chi tiết 1 sản phẩm.
- `POST /api/products`: Thêm mới sản phẩm (Admin).
- `PUT /api/products/{id}`: Cập nhật thông tin sản phẩm.
- `DELETE /api/products/{id}`: Xóa mềm sản phẩm (`is_deleted = true`).
- `GET /api/categories`: Lấy danh sách danh mục thể thao.

### 2. Order & Cart APIs
- `GET /api/cart`: Lấy giỏ hàng của user hiện tại.
- `POST /api/cart/items`: Thêm sản phẩm vào giỏ hàng (`product_id`, `quantity`, `price`).
- `PATCH /api/cart/items/{id}`: Cập nhật số lượng mặt hàng trong giỏ.
- `DELETE /api/cart/items/{id}`: Xóa mặt hàng khỏi giỏ.
- `POST /api/orders`: Tạo đơn hàng mới từ giỏ hàng (`user_id`, `shipping_address`, `phone`, `shipping_name`, `shipping_fee`, `discount_amount`, `note`).
- `GET /api/orders`: Danh sách đơn hàng của user.
- `GET /api/orders/{id}`: Chi tiết đơn hàng kèm các mục con (`items`).

### 3. Shipping APIs (GHN Integration)
- `GET /api/shipping/provinces`: Lấy danh sách Tỉnh/Thành phố từ GHN.
- `GET /api/shipping/districts?province_id={id}`: Lấy danh sách Quận/Huyện theo Tỉnh.
- `GET /api/shipping/wards?district_id={id}`: Lấy danh sách Phường/Xã theo Huyện.
- `POST /api/shipping/fee`: Tính cước phí giao hàng chuẩn từ GHN theo tọa độ/địa chỉ.

### 4. Payment APIs (VietQR MBBank & Gateways)
- `POST /api/payments`: Khởi tạo thông tin thanh toán (`order_id`, `user_id`, `payment_method`, `amount`).
- `GET /api/payments/status?order_id={id}`: Kiểm tra trạng thái giao dịch theo mã đơn.
- `POST /api/payments/callback`: Nhận webhook thông báo giao dịch thành công.

---

# 7. BÁO CÁO ĐIỂM LỆCH (MISMATCHES) & GIẢI PHÁP ĐỒNG BỘ HÓA

Qua quá trình quét tự động (Reverse Engineering), các điểm lệch giữa Frontend UI và Backend DB đã được phát hiện và xử lý đồng bộ triệt để:

### 1. Catalog Service (`products` table):
- **Phát hiện**: UI Frontend hỗ trợ trường `old_price` (giá gốc so sánh), `images` (bộ sưu tập ảnh), `colors`, `sizes`, và cờ `is_deleted`, nhưng migration cũ của Backend chưa có các cột này trong schema chính của bảng `products`.
- **Giải pháp**: Đã tạo migration `2026_09_09_000000_add_extended_fields_to_products_table.php` bổ sung `old_price`, `images`, `colors`, `sizes`, `is_deleted` và cập nhật `$fillable`, `$casts` trong Model `Product.php`.

### 2. Order Service (`coupons` & `orders` table):
- **Phát hiện**:
  - Bảng `coupons` thiếu cột `title` (tiêu đề hiển thị voucher), `description` (mô tả điều kiện) và cờ xóa mềm `is_deleted`.
  - Bảng `orders` thiếu cột `ghn_code` (mã vận đơn thật từ GHN API) và `payment_method`.
- **Giải pháp**: Đã tạo migration `2026_09_09_000000_add_extended_fields_to_coupons_and_orders.php` bổ sung đầy đủ các cột trên và cập nhật `$fillable` cho Model `Order.php`.

### 3. Auth Service (`users` table):
- **Phát hiện**: Bảng `users` thiếu cột `avatar` (ảnh đại diện người dùng) khi user tải ảnh profile lên.
- **Giải pháp**: Đã tạo migration `2026_09_09_000000_add_avatar_to_users_table.php` bổ sung cột `avatar` và cập nhật `$fillable` cho Model `User.php`.

---
*Tài liệu này là căn cứ chuẩn mực kỹ thuật (Single Source of Truth) cho toàn bộ việc bảo trì, phát triển tính năng và tích hợp hệ thống CRS.*
