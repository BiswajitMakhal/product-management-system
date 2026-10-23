import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  Layers,
  Users,
  KeyRound,
  LogOut,
  ShieldCheck,
  X,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout, isAdminOrSuper } = useAuth();

  const navItems = [
    ...(isAdminOrSuper
      ? [
          {
            name: "Dashboard",
            path: "/dashboard",
            icon: LayoutDashboard,
          },
        ]
      : []),
    {
      name: "Products",
      path: "/products",
      icon: Package,
    },
    {
      name: "Categories & Sub",
      path: "/categories",
      icon: Layers,
    },
    ...(isAdminOrSuper
      ? [
          {
            name: "User Management",
            path: "/users",
            icon: Users,
          },
        ]
      : []),
    {
      name: "Security & Password",
      path: "/settings",
      icon: KeyRound,
    },
  ];

  const getRoleBadgeStyle = (role) => {
    if (role === "Super Admin")
      return "bg-amber-500/15 text-amber-400 border-amber-500/30";
    if (role === "Admin") return "bg-sky-500/15 text-sky-400 border-sky-500/30";
    return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 left-0 z-50 h-screen w-64 sm:w-68 bg-slate-900 border-r border-slate-800 flex flex-col transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between h-16 px-4 sm:px-6 border-b border-slate-800">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-950 font-bold shadow-lg shadow-amber-500/20 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="truncate">
              <h1 className="text-sm sm:text-base font-bold tracking-tight text-slate-100 truncate">
                GS<span className="text-amber-400">PMS</span>
              </h1>
              <p className="text-[11px] text-slate-400 truncate">
                RBAC Inventory Suite
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 lg:hidden cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Profile Mini Card */}
        <div className="p-4 border-b border-slate-800/80 bg-slate-950/40">
          <p className="text-xs font-medium text-slate-200 truncate">
            {user?.name}
          </p>
          <p className="text-[11px] text-slate-400 truncate mt-0.5">
            {user?.email}
          </p>
          <span
            className={`inline-flex items-center px-2 py-0.5 mt-2 text-[10px] font-semibold uppercase tracking-wider rounded-md border ${getRoleBadgeStyle(
              user?.role,
            )}`}
          >
            {user?.role}
          </span>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? "bg-amber-500 text-slate-950 font-semibold shadow-md shadow-amber-500/15"
                      : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/70"
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{item.name}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Logout Footer */}
        <div className="p-3 border-t border-slate-800">
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
