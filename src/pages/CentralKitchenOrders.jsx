import { useState, useEffect, useCallback } from "react";
import {
  ChefHat, CheckCircle, Clock, Loader2, RefreshCw, Search,
  Package, Eye, X, Flame, Truck, AlertCircle, XCircle, MessageSquare,
} from "lucide-react";
import { toast } from "react-toastify";
import {
  getAllOrders,
  getOrderDetailByOrderId,
  updateOrderStatus,
} from "../api/authAPI";

/* ═══════════════════════════════════════════════════════════════════════
   Status config
   ═══════════════════════════════════════════════════════════════════════ */
const STATUS_CFG = {
  PENDING:             { color: "text-amber-600",   bg: "bg-amber-50",   border: "border-amber-200",   icon: Clock         },
  APPROVED:            { color: "text-blue-600",    bg: "bg-blue-50",    border: "border-blue-200",    icon: CheckCircle   },
  CONFIRMED:           { color: "text-blue-600",    bg: "bg-blue-50",    border: "border-blue-200",    icon: CheckCircle   },
  COOKING:             { color: "text-orange-600",  bg: "bg-orange-50",  border: "border-orange-200",  icon: Flame         },
  COOKING_DONE:        { color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200", icon: CheckCircle   },
  IN_PROCESS:          { color: "text-purple-600",  bg: "bg-purple-50",  border: "border-purple-200",  icon: Loader2       },
  WAITING_FOR_UPDATE:  { color: "text-sky-600",     bg: "bg-sky-50",     border: "border-sky-200",     icon: MessageSquare },
  DELIVERED:           { color: "text-green-600",   bg: "bg-green-50",   border: "border-green-200",   icon: CheckCircle   },
  REJECTED:            { color: "text-red-600",     bg: "bg-red-50",     border: "border-red-200",     icon: XCircle       },
  CANCELLED:           { color: "text-gray-500",    bg: "bg-gray-50",    border: "border-gray-200",    icon: XCircle       },
};
const statusStyle = (s) =>
  STATUS_CFG[s] ?? { color: "text-gray-600", bg: "bg-gray-50", border: "border-gray-200", icon: AlertCircle };

const KITCHEN_STATUSES = ["APPROVED", "CONFIRMED", "COOKING", "COOKING_DONE"];

const TABS = [
  { key: "KITCHEN_ALL", label: "Tất cả" },
  { key: "APPROVED",    label: "Chờ nấu" },
  { key: "COOKING",     label: "Đang nấu" },
  { key: "COOKING_DONE",label: "Nấu xong" },
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

  /* ── Fetch orders ── */
  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getAllOrders();
      const data = res.data?.data ?? res.data ?? [];
      const all = Array.isArray(data) ? data : [];
      setOrders(all.filter((o) => KITCHEN_STATUSES.includes(o.statusOrder)));
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
  const handleStartCooking = async () => {
    if (!selectedOrder) return;
    try {
      setActionLoading(true);
      await updateOrderStatus(selectedOrder.orderId, "COOKING");
      toast.success(`Đơn ${selectedOrder.orderId} → Đang nấu.`);
      closeModal();
      await fetchOrders();
    } catch (err) {
      toast.error(err?.response?.data?.message ?? "Không thể cập nhật trạng thái.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCookingDone = async () => {
    if (!selectedOrder) return;
    try {
      setActionLoading(true);
      await updateOrderStatus(selectedOrder.orderId, "COOKING_DONE");
      toast.success(`Đơn ${selectedOrder.orderId} → Nấu xong! Sẵn sàng giao hàng.`);
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
    if (activeTab !== "KITCHEN_ALL" && o.statusOrder !== activeTab) return false;
    const term = searchTerm.toLowerCase();
    return (
      (o.orderId?.toLowerCase() ?? "").includes(term) ||
      (o.storeId?.toLowerCase() ?? "").includes(term)
    );
  });

  /* ── Stats ── */
  const stats = {
    total:       orders.length,
    approved:    orders.filter((o) => ["APPROVED", "CONFIRMED"].includes(o.statusOrder)).length,
    cooking:     orders.filter((o) => o.statusOrder === "COOKING").length,
    cookingDone: orders.filter((o) => o.statusOrder === "COOKING_DONE").length,
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

      {/* ── Stats cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Tổng đơn",  value: stats.total,       variant: "stat-card-blue",   icon: Package },
          { label: "Chờ nấu",   value: stats.approved,    variant: "stat-card-orange",  icon: Clock },
          { label: "Đang nấu",  value: stats.cooking,     variant: "stat-card-purple",  icon: Flame },
          { label: "Nấu xong",  value: stats.cookingDone, variant: "stat-card-green",   icon: CheckCircle },
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
                  <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Order Date</th>
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
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeModal} />

          <div className="relative bg-background border border-border rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal header */}
            <div className="sticky top-0 bg-background z-10 px-6 py-4 border-b border-border flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-foreground">
                  Đơn hàng — {selectedOrder.orderId}
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

                {/* ── Order info ── */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {[
                    { label: "Order ID",  value: selectedOrder.orderId },
                    { label: "Store",     value: selectedOrder.storeId },
                    { label: "Status",    value: selectedOrder.statusOrder },
                    { label: "Priority",  value: selectedOrder.priorityLevel ? `Level ${selectedOrder.priorityLevel}` : "—" },
                    { label: "Payment",   value: selectedOrder.paymentOption },
                    { label: "Ngày đặt",  value: selectedOrder.orderDate ?? "—" },
                  ].map((f) => (
                    <div key={f.label} className="bg-muted/50 rounded-lg p-3">
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{f.label}</p>
                      <p className="text-sm font-medium text-foreground mt-1">{f.value}</p>
                    </div>
                  ))}
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
                            {selectedOrder.statusOrder === "APPROVED" || selectedOrder.statusOrder === "CONFIRMED"
                              ? "Đơn hàng đã được duyệt. Bấm \"Bắt đầu nấu\" để bắt đầu sản xuất."
                              : selectedOrder.statusOrder === "COOKING"
                              ? "Đang sản xuất. Khi hoàn thành, bấm \"Nấu xong\" để cập nhật."
                              : selectedOrder.statusOrder === "COOKING_DONE"
                              ? "Đã nấu xong và đóng gói. Sẵn sàng giao hàng."
                              : ""}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* ── Actions ── */}
                <div className="flex flex-wrap gap-3">
                  {/* APPROVED/CONFIRMED → Bắt đầu nấu */}
                  {(selectedOrder.statusOrder === "APPROVED" || selectedOrder.statusOrder === "CONFIRMED") && (
                    <button
                      onClick={handleStartCooking}
                      disabled={actionLoading}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600 active:scale-[0.98] transition-all disabled:opacity-60"
                    >
                      {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Flame className="w-4 h-4" />}
                      Bắt đầu nấu
                    </button>
                  )}

                  {/* COOKING → Nấu xong */}
                  {selectedOrder.statusOrder === "COOKING" && (
                    <button
                      onClick={handleCookingDone}
                      disabled={actionLoading}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 active:scale-[0.98] transition-all disabled:opacity-60"
                    >
                      {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                      Nấu xong
                    </button>
                  )}

                  {/* COOKING_DONE → Sẵn sàng giao */}
                  {selectedOrder.statusOrder === "COOKING_DONE" && (
                    <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-emerald-50 border border-emerald-200 w-full">
                      <Truck className="w-5 h-5 text-emerald-600" />
                      <p className="text-sm font-medium text-emerald-700">
                        Đơn hàng đã hoàn thành — sẵn sàng giao cho Supply Coordinator.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CentralKitchenOrders;
