import { useState, useEffect, useCallback } from "react";
import {
  ClipboardList, CheckCircle, Clock, Loader2, RefreshCw, Search,
  XCircle, AlertCircle, X, Eye, ShieldAlert, Package, ArrowRight,
  MessageSquare, AlertTriangle, ChevronDown,
} from "lucide-react";
import { toast } from "react-toastify";
import {
  getAllOrders,
  getPendingOrders,
  getOrderDetailByOrderId,
  getOrdersByStore,
  confirmOrder,
  cancelOrder,
  updateOrderStatus,
  updateOrderPriority,
  getCentralKitchenFood,
} from "../api/authAPI";

/* ═══════════════════════════════════════════════════════════════════════
   Status helpers
   ═══════════════════════════════════════════════════════════════════════ */
const STATUS_CFG = {
  PENDING:             { color: "text-amber-600",   bg: "bg-amber-50",   border: "border-amber-200",   icon: Clock         },
  APPROVED:            { color: "text-blue-600",    bg: "bg-blue-50",    border: "border-blue-200",    icon: CheckCircle   },
  CONFIRMED:           { color: "text-blue-600",    bg: "bg-blue-50",    border: "border-blue-200",    icon: CheckCircle   },
  COOKING:             { color: "text-orange-600",  bg: "bg-orange-50",  border: "border-orange-200",  icon: AlertCircle   },
  COOKING_DONE:        { color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200", icon: CheckCircle   },
  IN_PROCESS:          { color: "text-purple-600",  bg: "bg-purple-50",  border: "border-purple-200",  icon: Loader2       },
  WAITING_FOR_UPDATE:  { color: "text-sky-600",     bg: "bg-sky-50",     border: "border-sky-200",     icon: MessageSquare },
  DELIVERED:           { color: "text-green-600",   bg: "bg-green-50",   border: "border-green-200",   icon: CheckCircle   },
  REJECTED:            { color: "text-red-600",     bg: "bg-red-50",     border: "border-red-200",     icon: XCircle       },
  CANCELLED:           { color: "text-gray-500",    bg: "bg-gray-50",    border: "border-gray-200",    icon: XCircle       },
};
const statusStyle = (s) =>
  STATUS_CFG[s] ?? { color: "text-gray-600", bg: "bg-gray-50", border: "border-gray-200", icon: AlertCircle };

const TABS = [
  { key: "ALL",                label: "Tất cả" },
  { key: "PENDING",            label: "Pending" },
  { key: "WAITING_FOR_UPDATE", label: "Waiting" },
  { key: "APPROVED",           label: "Approved" },
  { key: "REJECTED",           label: "Rejected" },
];

/* ═══════════════════════════════════════════════════════════════════════
   Main component
   ═══════════════════════════════════════════════════════════════════════ */
const SupplyCoordinatorOrders = () => {
  const [orders, setOrders]           = useState([]);
  const [loading, setLoading]         = useState(true);
  const [searchTerm, setSearchTerm]   = useState("");
  const [activeTab, setActiveTab]     = useState("ALL");

  // Modal state
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderDetail, setOrderDetail]     = useState(null);
  const [storeOrders, setStoreOrders]     = useState([]);
  const [centralFoods, setCentralFoods]   = useState([]);
  const [detailLoading, setDetailLoading] = useState(false);

  // Action state
  const [rejectReason, setRejectReason]   = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [showRejectForm, setShowRejectForm] = useState(false);

  /* ── Fetch all orders ── */
  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getAllOrders();
      const data = res.data?.data ?? res.data ?? [];
      setOrders(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Không thể tải danh sách đơn hàng.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  /* ── Open order detail modal ── */
  const openOrderDetail = async (order) => {
    setSelectedOrder(order);
    setOrderDetail(null);
    setStoreOrders([]);
    setCentralFoods([]);
    setRejectReason("");
    setShowRejectForm(false);
    setDetailLoading(true);

    try {
      const [detailRes, storeRes, foodRes] = await Promise.allSettled([
        getOrderDetailByOrderId(order.orderId),
        getOrdersByStore(order.storeId),
        getCentralKitchenFood(),
      ]);

      if (detailRes.status === "fulfilled") {
        const d = detailRes.value.data?.data ?? detailRes.value.data;
        setOrderDetail(Array.isArray(d) ? d : d ? [d] : []);
      }
      if (storeRes.status === "fulfilled") {
        const s = storeRes.value.data?.data ?? storeRes.value.data ?? [];
        setStoreOrders(Array.isArray(s) ? s : []);
      }
      if (foodRes.status === "fulfilled") {
        const f = foodRes.value.data?.data ?? foodRes.value.data ?? [];
        setCentralFoods(Array.isArray(f) ? f : []);
      }
    } catch {
      toast.error("Lỗi khi tải chi tiết đơn hàng.");
    } finally {
      setDetailLoading(false);
    }
  };

  const closeModal = () => {
    setSelectedOrder(null);
    setOrderDetail(null);
    setShowRejectForm(false);
    setRejectReason("");
  };

  /* ── Debt check: store has unpaid orders? ── */
  const hasDebt = storeOrders.some(
    (o) =>
      o.orderId !== selectedOrder?.orderId &&
      o.paymentOption === "PAY_AFTER_ORDER" &&
      (o.statusOrder === "DELIVERED" || o.statusOrder === "COOKING_DONE") &&
      o.paymentStatus !== "SUCCESS" && o.paymentStatus !== "PAID"
  );

  /* ── Actions ── */
  const handleConfirmOrder = async () => {
    if (!selectedOrder) return;
    try {
      setActionLoading(true);
      await updateOrderPriority(selectedOrder.orderId, 2);
      await confirmOrder(selectedOrder.orderId);
      toast.success(`Đơn ${selectedOrder.orderId} đã xác nhận (Priority 2) → gửi tới Central Kitchen.`);
      closeModal();
      await fetchOrders();
    } catch (err) {
      toast.error(err?.response?.data?.message ?? "Không thể xác nhận đơn hàng.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectOrder = async () => {
    if (!selectedOrder || !rejectReason.trim()) {
      toast.warn("Vui lòng nhập lý do từ chối.");
      return;
    }
    try {
      setActionLoading(true);
      await cancelOrder(selectedOrder.orderId);
      toast.success(`Đơn ${selectedOrder.orderId} đã bị từ chối.`);
      closeModal();
      await fetchOrders();
    } catch (err) {
      toast.error(err?.response?.data?.message ?? "Không thể từ chối đơn hàng.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleWaitingForUpdate = async () => {
    if (!selectedOrder) return;
    try {
      setActionLoading(true);
      await updateOrderStatus(selectedOrder.orderId, "WAITING_FOR_UPDATE");
      toast.success(`Đơn ${selectedOrder.orderId} → Waiting for Update (chờ phản hồi từ Store).`);
      closeModal();
      await fetchOrders();
    } catch (err) {
      toast.error(err?.response?.data?.message ?? "Không thể cập nhật trạng thái.");
    } finally {
      setActionLoading(false);
    }
  };

  /* ── Filtering ── */
  const filtered = orders.filter((o) => {
    if (activeTab !== "ALL" && o.statusOrder !== activeTab) return false;
    const term = searchTerm.toLowerCase();
    return (
      (o.orderId?.toLowerCase() ?? "").includes(term) ||
      (o.storeId?.toLowerCase() ?? "").includes(term) ||
      (o.statusOrder?.toLowerCase() ?? "").includes(term)
    );
  });

  /* ── Stats ── */
  const stats = {
    total:    orders.length,
    pending:  orders.filter((o) => o.statusOrder === "PENDING").length,
    waiting:  orders.filter((o) => o.statusOrder === "WAITING_FOR_UPDATE").length,
    approved: orders.filter((o) => ["APPROVED", "CONFIRMED"].includes(o.statusOrder)).length,
    rejected: orders.filter((o) => ["REJECTED", "CANCELLED"].includes(o.statusOrder)).length,
  };

  /* ═════════════════════════════════════ RENDER ═════════════════════════════════════ */
  return (
    <div className="animate-fade-in space-y-6">

      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Order Management</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Kiểm tra, duyệt và quản lý đơn hàng từ các cửa hàng Franchise.
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20">
          <ClipboardList className="w-4 h-4 text-primary" />
          <span className="text-xs font-semibold text-primary">Supply Coordinator</span>
        </div>
      </div>

      {/* ── Stats cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: "Tổng đơn",     value: stats.total,    variant: "stat-card-blue" },
          { label: "Pending",      value: stats.pending,  variant: "stat-card-orange" },
          { label: "Waiting",      value: stats.waiting,  variant: "stat-card-purple" },
          { label: "Approved",     value: stats.approved, variant: "stat-card-green" },
          { label: "Rejected",     value: stats.rejected, variant: "stat-card-blue" },
        ].map((s) => (
          <div key={s.label} className={`stat-card rounded-xl p-4 ${s.variant}`}>
            <p className="text-xs text-muted-foreground font-medium">{s.label}</p>
            <p className="text-2xl font-bold text-foreground mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      {/* ── Tabs + Search ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-1 bg-muted rounded-lg p-1">
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
              placeholder="Tìm Order ID, Store..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="um-input pl-10 w-56"
            />
          </div>
          <button
            onClick={fetchOrders}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-background text-foreground text-sm font-medium hover:bg-muted transition-colors disabled:opacity-60"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Làm mới
          </button>
        </div>
      </div>

      {/* ── Table ── */}
      {loading ? (
        <div className="admin-card rounded-xl p-12 flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-sm text-muted-foreground">Đang tải đơn hàng...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="admin-card rounded-xl p-12 flex flex-col items-center gap-4 text-center">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
            <ClipboardList className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-base font-semibold text-foreground">Không có đơn hàng nào</p>
          <p className="text-sm text-muted-foreground">
            {searchTerm ? "Không tìm thấy kết quả phù hợp." : "Chưa có đơn hàng nào trong hệ thống."}
          </p>
        </div>
      ) : (
        <div className="admin-card rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-border flex items-center justify-between">
            <h3 className="text-base font-semibold text-foreground">
              {activeTab === "ALL" ? "All Orders" : activeTab.replace(/_/g, " ")}
            </h3>
            <span className="badge badge-delivered">{filtered.length} orders</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="admin-table-header">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Order ID</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Store</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Order Date</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Priority</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Payment</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((o) => {
                  const st = statusStyle(o.statusOrder);
                  const StIcon = st.icon;
                  return (
                    <tr key={o.orderId} className="admin-table-row">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full admin-avatar flex items-center justify-center text-primary-foreground text-xs font-bold flex-shrink-0">
                            <ClipboardList className="w-4 h-4" />
                          </div>
                          <p className="font-medium text-foreground">{o.orderId}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-foreground">{o.storeId}</td>
                      <td className="px-6 py-4 text-muted-foreground">{o.orderDate ?? "—"}</td>
                      <td className="px-6 py-4 text-foreground">{o.priorityLevel ?? "—"}</td>
                      <td className="px-6 py-4">
                        <span className="badge badge-pending">{o.paymentOption ?? "—"}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${st.bg} ${st.color} ${st.border}`}>
                          <StIcon className="w-3.5 h-3.5" />
                          {o.statusOrder}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => openOrderDetail(o)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Chi tiết
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          ORDER DETAIL MODAL
          ══════════════════════════════════════════════════════════════════ */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeModal} />

          <div className="relative bg-background border border-border rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            {/* Modal header */}
            <div className="sticky top-0 bg-background z-10 px-6 py-4 border-b border-border flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-foreground">
                  Chi tiết đơn hàng — {selectedOrder.orderId}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Store: {selectedOrder.storeId} · {selectedOrder.orderDate}
                </p>
              </div>
              <button onClick={closeModal} className="p-2 rounded-lg hover:bg-muted transition-colors">
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            {detailLoading ? (
              <div className="p-12 flex flex-col items-center gap-4">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                <p className="text-sm text-muted-foreground">Đang tải chi tiết...</p>
              </div>
            ) : (
              <div className="p-6 space-y-6">

                {/* ── Section 1: Order info ── */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: "Order ID",  value: selectedOrder.orderId },
                    { label: "Store",     value: selectedOrder.storeId },
                    { label: "Payment",   value: selectedOrder.paymentOption },
                    { label: "Status",    value: selectedOrder.statusOrder },
                    { label: "Priority",  value: selectedOrder.priorityLevel ?? "—" },
                    { label: "Ngày đặt",  value: selectedOrder.orderDate ?? "—" },
                  ].map((f) => (
                    <div key={f.label} className="bg-muted/50 rounded-lg p-3">
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{f.label}</p>
                      <p className="text-sm font-medium text-foreground mt-1">{f.value}</p>
                    </div>
                  ))}
                </div>

                {/* ── Section 2: Order items ── */}
                {orderDetail && orderDetail.length > 0 && (
                  <div className="border border-border rounded-xl overflow-hidden">
                    <div className="px-4 py-3 bg-muted/50 border-b border-border">
                      <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                        <Package className="w-4 h-4 text-primary" />
                        Chi tiết sản phẩm
                      </h4>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="admin-table-header">
                            <th className="px-4 py-2 text-left text-xs font-semibold text-muted-foreground">Sản phẩm</th>
                            <th className="px-4 py-2 text-left text-xs font-semibold text-muted-foreground">Số lượng</th>
                            <th className="px-4 py-2 text-left text-xs font-semibold text-muted-foreground">Ghi chú</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {orderDetail.map((d, i) => (
                            <tr key={i} className="admin-table-row">
                              <td className="px-4 py-2 font-medium text-foreground">{d.foodItem ?? d.productName ?? "—"}</td>
                              <td className="px-4 py-2 text-foreground">{d.quantity ?? "—"}</td>
                              <td className="px-4 py-2 text-muted-foreground">{d.note ?? "—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* ── Section 3: Kiểm tra nợ ── */}
                <div className={`rounded-xl p-4 border ${hasDebt ? "border-red-200 bg-red-50" : "border-green-200 bg-green-50"}`}>
                  <div className="flex items-start gap-3">
                    <ShieldAlert className={`w-5 h-5 mt-0.5 ${hasDebt ? "text-red-600" : "text-green-600"}`} />
                    <div className="flex-1">
                      <h4 className={`text-sm font-semibold ${hasDebt ? "text-red-700" : "text-green-700"}`}>
                        Kiểm tra công nợ — {selectedOrder.storeId}
                      </h4>
                      {hasDebt ? (
                        <p className="text-xs text-red-600 mt-1">
                          Store này có đơn hàng chưa thanh toán. Nên từ chối đơn hoặc yêu cầu thanh toán trước.
                        </p>
                      ) : (
                        <p className="text-xs text-green-600 mt-1">
                          Không phát hiện công nợ. Store đủ điều kiện để xử lý đơn hàng.
                        </p>
                      )}
                      {storeOrders.length > 0 && (
                        <p className="text-[10px] text-muted-foreground mt-2">
                          Tổng {storeOrders.length} đơn từ store này trong hệ thống.
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* ── Section 4: Kiểm tra kho Central Food ── */}
                <div className="border border-border rounded-xl overflow-hidden">
                  <div className="px-4 py-3 bg-muted/50 border-b border-border flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <Package className="w-4 h-4 text-primary" />
                      Kho Central Food
                    </h4>
                    <span className="text-[10px] text-muted-foreground">{centralFoods.length} sản phẩm</span>
                  </div>
                  {centralFoods.length > 0 ? (
                    <div className="overflow-x-auto max-h-48 overflow-y-auto">
                      <table className="w-full text-sm">
                        <thead className="sticky top-0">
                          <tr className="admin-table-header">
                            <th className="px-4 py-2 text-left text-xs font-semibold text-muted-foreground">Tên</th>
                            <th className="px-4 py-2 text-left text-xs font-semibold text-muted-foreground">Tồn kho</th>
                            <th className="px-4 py-2 text-left text-xs font-semibold text-muted-foreground">Trạng thái</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {centralFoods.map((f, i) => (
                            <tr key={f.id ?? i} className="admin-table-row">
                              <td className="px-4 py-2 font-medium text-foreground">{f.foodName ?? f.name ?? "—"}</td>
                              <td className="px-4 py-2 text-foreground">{f.quantity ?? f.stock ?? "—"}</td>
                              <td className="px-4 py-2">
                                <span className={`badge ${(f.quantity ?? f.stock ?? 0) > 0 ? "badge-delivered" : "badge-cancelled"}`}>
                                  {(f.quantity ?? f.stock ?? 0) > 0 ? "Còn hàng" : "Hết hàng"}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="p-6 text-center text-sm text-muted-foreground">
                      Không có dữ liệu kho.
                    </div>
                  )}
                </div>

                {/* ── Section 5: Actions ── */}
                {(selectedOrder.statusOrder === "PENDING" || selectedOrder.statusOrder === "WAITING_FOR_UPDATE") && (
                  <div className="border border-border rounded-xl p-5 space-y-4">
                    <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <ArrowRight className="w-4 h-4 text-primary" />
                      Thao tác
                    </h4>

                    {/* Reject form */}
                    {showRejectForm ? (
                      <div className="space-y-3 bg-red-50 border border-red-200 rounded-lg p-4">
                        <p className="text-sm font-semibold text-red-700">Từ chối đơn hàng</p>
                        <textarea
                          placeholder="Nhập lý do từ chối..."
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                          rows={3}
                          className="um-input resize-none"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={handleRejectOrder}
                            disabled={actionLoading || !rejectReason.trim()}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-60"
                          >
                            {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                            Xác nhận từ chối
                          </button>
                          <button
                            onClick={() => { setShowRejectForm(false); setRejectReason(""); }}
                            className="px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors"
                          >
                            Hủy
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-3">
                        {/* Nếu có nợ → chỉ cho từ chối */}
                        {hasDebt ? (
                          <div className="w-full">
                            <div className="flex items-center gap-2 mb-3 p-3 rounded-lg bg-red-50 border border-red-200">
                              <AlertTriangle className="w-4 h-4 text-red-600" />
                              <p className="text-xs text-red-700 font-medium">Store có công nợ — chỉ có thể từ chối đơn hàng.</p>
                            </div>
                            <button
                              onClick={() => setShowRejectForm(true)}
                              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors"
                            >
                              <XCircle className="w-4 h-4" />
                              Từ chối đơn (có nợ)
                            </button>
                          </div>
                        ) : (
                          <>
                            {/* Confirm → Priority 2 + gửi Central Kitchen */}
                            <button
                              onClick={handleConfirmOrder}
                              disabled={actionLoading}
                              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-60"
                            >
                              {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                              Xác nhận đơn (Priority 2)
                            </button>

                            {/* Waiting for Update → thiếu hàng, cần deal */}
                            {selectedOrder.statusOrder === "PENDING" && (
                              <button
                                onClick={handleWaitingForUpdate}
                                disabled={actionLoading}
                                className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-sky-600 text-white text-sm font-semibold hover:bg-sky-700 transition-colors disabled:opacity-60"
                              >
                                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageSquare className="w-4 h-4" />}
                                Thiếu hàng — Deal với Store
                              </button>
                            )}

                            {/* Reject */}
                            <button
                              onClick={() => setShowRejectForm(true)}
                              className="flex items-center gap-2 px-5 py-2.5 rounded-lg border border-red-300 bg-red-50 text-red-700 text-sm font-semibold hover:bg-red-100 transition-colors"
                            >
                              <XCircle className="w-4 h-4" />
                              Từ chối đơn
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Status info for non-actionable orders */}
                {!["PENDING", "WAITING_FOR_UPDATE"].includes(selectedOrder.statusOrder) && (
                  <div className="bg-muted/50 rounded-xl p-4 text-center">
                    <p className="text-sm text-muted-foreground">
                      Đơn hàng đang ở trạng thái <strong>{selectedOrder.statusOrder}</strong> — không cần thao tác thêm.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SupplyCoordinatorOrders;
