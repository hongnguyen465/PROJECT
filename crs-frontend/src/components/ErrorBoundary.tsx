import { Component, type ErrorInfo, type ReactNode } from 'react'

//Thành phần bắt lỗi ứng dụng khi React gặp sự cố.
export class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Frontend rendering error:', error, info)
  }

  render() {
    if (!this.state.hasError) return this.props.children
    return <main className="error-screen">
      <span className="eyebrow">STRIKER / RECOVERY</span>
      <h1>Đang kết nối lại <em>server.</em></h1>
      <p>Trang vừa gặp lỗi tạm thời. Vui lòng thử lại sau giây lát.</p>
      <button className="button button-dark" onClick={() => window.location.reload()}>Tải lại trang</button></main>
  }
}
