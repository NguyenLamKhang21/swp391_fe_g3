import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, ROLES } from "./contexts/AuthContext";
import { OrderProvider } from "./contexts/OrderContext";
import ProtectedRoute from "./components/ProtectedRoute";

// Public pages
import Homepage from "./pages/Homepage";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Unauthorized from "./pages/Unauthorized";

// Layouts
import DashboardLayout from "./layouts/DashboardLayout";

// Staff pages
import StaffDashboard from "./pages/staff/StaffDashboard";
import CreateOrder from "./pages/staff/CreateOrder";
import OrderList from "./pages/staff/OrderList";
import OrderDetail from "./pages/staff/OrderDetail";
import StoreInventory from "./pages/staff/StoreInventory";

const App = () => (
  <BrowserRouter>
    <AuthProvider>
      <OrderProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Homepage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* Franchise Store Staff routes */}
          <Route
            path="/staff"
            element={
              <ProtectedRoute allowedRoles={[ROLES.FRANCHISE_STAFF]}>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route path="dashboard" element={<StaffDashboard />} />
            <Route path="orders" element={<OrderList />} />
            <Route path="orders/create" element={<CreateOrder />} />
            <Route path="orders/:id" element={<OrderDetail />} />
            <Route path="inventory" element={<StoreInventory />} />
            <Route index element={<Navigate to="dashboard" replace />} />
          </Route>

          {/* Supply Coordinator routes (placeholder) */}
          <Route
            path="/coordinator/*"
            element={
              <ProtectedRoute allowedRoles={[ROLES.SUPPLY_COORDINATOR]}>
                <ComingSoon role="Supply Coordinator" />
              </ProtectedRoute>
            }
          />

          {/* Central Kitchen Staff routes (placeholder) */}
          <Route
            path="/kitchen/*"
            element={
              <ProtectedRoute allowedRoles={[ROLES.CENTRAL_KITCHEN]}>
                <ComingSoon role="Central Kitchen Staff" />
              </ProtectedRoute>
            }
          />

          {/* Manager routes (placeholder) */}
          <Route
            path="/manager/*"
            element={
              <ProtectedRoute allowedRoles={[ROLES.MANAGER]}>
                <ComingSoon role="Manager" />
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </OrderProvider>
    </AuthProvider>
  </BrowserRouter>
);

// Placeholder component cho các role chưa phát triển
function ComingSoon({ role }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-8">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-foreground">Đang phát triển</h1>
        <p className="mt-3 text-muted-foreground">
          Dashboard cho <span className="font-semibold text-foreground">{role}</span> đang được phát triển. Vui lòng quay lại sau.
        </p>
        <div className="mt-6">
          <a
            href="/"
            className="inline-flex items-center gap-2 text-primary hover:text-primary/80 font-medium"
          >
            ← Về trang chủ
          </a>
        </div>
      </div>
    </div>
  );
}

export default App;
