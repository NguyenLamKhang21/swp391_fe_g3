import { useState, useEffect, useCallback } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line,
} from "recharts";
import {
  ShoppingCart, TrendingUp, ChefHat, Store, Loader2,
  CalendarDays, ChevronLeft, ChevronRight, Package,
  CheckCircle, XCircle, Clock, Truck, AlertTriangle,
  RefreshCw, Box,
} from "lucide-react";
import { toast } from "react-toastify";
import {
  getOrdersMonthly, getAllStore, getCentralKitchenFood,
  getCentralFoodExpiringSoon, getAllDelivery, getAllBatches,
} from "../api/authAPI";

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

const ManagerDashboard = () => {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear]   = useState(now.getFullYear());

  const [loading, setLoading]         = useState(true);
  const [orderData, setOrderData]     = useState(null);
  const [stores, setStores]           = useState([]);
  const [storeMap, setStoreMap]       = useState({});
  const [foods, setFoods]             = useState([]);
  const [expiringSoon, setExpiringSoon] = useState([]);
  const [deliveries, setDeliveries]   = useState([]);
  const [batches, setBatches]         = useState([]);
  const [yearlyData, setYearlyData]   = useState([]);
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

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [orderRes, foodRes, expRes, delivRes, batchRes] = await Promise.allSettled([
        getOrdersMonthly(month, year),
        getCentralKitchenFood(),
        getCentralFoodExpiringSoon(7),
        getAllDelivery(),
        getAllBatches(),
      ]);
      if (orderRes.status === "fulfilled")
        setOrderData(orderRes.value.data?.data ?? orderRes.value.data);
      if (foodRes.status === "fulfilled") {
        const f = foodRes.value.data?.data ?? foodRes.value.data ?? [];
        setFoods(Array.isArray(f) ? f : []);
      }
      if (expRes.status === "fulfilled") {
        const e = expRes.value.data?.data ?? expRes.value.data ?? [];
        setExpiringSoon(Array.isArray(e) ? e : []);
      }
      if (delivRes.status === "fulfilled") {
        const d = delivRes.value.data?.data ?? delivRes.value.data ?? [];
        setDeliveries(Array.isArray(d) ? d : []);
      }
      if (batchRes.status === "fulfilled") {
        const b = batchRes.value.data?.data ?? batchRes.value.data ?? [];
        setBatches(Array.isArray(b) ? b : []);
      }
    } catch {
      toast.error("Không thể tải dữ liệu.");
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  useEffect(() => {
    (async () => {
      setYearlyLoading(true);
      try {
        const promises = Array.from({ length: 12 }, (_, i) =>
          getOrdersMonthly(i + 1, year)
            .then((r) => ({
              month: MONTH_NAMES[i],
              totalOrders: (r.data?.data ?? r.data)?.totalOrders ?? 0,
            }))
            .catch(() => ({ month: MONTH_NAMES[i], totalOrders: 0 }))
        );
        setYearlyData(await Promise.all(promises));
      } catch { /* silent */ }
      finally { setYearlyLoading(false); }
    })();
  }, [year]);

  const orders = orderData?.orders ?? [];
  const totalOrders = orderData?.totalOrders ?? orders.length;

  const statusCount = {};
  orders.forEach((o) => {
    const s = o.statusOrder ?? "UNKNOWN";
    statusCount[s] = (statusCount[s] || 0) + 1;
  });

  const completedCount = (statusCount.COMPLETED ?? 0) + (statusCount.DELIVERED ?? 0);
  const cancelledCount = (statusCount.CANCELLED ?? 0) + (statusCount.REJECTED ?? 0);
  const pendingCount   = statusCount.PENDING ?? 0;
  const activeCount    = totalOrders - completedCount - cancelledCount - pendingCount;

  const storeOrderCount = {};
  orders.forEach((o) => {
    const sid = o.storeId ?? "UNKNOWN";
    storeOrderCount[sid] = (storeOrderCount[sid] || 0) + 1;
  });
  const storeBarData = Object.entries(storeOrderCount)
    .map(([storeId, count]) => ({ store: storeMap[storeId] || storeId, orders: count }))
    .sort((a, b) => b.orders - a.orders);

  const statusPie = Object.entries(statusCount)
    .map(([name, value]) => ({ name: name.replace(/_/g, " "), value, key: name }))
    .sort((a, b) => b.value - a.value);

  const totalFoods = foods.length;
  const inStockFoods = foods.filter((f) => (f.amount ?? 0) > 0).length;
  const outOfStockFoods = totalFoods - inStockFoods;

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
      {/* Welcome Banner */}
      <div className="admin-welcome-banner rounded-2xl p-6 flex items-center justify-between overflow-hidden relative">
        <div className="relative z-10">
          <h2 className="text-xl font-bold text-white">Xin chào, Manager!</h2>
          <p className="text-white/70 text-sm mt-1">
            Tổng quan hiệu suất sản xuất, phân phối và vận hành chuỗi cửa hàng
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

      {/* Month/Year Selector */}
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
          <label className="text-sm text-muted-foreground">Năm:</label>
          <input
            type="number" value={year} onChange={(e) => setYear(Number(e.target.value))}
            min={2020} max={2030}
            className="w-20 text-sm border border-border rounded-xl px-3 py-2 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <button
          onClick={fetchAll} disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border bg-background text-foreground text-sm font-medium hover:bg-muted transition-colors disabled:opacity-60"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Làm mới
        </button>
      </div>

      {loading ? (
        <div className="admin-card rounded-2xl p-16 flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-sm text-muted-foreground">Đang tải dữ liệu...</p>
        </div>
      ) : (
        <>
          {/* Stats Cards Row 1 — Orders */}
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4">
            {[
              { label: "Tổng đơn hàng",  value: totalOrders, icon: ShoppingCart, color: "stat-card-blue" },
              { label: "Hoàn thành",      value: completedCount, icon: CheckCircle, color: "stat-card-green" },
              { label: "Đang xử lý",     value: activeCount, icon: TrendingUp, color: "stat-card-orange" },
              { label: "Chờ duyệt",      value: pendingCount, icon: Clock, color: "stat-card-purple" },
              { label: "Đã hủy",         value: cancelledCount, icon: XCircle, color: "stat-card-red" },
              { label: "Cửa hàng",       value: stores.length, icon: Store, color: "stat-card-blue" },
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

          {/* Stats Cards Row 2 — Inventory & Logistics */}
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-4">
            {[
              { label: "Sản phẩm kho", value: totalFoods, icon: Package, color: "stat-card-blue" },
              { label: "Còn hàng",     value: inStockFoods, icon: CheckCircle, color: "stat-card-green" },
              { label: "Hết hàng",     value: outOfStockFoods, icon: XCircle, color: "stat-card-red" },
              { label: "Sắp hết hạn",  value: expiringSoon.length, icon: AlertTriangle, color: "stat-card-orange" },
              { label: "Lô hàng",      value: batches.length, icon: Box, color: "stat-card-purple" },
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

          {/* Charts Row 1: Yearly Trend + Status Pie */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="admin-card rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-foreground">Xu hướng đơn hàng — {year}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Tổng đơn hàng theo từng tháng</p>
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
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} tickFormatter={(v) => v.replace("Tháng ", "T")} />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e5e7eb", fontSize: 13 }} />
                    <Line type="monotone" dataKey="totalOrders" name="Đơn hàng" stroke="#3b82f6" strokeWidth={2.5}
                      dot={{ r: 4, fill: "#3b82f6" }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="admin-card rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-foreground">Phân bố trạng thái đơn</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{MONTH_NAMES[month - 1]} {year} — {totalOrders} đơn</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Package className="w-5 h-5 text-primary" />
                </div>
              </div>
              {statusPie.length === 0 ? (
                <div className="flex items-center justify-center h-[280px] text-sm text-muted-foreground">Không có dữ liệu</div>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie data={statusPie} cx="50%" cy="50%" innerRadius={55} outerRadius={100}
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
          </div>

          {/* Charts Row 2: Store Performance */}
          <div className="admin-card rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-foreground">Hiệu suất cửa hàng — {MONTH_NAMES[month - 1]} {year}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Số đơn hàng theo từng cửa hàng</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Store className="w-5 h-5 text-primary" />
              </div>
            </div>
            {storeBarData.length === 0 ? (
              <div className="flex items-center justify-center h-[300px] text-sm text-muted-foreground">Không có dữ liệu</div>
            ) : (
              <ResponsiveContainer width="100%" height={Math.max(300, storeBarData.length * 50)}>
                <BarChart data={storeBarData} layout="vertical" margin={{ left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border, #e5e7eb)" />
                  <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                  <YAxis type="category" dataKey="store" tick={{ fontSize: 11 }} width={160} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e5e7eb", fontSize: 13 }} />
                  <Bar dataKey="orders" name="Đơn hàng" fill="#3b82f6" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Inventory Alerts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Expiring Soon */}
            <div className="admin-card rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                <div>
                  <h3 className="font-semibold text-foreground flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    Sản phẩm sắp hết hạn
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{expiringSoon.length} sản phẩm (trong 7 ngày)</p>
                </div>
              </div>
              {expiringSoon.length === 0 ? (
                <div className="p-8 text-center text-sm text-muted-foreground">Không có sản phẩm sắp hết hạn</div>
              ) : (
                <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0">
                      <tr className="admin-table-header">
                        <th className="text-left px-4 py-2 text-xs font-semibold text-muted-foreground uppercase">Tên</th>
                        <th className="text-right px-4 py-2 text-xs font-semibold text-muted-foreground uppercase">Tồn kho</th>
                        <th className="text-right px-4 py-2 text-xs font-semibold text-muted-foreground uppercase">Hạn dùng</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {expiringSoon.map((f, i) => (
                        <tr key={f.foodId ?? i} className="admin-table-row">
                          <td className="px-4 py-2 font-medium text-foreground">{f.foodName ?? "—"}</td>
                          <td className="px-4 py-2 text-right text-muted-foreground">{f.amount ?? 0}</td>
                          <td className="px-4 py-2 text-right text-amber-600 font-medium">{f.expiryDate ?? "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Out of Stock */}
            <div className="admin-card rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                <div>
                  <h3 className="font-semibold text-foreground flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-red-500" />
                    Sản phẩm hết hàng
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{outOfStockFoods} sản phẩm</p>
                </div>
              </div>
              {outOfStockFoods === 0 ? (
                <div className="p-8 text-center text-sm text-muted-foreground">Tất cả sản phẩm đều còn hàng</div>
              ) : (
                <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0">
                      <tr className="admin-table-header">
                        <th className="text-left px-4 py-2 text-xs font-semibold text-muted-foreground uppercase">Tên sản phẩm</th>
                        <th className="text-center px-4 py-2 text-xs font-semibold text-muted-foreground uppercase">Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {foods.filter((f) => (f.amount ?? 0) <= 0).map((f, i) => (
                        <tr key={f.foodId ?? i} className="admin-table-row">
                          <td className="px-4 py-2 font-medium text-foreground">{f.foodName ?? "—"}</td>
                          <td className="px-4 py-2 text-center">
                            <span className="badge badge-cancelled">Hết hàng</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ManagerDashboard;
