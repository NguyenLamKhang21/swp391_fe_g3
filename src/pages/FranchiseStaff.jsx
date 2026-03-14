import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ShoppingCart, Store, CreditCard, FileText, Utensils, Hash, CheckCircle, Loader2, ClipboardList, ChevronDown, ChevronUp, Receipt, Plus, Trash2 } from "lucide-react";
import { toast } from "react-toastify";
import API from "../api/axios";
import { getOrdersByStore, getCentralKitchenFood, getOrderDetailByOrderId, createPaymentByOrder } from "../api/authAPI";

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

  /* ── order detail toggle ── */
  const toggleDetail = async (orderId) => {
    // collapse if already open
    if (expandedOrderId === orderId) {
      setExpandedOrderId(null);
      return;
    }
    setExpandedOrderId(orderId);
    // return cached detail if already fetched
    if (orderDetails[orderId]) return;
    try {
      setDetailLoading(orderId);
      const res = await getOrderDetailByOrderId(orderId);
      setOrderDetails((prev) => ({ ...prev, [orderId]: res.data }));
    } catch {
      toast.error(`Cannot load detail for order ${orderId}`);
      setExpandedOrderId(null);
    } finally {
      setDetailLoading(null);
    }
  };

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
                className="um-input pl-10"
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
                  <th className="px-6 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {createdOrders.map((o) => {
                  const isExpanded = expandedOrderId === o.orderId;
                  const isLoadingDetail = detailLoading === o.orderId;
                  const detail = orderDetails[o.orderId];

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
                            o.statusOrder === "IN_PROGRESS" ? "bg-blue-100 text-blue-700" :
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
                        {/* Details toggle */}
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => toggleDetail(o.orderId)}
                            disabled={isLoadingDetail}
                            className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg border border-primary/30 text-primary bg-primary/5 hover:bg-primary/15 transition-all duration-150 disabled:opacity-50"
                          >
                            {isLoadingDetail
                              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              : isExpanded
                                ? <ChevronUp className="w-3.5 h-3.5" />
                                : <ChevronDown className="w-3.5 h-3.5" />
                            }
                            {isExpanded ? "Hide" : "View"}
                          </button>
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
                                  <div className="flex items-center gap-2 mb-2">
                                    <Receipt className="w-4 h-4 text-primary" />
                                    <span className="text-sm font-semibold text-foreground">Order Detail</span>
                                    <span className="text-xs text-muted-foreground ml-1">#{detail.orderDetailId}</span>
                                  </div>

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

    </div>
  );
};

export default FranchiseStaff;
