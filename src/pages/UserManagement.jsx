import { useState } from "react";
import { UserPlus, User, Mail, Lock, Phone, Shield, CheckCircle, XCircle, Loader2, Eye, EyeOff } from "lucide-react";
import { toast } from "react-toastify";
import { createUser } from "../api/authAPI";

/* ─── Role options — must match the `roles` table in the database ─── */
const ROLES = [
  { id: 1, label: "Admin",                 color: "badge-role-admin"      },
  { id: 2, label: "Supply Coordinator",    color: "badge-role-supply"     },
  { id: 3, label: "Central Kitchen Staff", color: "badge-role-kitchen"    },
  { id: 4, label: "Manager",               color: "badge-role-manager"    },
  { id: 5, label: "Franchise Staff",       color: "badge-role-franchise"  },
];

const EMPTY_FORM = {
  fullName: "",
  email:    "",
  password: "",
  phone:    "",
  idRole:   1,
};

/* ─── Small helper: role badge ─── */
const RoleBadge = ({ roleId }) => {
  const role = ROLES.find((r) => r.id === Number(roleId));
  if (!role) return <span className="badge badge-pending">{roleId}</span>;
  return <span className={`badge ${role.color}`}>{role.label}</span>;
};

/* ══════════════════════════════════════════════════════════════════════ */
const UserManagement = () => {
  const [form,       setForm]       = useState(EMPTY_FORM);
  const [showPw,     setShowPw]     = useState(false);
  const [loading,    setLoading]    = useState(false);
  const [createdUsers, setCreatedUsers] = useState([]);  // list of users created this session

  /* ── handlers ── */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === "idRole" ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic client-side validation
    if (!form.fullName.trim()) { toast.error("Please enter a full name.");  return; }
    if (!form.email.trim())    { toast.error("Please enter an email.");     return; }
    if (!form.password)        { toast.error("Please enter a password.");   return; }

    try {
      setLoading(true);
      const res = await createUser(form);

      // Expecting: { statusCode, message, data: { token, email, fullName, role, userId, ... } }
      const payload = res.data;

      if (payload?.statusCode === 0 || payload?.data) {
        const created = payload?.data ?? {};
        toast.success(`Account for "${form.fullName}" created successfully!`);

        // Add to the session table
        setCreatedUsers((prev) => [
          {
            userId:   created.userId   ?? `#${Date.now()}`,
            fullName: created.fullName ?? form.fullName,
            email:    created.email    ?? form.email,
            role:     form.idRole,
            createdAt: new Date().toLocaleString("vi-VN"),
          },
          ...prev,
        ]);

        setForm(EMPTY_FORM);
      } else {
        toast.error(payload?.message ?? "Failed to create account.");
      }
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
          <h2 className="text-2xl font-bold text-foreground">User Management</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Create new accounts for any role. Only admins can access this page.
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
              <input
                id="um-fullName"
                name="fullName"
                value={form.fullName}
                onChange={handleChange}
                placeholder="Nguyễn Văn A"
                required
                className="um-input pl-10"
              />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground" htmlFor="um-email">
              Email <span className="text-destructive">*</span>
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <input
                id="um-email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="user@example.com"
                required
                className="um-input pl-10"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground" htmlFor="um-password">
              Password <span className="text-destructive">*</span>
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <input
                id="um-password"
                name="password"
                type={showPw ? "text" : "password"}
                value={form.password}
                onChange={handleChange}
                placeholder="••••••••"
                required
                className="um-input pl-10 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={-1}
              >
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Phone */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground" htmlFor="um-phone">
              Phone
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <input
                id="um-phone"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="0901234567"
                className="um-input pl-10"
              />
            </div>
          </div>

          {/* Role */}
          <div className="space-y-1.5 md:col-span-2">
            <label className="text-sm font-medium text-foreground" htmlFor="um-idRole">
              Role <span className="text-destructive">*</span>
            </label>
            <div className="flex flex-wrap gap-3">
              {ROLES.map((role) => (
                <label
                  key={role.id}
                  className={`
                    flex items-center gap-2 px-4 py-2.5 rounded-lg border cursor-pointer
                    transition-all duration-200 select-none
                    ${form.idRole === role.id
                      ? "border-primary bg-primary/10 text-primary font-semibold"
                      : "border-border bg-muted/50 text-muted-foreground hover:border-primary/50 hover:text-foreground"
                    }
                  `}
                >
                  <input
                    type="radio"
                    name="idRole"
                    value={role.id}
                    checked={form.idRole === role.id}
                    onChange={handleChange}
                    className="sr-only"
                  />
                  <Shield className="w-4 h-4" />
                  {role.label}
                </label>
              ))}
            </div>
          </div>

          {/* Submit */}
          <div className="md:col-span-2 flex justify-end pt-2">
            <button
              id="um-submit-btn"
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
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating…</>
                : <><UserPlus className="w-4 h-4" /> Create Account</>
              }
            </button>
          </div>
        </form>
      </div>

      {/* ── Created Users Table (session only) ── */}
      {createdUsers.length > 0 && (
        <div className="admin-card rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-border flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-foreground">Recently Created</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Accounts created this session</p>
            </div>
            <span className="badge badge-delivered">{createdUsers.length} created</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="admin-table-header">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Created At</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {createdUsers.map((u, i) => (
                  <tr key={u.userId} className="admin-table-row">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full admin-avatar flex items-center justify-center text-primary-foreground text-xs font-bold flex-shrink-0">
                          {u.fullName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{u.fullName}</p>
                          <p className="text-xs text-muted-foreground">ID: {u.userId}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-foreground">{u.email}</td>
                    <td className="px-6 py-4"><RoleBadge roleId={u.role} /></td>
                    <td className="px-6 py-4 text-muted-foreground">{u.createdAt}</td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-green-600">
                        <CheckCircle className="w-4 h-4" />
                        Active
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
      {createdUsers.length === 0 && (
        <div className="admin-card rounded-xl p-12 flex flex-col items-center gap-4 text-center">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
            <User className="w-8 h-8 text-muted-foreground" />
          </div>
          <div>
            <p className="text-base font-semibold text-foreground">No accounts created yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Fill in the form above and click <strong>Create Account</strong> to get started.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
