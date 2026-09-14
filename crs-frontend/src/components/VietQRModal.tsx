import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import confetti from 'canvas-confetti'
import {
  Check,
  Clock,
  Copy,
  Download,
  QrCode,
  ShieldCheck,
  X,
  Zap,
} from 'lucide-react'
import { toast } from 'sonner'
import { useApp } from '../context/AppContext'
import { INITIAL_SHOP_SETTINGS, POPULAR_VIETNAMESE_BANKS } from '../data/adminMockData'
import { fetchPaymentSettings, type PaymentSetting } from '../services/payment'
import type { Order, ShopSettings } from '../types'

interface VietQRModalProps {
  isOpen: boolean
  order: Order | null
  onClose: () => void
  onSuccess?: () => void
}

export function VietQRModal({ isOpen, order, onClose, onSuccess }: VietQRModalProps) {
  const { updateOrderStatus, clearCart } = useApp()
  const [timeLeft, setTimeLeft] = useState(300) // 5 minutes
  const [checking, setChecking] = useState(false)
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [dbSettings, setDbSettings] = useState<PaymentSetting | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    let active = true
    fetchPaymentSettings()
      .then((s) => {
        if (active && s && s.account_number) {
          setDbSettings(s)
        }
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [isOpen])

  // Read dynamic shop settings for VietQR configuration
  const shopSettings: ShopSettings = useMemo(() => {
    const stored = localStorage.getItem('crs_shop_settings')
    if (stored) {
      try {
        return JSON.parse(stored) as ShopSettings
      } catch {}
    }
    return INITIAL_SHOP_SETTINGS
  }, [])

  const bankCode = dbSettings?.bank_code || shopSettings.bankName || 'MB'
  const accountNumber = dbSettings?.account_number || shopSettings.bankAccountNo || '0977777777'
  const accountName = dbSettings?.account_name || shopSettings.bankAccountName || 'STRIKER SPORT PRO'
  const bankMatched = POPULAR_VIETNAMESE_BANKS.find((b) => b.code === bankCode)
  const bankDisplay = dbSettings?.bank_name || (bankMatched ? bankMatched.name : bankCode)

  // Compute transfer syntax dynamically
  const transferContent = useMemo(() => {
    if (!order) return ''
    const syntaxPrefix = dbSettings?.syntax_prefix || (shopSettings.transferSyntax ? shopSettings.transferSyntax.replace('{ORDER_ID}', '').replace('{ORDER_CODE}', '').trim() : 'STR')
    return `${syntaxPrefix} ${order.id}`
  }, [order, dbSettings?.syntax_prefix, shopSettings.transferSyntax])

  // Look up bank BIN or code for VietQR img API
  const qrBankKey = useMemo(() => {
    if (bankCode === 'MBBANK' || bankCode === 'MB') return 'MB'
    if (bankCode === 'VCB') return 'VCB'
    if (bankCode === 'TCB') return 'TCB'
    if (bankCode === 'ACB') return 'ACB'
    if (bankCode === 'VPB') return 'VPB'
    if (bankCode === 'TPB') return 'TPB'
    if (bankCode === 'BIDV') return 'BIDV'
    if (bankCode === 'CTG') return 'ICB'
    if (bankCode === 'STB') return 'STB'
    if (bankCode === 'VIB') return 'VIB'
    return bankCode
  }, [bankCode])

  // Countdown timer
  useEffect(() => {
    if (!isOpen || !order) {
      setTimeLeft(300)
      setChecking(false)
      return
    }

    const timer = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [isOpen, order])

  if (!order) return null

  const minutes = Math.floor(timeLeft / 60)
  const seconds = timeLeft % 60
  const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds
    .toString()
    .padStart(2, '0')}`

  const qrUrl =
    `https://img.vietqr.io/image/${qrBankKey}-${accountNumber}-compact2.png` +
    `?amount=${order.total}` +
    `&addInfo=${encodeURIComponent(transferContent)}` +
    `&accountName=${encodeURIComponent(accountName)}`

  const handleCopy = (text: string | number, fieldName: string) => {
    navigator.clipboard.writeText(String(text))
    setCopiedField(fieldName)
    toast.success(`Đã sao chép ${fieldName}!`)
    setTimeout(() => setCopiedField(null), 2000)
  }

  /** Shared reconciliation logic for both buttons */
  const processPayment = () => {
    if (checking) return
    setChecking(true)

    // 3.5-second simulated reconciliation with MBBank
    setTimeout(() => {
      // 1. Mark order as paid
      updateOrderStatus(order.id, 'pending', 'paid')

      // 2. Canvas-confetti fireworks
      confetti({
        particleCount: 160,
        spread: 100,
        origin: { y: 0.55 },
        colors: ['#a3e635', '#10b981', '#38bdf8', '#f59e0b', '#ec4899'],
      })
      setTimeout(() => {
        confetti({ particleCount: 70, spread: 60, origin: { x: 0.1, y: 0.65 }, colors: ['#a3e635', '#fbbf24'] })
        confetti({ particleCount: 70, spread: 60, origin: { x: 0.9, y: 0.65 }, colors: ['#38bdf8', '#ec4899'] })
      }, 250)

      // 3. Sonner toast
      toast.success(`Thanh toán thành công qua ${bankDisplay}! 🎉`, {
        description: `Đơn hàng ${order.id} đã được xác nhận. Cảm ơn bạn đã mua sắm tại Striker!`,
        duration: 6000,
      })

      // 4. Clear the user's cart
      clearCart()

      // 5. Close modal & navigate to orders page
      setChecking(false)
      if (onSuccess) onSuccess()
      else onClose()
      navigate('/orders')
    }, 3500)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={checking ? undefined : onClose}
            className="fixed inset-0 bg-[#0B0E17]/88 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 24 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            className="relative flex max-h-[94vh] w-full max-w-xl flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#131823] text-white shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
              <div className="flex items-center gap-2.5">
                <div className="grid h-10 w-10 place-items-center rounded-2xl bg-lime-400 text-slate-950 font-black">
                  <QrCode size={20} />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-black text-white">
                    Quét mã VietQR để thanh toán
                  </h2>
                  <p className="text-xs text-slate-400">
                    Mã đơn hàng:{' '}
                    <b className="font-mono text-lime-300">{order.id}</b>
                  </p>
                </div>
              </div>

              <button
                onClick={checking ? undefined : onClose}
                disabled={checking}
                className="rounded-xl p-2 text-slate-400 transition hover:bg-white/10 hover:text-white disabled:opacity-40 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Countdown Timer Alert */}
              <div
                className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-xs transition-colors ${
                  timeLeft <= 60
                    ? 'border-rose-500/40 bg-rose-500/10 text-rose-200'
                    : 'border-amber-500/30 bg-amber-500/10 text-amber-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Clock size={16} className={timeLeft <= 60 ? 'text-rose-400' : 'text-amber-400'} />
                  <span>Vui lòng hoàn tất thanh toán trong:</span>
                </div>
                <b className={`font-mono text-sm font-black ${timeLeft <= 60 ? 'text-rose-300' : 'text-amber-300'}`}>
                  {formattedTime}
                </b>
              </div>

              {/* QR Image Frame */}
              <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-white p-5 shadow-inner">
                <img
                  src={qrUrl}
                  alt={`VietQR ${bankDisplay} Code`}
                  className="max-h-64 w-auto rounded-xl object-contain shadow-md"
                />
                <span className="mt-3 text-center text-[11px] font-semibold text-slate-600 flex items-center gap-1">
                  <ShieldCheck size={14} className="text-emerald-600" />
                  Quét bằng App ngân hàng bất kỳ để tự điền thông tin
                </span>
              </div>

              {/* Bank Transfer Details Table */}
              <div className="rounded-2xl border border-white/10 bg-[#0B0E17]/90 p-4 space-y-3 text-xs">
                {/* Ngân hàng */}
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Ngân hàng:</span>
                  <span className="font-bold text-white text-right">{bankDisplay}</span>
                </div>

                {/* Số tài khoản */}
                <div className="flex items-center justify-between border-t border-white/5 pt-2.5">
                  <span className="text-slate-400">Số tài khoản:</span>
                  <div className="flex items-center gap-2">
                    <b className="font-mono text-sm text-lime-300">{accountNumber}</b>
                    <button
                      onClick={() => handleCopy(accountNumber, 'Số tài khoản')}
                      className="rounded p-0.5 text-slate-400 hover:text-white transition cursor-pointer"
                    >
                      {copiedField === 'Số tài khoản' ? (
                        <Check size={14} className="text-lime-400" />
                      ) : (
                        <Copy size={14} />
                      )}
                    </button>
                  </div>
                </div>

                {/* Chủ tài khoản */}
                <div className="flex items-center justify-between border-t border-white/5 pt-2.5">
                  <span className="text-slate-400">Chủ tài khoản:</span>
                  <b className="text-white uppercase tracking-wide">{accountName}</b>
                </div>

                {/* Số tiền */}
                <div className="flex items-center justify-between border-t border-white/5 pt-2.5">
                  <span className="text-slate-400">Số tiền cần thanh toán:</span>
                  <div className="flex items-center gap-2">
                    <b className="font-mono text-base font-black text-lime-300">
                      {order.total.toLocaleString('vi-VN')}đ
                    </b>
                    <button
                      onClick={() => handleCopy(order.total, 'Số tiền')}
                      className="rounded p-0.5 text-slate-400 hover:text-white transition cursor-pointer"
                    >
                      {copiedField === 'Số tiền' ? (
                        <Check size={14} className="text-lime-400" />
                      ) : (
                        <Copy size={14} />
                      )}
                    </button>
                  </div>
                </div>

                {/* Nội dung chuyển khoản */}
                <div className="flex items-center justify-between border-t border-white/5 pt-2.5">
                  <span className="text-slate-400 shrink-0 mr-3">
                    Nội dung CK <span className="text-rose-400">(bắt buộc)</span>:
                  </span>
                  <div className="flex items-center gap-2">
                    <b className="font-mono text-sm text-amber-300 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/30">
                      {transferContent}
                    </b>
                    <button
                      onClick={() => handleCopy(transferContent, 'Nội dung CK')}
                      className="rounded p-0.5 text-slate-400 hover:text-white transition cursor-pointer"
                    >
                      {copiedField === 'Nội dung CK' ? (
                        <Check size={14} className="text-lime-400" />
                      ) : (
                        <Copy size={14} />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* ⚡ Dev / Demo Simulation Button */}
              <button
                type="button"
                onClick={processPayment}
                disabled={checking}
                className="w-full flex items-center justify-center gap-2 rounded-xl border border-dashed border-amber-400/50 bg-amber-400/8 py-2.5 text-xs font-bold text-amber-300 hover:bg-amber-400/15 transition disabled:opacity-50 cursor-pointer"
              >
                {checking ? (
                  <>
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-amber-300 border-t-transparent" />
                    Đang đối soát giao dịch với {bankDisplay}...
                  </>
                ) : (
                  <>
                    <Zap size={14} />
                    ⚡ Sim Payment (Xác nhận chuyển khoản)
                  </>
                )}
              </button>
            </div>

            {/* Footer Buttons */}
            <div className="border-t border-white/10 bg-[#0B0E17] px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
              <a
                href={qrUrl}
                download={`VietQR-${bankCode}-${order.id}.png`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white transition cursor-pointer"
              >
                <Download size={14} /> Tải ảnh mã QR
              </a>

              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={checking ? undefined : onClose}
                  disabled={checking}
                  className="flex-1 sm:flex-none rounded-xl border border-white/10 px-4 py-3 text-xs font-bold text-white hover:bg-white/10 transition disabled:opacity-40 cursor-pointer"
                >
                  Đóng
                </button>

                <button
                  type="button"
                  onClick={processPayment}
                  disabled={checking}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 rounded-xl bg-lime-400 px-6 py-3 text-xs font-black uppercase text-slate-950 hover:bg-lime-300 transition shadow-lg shadow-lime-400/20 disabled:opacity-80 cursor-pointer"
                >
                  {checking ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-950 border-t-transparent" />
                      <span>Đang đối soát giao dịch với {bankDisplay}...</span>
                    </>
                  ) : (
                    <>
                      <Check size={15} />
                      Tôi đã chuyển khoản
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
