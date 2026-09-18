import { useEffect, useState, useMemo } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Star,
  ShoppingBag,
  Zap,
  ShieldCheck,
  Truck,
  RotateCcw,
  Check,
  ChevronRight,
  Share2,
  Minus,
  Plus,
  ArrowLeft,
  Sparkles,
  MessageSquareText,
  Award,
} from 'lucide-react'
import { toast } from 'sonner'
import { useApp } from '../../context/AppContext'
import { fetchProducts, fetchProductById } from '../../services/catalog'
import { fetchReviews } from '../../services/reviews'
import { ProductCard } from '../../components/ProductCard'
import type { Product, Review } from '../../types'

export function ProductDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { addToCart, user: _user } = useApp()

  const [product, setProduct] = useState<Product | null>(null)
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState<string>('')
  const [selectedSize, setSelectedSize] = useState<string>('')
  const [selectedColor, setSelectedColor] = useState<string>('')
  const [quantity, setQuantity] = useState<number>(1)
  const [activeTab, setActiveTab] = useState<'description' | 'specs' | 'shipping' | 'reviews'>('description')
  const [added, setAdded] = useState(false)
  const [reviews, setReviews] = useState<Review[]>([])

  useEffect(() => {
    let isMounted = true
    setLoading(true)

    const loadProductData = async () => {
      let found: Product | undefined

      try {
        if (id) {
          try {
            found = await fetchProductById(id)
          } catch {
            // If fetch by ID failed, try finding in all products list
            const all = await fetchProducts({ per_page: 100 })
            found = all.find((p) => String(p.id) === String(id) || p.sku === id)
          }
        }

        if (found) {
          // Fetch related products
          const allProds = await fetchProducts({ per_page: 20 }).catch(() => [])
          const related = allProds
            .filter((p) => p.id !== found?.id && (p.category === found?.category || p.brand === found?.brand))
            .slice(0, 4)
          if (isMounted) setRelatedProducts(related)

          // Fetch reviews
          try {
            const revData = await fetchReviews(found.id)
            if (Array.isArray(revData) && isMounted) {
              setReviews(revData)
            }
          } catch {
            if (isMounted) setReviews([])
          }
        }
      } catch (err) {
        console.error('Lỗi khi tải thông tin sản phẩm:', err)
      }

      if (isMounted) {
        if (found) {
          setProduct(found)
          setSelectedImage(found.image)
          setSelectedSize(found.sizes?.[0] || 'M')
          setSelectedColor(found.colors?.[0] || 'Standard')
        } else {
          setProduct(null)
        }
        setLoading(false)
      }
    }

    loadProductData()
    window.scrollTo({ top: 0, behavior: 'smooth' })

    return () => {
      isMounted = false
    }
  }, [id])

  // Find matching variant based on currently selected size and color
  const currentVariant = useMemo(() => {
    if (!product?.variants || product.variants.length === 0) return null
    return product.variants.find(
      (v) =>
        String(v.attributes?.size ?? '').trim() === String(selectedSize ?? '').trim() &&
        String(v.attributes?.color ?? '').trim() === String(selectedColor ?? '').trim()
    )
  }, [product, selectedSize, selectedColor])

  // Calculate effective stock for the chosen variant
  const effectiveStock = useMemo(() => {
    if (!product) return 0
    if (product.variants && product.variants.length > 0) {
      return currentVariant ? Math.max(0, currentVariant.stock) : 0
    }
    return Math.max(0, product.stock ?? 0)
  }, [product, currentVariant])

  const isOutOfStock = effectiveStock <= 0

  // Calculate average rating dynamically
  const reviewCount = reviews.length
  const averageRating = useMemo(() => {
    if (reviews.length === 0) return 5.0
    const sum = reviews.reduce((acc, r) => acc + (Number(r.rating) || 5), 0)
    return Number((sum / reviews.length).toFixed(1))
  }, [reviews])

  // Adjust quantity whenever effective stock changes
  useEffect(() => {
    if (effectiveStock <= 0) {
      setQuantity(1)
    } else if (quantity > effectiveStock) {
      setQuantity(effectiveStock)
    }
  }, [effectiveStock])

  const getSizeStock = (size: string) => {
    if (!product?.variants || product.variants.length === 0) return product?.stock ?? 0
    const v = product.variants.find(
      (item) =>
        String(item.attributes?.size ?? '').trim() === String(size).trim() &&
        String(item.attributes?.color ?? '').trim() === String(selectedColor ?? '').trim()
    )
    return v ? v.stock : 0
  }

  const getColorStock = (color: string) => {
    if (!product?.variants || product.variants.length === 0) return product?.stock ?? 0
    const v = product.variants.find(
      (item) =>
        String(item.attributes?.size ?? '').trim() === String(selectedSize ?? '').trim() &&
        String(item.attributes?.color ?? '').trim() === String(color).trim()
    )
    return v ? v.stock : 0
  }

  if (loading) {
    return (
      <div className="min-h-[70vh] grid place-items-center bg-[#0B0E17] text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-lime-400 border-t-transparent" />
          <p className="text-sm font-semibold text-slate-400">Đang tải thông tin sản phẩm...</p>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-[70vh] grid place-items-center bg-[#0B0E17] px-4 py-20 text-center">
        <div className="max-w-md space-y-5 rounded-3xl border border-white/10 bg-slate-900/60 p-8 backdrop-blur-xl">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-white/5 text-3xl">
            ⚽
          </div>
          <h2 className="text-2xl font-black text-white">Không tìm thấy sản phẩm</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Sản phẩm bạn đang tìm kiếm không tồn tại hoặc đã bị gỡ khỏi hệ thống.
          </p>
          <Link
            to="/shop"
            className="inline-flex items-center gap-2 rounded-xl bg-lime-400 px-6 py-3 text-xs font-bold text-slate-950 hover:bg-lime-300 transition-colors"
          >
            <ArrowLeft size={16} />
            Quay lại cửa hàng
          </Link>
        </div>
      </div>
    )
  }

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val)

  const discountPercent =
    product.oldPrice && product.oldPrice > product.price
      ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
      : null

  const imagesList = product.images && product.images.length > 0 ? product.images : [product.image]

  const handleAddToCart = () => {
    if (isOutOfStock) {
      toast.error(`Sản phẩm (Size ${selectedSize} · ${selectedColor}) hiện đã hết hàng!`)
      return
    }
    addToCart(product, quantity, {
      size: selectedSize || product.sizes?.[0] || 'Standard',
      color: selectedColor || product.colors?.[0] || 'Standard',
    })
    setAdded(true)
    toast.success(`Đã thêm ${quantity} x ${product.name} vào giỏ hàng!`)
    setTimeout(() => setAdded(false), 2000)
  }

  const handleBuyNow = () => {
    if (isOutOfStock) {
      toast.error(`Sản phẩm (Size ${selectedSize} · ${selectedColor}) hiện đã hết hàng!`)
      return
    }
    addToCart(product, quantity, {
      size: selectedSize || product.sizes?.[0] || 'Standard',
      color: selectedColor || product.colors?.[0] || 'Standard',
    })
    navigate('/checkout')
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: product.name,
        url: window.location.href,
      })
    } else {
      navigator.clipboard.writeText(window.location.href)
      toast.success('Đã sao chép liên kết sản phẩm!')
    }
  }

  return (
    <div className="min-h-screen bg-[#0B0E17] text-white px-4 py-8 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Breadcrumb Navigation */}
        <nav className="mb-6 flex items-center gap-2 text-xs text-slate-400">
          <Link to="/" className="hover:text-white transition-colors">
            Trang chủ
          </Link>
          <ChevronRight size={14} />
          <Link to="/shop" className="hover:text-white transition-colors">
            Cửa hàng
          </Link>
          <ChevronRight size={14} />
          <span className="truncate font-semibold text-lime-400 max-w-[200px] sm:max-w-none">
            {product.name}
          </span>
        </nav>

        {/* Product Main Container */}
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
          {/* Left Column: Gallery */}
          <div className="lg:col-span-7 space-y-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative aspect-square w-full overflow-hidden rounded-3xl border border-white/10 bg-slate-900/80 backdrop-blur-xl shadow-2xl"
            >
              {/* Product Badges */}
              <div className="absolute top-5 left-5 z-10 flex flex-col gap-2">
                {product.tag && (
                  <span className="rounded-full bg-lime-400 px-3.5 py-1 text-xs font-black uppercase tracking-wider text-slate-950 shadow-lg">
                    {product.tag}
                  </span>
                )}
                {discountPercent && (
                  <span className="rounded-full bg-rose-500 px-3.5 py-1 text-xs font-black tracking-wider text-white shadow-lg">
                    Giảm {discountPercent}%
                  </span>
                )}
              </div>

              {/* Share button */}
              <div className="absolute top-5 right-5 z-10">
                <button
                  onClick={handleShare}
                  className="grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-slate-950/60 text-slate-300 backdrop-blur-md hover:text-white transition-all shadow-lg"
                  title="Chia sẻ sản phẩm"
                >
                  <Share2 size={18} />
                </button>
              </div>

              <img
                src={selectedImage}
                alt={product.name}
                className="h-full w-full object-cover object-center transition-transform duration-500 hover:scale-105"
              />
            </motion.div>

            {/* Thumbnails list */}
            {imagesList.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
                {imagesList.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(img)}
                    className={`relative aspect-square w-20 shrink-0 overflow-hidden rounded-2xl border-2 transition-all ${
                      selectedImage === img
                        ? 'border-lime-400 shadow-[0_0_15px_rgba(163,230,53,0.3)]'
                        : 'border-white/10 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt={`${product.name} ${idx + 1}`} className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Product Specs & Buying Form */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              {/* Brand & Category Header */}
              <div className="flex items-center justify-between text-xs">
                <span className="rounded-lg bg-lime-400/10 px-3 py-1 font-bold text-lime-400 border border-lime-400/20">
                  {product.brand}
                </span>
                <span className="text-slate-400">{product.category}</span>
              </div>

              {/* Title */}
              <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight">
                {product.name}
              </h1>

              {/* Rating & Stock */}
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1 text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={14}
                      className={i < Math.round(averageRating) ? 'fill-amber-400 text-amber-400' : 'text-slate-600'}
                    />
                  ))}
                  <span className="ml-1 font-bold text-slate-200">{reviewCount > 0 ? averageRating : '5.0'}</span>
                  <span className="text-slate-500">
                    ({reviewCount > 0 ? `${reviewCount} đánh giá` : 'Chưa có đánh giá'})
                  </span>
                </div>
                <span className="text-slate-600">|</span>
                <span className={`font-semibold ${!isOutOfStock ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {!isOutOfStock ? `Còn hàng (${effectiveStock} sản phẩm)` : 'Hết hàng'}
                </span>
              </div>

              {/* Price Section */}
              <div className="flex items-baseline gap-3 rounded-2xl border border-white/10 bg-slate-900/60 p-4 backdrop-blur-xl">
                <span className="text-3xl font-black text-lime-400">
                  {formatCurrency(product.price)}
                </span>
                {product.oldPrice && product.oldPrice > product.price && (
                  <span className="text-sm text-slate-500 line-through">
                    {formatCurrency(product.oldPrice)}
                  </span>
                )}
              </div>

              {/* Short Description */}
              <p className="text-xs text-slate-300 leading-relaxed">
                {product.description}
              </p>

              {/* Color Selector */}
              {product.colors && product.colors.length > 0 && (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-300">
                    Màu sắc: <span className="text-lime-400">{selectedColor}</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {product.colors.map((color) => {
                      const clStock = getColorStock(color)
                      const isClOutOfStock = product.variants && product.variants.length > 0 && clStock <= 0
                      return (
                        <button
                          key={color}
                          onClick={() => setSelectedColor(color)}
                          className={`relative rounded-xl border px-4 py-2 text-xs font-semibold transition-all ${
                            selectedColor === color
                              ? 'border-lime-400 bg-lime-400/20 text-lime-400 shadow-[0_0_10px_rgba(163,230,53,0.2)]'
                              : isClOutOfStock
                              ? 'border-white/5 bg-white/[0.02] text-slate-500 hover:border-white/20'
                              : 'border-white/10 bg-white/5 text-slate-300 hover:border-white/30'
                          }`}
                        >
                          {color}
                          {isClOutOfStock && (
                            <span className="ml-1 text-[10px] text-rose-400 font-normal">(Hết)</span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Size Selector */}
              {product.sizes && product.sizes.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <label className="font-bold text-slate-300">
                      Kích thước: <span className="text-lime-400">{selectedSize}</span>
                    </label>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {product.sizes.map((size) => {
                      const szStock = getSizeStock(size)
                      const isSzOutOfStock = product.variants && product.variants.length > 0 && szStock <= 0
                      return (
                        <button
                          key={size}
                          onClick={() => setSelectedSize(size)}
                          className={`relative min-w-[44px] h-10 rounded-xl border px-3 text-xs font-bold transition-all ${
                            selectedSize === size
                              ? 'border-lime-400 bg-lime-400 text-slate-950 shadow-[0_0_12px_rgba(163,230,53,0.3)]'
                              : isSzOutOfStock
                              ? 'border-white/5 bg-white/[0.02] text-slate-500 hover:border-white/20'
                              : 'border-white/10 bg-white/5 text-slate-300 hover:border-white/30'
                          }`}
                        >
                          {size}
                          {isSzOutOfStock && (
                            <span className="absolute -top-1 -right-1 flex h-2 w-2">
                              <span className="h-full w-full rounded-full bg-rose-500" />
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Quantity Counter */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300">Số lượng:</label>
                <div className="flex items-center gap-3">
                  <div className="flex items-center rounded-xl border border-white/10 bg-white/5 p-1">
                    <button
                      disabled={isOutOfStock}
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      className="grid h-8 w-8 place-items-center rounded-lg hover:bg-white/10 text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="w-10 text-center text-sm font-bold text-white">
                      {isOutOfStock ? 0 : quantity}
                    </span>
                    <button
                      disabled={isOutOfStock || quantity >= effectiveStock}
                      onClick={() => setQuantity((q) => Math.min(effectiveStock, q + 1))}
                      className="grid h-8 w-8 place-items-center rounded-lg hover:bg-white/10 text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  <span className="text-xs text-slate-500">
                    Tổng: <b className="text-white">{formatCurrency(isOutOfStock ? 0 : product.price * quantity)}</b>
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 pt-4">
              {isOutOfStock ? (
                <div className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-rose-500/30 bg-rose-500/10 text-xs font-bold text-rose-400 select-none">
                  <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
                  <span>SẢN PHẨM (SIZE {selectedSize} - {selectedColor}) HIỆN ĐÃ HẾT HÀNG</span>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={handleAddToCart}
                    className={`flex h-12 items-center justify-center gap-2 rounded-2xl border text-xs font-bold transition-all duration-200 ${
                      added
                        ? 'border-emerald-500 bg-emerald-500 text-white'
                        : 'border-lime-400/40 bg-lime-400/10 text-lime-400 hover:bg-lime-400/20'
                    }`}
                  >
                    {added ? (
                      <>
                        <Check size={16} />
                        <span>Đã thêm vào giỏ</span>
                      </>
                    ) : (
                      <>
                        <ShoppingBag size={16} />
                        <span>Thêm vào giỏ</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleBuyNow}
                    className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-lime-400 text-xs font-bold text-slate-950 shadow-[0_0_20px_rgba(163,230,53,0.3)] hover:bg-lime-300 transition-all"
                  >
                    <Zap size={16} />
                    <span>Mua ngay</span>
                  </button>
                </div>
              )}
            </div>

            {/* Guarantees Box */}
            <div className="grid grid-cols-2 gap-3 rounded-2xl border border-white/10 bg-slate-900/40 p-4 text-[11px] text-slate-300">
              <div className="flex items-center gap-2">
                <ShieldCheck size={16} className="text-lime-400 shrink-0" />
                <span>100% Chính hãng STRIKER</span>
              </div>
              <div className="flex items-center gap-2">
                <Truck size={16} className="text-lime-400 shrink-0" />
                <span>Giao hàng nhanh chóng</span>
              </div>
              <div className="flex items-center gap-2">
                <RotateCcw size={16} className="text-lime-400 shrink-0" />
                <span>Đổi trả 30 ngày dễ dàng</span>
              </div>
              <div className="flex items-center gap-2">
                <Award size={16} className="text-lime-400 shrink-0" />
                <span>Bảo hành keo dán 12 tháng</span>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Tabs Area */}
        <div className="mt-16 rounded-3xl border border-white/10 bg-slate-900/60 p-6 lg:p-8 backdrop-blur-xl space-y-6">
          {/* Tab Headers */}
          <div className="flex flex-wrap gap-3 border-b border-white/10 pb-4">
            {[
              { key: 'description', label: 'Mô tả chi tiết', icon: Sparkles },
              { key: 'specs', label: 'Thông số kỹ thuật', icon: Award },
              { key: 'shipping', label: 'Giao hàng & Đổi trả', icon: Truck },
              { key: 'reviews', label: `Đánh giá (${reviewCount})`, icon: MessageSquareText },
            ].map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${
                    activeTab === tab.key
                      ? 'bg-lime-400 text-slate-950 shadow-md'
                      : 'text-slate-400 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <Icon size={14} />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </div>

          {/* Tab Content */}
          <div className="text-xs leading-relaxed text-slate-300">
            {activeTab === 'description' && (
              <div className="space-y-4 max-w-3xl">
                <h3 className="text-base font-bold text-white">Đặc điểm nổi bật của {product.name}</h3>
                <p>{product.description}</p>
                <p>
                  Sản phẩm thuộc dòng sản phẩm cao cấp phân phối độc quyền bởi STRIKER. Được làm từ chất liệu thể thao chuyên dụng, tối ưu độ bền và mang lại trải nghiệm thi đấu thăng hoa cho người chơi.
                </p>
                <ul className="list-disc list-inside space-y-1 text-slate-400 pt-2">
                  <li>Form dáng ôm chân chuẩn thiết kế thể thao hiện đại.</li>
                  <li>Đế giày gia cố chắc chắn, tăng khả năng bám sân đột phá.</li>
                  <li>Trọng lượng siêu nhẹ giúp di chuyển linh hoạt trên mọi mặt sân.</li>
                </ul>
              </div>
            )}

            {activeTab === 'specs' && (
              <div className="max-w-2xl">
                <table className="w-full text-left border-collapse">
                  <tbody>
                    <tr className="border-b border-white/10">
                      <td className="py-2.5 font-semibold text-slate-400">Thương hiệu:</td>
                      <td className="py-2.5 font-bold text-white">{product.brand}</td>
                    </tr>
                    <tr className="border-b border-white/10">
                      <td className="py-2.5 font-semibold text-slate-400">Danh mục:</td>
                      <td className="py-2.5 text-white">{product.category}</td>
                    </tr>
                    <tr className="border-b border-white/10">
                      <td className="py-2.5 font-semibold text-slate-400">Mã SKU:</td>
                      <td className="py-2.5 text-white">{product.sku || `STR-PROD-${product.id}`}</td>
                    </tr>
                    <tr className="border-b border-white/10">
                      <td className="py-2.5 font-semibold text-slate-400">Tình trạng kho:</td>
                      <td className={`py-2.5 font-bold ${!isOutOfStock ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {!isOutOfStock ? `Còn ${effectiveStock} sản phẩm (Biến thể đang chọn)` : 'Hết hàng (Biến thể đang chọn)'}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2.5 font-semibold text-slate-400">Xuất xứ:</td>
                      <td className="py-2.5 text-white">Chính hãng nhập khẩu / Phân phối chính thức</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'shipping' && (
              <div className="space-y-4 max-w-3xl">
                <h3 className="text-base font-bold text-white">Chính sách vận chuyển & Đổi trả</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-2">
                    <h4 className="font-bold text-lime-400 flex items-center gap-2">
                      <Truck size={16} /> Vận chuyển nhanh
                    </h4>
                    <p className="text-slate-400">Giao hàng toàn quốc từ 1-3 ngày làm việc. Đơn nội thành Hà Nội & TP.HCM có thể nhận trong ngày.</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-2">
                    <h4 className="font-bold text-lime-400 flex items-center gap-2">
                      <RotateCcw size={16} /> Đổi trả dễ dàng
                    </h4>
                    <p className="text-slate-400">Hỗ trợ đổi size hoặc mẫu khác trong vòng 30 ngày nếu sản phẩm chưa qua sử dụng và nguyên tem mác.</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="space-y-6">
                {/* Summary Box */}
                <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 p-6">
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <div className="text-4xl font-black text-lime-400">
                        {reviewCount > 0 ? averageRating : '5.0'}
                      </div>
                      <div className="text-[10px] text-slate-400">trên 5 sao</div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1 text-amber-400">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            size={14}
                            className={
                              i < (reviewCount > 0 ? Math.round(averageRating) : 5)
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-slate-600'
                            }
                          />
                        ))}
                      </div>
                      <span className="text-slate-400 text-[11px]">
                        {reviewCount > 0
                          ? `Dựa trên ${reviewCount} đánh giá thực tế từ khách hàng đã mua`
                          : 'Chưa có lượt đánh giá nào từ khách hàng'}
                      </span>
                    </div>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-[11px] text-slate-400">
                    💡 Đánh giá được gửi từ <span className="font-semibold text-white">Lịch sử đơn hàng</span> sau khi nhận hàng thành công
                  </div>
                </div>

                {/* Reviews List */}
                <div className="space-y-3">
                  {reviews.length === 0 ? (
                    <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-8 text-center space-y-2">
                      <div className="mx-auto w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-500">
                        <MessageSquareText size={20} />
                      </div>
                      <p className="text-xs font-semibold text-slate-400">
                        Chưa có đánh giá nào cho sản phẩm này.
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Hãy là người đầu tiên trải nghiệm và chia sẻ cảm nhận của bạn nhé!
                      </p>
                    </div>
                  ) : (
                    reviews.map((rev) => (
                      <div
                        key={rev.id}
                        className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-2 transition hover:border-white/20"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {rev.userAvatar ? (
                              <img
                                src={rev.userAvatar}
                                alt={rev.userName}
                                className="h-8 w-8 rounded-full object-cover border border-white/10"
                              />
                            ) : (
                              <div className="grid h-8 w-8 place-items-center rounded-full bg-lime-400/20 text-xs font-bold text-lime-400 border border-lime-400/30">
                                {rev.userName ? rev.userName.charAt(0).toUpperCase() : 'U'}
                              </div>
                            )}
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-white text-xs">{rev.userName || 'Khách Hàng'}</span>
                                <span className="text-[10px] text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded-full border border-emerald-400/20">
                                  ✓ Đã mua hàng
                                </span>
                              </div>
                              <span className="text-[10px] text-slate-500">
                                {rev.date || 'Vừa xong'}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 text-amber-400">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                size={12}
                                className={i < (rev.rating || 5) ? 'fill-amber-400 text-amber-400' : 'text-slate-600'}
                              />
                            ))}
                          </div>
                        </div>

                        <p className="text-slate-300 text-xs leading-relaxed pl-11">
                          {rev.comment}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Related Products Section */}
        {relatedProducts.length > 0 && (
          <div className="mt-16 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-white">Sản phẩm tương tự</h2>
                <p className="text-xs text-slate-400">Có thể bạn cũng sẽ thích các mẫu sản phẩm này</p>
              </div>
              <Link to="/shop" className="text-xs font-bold text-lime-400 hover:underline">
                Xem tất cả &rarr;
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
              {relatedProducts.map((rel) => (
                <ProductCard key={rel.id} product={rel} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
