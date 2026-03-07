import { useState, useEffect } from "react";
import { ShoppingCart, Store, CreditCard, FileText, Utensils, Hash, CheckCircle, Loader2, ClipboardList, ChevronDown, ChevronUp, Receipt } from "lucide-react";
import { toast } from "react-toastify";
import API from "../api/axios";
import { getOrdersByStore, getCentralKitchenFood, getOrderDetailByOrderId } from "../api/authAPI";

const PAYMENT_OPTIONS = [
  { value: "PAY_AFTER_ORDER",  label: "Pay After Order"  },
  { value: "PAY_BEFORE_ORDER", label: "Pay Before Order" },
];

const PAYMENT_METHOD_OPTIONS = [
  { value: "CASH",          label: "Cash"          },
  { value: "CREDIT", label: "Bank Transfer" },
];

const EMPTY_FORM = {
  paymentOption:  "PAY_AFTER_ORDER",
  paymentMethod:  "CASH",
  note:           "",
  foodItem:       "",
  quantity:       1,
};

/* ══════════════════════════════════════════════════════════════════════ */
const FranchiseStaff = () => {
  const [form,            setForm]          = useState(EMPTY_FORM);
  const [loading,         setLoading]       = useState(false);
  const [createdOrders,   setCreatedOrders] = useState([]);
  const [lastStoreId,     setLastStoreId]   = useState("");
  const [foods,           setFoods]         = useState([]);
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [orderDetails,    setOrderDetails]  = useState({});   // { [orderId]: detailObj } a cache map { [orderId]: detailObj } so the API is only called once per order
  const [detailLoading,   setDetailLoading] = useState(null); // orderId being loaded tracks which row is currently fetching (to show a spinner)

  // Read store info from localStorage (set at login for FRANCHISE_STAFF)
  const storeInfo = (() => {
    try {
      return JSON.parse(localStorage.getItem("franchiseStoreInfo") || "null");
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
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === "quantity" ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!autoStoreId) { toast.error("No store associated with your account."); return; }
    if (!form.foodItem.trim()) { toast.error("Please enter a Food Item.");  return; }
    if (form.quantity < 1)    { toast.error("Quantity must be at least 1."); return; }

    const payload = {
      storeId:       autoStoreId,
      paymentOption: form.paymentOption,
      paymentMethod: form.paymentMethod,
      note:          form.note,
      orderDetail: {
        items: [
          {
            centralFoodId: form.foodItem,
            quantity:      form.quantity,
          },
        ],
      },
    };

    try {
      setLoading(true);
      const submittedStoreId = autoStoreId;

      await API.post("/orders", payload);

      toast.success(`Order for store "${submittedStoreId}" placed successfully!`);

      setLastStoreId(submittedStoreId);
      setForm(EMPTY_FORM);

      // Fetch real pending orders from the API for that store
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

          {/* Food Item */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground" htmlFor="fs-foodItem">
              Food Item <span className="text-destructive">*</span>
            </label>
            <div className="relative">
              <Utensils className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <select
                id="fs-foodItem"
                name="foodItem"
                value={form.foodItem}
                onChange={handleChange}
                required
                className="um-input pl-10"
              >
                <option value="">-- Select Food</option>

                {foods
                  .filter(f => f.centralFoodStatus === "AVAILABLE")
                  .map(f => (
                    <option key={f.foodId} value={f.foodId}>
                      {f.foodName}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {/* Quantity */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground" htmlFor="fs-quantity">
              Quantity <span className="text-destructive">*</span>
            </label>
            <div className="relative">
              <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <input
                id="fs-quantity"
                name="quantity"
                type="number"
                min="1"
                value={form.quantity}
                onChange={handleChange}
                required
                className="um-input pl-10"
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
            <div className="flex flex-wrap gap-3">
              {PAYMENT_METHOD_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className={`
                    flex items-center gap-2 px-4 py-2.5 rounded-lg border cursor-pointer
                    transition-all duration-200 select-none
                    ${form.paymentMethod === opt.value
                      ? "border-primary bg-primary/10 text-primary font-semibold"
                      : "border-border bg-muted/50 text-muted-foreground hover:border-primary/50 hover:text-foreground"
                    }
                  `}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={opt.value}
                    checked={form.paymentMethod === opt.value}
                    onChange={handleChange}
                    className="sr-only"
                  />
                  <CreditCard className="w-4 h-4" />
                  {opt.label}
                </label>
              ))}
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
                  <th className="px-6 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {createdOrders.map((o) => {
                  const isExpanded = expandedOrderId === o.orderId;
                  const isLoadingDetail = detailLoading === o.orderId;
                  const detail = orderDetails[o.orderId];

                  return (
                    <>
                      {/* ── Main row ── */}
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
                          <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${
                            o.statusOrder === "PENDING"    ? "bg-amber-100 text-amber-700" :
                            o.statusOrder === "CANCELLED"  ? "bg-red-100 text-red-600" :
                            o.statusOrder === "COMPLETED" || o.statusOrder === "DELIVERED" ? "bg-green-100 text-green-700" :
                            o.statusOrder === "PROCESSING" ? "bg-blue-100 text-blue-700" :
                            "bg-muted text-muted-foreground"
                          }`}>
                            <CheckCircle className="w-3.5 h-3.5" />
                            {o.statusOrder ?? "—"}
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
                          <td colSpan={7} className="px-0 py-0 bg-muted/30 border-b border-border">
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
                                          <th className="px-4 py-2 text-right font-semibold text-muted-foreground uppercase tracking-wide">Unit Price</th>
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
                    </>
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
