import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  TrendingUp, 
  ShoppingBag, 
  Users, 
  Package, 
  Zap, 
  DollarSign, 
  Plus, 
  TicketPercent, 
  QrCode, 
  Sparkles, 
  Layers, 
  ArrowRight
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { products as seedProducts } from '../../data';
import { INITIAL_ADMIN_ORDERS, INITIAL_ADMIN_CUSTOMERS, SAMPLE_PRODUCT_IMAGES } from '../../data/adminMockData';
import type { Order, Product, Customer } from '../../types';

// Helper to safely parse order date strings
const parseOrderDate = (dateStr: string): Date => {
  if (!dateStr) return new Date();
  if (dateStr.includes('/')) {
    // format DD/MM/YYYY HH:mm or DD/MM/YYYY
    const parts = dateStr.split(' ')[0].split('/');
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const year = parseInt(parts[2], 10);
      const timePart = dateStr.split(' ')[1] || '00:00';
      const [hours, minutes] = timePart.split(':').map((v) => parseInt(v, 10) || 0);
      return new Date(year, month, day, hours, minutes);
    }
  }
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? new Date() : d;
};

export const Dashboard: React.FC = () => {
  const { orders: contextOrders } = useApp();
  const [timeRange, setTimeRange] = useState<'7days' | '30days' | '12months'>('7days');
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);

  // 1. Combine context orders with mock admin orders
  const orders: Order[] = useMemo(() => {
    const combined = [...(contextOrders || [])];
    INITIAL_ADMIN_ORDERS.forEach((initialOrder) => {
      if (!combined.some((o) => o.id === initialOrder.id)) {
        combined.push(initialOrder);
      }
    });
    return combined;
  }, [contextOrders]);

  // 2. Load products from localStorage or fallback
  const productsList: Product[] = useMemo(() => {
    const stored = localStorage.getItem('crs_admin_products');
    if (!stored) return seedProducts;
    try {
      return JSON.parse(stored) as Product[];
    } catch {
      return seedProducts;
    }
  }, []);

  // 3. Load customers from localStorage or fallback
  const customersList: Customer[] = useMemo(() => {
    const stored = localStorage.getItem('crs_admin_customers');
    if (!stored) return INITIAL_ADMIN_CUSTOMERS;
    try {
      return JSON.parse(stored) as Customer[];
    } catch {
      return INITIAL_ADMIN_CUSTOMERS;
    }
  }, []);

  // 4. Dynamic KPI Calculations
  // Total Revenue: Sum of total for orders with status !== 'cancelled'
  const validOrders = useMemo(() => orders.filter((o) => o.status !== 'cancelled'), [orders]);
  const totalRevenue = useMemo(
    () => validOrders.reduce((sum, o) => sum + (o.total || 0), 0),
    [validOrders]
  );

  // Total Orders & Status Breakdowns
  const totalOrdersCount = orders.length;
  const pendingOrdersCount = useMemo(
    () => orders.filter((o) => o.status === 'pending').length,
    [orders]
  );
  const shippingOrdersCount = useMemo(
    () => orders.filter((o) => o.status === 'shipping').length,
    [orders]
  );
  const deliveredOrdersCount = useMemo(
    () => orders.filter((o) => o.status === 'delivered' || (o as any).status === 'paid').length,
    [orders]
  );
  const cancelledOrdersCount = useMemo(
    () => orders.filter((o) => o.status === 'cancelled').length,
    [orders]
  );

  // Total Customers: Accounts with role === 'user' (or active customer profiles)
  const totalCustomersCount = useMemo(() => {
    return customersList.filter((c) => (c as any).role !== 'admin' && c.status !== 'blocked').length;
  }, [customersList]);

  // Products & Total Inventory
  const totalSkuCount = productsList.length;
  const totalStockCount = useMemo(
    () => productsList.reduce((sum, p) => sum + (p.stock || 0), 0),
    [productsList]
  );
  const lowStockCount = useMemo(
    () => productsList.filter((p) => (p.stock || 0) > 0 && (p.stock || 0) < 10).length,
    [productsList]
  );

  // 5. Dynamic Neon Chart Dataset grouped by timeRange from real orders
  const chartData = useMemo(() => {
    if (timeRange === '7days') {
      let baseDate = new Date();
      if (orders.length > 0) {
        const dates = orders.map((o) => parseOrderDate(o.date).getTime()).filter((t) => !isNaN(t));
        if (dates.length > 0) {
          baseDate = new Date(Math.max(...dates));
        }
      }

      const days: { label: string; dateStr: string; revenue: number; orders: number }[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(baseDate);
        d.setDate(d.getDate() - i);
        const dayNum = String(d.getDate()).padStart(2, '0');
        const monthNum = String(d.getMonth() + 1).padStart(2, '0');
        const dayOfWeek = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][d.getDay()];
        const label = `${dayOfWeek} (${dayNum}/${monthNum})`;
        const dateKey = `${dayNum}/${monthNum}`;

        let dayRevenue = 0;
        let dayOrderCount = 0;

        validOrders.forEach((o) => {
          const od = parseOrderDate(o.date);
          if (
            od.getDate() === d.getDate() &&
            od.getMonth() === d.getMonth() &&
            od.getFullYear() === d.getFullYear()
          ) {
            dayRevenue += o.total || 0;
            dayOrderCount += 1;
          }
        });

        days.push({ label, dateStr: dateKey, revenue: dayRevenue, orders: dayOrderCount });
      }
      return days;
    } else if (timeRange === '30days') {
      const weeks = [
        { label: 'Tuần 1 (1-7)', startDay: 1, endDay: 7, revenue: 0, orders: 0 },
        { label: 'Tuần 2 (8-14)', startDay: 8, endDay: 14, revenue: 0, orders: 0 },
        { label: 'Tuần 3 (15-21)', startDay: 15, endDay: 21, revenue: 0, orders: 0 },
        { label: 'Tuần 4 (22-31)', startDay: 22, endDay: 31, revenue: 0, orders: 0 },
      ];
      validOrders.forEach((o) => {
        const od = parseOrderDate(o.date);
        const d = od.getDate();
        for (const w of weeks) {
          if (d >= w.startDay && d <= w.endDay) {
            w.revenue += o.total || 0;
            w.orders += 1;
            break;
          }
        }
      });
      return weeks;
    } else {
      const months = Array.from({ length: 12 }, (_, idx) => ({
        label: `T${idx + 1}`,
        revenue: 0,
        orders: 0,
      }));
      validOrders.forEach((o) => {
        const od = parseOrderDate(o.date);
        const m = od.getMonth();
        if (m >= 0 && m < 12) {
          months[m].revenue += o.total || 0;
          months[m].orders += 1;
        }
      });
      return months;
    }
  }, [timeRange, orders, validOrders]);

  const maxRevenue = useMemo(() => {
    const max = Math.max(...chartData.map((d) => d.revenue));
    return max > 0 ? max : 10000000;
  }, [chartData]);

  // 6. Recent Orders: Top 5-10 orders sorted by date descending
  const recentOrders = useMemo(() => {
    return [...orders]
      .sort((a, b) => parseOrderDate(b.date).getTime() - parseOrderDate(a.date).getTime())
      .slice(0, 6);
  }, [orders]);

  // 7. Top Selling Products: Aggregated from itemsList of non-cancelled orders
  const topSellingProducts = useMemo(() => {
    const salesMap = new Map<number | string, { unitsSold: number; revenue: number; item: any }>();

    validOrders.forEach((order) => {
      order.itemsList?.forEach((item) => {
        const key = item.id || item.name;
        const existing = salesMap.get(key);
        const qty = item.quantity || 1;
        const rev = (item.price || 0) * qty;
        if (existing) {
          existing.unitsSold += qty;
          existing.revenue += rev;
        } else {
          salesMap.set(key, {
            unitsSold: qty,
            revenue: rev,
            item,
          });
        }
      });
    });

    const sorted = Array.from(salesMap.values()).sort((a, b) => b.unitsSold - a.unitsSold);

    if (sorted.length > 0) {
      return sorted.slice(0, 4).map(({ unitsSold, revenue, item }, idx) => {
        const catalogProd = productsList.find((p) => p.id === item.id) || item;
        return {
          id: item.id || idx,
          name: catalogProd.name || item.name,
          image: catalogProd.image || item.image || SAMPLE_PRODUCT_IMAGES[0],
          price: catalogProd.price || item.price || 0,
          unitsSold,
          revenueTotal: revenue,
          growth: `+${Math.max(6, 28 - idx * 5)}%`,
        };
      });
    }

    // Fallback to top products from catalog
    return productsList.slice(0, 4).map((p, idx) => ({
      id: p.id,
      name: p.name,
      image: p.image,
      price: p.price,
      unitsSold: Math.max(10, 80 - idx * 18),
      revenueTotal: p.price * Math.max(10, 80 - idx * 18),
      growth: `+${20 - idx * 4}%`,
    }));
  }, [validOrders, productsList]);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* 1. Page Header & Live Greeting */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-zinc-900/60 backdrop-blur-xl border border-zinc-800/80 p-6 rounded-3xl shadow-2xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-full bg-gradient-to-l from-lime-500/10 to-transparent pointer-events-none" />
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-lime-400 font-semibold uppercase tracking-widest">
            <Zap className="w-3.5 h-3.5 fill-lime-400" />
            <span>STRIKER COMMAND CENTER • REALTIME METRICS</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white mt-1 uppercase tracking-tight flex items-center gap-2">
            Bảng Điều Khiển Tổng Quan
            <span className="text-lime-400">.</span>
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Tổng hợp dữ liệu kinh doanh, hiệu suất bán lẻ và lưu lượng giao dịch thời gian thực.
          </p>
        </div>

        {/* Quick Top Actions */}
        <div className="flex flex-wrap items-center gap-3">
          <Link
            to="/admin/products"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-lime-400 text-zinc-950 font-bold text-xs uppercase tracking-wider hover:bg-lime-300 shadow-lg shadow-lime-400/20 hover:scale-105 transition-all"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Thêm sản phẩm</span>
          </Link>
          <Link
            to="/admin/vouchers"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-800/80 hover:bg-zinc-800 border border-zinc-700 text-xs font-bold text-white hover:border-lime-500/50 transition-all"
          >
            <TicketPercent className="w-4 h-4 text-lime-400" />
            <span>Tạo Voucher</span>
          </Link>
          <Link
            to="/admin/settings"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-800/80 hover:bg-zinc-800 border border-zinc-700 text-xs font-bold text-white hover:border-lime-500/50 transition-all"
          >
            <QrCode className="w-4 h-4 text-emerald-400" />
            <span>VietQR Shop</span>
          </Link>
        </div>
      </div>

      {/* 2. 4 Cyber-Sport Dynamic KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* KPI 1: Doanh Thu */}
        <div className="group relative bg-zinc-900/60 backdrop-blur-xl border border-zinc-800/80 hover:border-lime-500/50 p-6 rounded-2xl shadow-xl transition-all duration-300 overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-lime-400/5 rounded-full blur-2xl group-hover:bg-lime-400/10 transition-all" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Tổng Doanh Thu</span>
            <div className="w-10 h-10 rounded-xl bg-lime-400/10 border border-lime-400/30 flex items-center justify-center text-lime-400">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-white">
              {totalRevenue.toLocaleString('vi-VN')}₫
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span className="inline-flex items-center gap-1 text-xs font-mono font-bold text-lime-400 bg-lime-400/10 px-2 py-0.5 rounded border border-lime-400/20">
                <TrendingUp className="w-3 h-3" /> +14.2%
              </span>
              <span className="text-[11px] text-zinc-400">Doanh thu hợp lệ</span>
            </div>
          </div>
          {/* Mini Sparkline SVG */}
          <div className="mt-4 pt-3 border-t border-zinc-800/60">
            <svg className="w-full h-8 overflow-visible" viewBox="0 0 100 25">
              <path
                d="M0,20 Q15,8 30,16 T60,5 T80,12 T100,2"
                fill="none"
                stroke="#a3e635"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <path
                d="M0,20 Q15,8 30,16 T60,5 T80,12 T100,2 L100,25 L0,25 Z"
                fill="url(#limeGradient)"
                opacity="0.3"
              />
              <defs>
                <linearGradient id="limeGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#a3e635" />
                  <stop offset="100%" stopColor="transparent" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>

        {/* KPI 2: Tổng Đơn Hàng */}
        <div className="group relative bg-zinc-900/60 backdrop-blur-xl border border-zinc-800/80 hover:border-sky-500/50 p-6 rounded-2xl shadow-xl transition-all duration-300 overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-sky-400/5 rounded-full blur-2xl group-hover:bg-sky-400/10 transition-all" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Tổng Đơn Hàng</span>
            <div className="w-10 h-10 rounded-xl bg-sky-400/10 border border-sky-400/30 flex items-center justify-center text-sky-400">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-white">
              {totalOrdersCount} <span className="text-sm font-sans font-normal text-zinc-400">đơn</span>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span className="inline-flex items-center gap-1 text-[11px] font-mono text-zinc-300">
                <span className="text-amber-400 font-bold">{pendingOrdersCount}</span> chờ • 
                <span className="text-sky-400 font-bold"> {shippingOrdersCount}</span> giao • 
                <span className="text-emerald-400 font-bold"> {deliveredOrdersCount}</span> xong
                {cancelledOrdersCount > 0 && (
                  <span> • <span className="text-red-400 font-bold">{cancelledOrdersCount}</span> hủy</span>
                )}
              </span>
            </div>
          </div>
          {/* Mini Sparkline SVG */}
          <div className="mt-4 pt-3 border-t border-zinc-800/60">
            <svg className="w-full h-8 overflow-visible" viewBox="0 0 100 25">
              <path
                d="M0,18 Q20,12 40,20 T70,8 T100,4"
                fill="none"
                stroke="#38bdf8"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>

        {/* KPI 3: Khách Hàng */}
        <div className="group relative bg-zinc-900/60 backdrop-blur-xl border border-zinc-800/80 hover:border-purple-500/50 p-6 rounded-2xl shadow-xl transition-all duration-300 overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-400/5 rounded-full blur-2xl group-hover:bg-purple-400/10 transition-all" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Khách Hàng</span>
            <div className="w-10 h-10 rounded-xl bg-purple-400/10 border border-purple-400/30 flex items-center justify-center text-purple-400">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-white">
              {totalCustomersCount} <span className="text-sm font-sans font-normal text-zinc-400">tài khoản</span>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span className="inline-flex items-center gap-1 text-xs font-mono font-bold text-purple-400 bg-purple-400/10 px-2 py-0.5 rounded border border-purple-400/20">
                <TrendingUp className="w-3 h-3" /> Thành viên
              </span>
              <span className="text-[11px] text-zinc-400">Đang hoạt động</span>
            </div>
          </div>
          {/* Mini Sparkline SVG */}
          <div className="mt-4 pt-3 border-t border-zinc-800/60">
            <svg className="w-full h-8 overflow-visible" viewBox="0 0 100 25">
              <path
                d="M0,22 Q25,18 50,10 T80,14 T100,2"
                fill="none"
                stroke="#c084fc"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>

        {/* KPI 4: Sản Phẩm & Tồn Kho */}
        <div className="group relative bg-zinc-900/60 backdrop-blur-xl border border-zinc-800/80 hover:border-amber-500/50 p-6 rounded-2xl shadow-xl transition-all duration-300 overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/5 rounded-full blur-2xl group-hover:bg-amber-400/10 transition-all" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Sản Phẩm & Kho</span>
            <div className="w-10 h-10 rounded-xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-white">
              {totalSkuCount} <span className="text-sm font-sans font-normal text-zinc-400">SKU</span>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span className="inline-flex items-center gap-1 text-xs font-mono font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                <Layers className="w-3 h-3" /> {totalStockCount} tồn kho
              </span>
              {lowStockCount > 0 && (
                <span className="text-[11px] text-red-400 font-mono">({lowStockCount} sắp hết)</span>
              )}
            </div>
          </div>
          {/* Mini Sparkline SVG */}
          <div className="mt-4 pt-3 border-t border-zinc-800/60">
            <svg className="w-full h-8 overflow-visible" viewBox="0 0 100 25">
              <path
                d="M0,15 Q30,5 60,18 T100,8"
                fill="none"
                stroke="#fbbf24"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* 3. Neon Area Chart (Doanh thu phát sáng từ mảng orders thực tế) */}
      <section className="bg-zinc-900/60 backdrop-blur-xl border border-zinc-800/80 p-6 sm:p-8 rounded-3xl shadow-2xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-zinc-800/80">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-lime-400" />
              <span className="text-xs font-mono font-bold uppercase tracking-widest text-lime-400">
                DOANH THU & HIỆU SUẤT TĂNG TRƯỞNG
              </span>
            </div>
            <h2 className="text-xl font-black text-white mt-1 uppercase tracking-wide">
              Biểu Đồ Doanh Thu Neon
            </h2>
          </div>

          {/* Timeframe selector tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-zinc-950/80 border border-zinc-800 rounded-xl">
            {(['7days', '30days', '12months'] as const).map((key) => (
              <button
                key={key}
                onClick={() => setTimeRange(key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  timeRange === key
                    ? 'bg-lime-400 text-zinc-950 shadow-md shadow-lime-400/20'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {key === '7days' ? '7 ngày' : key === '30days' ? '30 ngày' : '12 tháng'}
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Glowing Area Chart Canvas */}
        <div className="mt-8 relative">
          <div className="h-64 sm:h-72 w-full relative flex items-end">
            {/* Horizontal Grid lines */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20">
              <div className="border-b border-zinc-700 w-full" />
              <div className="border-b border-zinc-700 w-full" />
              <div className="border-b border-zinc-700 w-full" />
              <div className="border-b border-zinc-700 w-full" />
            </div>

            {/* Bars & Dynamic Heights */}
            <div className="w-full h-full flex items-end justify-between gap-2 sm:gap-4 relative z-10 pt-8">
              {chartData.map((item, idx) => {
                const heightPercent = item.revenue > 0
                  ? Math.max(15, (item.revenue / maxRevenue) * 90)
                  : 8;
                const isHovered = hoveredPoint === idx;

                return (
                  <div
                    key={item.label}
                    className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer"
                    onMouseEnter={() => setHoveredPoint(idx)}
                    onMouseLeave={() => setHoveredPoint(null)}
                  >
                    {/* Hover Tooltip */}
                    {isHovered && (
                      <div className="absolute top-0 transform -translate-x-1/2 bg-zinc-950/95 border border-lime-400/60 p-2.5 rounded-xl shadow-2xl z-20 pointer-events-none animate-in fade-in zoom-in-95 duration-150">
                        <div className="text-[11px] font-bold text-white">{item.label}</div>
                        <div className="text-sm font-black font-mono text-lime-400">
                          {item.revenue.toLocaleString('vi-VN')}₫
                        </div>
                        <div className="text-[10px] text-zinc-400">{item.orders} đơn hàng phát sinh</div>
                      </div>
                    )}

                    {/* Glowing Bar Column */}
                    <div className="w-full max-w-[48px] relative flex flex-col justify-end">
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className={`w-full rounded-t-xl transition-all duration-500 relative ${
                          item.revenue > 0
                            ? isHovered
                              ? 'bg-gradient-to-t from-lime-500 to-lime-300 shadow-xl shadow-lime-400/40'
                              : 'bg-gradient-to-t from-lime-500/40 via-lime-400/70 to-lime-300/90 group-hover:from-lime-500/60'
                            : 'bg-zinc-800/40 border-t border-zinc-700/60'
                        }`}
                      >
                        {item.revenue > 0 && (
                          <div className="absolute top-0 left-0 right-0 h-1 bg-white rounded-t-xl" />
                        )}
                      </div>
                    </div>

                    {/* X-axis Label */}
                    <span className={`text-[11px] font-mono mt-3 transition-colors ${isHovered ? 'text-lime-400 font-bold' : 'text-zinc-500'}`}>
                      {item.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* 4. Two-Column Grid: Recent Orders & Top Selling Products */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left (7 Cols): Đơn Hàng Mới Nhất */}
        <section className="lg:col-span-7 bg-zinc-900/60 backdrop-blur-xl border border-zinc-800/80 p-6 rounded-3xl shadow-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800/80">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-lime-400 animate-ping" />
                <h3 className="text-lg font-black text-white uppercase tracking-wide">
                  Đơn Hàng Mới Nhất ({orders.length})
                </h3>
              </div>
              <Link
                to="/admin/orders"
                className="text-xs font-bold text-lime-400 hover:text-lime-300 inline-flex items-center gap-1 group"
              >
                <span>Xem tất cả</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            {/* Orders List */}
            <div className="mt-4 divide-y divide-zinc-800/60">
              {recentOrders.map((order) => (
                <div key={order.id} className="py-3.5 flex items-center justify-between gap-3 group hover:bg-zinc-800/30 px-2 rounded-xl transition">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center font-mono font-bold text-xs text-lime-400">
                      #{order.id.slice(-3)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-white group-hover:text-lime-400 transition">
                          {order.id}
                        </span>
                        {order.ghnTrackingCode && (
                          <span className="text-[10px] font-mono text-zinc-400 bg-zinc-800 px-1.5 py-0.5 rounded">
                            {order.ghnTrackingCode}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        {order.customer.name} • {order.itemsCount || order.itemsList?.length || 1} sản phẩm • {order.date}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-sm font-black font-mono text-white">
                      {order.total.toLocaleString('vi-VN')}₫
                    </div>
                    <div className="mt-1">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold font-mono uppercase ${
                        order.status === 'delivered' || (order as any).status === 'paid'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : order.status === 'shipping'
                          ? 'bg-sky-500/10 text-sky-400 border border-sky-500/30'
                          : order.status === 'pending'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                          : 'bg-red-500/10 text-red-400 border border-red-500/30'
                      }`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
                        {order.status === 'delivered'
                          ? 'Đã giao'
                          : order.status === 'shipping'
                          ? 'Đang giao'
                          : order.status === 'pending'
                          ? 'Chờ duyệt'
                          : order.status === 'cancelled'
                          ? 'Đã hủy'
                          : order.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}

              {recentOrders.length === 0 && (
                <div className="py-8 text-center text-xs text-zinc-500">
                  Chưa có đơn hàng nào trong hệ thống.
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-zinc-800/80 flex items-center justify-between text-xs text-zinc-500">
            <span>Hiển thị {recentOrders.length} đơn hàng mới nhất</span>
            <Link to="/admin/orders" className="text-zinc-400 hover:text-white font-medium">
              Quản lý toàn bộ đơn hàng →
            </Link>
          </div>
        </section>

        {/* Right (5 Cols): Top Sản Phẩm Bán Chạy */}
        <section className="lg:col-span-5 bg-zinc-900/60 backdrop-blur-xl border border-zinc-800/80 p-6 rounded-3xl shadow-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800/80">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-lime-400" />
                <h3 className="text-lg font-black text-white uppercase tracking-wide">
                  Top Bán Chạy
                </h3>
              </div>
              <span className="text-xs font-mono text-zinc-400">THỰC TẾ</span>
            </div>

            <div className="mt-4 space-y-3">
              {topSellingProducts.map((p, idx) => (
                <div
                  key={p.id}
                  className="p-3 rounded-2xl bg-zinc-950/40 border border-zinc-800/60 hover:border-lime-500/40 flex items-center gap-3 group transition"
                >
                  {/* Rank Badge */}
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-black font-mono text-xs ${
                    idx === 0 
                      ? 'bg-yellow-400 text-zinc-950 shadow-md shadow-yellow-400/20' 
                      : idx === 1 
                      ? 'bg-zinc-300 text-zinc-950' 
                      : idx === 2 
                      ? 'bg-amber-600 text-white' 
                      : 'bg-zinc-800 text-zinc-400'
                  }`}>
                    #{idx + 1}
                  </div>

                  {/* Thumbnail */}
                  <img
                    src={p.image}
                    alt={p.name}
                    className="w-12 h-12 rounded-xl object-cover border border-zinc-800"
                  />

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-white truncate group-hover:text-lime-400 transition">
                      {p.name}
                    </h4>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[11px] font-mono font-bold text-lime-400">
                        {p.price.toLocaleString('vi-VN')}₫
                      </span>
                      <span className="text-[10px] text-zinc-400">• {p.unitsSold} đã bán</span>
                    </div>
                  </div>

                  <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded">
                    {p.growth}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-zinc-800/80 text-center">
            <Link
              to="/admin/products"
              className="text-xs font-bold text-lime-400 hover:underline inline-flex items-center gap-1"
            >
              Xem toàn bộ danh mục sản phẩm →
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Dashboard;

