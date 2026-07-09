import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

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

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="flex min-h-screen">
      <aside className="fixed inset-y-0 left-0 z-30 flex w-64 flex-col bg-navy text-white">
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

      <main className="ml-64 flex-1">
        <div className="border-b bg-white px-8 py-4 shadow-sm">
          <a href="https://linkedin.com/in/robi-hagos" target="_blank" rel="noopener noreferrer" className="text-sm text-slate-500 hover:text-accent">
            Built by Robel Hagos Mahray →
          </a>
        </div>
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
