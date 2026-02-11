import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { OrderProvider } from "./contexts/OrderContext";
import Login from "./pages/Login";
import Register from "./pages/Register";
import DashboardLayout from "./layouts/DashboardLayout";
import StaffDashboard from "./pages/staff/StaffDashboard";
import CreateOrder from "./pages/staff/CreateOrder";
import OrderList from "./pages/staff/OrderList";
import OrderDetail from "./pages/staff/OrderDetail";
import StoreInventory from "./pages/staff/StoreInventory";

const App = () => (
  <BrowserRouter>
    <OrderProvider>
      <Routes>
        {/* Auth routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Staff routes */}
        <Route path="/staff" element={<DashboardLayout />}>
          <Route path="dashboard" element={<StaffDashboard />} />
          <Route path="orders" element={<OrderList />} />
          <Route path="orders/create" element={<CreateOrder />} />
          <Route path="orders/:id" element={<OrderDetail />} />
          <Route path="inventory" element={<StoreInventory />} />
          <Route index element={<Navigate to="dashboard" replace />} />
        </Route>

        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </OrderProvider>
  </BrowserRouter>
);

export default App;
