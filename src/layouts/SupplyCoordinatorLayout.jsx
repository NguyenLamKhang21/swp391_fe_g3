import { BathIcon, BoxIcon, ClipboardList, Truck } from "lucide-react";
import MainLayout from "./MainLayout";

const supplyCoordinatorNavItems = [
  {
    section: "Quản lý",
    items: [
      { label: "Order Management", icon: ClipboardList, to: "/supply-coordinator/orders" },
      { label: "Delivery Management", icon: Truck, to: "/supply-coordinator/delivery" },
      { label: "Batch Management", icon: BoxIcon, to: "/supply-coordinator/batch"},
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
