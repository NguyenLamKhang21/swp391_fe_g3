import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  Package,
  Search,
  RefreshCw,
  Loader2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Scale,
  Box,
  DollarSign,
  CalendarClock,
  Plus,
  Pencil,
  Trash2,
  X,
  Save,
  Clock,
  ShieldAlert,
  ArrowDownCircle,
} from "lucide-react";
import { toast } from "react-toastify";
import {
  getCentralKitchenFood,
  createCentralFood,
  updateCentralFood,
  deleteCentralFood,
  getCentralFoodByStatus,
  getCentralFoodExpiringSoon,
  getCentralFoodExpired,
  decreaseFoodBaseOnOrder,
} from "../api/authAPI";

/* ══════════════════════════════════════════════════════════════════════
   Status helpers
   ══════════════════════════════════════════════════════════════════════ */
const STATUS_CFG = {
  AVAILABLE: {
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    icon: CheckCircle,
    label: "Còn hàng",
  },
  OUT_OF_STOCK: {
    color: "text-red-600",
    bg: "bg-red-50",
    border: "border-red-200",
    icon: XCircle,
    label: "Hết hàng",
  },
};

const statusStyle = (s) =>
  STATUS_CFG[s] ?? {
    color: "text-gray-600",
    bg: "bg-gray-50",
    border: "border-gray-200",
    icon: AlertCircle,
    label: s,
  };

const fmt = (n) =>
  n != null
    ? new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n)
    : "—";

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("vi-VN") : "—");

/* ══════════════════════════════════════════════════════════════════════
   Component
   ══════════════════════════════════════════════════════════════════════ */
const EMPTY_FORM = {
  foodName: "",
  amount: 0,
  expiryDate: "",
  manufacturingDate: "",
  centralFoodStatus: "AVAILABLE",
  unitPriceFood: 0,
  weight: 0,
  length: 0,
  width: 0,
  height: 0,
  recipeId: "",
  centralFoodTypeId: "",
};

const TABS = [
  { key: "ALL",           label: "Tất cả",       icon: Package,      color: "text-primary" },
  { key: "AVAILABLE",     label: "Còn hàng",     icon: CheckCircle,  color: "text-emerald-600" },
  { key: "OUT_OF_STOCK",  label: "Hết hàng",     icon: XCircle,      color: "text-red-600" },
  { key: "EXPIRING_SOON", label: "Sắp hết hạn",  icon: Clock,        color: "text-amber-600" },
  { key: "EXPIRED",       label: "Đã hết hạn",   icon: ShieldAlert,  color: "text-red-600" },
];

const CentralKitchenInventory = () => {
  const [foods, setFoods]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selected, setSelected]     = useState(null);
  const [activeTab, setActiveTab]   = useState("ALL");

  const [showForm, setShowForm]     = useState(false);
  const [editingFood, setEditingFood] = useState(null);
  const [formData, setFormData]     = useState({ ...EMPTY_FORM });
  const [saving, setSaving]         = useState(false);
  const [deleting, setDeleting]     = useState(null);

  const [showDecrease, setShowDecrease] = useState(false);
  const [decreaseOrderId, setDecreaseOrderId] = useState("");
  const [decreasing, setDecreasing] = useState(false);

  const [expiringDays, setExpiringDays] = useState(7);

  const [expiringSoonCount, setExpiringSoonCount] = useState(0);
  const [expiredCount, setExpiredCount] = useState(0);

  /* ── Fetch based on active tab ── */
  const fetchFoods = useCallback(async () => {
    try {
      setLoading(true);
      let res;
      switch (activeTab) {
        case "AVAILABLE":
        case "OUT_OF_STOCK":
          res = await getCentralFoodByStatus(activeTab);
          break;
        case "EXPIRING_SOON":
          res = await getCentralFoodExpiringSoon(expiringDays);
          break;
        case "EXPIRED":
          res = await getCentralFoodExpired();
          break;
        default:
          res = await getCentralKitchenFood();
      }
      const data = res.data?.data ?? res.data ?? [];
      setFoods(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Không thể tải danh sách thực phẩm.");
    } finally {
      setLoading(false);
    }
  }, [activeTab, expiringDays]);

  const fetchBadgeCounts = useCallback(async () => {
    try {
      const [soonRes, expRes] = await Promise.all([
        getCentralFoodExpiringSoon(7),
        getCentralFoodExpired(),
      ]);
      const soonData = soonRes.data?.data ?? soonRes.data ?? [];
      const expData  = expRes.data?.data ?? expRes.data ?? [];
      setExpiringSoonCount(Array.isArray(soonData) ? soonData.length : 0);
      setExpiredCount(Array.isArray(expData) ? expData.length : 0);
    } catch { /* silent */ }
  }, []);

  useEffect(() => { fetchFoods(); }, [fetchFoods]);
  useEffect(() => { fetchBadgeCounts(); }, [fetchBadgeCounts]);

  /* ── Open create/edit form ── */
  const openCreateForm = () => {
    setEditingFood(null);
    setFormData({ ...EMPTY_FORM });
    setShowForm(true);
  };

  const openEditForm = (food) => {
    setEditingFood(food);
    setFormData({
      foodName: food.foodName ?? "",
      amount: food.amount ?? 0,
      expiryDate: food.expiryDate ?? "",
      manufacturingDate: food.manufacturingDate ?? "",
      centralFoodStatus: food.centralFoodStatus ?? "AVAILABLE",
      unitPriceFood: food.unitPriceFood ?? 0,
      weight: food.weight ?? 0,
      length: food.length ?? 0,
      width: food.width ?? 0,
      height: food.height ?? 0,
      recipeId: food.recipeId ?? "",
      centralFoodTypeId: food.centralFoodTypeId ?? "",
    });
    setSelected(null);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingFood(null);
    setFormData({ ...EMPTY_FORM });
  };

  const handleFormChange = (e) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? Number(value) : value,
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.foodName.trim()) {
      toast.warn("Vui lòng nhập tên thực phẩm.");
      return;
    }
    try {
      setSaving(true);
      if (editingFood) {
        await updateCentralFood(editingFood.foodId, formData);
        toast.success(`Đã cập nhật "${formData.foodName}".`);
      } else {
        await createCentralFood(formData);
        toast.success(`Đã thêm "${formData.foodName}".`);
      }
      closeForm();
      await fetchFoods();
      fetchBadgeCounts();
    } catch (err) {
      toast.error(err?.response?.data?.message ?? "Lưu thất bại.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (food) => {
    if (!window.confirm(`Bạn chắc chắn muốn xóa "${food.foodName}"?`)) return;
    try {
      setDeleting(food.foodId);
      await deleteCentralFood(food.foodId);
      toast.success(`Đã xóa "${food.foodName}".`);
      if (selected?.foodId === food.foodId) setSelected(null);
      await fetchFoods();
      fetchBadgeCounts();
    } catch (err) {
      toast.error(err?.response?.data?.message ?? "Xóa thất bại.");
    } finally {
      setDeleting(null);
    }
  };

  /* ── Decrease stock by order ── */
  const handleDecreaseStock = async (e) => {
    e.preventDefault();
    if (!decreaseOrderId.trim()) {
      toast.warn("Vui lòng nhập Order ID.");
      return;
    }
    try {
      setDecreasing(true);
      const res = await decreaseFoodBaseOnOrder(decreaseOrderId.trim());
      const result = res.data?.data ?? res.data;
      const count = result?.decreasedFoods?.length ?? 0;
      toast.success(`Đã trừ kho thành công (${count} sản phẩm bị trừ).`);
      setShowDecrease(false);
      setDecreaseOrderId("");
      await fetchFoods();
      fetchBadgeCounts();
    } catch (err) {
      toast.error(err?.response?.data?.message ?? "Trừ kho thất bại.");
    } finally {
      setDecreasing(false);
    }
  };

  /* ── Filter ── */
  const filtered = foods.filter((f) => {
    const term = searchTerm.toLowerCase();
    return (
      (f.foodId?.toLowerCase()   ?? "").includes(term) ||
      (f.foodName?.toLowerCase() ?? "").includes(term)
    );
  });

  /* ── Stats (computed from filtered list when on a specific tab) ── */
  const total     = filtered.length;
  const available = filtered.filter((f) => f.centralFoodStatus === "AVAILABLE").length;
  const totalAmt  = filtered.reduce((s, f) => s + (f.amount ?? 0), 0);

  /* ═══════════════════ RENDER ═══════════════════ */
  return (
    <div className="animate-fade-in space-y-6">

      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Inventory Management</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Quản lý kho thực phẩm của Central Kitchen.
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20">
          <Package className="w-4 h-4 text-primary" />
          <span className="text-xs font-semibold text-primary">Central Kitchen Stock</span>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: "Tổng sản phẩm",  value: total,             variant: "stat-card-blue",   icon: Package     },
          { label: "Còn hàng",       value: available,          variant: "stat-card-green",  icon: CheckCircle },
          { label: "Tổng số lượng",  value: totalAmt,           variant: "stat-card-purple", icon: Scale       },
          { label: "Sắp hết hạn",    value: expiringSoonCount,  variant: "stat-card-orange", icon: Clock       },
          { label: "Đã hết hạn",     value: expiredCount,       variant: "stat-card-red",    icon: ShieldAlert },
        ].map((s) => (
          <div key={s.label} className={`stat-card rounded-xl p-4 ${s.variant}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">{s.label}</p>
                <p className="text-2xl font-bold text-foreground mt-1">{s.value}</p>
              </div>
              <div className="stat-card-icon w-10 h-10 rounded-xl flex items-center justify-center">
                <s.icon className="w-5 h-5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Filter Tabs ── */}
      <div className="flex items-center gap-1 flex-wrap bg-muted/30 rounded-xl p-1.5 border border-border">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          const badge = tab.key === "EXPIRING_SOON" ? expiringSoonCount
                      : tab.key === "EXPIRED" ? expiredCount : null;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                isActive
                  ? "bg-background shadow-sm border border-border text-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-background/50"
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? tab.color : ""}`} />
              {tab.label}
              {badge != null && badge > 0 && (
                <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold leading-none ${
                  tab.key === "EXPIRED" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
                }`}>
                  {badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Expiring-soon days selector ── */}
      {activeTab === "EXPIRING_SOON" && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200">
          <Clock className="w-4 h-4 text-amber-600 flex-shrink-0" />
          <span className="text-sm text-amber-800 font-medium">Hiển thị thực phẩm hết hạn trong</span>
          <select
            value={expiringDays}
            onChange={(e) => setExpiringDays(Number(e.target.value))}
            className="um-input py-1 px-2 text-sm w-20"
          >
            {[3, 5, 7, 14, 30].map((d) => (
              <option key={d} value={d}>{d} ngày</option>
            ))}
          </select>
        </div>
      )}

      {/* ── Search + Actions ── */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Tìm tên hoặc mã thực phẩm..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="um-input pl-10 w-full"
          />
        </div>
        <button
          onClick={() => { fetchFoods(); fetchBadgeCounts(); }}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-background text-foreground text-sm font-medium hover:bg-muted transition-colors disabled:opacity-60"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Làm mới
        </button>
        <button
          onClick={() => setShowDecrease(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-amber-300 bg-amber-50 text-amber-700 text-sm font-semibold hover:bg-amber-100 transition-colors"
        >
          <ArrowDownCircle className="w-4 h-4" />
          Trừ kho theo đơn
        </button>
        <button
          onClick={openCreateForm}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Thêm thực phẩm
        </button>
      </div>

      {/* ── Table ── */}
      {loading ? (
        <div className="admin-card rounded-xl p-12 flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-sm text-muted-foreground">Đang tải kho thực phẩm...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="admin-card rounded-xl p-12 flex flex-col items-center gap-4 text-center">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
            <Package className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-base font-semibold text-foreground">Không có thực phẩm nào</p>
          <p className="text-sm text-muted-foreground">
            {searchTerm ? "Không tìm thấy kết quả." : "Kho hiện không có thực phẩm nào."}
          </p>
        </div>
      ) : (
        <div className="admin-card rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-border flex items-center justify-between">
            <h3 className="text-base font-semibold text-foreground">Danh sách thực phẩm</h3>
            <span className="badge badge-delivered">{filtered.length} sản phẩm</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="admin-table-header">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Mã SP</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tên thực phẩm</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Số lượng</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Đơn giá</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">NSX / HSD</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">Trạng thái</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">Chi tiết</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((f) => {
                  const st    = statusStyle(f.centralFoodStatus);
                  const StIcon = st.icon;
                  return (
                    <tr key={f.foodId} className="admin-table-row">
                      <td className="px-6 py-4 font-mono text-xs text-muted-foreground">{f.foodId}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full admin-avatar flex items-center justify-center text-primary-foreground text-xs font-bold flex-shrink-0">
                            <Package className="w-4 h-4" />
                          </div>
                          <p className="font-medium text-foreground">{f.foodName}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right font-semibold text-foreground">{f.amount ?? "—"}</td>
                      <td className="px-6 py-4 text-right text-foreground">{fmt(f.unitPriceFood)}</td>
                      <td className="px-6 py-4">
                        <p className="text-xs text-muted-foreground">NSX: {fmtDate(f.manufacturingDate)}</p>
                        <p className="text-xs text-foreground font-medium">HSD: {fmtDate(f.expiryDate)}</p>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${st.bg} ${st.color} ${st.border}`}>
                          <StIcon className="w-3.5 h-3.5" />
                          {st.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setSelected(f)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                          >
                            <Box className="w-3.5 h-3.5" />
                            Xem
                          </button>
                          <button
                            onClick={() => openEditForm(f)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 transition-colors"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            Sửa
                          </button>
                          <button
                            onClick={() => handleDelete(f)}
                            disabled={deleting === f.foodId}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 transition-colors disabled:opacity-50"
                          >
                            {deleting === f.foodId
                              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              : <Trash2 className="w-3.5 h-3.5" />
                            }
                            Xóa
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ══════════════════ DETAIL MODAL ══════════════════ */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSelected(null)} />

          <div className="relative bg-background border border-border rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-background z-10 px-6 py-4 border-b border-border flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-foreground">{selected.foodName}</h3>
                <p className="text-xs text-muted-foreground mt-0.5 font-mono">{selected.foodId}</p>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground text-xl leading-none"
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              {/* Status */}
              {(() => {
                const st = statusStyle(selected.centralFoodStatus);
                const StIcon = st.icon;
                return (
                  <div className={`rounded-xl p-3 border ${st.border} ${st.bg} flex items-center gap-3`}>
                    <StIcon className={`w-5 h-5 ${st.color}`} />
                    <p className={`text-sm font-semibold ${st.color}`}>{st.label}</p>
                  </div>
                );
              })()}

              {/* Fields grid */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Số lượng",      value: selected.amount,           icon: Package      },
                  { label: "Đơn giá",        value: fmt(selected.unitPriceFood), icon: DollarSign },
                  { label: "Khối lượng (g)", value: selected.weight,           icon: Scale        },
                  { label: "NSX",            value: fmtDate(selected.manufacturingDate), icon: CalendarClock },
                  { label: "HSD",            value: fmtDate(selected.expiryDate),         icon: CalendarClock },
                ].map(({ label, value, icon: Icon }) => (
                  <div key={label} className="bg-muted/50 rounded-lg p-3 flex items-start gap-2">
                    <Icon className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{label}</p>
                      <p className="text-sm font-medium text-foreground mt-0.5">{value ?? "—"}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Dimensions */}
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Kích thước (cm)</p>
                <div className="flex gap-4 text-sm text-foreground">
                  <span>D: <strong>{selected.length ?? "—"}</strong></span>
                  <span>R: <strong>{selected.width ?? "—"}</strong></span>
                  <span>C: <strong>{selected.height ?? "—"}</strong></span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => openEditForm(selected)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 text-sm font-semibold hover:bg-amber-100 transition-colors"
                >
                  <Pencil className="w-4 h-4" />
                  Chỉnh sửa
                </button>
                <button
                  onClick={() => { handleDelete(selected); }}
                  disabled={deleting === selected.foodId}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-red-50 text-red-600 border border-red-200 text-sm font-semibold hover:bg-red-100 transition-colors disabled:opacity-50"
                >
                  {deleting === selected.foodId
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <Trash2 className="w-4 h-4" />
                  }
                  Xóa
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════ DECREASE STOCK MODAL ══════════════════ */}
      {showDecrease && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => { setShowDecrease(false); setDecreaseOrderId(""); }} />
          <div className="relative bg-background border border-border rounded-2xl shadow-2xl w-full max-w-md animate-fade-in">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ArrowDownCircle className="w-5 h-5 text-amber-600" />
                <h3 className="text-lg font-bold text-foreground">Trừ kho theo đơn hàng</h3>
              </div>
              <button onClick={() => { setShowDecrease(false); setDecreaseOrderId(""); }} className="p-2 rounded-lg hover:bg-muted transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleDecreaseStock} className="p-6 space-y-4">
              <p className="text-sm text-muted-foreground">
                Nhập mã đơn hàng để tự động trừ số lượng tồn kho dựa trên các sản phẩm trong đơn.
              </p>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Order ID <span className="text-destructive">*</span></label>
                <input
                  value={decreaseOrderId}
                  onChange={(e) => setDecreaseOrderId(e.target.value)}
                  placeholder="VD: ORD_001"
                  className="um-input w-full"
                  required
                />
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => { setShowDecrease(false); setDecreaseOrderId(""); }} className="px-4 py-2.5 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors">
                  Hủy
                </button>
                <button type="submit" disabled={decreasing} className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-amber-600 text-white text-sm font-semibold hover:bg-amber-700 transition-colors disabled:opacity-60">
                  {decreasing ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowDownCircle className="w-4 h-4" />}
                  Trừ kho
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ══════════════════ CREATE / EDIT FORM MODAL ══════════════════ */}
      {showForm && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={closeForm} />

          <div className="relative bg-background border border-border rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col animate-fade-in">
            <div className="flex-shrink-0 px-6 py-4 border-b border-border flex items-center justify-between">
              <h3 className="text-lg font-bold text-foreground">
                {editingFood ? `Chỉnh sửa — ${editingFood.foodId}` : "Thêm thực phẩm mới"}
              </h3>
              <button onClick={closeForm} className="p-2 rounded-lg hover:bg-muted transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-sm font-medium text-foreground">Tên thực phẩm <span className="text-destructive">*</span></label>
                  <input name="foodName" value={formData.foodName} onChange={handleFormChange} placeholder="VD: Burger Bò" className="um-input w-full" required />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Số lượng</label>
                  <input name="amount" type="number" min="0" value={formData.amount} onChange={handleFormChange} className="um-input w-full" />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Đơn giá (VND)</label>
                  <input name="unitPriceFood" type="number" min="0" value={formData.unitPriceFood} onChange={handleFormChange} className="um-input w-full" />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Ngày sản xuất</label>
                  <input name="manufacturingDate" type="date" value={formData.manufacturingDate} onChange={handleFormChange} className="um-input w-full" />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Hạn sử dụng</label>
                  <input name="expiryDate" type="date" value={formData.expiryDate} onChange={handleFormChange} className="um-input w-full" />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Trạng thái</label>
                  <select name="centralFoodStatus" value={formData.centralFoodStatus} onChange={handleFormChange} className="um-input w-full">
                    <option value="AVAILABLE">Còn hàng</option>
                    <option value="OUT_OF_STOCK">Hết hàng</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Khối lượng (g)</label>
                  <input name="weight" type="number" min="0" value={formData.weight} onChange={handleFormChange} className="um-input w-full" />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Dài (cm)</label>
                  <input name="length" type="number" min="0" value={formData.length} onChange={handleFormChange} className="um-input w-full" />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Rộng (cm)</label>
                  <input name="width" type="number" min="0" value={formData.width} onChange={handleFormChange} className="um-input w-full" />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Cao (cm)</label>
                  <input name="height" type="number" min="0" value={formData.height} onChange={handleFormChange} className="um-input w-full" />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Recipe ID</label>
                  <input name="recipeId" value={formData.recipeId} onChange={handleFormChange} placeholder="(tùy chọn)" className="um-input w-full" />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Loại thực phẩm (Type ID)</label>
                  <input name="centralFoodTypeId" value={formData.centralFoodTypeId} onChange={handleFormChange} placeholder="(tùy chọn)" className="um-input w-full" />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={closeForm} className="px-4 py-2.5 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors">
                  Hủy
                </button>
                <button type="submit" disabled={saving} className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-colors disabled:opacity-60">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {editingFood ? "Cập nhật" : "Tạo mới"}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default CentralKitchenInventory;
