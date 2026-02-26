import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, LogOut, Search, User, ChevronDown } from "lucide-react";
import { toast } from "react-toastify";

const Topbar = ({ pageTitle }) => {
  const navigate = useNavigate();
  const email = localStorage.getItem("email") || "admin@example.com";
  const role = localStorage.getItem("role") || "ADMIN";
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleLogout = () => {
    localStorage.clear();
    toast.info("Đã đăng xuất");
    navigate("/login");
  };

  // Use first letter of email as avatar fallback
  const initials = email.charAt(0).toUpperCase();

  return (
    <header className="admin-topbar h-16 flex items-center justify-between px-6 gap-4 sticky top-0 z-30">
      {/* Left: Page title */}
      <div className="flex-1 min-w-0">
        <h1 className="text-lg font-semibold text-foreground truncate">{pageTitle}</h1>
      </div>

      {/* Center: Search */}
      <div className="hidden md:flex items-center gap-2 admin-search-bar rounded-lg px-3 py-2 w-64">
        <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        <input
          type="text"
          placeholder="Tìm kiếm..."
          className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none w-full"
        />
      </div>

      {/* Right: Notifications + Profile */}
      <div className="flex items-center gap-3">
        {/* Notification bell */}
        <button className="relative w-9 h-9 flex items-center justify-center rounded-lg hover:bg-muted transition-colors">
          <Bell className="w-5 h-5 text-muted-foreground" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full border-2 border-background" />
        </button>

        {/* Divider */}
        <div className="w-px h-6 bg-border" />

        {/* Profile dropdown */}
        <div className="relative">
          <button
            id="profile-dropdown-btn"
            onClick={() => setDropdownOpen((v) => !v)}
            className="flex items-center gap-2.5 pl-1 pr-3 py-1 rounded-lg hover:bg-muted transition-colors"
          >
            {/* Avatar */}
            <div className="w-8 h-8 rounded-full admin-avatar flex items-center justify-center text-primary-foreground text-sm font-bold flex-shrink-0">
              {initials}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-semibold text-foreground leading-tight max-w-[140px] truncate">
                {email}
              </p>
              <p className="text-[11px] text-primary font-medium capitalize">
                {role.toLowerCase()}
              </p>
            </div>
            <ChevronDown
              className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`}
            />
          </button>

          {/* Dropdown menu */}
          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 admin-dropdown rounded-xl shadow-lg overflow-hidden z-50">
              {/* Profile info */}
              <div className="px-4 py-3 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full admin-avatar flex items-center justify-center text-primary-foreground font-bold">
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{email}</p>
                    <span className="inline-block mt-0.5 text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-primary/10 text-primary tracking-wide">
                      {role}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="py-1">
                <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors">
                  <User className="w-4 h-4 text-muted-foreground" />
                  Thông tin tài khoản
                </button>
                <button
                  onClick={handleLogout}
                  id="logout-btn"
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Đăng xuất
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Quick logout button (always visible) */}
        <button
          onClick={handleLogout}
          title="Đăng xuất"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-destructive border border-destructive/30 hover:bg-destructive/10 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Đăng xuất</span>
        </button>
      </div>
    </header>
  );
};

export default Topbar;
