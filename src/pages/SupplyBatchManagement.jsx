import { useState, useEffect, useCallback } from "react";
import {
  ClipboardList, CheckCircle, Clock, Loader2, RefreshCw, Search,
  XCircle, AlertCircle, ShieldAlert, Package, ArrowRight,
  MessageSquare, AlertTriangle, DollarSign, ExternalLink,
  FileText, Truck, Factory, ChevronDown, ChevronUp, Sparkles, Calendar, PlusCircle,
} from "lucide-react";
import { toast } from "react-toastify";
import {
  getOrderByStatus,
  getOrderById,
  getOrderDetailByOrderId,
  getOrdersByStore,
  confirmOrder,
  cancelOrder,
  updateOrderStatus,
  updateOrderPriority,
  getCentralKitchenFood,
  createDebtPayment,
  getStorePaymentRecords,
  refundPayment,
  decreaseFoodBaseOnOrder,
  getAllStore,
  getBatchesSuggestion,
  createBatches,
} from "../api/authAPI";

/* ═══════════════════════════════════════════════════════════════════════
   Status helpers
   ═══════════════════════════════════════════════════════════════════════ */
const STATUS_CFG = {
  PENDING:                { color: "text-amber-600",   bg: "bg-amber-50",   border: "border-amber-200",   icon: Clock         },
  APPROVED:               { color: "text-blue-600",    bg: "bg-blue-50",    border: "border-blue-200",    icon: CheckCircle   },
  CONFIRMED:              { color: "text-blue-600",    bg: "bg-blue-50",    border: "border-blue-200",    icon: CheckCircle   },
  COOKING:                { color: "text-orange-600",  bg: "bg-orange-50",  border: "border-orange-200",  icon: AlertCircle   },
  IN_PROGRESS:            { color: "text-purple-600",  bg: "bg-purple-50",  border: "border-purple-200",  icon: Loader2       },
  COOKING_DONE:           { color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200", icon: CheckCircle   },
  WAITING_FOR_UPDATE:     { color: "text-sky-600",     bg: "bg-sky-50",     border: "border-sky-200",     icon: MessageSquare },
  WAITING_FOR_PRODUCTION: { color: "text-orange-500",  bg: "bg-orange-50",  border: "border-orange-200",  icon: AlertCircle   },
  READY_TO_PICK:          { color: "text-blue-600",    bg: "bg-blue-50",    border: "border-blue-200",    icon: Truck         },
  PICKING:                { color: "text-indigo-600",  bg: "bg-indigo-50",  border: "border-indigo-200",  icon: Package       },
  PICKED:                 { color: "text-indigo-600",  bg: "bg-indigo-50",  border: "border-indigo-200",  icon: Package       },
  DELIVERING:             { color: "text-blue-500",    bg: "bg-blue-50",    border: "border-blue-200",    icon: Truck         },
  DELIVERED:              { color: "text-green-600",   bg: "bg-green-50",   border: "border-green-200",   icon: CheckCircle   },
  DELIVERY_FAILED:        { color: "text-red-500",     bg: "bg-red-50",     border: "border-red-200",     icon: XCircle       },
  WAITING_TO_RETURN:      { color: "text-orange-600",  bg: "bg-orange-50",  border: "border-orange-200",  icon: AlertCircle   },
  RETURNED:               { color: "text-gray-600",    bg: "bg-gray-50",    border: "border-gray-200",    icon: CheckCircle   },
  COMPLETED:              { color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200", icon: CheckCircle   },
  REJECTED:               { color: "text-red-600",     bg: "bg-red-50",     border: "border-red-200",     icon: XCircle       },
  CANCELLED:              { color: "text-gray-500",    bg: "bg-gray-50",    border: "border-gray-200",    icon: XCircle       },
};
const statusStyle = (s) =>
  STATUS_CFG[s] ?? { color: "text-gray-600", bg: "bg-gray-50", border: "border-gray-200", icon: AlertCircle };

/* ═══════════════════════════════════════════════════════════════════════
   OrderCard — self-contained card (mirrors SupplyCoordinatorOrders)
   ═══════════════════════════════════════════════════════════════════════ */
const OrderCard = ({ order, storeName, onRefresh }) => {
  const [orderDetail,    setOrderDetail]    = useState(null);
  const [orderNote,      setOrderNote]      = useState("");
  const [storeOrders,    setStoreOrders]    = useState([]);
  const [centralFoods,   setCentralFoods]   = useState([]);
  const [paymentRecords, setPaymentRecords] = useState([]);
  const [detailLoading,  setDetailLoading]  = useState(true);

  const [rejectReason,     setRejectReason]     = useState("");
  const [actionLoading,    setActionLoading]    = useState(false);
  const [showRejectForm,   setShowRejectForm]   = useState(false);
  const [selectedPriority, setSelectedPriority] = useState(2);
  const [priorityNote,     setPriorityNote]     = useState("");

  /* ── Auto-load detail on mount ── */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setDetailLoading(true);
      try {
        const [orderRes, detailRes, storeRes, foodRes, payRecRes] = await Promise.allSettled([
          getOrderById(order.orderId),
          getOrderDetailByOrderId(order.orderId),
          getOrdersByStore(order.storeId),
          getCentralKitchenFood(),
          getStorePaymentRecords(order.storeId),
        ]);
        if (cancelled) return;
        if (orderRes.status  === "fulfilled") { const o = orderRes.value.data?.data  ?? orderRes.value.data;  setOrderNote(o?.note ?? ""); }
        if (detailRes.status === "fulfilled") { const d = detailRes.value.data?.data ?? detailRes.value.data; setOrderDetail(d ?? null); }
        if (storeRes.status  === "fulfilled") { const s = storeRes.value.data?.data  ?? storeRes.value.data  ?? []; setStoreOrders(Array.isArray(s) ? s : []); }
        if (foodRes.status   === "fulfilled") { const f = foodRes.value.data?.data   ?? foodRes.value.data   ?? []; setCentralFoods(Array.isArray(f) ? f : []); }
        if (payRecRes.status === "fulfilled") { const p = payRecRes.value.data?.data ?? payRecRes.value.data ?? []; setPaymentRecords(Array.isArray(p) ? p : []); }
      } catch { /* silent */ }
      finally { if (!cancelled) setDetailLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [order.orderId, order.storeId]);

  const hasDebt = paymentRecords.length > 0 &&
    paymentRecords.some((r) => r.debtAmount > 0 && r.status !== "PAID" && r.status !== "SUCCESS");

  const PRIORITY_LABELS = { 1: "HIGH", 2: "MEDIUM", 3: "LOW" };

  const hasMissingFood = orderDetail?.items && centralFoods.length > 0
    ? orderDetail.items.some((item) => {
        const cf = centralFoods.find((f) => f.foodName === item.foodName);
        const stock = cf ? Number(cf.amount || 0) : 0;
        return Number(item.quantity) > stock;
      })
    : false;

  /* ── Actions ── */
  const handleUpdatePriority = async () => {
    try {
      setActionLoading(true);
      await updateOrderPriority(order.orderId, selectedPriority, priorityNote);
      toast.success(`Đơn ${order.orderId} đã cập nhật Priority ${selectedPriority} - ${PRIORITY_LABELS[selectedPriority]}.`);
      onRefresh();
    } catch (err) { toast.error(err?.response?.data?.message ?? "Không thể cập nhật priority."); }
    finally { setActionLoading(false); }
  };

  const handleConfirmOrder = async () => {
    try {
      setActionLoading(true);
      await confirmOrder(order.orderId, selectedPriority);
      toast.success(`Đơn ${order.orderId} đã xác nhận (Priority ${selectedPriority} - ${PRIORITY_LABELS[selectedPriority]}) → IN_PROGRESS.`);
      onRefresh();
    } catch (err) { toast.error(err?.response?.data?.message ?? "Không thể xác nhận đơn hàng."); }
    finally { setActionLoading(false); }
  };

  const handleReadyToPick = async () => {
    try {
      setActionLoading(true);
      await decreaseFoodBaseOnOrder(order.orderId);
      await updateOrderStatus(order.orderId, "READY_TO_PICK");
      toast.success(`Đơn ${order.orderId} → READY_TO_PICK (đã trừ kho).`);
      onRefresh();
    } catch (err) { toast.error(err?.response?.data?.message ?? "Không thể cập nhật trạng thái."); }
    finally { setActionLoading(false); }
  };

  const handleRejectOrder = async () => {
    if (!rejectReason.trim()) { toast.warn("Vui lòng nhập lý do hủy đơn."); return; }
    try {
      setActionLoading(true);
      await cancelOrder(order.orderId, rejectReason.trim());
      toast.success(`Đơn ${order.orderId} đã được hủy.`);
      if (order.paymentOption === "PAY_AFTER_ORDER" && (order.paymentStatus === "SUCCESS" || order.paymentStatus === "PAID")) {
        try {
          await refundPayment(order.orderId);
          toast.success(`Đã gửi yêu cầu hoàn tiền cho đơn ${order.orderId}.`);
        } catch (refundErr) {
          toast.error(refundErr?.response?.data?.message ?? "Hoàn tiền thất bại — vui lòng xử lý thủ công.");
        }
      }
      onRefresh();
    } catch (err) { toast.error(err?.response?.data?.message ?? "Không thể hủy đơn hàng."); }
    finally { setActionLoading(false); }
  };

  const handleDebtPayment = async () => {
    try {
      setActionLoading(true);
      const res = await createDebtPayment(order.storeId);
      const paymentUrl = res.data?.data?.paymentUrl ?? res.data?.paymentUrl;
      if (paymentUrl) { window.open(paymentUrl, "_blank"); toast.success("Đã mở trang thanh toán nợ VNPay."); }
      else { toast.error("Không nhận được link thanh toán nợ."); }
    } catch (err) {
      toast.error(err?.response?.data?.message ?? err?.response?.data?.error ?? `Tạo link thanh toán nợ thất bại (HTTP ${err?.response?.status ?? "?"}).`);
    } finally { setActionLoading(false); }
  };

  const st = statusStyle(order.statusOrder);
  const StIcon = st.icon;

  return (
    <div className="admin-card rounded-2xl overflow-hidden animate-fade-in border border-border">
      {/* ── Card Header ── */}
      <div className="px-6 py-4 border-b border-border flex flex-wrap items-center justify-between gap-3 bg-muted/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl admin-avatar flex items-center justify-center flex-shrink-0">
            <ClipboardList className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">{order.orderId}</p>
            <p className="text-xs text-muted-foreground">{storeName(order.storeId)} · {order.orderDate ?? "—"}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${st.bg} ${st.color} ${st.border}`}>
            <StIcon className="w-3.5 h-3.5" />
            {order.statusOrder}
          </span>
          <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${
            order.paymentStatus === "SUCCESS" || order.paymentStatus === "PAID"
              ? "bg-emerald-100 text-emerald-700"
              : order.paymentStatus === "FAILED"
              ? "bg-red-100 text-red-600"
              : order.paymentStatus === "PENDING"
              ? "bg-amber-100 text-amber-700"
              : "bg-muted text-muted-foreground"
          }`}>
            {order.paymentStatus === "SUCCESS" || order.paymentStatus === "PAID"
              ? <CheckCircle className="w-3.5 h-3.5" />
              : <Clock className="w-3.5 h-3.5" />
            }
            {order.paymentStatus ?? "—"}
          </span>
        </div>
      </div>

      {detailLoading ? (
        <div className="flex items-center justify-center py-10 gap-3">
          <Loader2 className="w-5 h-5 text-primary animate-spin" />
          <p className="text-sm text-muted-foreground">Đang tải chi tiết...</p>
        </div>
      ) : (
        <div className="px-6 py-5 space-y-5">

          {/* ── Section 1: Order info grid ── */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2">
            {[
              { label: "Order ID",       value: order.orderId },
              { label: "Store",          value: storeName(order.storeId) },
              { label: "Payment",        value: order.paymentOption },
              { label: "Order Status",   value: order.statusOrder },
              { label: "Payment Status", value: order.paymentStatus ?? "—" },
              { label: "Priority",       value: order.priorityLevel ?? "—" },
              { label: "Order Date",     value: order.orderDate ?? "—" },
            ].map((f) => (
              <div key={f.label} className="bg-muted/50 rounded-lg p-2.5 border border-border/50">
                <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">{f.label}</p>
                <p className="text-xs font-medium text-foreground mt-0.5 break-all">{f.value}</p>
              </div>
            ))}
          </div>

          {/* ── Cancel reason ── */}
          {order.statusOrder === "CANCELLED" && order.cancelReason && (
            <div className="flex items-start gap-2 px-4 py-3 rounded-xl bg-red-50 border border-red-200">
              <XCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-semibold text-red-700 uppercase tracking-wider">Lý do hủy đơn</p>
                <p className="text-sm text-red-800 mt-0.5 break-words">{order.cancelReason}</p>
              </div>
            </div>
          )}

          {/* ── Section 2: Order items ── */}
          {orderDetail && orderDetail.items?.length > 0 && (
            <div className="border border-border rounded-xl overflow-hidden">
              <div className="px-4 py-3 bg-muted/50 border-b border-border flex items-center gap-2">
                <Package className="w-4 h-4 text-primary" />
                <h4 className="text-sm font-semibold text-foreground">Order Detail</h4>
                <span className="text-xs text-muted-foreground font-normal">#{orderDetail.orderDetailId}</span>
              </div>

              {orderNote && (
                <div className="flex items-start gap-2 px-4 py-3 bg-amber-50 border-b border-amber-200 text-sm text-amber-800">
                  <FileText className="w-4 h-4 mt-0.5 flex-shrink-0 text-amber-500" />
                  <span><span className="font-semibold">Note:</span> {orderNote}</span>
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="admin-table-header">
                      <th className="px-4 py-2 text-left font-semibold text-muted-foreground uppercase tracking-wide">Food Item</th>
                      <th className="px-4 py-2 text-center font-semibold text-muted-foreground uppercase tracking-wide">Qty</th>
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

          {/* ── Section 3: Kiểm tra nợ ── */}
          <div className={`rounded-lg p-3 border ${hasDebt ? "border-red-200 bg-red-50" : "border-green-200 bg-green-50"}`}>
            <div className="flex items-center gap-2">
              <ShieldAlert className={`w-4 h-4 flex-shrink-0 ${hasDebt ? "text-red-600" : "text-green-600"}`} />
              <div className="flex-1 min-w-0">
                <p className={`text-xs font-semibold ${hasDebt ? "text-red-700" : "text-green-700"}`}>
                  Công nợ — {storeName(order.storeId)}:{hasDebt ? " Có nợ chưa thanh toán" : " Không nợ"}
                </p>
                {storeOrders.length > 0 && (
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {storeOrders.length} đơn từ store này trong hệ thống.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* ── Section 4: Kho Central Food ── */}
          <div className="border border-border rounded-lg overflow-hidden">
            <div className="px-3 py-2 bg-muted/50 border-b border-border flex items-center justify-between">
              <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-primary" />
                Kho Central Food
              </h4>
              <span className="text-[10px] text-muted-foreground">{centralFoods.length} sản phẩm</span>
            </div>
            {centralFoods.length > 0 ? (
              <div className="overflow-x-auto max-h-40 overflow-y-auto">
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
                      <tr key={f.foodId ?? i} className="admin-table-row">
                        <td className="px-4 py-2 font-medium text-foreground">{f.foodName ?? "—"}</td>
                        <td className="px-4 py-2 text-foreground">{f.amount ?? "—"}</td>
                        <td className="px-4 py-2">
                          <span className={`badge ${(f.amount ?? 0) > 0 ? "badge-delivered" : "badge-cancelled"}`}>
                            {(f.amount ?? 0) > 0 ? "Còn hàng" : "Hết hàng"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-5 text-center text-sm text-muted-foreground">Không có dữ liệu kho.</div>
            )}
          </div>

          {/* ── Section 5: Actions (WAITING_FOR_PRODUCTION) ── */}
          {order.statusOrder === "WAITING_FOR_PRODUCTION" && (
            <div className="border border-border rounded-lg p-4 space-y-3">
              <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <ArrowRight className="w-3.5 h-3.5 text-primary" />
                Thao tác
              </h4>

              {showRejectForm ? (
                <div className="space-y-2 bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-xs font-semibold text-red-700">Hủy đơn hàng</p>
                  {order.paymentOption === "PAY_AFTER_ORDER" &&
                   (order.paymentStatus === "SUCCESS" || order.paymentStatus === "PAID") && (
                    <div className="rounded-md p-2 bg-amber-50 border border-amber-200">
                      <p className="text-[11px] text-amber-700 font-medium">
                        Đơn đã thanh toán qua VNPay — hệ thống sẽ tự động hoàn tiền sau khi hủy.
                      </p>
                    </div>
                  )}
                  <textarea
                    placeholder="Nhập lý do hủy..."
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    rows={2}
                    className="um-input resize-none text-sm"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleRejectOrder}
                      disabled={actionLoading || !rejectReason.trim()}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-60"
                    >
                      {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                      Xác nhận hủy
                    </button>
                    <button
                      onClick={() => { setShowRejectForm(false); setRejectReason(""); }}
                      className="px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors"
                    >
                      Hủy bỏ
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Priority selector */}
                  <div className="flex flex-wrap items-end gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Priority</label>
                      <div className="flex gap-1.5">
                        {[
                          { value: 1, label: "1 — HIGH",   color: "border-red-400 bg-red-50 text-red-700" },
                          { value: 2, label: "2 — MEDIUM", color: "border-amber-400 bg-amber-50 text-amber-700" },
                          { value: 3, label: "3 — LOW",    color: "border-green-400 bg-green-50 text-green-700" },
                        ].map((p) => (
                          <button
                            key={p.value}
                            type="button"
                            onClick={() => setSelectedPriority(p.value)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                              selectedPriority === p.value
                                ? `${p.color} ring-2 ring-offset-1 ring-primary/30`
                                : "border-border bg-muted/50 text-muted-foreground hover:border-primary/50"
                            }`}
                          >
                            {p.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="flex-1 min-w-[140px] space-y-1">
                      <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Ghi chú (tùy chọn)</label>
                      <input
                        type="text"
                        placeholder="Ghi chú priority..."
                        value={priorityNote}
                        onChange={(e) => setPriorityNote(e.target.value)}
                        className="um-input text-xs py-1.5"
                      />
                    </div>
                  </div>

                  {/* Stock indicator */}
                  {!hasMissingFood ? (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-50 border border-green-200">
                      <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                      <p className="text-xs text-green-700 font-medium">
                        Đủ hàng trong kho — có thể xác nhận đơn hoặc giao ngay.
                      </p>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200">
                      <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                      <p className="text-xs text-amber-700 font-medium">
                        Thiếu hàng — một số mặt hàng vượt tồn kho. Xác nhận sẽ chuyển sang <strong>IN_PROGRESS</strong> để bếp nấu thêm.
                      </p>
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={handleConfirmOrder}
                      disabled={actionLoading}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-60"
                    >
                      {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                      Xác nhận đơn (Priority {selectedPriority})
                    </button>

                    {!hasMissingFood && (
                      <button
                        onClick={handleReadyToPick}
                        disabled={actionLoading}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-semibold hover:bg-green-700 active:scale-[0.98] transition-all disabled:opacity-60"
                      >
                        {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Truck className="w-4 h-4" />}
                        Sẵn sàng giao (Priority {selectedPriority})
                      </button>
                    )}

                    <button
                      onClick={() => setShowRejectForm(true)}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg border border-red-300 bg-red-50 text-red-700 text-sm font-semibold hover:bg-red-100 transition-colors"
                    >
                      <XCircle className="w-4 h-4" />
                      Hủy đơn
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Section 6: Debt payment ── */}
          {hasDebt && (
            <div className="border border-amber-200 rounded-lg p-4 bg-amber-50/50 space-y-2">
              <h4 className="text-xs font-semibold text-amber-700 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5" />
                Thanh toán công nợ Store
              </h4>
              <p className="text-[10px] text-amber-600">
                Store {storeName(order.storeId)} có nợ chưa thanh toán. Tạo link thanh toán nợ qua VNPay.
              </p>
              <button
                onClick={handleDebtPayment}
                disabled={actionLoading}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-60"
              >
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ExternalLink className="w-4 h-4" />}
                Tạo link thanh toán nợ
              </button>
            </div>
          )}

        </div>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════
   Main component
   ═══════════════════════════════════════════════════════════════════════ */
const SupplyBatchManagement = () => {
  const [orders, setOrders]         = useState([]);
  const [loading, setLoading]       = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [storeNameMap, setStoreNameMap] = useState({});

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
   * The response is an array of batch objects — we store them in
   * createdBatches so we can render them below the action buttons.
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

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getOrderByStatus("WAITING_FOR_PRODUCTION");
      const data = res.data?.data ?? res.data ?? [];
      setOrders(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Không thể tải danh sách đơn hàng.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const filtered = orders.filter((o) => {
    const term = searchTerm.toLowerCase();
    return (
      (o.orderId?.toLowerCase() ?? "").includes(term) ||
      (o.storeId?.toLowerCase() ?? "").includes(term) ||
      (storeName(o.storeId)?.toLowerCase() ?? "").includes(term)
    );
  });

  const stats = {
    total:   orders.length,
    paid:    orders.filter((o) => o.paymentStatus === "SUCCESS" || o.paymentStatus === "PAID").length,
    pending: orders.filter((o) => o.paymentStatus === "PENDING").length,
    credit:  orders.filter((o) => o.paymentMethod === "CREDIT").length,
  };

  return (
    <div className="animate-fade-in space-y-6">

      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Supply Batch Management</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Danh sách đơn hàng đang chờ sản xuất từ bếp trung tâm.
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-orange-100 border border-orange-200">
          <Factory className="w-4 h-4 text-orange-600" />
          <span className="text-xs font-semibold text-orange-700">WAITING FOR PRODUCTION</span>
        </div>
      </div>

      {/* ── Stats cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Tổng đơn",        value: stats.total,   variant: "stat-card-blue" },
          { label: "Đã thanh toán",   value: stats.paid,    variant: "stat-card-green" },
          { label: "Chờ thanh toán",  value: stats.pending, variant: "stat-card-orange" },
          { label: "Thẻ tín dụng",    value: stats.credit,  variant: "stat-card-purple" },
        ].map((s) => (
          <div key={s.label} className={`stat-card rounded-xl p-4 ${s.variant}`}>
            <p className="text-xs text-muted-foreground font-medium">{s.label}</p>
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
                  <span className="text-xs text-muted-foreground bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">
                    {createdBatches.length} lô
                  </span>
                </div>

                {createdBatches.map((batch) => (
                  <div key={batch.batchId} className="border border-emerald-200 rounded-xl overflow-hidden bg-emerald-50/30">

                    {/* Batch summary header */}
                    <div className="px-4 py-3 bg-emerald-50 border-b border-emerald-200 flex flex-wrap items-center justify-between gap-2">
                      <div>
                        {/* batchId — unique identifier for this production batch */}
                        <p className="text-sm font-bold text-foreground">{batch.batchId}</p>
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

                    {/* Mini stat row: totalItems / totalTypes */}
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

                    {/* Items table — one row per food type in this batch */}
                    {batch.items?.length > 0 && (
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="admin-table-header">
                              <th className="px-4 py-2 text-left font-semibold text-muted-foreground uppercase tracking-wide">Mã SP</th>
                              <th className="px-4 py-2 text-left font-semibold text-muted-foreground uppercase tracking-wide">Tên sản phẩm</th>
                              {/* totalQuantity = qty of this food type needed in this batch */}
                              <th className="px-4 py-2 text-center font-semibold text-muted-foreground uppercase tracking-wide">Số lượng</th>
                              {/* sourceDetail = which stores contributed to this qty, e.g. "STORE-D1-001: 20" */}
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

      {/* ── Search + Refresh ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <p className="text-sm text-muted-foreground font-medium">
          {!loading && `${filtered.length} đơn hàng`}
        </p>
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

      {/* ── Order list ── */}
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
            {searchTerm ? "Không tìm thấy kết quả phù hợp." : "Không có đơn hàng nào đang chờ sản xuất."}
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {filtered.map((o) => (
            <OrderCard
              key={o.orderId}
              order={o}
              storeName={storeName}
              onRefresh={fetchOrders}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default SupplyBatchManagement;