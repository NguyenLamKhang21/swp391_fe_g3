import { useState, useEffect, useCallback } from "react";
import {
  ChefHat, CheckCircle, Clock, Loader2, RefreshCw, Search,
  Package, XCircle, AlertCircle, MessageSquare, FileText,
  ArrowRight, Factory, Warehouse,
} from "lucide-react";
import { toast } from "react-toastify";
import { getAllBatches, updateBatchStatus, increaseFoodBasedOnBatch } from "../api/authAPI";

/* ═══════════════════════════════════════════════════════════════════════
   Status config — batch statuses
   ═══════════════════════════════════════════════════════════════════════ */
const BATCH_STATUSES = ["DRAFT", "SENT", "IN_PRODUCTION", "PRODUCTION_COMPLETED", "CANCELLED"];

const STATUS_CFG = {
  DRAFT:                { color: "text-gray-600",    bg: "bg-gray-50",    border: "border-gray-200",    icon: FileText      },
  SENT:                 { color: "text-blue-600",    bg: "bg-blue-50",    border: "border-blue-200",    icon: MessageSquare },
  IN_PRODUCTION:        { color: "text-orange-600",  bg: "bg-orange-50",  border: "border-orange-200",  icon: Factory       },
  PRODUCTION_COMPLETED: { color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200", icon: CheckCircle   },
  CANCELLED:            { color: "text-red-500",     bg: "bg-red-50",     border: "border-red-200",     icon: XCircle       },
};
const statusStyle = (s) =>
  STATUS_CFG[s] ?? { color: "text-gray-600", bg: "bg-gray-50", border: "border-gray-200", icon: AlertCircle };

const STATUS_PILL = {
  DRAFT:                { active: "border-gray-400 bg-gray-100 text-gray-700",       idle: "border-border bg-muted/50 text-muted-foreground" },
  SENT:                 { active: "border-blue-400 bg-blue-50 text-blue-700",        idle: "border-border bg-muted/50 text-muted-foreground" },
  IN_PRODUCTION:        { active: "border-orange-400 bg-orange-50 text-orange-700",  idle: "border-border bg-muted/50 text-muted-foreground" },
  PRODUCTION_COMPLETED: { active: "border-emerald-400 bg-emerald-50 text-emerald-700", idle: "border-border bg-muted/50 text-muted-foreground" },
  CANCELLED:            { active: "border-red-400 bg-red-50 text-red-700",           idle: "border-border bg-muted/50 text-muted-foreground" },
};

const TABS = [
  { key: "ALL",                  label: "Tất cả" },
  { key: "DRAFT",                label: "Draft" },
  { key: "SENT",                 label: "Đã gửi" },
  { key: "IN_PRODUCTION",        label: "Đang sản xuất" },
  { key: "PRODUCTION_COMPLETED", label: "Hoàn thành" },
  { key: "CANCELLED",            label: "Đã hủy" },
];

/* ═══════════════════════════════════════════════════════════════════════
   BatchCard — self-contained, always-expanded card
   ═══════════════════════════════════════════════════════════════════════ */
const BatchCard = ({ batch, onRefresh }) => {
  const [selectedStatus, setSelectedStatus] = useState(batch.status);
  const [actionLoading, setActionLoading]   = useState(false);
  const [stockLoading, setStockLoading]     = useState(false);
  const [hasStocked, setHasStocked]         = useState(false);

  // reset picker if the batch prop status changes (after a refresh)
  useEffect(() => {
    setSelectedStatus(batch.status);
  }, [batch.status]);

  const handleStatusUpdate = async () => {
    if (selectedStatus === batch.status) return;
    try {
      setActionLoading(true);
      await updateBatchStatus(batch.batchId, selectedStatus);
      toast.success(`Batch ${batch.batchId} → ${selectedStatus}`);
      onRefresh();
    } catch (err) {
      toast.error(err?.response?.data?.message ?? "Không thể cập nhật trạng thái batch.");
    } finally {
      setActionLoading(false);
    }
  };
  //xử lí tăng số lượng đồ ăn trong kho central kitchen dựa trên batch

  const handleIncreaseStock = async () => {
    if (hasStocked) return;
    try {
      setStockLoading(true);
      await increaseFoodBasedOnBatch(batch.batchId);
      toast.success(`Đã nhập kho thành công cho batch ${batch.batchId}.`);
      setHasStocked(true);
      onRefresh();
    } catch (err) {
      toast.error(err?.response?.data?.message ?? "Không thể nhập kho. Vui lòng thử lại.");
    } finally {
      setStockLoading(false);
    }
  };

  const st = statusStyle(batch.status);
  const StIcon = st.icon;

  const fmt = (iso) => {
    if (!iso) return "—";
    try { return new Date(iso).toLocaleString("vi-VN"); } catch { return iso; }
  };

  return (
    <div className="admin-card rounded-2xl overflow-hidden animate-fade-in border border-border">

      {/* ── Card Header ── */}
      <div className="px-6 py-4 border-b border-border flex flex-wrap items-center justify-between gap-3 bg-muted/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl admin-avatar flex items-center justify-center flex-shrink-0">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">{batch.batchId}</p>
            <p className="text-xs text-muted-foreground">
              {batch.batchDate} · {batch.totalItems} items · {batch.totalTypes} loại
            </p>
          </div>
        </div>
        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${st.bg} ${st.color} ${st.border}`}>
          <StIcon className="w-3.5 h-3.5" />
          {batch.status}
        </span>
      </div>

      {/* ── Card Body ── */}
      <div className="px-6 py-5 space-y-5">

        {/* Section 1: Info grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {[
            { label: "Batch ID",    value: batch.batchId },
            { label: "Ngày batch",  value: batch.batchDate ?? "—" },
            { label: "Trạng thái",  value: batch.status },
            { label: "Tổng SL",     value: batch.totalItems ?? 0 },
            { label: "Tổng loại",   value: batch.totalTypes ?? 0 },
            { label: "Tạo lúc",     value: fmt(batch.createdAt) },
          ].map((f) => (
            <div key={f.label} className="bg-muted/50 rounded-lg p-2.5 border border-border/50">
              <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">{f.label}</p>
              <p className="text-xs font-medium text-foreground mt-0.5 break-all">{f.value}</p>
            </div>
          ))}
        </div>

        {/* Section 2: Sent At + Note */}
        {batch.sentAt && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50 border border-blue-200">
            <MessageSquare className="w-4 h-4 text-blue-500 flex-shrink-0" />
            <p className="text-xs text-blue-700">
              <span className="font-semibold">Gửi lúc:</span> {fmt(batch.sentAt)}
            </p>
          </div>
        )}

        {batch.note?.trim() && (
          <div className="flex items-start gap-2 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200">
            <FileText className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold text-amber-700 uppercase tracking-wider">Ghi chú</p>
              <p className="text-sm text-amber-900 mt-0.5 break-words">{batch.note}</p>
            </div>
          </div>
        )}

        {/* Section 3: Items table */}
        {batch.items?.length > 0 && (
          <div className="border border-border rounded-xl overflow-hidden">
            <div className="px-4 py-3 bg-muted/50 border-b border-border flex items-center gap-2">
              <Package className="w-4 h-4 text-primary" />
              <h4 className="text-sm font-semibold text-foreground">Danh sách nguyên liệu</h4>
              <span className="text-xs text-muted-foreground font-normal">{batch.items.length} mặt hàng</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="admin-table-header">
                    <th className="px-4 py-2 text-left font-semibold text-muted-foreground uppercase tracking-wide">Tên sản phẩm</th>
                    <th className="px-4 py-2 text-left font-semibold text-muted-foreground uppercase tracking-wide">Food ID</th>
                    <th className="px-4 py-2 text-center font-semibold text-muted-foreground uppercase tracking-wide">Tổng SL</th>
                    <th className="px-4 py-2 text-left font-semibold text-muted-foreground uppercase tracking-wide">Nguồn (Store: Qty)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {batch.items.map((item) => (
                    <tr key={item.itemId} className="admin-table-row">
                      <td className="px-4 py-2.5 font-medium text-foreground">{item.foodName}</td>
                      <td className="px-4 py-2.5 text-muted-foreground font-mono text-[10px]">{item.centralFoodId}</td>
                      <td className="px-4 py-2.5 text-center font-semibold text-foreground">{item.totalQuantity}</td>
                      <td className="px-4 py-2.5 text-muted-foreground">{item.sourceDetail}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Section 4: Status update */}
        {batch.status !== "PRODUCTION_COMPLETED" && batch.status !== "CANCELLED" ? (
          <div className="border border-border rounded-lg p-4 space-y-3">
            <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <ArrowRight className="w-3.5 h-3.5 text-primary" />
              Cập nhật trạng thái
            </h4>

            <div className="flex flex-wrap gap-2">
              {BATCH_STATUSES.map((s) => {
                const pill = STATUS_PILL[s] ?? STATUS_PILL.DRAFT;
                const isActive = selectedStatus === s;
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSelectedStatus(s)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                      isActive
                        ? `${pill.active} ring-2 ring-offset-1 ring-primary/30`
                        : pill.idle + " hover:border-primary/50"
                    }`}
                  >
                    {s}
                  </button>
                );
              })}
            </div>

            <button
              onClick={handleStatusUpdate}
              disabled={actionLoading || selectedStatus === batch.status}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              Cập nhật trạng thái
            </button>
          </div>
          // thêm nút nhập kho khi batch ở trạng thái PRODUCTION_COMPLETED
        ) : batch.status === "PRODUCTION_COMPLETED" ? (
          <div className="border border-emerald-200 rounded-lg p-4 bg-emerald-50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-emerald-800">Sản xuất hoàn thành</p>
              <p className="text-xs text-emerald-600 mt-0.5">
                {hasStocked ? "Đã nhập kho thành công. Không thể nhập lại." : "Nhấn để nhập số lượng vào kho dựa trên batch này."}
              </p>
            </div>
            <button
              onClick={handleIncreaseStock}
              disabled={stockLoading || hasStocked}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all disabled:opacity-50 flex-shrink-0 ${
                hasStocked
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-emerald-600 text-white hover:bg-emerald-700 active:scale-[0.98]"
              }`}
            >
              {stockLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Warehouse className="w-4 h-4" />}
              {hasStocked ? "Đã nhập kho" : "Nhập kho"}
            </button>
          </div>
        ) : (
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <p className="text-xs text-muted-foreground">
              Trạng thái <strong>{batch.status}</strong> — không cần thao tác thêm.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════
   Main component
   ═══════════════════════════════════════════════════════════════════════ */
const CentralKitchenOrders = () => {
  const [batches, setBatches]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab]   = useState("ALL");

  /* ── Fetch batches ── */
  const fetchBatches = useCallback(async () => {
    try {
      setLoading(true);
      const res  = await getAllBatches();
      const data = res.data?.data ?? res.data ?? [];
      setBatches(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Không thể tải danh sách batch.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchBatches(); }, [fetchBatches]);

  /* ── Filtering ── */
  const filtered = batches.filter((b) => {
    if (activeTab !== "ALL" && b.status !== activeTab) return false;
    const term = searchTerm.toLowerCase();
    return (
      (b.batchId?.toLowerCase() ?? "").includes(term) ||
      (b.batchDate?.toLowerCase() ?? "").includes(term) ||
      (b.note?.toLowerCase() ?? "").includes(term)
    );
  });

  /* ── Stats ── */
  const stats = {
    total:     batches.length,
    draft:     batches.filter((b) => b.status === "DRAFT").length,
    sent:      batches.filter((b) => b.status === "SENT").length,
    inProd:    batches.filter((b) => b.status === "IN_PRODUCTION").length,
    completed: batches.filter((b) => b.status === "PRODUCTION_COMPLETED").length,
  };

  /* ═════════════════════════════════════ RENDER ═════════════════════════════════════ */
  return (
    <div className="animate-fade-in space-y-6">

      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Batch Production</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Quản lý và cập nhật trạng thái các batch sản xuất từ Supply Coordinator.
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20">
          <ChefHat className="w-4 h-4 text-primary" />
          <span className="text-xs font-semibold text-primary">Central Kitchen Staff</span>
        </div>
      </div>

      {/* ── Stats cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: "Tổng batch",      value: stats.total,     variant: "stat-card-blue",   icon: Package },
          { label: "Draft",           value: stats.draft,     variant: "stat-card-orange", icon: FileText },
          { label: "Đã gửi",          value: stats.sent,      variant: "stat-card-purple", icon: MessageSquare },
          { label: "Đang sản xuất",   value: stats.inProd,    variant: "stat-card-orange", icon: Factory },
          { label: "Hoàn thành",      value: stats.completed, variant: "stat-card-green",  icon: CheckCircle },
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

      {/* ── Tabs + Search ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex flex-wrap gap-1 bg-muted rounded-lg p-1">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                activeTab === t.key
                  ? "bg-primary text-primary-foreground shadow"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              placeholder="Tìm Batch ID, ngày, ghi chú..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="um-input pl-10 w-64"
            />
          </div>
          <button
            onClick={fetchBatches}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-background text-foreground text-sm font-medium hover:bg-muted transition-colors disabled:opacity-60"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Làm mới
          </button>
        </div>
      </div>

      {/* ── Batch list ── */}
      {loading ? (
        <div className="admin-card rounded-xl p-12 flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-sm text-muted-foreground">Đang tải danh sách batch...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="admin-card rounded-xl p-12 flex flex-col items-center gap-4 text-center">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
            <Package className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-base font-semibold text-foreground">Không có batch nào</p>
          <p className="text-sm text-muted-foreground">
            {searchTerm ? "Không tìm thấy kết quả phù hợp." : "Chưa có batch nào được tạo."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Hiển thị <span className="font-semibold text-foreground">{filtered.length}</span> batch
            </p>
          </div>
          {filtered.map((batch) => (
            <BatchCard key={batch.batchId} batch={batch} onRefresh={fetchBatches} />
          ))}
        </div>
      )}
    </div>
  );
};

export default CentralKitchenOrders;
