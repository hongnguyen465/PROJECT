import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Check,
  KeyRound,
  Lock,
  Mail,
  MapPin,
  Phone,
  Plus,
  Save,
  ShieldCheck,
  Trash2,
  User as UserIcon,
} from 'lucide-react'
import { toast } from 'sonner'
import { useApp } from '../../context/AppContext'
import { AddressBookModal } from '../../components/AddressBookModal'

export function Profile() {
  const { user, updateUserProfile, deleteAddress, setDefaultAddress } = useApp()

  const [activeTab, setActiveTab] = useState<'info' | 'addresses' | 'password'>('info')

  // Personal Info Form
  const [name, setName] = useState(user?.name ?? '')
  const [phone, setPhone] = useState(user?.phone ?? '')
  const [email, setEmail] = useState(user?.email ?? '')

  // Password Change Form
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [savingPassword, setSavingPassword] = useState(false)

  // Address Modal
  const [addressModalOpen, setAddressModalOpen] = useState(false)

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.error('Họ và tên không được để trống!')
      return
    }
    updateUserProfile({
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim(),
    })
  }

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentPassword) {
      toast.error('Vui lòng nhập mật khẩu hiện tại!')
      return
    }
    if (newPassword.length < 6) {
      toast.error('Mật khẩu mới phải có ít nhất 6 ký tự!')
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error('Xác nhận mật khẩu mới không trùng khớp!')
      return
    }

    setSavingPassword(true)
    setTimeout(() => {
      setSavingPassword(false)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      toast.success('Đổi mật khẩu thành công! 🔐', {
        description: 'Tài khoản của bạn đã được cập nhật mật khẩu mới.',
      })
    }, 600)
  }

  const addresses = user?.addresses || []

  return (
    <section className="min-h-screen bg-[#0B0E17] px-5 py-10 text-white lg:px-8">
      <div className="mx-auto max-w-4xl">
        {/* Header Profile Info */}
        <div className="flex flex-col sm:flex-row items-center gap-6 rounded-3xl border border-white/10 bg-[#131823] p-6 sm:p-8 backdrop-blur-md shadow-2xl">
          <div className="relative">
            <div className="grid h-24 w-24 place-items-center rounded-3xl bg-gradient-to-tr from-lime-400 to-emerald-500 font-mono text-3xl font-black text-slate-950 shadow-xl shadow-lime-400/20">
              {user?.name ? user.name.slice(0, 1).toUpperCase() : 'U'}
            </div>
            <span className="absolute -bottom-1 -right-1 grid h-7 w-7 place-items-center rounded-xl bg-lime-400 text-slate-950 font-bold text-xs border-2 border-slate-900">
              ✓
            </span>
          </div>

          <div className="text-center sm:text-left space-y-1.5 flex-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h1 className="text-2xl font-black text-white">{user?.name || 'Tài khoản thành viên'}</h1>
              <span className="rounded-full bg-lime-400/10 border border-lime-400/30 px-3 py-0.5 text-xs font-bold text-lime-400">
                {user?.role === 'admin' ? 'Quản trị viên' : 'Thành viên Striker Club'}
              </span>
            </div>
            <p className="text-xs text-slate-400">{user?.email || 'Chưa cập nhật email'}</p>
            <p className="text-xs font-mono text-slate-500">
              Mã thành viên: <span className="text-slate-300 font-bold">STRIKER-{(user?.id ?? '001')}</span>
            </p>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="mt-8 flex border-b border-white/10 gap-8 overflow-x-auto pb-1 scrollbar-none">
          {[
            { key: 'info', label: 'Thông tin cá nhân' },
            {
              key: 'addresses',
              label: `Sổ địa chỉ (${addresses.length})`,
            },
            { key: 'password', label: 'Đổi mật khẩu' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as typeof activeTab)}
              className={`pb-4 text-sm font-bold transition relative shrink-0 cursor-pointer ${
                activeTab === tab.key
                  ? 'text-lime-300'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab.label}
              {activeTab === tab.key && (
                <motion.div
                  layoutId="activeProfileTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-lime-400"
                />
              )}
            </button>
          ))}
        </div>

        {/* Tab 1: Info Form */}
        {activeTab === 'info' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 max-w-xl rounded-3xl border border-white/10 bg-[#131823] p-6 sm:p-8 backdrop-blur-md"
          >
            <div className="border-b border-white/10 pb-4 mb-6">
              <h2 className="text-lg font-black text-white">Hồ sơ cá nhân</h2>
              <p className="text-xs text-slate-400">
                Cập nhật thông tin liên hệ và số điện thoại nhận thông báo đơn hàng
              </p>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">
                  Họ và tên <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <UserIcon
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
                  />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ví dụ: Nguyễn Văn A"
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/80 py-3 pl-10 pr-4 text-xs text-left text-white outline-none placeholder:text-slate-500 focus:border-lime-400"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">
                  Địa chỉ Email (Dùng để đăng nhập)
                </label>
                <div className="relative">
                  <Mail
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
                  />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/80 py-3 pl-10 pr-4 text-xs text-left text-white outline-none placeholder:text-slate-500 focus:border-lime-400"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">
                  Số điện thoại di động
                </label>
                <div className="relative">
                  <Phone
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
                  />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Ví dụ: 0901234567"
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/80 py-3 pl-10 pr-4 text-xs text-left text-white outline-none placeholder:text-slate-500 focus:border-lime-400"
                  />
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  className="flex items-center gap-2 rounded-2xl bg-lime-400 px-6 py-3.5 text-xs font-black uppercase text-slate-950 hover:bg-lime-300 transition shadow-lg shadow-lime-400/20 cursor-pointer"
                >
                  <Save size={16} /> Lưu thay đổi
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {/* Tab 2: Addresses */}
        {activeTab === 'addresses' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 space-y-6"
          >
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-black text-white">Sổ địa chỉ nhận hàng</h2>
                <p className="text-xs text-slate-400">
                  Quản lý danh sách địa chỉ giao hàng chuẩn GHN Express để thanh toán nhanh hơn
                </p>
              </div>

              <button
                onClick={() => setAddressModalOpen(true)}
                className="flex items-center gap-2 rounded-2xl bg-lime-400 px-5 py-3 text-xs font-black text-slate-950 hover:bg-lime-300 transition shadow-md cursor-pointer"
              >
                <Plus size={16} /> Thêm địa chỉ mới
              </button>
            </div>

            {addresses.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {addresses.map((addr) => (
                  <div
                    key={addr.id}
                    className={`relative rounded-3xl border p-5 transition backdrop-blur-sm ${
                      addr.isDefault
                        ? 'border-lime-400/60 bg-lime-400/5'
                        : 'border-white/10 bg-[#131823]'
                    }`}
                  >
                    {addr.isDefault && (
                      <span className="absolute right-5 top-5 rounded-full bg-lime-400/20 border border-lime-400/40 px-2.5 py-0.5 text-[10px] font-bold text-lime-300">
                        Địa chỉ mặc định
                      </span>
                    )}

                    <div className="space-y-2 pr-16">
                      <b className="text-sm text-white block">{addr.fullName}</b>
                      <p className="text-xs text-slate-400 flex items-center gap-1.5">
                        <Phone size={13} /> {addr.phone}
                      </p>
                      <p className="text-xs text-slate-300 leading-relaxed flex items-start gap-1.5">
                        <MapPin size={14} className="shrink-0 text-lime-400 mt-0.5" />
                        <span>
                          {addr.street}, {addr.ward}, {addr.district}, {addr.province}
                        </span>
                      </p>
                    </div>

                    <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-3 text-xs">
                      {!addr.isDefault ? (
                        <button
                          onClick={() => setDefaultAddress(addr.id)}
                          className="font-bold text-lime-300 hover:underline cursor-pointer"
                        >
                          Đặt làm mặc định
                        </button>
                      ) : (
                        <span className="text-slate-500 font-semibold text-[11px]">
                          Đang dùng cho đơn hàng
                        </span>
                      )}

                      <button
                        onClick={() => deleteAddress(addr.id)}
                        className="flex items-center gap-1 text-slate-400 hover:text-rose-400 transition cursor-pointer"
                      >
                        <Trash2 size={13} /> Xóa
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-3xl border border-dashed border-white/15 bg-white/[0.02] p-8 text-center">
                <p className="text-xs text-slate-400">Bạn chưa lưu địa chỉ giao hàng nào.</p>
                <button
                  type="button"
                  onClick={() => setAddressModalOpen(true)}
                  className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-lime-400 hover:underline cursor-pointer"
                >
                  <Plus size={14} /> Thêm địa chỉ nhận hàng đầu tiên
                </button>
              </div>
            )}
          </motion.div>
        )}

        {/* Tab 3: Password */}
        {activeTab === 'password' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 max-w-xl rounded-3xl border border-white/10 bg-[#131823] p-6 sm:p-8 backdrop-blur-md"
          >
            <div className="border-b border-white/10 pb-4 mb-6">
              <h2 className="text-lg font-black text-white">Đổi mật khẩu tài khoản</h2>
              <p className="text-xs text-slate-400">
                Để bảo vệ an toàn, vui lòng không chia sẻ mật khẩu cho người khác
              </p>
            </div>

            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">
                  Mật khẩu hiện tại <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <Lock
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
                  />
                  <input
                    type="password"
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/80 py-3 pl-10 pr-4 text-xs text-left text-white outline-none focus:border-lime-400"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">
                  Mật khẩu mới <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <KeyRound
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
                  />
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Tối thiểu 6 ký tự"
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/80 py-3 pl-10 pr-4 text-xs text-left text-white outline-none focus:border-lime-400"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">
                  Xác nhận mật khẩu mới <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <ShieldCheck
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
                  />
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Nhập lại mật khẩu mới"
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/80 py-3 pl-10 pr-4 text-xs text-left text-white outline-none focus:border-lime-400"
                  />
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={savingPassword}
                  className="flex items-center gap-2 rounded-2xl bg-lime-400 px-6 py-3.5 text-xs font-black uppercase text-slate-950 hover:bg-lime-300 transition shadow-lg shadow-lime-400/20 cursor-pointer"
                >
                  {savingPassword ? (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-950 border-t-transparent" />
                  ) : (
                    <>
                      <Check size={16} /> Cập nhật mật khẩu
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </div>

      {/* Shared Address Book Modal with GHN Cascading */}
      <AddressBookModal
        isOpen={addressModalOpen}
        onClose={() => setAddressModalOpen(false)}
        onSelectAddress={() => {}}
      />
    </section>
  )
}
