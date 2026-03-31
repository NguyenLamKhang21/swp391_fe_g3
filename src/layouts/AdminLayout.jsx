import { LayoutDashboard, Users, Store, CookingPot } from "lucide-react";
import MainLayout from "./MainLayout";

/**
 * AdminLayout — thin config wrapper for the ADMIN role.
 *
 * All it does is define the admin-specific nav links and page titles,
 * then delegates the actual rendering to MainLayout.
 *
 * To add a new admin page:
 *  1. Create  src/pages/YourPage.jsx
 *  2. Add a child <Route> in App.jsx under /admin
 *  3. Add the path → title entry in pageTitles below
 *  4. Add a nav link in adminNavItems below
 *  Done — Sidebar & Topbar appear for free.
 */

const adminNavItems = [
  {
    section: "Tổng quan",
    items: [
      { label: "Dashboard", icon: LayoutDashboard, to: "/admin" },
    ],
  },
  {
    section: "Quản lý",
    items: [
      { label: "User Management",  icon: Users,  to: "/admin/users"  },
      { label: "Store Management", icon: Store, to: "/admin/stores" },
      { label: "Kitchen Config", icon: CookingPot,  to: "/admin/kitchen-config" },
    ],
  },
];

const adminPageTitles = {
  "/admin":           "Dashboard",
  "/admin/users":     "User Management",
  "/admin/stores":    "Store Management",
};

const AdminLayout = () => (
  <MainLayout
    navItems={adminNavItems}
    pageTitles={adminPageTitles}
    defaultTitle="Admin"
  />
);

export default AdminLayout;
