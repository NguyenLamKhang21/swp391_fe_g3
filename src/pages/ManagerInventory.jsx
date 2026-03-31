import { useState, useEffect } from "react";
import {
  Package, Loader2, Search, RefreshCw, CheckCircle,
  XCircle, AlertTriangle, Filter,
} from "lucide-react";
import { toast } from "react-toastify";
import {
  getCentralKitchenFood, getCentralFoodExpiringSoon, getCentralFoodExpired,
} from "../api/authAPI";

const TABS = [
  { key: "ALL",      label: "Tất cả" },
  { key: "IN_STOCK", label: "Còn hàng" },
  { key: "OUT",      label: "Hết hàng" },
  { key: "EXPIRING", label: "Sắp hết hạn" },
  { key: "EXPIRED",  label: "Đã hết hạn" },
];

const ManagerInventory = () => {
  const [foods, setFoods]           = useState([]);
  const [expiring, setExpiring]     = useState([]);
  const [expired, setExpired]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab]   = useState("ALL");

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [foodRes, expRes, expiredRes] = await Promise.allSettled([
        getCentralKitchenFood(),
        getCentralFoodExpiringSoon(7),
        getCentralFoodExpired(),
      ]);
      if (foodRes.status === "fulfilled") {
        const f = foodRes.value.data?.data ?? foodRes.value.data ?? [];
        setFoods(Array.isArray(f) ? f : []);
      }
      if (expRes.status === "fulfilled") {
        const e = expRes.value.data?.data ?? expRes.value.data ?? [];
        setExpiring(Array.isArray(e) ? e : []);
      }
      if (expiredRes.status === "fulfilled") {
        const e = expiredRes.value.data?.data ?? expiredRes.value.data ?? [];
        setExpired(Array.isArray(e) ? e : []);
      }
    } catch {
      toast.error("Không thể tải dữ liệu tồn kho.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const expiringIds = new Set(expiring.map((f) => f.foodId));
  const expiredIds  = new Set(expired.map((f) => f.foodId));

  const getFiltered = () => {
    let list = foods;
    if (activeTab === "IN_STOCK")  list = foods.filter((f) => (f.amount ?? 0) > 0);
    if (activeTab === "OUT")       list = foods.filter((f) => (f.amount ?? 0) <= 0);
    if (activeTab === "EXPIRING")  list = expiring;
    if (activeTab === "EXPIRED")   list = expired;

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      list = list.filter((f) =>
        (f.foodName ?? "").toLowerCase().includes(term) ||
        (f.foodId ?? "").toLowerCase().includes(term)
      );
    }
    return list;
  };

  const filtered = getFiltered();
  const inStock = foods.filter((f) => (f.amount ?? 0) > 0).length;
  const outOfStock = foods.length - inStock;

  const getStatusBadge = (food) => {
    if (expiredIds.has(food.foodId))  return <span className="badge badge-cancelled">Hết hạn</span>;
    if (expiringIds.has(food.foodId)) return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700">Sắp hết hạn</span>;
    if ((food.amount ?? 0) <= 0)      return <span className="badge badge-cancelled">Hết hàng</span>;
    return <span className="badge badge-delivered">Còn hàng</span>;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Quản lý tồn kho</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Theo dõi tồn kho bếp trung tâm</p>
        </div>
        <button
          onClick={fetchAll} disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border bg-background text-foreground text-sm font-medium hover:bg-muted transition-colors disabled:opacity-60"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Làm mới
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        {[
          { label: "Tổng sản phẩm", value: foods.length, icon: Package, color: "stat-card-blue" },
          { label: "Còn hàng",      value: inStock, icon: CheckCircle, color: "stat-card-green" },
          { label: "Hết hàng",      value: outOfStock, icon: XCircle, color: "stat-card-red" },
          { label: "Sắp hết hạn",   value: expiring.length, icon: AlertTriangle, color: "stat-card-orange" },
          { label: "Đã hết hạn",    value: expired.length, icon: XCircle, color: "stat-card-red" },
        ].map((s) => (
          <div key={s.label} className={`stat-card rounded-2xl p-4 flex flex-col gap-2 ${s.color}`}>
            <div className="stat-card-icon w-9 h-9 rounded-lg flex items-center justify-center">
              <s.icon className="w-4 h-4" />
            </div>
            <p className="text-xl font-bold text-foreground">{s.value}</p>
            <p className="text-xs font-medium text-foreground/80">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs + Search */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-1 bg-muted rounded-lg p-1 overflow-x-auto">
          {TABS.map((t) => {
            let count = foods.length;
            if (t.key === "IN_STOCK") count = inStock;
            if (t.key === "OUT")      count = outOfStock;
            if (t.key === "EXPIRING") count = expiring.length;
            if (t.key === "EXPIRED")  count = expired.length;
            return (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  activeTab === t.key
                    ? "bg-primary text-primary-foreground shadow"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t.label}
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] leading-none font-bold ${
                  activeTab === t.key
                    ? "bg-primary-foreground/20 text-primary-foreground"
                    : "bg-foreground/10 text-muted-foreground"
                }`}>{count}</span>
              </button>
            );
          })}
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input
            type="text" placeholder="Tìm sản phẩm..."
            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            className="um-input pl-10 w-56"
          />
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="admin-card rounded-2xl p-12 flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-sm text-muted-foreground">Đang tải...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="admin-card rounded-2xl p-12 flex flex-col items-center gap-4 text-center">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
            <Package className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-base font-semibold text-foreground">Không tìm thấy sản phẩm</p>
        </div>
      ) : (
        <div className="admin-card rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-border flex items-center justify-between">
            <h3 className="text-base font-semibold text-foreground">
              {TABS.find((t) => t.key === activeTab)?.label ?? "Tồn kho"}
            </h3>
            <span className="badge badge-delivered">{filtered.length} sản phẩm</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="admin-table-header">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tên sản phẩm</th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tồn kho</th>
                  <th className="text-center px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Trạng thái</th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Đơn vị</th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Hạn dùng</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((f, idx) => (
                  <tr key={f.foodId ?? idx} className="admin-table-row" style={{ animationDelay: `${idx * 30}ms` }}>
                    <td className="px-6 py-3 font-medium text-foreground">{f.foodName ?? "—"}</td>
                    <td className="px-6 py-3 text-right font-semibold text-foreground">{f.amount ?? 0}</td>
                    <td className="px-6 py-3 text-center">{getStatusBadge(f)}</td>
                    <td className="px-6 py-3 text-right text-muted-foreground hidden md:table-cell">{f.unit ?? "—"}</td>
                    <td className="px-6 py-3 text-right text-muted-foreground hidden lg:table-cell">{f.expiryDate ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerInventory;
