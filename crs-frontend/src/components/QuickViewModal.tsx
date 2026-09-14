import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import type { Product } from '../types'

// Modal xem nhanh thông tin sản phẩm mà không cần chuyển trang.
export function QuickViewModal({
  product,
  onClose,
}: {
  product: Product | null
  onClose: () => void
}) {
  const { addToCart, user, notify } = useApp()

  const add = () => {
    if (!user) {
      notify('Vui lòng đăng nhập để mua hàng.')
      return
    }
    void addToCart(product as Product)
    onClose()
  }

  return (
    <AnimatePresence>
      {product && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-[60] grid place-items-center bg-slate-950/80 p-5 backdrop-blur-md"
        >
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24 }}
            onClick={(event) => event.stopPropagation()}
            className="relative grid w-full max-w-3xl overflow-hidden rounded-3xl border border-white/10 bg-slate-900 shadow-2xl shadow-emerald-950/60 md:grid-cols-2"
          >
            <button
              onClick={onClose}
              className="absolute right-4 top-4 z-10 rounded-full bg-slate-950/50 p-2 text-white hover:text-lime-300"
            >
              <X size={19} />
            </button>

            <img
              src={product.image}
              alt={product.name}
              className="h-80 w-full object-cover md:h-full"
            />

            <div className="p-7 text-white md:p-10">
              <span className="text-xs font-bold uppercase tracking-[.2em] text-emerald-300">
                {product.brand} / quick view
              </span>
              <h2 className="mt-4 text-3xl font-black tracking-tight">
                {product.name}
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-400">
                {product.description}
              </p>
              <p className="mt-8 text-2xl font-black text-lime-300">
                {product.price.toLocaleString('vi-VN')}đ
              </p>

              <div className="mt-8 flex gap-3">
                <button
                  onClick={add}
                  className="flex flex-1 items-center justify-center gap-3 rounded-xl bg-lime-400 py-4 text-sm font-black text-slate-950 hover:bg-lime-300"
                >
                  Thêm vào giỏ <ArrowRight size={17} />
                </button>
                <Link
                  onClick={onClose}
                  to={`/product/${product.id}`}
                  className="grid place-items-center rounded-xl border border-white/15 px-4 hover:border-lime-400 hover:text-lime-300"
                >
                  Chi tiết
                </Link>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}