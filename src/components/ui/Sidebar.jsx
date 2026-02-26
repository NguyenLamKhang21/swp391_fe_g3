import { Link, useLocation } from "react-router-dom";
import { ChefHat, ChevronLeft, ChevronRight } from "lucide-react";

/**
 * Sidebar — shared navigation panel used by all role layouts.
 *
 * Props:
 *  - navItems : array   — nav sections passed in from the parent layout.
 *                         Shape: [{ section: string, items: [{ label, icon: LucideIcon, to: string }] }]
 *  - collapsed: boolean — whether the sidebar is in icon-only mode
 *  - onToggle : fn      — callback to toggle collapsed state
 */
const Sidebar = ({ navItems = [], collapsed, onToggle }) => {
  const location = useLocation();

  return (
    <aside
      className={`
        admin-sidebar h-screen flex flex-col transition-all duration-300 ease-in-out
        ${collapsed ? "w-[68px]" : "w-[240px]"}
      `}
      style={{ boxShadow: "4px 0 24px hsl(222 47% 11% / 0.18)" }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-sidebar-border min-h-[64px]">
        <div className="w-9 h-9 rounded-xl admin-sidebar-brand flex items-center justify-center flex-shrink-0">
          <ChefHat className="w-5 h-5 text-primary-foreground" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <p className="text-sm font-bold text-sidebar-foreground leading-tight whitespace-nowrap">
              CentralKitchen
            </p>
            <p className="text-[10px] text-sidebar-foreground/50 whitespace-nowrap">
              Management Panel
            </p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 space-y-1 scrollbar-thin">
        {navItems.map((section) => (
          <div key={section.section} className="mb-2">
            {!collapsed && (
              <p className="px-4 pb-1 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/40">
                {section.section}
              </p>
            )}
            {section.items.map((item) => {
              const active = location.pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  title={collapsed ? item.label : undefined}
                  className={`
                    sidebar-nav-item flex items-center gap-3 mx-2 px-3 py-2.5 rounded-lg
                    transition-all duration-200 group
                    ${active
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                    }
                    ${collapsed ? "justify-center" : ""}
                  `}
                >
                  <item.icon
                    className={`w-5 h-5 flex-shrink-0 transition-transform group-hover:scale-110 ${active ? "text-primary-foreground" : ""}`}
                  />
                  {!collapsed && (
                    <span className="text-sm font-medium whitespace-nowrap">{item.label}</span>
                  )}
                  {active && !collapsed && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-foreground/70" />
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Collapse toggle */}
      <div className="p-3 border-t border-sidebar-border">
        <button
          onClick={onToggle}
          className={`
            w-full flex items-center gap-2 px-3 py-2 rounded-lg
            text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground
            transition-all duration-200
            ${collapsed ? "justify-center" : ""}
          `}
        >
          {collapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <>
              <ChevronLeft className="w-5 h-5" />
              <span className="text-sm">Thu gọn</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
