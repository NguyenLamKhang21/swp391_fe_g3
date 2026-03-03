import { ClipboardList } from "lucide-react";
import MainLayout from "./MainLayout";

const supplyCoordinatorNavItems = [
  {
    section: "Quản lý",
    items: [
      { label: "Order Management", icon: ClipboardList, to: "/supply-coordinator/orders" },
    ],
  },
];

const supplyCoordinatorPageTitles = {
  "/supply-coordinator/orders": "Order Management",
};

const SupplyCoordinatorLayout = () => (
  <MainLayout
    navItems={supplyCoordinatorNavItems}
    pageTitles={supplyCoordinatorPageTitles}
    defaultTitle="Supply Coordinator"
  />
);

export default SupplyCoordinatorLayout;
