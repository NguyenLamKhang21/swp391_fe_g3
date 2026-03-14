import { useState, useEffect } from "react";
import {
  Store, RefreshCw, Search, AlertTriangle,
  Loader2, MapPin, Phone, Mail, Shield,
  Building2, DollarSign, CreditCard, CheckCircle, XCircle,
} from "lucide-react";
import { toast } from "react-toastify";
import { getAllStore } from "../api/authAPI";

/* ─── Debt Status Badge ─── */
const DebtBadge = ({ deptStatus }) =>
  deptStatus ? (
    <span className="sm-badge sm-badge-debt">
      <XCircle className="w-3.5 h-3.5" />
      Có nợ
    </span>
  ) : (
    <span className="sm-badge sm-badge-clear">
      <CheckCircle className="w-3.5 h-3.5" />
      Không nợ
    </span>
  );

/* ─── Payment method pill ─── */
const PaymentPill = ({ method }) => (
  <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20">
    <CreditCard className="w-3 h-3" />
    {method}
  </span>
);

/* ─── Revenue formatter ─── */
const fmtRevenue = (n) => {
  if (n == null) return "—";
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n);
};

/* ─── Store avatar ─── */
const StoreAvatar = ({ name }) => (
  <div className="w-9 h-9 rounded-xl admin-sidebar-brand flex items-center justify-center text-primary-foreground text-sm font-bold flex-shrink-0">
    {(name ?? "?").charAt(0).toUpperCase()}
  </div>
);

/* ─── Stat Card ─── */
const StatCard = ({ icon: Icon, label, value, color }) => (
  <div className="admin-card rounded-xl p-5 flex items-center gap-4">
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
      <Icon className="w-6 h-6 text-white" />
    </div>
    <div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
    </div>
  </div>
);

/* ══════════════════════════════════════════════════════════════════════ */
const StoreManagement = () => {
  const [stores,     setStores]     = useState([]);
  const [loading,    setLoading]    = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [search,     setSearch]     = useState("");
  const [debtFilter, setDebtFilter] = useState("ALL"); // ALL | DEBT | CLEAR

  /* ── Fetch ── */
  const fetchStores = async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const res = await getAllStore();
      const list = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.data)
          ? res.data.data
          : [];
      setStores(list);
    } catch (err) {
      const msg = err?.response?.data?.message ?? "Failed to load stores.";
      setFetchError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStores(); }, []);

  /* ── Derived stats ── */
  const total        = stores.length;
  const withDebt     = stores.filter((s) => s.deptStatus === true).length;
  const withoutDebt  = stores.filter((s) => s.deptStatus === false).length;
  const totalRevenue = stores.reduce((sum, s) => sum + (s.revenue ?? 0), 0);

  /* ── Filtered list ── */
  const filtered = stores.filter((s) => {
    const q = search.toLowerCase();
    const matchText =
      s.storeName?.toLowerCase().includes(q) ||
      s.storeId?.toLowerCase().includes(q)   ||
      s.address?.toLowerCase().includes(q)   ||
      s.district?.toLowerCase().includes(q)  ||
      s.ward?.toLowerCase().includes(q)      ||
      s.managerEmail?.toLowerCase().includes(q) ||
      s.numberOfContact?.includes(q);

    const matchDebt =
      debtFilter === "ALL" ||
      (debtFilter === "DEBT"  && s.deptStatus === true)  ||
      (debtFilter === "CLEAR" && s.deptStatus === false);

    return matchText && matchDebt;
  });

  /* ══ render ══ */
  return (
    <div className="animate-fade-in space-y-8">

      {/* ── Page header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Store Management</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage all franchise stores in the system.
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20">
          <Shield className="w-4 h-4 text-primary" />
          <span className="text-xs font-semibold text-primary">Admin Only</span>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Building2}    label="Tổng số cửa hàng"  value={total}       color="admin-sidebar-brand" />
        <StatCard icon={XCircle}      label="Đang có nợ"        value={withDebt}    color="bg-red-500"    />
        <StatCard icon={CheckCircle}  label="Không nợ"          value={withoutDebt} color="bg-emerald-500" />
        <StatCard icon={DollarSign}   label="Tổng doanh thu"    value={fmtRevenue(totalRevenue)} color="bg-violet-500" />
      </div>

      {/* ── Table Card ── */}
      <div className="admin-card rounded-xl overflow-hidden">

        {/* Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <Store className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground">All Stores</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {loading ? "Loading…" : `${filtered.length} store${filtered.length !== 1 ? "s" : ""} found`}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Debt filter */}
            <select
              id="sm-debt-filter"
              value={debtFilter}
              onChange={(e) => setDebtFilter(e.target.value)}
              className="um-input py-2 text-sm"
            >
              <option value="ALL">Tất cả</option>
              <option value="DEBT">Đang có nợ</option>
              <option value="CLEAR">Không nợ</option>
            </select>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <input
                id="sm-search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm cửa hàng…"
                className="um-input pl-9 py-2 text-sm w-52"
              />
            </div>

            {/* Refresh */}
            <button
              id="sm-refresh-btn"
              onClick={fetchStores}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-sm text-foreground hover:bg-muted transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm">Loading stores…</p>
          </div>
        )}

        {/* Error */}
        {!loading && fetchError && (
          <div className="flex flex-col items-center gap-3 py-14 text-center px-6">
            <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center">
              <AlertTriangle className="w-7 h-7 text-red-500" />
            </div>
            <p className="text-base font-semibold text-foreground">Failed to load stores</p>
            <p className="text-sm text-muted-foreground">{fetchError}</p>
            <button
              onClick={fetchStores}
              className="mt-1 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-all"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Table */}
        {!loading && !fetchError && (
          <div className="overflow-x-auto">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-14 text-center">
                <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
                  <Store className="w-7 h-7 text-muted-foreground" />
                </div>
                <p className="text-base font-semibold text-foreground">Không tìm thấy cửa hàng</p>
                <p className="text-sm text-muted-foreground">
                  {search || debtFilter !== "ALL"
                    ? "Thử điều chỉnh bộ lọc hoặc từ khóa tìm kiếm."
                    : "Chưa có cửa hàng nào trong hệ thống."}
                </p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="admin-table-header">
                    <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Cửa hàng
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">
                      Địa chỉ
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden sm:table-cell">
                      Liên hệ
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">
                      Doanh thu
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden xl:table-cell">
                      Thanh toán
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Trạng thái nợ
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map((s, idx) => (
                    <tr
                      key={s.storeId ?? idx}
                      className="admin-table-row"
                      style={{ animationDelay: `${idx * 40}ms` }}
                    >
                      {/* Store name + ID */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <StoreAvatar name={s.storeName} />
                          <div className="min-w-0">
                            <p className="font-medium text-foreground truncate">
                              {s.storeName ?? "—"}
                            </p>
                            <p className="text-xs text-muted-foreground font-mono">
                              {s.storeId ?? "—"}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Address — district + ward */}
                      <td className="px-6 py-4 hidden md:table-cell max-w-[220px]">
                        <div className="flex items-start gap-1.5">
                          <MapPin className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-primary/60" />
                          <div className="min-w-0">
                            <p className="truncate text-foreground">{s.address ?? "—"}</p>
                            {(s.ward || s.district) && (
                              <p className="text-xs text-muted-foreground truncate">
                                {[s.ward, s.district].filter(Boolean).join(", ")}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Contact: numberOfContact + managerEmail */}
                      <td className="px-6 py-4 hidden sm:table-cell">
                        <div className="space-y-1">
                          {s.numberOfContact ? (
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Phone className="w-3 h-3 flex-shrink-0" />
                              <span>{s.numberOfContact}</span>
                            </div>
                          ) : null}
                          {s.managerEmail ? (
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Mail className="w-3 h-3 flex-shrink-0" />
                              <span className="truncate max-w-[180px]">{s.managerEmail}</span>
                            </div>
                          ) : null}
                          {!s.numberOfContact && !s.managerEmail && (
                            <span className="text-muted-foreground text-xs">—</span>
                          )}
                        </div>
                      </td>

                      {/* Revenue */}
                      <td className="px-6 py-4 text-right hidden lg:table-cell whitespace-nowrap">
                        <span className="font-semibold text-foreground">
                          {fmtRevenue(s.revenue)}
                        </span>
                      </td>

                      {/* Payment methods */}
                      <td className="px-6 py-4 hidden xl:table-cell">
                        {s.paymentMethods?.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {s.paymentMethods.map((m) => (
                              <PaymentPill key={m} method={m} />
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>

                      {/* Debt status */}
                      <td className="px-6 py-4 text-center">
                        <DebtBadge deptStatus={s.deptStatus} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Footer */}
        {!loading && !fetchError && filtered.length > 0 && (
          <div className="px-6 py-3 border-t border-border">
            <p className="text-xs text-muted-foreground">
              Showing {filtered.length} of {stores.length} stores
            </p>
          </div>
        )}
      </div>

      {/* ── Badge styles ── */}
      <style>{`
        .sm-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.375rem;
          font-size: 0.75rem;
          font-weight: 600;
          padding: 0.25rem 0.625rem;
          border-radius: 9999px;
          white-space: nowrap;
        }
        .sm-badge-debt  { color: #ef4444; background: #fef2f2; border: 1px solid #fecaca; }
        .sm-badge-clear { color: #059669; background: #ecfdf5; border: 1px solid #a7f3d0; }
      `}</style>
    </div>
  );
};

export default StoreManagement;
