import { useState, useEffect } from "react";
import { ShoppingCart, Store, CreditCard, FileText, Utensils, Hash, CheckCircle, Loader2, ClipboardList } from "lucide-react";
import { toast } from "react-toastify";
import API from "../api/axios";
import { getOrdersByStore } from "../api/authAPI"; 

const PAYMENT_OPTIONS = [
  { value: "PAY_AFTER_ORDER",  label: "Pay After Order"  },
  { value: "PAY_BEFORE_ORDER", label: "Pay Before Order" },
];

const EMPTY_FORM = {
  storeId:       "",
  paymentOption: "PAY_AFTER_ORDER",
  note:          "",
  foodItem:      "",
  quantity:      1,
};

/* ══════════════════════════════════════════════════════════════════════ */
const FranchiseStaff = () => {
  const [form,          setForm]          = useState(EMPTY_FORM);
  const [loading,       setLoading]       = useState(false);
  const [createdOrders, setCreatedOrders] = useState([]);
  const [lastStoreId,   setLastStoreId]   = useState("");

  
  const fetchOrders = async (storeId) => {
    try {
      const res = await getOrdersByStore(storeId);
      setCreatedOrders(res.data ?? []);
    } catch (err) {
      toast.error("Cannot fetch orders for store " + storeId);
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

    if (!form.storeId.trim()) { toast.error("Please enter a Store ID.");   return; }
    if (!form.foodItem.trim()) { toast.error("Please enter a Food Item.");  return; }
    if (form.quantity < 1)    { toast.error("Quantity must be at least 1."); return; }

    const payload = {
      storeId: form.storeId,
      paymentOption: form.paymentOption,
      orderDetails: [
        {
          note: form.note,
          items: [
            {
              foodItem: form.foodItem,
              quantity: form.quantity,
            },
          ],
        },
      ],
    };

    try {
      setLoading(true);
      // Capture storeId BEFORE resetting the form
      const submittedStoreId = form.storeId;

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

          {/* Store ID */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground" htmlFor="fs-storeId">
              Store ID <span className="text-destructive">*</span>
            </label>
            <div className="relative">
              <Store className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <input
                id="fs-storeId"
                name="storeId"
                value={form.storeId}
                onChange={handleChange}
                placeholder="e.g. FR_001"
                required
                className="um-input pl-10"
              />
            </div>
          </div>

          {/* Food Item */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground" htmlFor="fs-foodItem">
              Food Item <span className="text-destructive">*</span>
            </label>
            <div className="relative">
              <Utensils className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <input
                id="fs-foodItem"
                name="foodItem"
                value={form.foodItem}
                onChange={handleChange}
                placeholder="e.g. MY_V_CUA"
                required
                className="um-input pl-10"
              />
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
              <h3 className="text-base font-semibold text-foreground">Pending Orders — {lastStoreId}</h3>
            </div>
            <span className="badge badge-delivered">{createdOrders.length} pending</span>
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
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {createdOrders.map((o) => (
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
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-600">
                        <CheckCircle className="w-4 h-4" />
                        {o.statusOrder}
                      </span>
                    </td>
                  </tr>
                ))}
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
