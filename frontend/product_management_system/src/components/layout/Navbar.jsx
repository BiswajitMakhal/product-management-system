import { Menu, UserCircle2 } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const Navbar = ({ onMenuClick }) => {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-30 h-14 sm:h-16 bg-slate-900/85 backdrop-blur-md border-b border-slate-800 px-3 sm:px-6 flex items-center justify-between gap-2">
      {/* Left: Hamburger for Mobile + Welcome Text */}
      <div className="flex items-center gap-2.5 min-w-0">
        <button
          onClick={onMenuClick}
          className="p-2 rounded-xl bg-slate-800/80 text-slate-300 hover:text-amber-400 hover:bg-slate-800 lg:hidden transition cursor-pointer"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="truncate">
          <h2 className="text-xs sm:text-sm font-medium text-slate-300 truncate">
            Welcome back,{" "}
            <span className="font-semibold text-amber-400">{user?.name}</span>
          </h2>
        </div>
      </div>

      {/* Right: User Avatar & Role Badge */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <div className="hidden xs:flex flex-col items-end">
          <span className="text-xs font-semibold text-slate-200">
            {user?.role}
          </span>
          <span className="text-[10px] text-emerald-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Active Session
          </span>
        </div>
        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-amber-400">
          <UserCircle2 className="w-5 h-5 sm:w-6 sm:h-6" />
        </div>
      </div>
    </header>
  );
};

export default Navbar;