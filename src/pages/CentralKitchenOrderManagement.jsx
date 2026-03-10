import { useState, useEffect, useCallback } from "react";
import {
  ClipboardList,
  RefreshCw,
  Loader2,
  AlertCircle,
  Search,
  Store,
  CalendarDays,
  CreditCard,
  Banknote,
  StickyNote,
  BarChart2,
} from "lucide-react";
import { toast } from "react-toastify";
import { getOrderByStatus } from "../api/authAPI";

/* ─── helpers ─────────────────────────────────────────────────────────────── */

const badge = (text, colorClass) => (
  <span
    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${colorClass}`}
  >
    {text}
  </span>
);

const paymentStatusColor = (s) => {
  switch (s) {
    case "PAID":      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "PENDING":   return "bg-amber-50  text-amber-700  border-amber-200";
    case "FAILED":    return "bg-red-50    text-red-700    border-red-200";
    default:          return "bg-gray-50   text-gray-600   border-gray-200";
  }
};

const orderStatusColor = (s) => {
  switch (s) {
    case "IN_PROGRESS": return "bg-purple-50 text-purple-700 border-purple-200";
    case "PENDING":     return "bg-amber-50  text-amber-700  border-amber-200";
    case "DONE":        return "bg-emerald-50 text-emerald-700 border-emerald-200";
    default:            return "bg-gray-50   text-gray-600   border-gray-200";
  }
};

/* ─── main component ─────────────────────────────────────────────────────── */

const CentralKitchenOrderManagement = () => {
  const [orders, setOrders]         = useState([]);
  const [loading, setLoading]       = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selected, setSelected]     = useState(null);

  /* fetch */
  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const res  = await getOrderByStatus("IN_PROGRESS");
      const data = res.data?.data ?? res.data ?? [];
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error(err?.response?.data?.message ?? "Failed to load IN_PROGRESS orders.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  /* filter */
  const filtered = orders.filter((o) => {
    const term = searchTerm.toLowerCase();
    return (
      (o.orderId?.toLowerCase()  ?? "").includes(term) ||
      (o.storeId?.toLowerCase()  ?? "").includes(term)
    );
  });

  /* ── render ─────────────────────────────────────────────────────────────── */
  return (
    <div className="animate-fade-in space-y-6">

      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Order Management</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Viewing all orders with status&nbsp;
            <span className="font-semibold text-purple-600">IN_PROGRESS</span>.
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20">
          <ClipboardList className="w-4 h-4 text-purple-600" />
          <span className="text-xs font-semibold text-purple-600">IN_PROGRESS</span>
        </div>
      </div>

      {/* ── Summary stat ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="stat-card rounded-xl p-4 stat-card-purple">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Total In-Progress</p>
              <p className="text-2xl font-bold text-foreground mt-1">
                {loading ? "—" : orders.length}
              </p>
            </div>
            <div className="stat-card-icon w-10 h-10 rounded-xl flex items-center justify-center">
              <ClipboardList className="w-5 h-5" />
            </div>
          </div>
        </div>
        <div className="stat-card rounded-xl p-4 stat-card-orange">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Pending Payment</p>
              <p className="text-2xl font-bold text-foreground mt-1">
                {loading ? "—" : orders.filter((o) => o.paymentStatus === "PENDING").length}
              </p>
            </div>
            <div className="stat-card-icon w-10 h-10 rounded-xl flex items-center justify-center">
              <Banknote className="w-5 h-5" />
            </div>
          </div>
        </div>
        <div className="stat-card rounded-xl p-4 stat-card-blue">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Unique Stores</p>
              <p className="text-2xl font-bold text-foreground mt-1">
                {loading ? "—" : new Set(orders.map((o) => o.storeId)).size}
              </p>
            </div>
            <div className="stat-card-icon w-10 h-10 rounded-xl flex items-center justify-center">
              <Store className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* ── Toolbar ── */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Search Order ID, Store…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="um-input pl-10 w-full"
          />
        </div>
        <button
          onClick={fetchOrders}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-background text-foreground text-sm font-medium hover:bg-muted transition-colors disabled:opacity-60"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* ── Main content ── */}
      {loading ? (
        <div className="admin-card rounded-xl p-12 flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-sm text-muted-foreground">Loading orders…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="admin-card rounded-xl p-12 flex flex-col items-center gap-4 text-center">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-base font-semibold text-foreground">No orders found</p>
          <p className="text-sm text-muted-foreground">
            {searchTerm
              ? "No results match your search."
              : "There are no IN_PROGRESS orders right now."}
          </p>
        </div>
      ) : (
        <div className="flex gap-6 flex-col xl:flex-row">

          {/* Table */}
          <div className="admin-card rounded-xl overflow-hidden flex-1">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-purple-600" />
                In-Progress Orders
              </h3>
              <span className="badge badge-delivered">{filtered.length} order{filtered.length !== 1 ? "s" : ""}</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="admin-table-header">
                    <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Order ID</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Store</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Date</th>
                    <th className="px-5 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">Priority</th>
                    <th className="px-5 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                    <th className="px-5 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">Payment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map((o) => (
                    <tr
                      key={o.orderId}
                      className={`admin-table-row cursor-pointer transition-colors ${
                        selected?.orderId === o.orderId ? "bg-purple-50/60 dark:bg-purple-900/20" : ""
                      }`}
                      onClick={() => setSelected(o)}
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full admin-avatar flex items-center justify-center flex-shrink-0">
                            <ClipboardList className="w-3.5 h-3.5 text-primary-foreground" />
                          </div>
                          <span className="font-medium text-foreground">{o.orderId}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-foreground">{o.storeId}</td>
                      <td className="px-5 py-3.5 text-muted-foreground">{o.orderDate ?? "—"}</td>
                      <td className="px-5 py-3.5 text-center">
                        {o.priorityLevel != null ? (
                          <span className="badge badge-pending">Lvl {o.priorityLevel}</span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        {badge(o.statusOrder, orderStatusColor(o.statusOrder))}
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        {badge(o.paymentStatus ?? "—", paymentStatusColor(o.paymentStatus))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Detail panel */}
          {selected && (
            <div className="admin-card rounded-xl p-5 w-full xl:w-80 flex-shrink-0 space-y-4 animate-fade-in">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-foreground">Order Detail</h3>
                <button
                  onClick={() => setSelected(null)}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Clear ×
                </button>
              </div>

              {/* Info rows */}
              {[
                { Icon: ClipboardList, label: "Order ID",       value: selected.orderId },
                { Icon: Store,         label: "Store",          value: selected.storeId },
                { Icon: CalendarDays,  label: "Order Date",     value: selected.orderDate ?? "—" },
                { Icon: BarChart2,     label: "Priority",       value: selected.priorityLevel != null ? `Level ${selected.priorityLevel}` : "—" },
                { Icon: CreditCard,    label: "Payment Option", value: selected.paymentOption ?? "—" },
                { Icon: Banknote,      label: "Payment Method", value: selected.paymentMethod ?? "—" },
                { Icon: StickyNote,    label: "Note",           value: selected.note || "—" },
              ].map(({ Icon, label, value }) => (
                <div key={label} className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{label}</p>
                    <p className="text-sm text-foreground font-medium break-words">{value}</p>
                  </div>
                </div>
              ))}

              {/* Status badges */}
              <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
                {badge(selected.statusOrder, orderStatusColor(selected.statusOrder))}
                {badge(selected.paymentStatus ?? "—", paymentStatusColor(selected.paymentStatus))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CentralKitchenOrderManagement;
