import { LayoutDashboard, Users, Package, DollarSign } from "lucide-react";
import MainLayout from "./MainLayout";
import { Outlet } from "react-router-dom";


const franchiseStaffNavItem = [
    {
        section: "inventory & ordering",
        items: [
            { label: "Inventory & Ordering", icon: Package, to: "/franchiseStaff/inventory-ordering" },
        ],
    },
    {
        section: "thanh toán",
        items: [
            { label: "Thanh toán nợ", icon: DollarSign, to: "/franchiseStaff/debt-payment" },
        ],
    },
];

const franchisePageTitles = {
    "/franchiseStaff/inventory-ordering": "Tạo đơn",
    "/franchiseStaff/debt-payment": "Thanh toán công nợ",
};

const FranchiseStaffLayout = () => {
    return (
        <MainLayout
            navItems={franchiseStaffNavItem}
            pageTitles={franchisePageTitles}
        >
            <Outlet />
        </MainLayout>
    )
        
};

export default FranchiseStaffLayout;