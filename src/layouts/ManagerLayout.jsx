import {
  LayoutDashboard, Package, ClipboardList, BarChart3, Store,
} from "lucide-react";
import MainLayout from "./MainLayout";

const managerNavItems = [
  {
    section: "Tổng quan",
    items: [
      { label: "Dashboard",  icon: LayoutDashboard, to: "/manager" },
    ],
  },
  {
    section: "Quản lý",
    items: [
      { label: "Đơn hàng",   icon: ClipboardList, to: "/manager/orders" },
      { label: "Quản lý nguyên liệu", icon: Package, to: "/manager/inventory" },
      { label: "Cửa hàng",   icon: Store,          to: "/manager/stores" },
    ],
  },
];

const managerPageTitles = {
  "/manager":           "Dashboard",
  "/manager/orders":    "Quản lý đơn hàng",
  "/manager/inventory": "Quản lý nguyên liệu",
  "/manager/stores":    "Hiệu suất cửa hàng",
};

const ManagerLayout = () => (
  <MainLayout
    navItems={managerNavItems}
    pageTitles={managerPageTitles}
    defaultTitle="Manager"
  />
);

export default ManagerLayout;
