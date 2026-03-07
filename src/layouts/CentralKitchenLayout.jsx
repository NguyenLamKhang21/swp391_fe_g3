import { ChefHat } from "lucide-react";
import MainLayout from "./MainLayout";

const centralKitchenNavItems = [
  {
    section: "Xử lý đơn hàng",
    items: [
      { label: "Order Processing", icon: ChefHat, to: "/central-kitchen/orders" },
    ],
  },
];

const centralKitchenPageTitles = {
  "/central-kitchen/orders": "Order Processing",
};

const CentralKitchenLayout = () => (
  <MainLayout
    navItems={centralKitchenNavItems}
    pageTitles={centralKitchenPageTitles}
    defaultTitle="Central Kitchen"
  />
);

export default CentralKitchenLayout;
