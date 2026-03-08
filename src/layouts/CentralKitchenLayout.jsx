import { ChefHat, Package } from "lucide-react";
import MainLayout from "./MainLayout";

const centralKitchenNavItems = [
  {
    section: "Xử lý đơn hàng",
    items: [
      { label: "Order Processing", icon: ChefHat, to: "/central-kitchen/orders" },
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
  "/central-kitchen/orders": "Order Processing",
  "/central-kitchen/inventory": "Inventory Management",
};

const CentralKitchenLayout = () => (
  <MainLayout
    navItems={centralKitchenNavItems}
    pageTitles={centralKitchenPageTitles}
    defaultTitle="Central Kitchen"
  />
);

export default CentralKitchenLayout;
