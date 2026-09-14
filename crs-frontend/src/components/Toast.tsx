import { useApp } from '../context/AppContext'

//Thông báo ngắn xuất hiện ở góc màn hình (ví dụ: "Đã thêm vào giỏ hàng").
export function Toast() {
  const { toast } = useApp()
  if (!toast) return null
  return <div className="toast"><span className="toast-dot">✓</span>{toast}</div>
}
