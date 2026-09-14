import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  Minus,
  Plus,
  ShoppingBag,
  Tag,
  Ticket,
  Trash2,
} from 'lucide-react'
import { toast } from 'sonner'
import { useApp } from '../../context/AppContext'
import { CouponModal } from '../../components/CouponModal'
import { ProductCard } from '../../components/ProductCard'
import { products } from '../../data'

export function Cart() {
  const {
    cart,
    cartSubtotal,
    cartTotal,
    discountAmount,
    shippingFee,
    appliedCoupon,
    applyCoupon,
    removeCoupon,
    updateCart,
    removeFromCart,
    toggleCartItem,
    toggleSelectAll,
    updateCartVariant,
    user,
  } = useApp()

  const [couponModalOpen, setCouponModalOpen] = useState(false)
  const [couponInput, setCouponInput] = useState('')
  const navigate = useNavigate()

  const allSelected = cart.length > 0 && cart.every((item) => item.selected !== false)
  const selectedItemsCount = cart.filter((item) => item.selected !== false).length

  const handleApplyInputCoupon = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!couponInput.trim()) {
      toast.error('Vui lòng nhập mã giảm giá')
      return
    }
    const res = await applyCoupon(couponInput.trim())
    if (res.success) {
      setCouponInput('')
    }
  }

  const handleProceedCheckout = () => {
    if (selectedItemsCount === 0) {
      toast.warning('Vui lòng chọn ít nhất một sản phẩm để thanh toán!')
      return
    }
    if (!user) {
      toast.info('Vui lòng đăng nhập để tiến hành thanh toán!')
      navigate('/login', { state: { from: '/checkout' } })
    } else {
      navigate('/checkout')
    }
  }

  const upsellProducts = products.filter((p) => !cart.some((c) => c.id === p.id)).slice(0, 4)

  return (
    <section className="min-h-screen bg-[#0B0E17] px-5 py-12 text-white lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Page Header */}
        <div className="mb-10">
          <span className="inline-flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-widest text-emerald-400">
            <ShoppingBag size={14} /> Your Cart Selection
          </span>
          <h1 className="mt-2 text-4xl font-black tracking-tight text-white sm:text-5xl">
            Giỏ hàng <em>của bạn.</em>
          </h1>
          <p className="mt-2 text-xs text-slate-400">
            {cart.length > 0
              ? `${cart.length} sản phẩm sẵn sàng ra sân cùng bạn.`
              : 'Giỏ hàng đang chờ những lựa chọn đầu tiên.'}
          </p>
        </div>

        {cart.length > 0 ? (
          <div className="grid gap-10 lg:grid-cols-[1fr_380px] items-start">
            {/* Left: Cart Items List */}
            <div className="space-y-4">
              {/* Select All Bar */}
              <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-[#131823] px-5 py-3.5 backdrop-blur-md">
                <label className="flex items-center gap-3 text-xs font-bold text-slate-300 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleSelectAll}
                    className="h-4 w-4 rounded accent-lime-400 cursor-pointer"
                  />
                  <span>
                    Chọn tất cả ({selectedItemsCount}/{cart.length} sản phẩm)
                  </span>
                </label>

                {selectedItemsCount > 0 && (
                  <span className="text-xs text-slate-400">
                    Đã chọn: <b className="text-lime-300">{cartSubtotal.toLocaleString('vi-VN')}đ</b>
                  </span>
                )}
              </div>

              {/* Items */}
              <div className="space-y-3">
                {cart.map((item) => (
                  <motion.div
                    key={item.cartItemId}
                    layout
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className={`flex flex-col sm:flex-row sm:items-center gap-4 rounded-3xl border p-4 sm:p-5 transition shadow-lg backdrop-blur-sm ${
                      item.selected === false
                        ? 'border-white/5 bg-[#0B0E17]/50 opacity-60'
                        : 'border-white/10 bg-[#131823]'
                    }`}
                  >
                    {/* Checkbox & Thumbnail */}
                    <div className="flex items-center gap-4">
                      <input
                        type="checkbox"
                        checked={item.selected !== false}
                        onChange={() => toggleCartItem(item.cartItemId)}
                        className="h-5 w-5 rounded accent-lime-400 cursor-pointer shrink-0"
                      />

                      <Link
                        to={`/product/${item.id}`}
                        className="h-24 w-24 shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-[#0B0E17]"
                      >
                        <img
                          src={
                            item.image?.startsWith('http') || item.image?.startsWith('data:')
                              ? item.image
                              : item.image?.startsWith('/storage/')
                              ? `http://localhost:8000${item.image}`
                              : `http://localhost:8000/storage/${item.image || ''}`
                          }
                          alt={item.name}
                          className="h-full w-full object-cover transition hover:scale-105"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src =
                              'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300&q=80'
                          }}
                        />
                      </Link>
                    </div>

                    {/* Details */}
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                          {item.brand}
                        </span>
                        <span className="font-mono text-sm sm:text-base font-black text-lime-300">
                          {(item.price * item.quantity).toLocaleString('vi-VN')}đ
                        </span>
                      </div>

                      <Link
                        to={`/product/${item.id}`}
                        className="block font-bold text-white hover:text-lime-300 text-sm"
                      >
                        {item.name}
                      </Link>

                      {/* Variant Selectors */}
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <select
                          value={item.selectedSize ?? item.sizes?.[0]}
                          onChange={(e) =>
                            updateCartVariant(
                              item.cartItemId,
                              e.target.value,
                              item.selectedColor ?? item.colors?.[0]
                            )
                          }
                          className="rounded-xl border border-white/10 bg-[#0B0E17] px-3 py-1 text-xs text-slate-300 outline-none"
                        >
                          {item.sizes?.map((size) => (
                            <option key={size} value={size}>
                              Size: {size}
                            </option>
                          ))}
                        </select>

                        <select
                          value={item.selectedColor ?? item.colors?.[0]}
                          onChange={(e) =>
                            updateCartVariant(
                              item.cartItemId,
                              item.selectedSize ?? item.sizes?.[0],
                              e.target.value
                            )
                          }
                          className="rounded-xl border border-white/10 bg-[#0B0E17] px-3 py-1 text-xs text-slate-300 outline-none"
                        >
                          {item.colors?.map((color) => (
                            <option key={color} value={color}>
                              Màu: {color}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Quantity & Delete */}
                    <div className="flex items-center justify-between sm:flex-col sm:items-end gap-3 border-t border-white/5 pt-3 sm:border-0 sm:pt-0">
                      <div className="flex items-center gap-2 rounded-xl border border-white/15 bg-[#0B0E17] px-3 py-1.5">
                        <button
                          onClick={() => updateCart(item.cartItemId, item.quantity - 1)}
                          className="text-slate-400 hover:text-white"
                        >
                          <Minus size={14} />
                        </button>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) =>
                            updateCart(
                              item.cartItemId,
                              Math.max(1, Number(e.target.value) || 1)
                            )
                          }
                          className="w-8 bg-transparent text-center font-mono text-xs font-bold outline-none"
                        />
                        <button
                          onClick={() => updateCart(item.cartItemId, item.quantity + 1)}
                          className="text-slate-400 hover:text-white"
                        >
                          <Plus size={14} />
                        </button>
                      </div>

                      <button
                        onClick={() => removeFromCart(item.cartItemId)}
                        className="flex items-center gap-1 text-xs text-slate-500 hover:text-rose-400 transition"
                      >
                        <Trash2 size={14} />
                        <span>Xóa</span>
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Right: Order Summary & Coupon Panel */}
            <aside className="space-y-6 rounded-3xl border border-white/10 bg-[#131823] p-6 backdrop-blur-xl shadow-2xl sticky top-24">
              {/* Coupon Application Box */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    Khuyến mãi & Voucher
                  </span>
                  <button
                    onClick={() => setCouponModalOpen(true)}
                    className="flex items-center gap-1 text-xs font-bold text-lime-400 hover:underline"
                  >
                    <Ticket size={14} /> Chọn Voucher có sẵn
                  </button>
                </div>

                {appliedCoupon ? (
                  <div className="flex items-center justify-between rounded-2xl border border-lime-400/40 bg-lime-400/10 p-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="grid h-8 w-8 place-items-center rounded-xl bg-lime-400 text-slate-950 font-black text-xs">
                        %
                      </div>
                      <div>
                        <span className="font-mono text-xs font-black text-lime-300">
                          {appliedCoupon.code}
                        </span>
                        <p className="text-[11px] text-slate-300">{appliedCoupon.title}</p>
                      </div>
                    </div>
                    <button
                      onClick={removeCoupon}
                      className="text-xs font-bold text-rose-400 hover:underline"
                    >
                      Gỡ bỏ
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleApplyInputCoupon} className="flex gap-2">
                    <div className="relative flex-1">
                      <Tag
                        size={15}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                      />
                      <input
                        type="text"
                        value={couponInput}
                        onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                        placeholder="Nhập mã voucher..."
                        className="w-full rounded-xl border border-white/10 bg-[#0B0E17] py-2.5 pl-9 pr-3 text-xs uppercase font-mono text-white outline-none placeholder:normal-case placeholder:font-sans placeholder:text-slate-500 focus:border-lime-400"
                      />
                    </div>
                    <button
                      type="submit"
                      className="rounded-xl bg-lime-400 px-4 py-2.5 text-xs font-bold text-slate-950 transition hover:bg-lime-300"
                    >
                      Áp dụng
                    </button>
                  </form>
                )}
              </div>

              {/* Pricing Lines */}
              <div className="space-y-2.5 border-t border-white/10 pt-5 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Tạm tính ({selectedItemsCount} sản phẩm)</span>
                  <span className="font-mono font-bold text-white">
                    {cartSubtotal.toLocaleString('vi-VN')}đ
                  </span>
                </div>

                {discountAmount > 0 && (
                  <div className="flex justify-between font-semibold text-emerald-400">
                    <span className="flex items-center gap-1">
                      <Tag size={13} /> Giảm giá Voucher
                    </span>
                    <span className="font-mono">
                      -{discountAmount.toLocaleString('vi-VN')}đ
                    </span>
                  </div>
                )}

                <div className="flex justify-between text-slate-400">
                  <span>Phí vận chuyển</span>
                  <span className="font-mono font-bold">
                    {shippingFee === 0 ? (
                      <span className="text-lime-300">Miễn phí</span>
                    ) : (
                      `${shippingFee.toLocaleString('vi-VN')}đ`
                    )}
                  </span>
                </div>

                <div className="flex justify-between border-t border-white/10 pt-3 text-base">
                  <span className="font-black text-white">Tổng thanh toán</span>
                  <b className="font-mono text-xl font-black text-lime-300">
                    {cartTotal.toLocaleString('vi-VN')}đ
                  </b>
                </div>
              </div>

              {/* Checkout Button */}
              <button
                onClick={handleProceedCheckout}
                disabled={selectedItemsCount === 0}
                className={`flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-xs font-black uppercase tracking-wider transition shadow-xl ${
                  selectedItemsCount > 0
                    ? 'bg-lime-400 text-slate-950 hover:bg-lime-300 shadow-lime-400/20 cursor-pointer'
                    : 'bg-white/10 text-slate-500 cursor-not-allowed'
                }`}
              >
                Tiến hành thanh toán <ArrowRight size={16} />
              </button>

              <Link
                to="/shop"
                className="block text-center text-xs font-bold text-slate-400 hover:text-white transition"
              >
                ← Tiếp tục mua sắm
              </Link>
            </aside>
          </div>
        ) : (
          /* Empty Cart State */
          <div className="grid min-h-[460px] place-items-center rounded-3xl border border-dashed border-white/15 bg-white/[0.02] p-10 text-center">
            <div className="space-y-4 max-w-md">
              <div className="mx-auto grid h-20 w-20 place-items-center rounded-3xl border border-white/10 bg-white/5 text-4xl shadow-xl">
                🛍️
              </div>
              <h2 className="text-2xl font-black text-white">
                Giỏ hàng của bạn đang trống
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Hãy dạo quanh cửa hàng và chọn những đôi giày hoặc phụ kiện thể thao bạn
                yêu thích nhé.
              </p>
              <div className="pt-2">
                <Link
                  to="/shop"
                  className="inline-flex items-center gap-2 rounded-2xl bg-lime-400 px-8 py-4 text-xs font-black uppercase tracking-wider text-slate-950 shadow-xl shadow-lime-400/20 hover:bg-lime-300"
                >
                  Khám phá cửa hàng <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Upsell Recommendations */}
        {upsellProducts.length > 0 && (
          <div className="mt-24 border-t border-white/10 pt-16">
            <div className="mb-8 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">
                  Có thể bạn sẽ thích
                </span>
                <h2 className="mt-2 text-2xl font-black text-white">
                  Gợi ý thêm cho bạn
                </h2>
              </div>
              <Link
                to="/shop"
                className="text-xs font-bold text-lime-300 hover:underline"
              >
                Xem tất cả →
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
              {upsellProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Coupon Modal */}
      <CouponModal
        isOpen={couponModalOpen}
        onClose={() => setCouponModalOpen(false)}
      />
    </section>
  )
}