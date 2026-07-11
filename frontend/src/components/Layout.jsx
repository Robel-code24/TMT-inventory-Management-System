import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useState } from "react";
import AIAssistant from "./AIAssistant";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: "📊" },
  { to: "/products", label: "Products", icon: "📦" },
  { to: "/stock", label: "Stock", icon: "🔄" },
  { to: "/categories", label: "Categories", icon: "🏷️" },
  { to: "/suppliers", label: "Suppliers", icon: "🚚" },
  { to: "/reports", label: "Reports", icon: "📋" },
  { to: "/activity", label: "Activity Log", icon: "📝", adminOnly: true },
  { to: "/users", label: "Users", icon: "👥", adminOnly: true },
];

export default function Layout() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="flex min-h-screen">
      {/* Mobile menu button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="fixed top-4 left-4 z-50 rounded-lg bg-navy p-2 text-white lg:hidden"
      >
        {sidebarOpen ? "✕" : "☰"}
      </button>

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-navy text-white transition-transform lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="border-b border-slate-700 px-6 py-5">
          <h1 className="text-lg font-bold tracking-tight">TMT InventoryPro</h1>
          <p className="mt-1 text-xs text-slate-400">Management System</p>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {navItems
            .filter((item) => !item.adminOnly || isAdmin)
            .map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-accent text-white"
                      : "text-slate-300 hover:bg-navy-light hover:text-white"
                  }`
                }
              >
                <span>{item.icon}</span>
                {item.label}
              </NavLink>
            ))}
          <button
            onClick={() => setAiOpen(true)}
            className="flex items-center gap-3 w-full rounded-lg px-3 py-2.5 text-sm font-medium text-slate-300 hover:bg-navy-light hover:text-white transition-colors"
          >
            <span>🤖</span>
            AI Assistant
          </button>
        </nav>

        <div className="border-t border-slate-700 px-4 py-4">
          <div className="mb-3 px-2">
            <p className="truncate text-sm font-medium">{user?.full_name}</p>
            <p className="truncate text-xs text-slate-400">{user?.email}</p>
            <span className="mt-1 inline-block rounded bg-navy-light px-2 py-0.5 text-xs capitalize text-accent">
              {user?.role}
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="w-full rounded-lg bg-navy-light px-3 py-2 text-sm text-slate-300 transition hover:bg-red-600 hover:text-white"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
        />
      )}

      {/* Main content */}
      <main className="flex-1 lg:ml-64">
        <div className="border-b bg-white px-4 py-4 shadow-sm lg:px-8">
          <a href="https://github.com/Robel-code24" target="_blank" rel="noopener noreferrer" className="text-sm text-slate-500 hover:text-accent">
            Built by Robel Hagos Mahray →
          </a>
        </div>
        <div className="p-4 lg:p-8">
          <Outlet />
        </div>
      </main>

      {/* AI Assistant */}
      <AIAssistant isOpen={aiOpen} onClose={() => setAiOpen(false)} />
    </div>
  );
}
