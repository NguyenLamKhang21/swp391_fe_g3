import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  UserPlus, User, Mail, Lock, Phone, Shield,
  CheckCircle, Loader2, Eye, EyeOff,
  RefreshCw, Search, Users, AlertTriangle, Store,
  X, Calendar, Clock, Hash, Info,
} from "lucide-react";
import { toast } from "react-toastify";
import { createUser, getAllUsers, getAllStore } from "../api/authAPI";

/* ─── Role config ─── */
const ROLE_META = {
  ADMIN:                   { label: "Admin",                  color: "badge-role-admin"    },
  MANAGER:                 { label: "Manager",                color: "badge-role-manager"  },
  SUPPLY_COORDINATOR:      { label: "Supply Coordinator",     color: "badge-role-supply"   },
  CENTRAL_KITCHEN_STAFF:   { label: "Central Kitchen Staff",  color: "badge-role-kitchen"  },
  FRANCHISE_STAFF:         { label: "Franchise Staff",        color: "badge-role-franchise"},
};

const ROLES_CREATE = [
  { id: 1, label: "Admin",                  key: "ADMIN"                 },
  { id: 2, label: "Supply Coordinator",     key: "SUPPLY_COORDINATOR"    },
  { id: 3, label: "Central Kitchen Staff",  key: "CENTRAL_KITCHEN_STAFF" },
  { id: 4, label: "Manager",                key: "MANAGER"               },
  { id: 5, label: "Franchise Staff",        key: "FRANCHISE_STAFF"       },
];

const FRANCHISE_STAFF_ROLE_ID = 5; // matches id: 5 in ROLES_CREATE

const EMPTY_FORM = { fullName: "", email: "", password: "", phone: "", idRole: 1, storeId: "" };

/* ─── Helpers ─── */
const RoleBadge = ({ role }) => {
  const meta = ROLE_META[role];
  if (!meta) return <span className="badge badge-pending">{role}</span>;
  return <span className={`badge ${meta.color}`}>{meta.label}</span>;
};

const Avatar = ({ name }) => (
  <div className="w-9 h-9 rounded-full admin-avatar flex items-center justify-center text-primary-foreground text-sm font-bold flex-shrink-0">
    {(name ?? "?").charAt(0).toUpperCase()}
  </div>
);

const fmtDate = (iso) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("vi-VN", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
};

/* ══════════════════════════════════════════════════════════════════════ */
const UserManagement = () => {
  /* ── form state ── */
  const [form,    setForm]    = useState(EMPTY_FORM);
  const [showPw,  setShowPw]  = useState(false);
  const [creating, setCreating] = useState(false);

  /* ── users table state ── */
  const [users,    setUsers]    = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [fetchError,   setFetchError]   = useState(null);
  const [search,  setSearch]  = useState("");
  const [selectedUser, setSelectedUser] = useState(null);

  /* ── stores map (email → store) for Franchise Staff ── */
  const [storeMap, setStoreMap] = useState({});

  const fetchStores = async () => {
    try {
      const res = await getAllStore();
      const list = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.data) ? res.data.data : [];
      const map = {};
      list.forEach((s) => {
        if (s.managerEmail) map[s.managerEmail.toLowerCase()] = s;
      });
      setStoreMap(map);
    } catch { /* silent */ }
  };

  /* ── fetch all users ── */
  const fetchUsers = async () => {
    setLoadingUsers(true);
    setFetchError(null);
    try {
      const res = await getAllUsers();
      // Support both array response and wrapped { data: [...] }
      const list = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.data)
          ? res.data.data
          : [];
      setUsers(list);
    } catch (err) {
      const msg = err?.response?.data?.message ?? "Failed to load users.";
      setFetchError(msg);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => { fetchUsers(); fetchStores(); }, []);

  /* ── form handlers ── */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => {
      const updated = { ...prev, [name]: name === "idRole" ? Number(value) : value };
      // When the user switches AWAY from Franchise Staff, clear the storeId
      // so we don't accidentally send a stale Store ID with a different role.
      if (name === "idRole" && Number(value) !== FRANCHISE_STAFF_ROLE_ID) {
        updated.storeId = "";
      }
      return updated;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.fullName.trim()) { toast.error("Please enter a full name.");  return; }
    if (!form.email.trim())    { toast.error("Please enter an email.");     return; }
    if (!form.password)        { toast.error("Please enter a password.");   return; }

    try {
      setCreating(true);
      const res = await createUser(form);
      const payload = res.data;

      if (payload?.statusCode === 0 || payload?.data) {
        toast.success(`Account "${form.fullName}" created successfully!`);
        setForm(EMPTY_FORM);
        fetchUsers();
        fetchStores();
      } else {
        toast.error(payload?.message ?? "Failed to create account.");
      }
    } catch (err) {
      toast.error(err?.response?.data?.message ?? "Server error — please try again.");
    } finally {
      setCreating(false);
    }
  };

  const getUserStore = (u) => {
    if (u.role !== "FRANCHISE_STAFF") return null;
    return storeMap[u.email?.toLowerCase()] ?? null;
  };

  /* ── filtered users ── */
  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    return (
      u.fullName?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.role?.toLowerCase().includes(q) ||
      u.phone?.includes(q)
    );
  });

  /* ══ render ══ */
  return (
    <div className="animate-fade-in space-y-8">

      {/* ── Page header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">User Management</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage all system accounts. Only admins can access this page.
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20">
          <Shield className="w-4 h-4 text-primary" />
          <span className="text-xs font-semibold text-primary">Admin Only</span>
        </div>
      </div>

      {/* ── Create User Card ── */}
      <div className="admin-card rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl admin-sidebar-brand flex items-center justify-center">
            <UserPlus className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-foreground">Create New Account</h3>
            <p className="text-xs text-muted-foreground">Calls POST /auth/create</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">

          {/* Full Name */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground" htmlFor="um-fullName">
              Full Name <span className="text-destructive">*</span>
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <input id="um-fullName" name="fullName" value={form.fullName} onChange={handleChange}
                placeholder="Nguyễn Văn A" required className="um-input pl-10" />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground" htmlFor="um-email">
              Email <span className="text-destructive">*</span>
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <input id="um-email" name="email" type="email" value={form.email} onChange={handleChange}
                placeholder="user@example.com" required className="um-input pl-10" />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground" htmlFor="um-password">
              Password <span className="text-destructive">*</span>
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <input id="um-password" name="password" type={showPw ? "text" : "password"}
                value={form.password} onChange={handleChange}
                placeholder="••••••••" required className="um-input pl-10 pr-10" />
              <button type="button" onClick={() => setShowPw((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={-1}>
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Phone */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground" htmlFor="um-phone">Phone</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <input id="um-phone" name="phone" value={form.phone} onChange={handleChange}
                placeholder="0901234567" className="um-input pl-10" />
            </div>
          </div>

          {/* Role */}
          <div className="space-y-1.5 md:col-span-2">
            <label className="text-sm font-medium text-foreground" htmlFor="um-idRole">
              Role <span className="text-destructive">*</span>
            </label>
            <div className="flex flex-wrap gap-3">
              {ROLES_CREATE.map((role) => (
                <label key={role.id}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border cursor-pointer transition-all duration-200 select-none
                    ${form.idRole === role.id
                      ? "border-primary bg-primary/10 text-primary font-semibold"
                      : "border-border bg-muted/50 text-muted-foreground hover:border-primary/50 hover:text-foreground"
                    }`}>
                  <input type="radio" name="idRole" value={role.id}
                    checked={form.idRole === role.id} onChange={handleChange} className="sr-only" />
                  <Shield className="w-4 h-4" />
                  {role.label}
                </label>
              ))}
            </div>
          </div>

          {/* ── Store ID (only shown when Franchise Staff is selected) ── */}
          {/*
            isFranchiseStaff is true when the selected role id equals 5 (Franchise Staff).
            The && operator means: "if isFranchiseStaff is true, render what comes after &&".
            When it's false, React renders nothing — the field disappears completely.
          */}
          {form.idRole === FRANCHISE_STAFF_ROLE_ID && (
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-sm font-medium text-foreground" htmlFor="um-storeId">
                Store ID <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <Store className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <input
                  id="um-storeId"
                  name="storeId"
                  value={form.storeId}
                  onChange={handleChange}
                  placeholder="Enter the Store ID for this staff member"
                  required
                  className="um-input pl-10"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                This field is required for Franchise Staff accounts.
              </p>
            </div>
          )}

          {/* Submit */}
          <div className="md:col-span-2 flex justify-end pt-2">
            <button id="um-submit-btn" type="submit" disabled={creating}
              className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold text-sm
                hover:opacity-90 active:scale-[0.98] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed">
              {creating
                ? <><Loader2 className="w-4 h-4 animate-spin" />Creating…</>
                : <><UserPlus className="w-4 h-4" />Create Account</>}
            </button>
          </div>
        </form>
      </div>

      {/* ── All Users Table ── */}
      <div className="admin-card rounded-xl overflow-hidden">
        {/* Table Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground">All Users</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {loadingUsers ? "Loading…" : `${filtered.length} user${filtered.length !== 1 ? "s" : ""} found`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <input
                id="um-search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search users…"
                className="um-input pl-9 py-2 text-sm w-52"
              />
            </div>
            {/* Refresh */}
            <button
              id="um-refresh-btn"
              onClick={() => { fetchUsers(); fetchStores(); }}
              disabled={loadingUsers}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-sm text-foreground hover:bg-muted transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loadingUsers ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Loading skeleton */}
        {loadingUsers && (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm">Loading users…</p>
          </div>
        )}

        {/* Error */}
        {!loadingUsers && fetchError && (
          <div className="flex flex-col items-center gap-3 py-14 text-center px-6">
            <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center">
              <AlertTriangle className="w-7 h-7 text-red-500" />
            </div>
            <p className="text-base font-semibold text-foreground">Failed to load users</p>
            <p className="text-sm text-muted-foreground">{fetchError}</p>
            <button onClick={fetchUsers}
              className="mt-1 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-all">
              Try Again
            </button>
          </div>
        )}

        {/* Table */}
        {!loadingUsers && !fetchError && (
          <div className="overflow-x-auto">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-14 text-center">
                <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
                  <User className="w-7 h-7 text-muted-foreground" />
                </div>
                <p className="text-base font-semibold text-foreground">No users found</p>
                <p className="text-sm text-muted-foreground">
                  {search ? "Try a different search term." : "No users in the system yet."}
                </p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="admin-table-header">
                    <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">User</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Phone</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Store</th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Created At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map((u, idx) => (
                    <tr key={u.id ?? idx} className="admin-table-row cursor-pointer" style={{ animationDelay: `${idx * 40}ms` }} onClick={() => setSelectedUser(u)}>

                      {/* User cell */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar name={u.fullName} />
                          <div className="min-w-0">
                            <p className="font-medium text-foreground truncate">{u.fullName}</p>
                            <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Phone */}
                      <td className="px-6 py-4 text-muted-foreground hidden sm:table-cell whitespace-nowrap">
                        {u.phone ?? "—"}
                      </td>

                      {/* Role */}
                      <td className="px-6 py-4">
                        <RoleBadge role={u.role} />
                      </td>

                      {/* Store */}
                      <td className="px-6 py-4 hidden md:table-cell">
                        {(() => {
                          const store = getUserStore(u);
                          if (!store) return <span className="text-xs text-muted-foreground">—</span>;
                          return (
                            <div className="flex items-center gap-1.5">
                              <Store className="w-3.5 h-3.5 text-primary/60 flex-shrink-0" />
                              <div className="min-w-0">
                                <p className="text-xs font-medium text-foreground truncate">{store.storeName}</p>
                                <p className="text-[10px] text-muted-foreground font-mono">{store.storeId}</p>
                              </div>
                            </div>
                          );
                        })()}
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4 text-center">
                        {u.active ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                            <CheckCircle className="w-3.5 h-3.5" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-500 bg-red-50 px-2.5 py-1 rounded-full border border-red-200">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            Inactive
                          </span>
                        )}
                      </td>

                      {/* Created At */}
                      <td className="px-6 py-4 text-muted-foreground text-xs hidden lg:table-cell whitespace-nowrap">
                        {fmtDate(u.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Footer */}
        {!loadingUsers && !fetchError && filtered.length > 0 && (
          <div className="px-6 py-3 border-t border-border">
            <p className="text-xs text-muted-foreground">
              Showing {filtered.length} of {users.length} users
            </p>
          </div>
        )}
      </div>

      {/* ══════════════════ ACCOUNT DETAIL MODAL ══════════════════ */}
      {selectedUser && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setSelectedUser(null)} />

          <div className="relative bg-background border border-border rounded-2xl shadow-2xl w-full max-w-md animate-fade-in">
            {/* Header */}
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar name={selectedUser.fullName} />
                <div>
                  <h3 className="text-lg font-bold text-foreground">{selectedUser.fullName}</h3>
                  <p className="text-xs text-muted-foreground">{selectedUser.email}</p>
                </div>
              </div>
              <button onClick={() => setSelectedUser(null)} className="p-2 rounded-lg hover:bg-muted transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              {/* Status + Role */}
              <div className="flex items-center gap-3">
                <RoleBadge role={selectedUser.role} />
                {selectedUser.active ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                    <CheckCircle className="w-3.5 h-3.5" />
                    Active
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-500 bg-red-50 px-2.5 py-1 rounded-full border border-red-200">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Inactive
                  </span>
                )}
              </div>

              {/* Detail fields */}
              <div className="space-y-3">
                {[
                  { label: "User ID",      value: selectedUser.id,       icon: Hash     },
                  { label: "Họ và tên",     value: selectedUser.fullName, icon: User     },
                  { label: "Email",         value: selectedUser.email,    icon: Mail     },
                  { label: "Số điện thoại", value: selectedUser.phone,    icon: Phone    },
                  { label: "Vai trò",       value: ROLE_META[selectedUser.role]?.label ?? selectedUser.role, icon: Shield },
                  { label: "Ngày tạo",      value: fmtDate(selectedUser.createdAt),  icon: Calendar },
                  { label: "Cập nhật lần cuối", value: fmtDate(selectedUser.updatedAt), icon: Clock },
                ].map(({ label, value, icon: Icon }) => (
                  <div key={label} className="flex items-start gap-3 bg-muted/50 rounded-lg p-3">
                    <Icon className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{label}</p>
                      <p className="text-sm font-medium text-foreground mt-0.5 break-all">{value ?? "—"}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Assigned Store (Franchise Staff only) */}
              {(() => {
                const store = getUserStore(selectedUser);
                if (selectedUser.role !== "FRANCHISE_STAFF") return null;
                return (
                  <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <Store className="w-4 h-4 text-primary" />
                      <p className="text-sm font-semibold text-foreground">Cửa hàng được gán</p>
                    </div>
                    {store ? (
                      <div className="space-y-2 pl-6">
                        <div>
                          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Tên cửa hàng</p>
                          <p className="text-sm font-medium text-foreground">{store.storeName}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Store ID</p>
                          <p className="text-sm font-mono text-foreground">{store.storeId}</p>
                        </div>
                        {store.address && (
                          <div>
                            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Địa chỉ</p>
                            <p className="text-sm text-foreground">
                              {[store.address, store.ward, store.district, store.province].filter(Boolean).join(", ")}
                            </p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground pl-6 italic">
                        Chưa được gán cửa hàng nào
                      </p>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-border flex justify-end">
              <button
                onClick={() => setSelectedUser(null)}
                className="px-4 py-2.5 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default UserManagement;
