import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "../components/ui/Sidebar";
import Topbar from "../components/ui/Topbar";

/**
 * MainLayout — the shared shell used by every role that needs a Sidebar + Topbar.
 *
 * Props:
 *  - navItems   : array  — nav sections/links to display in the Sidebar.
 *                          Shape: [{ section: string, items: [{ label, icon, to }] }]
 *  - pageTitles : object — maps URL pathname → page title shown in the Topbar.
 *                          e.g. { "/admin": "Dashboard", "/staff/orders": "Orders" }
 *  - defaultTitle: string — fallback title when the path has no entry in pageTitles.
 *
 * To add a new role-based layout, just import MainLayout in a thin wrapper file
 * (like AdminLayout.jsx does) and pass in that role's specific navItems + pageTitles.
 */
const MainLayout = ({ navItems = [], pageTitles = {}, defaultTitle = "Dashboard" }) => {
  const [collapsed, setCollapsed] = useState(false);
  const location   = useLocation();

  const pageTitle = pageTitles[location.pathname] ?? defaultTitle;

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar — receives its nav links from the caller */}
      <Sidebar
        navItems={navItems}
        collapsed={collapsed}
        onToggle={() => setCollapsed((v) => !v)}
      />

      {/* Right column: Topbar on top, swappable page content below */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar pageTitle={pageTitle} />

        {/*
         * <Outlet /> is where React Router renders the matched child route.
         * The Sidebar + Topbar never unmount — only this area changes.
         */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
