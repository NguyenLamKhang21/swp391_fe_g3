import { useState, useEffect } from "react";
import { ClipboardList, CheckCircle, Clock, Loader2, RefreshCw, Search, XCircle, AlertCircle } from "lucide-react";
import { toast } from "react-toastify";
import { getAllOrders } from "../api/authAPI";

const STATUS_STYLES = {
  PENDING:      { color: "text-amber-600",   bg: "bg-amber-50",   border: "border-amber-200", icon: Clock        },
  APPROVED:     { color: "text-blue-600",    bg: "bg-blue-50",    border: "border-blue-200",  icon: CheckCircle  },
  COOKING:      { color: "text-orange-600",  bg: "bg-orange-50",  border: "border-orange-200",icon: AlertCircle  },
  COOKING_DONE: { color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200",icon: CheckCircle },
  IN_PROCESS:   { color: "text-purple-600",  bg: "bg-purple-50",  border: "border-purple-200",icon: Loader2      },
  DELIVERED:    { color: "text-green-600",   bg: "bg-green-50",   border: "border-green-200", icon: CheckCircle  },
  REJECTED:     { color: "text-red-600",     bg: "bg-red-50",     border: "border-red-200",   icon: XCircle      },
  CANCELLED:    { color: "text-gray-600",    bg: "bg-gray-50",    border: "border-gray-200",  icon: XCircle      },
};

const getStatusStyle = (status) =>
  STATUS_STYLES[status] ?? { color: "text-gray-600", bg: "bg-gray-50", border: "border-gray-200", icon: AlertCircle };

const SupplyCoordinatorOrders = () => {
  const [orders, setOrders]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await getAllOrders();
      const data = res.data?.data ?? res.data ?? [];
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error("Không thể tải danh sách đơn hàng.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const filtered = orders.filter((o) => {
    const term = searchTerm.toLowerCase();
    return (
      (o.orderId?.toLowerCase() ?? "").includes(term) ||
      (o.storeId?.toLowerCase() ?? "").includes(term) ||
      (o.statusOrder?.toLowerCase() ?? "").includes(term)
    );
  });

  return (
    <div className="animate-fade-in space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Order Management</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Xem và quản lý tất cả đơn hàng trong hệ thống.
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20">
          <ClipboardList className="w-4 h-4 text-primary" />
          <span className="text-xs font-semibold text-primary">Supply Coordinator</span>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Tìm theo Order ID, Store ID, Status..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="um-input pl-10 w-full"
          />
        </div>
        <button
          onClick={fetchOrders}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm font-medium hover:bg-muted transition-colors disabled:opacity-60"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Làm mới
        </button>
      </div>

      {/* Table */}
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
          <div>
            <p className="text-base font-semibold text-foreground">Không có đơn hàng nào</p>
            <p className="text-sm text-muted-foreground mt-1">
              {searchTerm ? "Không tìm thấy đơn hàng phù hợp với từ khóa." : "Hiện tại chưa có đơn hàng nào trong hệ thống."}
            </p>
          </div>
        </div>
      ) : (
        <div className="admin-card rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-border flex items-center justify-between">
            <h3 className="text-base font-semibold text-foreground">All Orders</h3>
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
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((o) => {
                  const style = getStatusStyle(o.statusOrder);
                  const StatusIcon = style.icon;
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
                        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${style.bg} ${style.color} ${style.border} border`}>
                          <StatusIcon className="w-3.5 h-3.5" />
                          {o.statusOrder}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupplyCoordinatorOrders;
