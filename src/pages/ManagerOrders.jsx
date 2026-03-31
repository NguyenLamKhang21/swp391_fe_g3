import { useState, useEffect, useCallback } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import {
  ClipboardList, Loader2, Search, RefreshCw, CheckCircle,
  XCircle, Clock, Package, Store, CalendarDays, ChevronLeft, ChevronRight,
} from "lucide-react";
import { toast } from "react-toastify";
import { getOrdersMonthly, getAllStore } from "../api/authAPI";

const MONTH_NAMES = [
  "Tháng 1","Tháng 2","Tháng 3","Tháng 4","Tháng 5","Tháng 6",
  "Tháng 7","Tháng 8","Tháng 9","Tháng 10","Tháng 11","Tháng 12",
];

const STATUS_COLORS = {
  PENDING: "#f59e0b", CONFIRMED: "#3b82f6", APPROVED: "#3b82f6",
  IN_PROGRESS: "#8b5cf6", COOKING: "#f97316", COOKING_DONE: "#10b981",
  READY_TO_PICK: "#06b6d4", DELIVERING: "#6366f1", DELIVERED: "#22c55e",
  COMPLETED: "#059669", CANCELLED: "#ef4444", REJECTED: "#dc2626",
};

const PIE_COLORS = [
  "#3b82f6","#f59e0b","#10b981","#ef4444","#8b5cf6",
  "#06b6d4","#f97316","#6366f1","#22c55e","#dc2626",
];

const TABS = [
  { key: "ALL",        label: "Tất cả" },
  { key: "PENDING",    label: "Chờ duyệt" },
  { key: "COMPLETED",  label: "Hoàn thành" },
  { key: "CANCELLED",  label: "Đã hủy" },
  { key: "DELIVERING", label: "Đang giao" },
  { key: "IN_PROGRESS",label: "Đang xử lý" },
];

const ManagerOrders = () => {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear]   = useState(now.getFullYear());
  const [selectedStore, setSelectedStore] = useState("ALL");
  const [activeTab, setActiveTab] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  const [loading, setLoading]     = useState(true);
  const [orderData, setOrderData] = useState(null);
  const [stores, setStores]       = useState([]);
  const [storeMap, setStoreMap]   = useState({});

  useEffect(() => {
    (async () => {
      try {
        const res = await getAllStore();
        const list = Array.isArray(res.data) ? res.data : res.data?.data ?? [];
        setStores(list);
        const map = {};
        list.forEach((s) => { if (s.storeId) map[s.storeId] = s.storeName ?? s.storeId; });
        setStoreMap(map);
      } catch { /* silent */ }
    })();
  }, []);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getOrdersMonthly(month, year);
      setOrderData(res.data?.data ?? res.data);
    } catch {
      toast.error("Không thể tải dữ liệu đơn hàng.");
      setOrderData(null);
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const allOrders = orderData?.orders ?? [];

  const filtered = allOrders.filter((o) => {
    if (selectedStore !== "ALL" && o.storeId !== selectedStore) return false;
    if (activeTab !== "ALL" && o.statusOrder !== activeTab) return false;
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      return (
        (o.orderId ?? "").toLowerCase().includes(term) ||
        (storeMap[o.storeId] ?? o.storeId ?? "").toLowerCase().includes(term)
      );
    }
    return true;
  });

  const storeFiltered = selectedStore === "ALL" ? allOrders : allOrders.filter((o) => o.storeId === selectedStore);

  const statusCount = {};
  storeFiltered.forEach((o) => {
    const s = o.statusOrder ?? "UNKNOWN";
    statusCount[s] = (statusCount[s] || 0) + 1;
  });

  const statusPie = Object.entries(statusCount)
    .map(([name, value]) => ({ name: name.replace(/_/g, " "), value, key: name }))
    .sort((a, b) => b.value - a.value);

  const paymentCount = {};
  storeFiltered.forEach((o) => {
    const p = o.paymentOption ?? "UNKNOWN";
    paymentCount[p] = (paymentCount[p] || 0) + 1;
  });
  const paymentBar = Object.entries(paymentCount)
    .map(([name, value]) => ({ name: name.replace(/_/g, " "), value }))
    .sort((a, b) => b.value - a.value);

  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (month === 12) { setMonth(1); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Quản lý đơn hàng</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Theo dõi đơn hàng toàn chuỗi theo tháng</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2 bg-background border border-border rounded-xl px-3 py-2">
          <CalendarDays className="w-4 h-4 text-primary" />
          <button onClick={prevMonth} className="p-1 rounded-lg hover:bg-muted transition-colors">
            <ChevronLeft className="w-4 h-4 text-muted-foreground" />
          </button>
          <span className="text-sm font-semibold text-foreground min-w-[120px] text-center">
            {MONTH_NAMES[month - 1]} {year}
          </span>
          <button onClick={nextMonth} className="p-1 rounded-lg hover:bg-muted transition-colors">
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <Store className="w-4 h-4 text-muted-foreground" />
          <select
            value={selectedStore} onChange={(e) => setSelectedStore(e.target.value)}
            className="text-sm border border-border rounded-xl px-3 py-2 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="ALL">Tất cả cửa hàng</option>
            {stores.map((s) => (
              <option key={s.storeId} value={s.storeId}>{s.storeName ?? s.storeId}</option>
            ))}
          </select>
        </div>
        <button
          onClick={fetchOrders} disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border bg-background text-foreground text-sm font-medium hover:bg-muted transition-colors disabled:opacity-60"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Làm mới
        </button>
      </div>

      {loading ? (
        <div className="admin-card rounded-2xl p-16 flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-sm text-muted-foreground">Đang tải...</p>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "Tổng đơn", value: storeFiltered.length, icon: ClipboardList, color: "stat-card-blue" },
              { label: "Hoàn thành", value: (statusCount.COMPLETED ?? 0) + (statusCount.DELIVERED ?? 0), icon: CheckCircle, color: "stat-card-green" },
              { label: "Chờ duyệt", value: statusCount.PENDING ?? 0, icon: Clock, color: "stat-card-orange" },
              { label: "Đã hủy", value: (statusCount.CANCELLED ?? 0) + (statusCount.REJECTED ?? 0), icon: XCircle, color: "stat-card-red" },
            ].map((s) => (
              <div key={s.label} className={`stat-card rounded-2xl p-4 flex flex-col gap-2 ${s.color}`}>
                <div className="stat-card-icon w-10 h-10 rounded-xl flex items-center justify-center">
                  <s.icon className="w-5 h-5" />
                </div>
                <p className="text-2xl font-bold text-foreground">{s.value}</p>
                <p className="text-xs font-medium text-foreground/80">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="admin-card rounded-2xl p-6">
              <h3 className="font-semibold text-foreground mb-4">Phân bố trạng thái</h3>
              {statusPie.length === 0 ? (
                <div className="flex items-center justify-center h-[260px] text-sm text-muted-foreground">Không có dữ liệu</div>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={statusPie} cx="50%" cy="50%" innerRadius={50} outerRadius={95}
                      paddingAngle={2} dataKey="value" label={({ name, value }) => `${name} (${value})`}>
                      {statusPie.map((e, i) => (
                        <Cell key={e.key} fill={STATUS_COLORS[e.key] ?? PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e5e7eb", fontSize: 13 }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="admin-card rounded-2xl p-6">
              <h3 className="font-semibold text-foreground mb-4">Hình thức thanh toán</h3>
              {paymentBar.length === 0 ? (
                <div className="flex items-center justify-center h-[260px] text-sm text-muted-foreground">Không có dữ liệu</div>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={paymentBar}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border, #e5e7eb)" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e5e7eb", fontSize: 13 }} />
                    <Bar dataKey="value" name="Số đơn" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Tabs + Search */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex gap-1 bg-muted rounded-lg p-1 overflow-x-auto">
              {TABS.map((t) => {
                const count = t.key === "ALL" ? storeFiltered.length : (statusCount[t.key] ?? 0);
                return (
                  <button
                    key={t.key} onClick={() => setActiveTab(t.key)}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                      activeTab === t.key
                        ? "bg-primary text-primary-foreground shadow"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {t.label}
                    {count > 0 && (
                      <span className={`px-1.5 py-0.5 rounded-full text-[10px] leading-none font-bold ${
                        activeTab === t.key
                          ? "bg-primary-foreground/20 text-primary-foreground"
                          : "bg-foreground/10 text-muted-foreground"
                      }`}>{count}</span>
                    )}
                  </button>
                );
              })}
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <input
                type="text" placeholder="Tìm Order ID, Store..."
                value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                className="um-input pl-10 w-56"
              />
            </div>
          </div>

          {/* Orders Table */}
          {filtered.length === 0 ? (
            <div className="admin-card rounded-2xl p-12 flex flex-col items-center gap-4 text-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                <ClipboardList className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-base font-semibold text-foreground">Không có đơn hàng</p>
            </div>
          ) : (
            <div className="admin-card rounded-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                <h3 className="text-base font-semibold text-foreground">Danh sách đơn hàng</h3>
                <span className="badge badge-delivered">{filtered.length} đơn</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="admin-table-header">
                      <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Order ID</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Cửa hàng</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Ngày đặt</th>
                      <th className="text-center px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Trạng thái</th>
                      <th className="text-center px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Thanh toán</th>
                      <th className="text-center px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Payment Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filtered.slice(0, 50).map((order, idx) => {
                      const statusColor = STATUS_COLORS[order.statusOrder] ?? "#6b7280";
                      return (
                        <tr key={order.orderId ?? idx} className="admin-table-row" style={{ animationDelay: `${idx * 30}ms` }}>
                          <td className="px-6 py-3 font-mono font-semibold text-primary text-xs">{order.orderId ?? "—"}</td>
                          <td className="px-6 py-3 text-foreground hidden md:table-cell text-xs">{storeMap[order.storeId] ?? order.storeId ?? "—"}</td>
                          <td className="px-6 py-3 text-muted-foreground hidden sm:table-cell text-xs">{order.orderDate ?? "—"}</td>
                          <td className="px-6 py-3 text-center">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold"
                              style={{ backgroundColor: statusColor + "18", color: statusColor }}>
                              {(order.statusOrder ?? "—").replace(/_/g, " ")}
                            </span>
                          </td>
                          <td className="px-6 py-3 text-center text-xs text-muted-foreground hidden lg:table-cell">
                            {(order.paymentOption ?? "—").replace(/_/g, " ")}
                          </td>
                          <td className="px-6 py-3 text-center text-xs text-muted-foreground hidden lg:table-cell">
                            {order.paymentStatus ?? "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {filtered.length > 50 && (
                  <div className="px-6 py-3 border-t border-border text-center">
                    <p className="text-xs text-muted-foreground">Hiển thị 50/{filtered.length} đơn hàng</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ManagerOrders;
