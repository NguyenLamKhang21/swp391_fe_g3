import { useState, useEffect, useCallback } from "react";
import {
  CheckCircle, Clock, Loader2, RefreshCw, Search,
  XCircle, Package, AlertTriangle,
  Truck, Factory, ChevronDown, ChevronUp, Sparkles, Calendar, PlusCircle,
} from "lucide-react";
import { toast } from "react-toastify";
import {
  getAllStore,
  getBatchesSuggestion,
  createBatches,
  getAllBatches,
  sendBatchesToKitchen,
} from "../api/authAPI";

/* ═══════════════════════════════════════════════════════════════════════
   Main component
   ═══════════════════════════════════════════════════════════════════════ */
const SupplyBatchManagement = () => {
  const [storeNameMap, setStoreNameMap] = useState({});

  // Fetch all stores once on mount to build a storeId → storeName lookup map
  useEffect(() => {
    (async () => {
      try {
        const res = await getAllStore();
        const list = Array.isArray(res.data) ? res.data : res.data?.data ?? [];
        const map = {};
        list.forEach((s) => { if (s.storeId) map[s.storeId] = s.storeName ?? s.storeId; });
        setStoreNameMap(map);
      } catch { /* silent */ }
    })();
  }, []);

  const storeName = (id) => storeNameMap[id] || id;

  // ── Batch Suggestion ────────────────────────────────────────────────────
  // Default the date picker to today in yyyy-MM-dd format (required by API)
  const todayStr = new Date().toISOString().slice(0, 10);
  const [suggDate,    setSuggDate]    = useState(todayStr); // selected date
  const [suggestion,  setSuggestion]  = useState(null);     // API response data
  const [suggLoading, setSuggLoading] = useState(false);    // request in-flight flag
  const [suggOpen,    setSuggOpen]    = useState(true);     // panel open/collapsed

  /**
   * fetchSuggestion — GET /supply/preview?date={suggDate}
   *
   * Aggregates all WAITING_FOR_PRODUCTION orders for the chosen date and
   * returns a production plan with:
   *   totalTypes          — number of distinct food types needed
   *   totalQuantity       — total units to produce
   *   estimatedBatchCount — estimated number of production batches
   *   warning             — capacity/stock warning message (null if none)
   *   aggregatedItems[]   — per-food breakdown:
   *                           centralFoodId, foodName, totalQuantity, sourceDetail
   */
  const fetchSuggestion = async () => {
    if (!suggDate) { toast.warn("Vui lòng chọn ngày."); return; }
    try {
      setSuggLoading(true);
      setSuggestion(null); // clear stale result
      const res = await getBatchesSuggestion(suggDate);
      setSuggestion(res.data?.data ?? res.data);
    } catch (err) {
      toast.error(err?.response?.data?.message ?? "Không thể tải gợi ý lô hàng.");
    } finally {
      setSuggLoading(false);
    }
  };
  // ────────────────────────────────────────────────────────────────────────

  // ── Create Batches ───────────────────────────────────────────────────────
  // createdBatches: array of batch objects returned by POST /supply/aggregate.
  // Each batch has: batchId, batchDate, status, totalItems, totalTypes, note,
  //                 createdAt, sentAt, items[]
  const [createdBatches, setCreatedBatches] = useState([]);

  // createLoading: true while the POST /supply/aggregate request is in-flight
  const [createLoading, setCreateLoading] = useState(false);

  /**
   * handleCreateBatches — POST /supply/aggregate?date={suggDate}
   *
   * Takes the same date as the preview panel and tells the backend to
   * aggregate all WAITING_FOR_PRODUCTION orders for that day into one or
   * more production batches (initially in DRAFT status).
   *
   * Key fields per batch:
   *   batchId    — unique ID, e.g. "BATCH-2026-03-25-1"
   *   batchDate  — date the batch is planned for
   *   status     — "DRAFT" on creation
   *   totalItems — total quantity of all food items in this batch
   *   totalTypes — number of distinct food types
   *   note       — auto-generated description
   *   items[]    — per-food breakdown (same shape as aggregatedItems)
   */
  const handleCreateBatches = async () => {
    if (!suggDate) { toast.warn("Vui lòng chọn ngày."); return; }
    try {
      setCreateLoading(true);
      setCreatedBatches([]); // clear any previous result
      const res = await createBatches(suggDate);
      // The API returns an array directly (or wrapped in .data.data)
      const batches = res.data?.data ?? res.data ?? [];
      setCreatedBatches(Array.isArray(batches) ? batches : [batches]);
      toast.success(`Tạo thành công ${Array.isArray(batches) ? batches.length : 1} lô hàng!`);
    } catch (err) {
      toast.error(err?.response?.data?.message ?? "Không thể tạo lô hàng.");
    } finally {
      setCreateLoading(false);
    }
  };
  // ────────────────────────────────────────────────────────────────────────

  // allBatches: fetched from GET /supply/batches/all
  // shape per item: { batchId, batchDate, status, totalItems, totalTypes, note, createdAt, sentAt, items[] }
  const [allBatches,   setAllBatches]  = useState([]);
  const [batchLoading, setBatchLoading] = useState(true);
  const [batchSearch,  setBatchSearch]  = useState("");

  const fetchAllBatches = useCallback(async () => {
    try {
      setBatchLoading(true);
      const res = await getAllBatches();
      const data = res.data?.data ?? res.data ?? [];
      setAllBatches(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Không thể tải danh sách lô hàng.");
    } finally {
      setBatchLoading(false);
    }
  }, []);

  useEffect(() => { fetchAllBatches(); }, [fetchAllBatches]);

  // Filter batches by batchId / batchDate / status
  const filteredBatches = allBatches.filter((b) => {
    const term = batchSearch.toLowerCase();
    return (
      (b.batchId?.toLowerCase()   ?? "").includes(term) ||
      (b.batchDate?.toLowerCase() ?? "").includes(term) ||
      (b.status?.toLowerCase()    ?? "").includes(term)
    );
  });

  const batchStats = {
    total:     allBatches.length,
    draft:     allBatches.filter((b) => b.status === "DRAFT").length,
    sent:      allBatches.filter((b) => b.status === "SENT").length,
    inProd:    allBatches.filter((b) => b.status === "IN_PRODUCTION").length,
    completed: allBatches.filter((b) => b.status === "PRODUCTION_COMPLETED").length,
    cancelled: allBatches.filter((b) => b.status === "CANCELLED").length,
  };

  // Send a single DRAFT batch to the central kitchen (POST /supply/batches/{batchId}/send)
  const handleSendBatch = async (batchId) => {
    try {
      await sendBatchesToKitchen(batchId);
      toast.success(`Đã gửi lô ${batchId} đến bếp trung tâm!`);
      fetchAllBatches(); // refresh list so status changes to SENT
    } catch (err) {
      toast.error(err?.response?.data?.message ?? "Không thể gửi lô hàng.");
    }
  };

  return (
    <div className="animate-fade-in space-y-6">

      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Supply Batch Management</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Quản lý lô hàng sản xuất từ bếp trung tâm.
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-orange-100 border border-orange-200">
          <Factory className="w-4 h-4 text-orange-600" />
          <span className="text-xs font-semibold text-orange-700">BATCH MANAGEMENT</span>
        </div>
      </div>

      {/* ── Stats cards — one tile per status ── */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
        {[
          { label: "Tổng lô",        value: batchStats.total,     variant: "stat-card-blue"   },
          { label: "DRAFT",          value: batchStats.draft,     variant: "stat-card-orange" },
          { label: "SENT",           value: batchStats.sent,      variant: "stat-card-purple" },
          { label: "IN PRODUCTION",  value: batchStats.inProd,    variant: "stat-card-blue"   },
          { label: "COMPLETED",      value: batchStats.completed, variant: "stat-card-green"  },
          { label: "CANCELLED",      value: batchStats.cancelled, variant: "stat-card-orange" },
        ].map((s) => (
          <div key={s.label} className={`stat-card rounded-xl p-4 ${s.variant}`}>
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{s.label}</p>
            <p className="text-2xl font-bold text-foreground mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      {/* ── Batch Suggestion Panel ─────────────────────────────────────────
           Calls GET /supply/preview?date=... and shows a production plan:
           stat tiles for totals + a table of aggregated items per food type.
      ─────────────────────────────────────────────────────────────────── */}
      <div className="admin-card rounded-xl border border-border overflow-hidden">

        {/* Collapsible header — click to toggle */}
        <button
          onClick={() => setSuggOpen((v) => !v)}
          className="w-full flex items-center justify-between px-5 py-3 bg-muted/40 hover:bg-muted/70 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">Gợi ý lô hàng sản xuất</span>
          </div>
          {suggOpen
            ? <ChevronUp   className="w-4 h-4 text-muted-foreground" />
            : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </button>

        {suggOpen && (
          <div className="px-5 py-4 space-y-4">

            {/* ── Date picker + trigger ── */}
            <div className="flex flex-wrap items-end gap-3">
              {/* Date picker — native input always gives yyyy-MM-dd format which the API requires */}
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> Ngày tổng hợp (yyyy-MM-dd)
                </label>
                {/* Native date input — value is always in yyyy-MM-dd format */}
                <input
                  type="date"
                  value={suggDate}
                  onChange={(e) => setSuggDate(e.target.value)}
                  className="um-input text-sm"
                />
              </div>

              {/* Preview button — GET /supply/preview (read-only, no data written) */}
              <button
                onClick={fetchSuggestion}
                disabled={suggLoading || createLoading}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-60"
              >
                {suggLoading
                  ? <Loader2  className="w-4 h-4 animate-spin" />
                  : <Sparkles className="w-4 h-4" />}
                Xem gợi ý lô hàng
              </button>

              {/* Create button — POST /supply/aggregate (actually writes batches to DB as DRAFT) */}
              <button
                onClick={handleCreateBatches}
                disabled={createLoading || suggLoading}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 active:scale-[0.98] transition-all disabled:opacity-60"
              >
                {createLoading
                  ? <Loader2    className="w-4 h-4 animate-spin" />
                  : <PlusCircle className="w-4 h-4" />}
                Tạo lô sản xuất
              </button>
            </div>

            {/* ── Loading spinner ── */}
            {suggLoading && (
              <div className="flex items-center gap-3 py-4">
                <Loader2 className="w-5 h-5 text-primary animate-spin" />
                <p className="text-sm text-muted-foreground">Đang tải gợi ý...</p>
              </div>
            )}

            {/* ── Results (only shown after a successful fetch) ── */}
            {!suggLoading && suggestion && (
              <div className="space-y-4 animate-fade-in">

                {/* Summary stat tiles: totalTypes / totalQuantity / estimatedBatchCount */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[
                    { label: "Loại sản phẩm",  value: suggestion.totalTypes,          variant: "stat-card-blue"   },
                    { label: "Tổng số lượng",  value: suggestion.totalQuantity,       variant: "stat-card-orange" },
                    { label: "Ước tính số lô", value: suggestion.estimatedBatchCount, variant: "stat-card-purple" },
                  ].map((s) => (
                    <div key={s.label} className={`stat-card rounded-xl p-4 ${s.variant}`}>
                      <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{s.label}</p>
                      <p className="text-2xl font-bold text-foreground mt-1">{s.value ?? "—"}</p>
                    </div>
                  ))}
                </div>

                {/* Warning callout — only rendered when warning is non-null */}
                {suggestion.warning && (
                  <div className="flex items-start gap-2 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200">
                    <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-amber-800">{suggestion.warning}</p>
                  </div>
                )}

                {/* Aggregated items table — one row per centralFoodId */}
                {suggestion.aggregatedItems?.length > 0 && (
                  <div className="border border-border rounded-xl overflow-hidden">
                    <div className="px-4 py-3 bg-muted/50 border-b border-border flex items-center gap-2">
                      <Package className="w-4 h-4 text-primary" />
                      <h4 className="text-sm font-semibold text-foreground">Danh sách sản phẩm tổng hợp</h4>
                      <span className="text-xs text-muted-foreground">{suggestion.aggregatedItems.length} loại</span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="admin-table-header">
                            <th className="px-4 py-2 text-left font-semibold text-muted-foreground uppercase tracking-wide">Mã SP</th>
                            <th className="px-4 py-2 text-left font-semibold text-muted-foreground uppercase tracking-wide">Tên sản phẩm</th>
                            {/* totalQuantity = sum of qty across all orders for this food */}
                            <th className="px-4 py-2 text-center font-semibold text-muted-foreground uppercase tracking-wide">Tổng SL</th>
                            {/* sourceDetail = store breakdown, e.g. "STORE-D1-001: 20" */}
                            <th className="px-4 py-2 text-left font-semibold text-muted-foreground uppercase tracking-wide">Chi tiết nguồn</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {suggestion.aggregatedItems.map((item, idx) => (
                            <tr key={item.centralFoodId ?? idx} className="admin-table-row">
                              <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{item.centralFoodId}</td>
                              <td className="px-4 py-2.5 font-medium text-foreground">{item.foodName}</td>
                              <td className="px-4 py-2.5 text-center">
                                <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-bold">
                                  {item.totalQuantity}
                                </span>
                              </td>
                              <td className="px-4 py-2.5 text-muted-foreground">{item.sourceDetail}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── Loading spinner for Create Batches ── */}
            {createLoading && (
              <div className="flex items-center gap-3 py-4">
                <Loader2 className="w-5 h-5 text-emerald-600 animate-spin" />
                <p className="text-sm text-muted-foreground">Đang tạo lô hàng...</p>
              </div>
            )}

            {/* ── Created Batches Results ──────────────────────────────────────
                 Displayed when POST /supply/aggregate succeeds.
                 Each batch card shows: batchId, batchDate, status, totalItems,
                 totalTypes, note, and an expanded items table.
            ────────────────────────────────────────────────────────────── */}
            {!createLoading && createdBatches.length > 0 && (
              <div className="space-y-3 animate-fade-in">
                <div className="flex items-center gap-2">
                  <PlusCircle className="w-4 h-4 text-emerald-600" />
                  <h4 className="text-sm font-semibold text-foreground">Lô hàng đã tạo</h4>
                  <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">
                    {createdBatches.length} lô
                  </span>
                </div>

                {createdBatches.map((batch) => (
                  <div key={batch.batchId} className="border border-emerald-200 rounded-xl overflow-hidden bg-emerald-50/30">
                    <div className="px-4 py-3 bg-emerald-50 border-b border-emerald-200 flex flex-wrap items-center justify-between gap-2">
                      <div>
                        {/* batchId — unique identifier for this production batch */}
                        <p className="text-sm font-bold text-foreground">Batch Id: {batch.batchId}</p>
                        {/* note — auto-generated description from backend */}
                        <p className="text-xs text-muted-foreground mt-0.5">{batch.note}</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {/* status — always DRAFT on creation; can be promoted later */}
                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
                          <Clock className="w-3 h-3" />{batch.status}
                        </span>
                        {/* batchDate — the date this batch is planned for */}
                        <span className="text-xs text-muted-foreground">{batch.batchDate}</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 px-4 py-3 border-b border-emerald-100">
                      <div className="bg-white rounded-lg p-2 border border-emerald-100">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Tổng mặt hàng</p>
                        {/* totalItems = sum of all quantities across all food types in this batch */}
                        <p className="text-lg font-bold text-foreground">{batch.totalItems}</p>
                      </div>
                      <div className="bg-white rounded-lg p-2 border border-emerald-100">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Loại sản phẩm</p>
                        {/* totalTypes = count of distinct food types in this batch */}
                        <p className="text-lg font-bold text-foreground">{batch.totalTypes}</p>
                      </div>
                    </div>
                    {batch.items?.length > 0 && (
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="admin-table-header">
                              <th className="px-4 py-2 text-left font-semibold text-muted-foreground uppercase tracking-wide">Mã SP</th>
                              <th className="px-4 py-2 text-left font-semibold text-muted-foreground uppercase tracking-wide">Tên sản phẩm</th>
                              {/* totalQuantity = qty of this food type needed in this batch */}
                              <th className="px-4 py-2 text-center font-semibold text-muted-foreground uppercase tracking-wide">Số lượng</th>
                              {/* sourceDetail = which stores contributed, e.g. "STORE-D1-001: 20" */}
                              <th className="px-4 py-2 text-left font-semibold text-muted-foreground uppercase tracking-wide">Nguồn</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border">
                            {batch.items.map((item) => (
                              <tr key={item.itemId} className="admin-table-row">
                                <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{item.centralFoodId}</td>
                                <td className="px-4 py-2.5 font-medium text-foreground">{item.foodName}</td>
                                <td className="px-4 py-2.5 text-center">
                                  <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-bold">
                                    {item.totalQuantity}
                                  </span>
                                </td>
                                <td className="px-4 py-2.5 text-muted-foreground">{item.sourceDetail}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Batch list: Search + Refresh ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <p className="text-sm text-muted-foreground font-medium">
          {!batchLoading && `${filteredBatches.length} lô hàng`}
        </p>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              placeholder="Tìm Batch ID, ngày, trạng thái..."
              value={batchSearch}
              onChange={(e) => setBatchSearch(e.target.value)}
              className="um-input pl-10 w-64"
            />
          </div>
          <button
            onClick={fetchAllBatches}
            disabled={batchLoading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-background text-foreground text-sm font-medium hover:bg-muted transition-colors disabled:opacity-60"
          >
            <RefreshCw className={`w-4 h-4 ${batchLoading ? "animate-spin" : ""}`} />
            Làm mới
          </button>
        </div>
      </div>

      {/* ── Batch list ── */}
      {batchLoading ? (
        <div className="admin-card rounded-xl p-12 flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-sm text-muted-foreground">Đang tải danh sách lô hàng...</p>
        </div>
      ) : filteredBatches.length === 0 ? (
        <div className="admin-card rounded-xl p-12 flex flex-col items-center gap-4 text-center">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
            <Package className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-base font-semibold text-foreground">Chưa có lô hàng nào</p>
          <p className="text-sm text-muted-foreground">
            {batchSearch ? "Không tìm thấy kết quả phù hợp." : "Hãy tạo lô hàng từ panel bên trên."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBatches.map((batch) => {
            // ── Per-status colour config ─────────────────────────────────────────────────
            // Each status gets its own border, header bg, badge, qty pill, and icon.
            const STATUS_BATCH_CFG = {
              DRAFT:                { border: "border-amber-200",   hdr: "bg-amber-50/60",   mini: "border-amber-100 bg-amber-50/30",    badge: "bg-amber-100 text-amber-700 border-amber-200",    qty: "bg-amber-100 text-amber-700",   icon: <Clock       className="w-3 h-3" /> },
              SENT:                 { border: "border-blue-200",    hdr: "bg-blue-50/60",    mini: "border-blue-100 bg-blue-50/30",      badge: "bg-blue-100 text-blue-700 border-blue-200",      qty: "bg-blue-100 text-blue-700",     icon: <Truck       className="w-3 h-3" /> },
              IN_PRODUCTION:        { border: "border-purple-200",  hdr: "bg-purple-50/60",  mini: "border-purple-100 bg-purple-50/30",  badge: "bg-purple-100 text-purple-700 border-purple-200", qty: "bg-purple-100 text-purple-700", icon: <Factory     className="w-3 h-3" /> },
              PRODUCTION_COMPLETED: { border: "border-emerald-200", hdr: "bg-emerald-50/60", mini: "border-emerald-100 bg-emerald-50/30",badge: "bg-emerald-100 text-emerald-700 border-emerald-200",qty: "bg-emerald-100 text-emerald-700",icon: <CheckCircle className="w-3 h-3" /> },
              CANCELLED:            { border: "border-red-200",     hdr: "bg-red-50/60",     mini: "border-red-100 bg-red-50/30",        badge: "bg-red-100 text-red-700 border-red-200",          qty: "bg-red-100 text-red-700",       icon: <XCircle     className="w-3 h-3" /> },
            };
            // Fallback for unexpected statuses
            const cfg = STATUS_BATCH_CFG[batch.status] ?? STATUS_BATCH_CFG.DRAFT;
            const isDraft = batch.status === "DRAFT";
            return (
              <div
                key={batch.batchId}
                className={`admin-card rounded-xl border overflow-hidden ${cfg.border}`}
              >
                {/* ── Batch card header ── */}
                <div className={`px-5 py-4 flex flex-wrap items-start justify-between gap-3 ${cfg.hdr}`}>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-foreground">Batch ID: {batch.batchId}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{batch.note}</p>
                    {/* createdAt — when the batch record was first saved */}
                    <p className="text-[10px] text-muted-foreground mt-1">
                      Tạo lúc: {batch.createdAt ? new Date(batch.createdAt).toLocaleString("vi-VN") : "—"}
                      {batch.sentAt && (
                        <> · Gửi lúc: {new Date(batch.sentAt).toLocaleString("vi-VN")}</>
                      )}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
                    {/* Status badge — colour driven by cfg */}
                    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border ${cfg.badge}`}>
                      {cfg.icon}
                      {batch.status}
                    </span>
                    {/* batchDate label */}
                    <span className="text-xs text-muted-foreground">{batch.batchDate}</span>
                    {/* Send to kitchen button — only for DRAFT batches */}
                    {isDraft && (
                      <button
                        onClick={() => handleSendBatch(batch.batchId)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 active:scale-[0.98] transition-all"
                      >
                        <Truck className="w-3.5 h-3.5" />
                        Gửi bếp
                      </button>
                    )}
                  </div>
                </div>

                {/* ── Mini stats: totalItems / totalTypes ── */}
                <div className={`grid grid-cols-2 gap-2 px-5 py-3 border-b ${cfg.mini}`}>
                  <div className="bg-white rounded-lg p-2 border border-border">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Tổng mặt hàng</p>
                    {/* totalItems = sum of all qty across food types in this batch */}
                    <p className="text-lg font-bold text-foreground">{batch.totalItems}</p>
                  </div>
                  <div className="bg-white rounded-lg p-2 border border-border">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Loại sản phẩm</p>
                    {/* totalTypes = count of distinct food types */}
                    <p className="text-lg font-bold text-foreground">{batch.totalTypes}</p>
                  </div>
                </div>

                {/* ── Items table — one row per food type ── */}
                {batch.items?.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="admin-table-header">
                          <th className="px-5 py-2 text-left font-semibold text-muted-foreground uppercase tracking-wide">Mã SP</th>
                          <th className="px-5 py-2 text-left font-semibold text-muted-foreground uppercase tracking-wide">Tên sản phẩm</th>
                          {/* totalQuantity = qty of this food needed in this batch */}
                          <th className="px-5 py-2 text-center font-semibold text-muted-foreground uppercase tracking-wide">Số lượng</th>
                          {/* sourceDetail = e.g. "STORE-D1-001: 20" */}
                          <th className="px-5 py-2 text-left font-semibold text-muted-foreground uppercase tracking-wide">Nguồn đơn hàng</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {batch.items.map((item) => (
                          <tr key={item.itemId} className="admin-table-row">
                            <td className="px-5 py-2.5 font-mono text-xs text-muted-foreground">{item.centralFoodId}</td>
                            <td className="px-5 py-2.5 font-medium text-foreground">{item.foodName}</td>
                            <td className="px-5 py-2.5 text-center">
                              {/* qty pill colour matches the batch status */}
                              <span className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded-full font-bold ${cfg.qty}`}>
                                {item.totalQuantity}
                              </span>
                            </td>
                            <td className="px-5 py-2.5 text-muted-foreground">{item.sourceDetail}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SupplyBatchManagement;