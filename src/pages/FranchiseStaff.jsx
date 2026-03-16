import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { ShoppingCart, Store, CreditCard, FileText, Utensils, Hash, CheckCircle, Loader2, ClipboardList, ChevronDown, ChevronUp, Receipt, Plus, Trash2, Calendar, ExternalLink, XCircle, Map, MapPin, X } from "lucide-react";
import { toast } from "react-toastify";
import API from "../api/axios";
import { getOrdersByStore, getCentralKitchenFood, getOrderDetailByOrderId, createPaymentByOrder, cancelOrder, refundPayment, getAllDelivery, trackOrder, getDeliveryByStore } from "../api/authAPI";

const PAYMENT_OPTIONS = [
  { value: "PAY_AFTER_ORDER",         label: "Pay After Order"              },
  { value: "PAY_AFTER_DELIVERY",      label: "Pay After Delivery"           },
  { value: "PAY_AT_THE_END_OF_MONTH", label: "Pay At The End Of The Month"  },
];

const PAYMENT_METHOD_OPTIONS = [
  { value: "CASH",          label: "Cash"          },
  { value: "CREDIT", label: "VnPay" },
];

const EMPTY_FORM = {
  paymentOption:  "PAY_AFTER_ORDER",
  paymentMethod:  "CREDIT",
  note:           "",
  orderDate:      "",
};

const EMPTY_ITEM = { centralFoodId: "", quantity: 1 };

/* ══════════════════════════════════════════════════════════════════════ */
const FranchiseStaff = () => {
  const navigate = useNavigate();
  const [form,            setForm]          = useState(EMPTY_FORM);
  const [orderItems,      setOrderItems]    = useState([{ ...EMPTY_ITEM }]);
  const [loading,         setLoading]       = useState(false);
  const [createdOrders,   setCreatedOrders] = useState([]);
  const [lastStoreId,     setLastStoreId]   = useState("");
  const [foods,           setFoods]         = useState([]);
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [orderDetails,    setOrderDetails]  = useState({});
  const [detailLoading,   setDetailLoading] = useState(null);
  const [payingOrderId,   setPayingOrderId]   = useState(null);
  const [cancelingOrderId, setCancelingOrderId] = useState(null);
  const [selectedDetailOrder, setSelectedDetailOrder] = useState(null);

  // Delivery + Tracking States
  const [deliveries,          setDeliveries]         = useState([]);
  const [trackingData,        setTrackingData]        = useState(null);
  const [trackingLoading,     setTrackingLoading]     = useState(false);
  const [trackingError,       setTrackingError]       = useState(null);
  const [isTrackingModalOpen, setIsTrackingModalOpen] = useState(false);

  // Read store info from localStorage (set at login for FRANCHISE_STAFF)
  const storeInfo = (() => {
    try {
      return JSON.parse(sessionStorage.getItem("franchiseStoreInfo") || "null");
    } catch {
      return null;
    }
  })();
  const autoStoreId   = storeInfo?.storeId   ?? "";
  const autoStoreName = storeInfo?.storeName  ?? autoStoreId;

  const fetchOrders = async (storeId) => {
    try {
      const res = await getOrdersByStore(storeId);
      setCreatedOrders(res.data ?? []);
    } catch (err) {
      toast.error("Cannot fetch orders for store " + storeId);
    }
  };
  // Fetch real pending orders from the API for that store
  useEffect(() => {
    if (autoStoreId) {
      fetchOrders(autoStoreId);
    }
  }, [autoStoreId]);

  // Fetch deliveries scoped to this store (uses store-specific endpoint — no 500)
  useEffect(() => {
    if (!autoStoreId) return;
    const fetchStoreDeliveries = async () => {
      try {
        const res = await getDeliveryByStore(autoStoreId);
        const data = res?.data?.data || res?.data || [];
        setDeliveries(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error fetching store deliveries:", err);
      }
    };
    fetchStoreDeliveries();
  }, [autoStoreId]);

  const handleTrackDelivery = async (delivery) => {
    if (!delivery?.ghnOrderCode) return;
    setTrackingLoading(true);
    setTrackingError(null);
    setTrackingData(null);
    setIsTrackingModalOpen(true);
    try {
      const res = await trackOrder(delivery.ghnOrderCode);
      const resData = res?.data;
      if (resData?.code === 200) {
        setTrackingData(resData.data);
      } else {
        setTrackingError("Không thể tải thông tin tracking.");
      }
    } catch (err) {
      console.error("Error tracking order:", err);
      setTrackingError("Lỗi hệ thống khi theo dõi đơn hàng.");
    } finally {
      setTrackingLoading(false);
    }
  };

  const closeTrackingModal = () => {
    setIsTrackingModalOpen(false);
    setTrackingData(null);
  };

  //fetch food to show in foodItems dropdown menu
  useEffect(() => {
    const fetchFoods = async ()=> {
      try {
        const res = await getCentralKitchenFood();
        setFoods(res.data ?? []);
      } catch (err) {
        toast.error("Cannot fetch food list");
      }
    }
    fetchFoods();
  }, [])

  /* ── order detail modal ── */
  const openDetailModal  = (order) => setSelectedDetailOrder(order);
  const closeDetailModal = () => setSelectedDetailOrder(null);

  /* ── handlers ── */
  const VNPAY_ONLY_OPTIONS = ["PAY_AFTER_ORDER", "PAY_AT_THE_END_OF_MONTH"];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => {
      const next = { ...prev, [name]: name === "quantity" ? Number(value) : value };
      if (name === "paymentOption" && VNPAY_ONLY_OPTIONS.includes(value)) {
        next.paymentMethod = "CREDIT";
      }
      return next;
    });
  };

  const updateItem = (index, field, value) => {
    setOrderItems((prev) => prev.map((item, i) =>
      i === index ? { ...item, [field]: field === "quantity" ? Number(value) : value } : item
    ));
  };

  const addItem = () => setOrderItems((prev) => [...prev, { ...EMPTY_ITEM }]);

  const removeItem = (index) => {
    setOrderItems((prev) => prev.length <= 1 ? prev : prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!autoStoreId) { toast.error("No store associated with your account."); return; }

    if (!form.orderDate) {
      toast.error("Vui lòng chọn ngày giao hàng (Delivery Date).");
      return;
    }

    const validItems = orderItems.filter((it) => it.centralFoodId && it.quantity >= 1);
    if (validItems.length === 0) {
      toast.error("Vui lòng chọn ít nhất 1 món.");
      return;
    }

    const seen = new Set();
    for (const it of validItems) {
      if (seen.has(it.centralFoodId)) {
        const name = foods.find((f) => f.foodId === it.centralFoodId)?.foodName ?? it.centralFoodId;
        toast.error(`Món "${name}" bị trùng. Hãy gộp số lượng vào 1 dòng.`);
        return;
      }
      seen.add(it.centralFoodId);
    }

    const payload = {
      storeId:       autoStoreId,
      paymentOption: form.paymentOption,
      paymentMethod: form.paymentMethod,
      note:          form.note,
      orderDate:     form.orderDate,
      orderDetail: {
        items: validItems,
      },
    };

    const shouldAutoPayVnPay =
      form.paymentMethod === "CREDIT" && form.paymentOption === "PAY_AFTER_ORDER";

    try {
      setLoading(true);
      const submittedStoreId = autoStoreId;

      const orderRes = await API.post("/orders", payload);
      const resData = orderRes.data?.data ?? orderRes.data;
      const newOrderId = resData?.orderId ?? null;

      console.log("[Place Order] response:", orderRes.data, "→ orderId:", newOrderId);

      toast.success(`Đặt hàng thành công cho "${submittedStoreId}" (${validItems.length} món).`);

      setLastStoreId(submittedStoreId);
      setForm(EMPTY_FORM);
      setOrderItems([{ ...EMPTY_ITEM }]);

      if (shouldAutoPayVnPay && newOrderId) {
        try {
          const payRes = await createPaymentByOrder(newOrderId);
          const payData = payRes.data?.data ?? payRes.data;
          const paymentUrl = payData?.paymentUrl;
          const txnRef     = payData?.txnRef;
          if (paymentUrl) {
            window.__vnpayPopup = window.open(paymentUrl, "_blank");
            navigate(`/payment/vnpay-return?txnRef=${txnRef}&orderId=${newOrderId}`);
            return;
          }
        } catch (payErr) {
          console.error("[VNPay] create payment failed:", payErr);
          toast.warn("Tạo đơn thành công nhưng chưa tạo được link thanh toán.");
        }
      }

      await fetchOrders(submittedStoreId);
    } catch (err) {
      const msg = err?.response?.data?.message ?? "Server error — please try again.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  /* ── Retry payment for an existing order ── */
  const handleRetryPayment = async (orderId) => {
    try {
      setPayingOrderId(orderId);
      const payRes = await createPaymentByOrder(orderId);
      const payData = payRes.data?.data ?? payRes.data;
      const paymentUrl = payData?.paymentUrl;
      const txnRef     = payData?.txnRef;
      if (paymentUrl) {
        window.__vnpayPopup = window.open(paymentUrl, "_blank");
        navigate(`/payment/vnpay-return?txnRef=${txnRef}&orderId=${orderId}`);
      } else {
        toast.error("Không nhận được link thanh toán.");
      }
    } catch (err) {
      console.error("[RetryPayment] error:", err?.response?.status, err?.response?.data);
      toast.error(err?.response?.data?.message ?? "Tạo link thanh toán thất bại.");
    } finally {
      setPayingOrderId(null);
    }
  };

  const handleCancelOrder = async (order) => {
    if (!order?.orderId) return;
    const reason = window.prompt(`Nhập lý do hủy đơn ${order.orderId}:`, "");
    if (reason === null) return;
    if (!reason.trim()) {
      toast.warn("Vui lòng nhập lý do hủy đơn.");
      return;
    }
    try {
      setCancelingOrderId(order.orderId);
      await cancelOrder(order.orderId, reason);
      toast.success(`Đã hủy đơn ${order.orderId}.`);

      if (
        order.paymentOption === "PAY_AFTER_ORDER" &&
        (order.paymentStatus === "SUCCESS" || order.paymentStatus === "PAID")
      ) {
        try {
          await refundPayment(order.orderId);
          toast.success(`Đã gửi yêu cầu hoàn tiền cho đơn ${order.orderId}.`);
        } catch (refundErr) {
          toast.error(refundErr?.response?.data?.message ?? "Hoàn tiền thất bại — liên hệ quản lý.");
        }
      }

      await fetchOrders(autoStoreId);
      if (expandedOrderId === order.orderId) {
        setExpandedOrderId(null);
      }
    } catch (err) {
      toast.error(err?.response?.data?.message ?? "Không thể hủy đơn.");
    } finally {
      setCancelingOrderId(null);
    }
  };

  /* ── render ── */
  return (
    <div className="animate-fade-in space-y-8">

      {/* ── Page header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Create Order</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Place a new order for your franchise store.
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20">
          <ShoppingCart className="w-4 h-4 text-primary" />
          <span className="text-xs font-semibold text-primary">Franchise Staff</span>
        </div>
      </div>

      {/* ── Create Order Card ── */}
      <div className="admin-card rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl admin-sidebar-brand flex items-center justify-center">
            <ShoppingCart className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-foreground">New Order</h3>
            <p className="text-xs text-muted-foreground">Calls POST /orders</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">

          {/* Store ID — auto-populated from login, displayed as read-only badge */}
          <div className="space-y-1.5 md:col-span-2">
            <label className="text-sm font-medium text-foreground">Store</label>
            <div className="flex items-center gap-3 px-4 py-2.5 rounded-lg border border-border bg-muted/50">
              <Store className="w-4 h-4 text-primary flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-foreground">{autoStoreName}</p>
                {autoStoreId && autoStoreId !== autoStoreName && (
                  <p className="text-xs text-muted-foreground">{autoStoreId}</p>
                )}
              </div>
              <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-semibold">Auto-linked</span>
            </div>
          </div>

          {/* Order Items */}
          <div className="space-y-3 md:col-span-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground">
                Danh sách món <span className="text-destructive">*</span>
              </label>
              <button
                type="button"
                onClick={addItem}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Thêm món
              </button>
            </div>

            <div className="space-y-2">
              {orderItems.map((item, idx) => {
                const selectedIds = orderItems.map((it) => it.centralFoodId).filter(Boolean);
                return (
                  <div key={idx} className="flex items-center gap-2">
                    <div className="flex-1 relative">
                      <Utensils className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                      <select
                        value={item.centralFoodId}
                        onChange={(e) => updateItem(idx, "centralFoodId", e.target.value)}
                        className="um-input pl-10 w-full"
                      >
                        <option value="">-- Chọn món</option>
                        {foods
                          .filter((f) => f.centralFoodStatus === "AVAILABLE")
                          .map((f) => (
                            <option
                              key={f.foodId}
                              value={f.foodId}
                              disabled={selectedIds.includes(f.foodId) && item.centralFoodId !== f.foodId}
                            >
                              {f.foodName}
                            </option>
                          ))}
                      </select>
                    </div>
                    <div className="w-24 relative">
                      <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateItem(idx, "quantity", e.target.value)}
                        className="um-input pl-10 w-full"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeItem(idx)}
                      disabled={orderItems.length <= 1}
                      className="p-2 rounded-lg text-muted-foreground hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-30 disabled:hover:text-muted-foreground disabled:hover:bg-transparent"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>

            {orderItems.length > 0 && (
              <p className="text-xs text-muted-foreground">
                {orderItems.filter((it) => it.centralFoodId).length} món đã chọn
              </p>
            )}
          </div>

          {/* Delivery Date */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground" htmlFor="fs-delivery-date">
              Delivery Date <span className="text-destructive">*</span>
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <input
                type="date"
                id="fs-delivery-date"
                name="orderDate"
                value={form.orderDate}
                onChange={handleChange}
                className="um-input pl-10 w-full"
              />
            </div>
          </div>

          {/* Note */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground" htmlFor="fs-note">
              Note
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <input
                id="fs-note"
                name="note"
                value={form.note}
                onChange={handleChange}
                placeholder="e.g. Extra spicy"
                className="um-input pl-10 w-full"
              />
            </div>
          </div>

          {/* Payment Option */}
          <div className="space-y-1.5 md:col-span-2">
            <label className="text-sm font-medium text-foreground">
              Payment Option <span className="text-destructive">*</span>
            </label>
            <div className="flex flex-wrap gap-3">
              {PAYMENT_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className={`
                    flex items-center gap-2 px-4 py-2.5 rounded-lg border cursor-pointer
                    transition-all duration-200 select-none
                    ${form.paymentOption === opt.value
                      ? "border-primary bg-primary/10 text-primary font-semibold"
                      : "border-border bg-muted/50 text-muted-foreground hover:border-primary/50 hover:text-foreground"
                    }
                  `}
                >
                  <input
                    type="radio"
                    name="paymentOption"
                    value={opt.value}
                    checked={form.paymentOption === opt.value}
                    onChange={handleChange}
                    className="sr-only"
                  />
                  <CreditCard className="w-4 h-4" />
                  {opt.label}
                </label>
              ))}
            </div>
          </div>

          {/* Payment Method */}
          <div className="space-y-1.5 md:col-span-2">
            <label className="text-sm font-medium text-foreground">
              Payment Method <span className="text-destructive">*</span>
            </label>
            {VNPAY_ONLY_OPTIONS.includes(form.paymentOption) && (
              <p className="text-xs text-amber-600">
                {form.paymentOption === "PAY_AFTER_ORDER" ? "Pay After Order" : "Pay At The End Of The Month"} chỉ hỗ trợ thanh toán qua VnPay.
              </p>
            )}
            <div className="flex flex-wrap gap-3">
              {PAYMENT_METHOD_OPTIONS.map((opt) => {
                const disabled = opt.value === "CASH" && VNPAY_ONLY_OPTIONS.includes(form.paymentOption);
                return (
                  <label
                    key={opt.value}
                    className={`
                      flex items-center gap-2 px-4 py-2.5 rounded-lg border
                      transition-all duration-200 select-none
                      ${disabled
                        ? "opacity-40 cursor-not-allowed border-border bg-muted/30 text-muted-foreground"
                        : form.paymentMethod === opt.value
                          ? "border-primary bg-primary/10 text-primary font-semibold cursor-pointer"
                          : "border-border bg-muted/50 text-muted-foreground hover:border-primary/50 hover:text-foreground cursor-pointer"
                      }
                    `}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={opt.value}
                      checked={form.paymentMethod === opt.value}
                      onChange={handleChange}
                      disabled={disabled}
                      className="sr-only"
                    />
                    <CreditCard className="w-4 h-4" />
                    {opt.label}
                  </label>
                );
              })}
            </div>
          </div>

          {/* Submit */}
          <div className="md:col-span-2 flex justify-end pt-2">
            <button
              id="fs-submit-btn"
              type="submit"
              disabled={loading}
              className="
                flex items-center gap-2 px-6 py-2.5 rounded-lg
                bg-primary text-primary-foreground font-semibold text-sm
                hover:opacity-90 active:scale-[0.98]
                transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed
              "
            >
              {loading
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Placing Order…</>
                : <><ShoppingCart className="w-4 h-4" /> Place Order</>
              }
            </button>
          </div>
        </form>
      </div>

      {/* ── Created Orders Table ── */}
      {createdOrders.length > 0 && (
        <div className="admin-card rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-border flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-foreground">Orders Status — {autoStoreName || lastStoreId}</h3>
            </div>
            <span className="badge badge-delivered">{createdOrders.length} order{createdOrders.length !== 1 ? "s" : ""}</span>
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
                  <th className="px-6 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">Order Status</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">Payment Status</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {createdOrders.map((o) => {
                  const isExpanded = false; // sub-row removed — modal used instead
                  const isLoadingDetail = false;
                  const detail = null;

                  return (
                    <React.Fragment key={o.orderId}>
                      {/* ── Main row ── */}
                      <tr className="admin-table-row">
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
                          <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${
                            o.statusOrder === "PENDING"    ? "bg-amber-100 text-amber-700" :
                            o.statusOrder === "CANCELLED"  ? "bg-red-100 text-red-600" :
                            o.statusOrder === "COMPLETED" || o.statusOrder === "DELIVERED" ? "bg-green-100 text-green-700" :
                            o.statusOrder === "READY_TO_PICK" ? "bg-blue-100 text-blue-700" :
                            o.statusOrder === "IN_PROGRESS" ? "bg-purple-100 text-purple-700" :
                            "bg-muted text-muted-foreground"
                          }`}>
                            <CheckCircle className="w-3.5 h-3.5" />
                            {o.statusOrder ?? "—"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${
                            o.paymentStatus === "SUCCESS" || o.paymentStatus === "PAID"
                              ? "bg-emerald-100 text-emerald-700" :
                            o.paymentStatus === "FAILED"
                              ? "bg-red-100 text-red-600" :
                            o.paymentStatus === "PENDING"
                              ? "bg-amber-100 text-amber-700" :
                            "bg-muted text-muted-foreground"
                          }`}>
                            {o.paymentStatus === "SUCCESS" || o.paymentStatus === "PAID"
                              ? <CheckCircle className="w-3.5 h-3.5" />
                              : <CreditCard className="w-3.5 h-3.5" />
                            }
                            {o.paymentStatus ?? "—"}
                          </span>
                        </td>
                        {/* Details + Pay + Cancel */}
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => openDetailModal(o)}
                              className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg border border-primary/30 text-primary bg-primary/5 hover:bg-primary/15 transition-all duration-150"
                            >
                              <Receipt className="w-3.5 h-3.5" />
                              Detail
                            </button>
                            {o.paymentOption === "PAY_AFTER_ORDER" &&
                             o.statusOrder !== "CANCELLED" && o.statusOrder !== "REJECTED" &&
                             o.paymentStatus !== "SUCCESS" && o.paymentStatus !== "PAID" && o.paymentStatus !== "REFUNDED" && (
                              <button
                                onClick={() => handleRetryPayment(o.orderId)}
                                disabled={payingOrderId === o.orderId}
                                className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-all duration-150 disabled:opacity-50"
                              >
                                {payingOrderId === o.orderId
                                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  : <ExternalLink className="w-3.5 h-3.5" />
                                }
                                Thanh toán
                              </button>
                            )}
                            {(o.statusOrder === "PENDING" || o.statusOrder === "WAITING_FOR_UPDATE") && (
                              <button
                                onClick={() => handleCancelOrder(o)}
                                disabled={cancelingOrderId === o.orderId}
                                className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-all duration-150 disabled:opacity-50"
                              >
                                {cancelingOrderId === o.orderId
                                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  : <XCircle className="w-3.5 h-3.5" />
                                }
                                Hủy đơn
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>

                      {/* ── Expandable detail sub-row ── */}
                      {isExpanded && (
                        <tr key={`${o.orderId}-detail`}>
                          <td colSpan={8} className="px-0 py-0 bg-muted/30 border-b border-border">
                            <div className="px-8 py-5">
                              {!detail ? (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <Loader2 className="w-4 h-4 animate-spin" /> Loading detail…
                                </div>
                              ) : (
                                <div className="space-y-3">
                                  {/* header row */}
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                      <Receipt className="w-4 h-4 text-primary" />
                                      <span className="text-sm font-semibold text-foreground">Order Detail</span>
                                      <span className="text-xs text-muted-foreground ml-1">#{detail.orderDetailId}</span>
                                    </div>
                                    {/* Tracking button if exists */}
                                    {(() => {
                                      const orderDetailId = o.orderDetail?.orderDetailId || detail?.orderDetailId;
                                      const delivery = deliveries.find(d => d.orderDetailId === orderDetailId);
                                      if (delivery && delivery.ghnOrderCode) {
                                        return (
                                          <button
                                            onClick={() => handleTrackDelivery(delivery)}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"
                                          >
                                            <Map className="w-3.5 h-3.5" />
                                            Theo dõi vận đơn GHN
                                          </button>
                                        );
                                      }
                                      return null;
                                    })()}
                                  </div>

                                  {/* note */}
                                  <div className={`flex items-start gap-2 px-3 py-2.5 rounded-lg text-sm ${o.note ? "bg-amber-50 border border-amber-200 text-amber-800" : "bg-muted/50 border border-border text-muted-foreground"}`}>
                                    <FileText className={`w-4 h-4 mt-0.5 flex-shrink-0 ${o.note ? "text-amber-500" : "text-muted-foreground"}`} />
                                    <span>
                                      <span className="font-semibold">Note:</span>{" "}
                                      {o.note || <span className="italic">Không có ghi chú</span>}
                                    </span>
                                  </div>

                                  {/* cancel reason */}
                                  {o.statusOrder === "CANCELLED" && o.cancelReason && (
                                    <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-red-50 border border-red-200 text-sm text-red-800">
                                      <XCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-red-500" />
                                      <span><span className="font-semibold">Lý do hủy:</span> {o.cancelReason}</span>
                                    </div>
                                  )}

                                  {/* items mini-table */}
                                  <div className="rounded-lg overflow-hidden border border-border">
                                    <table className="w-full text-xs">
                                      <thead>
                                        <tr className="bg-muted/60">
                                          <th className="px-4 py-2 text-left font-semibold text-muted-foreground uppercase tracking-wide">Food Item</th>
                                          <th className="px-4 py-2 text-center font-semibold text-muted-foreground uppercase tracking-wide">Quantity</th>
                                          <th className="px-4 py-2 text-right font-semibold text-muted-foreground uppercase tracking-wide">Unit Price (VND)</th>
                                          <th className="px-4 py-2 text-right font-semibold text-muted-foreground uppercase tracking-wide">Subtotal</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-border bg-background">
                                        {detail.items?.map((item, idx) => (
                                          <tr key={idx}>
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
                                            {detail.amount?.toLocaleString()}
                                          </td>
                                        </tr>
                                      </tfoot>
                                    </table>
                                  </div>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Empty state ── */}
      {createdOrders.length === 0 && (
        <div className="admin-card rounded-xl p-12 flex flex-col items-center gap-4 text-center">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
            <ClipboardList className="w-8 h-8 text-muted-foreground" />
          </div>
          <div>
            <p className="text-base font-semibold text-foreground">No orders placed yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Fill in the form above and click <strong>Place Order</strong> to get started.
            </p>
          </div>
        </div>
      )}

      {/* ── Order Detail Modal ── */}
      {selectedDetailOrder && createPortal(
        <div className="fixed inset-0 z-[9998] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={closeDetailModal} />
          <div className="relative bg-background border border-border rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col animate-fade-in">

            {/* Modal Header */}
            <div className="flex-shrink-0 px-5 py-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-primary" />
                <h3 className="text-base font-bold text-foreground">Order Detail</h3>
                <span className="text-xs text-muted-foreground font-mono bg-muted px-2 py-0.5 rounded-md">#{selectedDetailOrder.orderId}</span>
              </div>
              <button onClick={closeDetailModal} className="p-2 rounded-lg bg-muted hover:bg-destructive hover:text-destructive-foreground transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">

              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Store", value: selectedDetailOrder.storeId },
                  { label: "Order Date", value: selectedDetailOrder.orderDate ?? "—" },
                  { label: "Priority", value: selectedDetailOrder.priorityLevel ?? "—" },
                  { label: "Payment Method", value: selectedDetailOrder.paymentMethod ?? "—" },
                  { label: "Payment Option", value: selectedDetailOrder.paymentOption ?? "—" },
                  { label: "Cancel Reason", value: selectedDetailOrder.cancelReason ?? "—" },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-muted/40 rounded-xl p-3 border border-border">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">{label}</p>
                    <p className="text-sm font-medium text-foreground break-all">{value}</p>
                  </div>
                ))}
              </div>

              {/* Status Row */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl p-3 border border-border bg-card">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Order Status</p>
                  <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${
                    selectedDetailOrder.statusOrder === "PENDING"    ? "bg-amber-100 text-amber-700" :
                    selectedDetailOrder.statusOrder === "CANCELLED"  ? "bg-red-100 text-red-600" :
                    selectedDetailOrder.statusOrder === "COMPLETED" || selectedDetailOrder.statusOrder === "DELIVERED" ? "bg-green-100 text-green-700" :
                    selectedDetailOrder.statusOrder === "READY_TO_PICK" ? "bg-blue-100 text-blue-700" :
                    selectedDetailOrder.statusOrder === "COOKING_DONE" || selectedDetailOrder.statusOrder === "IN_PROGRESS" ? "bg-purple-100 text-purple-700" :
                    "bg-muted text-muted-foreground"
                  }`}>
                    <CheckCircle className="w-3.5 h-3.5" />
                    {selectedDetailOrder.statusOrder ?? "—"}
                  </span>
                </div>
                <div className="rounded-xl p-3 border border-border bg-card">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Payment Status</p>
                  <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${
                    selectedDetailOrder.paymentStatus === "SUCCESS" || selectedDetailOrder.paymentStatus === "PAID"
                      ? "bg-emerald-100 text-emerald-700" :
                    selectedDetailOrder.paymentStatus === "FAILED"
                      ? "bg-red-100 text-red-600" :
                    selectedDetailOrder.paymentStatus === "PENDING"
                      ? "bg-amber-100 text-amber-700" :
                    "bg-muted text-muted-foreground"
                  }`}>
                    <CreditCard className="w-3.5 h-3.5" />
                    {selectedDetailOrder.paymentStatus ?? "—"}
                  </span>
                </div>
              </div>

              {/* Note */}
              {selectedDetailOrder.note && (
                <div className="flex items-start gap-2 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 text-sm text-amber-800">
                  <FileText className="w-4 h-4 mt-0.5 flex-shrink-0 text-amber-500" />
                  <span><span className="font-semibold">Note: </span>{selectedDetailOrder.note}</span>
                </div>
              )}

              {/* Items Table */}
              {selectedDetailOrder.orderDetail && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Items — <span className="font-mono text-foreground">{selectedDetailOrder.orderDetail.orderDetailId}</span>
                    </p>
                    {/* GHN Track button */}
                    {(() => {
                      const delivery = deliveries.find(d => d.orderDetailId === selectedDetailOrder.orderDetail?.orderDetailId);
                      if (delivery?.ghnOrderCode) {
                        return (
                          <button
                            onClick={() => { closeDetailModal(); handleTrackDelivery(delivery); }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100 transition-colors"
                          >
                            <Map className="w-3.5 h-3.5" />
                            Theo dõi vận đơn GHN
                          </button>
                        );
                      }
                      return null;
                    })()}
                  </div>
                  <div className="rounded-xl overflow-hidden border border-border">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-muted/60">
                          <th className="px-4 py-2.5 text-left font-semibold text-muted-foreground uppercase tracking-wide">Food Item</th>
                          <th className="px-4 py-2.5 text-center font-semibold text-muted-foreground uppercase tracking-wide">Qty</th>
                          <th className="px-4 py-2.5 text-right font-semibold text-muted-foreground uppercase tracking-wide">Unit Price</th>
                          <th className="px-4 py-2.5 text-right font-semibold text-muted-foreground uppercase tracking-wide">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border bg-background">
                        {selectedDetailOrder.orderDetail.items?.map((item, idx) => (
                          <tr key={idx}>
                            <td className="px-4 py-2.5 font-medium text-foreground">{item.foodName}</td>
                            <td className="px-4 py-2.5 text-center text-muted-foreground">{item.quantity}</td>
                            <td className="px-4 py-2.5 text-right text-muted-foreground">{item.unitPrice?.toLocaleString()} đ</td>
                            <td className="px-4 py-2.5 text-right font-semibold text-foreground">{item.totalAmount?.toLocaleString()} đ</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="bg-primary/5 border-t-2 border-primary/20">
                          <td colSpan={3} className="px-4 py-3 text-right text-xs font-bold text-foreground uppercase tracking-wide">Total</td>
                          <td className="px-4 py-3 text-right text-sm font-bold text-primary">
                            {selectedDetailOrder.orderDetail.amount?.toLocaleString()} đ
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── GHN Tracking Modal ── */}
      {isTrackingModalOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={closeTrackingModal} />
          <div className="relative bg-background border border-border rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col animate-fade-in">

            {/* Header */}
            <div className="flex-shrink-0 px-5 py-4 border-b border-border flex items-center justify-between">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Map className="w-5 h-5 text-emerald-600" />
                Theo Dõi Giao Hàng GHN
              </h3>
              <button onClick={closeTrackingModal} className="p-2 rounded-lg bg-muted hover:bg-destructive hover:text-destructive-foreground transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {trackingLoading ? (
                <div className="h-40 flex items-center justify-center gap-2 text-primary font-medium">
                  <Loader2 className="w-5 h-5 animate-spin" /> Đang tải thông tin...
                </div>
              ) : trackingError ? (
                <div className="h-40 flex items-center justify-center text-destructive font-medium">{trackingError}</div>
              ) : trackingData ? (
                <div className="space-y-5">

                  {/* Status + Code */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200">
                      <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-1">Trạng thái</p>
                      <p className="text-xl font-bold text-emerald-800 capitalize">{trackingData.status || "N/A"}</p>
                    </div>
                    <div className="bg-muted/50 rounded-xl p-4 border border-border">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Mã vận đơn GHN</p>
                      <p className="text-xl font-bold text-foreground font-mono">{trackingData.order_code || "N/A"}</p>
                    </div>
                  </div>

                  {/* Estimated delivery */}
                  {trackingData.leadtime_order && (
                    <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-blue-50 border border-blue-200 text-sm text-blue-800">
                      <Calendar className="w-4 h-4 text-blue-500 flex-shrink-0" />
                      <span>
                        <span className="font-semibold">Dự kiến giao: </span>
                        {new Date(trackingData.leadtime_order.from_estimate_date).toLocaleDateString("vi-VN")}
                        {" — "}
                        {new Date(trackingData.leadtime_order.to_estimate_date).toLocaleDateString("vi-VN")}
                      </span>
                    </div>
                  )}

                  {/* Addresses */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl border border-border bg-card space-y-1.5">
                      <h4 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-blue-500" /> Điểm Gửi
                      </h4>
                      <p className="text-xs text-muted-foreground"><span className="font-semibold text-foreground">Tên:</span> {trackingData.from_name}</p>
                      <p className="text-xs text-muted-foreground"><span className="font-semibold text-foreground">SĐT:</span> {trackingData.from_phone}</p>
                      <p className="text-xs text-muted-foreground"><span className="font-semibold text-foreground">Địa chỉ:</span> {trackingData.from_address}</p>
                    </div>
                    <div className="p-4 rounded-xl border border-border bg-card space-y-1.5">
                      <h4 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-red-500" /> Điểm Nhận
                      </h4>
                      <p className="text-xs text-muted-foreground"><span className="font-semibold text-foreground">Tên:</span> {trackingData.to_name}</p>
                      <p className="text-xs text-muted-foreground"><span className="font-semibold text-foreground">SĐT:</span> {trackingData.to_phone}</p>
                      <p className="text-xs text-muted-foreground"><span className="font-semibold text-foreground">Địa chỉ:</span> {trackingData.to_address}</p>
                    </div>
                  </div>

                  {/* Parcel Info */}
                  <div className="p-4 rounded-xl border border-border bg-card space-y-3">
                    <h4 className="text-sm font-bold text-foreground">Chi Tiết Kiện Hàng</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div><p className="text-xs text-muted-foreground">Khối lượng</p><p className="font-medium">{trackingData.weight} g</p></div>
                      <div><p className="text-xs text-muted-foreground">Kích thước</p><p className="font-medium">{trackingData.length}×{trackingData.width}×{trackingData.height} cm</p></div>
                      <div><p className="text-xs text-muted-foreground">Tiền COD</p><p className="font-bold text-emerald-600">{trackingData.cod_amount?.toLocaleString() || "0"} đ</p></div>
                      <div><p className="text-xs text-muted-foreground">Dịch vụ</p><p className="font-medium">{trackingData.service_type_id === 2 ? "Chuẩn" : "Nhanh"}</p></div>
                    </div>
                    {trackingData.content && (
                      <div className="text-xs bg-muted/50 p-3 rounded-lg border border-border">
                        <span className="font-semibold">Nội dung:</span> {trackingData.content}
                      </div>
                    )}
                  </div>

                  {/* Tracking Log */}
                  {trackingData.log?.length > 0 && (
                    <div className="p-4 rounded-xl border border-border bg-card space-y-3">
                      <h4 className="text-sm font-bold text-foreground">Lịch Sử Vận Chuyển</h4>
                      <div className="space-y-2">
                        {[...trackingData.log].reverse().map((entry, idx) => (
                          <div key={idx} className="flex items-start gap-3 text-xs">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                            <div>
                              <p className="font-semibold text-foreground capitalize">{entry.status}</p>
                              <p className="text-muted-foreground">{new Date(entry.updated_date).toLocaleString("vi-VN")}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                </div>
              ) : null}
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
};

export default FranchiseStaff;
