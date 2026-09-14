import { useState } from 'react'
import { Link } from 'react-router-dom'
import { products as seedProducts, categories as seedCategories } from '../../data'
import { Icon } from '../../components/Icon'
import type { Product } from '../../types'

/* ==========================================================================
   STAT CARD COMPONENT
   ========================================================================== */
interface AdminStatProps {
  label: string
  value: string
  change: string
  icon: 'chart' | 'orders' | 'box' | 'user'
}

function AdminStat({ label, value, change, icon }: AdminStatProps) {
  return (
    <div className="admin-stat">
      <div className="stat-icon">
        <Icon name={icon} size={19} />
      </div>
      <span>{label}</span>
      <strong>{value}</strong>
      <small className="stat-change">↗ {change}</small>
    </div>
  )
}

/* ==========================================================================
   TABLE CONTAINER SCAFFOLDING
   ========================================================================== */
interface AdminTableProps {
  title: string
  eyebrow: string
  action: string
  onAction: () => void
  children: React.ReactNode
}

function AdminTable({
  title,
  eyebrow,
  action,
  onAction,
  children,
}: AdminTableProps) {
  return (
    <section className="admin-table-page">
      <div className="admin-page-heading">
        <div>
          <span className="eyebrow">{eyebrow}</span>
          <h2>{title}</h2>
          <p>Quản lý và theo dõi dữ liệu Striker.</p>
        </div>
        <button className="button button-dark" onClick={onAction}>
          {action}
        </button>
      </div>
      <div className="admin-panel table-panel">{children}</div>
    </section>
  )
}

/* ==========================================================================
   DASHBOARD OVERVIEW
   ========================================================================== */
export function Dashboard() {
  return (
    <>
      <div className="admin-welcome">
        <div>
          <span className="eyebrow">SUNDAY, 06 SEPTEMBER 2026</span>
          <h2>
            Chào buổi sáng, Admin <span>✦</span>
          </h2>
          <p>Đây là những gì đang xảy ra với Striker hôm nay.</p>
        </div>
        <button className="button button-dark">+ Tạo báo cáo</button>
      </div>

      <div className="admin-stat-grid">
        <AdminStat
          label="Tổng doanh thu"
          value="₫184.6M"
          change="12.8% so với tháng trước"
          icon="chart"
        />
        <AdminStat
          label="Tổng đơn hàng"
          value="1,284"
          change="8.4% so với tháng trước"
          icon="orders"
        />
        <AdminStat
          label="Sản phẩm"
          value="248"
          change="16 sản phẩm mới"
          icon="box"
        />
        <AdminStat
          label="Người dùng"
          value="8,492"
          change="18.2% so với tháng trước"
          icon="user"
        />
      </div>

      <div className="admin-dashboard-grid">
        {/* Doanh thu */}
        <section className="admin-panel chart-panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">REVENUE OVERVIEW</span>
              <h3>Doanh thu</h3>
            </div>
            <select>
              <option>6 tháng qua</option>
              <option>Năm nay</option>
            </select>
          </div>
          <div className="chart-value">
            <strong>₫184.6M</strong>
            <span>↗ 12.8%</span>
          </div>
          <div className="fake-chart">
            <div className="chart-line" />
            <div className="chart-grid-lines">
              <span />
              <span />
              <span />
              <span />
            </div>
            <div className="chart-labels">
              <small>Apr</small>
              <small>May</small>
              <small>Jun</small>
              <small>Jul</small>
              <small>Aug</small>
              <small>Sep</small>
            </div>
          </div>
        </section>

        {/* Đơn hàng mới nhất */}
        <section className="admin-panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">RECENT ORDERS</span>
              <h3>Đơn hàng mới nhất</h3>
            </div>
            <Link to="/admin/orders" className="text-link">
              Xem tất cả <Icon name="arrow" size={15} />
            </Link>
          </div>
          {seedProducts.slice(0, 4).map((product, index) => (
            <div className="mini-order" key={product.id}>
              <span className="mini-order-mark">
                {String(index + 1).padStart(2, '0')}
              </span>
              <div>
                <strong>STR-26090{index + 1}-0{index + 3}</strong>
                <small>{product.name}</small>
              </div>
              <b>{(product.price / 1000).toLocaleString('vi-VN')}K</b>
              <span className="status status-paid">
                <i />
                Paid
              </span>
            </div>
          ))}
        </section>
      </div>
    </>
  )
}

export const Admin = Dashboard
export default Dashboard

/* ==========================================================================
   PRODUCT MANAGEMENT
   ========================================================================== */
function ProductModal({
  onClose,
  onSave,
}: {
  onClose: () => void
  onSave: (product: Product) => void
}) {
  const [name, setName] = useState('')

  return (
    <div className="modal-backdrop">
      <div className="form-modal">
        <button className="modal-close" onClick={onClose}>
          ×
        </button>
        <span className="eyebrow">NEW PRODUCT</span>
        <h2>Thêm sản phẩm</h2>

        <label>
          Tên sản phẩm
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Tên sản phẩm"
          />
        </label>

        <label>
          Thương hiệu
          <input placeholder="Nike, Adidas..." />
        </label>

        <div className="form-grid">
          <label>
            Giá
            <input type="number" placeholder="0" />
          </label>
          <label>
            Tồn kho
            <input type="number" placeholder="0" />
          </label>
        </div>

        <button
          className="button button-dark full"
          onClick={() =>
            onSave({
              ...seedProducts[0],
              id: Date.now(),
              name: name || 'New Striker Product',
            })
          }
        >
          Lưu sản phẩm <Icon name="arrow" size={16} />
        </button>
      </div>
    </div>
  )
}

export function AdminProducts() {
  const [query, setQuery] = useState('')
  const [items, setItems] = useState(seedProducts)
  const [modal, setModal] = useState(false)

  const filtered = items.filter(
    (item) =>
      item.name.toLowerCase().includes(query.toLowerCase()) ||
      item.brand.toLowerCase().includes(query.toLowerCase())
  )

  return (
    <AdminTable
      title="Quản lý sản phẩm"
      eyebrow="PRODUCT CATALOG"
      action="+ Thêm sản phẩm"
      onAction={() => setModal(true)}
    >
      <div className="table-toolbar">
        <div className="search-field">
          <Icon name="search" size={17} />
          <input
            placeholder="Tìm sản phẩm..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <span>{filtered.length} sản phẩm</span>
      </div>

      <div className="data-table">
        <div className="table-head">
          <span>Sản phẩm</span>
          <span>Danh mục</span>
          <span>Giá</span>
          <span>Tồn kho</span>
          <span>Trạng thái</span>
          <span />
        </div>
        {filtered.map((item) => (
          <div className="table-row" key={item.id}>
            <div className="table-product">
              <img src={item.image} alt="" />
              <div>
                <strong>{item.name}</strong>
                <small>
                  {item.brand} · SKU-{item.id}01
                </small>
              </div>
            </div>
            <span>{item.category}</span>
            <b>{item.price.toLocaleString('vi-VN')}đ</b>
            <span>{item.stock}</span>
            <span className="status status-paid">
              <i />
              Đang bán
            </span>
            <button className="row-more">•••</button>
          </div>
        ))}
      </div>

      {modal && (
        <ProductModal
          onClose={() => setModal(false)}
          onSave={(item) => {
            setItems((current) => [item, ...current])
            setModal(false)
          }}
        />
      )}
    </AdminTable>
  )
}

/* ==========================================================================
   CATEGORY MANAGEMENT
   ========================================================================== */
export function AdminCategories() {
  const [modal, setModal] = useState(false)

  return (
    <AdminTable
      title="Quản lý danh mục"
      eyebrow="CATEGORIES"
      action="+ Thêm danh mục"
      onAction={() => setModal(true)}
    >
      <div className="category-admin-list">
        {seedCategories.slice(1).map((category, index) => (
          <div className="category-admin-row" key={category}>
            <div className="category-number">0{index + 1}</div>
            <div>
              <strong>{category}</strong>
              <small>
                {seedProducts.filter((item) => item.category === category).length +
                  12}{' '}
                sản phẩm
              </small>
            </div>
            <span className="status status-paid">
              <i />
              Active
            </span>
            <button className="row-more">•••</button>
          </div>
        ))}
      </div>

      {modal && (
        <div className="modal-backdrop">
          <div className="form-modal">
            <button className="modal-close" onClick={() => setModal(false)}>
              ×
            </button>
            <span className="eyebrow">NEW CATEGORY</span>
            <h2>Thêm danh mục</h2>
            <label>
              Tên danh mục
              <input placeholder="Ví dụ: Phụ kiện thủ môn" />
            </label>
            <label>
              Mô tả
              <textarea placeholder="Mô tả danh mục" />
            </label>
            <button
              className="button button-dark full"
              onClick={() => setModal(false)}
            >
              Lưu danh mục
            </button>
          </div>
        </div>
      )}
    </AdminTable>
  )
}

/* ==========================================================================
   ORDER MANAGEMENT
   ========================================================================== */
export function AdminOrders() {
  return (
    <AdminTable
      title="Quản lý đơn hàng"
      eyebrow="ORDER MANAGEMENT"
      action="Xuất báo cáo"
      onAction={() => undefined}
    >
      <div className="table-toolbar">
        <div className="search-field">
          <Icon name="search" size={17} />
          <input placeholder="Tìm mã đơn hàng..." />
        </div>
        <select>
          <option>Tất cả trạng thái</option>
          <option>Đã thanh toán</option>
          <option>Đang xử lý</option>
        </select>
      </div>

      <div className="data-table">
        <div className="table-head">
          <span>Mã đơn hàng</span>
          <span>Khách hàng</span>
          <span>Ngày đặt</span>
          <span>Tổng tiền</span>
          <span>Trạng thái</span>
          <span />
        </div>
        {[
          'STR-260905-003',
          'STR-260905-002',
          'STR-260904-018',
          'STR-260904-017',
        ].map((id, index) => (
          <div className="table-row" key={id}>
            <div className="table-product">
              <div className="order-square">{index + 1}</div>
              <div>
                <strong>{id}</strong>
                <small>{index + 1} sản phẩm</small>
              </div>
            </div>
            <span>
              {['Minh Anh', 'Alex Morgan', 'Huy Tran', 'Linh Pham'][index]}
            </span>
            <span>05/09/2026</span>
            <b>
              {[4290000, 2460000, 1190000, 690000][index].toLocaleString(
                'vi-VN'
              )}
              đ
            </b>
            <span
              className={`status ${index === 2 ? 'status-pending' : 'status-paid'
                }`}
            >
              <i />
              {index === 2 ? 'Pending' : 'Paid'}
            </span>
            <button className="row-more">•••</button>
          </div>
        ))}
      </div>
    </AdminTable>
  )
}

/* ==========================================================================
   COUPON MANAGEMENT
   ========================================================================== */
export function AdminCoupons() {
  const [query, setQuery] = useState('')
  const [modal, setModal] = useState(false)
  const [coupons] = useState([
    {
      id: 1,
      code: 'STRIKER100K',
      type: 'Giảm cố định',
      value: '100.000đ',
      used: '45/100',
      status: 'Hoạt động',
    },
    {
      id: 2,
      code: 'WELCOME10',
      type: 'Giảm phần trăm',
      value: '10%',
      used: '128/200',
      status: 'Hoạt động',
    },
    {
      id: 3,
      code: 'FREESHIP2026',
      type: 'Miễn phí vận chuyển',
      value: '30.000đ',
      used: '200/200',
      status: 'Hết lượt',
    },
  ])

  const filtered = coupons.filter((c) =>
    c.code.toLowerCase().includes(query.toLowerCase())
  )

  return (
    <AdminTable
      title="Quản lý phiếu giảm giá"
      eyebrow="COUPONS & DISCOUNTS"
      action="+ Thêm mã mới"
      onAction={() => setModal(true)}
    >
      <div className="table-toolbar">
        <div className="search-field">
          <Icon name="search" size={17} />
          <input
            placeholder="Tìm mã giảm giá..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <span>{filtered.length} mã giảm giá</span>
      </div>

      <div className="data-table">
        <div className="table-head">
          <span>Mã Voucher</span>
          <span>Loại giảm</span>
          <span>Giá trị</span>
          <span>Lượt sử dụng</span>
          <span>Trạng thái</span>
          <span />
        </div>
        {filtered.map((item) => (
          <div className="table-row" key={item.id}>
            <div className="table-product">
              <div className="order-square">%</div>
              <div>
                <strong>{item.code}</strong>
                <small>Mã ưu đãi hệ thống</small>
              </div>
            </div>
            <span>{item.type}</span>
            <b>{item.value}</b>
            <span>{item.used}</span>
            <span
              className={`status ${item.status === 'Hoạt động' ? 'status-paid' : 'status-pending'
                }`}
            >
              <i />
              {item.status}
            </span>
            <button className="row-more">•••</button>
          </div>
        ))}
      </div>

      {modal && (
        <div className="modal-backdrop">
          <div className="form-modal">
            <button className="modal-close" onClick={() => setModal(false)}>
              ×
            </button>
            <span className="eyebrow">NEW COUPON</span>
            <h2>Thêm mã giảm giá</h2>
            <label>
              Mã giảm giá
              <input placeholder="Ví dụ: STRIKER50K" />
            </label>
            <div className="form-grid">
              <label>
                Giá trị giảm
                <input placeholder="100000 hoặc 10%" />
              </label>
              <label>
                Số lượng phát hành
                <input type="number" placeholder="100" />
              </label>
            </div>
            <button
              className="button button-dark full"
              onClick={() => setModal(false)}
            >
              Lưu mã giảm giá <Icon name="arrow" size={16} />
            </button>
          </div>
        </div>
      )}
    </AdminTable>
  )
}

/* ==========================================================================
   USER MANAGEMENT
   ========================================================================== */
export function AdminUsers() {
  const [query, setQuery] = useState('')
  const [modal, setModal] = useState(false)
  const [users] = useState([
    {
      id: 1,
      name: 'Quản Trị Viên',
      email: 'admin@gmail.com',
      phone: '0988888888',
      role: 'Admin',
      status: 'Hoạt động',
    },
    {
      id: 2,
      name: 'Khách Hàng Mẫu',
      email: 'customer@gmail.com',
      phone: '0977777777',
      role: 'User',
      status: 'Hoạt động',
    },
    {
      id: 3,
      name: 'Minh Anh',
      email: 'minhanh@gmail.com',
      phone: '0912345678',
      role: 'User',
      status: 'Hoạt động',
    },
  ])

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(query.toLowerCase()) ||
      u.email.toLowerCase().includes(query.toLowerCase())
  )

  return (
    <AdminTable
      title="Quản lý người dùng"
      eyebrow="USER MANAGEMENT"
      action="+ Thêm người dùng"
      onAction={() => setModal(true)}
    >
      <div className="table-toolbar">
        <div className="search-field">
          <Icon name="search" size={17} />
          <input
            placeholder="Tìm tên, email..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <span>{filtered.length} tài khoản</span>
      </div>

      <div className="data-table">
        <div className="table-head">
          <span>Người dùng</span>
          <span>Số điện thoại</span>
          <span>Vai trò</span>
          <span>Trạng thái</span>
          <span />
        </div>
        {filtered.map((user) => (
          <div className="table-row" key={user.id}>
            <div className="table-product">
              <div className="order-square">{user.name.charAt(0)}</div>
              <div>
                <strong>{user.name}</strong>
                <small>{user.email}</small>
              </div>
            </div>
            <span>{user.phone}</span>
            <b>{user.role}</b>
            <span className="status status-paid">
              <i />
              {user.status}
            </span>
            <button className="row-more">•••</button>
          </div>
        ))}
      </div>

      {modal && (
        <div className="modal-backdrop">
          <div className="form-modal">
            <button className="modal-close" onClick={() => setModal(false)}>
              ×
            </button>
            <span className="eyebrow">NEW USER</span>
            <h2>Thêm người dùng</h2>
            <label>
              Họ và tên
              <input placeholder="Nguyễn Văn A" />
            </label>
            <label>
              Email
              <input type="email" placeholder="user@gmail.com" />
            </label>
            <div className="form-grid">
              <label>
                Số điện thoại
                <input placeholder="0901234567" />
              </label>
              <label>
                Mật khẩu
                <input type="password" placeholder="123456789" />
              </label>
            </div>
            <button
              className="button button-dark full"
              onClick={() => setModal(false)}
            >
              Lưu tài khoản <Icon name="arrow" size={16} />
            </button>
          </div>
        </div>
      )}
    </AdminTable>
  )
}