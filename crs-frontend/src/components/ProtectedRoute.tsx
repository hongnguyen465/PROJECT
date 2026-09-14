import { useEffect } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useApp } from '../context/AppContext'

//Trình bảo vệ tuyến đường (chỉ cho phép truy cập khi đã đăng nhập).
export function ProtectedRoute({ children, adminOnly = false }: { children: React.ReactNode; adminOnly?: boolean }) {
  const { user, notify } = useApp()
  const location = useLocation()
  useEffect(() => {
    if (!user) notify(adminOnly ? 'Vui lòng đăng nhập để vào trang quản trị.' : 'Vui lòng đăng nhập để xem giỏ hàng/thanh toán.')
  }, [adminOnly, notify, user])
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }
  if (adminOnly && user.role !== 'admin') return <Navigate to="/" replace />
  return <>{children}</>
}
