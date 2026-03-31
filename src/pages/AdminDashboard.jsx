import { useState, useEffect, useCallback } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line,
} from "recharts";
import {
  ShoppingCart, TrendingUp, ChefHat, Store, Loader2,
  CalendarDays, ChevronLeft, ChevronRight, Package,
  CheckCircle, XCircle, Clock, Truck, AlertCircle,
} from "lucide-react";
import { toast } from "react-toastify";
import { getOrdersMonthly, getAllStore } from "../api/authAPI";

const MONTH_NAMES = [
  "Tháng 1","Tháng 2","Tháng 3","Tháng 4","Tháng 5","Tháng 6",
  "Tháng 7","Tháng 8","Tháng 9","Tháng 10","Tháng 11","Tháng 12",
];

const STATUS_COLORS = {
  PENDING:    "#f59e0b",
  CONFIRMED:  "#3b82f6",
  APPROVED:   "#3b82f6",
  IN_PROGRESS:"#8b5cf6",
  COOKING:    "#f97316",
  COOKING_DONE:"#10b981",
  READY_TO_PICK:"#06b6d4",
  DELIVERING: "#6366f1",
  DELIVERED:  "#22c55e",
  COMPLETED:  "#059669",
  CANCELLED:  "#ef4444",
  REJECTED:   "#dc2626",
};

const PIE_COLORS = [
  "#3b82f6","#f59e0b","#10b981","#ef4444","#8b5cf6",
  "#06b6d4","#f97316","#6366f1","#22c55e","#dc2626",
  "#ec4899","#14b8a6","#a855f7","#eab308",
];

const AdminDashboard = () => {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear]   = useState(now.getFullYear());
  const [selectedStore, setSelectedStore] = useState("ALL");

  const [allData, setAllData]       = useState(null);
  const [stores, setStores]         = useState([]);
  const [storeMap, setStoreMap]     = useState({});
  const [loading, setLoading]       = useState(true);

  const [yearlyData, setYearlyData] = useState([]);
  const [yearlyLoading, setYearlyLoading] = useState(false);

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

  const fetchMonthly = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getOrdersMonthly(month, year);
      setAllData(res.data?.data ?? res.data);
    } catch {
      toast.error("Không thể tải dữ liệu đơn hàng theo tháng.");
      setAllData(null);
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  useEffect(() => { fetchMonthly(); }, [fetchMonthly]);

  useEffect(() => {
    (async () => {
      setYearlyLoading(true);
      try {
        const promises = Array.from({ length: 12 }, (_, i) =>
          getOrdersMonthly(i + 1, year).then((r) => ({
            month: MONTH_NAMES[i],
            monthNum: i + 1,
            totalOrders: (r.data?.data ?? r.data)?.totalOrders ?? 0,
          })).catch(() => ({ month: MONTH_NAMES[i], monthNum: i + 1, totalOrders: 0 }))
        );
        const results = await Promise.all(promises);
        setYearlyData(results);
      } catch { /* silent */ }
      finally { setYearlyLoading(false); }
    })();
  }, [year]);

  const orders = allData?.orders ?? [];
  const totalOrders = allData?.totalOrders ?? orders.length;

  const statusCount = {};
  orders.forEach((o) => {
    const s = o.statusOrder ?? "UNKNOWN";
    statusCount[s] = (statusCount[s] || 0) + 1;
  });

  const storeOrderCount = {};
  orders.forEach((o) => {
    const sid = o.storeId ?? "UNKNOWN";
    storeOrderCount[sid] = (storeOrderCount[sid] || 0) + 1;
  });
  const storeBarData = Object.entries(storeOrderCount)
    .map(([storeId, count]) => ({
      store: storeMap[storeId] || storeId,
      orders: count,
    }))
    .sort((a, b) => b.orders - a.orders);

  const displayOrders = selectedStore === "ALL"
    ? orders
    : orders.filter((o) => o.storeId === selectedStore);

  const displayStatusCount = {};
  displayOrders.forEach((o) => {
    const s = o.statusOrder ?? "UNKNOWN";
    displayStatusCount[s] = (displayStatusCount[s] || 0) + 1;
  });

  const displayTotal = displayOrders.length;

  const pieData = Object.entries(displayStatusCount)
    .map(([name, value]) => ({ name: name.replace(/_/g, " "), value, key: name }))
    .sort((a, b) => b.value - a.value);

  const storeStatusBar = Object.entries(displayStatusCount)
    .map(([name, value]) => ({ name: name.replace(/_/g, " "), value, key: name }))
    .sort((a, b) => b.value - a.value);
  const completedCount = (displayStatusCount.COMPLETED ?? 0) + (displayStatusCount.DELIVERED ?? 0);
  const cancelledCount = (displayStatusCount.CANCELLED ?? 0) + (displayStatusCount.REJECTED ?? 0);
  const pendingCount = displayStatusCount.PENDING ?? 0;
  const inProgressCount = Object.entries(displayStatusCount)
    .filter(([k]) => !["COMPLETED","DELIVERED","CANCELLED","REJECTED","PENDING"].includes(k))
    .reduce((sum, [, v]) => sum + v, 0);

  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (month === 12) { setMonth(1); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
  };

  const paymentMethodCount = {};
  displayOrders.forEach((o) => {
    const m = o.paymentMethod ?? "UNKNOWN";
    paymentMethodCount[m] = (paymentMethodCount[m] || 0) + 1;
  });
  const paymentBarData = Object.entries(paymentMethodCount)
    .map(([name, value]) => ({ name: name.replace(/_/g, " "), value }))
    .sort((a, b) => b.value - a.value);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome Banner */}
      <div className="admin-welcome-banner rounded-2xl p-6 flex items-center justify-between overflow-hidden relative">
        <div className="relative z-10">
          <h2 className="text-xl font-bold text-white">Dashboard - Thống kê đơn hàng</h2>
          <p className="text-white/70 text-sm mt-1">
            Tổng quan đơn hàng theo tháng từ các cửa hàng Franchise
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
        <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-white/5" />
        <div className="absolute -right-4 -bottom-8 w-24 h-24 rounded-full bg-white/5" />
      </div>

      {/* Month/Year Selector + Store Filter */}
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
            value={selectedStore}
            onChange={(e) => setSelectedStore(e.target.value)}
            className="text-sm border border-border rounded-xl px-3 py-2 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="ALL">Tất cả cửa hàng</option>
            {stores.map((s) => (
              <option key={s.storeId} value={s.storeId}>
                {s.storeName ?? s.storeId}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm text-muted-foreground">Năm:</label>
          <input
            type="number"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            min={2020}
            max={2030}
            className="w-20 text-sm border border-border rounded-xl px-3 py-2 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
      </div>

      {loading ? (
        <div className="admin-card rounded-2xl p-16 flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-sm text-muted-foreground">Đang tải dữ liệu...</p>
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
            {[
              { label: "Tổng đơn hàng", value: displayTotal, icon: ShoppingCart, color: "stat-card-blue" },
              { label: "Hoàn thành",     value: completedCount, icon: CheckCircle, color: "stat-card-green" },
              { label: "Đang xử lý",    value: inProgressCount, icon: TrendingUp,  color: "stat-card-orange" },
              { label: "Chờ duyệt",     value: pendingCount, icon: Clock,       color: "stat-card-purple" },
              { label: "Đã hủy",        value: cancelledCount, icon: XCircle,     color: "stat-card-red" },
            ].map((stat) => (
              <div key={stat.label} className={`stat-card rounded-2xl p-5 flex flex-col gap-3 ${stat.color}`}>
                <div className="flex items-start justify-between">
                  <div className="stat-card-icon w-11 h-11 rounded-xl flex items-center justify-center">
                    <stat.icon className="w-6 h-6" />
                  </div>
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-sm font-medium text-foreground/80 mt-0.5">{stat.label}</p>
                  <p className="text-xs text-muted-foreground mt-1">{MONTH_NAMES[month - 1]} {year}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Charts Row 1: Yearly Trend + Status Pie */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Yearly Trend Line Chart */}
            <div className="admin-card rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-foreground">Xu hướng đơn hàng năm {year}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Số đơn hàng theo từng tháng</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-primary" />
                </div>
              </div>
              {yearlyLoading ? (
                <div className="flex items-center justify-center h-[280px]">
                  <Loader2 className="w-6 h-6 text-primary animate-spin" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={yearlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border, #e5e7eb)" />
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 11 }}
                      tickFormatter={(v) => v.replace("Tháng ", "T")}
                    />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ borderRadius: 12, border: "1px solid #e5e7eb", fontSize: 13 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="totalOrders"
                      name="Đơn hàng"
                      stroke="#3b82f6"
                      strokeWidth={2.5}
                      dot={{ r: 4, fill: "#3b82f6" }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Status Pie Chart */}
            <div className="admin-card rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-foreground">Phân bố trạng thái</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{MONTH_NAMES[month - 1]} {year} — {displayTotal} đơn</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Package className="w-5 h-5 text-primary" />
                </div>
              </div>
              {pieData.length === 0 ? (
                <div className="flex items-center justify-center h-[280px] text-sm text-muted-foreground">
                  Không có dữ liệu
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, value }) => `${name} (${value})`}
                    >
                      {pieData.map((entry, idx) => (
                        <Cell
                          key={entry.key}
                          fill={STATUS_COLORS[entry.key] ?? PIE_COLORS[idx % PIE_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ borderRadius: 12, border: "1px solid #e5e7eb", fontSize: 13 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Charts Row 2: Orders per Store + Payment Methods */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Orders per Store Bar Chart */}
            <div className="admin-card rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-foreground">Đơn hàng theo cửa hàng</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{MONTH_NAMES[month - 1]} {year}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Store className="w-5 h-5 text-primary" />
                </div>
              </div>
              {storeBarData.length === 0 ? (
                <div className="flex items-center justify-center h-[300px] text-sm text-muted-foreground">
                  Không có dữ liệu
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={storeBarData} layout="vertical" margin={{ left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border, #e5e7eb)" />
                    <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                    <YAxis
                      type="category"
                      dataKey="store"
                      tick={{ fontSize: 11 }}
                      width={130}
                    />
                    <Tooltip
                      contentStyle={{ borderRadius: 12, border: "1px solid #e5e7eb", fontSize: 13 }}
                    />
                    <Bar dataKey="orders" name="Đơn hàng" fill="#3b82f6" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Payment Method Bar Chart */}
            <div className="admin-card rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-foreground">Phương thức thanh toán</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{MONTH_NAMES[month - 1]} {year}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <ShoppingCart className="w-5 h-5 text-primary" />
                </div>
              </div>
              {paymentBarData.length === 0 ? (
                <div className="flex items-center justify-center h-[300px] text-sm text-muted-foreground">
                  Không có dữ liệu
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={paymentBarData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border, #e5e7eb)" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ borderRadius: 12, border: "1px solid #e5e7eb", fontSize: 13 }}
                    />
                    <Bar dataKey="value" name="Số đơn" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Store Detail Section */}
          {selectedStore !== "ALL" && (
            <div className="admin-card rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-foreground">
                    Chi tiết: {storeMap[selectedStore] ?? selectedStore}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {MONTH_NAMES[month - 1]} {year} — {displayTotal} đơn
                  </p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-primary" />
                </div>
              </div>
              {storeStatusBar.length === 0 ? (
                <div className="flex items-center justify-center h-[250px] text-sm text-muted-foreground">
                  Không có dữ liệu cho store này trong tháng {month}/{year}
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={storeStatusBar}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border, #e5e7eb)" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ borderRadius: 12, border: "1px solid #e5e7eb", fontSize: 13 }}
                    />
                    <Bar dataKey="value" name="Số đơn" radius={[6, 6, 0, 0]}>
                      {storeStatusBar.map((entry, idx) => (
                        <Cell
                          key={entry.key}
                          fill={STATUS_COLORS[entry.key] ?? PIE_COLORS[idx % PIE_COLORS.length]}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          )}

          {/* Recent Orders Table */}
          <div className="admin-card rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <div>
                <h3 className="font-semibold text-foreground">
                  Danh sách đơn hàng — {MONTH_NAMES[month - 1]} {year}
                  {selectedStore !== "ALL" && ` — ${storeMap[selectedStore] ?? selectedStore}`}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {displayOrders.length} đơn hàng
                </p>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20">
                <Truck className="w-4 h-4 text-primary" />
                <span className="text-xs font-semibold text-primary">{displayOrders.length} đơn</span>
              </div>
            </div>

            {displayOrders.length === 0 ? (
              <div className="p-12 text-center text-sm text-muted-foreground">
                Không có đơn hàng trong {MONTH_NAMES[month - 1]} {year}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="admin-table-header">
                      <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Order ID</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Cửa hàng</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Ngày đặt</th>
                      <th className="text-center px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Trạng thái</th>
                      <th className="text-center px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Thanh toán</th>
                      <th className="text-center px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Priority</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {displayOrders.slice(0, 20).map((order, idx) => {
                      const statusColor = STATUS_COLORS[order.statusOrder] ?? "#6b7280";
                      return (
                        <tr key={order.orderId ?? idx} className="admin-table-row" style={{ animationDelay: `${idx * 40}ms` }}>
                          <td className="px-6 py-3 font-mono font-semibold text-primary text-xs">{order.orderId ?? "—"}</td>
                          <td className="px-6 py-3 text-foreground hidden md:table-cell text-xs">
                            {storeMap[order.storeId ?? allData?.storeId] ?? order.storeId ?? "—"}
                          </td>
                          <td className="px-6 py-3 text-muted-foreground hidden sm:table-cell text-xs">{order.orderDate ?? "—"}</td>
                          <td className="px-6 py-3 text-center">
                            <span
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold"
                              style={{ backgroundColor: statusColor + "18", color: statusColor }}
                            >
                              {(order.statusOrder ?? "—").replace(/_/g, " ")}
                            </span>
                          </td>
                          <td className="px-6 py-3 text-center text-xs text-muted-foreground hidden lg:table-cell">
                            {(order.paymentMethod ?? "—").replace(/_/g, " ")}
                          </td>
                          <td className="px-6 py-3 text-center hidden lg:table-cell">
                            {order.priorityLevel != null ? (
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                order.priorityLevel === 1 ? "bg-red-100 text-red-700"
                                : order.priorityLevel === 3 ? "bg-green-100 text-green-700"
                                : "bg-amber-100 text-amber-700"
                              }`}>
                                {order.priorityLevel === 1 ? "HIGH" : order.priorityLevel === 3 ? "LOW" : "MEDIUM"}
                              </span>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {displayOrders.length > 20 && (
                  <div className="px-6 py-3 border-t border-border text-center">
                    <p className="text-xs text-muted-foreground">
                      Hiển thị 20/{displayOrders.length} đơn hàng
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default AdminDashboard;
