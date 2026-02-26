import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import RequireAuth from "./components/ui/RequireAuth";
import AdminLayout from "./layouts/AdminLayout";

// Admin pages

import AdminDashboard  from "./pages/AdminDashboard";
import UserManagement  from "./pages/UserManagement";

// Other pages
import StorePage from "./pages/StorePage";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const App = () => (
  <BrowserRouter>
    <Routes>
      {/* ── Public routes ─────────────────────────────────────────────── */}
      <Route path="/"         element={<Login />} />
      <Route path="/login"    element={<Login />} />
      <Route path="/register" element={<Register />} />
      

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

        {/* /admin/users  → User Management (ADMIN only — protected by parent route) */}
        <Route path="users" element={<UserManagement />} />

        {/* 👇 Add more pages here following the same pattern */}
      </Route>

      {/* ── Non-admin routes ──────────────────────────────────────────── */}
      <Route path="/store" element={<StorePage />} />
    </Routes>

    <ToastContainer position="top-right" autoClose={2500} />
  </BrowserRouter>
);

export default App;
