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
  Pencil,
  Trash2,
  X,
  Save,
  Plus,
} from "lucide-react";
import { toast } from "react-toastify";
import { getCentralKitchenFood, createCentralFood, updateCentralFood, deleteCentralFood } from "../api/authAPI";

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
  foodName: "", amount: 0, expiryDate: "", manufacturingDate: "",
  centralFoodStatus: "AVAILABLE", unitPriceFood: 0,
  weight: 0, length: 0, width: 0, height: 0,
  recipeId: "", centralFoodTypeId: "",
};

const toInputDate = (d) => {
  if (!d) return "";
  const date = new Date(d);
  if (isNaN(date)) return "";
  return date.toISOString().slice(0, 10);
};

const CentralKitchenInventory = () => {
  const [foods, setFoods]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selected, setSelected]     = useState(null);

  const [editItem, setEditItem]       = useState(null);
  const [editForm, setEditForm]       = useState(EMPTY_FORM);
  const [editLoading, setEditLoading] = useState(false);

  const [showCreate, setShowCreate]       = useState(false);
  const [createForm, setCreateForm]       = useState(EMPTY_FORM);
  const [createLoading, setCreateLoading] = useState(false);

  const [deleteItem, setDeleteItem]       = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  /* ── Fetch ── */
  const fetchFoods = useCallback(async () => {
    try {
      setLoading(true);
      const res  = await getCentralKitchenFood();
      const data = res.data?.data ?? res.data ?? [];
      setFoods(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Không thể tải danh sách thực phẩm.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchFoods(); }, [fetchFoods]);

  /* ── Create ── */
  const handleCreateChange = (field, value) => {
    setCreateForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleCreateSave = async () => {
    if (!createForm.foodName.trim()) {
      toast.warn("Vui lòng nhập tên thực phẩm.");
      return;
    }
    try {
      setCreateLoading(true);
      await createCentralFood(createForm);
      toast.success(`Đã thêm "${createForm.foodName}" thành công.`);
      setShowCreate(false);
      setCreateForm(EMPTY_FORM);
      await fetchFoods();
    } catch (err) {
      toast.error(err?.response?.data?.message ?? "Không thể thêm thực phẩm.");
    } finally {
      setCreateLoading(false);
    }
  };

  /* ── Edit ── */
  const openEdit = (food) => {
    setEditItem(food);
    setEditForm({
      foodName: food.foodName ?? "",
      amount: food.amount ?? 0,
      expiryDate: toInputDate(food.expiryDate),
      manufacturingDate: toInputDate(food.manufacturingDate),
      centralFoodStatus: food.centralFoodStatus ?? "AVAILABLE",
      unitPriceFood: food.unitPriceFood ?? 0,
      weight: food.weight ?? 0,
      length: food.length ?? 0,
      width: food.width ?? 0,
      height: food.height ?? 0,
      recipeId: food.recipeId ?? "",
      centralFoodTypeId: food.centralFoodTypeId ?? food.centralFoodType?.centralFoodCategoryId ?? "",
    });
  };

  const handleEditChange = (field, value) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleEditSave = async () => {
    if (!editItem) return;
    try {
      setEditLoading(true);
      await updateCentralFood(editItem.foodId, editForm);
      toast.success(`Đã cập nhật "${editForm.foodName}" thành công.`);
      setEditItem(null);
      setSelected(null);
      await fetchFoods();
    } catch (err) {
      toast.error(err?.response?.data?.message ?? "Không thể cập nhật thực phẩm.");
    } finally {
      setEditLoading(false);
    }
  };

  /* ── Delete ── */
  const handleDelete = async () => {
    if (!deleteItem) return;
    try {
      setDeleteLoading(true);
      await deleteCentralFood(deleteItem.foodId);
      toast.success(`Đã xóa "${deleteItem.foodName}" thành công.`);
      setDeleteItem(null);
      setSelected(null);
      await fetchFoods();
    } catch (err) {
      toast.error(err?.response?.data?.message ?? "Không thể xóa thực phẩm.");
    } finally {
      setDeleteLoading(false);
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

  /* ── Stats ── */
  const total     = foods.length;
  const available = foods.filter((f) => f.centralFoodStatus === "AVAILABLE").length;
  const totalAmt  = foods.reduce((s, f) => s + (f.amount ?? 0), 0);

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
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[
          { label: "Tổng sản phẩm", value: total,     variant: "stat-card-blue",   icon: Package     },
          { label: "Còn hàng",      value: available,  variant: "stat-card-green",  icon: CheckCircle },
          { label: "Tổng số lượng", value: totalAmt,   variant: "stat-card-purple", icon: Scale       },
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

      {/* ── Search + Refresh ── */}
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
          onClick={fetchFoods}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-background text-foreground text-sm font-medium hover:bg-muted transition-colors disabled:opacity-60"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Làm mới
        </button>
        <button
          onClick={() => { setCreateForm(EMPTY_FORM); setShowCreate(true); }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 active:scale-[0.98] transition-all"
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
                            onClick={() => openEdit(f)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 transition-colors"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteItem(f)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-red-500/10 text-red-600 hover:bg-red-500/20 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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
              {/* Status + Action buttons */}
              <div className="flex items-center justify-between gap-3">
                {(() => {
                  const st = statusStyle(selected.centralFoodStatus);
                  const StIcon = st.icon;
                  return (
                    <div className={`rounded-xl p-3 border ${st.border} ${st.bg} flex items-center gap-3 flex-1`}>
                      <StIcon className={`w-5 h-5 ${st.color}`} />
                      <p className={`text-sm font-semibold ${st.color}`}>{st.label}</p>
                    </div>
                  );
                })()}
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => { setSelected(null); openEdit(selected); }}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    Sửa
                  </button>
                  <button
                    onClick={() => { setSelected(null); setDeleteItem(selected); }}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-red-500/10 text-red-600 hover:bg-red-500/20 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Xóa
                  </button>
                </div>
              </div>

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
            </div>
          </div>
        </div>
      )}
      {/* ══════════════════ CREATE MODAL ══════════════════ */}
      {showCreate && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowCreate(false)} />
          <div className="relative bg-background border border-border rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col animate-fade-in">
            <div className="flex-shrink-0 px-5 py-3 border-b border-border flex items-center justify-between">
              <h3 className="text-base font-bold text-foreground">Thêm thực phẩm mới</h3>
              <button onClick={() => setShowCreate(false)} className="p-2 rounded-lg bg-muted hover:bg-destructive hover:text-destructive-foreground transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Tên thực phẩm *</label>
                <input type="text" value={createForm.foodName} onChange={(e) => handleCreateChange("foodName", e.target.value)}
                  className="um-input w-full" placeholder="Nhập tên thực phẩm" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Số lượng</label>
                  <input type="number" min="0" value={createForm.amount} onChange={(e) => handleCreateChange("amount", Number(e.target.value))}
                    className="um-input w-full" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Đơn giá (VND)</label>
                  <input type="number" min="0" value={createForm.unitPriceFood} onChange={(e) => handleCreateChange("unitPriceFood", Number(e.target.value))}
                    className="um-input w-full" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Ngày sản xuất</label>
                  <input type="date" value={createForm.manufacturingDate} onChange={(e) => handleCreateChange("manufacturingDate", e.target.value)}
                    className="um-input w-full" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Hạn sử dụng</label>
                  <input type="date" value={createForm.expiryDate} onChange={(e) => handleCreateChange("expiryDate", e.target.value)}
                    className="um-input w-full" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Trạng thái</label>
                <select value={createForm.centralFoodStatus} onChange={(e) => handleCreateChange("centralFoodStatus", e.target.value)}
                  className="um-input w-full">
                  <option value="AVAILABLE">Còn hàng</option>
                  <option value="OUT_OF_STOCK">Hết hàng</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Khối lượng (g)</label>
                  <input type="number" min="0" value={createForm.weight} onChange={(e) => handleCreateChange("weight", Number(e.target.value))}
                    className="um-input w-full" />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">D (cm)</label>
                    <input type="number" min="0" value={createForm.length} onChange={(e) => handleCreateChange("length", Number(e.target.value))}
                      className="um-input w-full" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">R (cm)</label>
                    <input type="number" min="0" value={createForm.width} onChange={(e) => handleCreateChange("width", Number(e.target.value))}
                      className="um-input w-full" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">C (cm)</label>
                    <input type="number" min="0" value={createForm.height} onChange={(e) => handleCreateChange("height", Number(e.target.value))}
                      className="um-input w-full" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Recipe ID</label>
                  <input type="text" value={createForm.recipeId} onChange={(e) => handleCreateChange("recipeId", e.target.value)}
                    className="um-input w-full" placeholder="(Tùy chọn)" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Food Type ID</label>
                  <input type="text" value={createForm.centralFoodTypeId} onChange={(e) => handleCreateChange("centralFoodTypeId", e.target.value)}
                    className="um-input w-full" placeholder="(Tùy chọn)" />
                </div>
              </div>
            </div>

            <div className="flex-shrink-0 px-5 py-3 border-t border-border flex items-center justify-end gap-3">
              <button onClick={() => setShowCreate(false)}
                className="px-4 py-2 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors">
                Hủy
              </button>
              <button onClick={handleCreateSave} disabled={createLoading}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-60">
                {createLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Thêm
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ══════════════════ EDIT MODAL ══════════════════ */}
      {editItem && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setEditItem(null)} />
          <div className="relative bg-background border border-border rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col animate-fade-in">
            <div className="flex-shrink-0 px-5 py-3 border-b border-border flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-foreground">Chỉnh sửa thực phẩm</h3>
                <p className="text-xs text-muted-foreground mt-0.5 font-mono">{editItem.foodId}</p>
              </div>
              <button onClick={() => setEditItem(null)} className="p-2 rounded-lg bg-muted hover:bg-destructive hover:text-destructive-foreground transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Tên thực phẩm</label>
                <input type="text" value={editForm.foodName} onChange={(e) => handleEditChange("foodName", e.target.value)}
                  className="um-input w-full" placeholder="Tên thực phẩm" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Số lượng</label>
                  <input type="number" min="0" value={editForm.amount} onChange={(e) => handleEditChange("amount", Number(e.target.value))}
                    className="um-input w-full" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Đơn giá (VND)</label>
                  <input type="number" min="0" value={editForm.unitPriceFood} onChange={(e) => handleEditChange("unitPriceFood", Number(e.target.value))}
                    className="um-input w-full" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Ngày sản xuất</label>
                  <input type="date" value={editForm.manufacturingDate} onChange={(e) => handleEditChange("manufacturingDate", e.target.value)}
                    className="um-input w-full" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Hạn sử dụng</label>
                  <input type="date" value={editForm.expiryDate} onChange={(e) => handleEditChange("expiryDate", e.target.value)}
                    className="um-input w-full" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Trạng thái</label>
                <select value={editForm.centralFoodStatus} onChange={(e) => handleEditChange("centralFoodStatus", e.target.value)}
                  className="um-input w-full">
                  <option value="AVAILABLE">Còn hàng</option>
                  <option value="OUT_OF_STOCK">Hết hàng</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Khối lượng (g)</label>
                  <input type="number" min="0" value={editForm.weight} onChange={(e) => handleEditChange("weight", Number(e.target.value))}
                    className="um-input w-full" />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">D (cm)</label>
                    <input type="number" min="0" value={editForm.length} onChange={(e) => handleEditChange("length", Number(e.target.value))}
                      className="um-input w-full" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">R (cm)</label>
                    <input type="number" min="0" value={editForm.width} onChange={(e) => handleEditChange("width", Number(e.target.value))}
                      className="um-input w-full" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">C (cm)</label>
                    <input type="number" min="0" value={editForm.height} onChange={(e) => handleEditChange("height", Number(e.target.value))}
                      className="um-input w-full" />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-shrink-0 px-5 py-3 border-t border-border flex items-center justify-end gap-3">
              <button onClick={() => setEditItem(null)}
                className="px-4 py-2 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors">
                Hủy
              </button>
              <button onClick={handleEditSave} disabled={editLoading}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-60">
                {editLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Lưu thay đổi
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ══════════════════ DELETE CONFIRM ══════════════════ */}
      {deleteItem && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setDeleteItem(null)} />
          <div className="relative bg-background border border-border rounded-2xl shadow-2xl w-full max-w-sm animate-fade-in">
            <div className="p-6 text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-red-50 border border-red-200 flex items-center justify-center mx-auto">
                <Trash2 className="w-7 h-7 text-red-500" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">Xóa thực phẩm?</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Bạn có chắc muốn xóa <strong className="text-foreground">{deleteItem.foodName}</strong>?
                  Hành động này không thể hoàn tác.
                </p>
              </div>
              <div className="flex gap-3 justify-center pt-2">
                <button onClick={() => setDeleteItem(null)}
                  className="px-4 py-2 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors">
                  Hủy
                </button>
                <button onClick={handleDelete} disabled={deleteLoading}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 active:scale-[0.98] transition-all disabled:opacity-60">
                  {deleteLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  Xóa
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default CentralKitchenInventory;
