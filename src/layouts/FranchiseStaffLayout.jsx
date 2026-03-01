import { LayoutDashboard, Users, Package } from "lucide-react";
import MainLayout from "./MainLayout";
import { Outlet } from "react-router-dom";


const franchiseStaffNavItem = [
    {
        section: "inventory & ordering",
        items: [
            { label: "inventory & ordering", icon: Package, to: "/franchiseStaff/inventory-ordering" }
        ]
    }
];

const franchisePageTitles = {
    "/franchiseStaff/inventory-ordering": "tạo đơn"
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