import api from './api.js'
import type { Product, CategoryItem, BrandItem } from '../types'

/** Chuẩn hóa URL ảnh */
function sanitizeImageUrl(img?: string | null): string {
  if (!img || typeof img !== 'string') {
    return 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80'
  }
  if (img.startsWith('http') || img.startsWith('data:')) {
    return img
  }
  return img.startsWith('/') ? `http://localhost:8000${img}` : `http://localhost:8000/storage/${img}`
}

/** Chuyển đổi dữ liệu thô từ catalog-service thành Product chuẩn của Frontend */
export function mapBackendProduct(raw: Record<string, any>): Product {
  const imageUrl = sanitizeImageUrl(raw.image_url ?? raw.image)
  let images: string[] = []
  if (Array.isArray(raw.images) && raw.images.length > 0) {
    images = raw.images.map((img: string) => sanitizeImageUrl(img))
  } else {
    images = [imageUrl]
  }

  let colors: string[] = ['Đen', 'Trắng']
  if (Array.isArray(raw.colors) && raw.colors.length > 0) {
    colors = raw.colors
  } else if (typeof raw.colors === 'string') {
    try {
      const parsed = JSON.parse(raw.colors)
      if (Array.isArray(parsed)) colors = parsed
    } catch {}
  }

  let sizes: string[] = ['39', '40', '41', '42', '43']
  if (Array.isArray(raw.sizes) && raw.sizes.length > 0) {
    sizes = raw.sizes
  } else if (typeof raw.sizes === 'string') {
    try {
      const parsed = JSON.parse(raw.sizes)
      if (Array.isArray(parsed)) sizes = parsed
    } catch {}
  }

  const isActive = raw.is_active !== undefined ? Boolean(raw.is_active) : (raw.isActive !== undefined ? Boolean(raw.isActive) : true)

  return {
    id: Number(raw.id),
    name: String(raw.name ?? ''),
    sku: String(raw.sku ?? `SP-${raw.id}`),
    brand: typeof raw.brand === 'object' ? String(raw.brand?.name ?? 'Khác') : String(raw.brand ?? 'Khác'),
    brand_id: raw.brand_id ? Number(raw.brand_id) : undefined,
    category: typeof raw.category === 'object' ? String(raw.category?.name ?? 'Khác') : String(raw.category ?? 'Khác'),
    category_id: raw.category_id ? Number(raw.category_id) : (raw.category?.id ? Number(raw.category.id) : undefined),
    price: Number(raw.price ?? 0),
    oldPrice: raw.old_price ? Number(raw.old_price) : (raw.oldPrice ? Number(raw.oldPrice) : undefined),
    image: imageUrl,
    images,
    tag: raw.tag || undefined,
    stock: Number(raw.stock ?? 0),
    description: String(raw.description ?? ''),
    colors,
    sizes,
    variants: Array.isArray(raw.variants) ? raw.variants : [],
    isActive,
    status: isActive ? 'active' : 'inactive',
    is_deleted: Boolean(raw.is_deleted ?? false),
    isDeleted: Boolean(raw.is_deleted ?? false),
  }
}

/** Chuyển đổi dữ liệu category từ backend */
export function mapBackendCategory(raw: Record<string, any>): CategoryItem {
  return {
    id: raw.id,
    name: String(raw.name ?? ''),
    slug: raw.slug ?? undefined,
    description: raw.description ?? undefined,
  }
}

/** Chuyển đổi dữ liệu brand từ backend */
export function mapBackendBrand(raw: Record<string, any>): BrandItem {
  return {
    id: raw.id,
    name: String(raw.name ?? ''),
    logo: raw.logo_path ?? raw.logo ?? undefined,
    description: raw.description ?? undefined,
  }
}

// ---------------- PRODUCTS ----------------

export interface FetchProductsResponse {
  products: Product[]
  total: number
  pagination?: {
    current_page: number
    per_page: number
    total: number
    last_page: number
  }
}

export async function fetchProducts(params: Record<string, string | number> = {}): Promise<Product[]> {
  const response = await api.get('/products', { params })
  const rawList = response.data?.data ?? response.data ?? []
  if (Array.isArray(rawList)) {
    return rawList.map(mapBackendProduct)
  }
  return []
}

export async function fetchProductsWithPagination(params: Record<string, string | number> = {}): Promise<FetchProductsResponse> {
  const response = await api.get('/products', { params })
  const rawList = response.data?.data ?? []
  const products = Array.isArray(rawList) ? rawList.map(mapBackendProduct) : []
  return {
    products,
    total: response.data?.pagination?.total ?? products.length,
    pagination: response.data?.pagination,
  }
}

export async function fetchProductById(id: number | string): Promise<Product> {
  const response = await api.get(`/products/${id}`)
  const raw = response.data?.data ?? response.data
  return mapBackendProduct(raw)
}

export async function checkStock(items: Array<{ product_id: number; quantity: number }>) {
  const response = await api.post('/products/check-stock', { items })
  return response.data?.data ?? response.data
}

export async function createProduct(payload: Partial<Product>): Promise<Product> {
  const backendPayload = {
    name: payload.name,
    sku: payload.sku,
    category_id: payload.category_id,
    brand: payload.brand,
    price: payload.price,
    old_price: payload.oldPrice ?? null,
    stock: payload.stock ?? 0,
    description: payload.description ?? '',
    image_url: payload.image ?? (payload.images?.[0] ?? ''),
    images: payload.images ?? (payload.image ? [payload.image] : []),
    colors: payload.colors ?? ['Đen', 'Trắng'],
    sizes: payload.sizes ?? ['39', '40', '41', '42', '43'],
    variants: payload.variants ?? [],
    is_active: payload.isActive !== undefined ? payload.isActive : (payload.status === 'active'),
  }

  const response = await api.post('/products', backendPayload)
  const raw = response.data?.data ?? response.data
  return mapBackendProduct(raw)
}

export async function updateProduct(id: number | string, payload: Partial<Product>): Promise<Product> {
  const backendPayload: Record<string, any> = {}
  if (payload.name !== undefined) backendPayload.name = payload.name
  if (payload.sku !== undefined) backendPayload.sku = payload.sku
  if (payload.category_id !== undefined) backendPayload.category_id = payload.category_id
  if (payload.brand !== undefined) backendPayload.brand = payload.brand
  if (payload.price !== undefined) backendPayload.price = payload.price
  if (payload.oldPrice !== undefined) backendPayload.old_price = payload.oldPrice
  if (payload.stock !== undefined) backendPayload.stock = payload.stock
  if (payload.description !== undefined) backendPayload.description = payload.description
  if (payload.image !== undefined) backendPayload.image_url = payload.image
  if (payload.images !== undefined) backendPayload.images = payload.images
  if (payload.colors !== undefined) backendPayload.colors = payload.colors
  if (payload.sizes !== undefined) backendPayload.sizes = payload.sizes
  if (payload.variants !== undefined) backendPayload.variants = payload.variants
  if (payload.isActive !== undefined) backendPayload.is_active = payload.isActive
  if (payload.status !== undefined) backendPayload.is_active = payload.status === 'active'

  const response = await api.patch(`/products/${id}`, backendPayload)
  const raw = response.data?.data ?? response.data
  return mapBackendProduct(raw)
}

export async function deleteProduct(id: number | string) {
  const response = await api.delete(`/products/${id}`)
  return response.data?.data ?? response.data
}

// ---------------- CATEGORIES ----------------

export async function fetchCategories(): Promise<CategoryItem[]> {
  const response = await api.get('/categories')
  const list = response.data?.data ?? response.data ?? []
  return Array.isArray(list) ? list.map(mapBackendCategory) : []
}

export async function createCategory(payload: { name: string; description?: string }): Promise<CategoryItem> {
  const response = await api.post('/categories', payload)
  const raw = response.data?.data ?? response.data
  return mapBackendCategory(raw)
}

export async function updateCategory(id: number | string, payload: { name?: string; description?: string }): Promise<CategoryItem> {
  const response = await api.patch(`/categories/${id}`, payload)
  const raw = response.data?.data ?? response.data
  return mapBackendCategory(raw)
}

export async function deleteCategory(id: number | string) {
  const response = await api.delete(`/categories/${id}`)
  return response.data?.data ?? response.data
}

// ---------------- BRANDS ----------------

export async function fetchBrands(): Promise<BrandItem[]> {
  const response = await api.get('/brands')
  const list = response.data?.data ?? response.data ?? []
  return Array.isArray(list) ? list.map(mapBackendBrand) : []
}

export async function createBrand(payload: { name: string; logo?: string; description?: string }): Promise<BrandItem> {
  const response = await api.post('/brands', {
    name: payload.name,
    logo_path: payload.logo,
    description: payload.description,
  })
  const raw = response.data?.data ?? response.data
  return mapBackendBrand(raw)
}

export async function updateBrand(id: number | string, payload: { name?: string; logo?: string; description?: string }): Promise<BrandItem> {
  const response = await api.patch(`/brands/${id}`, {
    name: payload.name,
    logo_path: payload.logo,
    description: payload.description,
  })
  const raw = response.data?.data ?? response.data
  return mapBackendBrand(raw)
}

export async function deleteBrand(id: number | string) {
  const response = await api.delete(`/brands/${id}`)
  return response.data?.data ?? response.data
}
