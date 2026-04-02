import { ChefHat, Package, ClipboardList } from "lucide-react";
import MainLayout from "./MainLayout";

const centralKitchenNavItems = [
  {
    section: "Xử lý đơn hàng",
    items: [
      { label: "Batch Production",   icon: ChefHat,       to: "/central-kitchen/orders" },
      { label: "Order Management",   icon: ClipboardList, to: "/central-kitchen/order-management" },
    ],
  },
  {
    section: "Kho nguyên liệu",
    items: [
      { label: "Inventory Management", icon: Package, to: "/central-kitchen/inventory" },
    ],
  },
];

const centralKitchenPageTitles = {
  "/central-kitchen/orders":             "Order Processing",
  "/central-kitchen/order-management":   "Order Management",
  "/central-kitchen/inventory":          "Inventory Management",
};

const CentralKitchenLayout = () => (
  <MainLayout
    navItems={centralKitchenNavItems}
    pageTitles={centralKitchenPageTitles}
    defaultTitle="Central Kitchen"
  />
);

export default CentralKitchenLayout;
