import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  ChefHat, CheckCircle, Clock, Loader2, RefreshCw, Search,
  Package, Eye, X, Truck, AlertCircle, XCircle, MessageSquare,
  Bell,
} from "lucide-react";
import { toast } from "react-toastify";
import {
  getAllOrders,
  getOrderDetailByOrderId,
  updateOrderStatus,
  decreaseFoodBaseOnOrder,
} from "../api/authAPI";

/* ═══════════════════════════════════════════════════════════════════════
   Status config
   ═══════════════════════════════════════════════════════════════════════ */
const STATUS_CFG = {
  PENDING:             { color: "text-amber-600",   bg: "bg-amber-50",   border: "border-amber-200",   icon: Clock         },
  IN_PROGRESS:         { color: "text-purple-600",  bg: "bg-purple-50",  border: "border-purple-200",  icon: Clock         },
  COOKING_DONE:        { color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200", icon: CheckCircle   },
  READY_TO_PICK:       { color: "text-blue-600",    bg: "bg-blue-50",    border: "border-blue-200",    icon: Truck         },
  WAITING_FOR_UPDATE:  { color: "text-sky-600",     bg: "bg-sky-50",     border: "border-sky-200",     icon: MessageSquare },
  DELIVERED:           { color: "text-green-600",   bg: "bg-green-50",   border: "border-green-200",   icon: CheckCircle   },
  CANCELLED:           { color: "text-gray-500",    bg: "bg-gray-50",    border: "border-gray-200",    icon: XCircle       },
};
const statusStyle = (s) =>
  STATUS_CFG[s] ?? { color: "text-gray-600", bg: "bg-gray-50", border: "border-gray-200", icon: AlertCircle };

const KITCHEN_STATUSES = ["IN_PROGRESS", "COOKING_DONE", "READY_TO_PICK"];

const TABS = [
  { key: "KITCHEN_ALL",   label: "Tất cả" },
  { key: "IN_PROGRESS",   label: "Chờ xử lý" },
  { key: "COOKING_DONE",  label: "Hoàn thành nấu" },
  { key: "READY_TO_PICK", label: "Sẵn sàng giao" },
  { key: "CANCELLED",     label: "Đã hủy" },
];

/* ═══════════════════════════════════════════════════════════════════════
   Main component
   ═══════════════════════════════════════════════════════════════════════ */
const CentralKitchenOrders = () => {
  const [orders, setOrders]           = useState([]);
  const [loading, setLoading]         = useState(true);
  const [searchTerm, setSearchTerm]   = useState("");
  const [activeTab, setActiveTab]     = useState("KITCHEN_ALL");

  // Modal
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderDetail, setOrderDetail]     = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [cancelledOrders, setCancelledOrders] = useState([]);

  /* ── Fetch orders ── */
  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getAllOrders();
      const data = res.data?.data ?? res.data ?? [];
      const all = Array.isArray(data) ? data : [];
      setOrders(all.filter((o) => KITCHEN_STATUSES.includes(o.statusOrder)));
      setCancelledOrders(all.filter((o) => o.statusOrder === "CANCELLED"));
    } catch {
      toast.error("Không thể tải danh sách đơn hàng.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  /* ── Open detail modal ── */
  const openDetail = async (order) => {
    setSelectedOrder(order);
    setOrderDetail(null);
    setDetailLoading(true);
    try {
      const res = await getOrderDetailByOrderId(order.orderId);
      const d = res.data?.data ?? res.data;
      setOrderDetail(d ?? null);
    } catch {
      toast.error("Lỗi khi tải chi tiết đơn hàng.");
    } finally {
      setDetailLoading(false);
    }
  };

  const closeModal = () => {
    setSelectedOrder(null);
    setOrderDetail(null);
  };

  /* ── Actions ── */
  const handleCookingDone = async () => {
    if (!selectedOrder) return;
    const isStartCooking = selectedOrder.statusOrder === "IN_PROGRESS";
    try {
      setActionLoading(true);
      await updateOrderStatus(selectedOrder.orderId, "COOKING_DONE");
      toast.success(`Đơn ${selectedOrder.orderId} Nấu xong! Sẵn sàng giao hàng.`);

      // Decrease central food stock when starting from IN_PROGRESS ("Bắt đầu nấu")
      if (isStartCooking) {
        try {
          await decreaseFoodBaseOnOrder(selectedOrder.orderId);
          toast.success(`Đã cập nhật nguyên liệu cho đơn ${selectedOrder.orderId}.`);
        } catch (decreaseErr) {
          toast.error(decreaseErr?.response?.data?.message ?? "Không thể cập nhật số lượng nguyên liệu.");
        }
      }

      closeModal();
      await fetchOrders();
    } catch (err) {
      toast.error(err?.response?.data?.message ?? "Không thể cập nhật trạng thái.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReadyToPick = async () => {
    if (!selectedOrder) return;
    try {
      setActionLoading(true);
      await updateOrderStatus(selectedOrder.orderId, "READY_TO_PICK");
      toast.success(`Đơn ${selectedOrder.orderId} đã sẵn sàng giao!`);
      closeModal();
      await fetchOrders();
    } catch (err) {
      toast.error(err?.response?.data?.message ?? "Không thể cập nhật trạng thái.");
    } finally {
      setActionLoading(false);
    }
  };

  /* ── Filtering ── */
  const sourceOrders = activeTab === "CANCELLED" ? cancelledOrders : orders;
  const filtered = sourceOrders.filter((o) => {
    if (activeTab !== "KITCHEN_ALL" && activeTab !== "CANCELLED" && o.statusOrder !== activeTab) return false;
    const term = searchTerm.toLowerCase();
    return (
      (o.orderId?.toLowerCase() ?? "").includes(term) ||
      (o.storeId?.toLowerCase() ?? "").includes(term)
    );
  });

  /* ── Stats ── */
  const stats = {
    total:       orders.length,
    inProgress:  orders.filter((o) => o.statusOrder === "IN_PROGRESS").length,
    cookingDone: orders.filter((o) => o.statusOrder === "COOKING_DONE").length,
    readyToPick: orders.filter((o) => o.statusOrder === "READY_TO_PICK").length,
  };

  /* ═════════════════════════════════════ RENDER ═════════════════════════════════════ */
  return (
    <div className="animate-fade-in space-y-6">

      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Order Processing</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Nhận đơn, nấu và cập nhật trạng thái đơn hàng.
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20">
          <ChefHat className="w-4 h-4 text-primary" />
          <span className="text-xs font-semibold text-primary">Central Kitchen Staff</span>
        </div>
      </div>

      {/* ── Cancelled order notification ── */}
      {cancelledOrders.length > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-50 border border-red-200 animate-fade-in">
          <Bell className="w-5 h-5 text-red-600 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-red-700">
              {cancelledOrders.length} đơn hàng đã bị hủy
            </p>
            <p className="text-xs text-red-600 mt-0.5">
              Có đơn hàng bị hủy bởi Supply Coordinator / Store. Xem tab "Đã hủy" để biết chi tiết.
            </p>
          </div>
          <button
            onClick={() => setActiveTab("CANCELLED")}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-600 text-white hover:bg-red-700 transition-colors flex-shrink-0"
          >
            Xem
          </button>
        </div>
      )}

      {/* ── Stats cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Tổng đơn",       value: stats.total,       variant: "stat-card-blue",   icon: Package },
          { label: "Chờ xử lý",      value: stats.inProgress,  variant: "stat-card-orange", icon: Clock },
          { label: "Hoàn thành nấu", value: stats.cookingDone, variant: "stat-card-green",  icon: CheckCircle },
          { label: "Sẵn sàng giao",  value: stats.readyToPick, variant: "stat-card-purple", icon: Truck },
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
            <ChefHat className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-base font-semibold text-foreground">Không có đơn hàng nào</p>
          <p className="text-sm text-muted-foreground">
            {searchTerm ? "Không tìm thấy kết quả." : "Chưa có đơn hàng nào được gửi đến bếp."}
          </p>
        </div>
      ) : (
        <div className="admin-card rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-border flex items-center justify-between">
            <h3 className="text-base font-semibold text-foreground">
              {activeTab === "KITCHEN_ALL" ? "All Kitchen Orders" : TABS.find((t) => t.key === activeTab)?.label}
            </h3>
            <span className="badge badge-delivered">{filtered.length} đơn</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="admin-table-header">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Order ID</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Store</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Delivery Date</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Priority</th>
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
                            <ChefHat className="w-4 h-4" />
                          </div>
                          <p className="font-medium text-foreground">{o.orderId}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-foreground">{o.storeId}</td>
                      <td className="px-6 py-4 text-muted-foreground">{o.orderDate ?? "—"}</td>
                      <td className="px-6 py-4">
                        {o.priorityLevel ? (
                          <span className="badge badge-pending">Level {o.priorityLevel}</span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${st.bg} ${st.color} ${st.border}`}>
                          <StIcon className="w-3.5 h-3.5" />
                          {o.statusOrder}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => openDetail(o)}
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
      {selectedOrder && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-8">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={closeModal} />

          <div className="relative bg-background border border-border rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col animate-fade-in">
            {/* Modal header */}
            <div className="flex-shrink-0 px-5 py-3 border-b border-border flex items-center justify-between rounded-t-2xl">
              <div>
                <h3 className="text-base font-bold text-foreground">
                  Đơn hàng — {selectedOrder.orderId}
                </h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Store: {selectedOrder.storeId} · {selectedOrder.orderDate}
                </p>
              </div>
              <button
                onClick={closeModal}
                className="p-2 rounded-lg bg-muted hover:bg-destructive hover:text-destructive-foreground transition-colors"
                title="Đóng"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {detailLoading ? (
              <div className="flex-1 flex items-center justify-center p-8">
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="w-7 h-7 text-primary animate-spin" />
                  <p className="text-sm text-muted-foreground">Đang tải chi tiết...</p>
                </div>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto p-5 space-y-4">

                {/* ── Order info ── */}
                <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                  {[
                    { label: "Order ID",   value: selectedOrder.orderId },
                    { label: "Store",      value: selectedOrder.storeId },
                    { label: "Status",     value: selectedOrder.statusOrder },
                    { label: "Priority",   value: selectedOrder.priorityLevel ? `Level ${selectedOrder.priorityLevel}` : "—" },
                    { label: "Payment",    value: selectedOrder.paymentOption ?? "—" },
                    { label: "Delivery Date", value: selectedOrder.orderDate ?? "—" },
                  ].map((f) => (
                    <div key={f.label} className="bg-muted/50 rounded-lg p-2">
                      <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">{f.label}</p>
                      <p className="text-xs font-medium text-foreground mt-0.5 truncate">{f.value}</p>
                    </div>
                  ))}
                </div>

                {/* ── Note ── */}
                <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3">
                  <MessageSquare className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-semibold text-amber-700 uppercase tracking-wider">Note</p>
                    <p className="text-sm text-amber-900 mt-0.5 break-words">
                      {selectedOrder.note?.trim() ? selectedOrder.note : <span className="italic text-amber-500">No note provided</span>}
                    </p>
                  </div>
                </div>

                {/* ── Order items ── */}
                {orderDetail && orderDetail.items?.length > 0 && (
                  <div className="border border-border rounded-xl overflow-hidden">
                    <div className="px-4 py-3 bg-muted/50 border-b border-border flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                        <Package className="w-4 h-4 text-primary" />
                        Chi tiết sản phẩm cần nấu
                        <span className="text-xs text-muted-foreground font-normal">#{orderDetail.orderDetailId}</span>
                      </h4>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="admin-table-header">
                            <th className="px-4 py-2 text-left font-semibold text-muted-foreground uppercase tracking-wide">Food Item</th>
                            <th className="px-4 py-2 text-center font-semibold text-muted-foreground uppercase tracking-wide">Quantity</th>
                            <th className="px-4 py-2 text-right font-semibold text-muted-foreground uppercase tracking-wide">Unit Price (VND)</th>
                            <th className="px-4 py-2 text-right font-semibold text-muted-foreground uppercase tracking-wide">Subtotal</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {orderDetail.items.map((item, idx) => (
                            <tr key={idx} className="admin-table-row">
                              <td className="px-4 py-2.5 font-medium text-foreground">{item.foodName}</td>
                              <td className="px-4 py-2.5 text-center text-muted-foreground">{item.quantity}</td>
                              <td className="px-4 py-2.5 text-right text-muted-foreground">{item.unitPrice?.toLocaleString()}</td>
                              <td className="px-4 py-2.5 text-right font-semibold text-foreground">{item.totalAmount?.toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="bg-primary/5 border-t border-primary/20">
                            <td colSpan={3} className="px-4 py-2.5 text-right text-xs font-bold text-foreground uppercase tracking-wide">Total</td>
                            <td className="px-4 py-2.5 text-right text-sm font-bold text-primary">
                              {orderDetail.amount?.toLocaleString()}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                )}

                {/* ── Current status indicator ── */}
                {(() => {
                  const st = statusStyle(selectedOrder.statusOrder);
                  const StIcon = st.icon;
                  return (
                    <div className={`rounded-xl p-4 border ${st.border} ${st.bg}`}>
                      <div className="flex items-center gap-3">
                        <StIcon className={`w-5 h-5 ${st.color}`} />
                        <div>
                          <p className={`text-sm font-semibold ${st.color}`}>
                            Trạng thái hiện tại: {selectedOrder.statusOrder}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {selectedOrder.statusOrder === "IN_PROGRESS"
                              ? "Đơn hàng đã được xác nhận từ Supply Coordinator. Khi nấu xong, bấm \"Hoàn thành nấu\" để cập nhật."
                              : selectedOrder.statusOrder === "COOKING_DONE"
                              ? "Đã nấu xong. Bấm \"Ready To Delivery\" để xác nhận sẵn sàng giao."
                              : selectedOrder.statusOrder === "READY_TO_PICK"
                              ? "Đã đóng gói. Đang chờ đơn vị vận chuyển lấy hàng."
                              : ""}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* ── Actions ── */}
                <div className="flex flex-wrap gap-3">
                  {/* IN_PROGRESS → COOKING_DONE */}
                  {selectedOrder.statusOrder === "IN_PROGRESS" && (
                    <button
                      onClick={handleCookingDone}
                      disabled={actionLoading}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 active:scale-[0.98] transition-all disabled:opacity-60"
                    >
                      {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                      Hoàn thành nấu
                    </button>
                  )}

                  {/* COOKING_DONE → Sẵn sàng giao (READY_TO_PICK) */}
                  {selectedOrder.statusOrder === "COOKING_DONE" && (
                    <button
                      onClick={handleReadyToPick}
                      disabled={actionLoading}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 active:scale-[0.98] transition-all disabled:opacity-60"
                    >
                      {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Truck className="w-4 h-4" />}
                      Ready To Delivery
                    </button>
                  )}

                  {/* Hiện thông báo lúc sẵn sàng giao */}
                  {selectedOrder.statusOrder === "READY_TO_PICK" && (
                    <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-blue-50 border border-blue-200 w-full">
                      <Truck className="w-5 h-5 text-blue-600" />
                      <p className="text-sm font-medium text-blue-700">
                        Đơn hàng đã hoàn thành — sẵn sàng giao cho Supply Coordinator.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default CentralKitchenOrders;
