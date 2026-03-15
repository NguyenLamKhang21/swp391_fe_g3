import { useState, useEffect } from "react";
import {
  Store, RefreshCw, Search, AlertTriangle,
  Loader2, MapPin, Phone, Mail, Shield,
  Building2, DollarSign, CreditCard, CheckCircle, XCircle, Plus,
} from "lucide-react";
import { toast } from "react-toastify";
import { getAllStore, createNewFranchiseStore } from "../api/authAPI";

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

//form cho tạo store mới
const EMPTY_STORE_FORM = {
  storeName: "",
  address:   "",
  province:  "",
  district:  "",
  ward:      "",
  revenue:   "",
}

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
  const [storeForm, setStoreForm] = useState(EMPTY_STORE_FORM);
  const [creating, setCreating] = useState(false);

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

  /* ── Form handlers ── */
  const handleStoreChange = (e) => {
    const { name, value } = e.target;
    setStoreForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateStore = async (e) => {
    e.preventDefault(); // stops the browser from refreshing the page

    // validation
    if (!storeForm.storeName.trim()) {
      toast.error("Store name is required");
      return;
    }
    if (!storeForm.address.trim()) {
      toast.error("Address is required");
      return;
    }

    try {
      setCreating(true);

      // request body - revenue must be number, not string
      const payload = {
        ...storeForm,
        revenue: storeForm.revenue === "" ? 0 : Number(storeForm.revenue),
      };

      const res = await createNewFranchiseStore(payload);

      // check if res success
      if (res.data?.statusCode === 0 || res.data?.data) {
        toast.success("Store created successfully!");
        setStoreForm(EMPTY_STORE_FORM); // clear form after success
        fetchStores(); // refresh the table
      } else {
        toast.error(res.data?.message ?? "Failed to create store");
      }
    } catch (err) {
      toast.error(err?.response?.data?.message ?? "Server error - please try again");
    } finally {
      setCreating(false);
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
      s.province?.toLowerCase().includes(q)  ||
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

        {/* ── Create Store Card ── */}
      <div className="admin-card rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl admin-sidebar-brand flex items-center justify-center">
            <Plus className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-foreground">Create New Store</h3>
            <p className="text-xs text-muted-foreground">Calls POST /franchise-stores</p>
          </div>
        </div>

        <form onSubmit={handleCreateStore} className="grid grid-cols-1 md:grid-cols-2 gap-5">

          {/* Store Name */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground" htmlFor="sm-storeName">
              Store Name <span className="text-destructive">*</span>
            </label>
            <div className="relative">
              <Store className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <input id="sm-storeName" name="storeName" value={storeForm.storeName}
                onChange={handleStoreChange} placeholder="VD: Chi nhánh Quận 1"
                required className="um-input pl-10" />
            </div>
          </div>

          {/* Address */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground" htmlFor="sm-address">
              Address <span className="text-destructive">*</span>
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <input id="sm-address" name="address" value={storeForm.address}
                onChange={handleStoreChange} placeholder="VD: 123 Nguyễn Huệ"
                required className="um-input pl-10" />
            </div>
          </div>

          {/* Province */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground" htmlFor="sm-province">
              Province
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <input id="sm-province" name="province" value={storeForm.province}
                onChange={handleStoreChange} placeholder="VD: TP. Hồ Chí Minh"
                className="um-input pl-10" />
            </div>
          </div>

          {/* District */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground" htmlFor="sm-district">
              District
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <input id="sm-district" name="district" value={storeForm.district}
                onChange={handleStoreChange} placeholder="VD: Quận 1"
                className="um-input pl-10" />
            </div>
          </div>

          {/* Ward */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground" htmlFor="sm-ward">
              Ward
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <input id="sm-ward" name="ward" value={storeForm.ward}
                onChange={handleStoreChange} placeholder="VD: Phường Bến Nghé"
                className="um-input pl-10" />
            </div>
          </div>

          {/* Revenue */}
          <div className="space-y-1.5 md:col-span-2">
            <label className="text-sm font-medium text-foreground" htmlFor="sm-revenue">
              Initial Revenue (VND)
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <input id="sm-revenue" name="revenue" type="number" min="0"
                value={storeForm.revenue} onChange={handleStoreChange}
                placeholder="0" className="um-input pl-10" />
            </div>
          </div>

          {/* Submit */}
          <div className="md:col-span-2 flex justify-end pt-2">
            <button type="submit" disabled={creating}
              className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold text-sm
                hover:opacity-90 active:scale-[0.98] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed">
              {creating
                ? <><Loader2 className="w-4 h-4 animate-spin" />Creating…</>
                : <><Plus className="w-4 h-4" />Create Store</>}
            </button>
          </div>
        </form>
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
                            {(s.ward || s.district || s.province) && (
                              <p className="text-xs text-muted-foreground truncate">
                                {[s.ward, s.district, s.province].filter(Boolean).join(", ")}
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
