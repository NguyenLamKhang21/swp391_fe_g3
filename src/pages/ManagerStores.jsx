import { useState, useEffect, useCallback } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Store, Loader2, RefreshCw, CalendarDays, ChevronLeft,
  ChevronRight, ShoppingCart, CheckCircle, XCircle, Clock,
  MapPin, Phone,
} from "lucide-react";
import { toast } from "react-toastify";
import { getOrdersMonthly, getAllStore } from "../api/authAPI";

const MONTH_NAMES = [
  "Tháng 1","Tháng 2","Tháng 3","Tháng 4","Tháng 5","Tháng 6",
  "Tháng 7","Tháng 8","Tháng 9","Tháng 10","Tháng 11","Tháng 12",
];

const ManagerStores = () => {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear]   = useState(now.getFullYear());

  const [loading, setLoading]     = useState(true);
  const [stores, setStores]       = useState([]);
  const [orderData, setOrderData] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await getAllStore();
        const list = Array.isArray(res.data) ? res.data : res.data?.data ?? [];
        setStores(list);
      } catch { /* silent */ }
    })();
  }, []);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getOrdersMonthly(month, year);
      setOrderData(res.data?.data ?? res.data);
    } catch {
      toast.error("Không thể tải dữ liệu.");
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const orders = orderData?.orders ?? [];

  const storeStats = stores.map((s) => {
    const storeOrders = orders.filter((o) => o.storeId === s.storeId);
    const completed = storeOrders.filter((o) => ["COMPLETED","DELIVERED"].includes(o.statusOrder)).length;
    const cancelled = storeOrders.filter((o) => ["CANCELLED","REJECTED"].includes(o.statusOrder)).length;
    const pending   = storeOrders.filter((o) => o.statusOrder === "PENDING").length;
    return {
      ...s,
      totalOrders: storeOrders.length,
      completed,
      cancelled,
      pending,
      active: storeOrders.length - completed - cancelled - pending,
    };
  }).sort((a, b) => b.totalOrders - a.totalOrders);

  const chartData = storeStats
    .filter((s) => s.totalOrders > 0)
    .map((s) => ({
      store: s.storeName ?? s.storeId,
      "Hoàn thành": s.completed,
      "Đang xử lý": s.active,
      "Chờ duyệt": s.pending,
      "Đã hủy": s.cancelled,
    }));

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
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Hiệu suất cửa hàng</h2>
          <p className="text-sm text-muted-foreground mt-0.5">So sánh hiệu suất đơn hàng giữa các cửa hàng</p>
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
          {/* Stacked Bar Chart */}
          {chartData.length > 0 && (
            <div className="admin-card rounded-2xl p-6">
              <h3 className="font-semibold text-foreground mb-4">
                So sánh đơn hàng theo cửa hàng — {MONTH_NAMES[month - 1]} {year}
              </h3>
              <ResponsiveContainer width="100%" height={Math.max(300, chartData.length * 55)}>
                <BarChart data={chartData} layout="vertical" margin={{ left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border, #e5e7eb)" />
                  <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                  <YAxis type="category" dataKey="store" tick={{ fontSize: 11 }} width={160} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e5e7eb", fontSize: 13 }} />
                  <Bar dataKey="Hoàn thành" stackId="a" fill="#22c55e" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="Đang xử lý" stackId="a" fill="#8b5cf6" />
                  <Bar dataKey="Chờ duyệt" stackId="a" fill="#f59e0b" />
                  <Bar dataKey="Đã hủy" stackId="a" fill="#ef4444" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Store Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {storeStats.map((s) => (
              <div key={s.storeId} className="admin-card rounded-2xl p-5 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Store className="w-5 h-5 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-semibold text-foreground text-sm truncate">{s.storeName ?? s.storeId}</h4>
                    {s.address && (
                      <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1 truncate">
                        <MapPin className="w-3 h-3 flex-shrink-0" /> {s.address}
                      </p>
                    )}
                    {s.phone && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Phone className="w-3 h-3 flex-shrink-0" /> {s.phone}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: "Tổng đơn", value: s.totalOrders, icon: ShoppingCart, cls: "text-blue-600 bg-blue-50" },
                    { label: "Hoàn thành", value: s.completed, icon: CheckCircle, cls: "text-green-600 bg-green-50" },
                    { label: "Chờ duyệt", value: s.pending, icon: Clock, cls: "text-amber-600 bg-amber-50" },
                    { label: "Đã hủy", value: s.cancelled, icon: XCircle, cls: "text-red-600 bg-red-50" },
                  ].map((item) => (
                    <div key={item.label} className={`rounded-lg p-2.5 ${item.cls.split(" ")[1]} border border-border/50`}>
                      <div className="flex items-center gap-1.5">
                        <item.icon className={`w-3.5 h-3.5 ${item.cls.split(" ")[0]}`} />
                        <span className="text-[10px] font-semibold text-muted-foreground uppercase">{item.label}</span>
                      </div>
                      <p className={`text-lg font-bold mt-0.5 ${item.cls.split(" ")[0]}`}>{item.value}</p>
                    </div>
                  ))}
                </div>

                {s.totalOrders > 0 && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                      <span>Tỷ lệ hoàn thành</span>
                      <span className="font-semibold">{Math.round((s.completed / s.totalOrders) * 100)}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500 rounded-full transition-all"
                        style={{ width: `${(s.completed / s.totalOrders) * 100}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default ManagerStores;
