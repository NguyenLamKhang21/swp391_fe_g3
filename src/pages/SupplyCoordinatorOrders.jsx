import { useState, useEffect, useCallback } from "react";
import {
  ClipboardList, CheckCircle, Clock, Loader2, RefreshCw, Search,
  XCircle, AlertCircle, ShieldAlert, Package, ArrowRight,
  MessageSquare, AlertTriangle, DollarSign, ExternalLink,
  FileText, Truck,
} from "lucide-react";
import { toast } from "react-toastify";
import {
  decreaseFoodBaseOnOrder,
  getAllOrders,
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
  getAllStore,
} from "../api/authAPI";

/* ═══════════════════════════════════════════════════════════════════════
   Status helpers
   ═══════════════════════════════════════════════════════════════════════ */
const STATUS_CFG = {
  PENDING:               { color: "text-amber-600",   bg: "bg-amber-50",   border: "border-amber-200",   icon: Clock         },
  APPROVED:              { color: "text-blue-600",    bg: "bg-blue-50",    border: "border-blue-200",    icon: CheckCircle   },
  CONFIRMED:             { color: "text-blue-600",    bg: "bg-blue-50",    border: "border-blue-200",    icon: CheckCircle   },
  COOKING:               { color: "text-orange-600",  bg: "bg-orange-50",  border: "border-orange-200",  icon: AlertCircle   },
  IN_PROGRESS:           { color: "text-purple-600",  bg: "bg-purple-50",  border: "border-purple-200",  icon: Loader2       },
  COOKING_DONE:          { color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200", icon: CheckCircle   },
  WAITING_FOR_UPDATE:    { color: "text-sky-600",     bg: "bg-sky-50",     border: "border-sky-200",     icon: MessageSquare },
  WAITING_FOR_PRODUCTION:{ color: "text-orange-500",  bg: "bg-orange-50",  border: "border-orange-200",  icon: AlertCircle   },
  READY_TO_PICK:         { color: "text-blue-600",    bg: "bg-blue-50",    border: "border-blue-200",    icon: Truck         },
  PICKING:               { color: "text-indigo-600",  bg: "bg-indigo-50",  border: "border-indigo-200",  icon: Package       },
  PICKED:                { color: "text-indigo-600",  bg: "bg-indigo-50",  border: "border-indigo-200",  icon: Package       },
  DELIVERING:            { color: "text-blue-500",    bg: "bg-blue-50",    border: "border-blue-200",    icon: Truck         },
  DELIVERED:             { color: "text-green-600",   bg: "bg-green-50",   border: "border-green-200",   icon: CheckCircle   },
  DELIVERY_FAILED:       { color: "text-red-500",     bg: "bg-red-50",     border: "border-red-200",     icon: XCircle       },
  WAITING_TO_RETURN:     { color: "text-orange-600",  bg: "bg-orange-50",  border: "border-orange-200",  icon: AlertCircle   },
  RETURNED:              { color: "text-gray-600",    bg: "bg-gray-50",    border: "border-gray-200",    icon: CheckCircle   },
  COMPLETED:             { color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200", icon: CheckCircle   },
  REJECTED:              { color: "text-red-600",     bg: "bg-red-50",     border: "border-red-200",     icon: XCircle       },
  CANCELLED:             { color: "text-gray-500",    bg: "bg-gray-50",    border: "border-gray-200",    icon: XCircle       },
};
const statusStyle = (s) =>
  STATUS_CFG[s] ?? { color: "text-gray-600", bg: "bg-gray-50", border: "border-gray-200", icon: AlertCircle };

const TABS = [
  { key: "ALL",                    label: "Tất cả" },
  { key: "PENDING",                label: "Pending" },
  { key: "IN_PROGRESS",            label: "In Progress" },
  { key: "CANCELLED",              label: "Cancelled" },
  { key: "COMPLETED",              label: "Completed" },
  { key: "COOKING_DONE",           label: "Cooking Done" },
  { key: "WAITING_FOR_UPDATE",     label: "Waiting Update" },
  { key: "WAITING_FOR_PRODUCTION", label: "Waiting Prod." },
  { key: "READY_TO_PICK",          label: "Ready To Pick" },
  { key: "PICKING",                label: "Picking" },
  { key: "PICKED",                 label: "Picked" },
  { key: "DELIVERING",             label: "Delivering" },
  { key: "DELIVERED",              label: "Delivered" },
  { key: "DELIVERY_FAILED",        label: "Delivery Failed" },
  { key: "WAITING_TO_RETURN",      label: "Waiting Return" },
  { key: "RETURNED",               label: "Returned" },
];

/* ═══════════════════════════════════════════════════════════════════════
   OrderCard — self-contained card that fetches & shows all order detail
   ═══════════════════════════════════════════════════════════════════════ */
const OrderCard = ({ order, storeName, onRefresh }) => {
  const [orderDetail,    setOrderDetail]    = useState(null);
  const [orderNote,      setOrderNote]      = useState("");
  const [storeOrders,    setStoreOrders]    = useState([]);
  const [centralFoods,   setCentralFoods]   = useState([]);
  const [paymentRecords, setPaymentRecords] = useState([]);
  const [detailLoading,  setDetailLoading]  = useState(true);

  const [rejectReason,      setRejectReason]      = useState("");
  const [actionLoading,     setActionLoading]     = useState(false);
  const [showRejectForm,    setShowRejectForm]    = useState(false);
  const [selectedPriority,  setSelectedPriority]  = useState(2);
  const [priorityNote,      setPriorityNote]      = useState("");

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
        if (orderRes.status === "fulfilled") {
          const o = orderRes.value.data?.data ?? orderRes.value.data;
          setOrderNote(o?.note ?? "");
        }
        if (detailRes.status === "fulfilled") {
          const d = detailRes.value.data?.data ?? detailRes.value.data;
          setOrderDetail(d ?? null);
        }
        if (storeRes.status === "fulfilled") {
          const s = storeRes.value.data?.data ?? storeRes.value.data ?? [];
          setStoreOrders(Array.isArray(s) ? s : []);
        }
        if (foodRes.status === "fulfilled") {
          const f = foodRes.value.data?.data ?? foodRes.value.data ?? [];
          setCentralFoods(Array.isArray(f) ? f : []);
        }
        if (payRecRes.status === "fulfilled") {
          const p = payRecRes.value.data?.data ?? payRecRes.value.data ?? [];
          setPaymentRecords(Array.isArray(p) ? p : []);
        }
      } catch { /* silent */ }
      finally { if (!cancelled) setDetailLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [order.orderId, order.storeId]);

  const hasDebt = paymentRecords.length > 0 &&
    paymentRecords.some((r) => r.debtAmount > 0 && r.status !== "PAID" && r.status !== "SUCCESS");

  const PRIORITY_LABELS = { 1: "HIGH", 2: "MEDIUM", 3: "LOW" };

  const handleUpdatePriority = async () => {
    try {
      setActionLoading(true);
      await updateOrderPriority(order.orderId, selectedPriority, priorityNote);
      toast.success(`Đơn ${order.orderId} đã cập nhật Priority ${selectedPriority} - ${PRIORITY_LABELS[selectedPriority]}.`);
      onRefresh();
    } catch (err) {
      toast.error(err?.response?.data?.message ?? "Không thể cập nhật priority.");
    } finally { setActionLoading(false); }
  };

  const handleConfirmOrder = async () => {
    try {
      setActionLoading(true);
      if (order.statusOrder === "WAITING_FOR_UPDATE") {
        await updateOrderPriority(order.orderId, selectedPriority, priorityNote);
        await updateOrderStatus(order.orderId, "COOKING_DONE");
        toast.success(`Đơn ${order.orderId} đã xác nhận (Priority ${selectedPriority} - ${PRIORITY_LABELS[selectedPriority]}).`);
      } else {
        // Old flow: confirmOrder sets status → IN_PROGRESS on the backend
        await confirmOrder(order.orderId, selectedPriority);
        toast.success(`Đơn ${order.orderId} đã xác nhận (Priority ${selectedPriority} - ${PRIORITY_LABELS[selectedPriority]}) → IN_PROGRESS.`);
      }
      onRefresh();
    } catch (err) {
      toast.error(err?.response?.data?.message ?? "Không thể xác nhận đơn hàng.");
    } finally { setActionLoading(false); }
  };

  const handleReadyToPick = async () => {
    try {
      setActionLoading(true);
      await decreaseFoodBaseOnOrder(order.orderId);
      await updateOrderStatus(order.orderId, "READY_TO_PICK");
      toast.success(`Đơn ${order.orderId} → READY_TO_PICK (đã trừ kho).`);
      onRefresh();
    } catch (err) {
      toast.error(err?.response?.data?.message ?? "Không thể cập nhật trạng thái.");
    } finally { setActionLoading(false); }
  };

  const handleRejectOrder = async () => {
    if (!rejectReason.trim()) { toast.warn("Vui lòng nhập lý do hủy đơn."); return; }
    try {
      setActionLoading(true);
      await cancelOrder(order.orderId, rejectReason.trim());
      toast.success(`Đơn ${order.orderId} đã được hủy.`);
      if (
        order.paymentOption === "PAY_AFTER_ORDER" &&
        (order.paymentStatus === "SUCCESS" || order.paymentStatus === "PAID")
      ) {
        try {
          await refundPayment(order.orderId);
          toast.success(`Đã gửi yêu cầu hoàn tiền cho đơn ${order.orderId}.`);
        } catch (refundErr) {
          toast.error(refundErr?.response?.data?.message ?? "Hoàn tiền thất bại — vui lòng xử lý thủ công.");
        }
      }
      onRefresh();
    } catch (err) {
      toast.error(err?.response?.data?.message ?? "Không thể hủy đơn hàng.");
    } finally { setActionLoading(false); }
  };

  const handleWaitingForUpdate = async () => {
    try {
      setActionLoading(true);
      await updateOrderStatus(order.orderId, "WAITING_FOR_UPDATE");
      toast.success(`Đơn ${order.orderId} → Waiting for Update (chờ phản hồi từ Store).`);
      onRefresh();
    } catch (err) {
      toast.error(err?.response?.data?.message ?? "Không thể cập nhật trạng thái.");
    } finally { setActionLoading(false); }
  };

  const handleWaitingForProduction = async () => {
    try {
      setActionLoading(true);
      await updateOrderStatus(order.orderId, "WAITING_FOR_PRODUCTION");
      toast.success(`Đơn ${order.orderId} → Waiting for Production (đợi bếp nấu thêm).`);
      onRefresh();
    } catch (err) {
      toast.error(err?.response?.data?.message ?? "Không thể cập nhật trạng thái.");
    } finally { setActionLoading(false); }
  };

  const handleDebtPayment = async () => {
    try {
      setActionLoading(true);
      const res = await createDebtPayment(order.storeId);
      const paymentUrl = res.data?.data?.paymentUrl ?? res.data?.paymentUrl;
      if (paymentUrl) { window.open(paymentUrl, "_blank"); toast.success("Đã mở trang thanh toán nợ VNPay."); }
      else { toast.error("Không nhận được link thanh toán nợ."); }
    } catch (err) {
      const msg = err?.response?.data?.message ?? err?.response?.data?.error
        ?? `Tạo link thanh toán nợ thất bại (HTTP ${err?.response?.status ?? "?"}).`;
      toast.error(msg);
    } finally { setActionLoading(false); }
  };

  const st = statusStyle(order.statusOrder);
  const StIcon = st.icon;

  // check xem quantity trong order có quá ammount trong kho central food ko
  // true  → some item qty > stock  → needs kitchen production
  // false → all items within stock → can fulfill directly from warehouse
  const hasMissingFood = orderDetail?.items && centralFoods.length > 0
    ? orderDetail.items.some((item) => {
        const cf = centralFoods.find((f) => f.foodName === item.foodName);
        const stock = cf ? Number(cf.amount || 0) : 0;
        return Number(item.quantity) > stock;
      })
    : false;

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
              ? "bg-emerald-100 text-emerald-700" :
            order.paymentStatus === "FAILED"
              ? "bg-red-100 text-red-600" :
            order.paymentStatus === "PENDING"
              ? "bg-amber-100 text-amber-700" :
            "bg-muted text-muted-foreground"
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
              { label: "Delivery Date",  value: order.orderDate ?? "—" },
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

              {/* Note callout */}
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

          {/* ── Section 5: Actions (PENDING / WAITING_FOR_UPDATE) ── */}
          {(order.statusOrder === "PENDING" || order.statusOrder === "WAITING_FOR_UPDATE") && (
            <div className="border border-border rounded-lg p-4 space-y-3">
              <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <ArrowRight className="w-3.5 h-3.5 text-primary" />
                Thao tác
              </h4>

              {showRejectForm ? (
                <div className="space-y-2 bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-xs font-semibold text-red-700">Từ chối / Hủy đơn hàng</p>
                  {order.paymentOption === "PAY_AFTER_ORDER" &&
                   (order.paymentStatus === "SUCCESS" || order.paymentStatus === "PAID") && (
                    <div className="rounded-md p-2 bg-amber-50 border border-amber-200">
                      <p className="text-[11px] text-amber-700 font-medium">
                        Đơn đã thanh toán qua VNPay — hệ thống sẽ tự động hoàn tiền sau khi hủy.
                      </p>
                    </div>
                  )}
                  <textarea
                    placeholder="Nhập lý do từ chối..."
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
                    <div className="space-y-3 w-full">
                      {/* Priority selector + Note */}
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

                      {/* Stock-sufficiency indicator */}
                      {!hasMissingFood ? (
                        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-50 border border-green-200">
                          <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                          <p className="text-xs text-green-700 font-medium">
                            Đủ hàng trong kho — có thể dùng <strong>Sẵn sàng giao</strong> để trừ kho và chuyển thẳng sang <strong>READY_TO_PICK</strong>, hoặc <strong>Xác nhận đơn</strong> để chuyển sang <strong>IN_PROGRESS</strong>.
                          </p>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200">
                          <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                          <p className="text-xs text-amber-700 font-medium">
                            Thiếu hàng — một số mặt hàng vượt tồn kho. Xác nhận đơn sẽ chuyển sang <strong>IN_PROGRESS</strong> để bếp nấu thêm.
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

                        {order.statusOrder === "PENDING" && (
                          <button
                            onClick={handleWaitingForUpdate}
                            disabled={actionLoading}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-sky-600 text-white text-sm font-semibold hover:bg-sky-700 transition-colors disabled:opacity-60"
                          >
                            {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageSquare className="w-4 h-4" />}
                            Thiếu hàng — Deal với Store
                          </button>
                        )}

                        {hasMissingFood && (
                          <button
                            onClick={handleWaitingForProduction}
                            disabled={actionLoading}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-600 text-white text-sm font-semibold hover:bg-orange-700 transition-colors disabled:opacity-60"
                          >
                            {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <AlertCircle className="w-4 h-4" />}
                            Đợi bếp nấu thêm → WAITING_FOR_PRODUCTION
                          </button>
                        )}

                        <button
                          onClick={() => setShowRejectForm(true)}
                          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-red-300 bg-red-50 text-red-700 text-sm font-semibold hover:bg-red-100 transition-colors"
                        >
                          <XCircle className="w-4 h-4" />
                          Từ chối đơn
                        </button>
                      </div>
                    </div>
                  )}
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

          {/* ── APPROVED/CONFIRMED: cancel by store request ── */}
          {["APPROVED", "CONFIRMED"].includes(order.statusOrder) && (
            <div className="border border-border rounded-lg p-4 space-y-3">
              <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <ArrowRight className="w-3.5 h-3.5 text-primary" />
                Hủy đơn (theo yêu cầu Store qua điện thoại)
              </h4>
              <div className="rounded-lg p-3 bg-blue-50 border border-blue-200 space-y-1">
                <p className="text-xs text-blue-700 font-medium">
                  Central Kitchen chưa bắt đầu chế biến — có thể hủy đơn.
                </p>
                <p className="text-xs text-blue-600">
                  {order.paymentOption === "PAY_AFTER_ORDER" &&
                   (order.paymentStatus === "SUCCESS" || order.paymentStatus === "PAID")
                    ? "PAY_AFTER_ORDER (đã thanh toán) — sẽ hoàn tiền qua VNPay sau khi hủy."
                    : order.paymentOption === "PAY_AT_THE_END_OF_MONTH"
                    ? "PAY_AT_THE_END_OF_MONTH — đơn sẽ không tính vào nợ cuối tháng."
                    : order.paymentOption === "PAY_AFTER_DELIVERY"
                    ? "PAY_AFTER_DELIVERY — chưa thanh toán, ghi nhận hủy hợp lệ."
                    : `Hình thức: ${order.paymentOption ?? "—"}`
                  }
                </p>
              </div>
              {showRejectForm ? (
                <div className="space-y-2 bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-xs font-semibold text-red-700">Lý do hủy đơn</p>
                  {order.paymentOption === "PAY_AFTER_ORDER" &&
                   (order.paymentStatus === "SUCCESS" || order.paymentStatus === "PAID") && (
                    <div className="rounded-md p-2 bg-amber-50 border border-amber-200">
                      <p className="text-[11px] text-amber-700 font-medium">
                        Đơn đã thanh toán — hệ thống sẽ tự động hoàn tiền sau khi hủy.
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
                      Xác nhận hủy đơn
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
                <button
                  onClick={() => setShowRejectForm(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border border-red-300 bg-red-50 text-red-700 text-sm font-semibold hover:bg-red-100 transition-colors"
                >
                  <XCircle className="w-4 h-4" />
                  Hủy đơn hàng
                </button>
              )}
            </div>
          )}

          {/* ── READY_TO_PICK / WAITING_FOR_PRODUCTION: free priority update panel ── */}
          {["READY_TO_PICK", "WAITING_FOR_PRODUCTION"].includes(order.statusOrder) && (
            <div className="border border-blue-200 rounded-lg p-4 space-y-3 bg-blue-50/40">
              <h4 className="text-xs font-semibold text-blue-800 flex items-center gap-1.5">
                <ArrowRight className="w-3.5 h-3.5 text-blue-600" />
                Cập nhật Priority — đơn đang {order.statusOrder}
              </h4>
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
              <button
                onClick={handleUpdatePriority}
                disabled={actionLoading}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-60"
              >
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                Cập nhật Priority
              </button>
            </div>
          )}

          {/* ── IN_PROGRESS / COOKING_DONE ── */}
          {["IN_PROGRESS", "COOKING_DONE"].includes(order.statusOrder) && (
            <div className="rounded-lg p-4 bg-red-50 border border-red-200">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
                <div>
                  <p className="text-sm text-red-700 font-semibold">Không thể hủy — Central Kitchen đã bắt đầu chế biến</p>
                  <p className="text-xs text-red-600 mt-0.5">
                    Trạng thái: {order.statusOrder}. Đơn chỉ có thể hủy trước khi Central Kitchen bắt đầu nấu.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ── DELIVERED / CANCELLED / REJECTED ── */}
          {["DELIVERED", "CANCELLED", "REJECTED"].includes(order.statusOrder) && (
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <p className="text-xs text-muted-foreground">
                Trạng thái <strong>{order.statusOrder}</strong> — không cần thao tác thêm.
              </p>
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
const SupplyCoordinatorOrders = () => {
  const [orders, setOrders]         = useState([]);
  const [loading, setLoading]       = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab]   = useState("ALL");
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

  const filtered = orders.filter((o) => {
    if (activeTab !== "ALL" && o.statusOrder !== activeTab) return false;
    const term = searchTerm.toLowerCase();
    return (
      (o.orderId?.toLowerCase() ?? "").includes(term) ||
      (o.storeId?.toLowerCase() ?? "").includes(term) ||
      (storeName(o.storeId)?.toLowerCase() ?? "").includes(term) ||
      (o.statusOrder?.toLowerCase() ?? "").includes(term)
    );
  });

  const stats = {
    total:     orders.length,
    pending:   orders.filter((o) => o.statusOrder === "PENDING").length,
    waiting:   orders.filter((o) => o.statusOrder === "WAITING_FOR_UPDATE").length,
    approved:  orders.filter((o) => ["APPROVED", "CONFIRMED"].includes(o.statusOrder)).length,
    cooking:   orders.filter((o) => ["COOKING", "COOKING_DONE"].includes(o.statusOrder)).length,
    delivered: orders.filter((o) => o.statusOrder === "DELIVERED").length,
    cancelled: orders.filter((o) => ["REJECTED", "CANCELLED"].includes(o.statusOrder)).length,
  };

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
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        {[
          { label: "Tổng đơn",  value: stats.total,     variant: "stat-card-blue" },
          { label: "Pending",   value: stats.pending,   variant: "stat-card-orange" },
          { label: "Waiting",   value: stats.waiting,   variant: "stat-card-purple" },
          { label: "Approved",  value: stats.approved,  variant: "stat-card-green" },
          { label: "Cooking",   value: stats.cooking,   variant: "stat-card-orange" },
          { label: "Delivered", value: stats.delivered, variant: "stat-card-green" },
          { label: "Cancelled", value: stats.cancelled, variant: "stat-card-red" },
        ].map((s) => (
          <div key={s.label} className={`stat-card rounded-xl p-4 ${s.variant}`}>
            <p className="text-xs text-muted-foreground font-medium">{s.label}</p>
            <p className="text-2xl font-bold text-foreground mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      {/* ── Tabs + Search ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-1 bg-muted rounded-lg p-1 overflow-x-auto max-w-full">
          {TABS.map((t) => {
            const count = t.key === "ALL" ? orders.length : orders.filter((o) => o.statusOrder === t.key).length;
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
                {count > 0 && (
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] leading-none font-bold ${
                    activeTab === t.key
                      ? "bg-primary-foreground/20 text-primary-foreground"
                      : "bg-foreground/10 text-muted-foreground"
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
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
            {searchTerm ? "Không tìm thấy kết quả phù hợp." : "Chưa có đơn hàng nào trong hệ thống."}
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground font-medium">{filtered.length} đơn hàng</p>
          </div>
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

export default SupplyCoordinatorOrders;
