import type { Product, CategoryItem, BrandItem } from './types'

export const DEFAULT_CATEGORY: CategoryItem = {
  id: 999,
  name: 'Khác',
  description: 'Danh mục mặc định của hệ thống',
  slug: 'khac',
}

export const DEFAULT_BRAND: BrandItem = {
  id: 999,
  name: 'Khác',
  description: 'Thương hiệu mặc định của hệ thống',
}

export const INITIAL_CATEGORIES: CategoryItem[] = [
  { id: 1, name: 'Giày bóng đá', description: 'Các dòng giày đinh FG, AG, TF chính hãng chất lượng cao', slug: 'giay-bong-da' },
  { id: 2, name: 'Bóng thi đấu', description: 'Bóng đá chuẩn FIFA Quality Pro, bền bỉ và giữ form chuẩn', slug: 'bong-thi-dau' },
  { id: 3, name: 'Áo đấu', description: 'Trang phục thi đấu và luyện tập chất liệu thể thao thoáng khí', slug: 'ao-dau' },
  { id: 4, name: 'Phụ kiện', description: 'Bọc ống đồng, tất thi đấu, găng tay và phụ kiện thể thao', slug: 'phu-kien' },
  DEFAULT_CATEGORY,
]

export const INITIAL_BRANDS: BrandItem[] = [
  { id: 1, name: 'Nike', description: 'Thương hiệu thể thao hàng đầu thế giới từ Mỹ' },
  { id: 2, name: 'Adidas', description: 'Biểu tượng thể thao hiệu suất cao từ Đức' },
  { id: 3, name: 'Puma', description: 'Tốc độ và sự đột phá năng động từ Đức' },
  { id: 4, name: 'Mizuno', description: 'Chất lượng thủ công chuẩn mực từ Nhật Bản' },
  { id: 5, name: 'Striker', description: 'Thương hiệu thể thao Cyber-Sport độc quyền chính hãng' },
  DEFAULT_BRAND,
]

export const products: Product[] = [
  { 
    id: 1, 
    name: 'Phantom GX Elite FG', 
    brand: 'Nike', 
    brand_id: 1,
    category: 'Giày bóng đá', 
    category_id: 1,
    price: 4290000, 
    oldPrice: 4990000, 
    image: 'https://images.unsplash.com/photo-1511886929837-354d827aae26?auto=format&fit=crop&w=900&q=85', 
    tag: 'HOT', 
    stock: 12, 
    description: 'Đôi giày kiểm soát bóng thế hệ mới với upper Flyknit mềm, bám sân tự tin.', 
    colors: ['Volt', 'Black'], 
    sizes: ['39', '40', '41', '42', '43'],
    variants: [
      { id: 101, sku: 'STR-39-VOLT', price: 4290000, stock: 2, attributes: { size: '39', color: 'Volt' }, is_active: true },
      { id: 102, sku: 'STR-40-VOLT', price: 4290000, stock: 3, attributes: { size: '40', color: 'Volt' }, is_active: true },
      { id: 103, sku: 'STR-41-VOLT', price: 4290000, stock: 4, attributes: { size: '41', color: 'Volt' }, is_active: true },
      { id: 104, sku: 'STR-42-BLACK', price: 4290000, stock: 3, attributes: { size: '42', color: 'Black' }, is_active: true },
    ],
    isActive: true,
    status: 'active'
  },
  { 
    id: 2, 
    name: 'Predator Accuracy.1', 
    brand: 'Adidas', 
    brand_id: 2,
    category: 'Giày bóng đá', 
    category_id: 1,
    price: 3890000, 
    oldPrice: 4490000, 
    image: 'https://images.unsplash.com/photo-1553778263-73a83bab9b0c?auto=format&fit=crop&w=900&q=85', 
    tag: 'SALE', 
    stock: 8, 
    description: 'Controlskin texture tạo độ xoáy và cảm giác bóng chính xác trong mọi pha chạm.', 
    colors: ['White', 'Red'], 
    sizes: ['39', '40', '41', '42'],
    variants: [
      { id: 201, sku: 'STR-39-WHITE', price: 3890000, stock: 2, attributes: { size: '39', color: 'White' }, is_active: true },
      { id: 202, sku: 'STR-40-WHITE', price: 3890000, stock: 2, attributes: { size: '40', color: 'White' }, is_active: true },
      { id: 203, sku: 'STR-41-RED', price: 3890000, stock: 2, attributes: { size: '41', color: 'Red' }, is_active: true },
      { id: 204, sku: 'STR-42-RED', price: 3890000, stock: 2, attributes: { size: '42', color: 'Red' }, is_active: true },
    ],
    isActive: true,
    status: 'active'
  },
  { 
    id: 3, 
    name: 'Future Ultimate FG/AG', 
    brand: 'Puma', 
    brand_id: 3,
    category: 'Giày bóng đá', 
    category_id: 1,
    price: 3150000, 
    image: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=900&q=85', 
    tag: 'NEW', 
    stock: 20, 
    description: 'Thiết kế FUZIONFIT linh hoạt cho những cầu thủ chơi bóng sáng tạo.', 
    colors: ['Blue', 'White'], 
    sizes: ['40', '41', '42', '43'],
    variants: [
      { id: 301, sku: 'STR-40-BLUE', price: 3150000, stock: 5, attributes: { size: '40', color: 'Blue' }, is_active: true },
      { id: 302, sku: 'STR-41-BLUE', price: 3150000, stock: 5, attributes: { size: '41', color: 'Blue' }, is_active: true },
      { id: 303, sku: 'STR-42-WHITE', price: 3150000, stock: 5, attributes: { size: '42', color: 'White' }, is_active: true },
      { id: 304, sku: 'STR-43-WHITE', price: 3150000, stock: 5, attributes: { size: '43', color: 'White' }, is_active: true },
    ],
    isActive: true,
    status: 'active'
  },
  { 
    id: 4, 
    name: 'Match Pro Football', 
    brand: 'Striker', 
    brand_id: 5,
    category: 'Bóng thi đấu', 
    category_id: 2,
    price: 690000, 
    image: 'https://images.unsplash.com/photo-1551958219-acbc608c6377?auto=format&fit=crop&w=900&q=85', 
    tag: 'BEST SELLER', 
    stock: 32, 
    description: 'Bóng thi đấu chuẩn size 5, bề mặt bền và giữ form ổn định.', 
    colors: ['White'], 
    sizes: ['5'],
    variants: [
      { id: 401, sku: 'STR-BALL-PRO-5', price: 690000, stock: 32, attributes: { size: '5', color: 'White' }, is_active: true }
    ],
    isActive: true,
    status: 'active'
  },
  { 
    id: 5, 
    name: 'Academy Dri-FIT Jersey', 
    brand: 'Nike', 
    brand_id: 1,
    category: 'Áo đấu', 
    category_id: 3,
    price: 1190000, 
    image: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=900&q=85', 
    tag: 'NEW', 
    stock: 16, 
    description: 'Công nghệ Dri-FIT thoáng mát cho buổi tập và ngày thi đấu.', 
    colors: ['Green', 'Black'], 
    sizes: ['S', 'M', 'L', 'XL'],
    variants: [
      { id: 501, sku: 'STR-S-GREEN', price: 1190000, stock: 4, attributes: { size: 'S', color: 'Green' }, is_active: true },
      { id: 502, sku: 'STR-M-GREEN', price: 1190000, stock: 4, attributes: { size: 'M', color: 'Green' }, is_active: true },
      { id: 503, sku: 'STR-L-BLACK', price: 1190000, stock: 4, attributes: { size: 'L', color: 'Black' }, is_active: true },
      { id: 504, sku: 'STR-XL-BLACK', price: 1190000, stock: 4, attributes: { size: 'XL', color: 'Black' }, is_active: true },
    ],
    isActive: true,
    status: 'active'
  },
  { 
    id: 6, 
    name: 'X Speedportal League', 
    brand: 'Adidas', 
    brand_id: 2,
    category: 'Giày bóng đá', 
    category_id: 1,
    price: 2150000, 
    oldPrice: 2590000, 
    image: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=900&q=85', 
    tag: 'SALE', 
    stock: 5, 
    description: 'Trọng lượng nhẹ, tăng tốc nhanh trên mặt sân cỏ nhân tạo.', 
    colors: ['Black', 'Gold'], 
    sizes: ['39', '40', '41', '42'],
    variants: [
      { id: 601, sku: 'STR-39-BLACK', price: 2150000, stock: 1, attributes: { size: '39', color: 'Black' }, is_active: true },
      { id: 602, sku: 'STR-40-BLACK', price: 2150000, stock: 1, attributes: { size: '40', color: 'Black' }, is_active: true },
      { id: 603, sku: 'STR-41-GOLD', price: 2150000, stock: 2, attributes: { size: '41', color: 'Gold' }, is_active: true },
      { id: 604, sku: 'STR-42-GOLD', price: 2150000, stock: 1, attributes: { size: '42', color: 'Gold' }, is_active: true },
    ],
    isActive: true,
    status: 'active'
  },
]

export const categories = ['Tất cả', 'Giày bóng đá', 'Bóng thi đấu', 'Áo đấu', 'Phụ kiện', 'Khác']
export const brands = ['Tất cả thương hiệu', 'Nike', 'Adidas', 'Puma', 'Mizuno', 'Striker', 'Khác']

