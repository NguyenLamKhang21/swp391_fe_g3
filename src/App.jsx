import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import RequireAuth from "./components/ui/RequireAuth";
import AdminLayout from "./layouts/AdminLayout";

// Admin pages
import AdminDashboard from "./pages/AdminDashboard";
import UserManagement from "./pages/UserManagement";
import StoreManagement from "./pages/StoreManagement";
import KitchenConfig from "./pages/KitchenConfig";


// Franchise Staff pages
import FranchiseStaffLayout from "./layouts/FranchiseStaffLayout";
import FranchiseStaff from "./pages/FranchiseStaff";
import FranchiseDebtPayment from "./pages/FranchiseDebtPayment";

// Supply Coordinator pages
import SupplyCoordinatorLayout from "./layouts/SupplyCoordinatorLayout";
import SupplyCoordinatorOrders from "./pages/SupplyCoordinatorOrders";
import SupplyDeliveryManagement from "./pages/SupplyDeliveryManagement";
import SupplyBatchManagement from "./pages/SupplyBatchManagement";

// Manager pages
import ManagerLayout from "./layouts/ManagerLayout";
import ManagerDashboard from "./pages/ManagerDashboard";
import ManagerOrders from "./pages/ManagerOrders";
import ManagerStores from "./pages/ManagerStores";

// Central Kitchen pages
import CentralKitchenLayout from "./layouts/CentralKitchenLayout";
import CentralKitchenOrders from "./pages/CentralKitchenOrders";
import CentralKitchenInventory from "./pages/CentralKitchenInventory";
// import CentralKitchenOrderManagement from "./pages/CentralKitchenOrderManagement";

import VNPayReturn from "./pages/VNPayReturn";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const App = () => (
  <BrowserRouter>
    <Routes>
      {/* ── Public routes ─────────────────────────────────────────────── */}
      <Route path="/"         element={<Login />} />
      <Route path="/login"    element={<Login />} />
      <Route path="/payment/vnpay-return" element={<VNPayReturn />} />
    
      

      {/*
       * ── Admin routes ──────────────────────────────────────────────────
       *
       * HOW IT WORKS:
       *
       * 1. RequireAuth roles={["ADMIN"]}  — redirects anyone who isn't ADMIN
       * 2. AdminLayout                    — draws the Sidebar + Topbar shell
       *                                     (thin wrapper around MainLayout)
       *
       * To add a NEW admin page:
       *   a) Create  src/pages/YourPage.jsx
       *   b) Import it here
       *   c) Add  <Route path="your-page" element={<YourPage />} />
       *   d) Add the path→title in AdminLayout.jsx adminPageTitles
       *   e) Add a nav link in AdminLayout.jsx adminNavItems
       *   Sidebar & Topbar appear for FREE.
       *
       * For OTHER roles (e.g. STAFF, KITCHEN) follow the same pattern:
       *   - Create  src/layouts/StaffLayout.jsx  (clone AdminLayout, change config)
       *   - Wrap with  <RequireAuth roles={["STAFF"]}>
       */}
      <Route
        path="/admin"
        element={
          <RequireAuth roles={["ADMIN"]}>
            <AdminLayout />
          </RequireAuth>
        }
      >
        {/* /admin  → Dashboard (default / index page) */}
        <Route index element={<AdminDashboard />} />

        {/* /admin/users  → User Management */}
        <Route index path="users"  element={<UserManagement />} />

        {/* /admin/stores → Store Management */}
        <Route path="stores" element={<StoreManagement />} />

        {/* 👇 Add more pages here following the same pattern */}
        <Route path="kitchen-config" element={<KitchenConfig />} />
      </Route>

      {/* ── Franchise Staff routes ─────────────────────────────────────── */}
      <Route path="/franchiseStaff"
        element={
          <RequireAuth roles={["FRANCHISE_STAFF"]}>
            <FranchiseStaffLayout />
          </RequireAuth>
          }
      >
        <Route index element={<FranchiseStaff />} />
        <Route path="inventory-ordering" element={<FranchiseStaff />} />
        <Route path="debt-payment" element={<FranchiseDebtPayment />} />
      </Route>

      {/* ── Supply Coordinator routes ──────────────────────────────────── */}
      <Route
        path="/supply-coordinator"
        element={
          <RequireAuth roles={["SUPPLY_COORDINATOR"]}>
            <SupplyCoordinatorLayout />
          </RequireAuth>
        }
      >
        <Route index element={<SupplyCoordinatorOrders />} />
        <Route path="orders" element={<SupplyCoordinatorOrders />} />
        <Route path="delivery" element={<SupplyDeliveryManagement />} />
        <Route path="batch" element={<SupplyBatchManagement />} />
      </Route>

      {/* ── Manager routes ────────────────────────────────────────────── */}
      <Route
        path="/manager"
        element={
          <RequireAuth roles={["MANAGER"]}>
            <ManagerLayout />
          </RequireAuth>
        }
      >
        <Route index element={<ManagerDashboard />} />
        <Route path="orders" element={<ManagerOrders />} />
        <Route path="inventory" element={<CentralKitchenInventory />} />
        <Route path="stores" element={<ManagerStores />} />
      </Route>

      {/* ── Central Kitchen routes ─────────────────────────────────────── */}
      <Route
        path="/central-kitchen"
        element={
          <RequireAuth roles={["CENTRAL_KITCHEN_STAFF"]}>
            <CentralKitchenLayout />
          </RequireAuth>
        }
      >
        <Route index element={<CentralKitchenOrders />} />
        <Route path="orders" element={<CentralKitchenOrders />} />
        <Route path="order-management" element={<SupplyCoordinatorOrders />} />
        <Route path="inventory" element={<CentralKitchenInventory />} />
      </Route>
    </Routes>

    <ToastContainer position="top-right" autoClose={2500} />
  </BrowserRouter>
);

export default App;
