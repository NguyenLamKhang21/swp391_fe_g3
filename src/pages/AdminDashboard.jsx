import {
  Users,
  ShoppingCart,
  Package,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  MoreHorizontal,
  ChefHat,
  Store,
} from "lucide-react";

/* ─── Stat Cards Data ─── */
const stats = [
  {
    id: "total-users",
    label: "Tổng người dùng",
    value: "12,847",
    change: "+12.5%",
    positive: true,
    icon: Users,
    color: "stat-card-blue",
    sub: "So với tháng trước",
  },
  {
    id: "total-orders",
    label: "Đơn hàng hôm nay",
    value: "1,284",
    change: "+8.2%",
    positive: true,
    icon: ShoppingCart,
    color: "stat-card-orange",
    sub: "So với hôm qua",
  },
  {
    id: "total-products",
    label: "Sản phẩm",
    value: "4,521",
    change: "-3.1%",
    positive: false,
    icon: Package,
    color: "stat-card-purple",
    sub: "Tổng danh mục",
  },
  {
    id: "total-revenue",
    label: "Doanh thu tháng",
    value: "₫ 948M",
    change: "+21.4%",
    positive: true,
    icon: TrendingUp,
    color: "stat-card-green",
    sub: "So với tháng trước",
  },
];

/* ─── Recent Orders Data ─── */
const orders = [
  {
    id: "#ORD-2841",
    customer: "Nguyễn Văn An",
    store: "Chi nhánh Q1",
    items: 5,
    total: "₫ 1,240,000",
    status: "Đã giao",
    statusType: "delivered",
    date: "26/02/2026",
  },
  {
    id: "#ORD-2840",
    customer: "Trần Thị Bình",
    store: "Chi nhánh Q3",
    items: 2,
    total: "₫ 480,000",
    status: "Đang giao",
    statusType: "shipping",
    date: "26/02/2026",
  },
  {
    id: "#ORD-2839",
    customer: "Lê Minh Cường",
    store: "Chi nhánh Bình Thạnh",
    items: 8,
    total: "₫ 2,100,000",
    status: "Chờ xử lý",
    statusType: "pending",
    date: "25/02/2026",
  },
  {
    id: "#ORD-2838",
    customer: "Phạm Thu Hà",
    store: "Chi nhánh Gò Vấp",
    items: 3,
    total: "₫ 720,000",
    status: "Đã giao",
    statusType: "delivered",
    date: "25/02/2026",
  },
  {
    id: "#ORD-2837",
    customer: "Hoàng Đức Minh",
    store: "Chi nhánh Q7",
    items: 1,
    total: "₫ 240,000",
    status: "Đã huỷ",
    statusType: "cancelled",
    date: "24/02/2026",
  },
  {
    id: "#ORD-2836",
    customer: "Vũ Thanh Nga",
    store: "Chi nhánh Tân Bình",
    items: 6,
    total: "₫ 1,560,000",
    status: "Đang giao",
    statusType: "shipping",
    date: "24/02/2026",
  },
];

const statusClass = {
  delivered: "badge-delivered",
  shipping: "badge-shipping",
  pending: "badge-pending",
  cancelled: "badge-cancelled",
};

/* ─── Component ─── */
const AdminDashboard = () => {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome Banner */}
      <div className="admin-welcome-banner rounded-2xl p-6 flex items-center justify-between overflow-hidden relative">
        <div className="relative z-10">
          <h2 className="text-xl font-bold text-white">
            Xin chào, Admin! 👋
          </h2>
          <p className="text-white/70 text-sm mt-1">
            Đây là tổng quan hoạt động hôm nay — 26 tháng 2, 2026

          </p>
        </div>
        <div className="hidden md:flex items-center gap-3 relative z-10">
          <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur flex items-center justify-center">
            <ChefHat className="w-8 h-8 text-white" />
          </div>
          <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur flex items-center justify-center">
            <Store className="w-8 h-8 text-white" />
          </div>
        </div>
        {/* decorative circles */}
        <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-white/5" />
        <div className="absolute -right-4 -bottom-8 w-24 h-24 rounded-full bg-white/5" />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.id}
            id={stat.id}
            className={`stat-card rounded-2xl p-5 flex flex-col gap-3 ${stat.color}`}
          >
            <div className="flex items-start justify-between">
              <div className="stat-card-icon w-11 h-11 rounded-xl flex items-center justify-center">
                <stat.icon className="w-6 h-6" />
              </div>
              <span
                className={`flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
                  stat.positive
                    ? "text-emerald-700 bg-emerald-100"
                    : "text-red-600 bg-red-100"
                }`}
              >
                {stat.positive ? (
                  <ArrowUpRight className="w-3 h-3" />
                ) : (
                  <ArrowDownRight className="w-3 h-3" />
                )}
                {stat.change}
              </span>
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="text-sm font-medium text-foreground/80 mt-0.5">{stat.label}</p>
              <p className="text-xs text-muted-foreground mt-1">{stat.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Data Table */}
      <div className="admin-card rounded-2xl overflow-hidden">
        {/* Table header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h3 className="font-semibold text-foreground">Đơn hàng gần đây</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{orders.length} đơn hàng mới nhất</p>
          </div>
          <button className="flex items-center gap-2 text-sm text-primary font-medium hover:underline">
            <Eye className="w-4 h-4" />
            Xem tất cả
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="admin-table-header">
                <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Mã đơn
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Khách hàng
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">
                  Cửa hàng
                </th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden sm:table-cell">
                  Số món
                </th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Tổng tiền
                </th>
                <th className="text-center px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Trạng thái
                </th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">
                  Ngày
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {orders.map((order, idx) => (
                <tr
                  key={order.id}
                  className="admin-table-row"
                  style={{ animationDelay: `${idx * 60}ms` }}
                >
                  <td className="px-6 py-4 font-mono font-semibold text-primary text-xs">
                    {order.id}
                  </td>
                  <td className="px-6 py-4 font-medium text-foreground whitespace-nowrap">
                    {order.customer}
                  </td>
                  <td className="px-6 py-4 text-muted-foreground hidden md:table-cell whitespace-nowrap">
                    {order.store}
                  </td>
                  <td className="px-6 py-4 text-right text-muted-foreground hidden sm:table-cell">
                    {order.items}
                  </td>
                  <td className="px-6 py-4 text-right font-semibold text-foreground whitespace-nowrap">
                    {order.total}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`badge ${statusClass[order.statusType]}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right text-muted-foreground hidden lg:table-cell whitespace-nowrap">
                    {order.date}
                  </td>
                  <td className="px-4 py-4 text-right">
                    <button className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-muted transition-colors ml-auto">
                      <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Table footer paging */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border">
          <p className="text-xs text-muted-foreground">Hiển thị 1–{orders.length} trong tổng số 2,841 đơn</p>
          <div className="flex items-center gap-2">
            <button className="px-3 py-1.5 text-xs rounded-lg border border-border text-foreground hover:bg-muted transition-colors disabled:opacity-40" disabled>
              Trước
            </button>
            <button className="px-3 py-1.5 text-xs rounded-lg bg-primary text-primary-foreground font-semibold">
              1
            </button>
            <button className="px-3 py-1.5 text-xs rounded-lg border border-border text-foreground hover:bg-muted transition-colors">
              2
            </button>
            <button className="px-3 py-1.5 text-xs rounded-lg border border-border text-foreground hover:bg-muted transition-colors">
              Sau
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
