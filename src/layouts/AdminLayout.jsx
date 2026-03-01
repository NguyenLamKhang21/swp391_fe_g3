import { LayoutDashboard, Users } from "lucide-react";
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
      //khúc này chưa rõ lắm
      { label: "User Management", icon: Users, to: "/admin/users" },
    ],
  },
  // Add more sections/items here as the app grows, e.g.:
  // {
  //   section: "Quản lý",
  //   items: [
  //     { label: "Đơn hàng",  icon: ShoppingCart, to: "/admin/orders"    },
  //     { label: "Sản phẩm",  icon: Package,      to: "/admin/products"  },
  //     { label: "Người dùng",icon: Users,         to: "/admin/users"     },
  //   ],
  // },
];

const adminPageTitles = {
  "/admin":           "Dashboard",
  "/admin/users":     "User Management", //why??????
  "/admin/orders":    "Quản lý đơn hàng",
  "/admin/kitchen":   "Xử lý đơn hàng — Bếp Trung Tâm",
  "/admin/inventory": "Tồn kho & Nguyên liệu",
  "/admin/delivery":  "Điều phối & Giao nhận",
  "/admin/products":  "Sản phẩm",
  "/admin/stores":    "Chuỗi cửa hàng",
  "/admin/analytics": "Thống kê",
  "/admin/settings":  "Cài đặt",
};

const AdminLayout = () => (
  <MainLayout
    navItems={adminNavItems}
    pageTitles={adminPageTitles}
    defaultTitle="Admin"
  />
);

export default AdminLayout;
