import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Package,
  Layers,
  GitBranch,
  Users,
  RefreshCw,
  ArrowUpRight,
  BarChart3,
  ShieldCheck,
} from "lucide-react";
import axiosInstance from "../../api/axiosInstance";
import toast from "react-hot-toast";

const Dashboard = () => {
  const [stats, setStats] = useState({
    totals: {
      totalUsers: 0,
      totalProducts: 0,
      totalCategories: 0,
      totalSubCategories: 0,
    },
    roleWiseUsers: [],
    categoryWiseProducts: [],
    subCategoryWiseProducts: [],
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get("/dashboard/stats");
      if (res.data.success) {
        setStats(res.data.data);
      }
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Failed to load dashboard statistics",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const kpiCards = [
    {
      title: "Total Products",
      value: stats.totals.totalProducts,
      icon: Package,
      color: "from-amber-400 to-amber-600",
      bgGlow: "bg-amber-500/10 border-amber-500/30 text-amber-400",
      link: "/products",
    },
    {
      title: "Categories",
      value: stats.totals.totalCategories,
      icon: Layers,
      color: "from-sky-400 to-sky-600",
      bgGlow: "bg-sky-500/10 border-sky-500/30 text-sky-400",
      link: "/categories",
    },
    {
      title: "Subcategories",
      value: stats.totals.totalSubCategories,
      icon: GitBranch,
      color: "from-purple-400 to-purple-600",
      bgGlow: "bg-purple-500/10 border-purple-500/30 text-purple-400",
      link: "/categories",
    },
    {
      title: "Registered Users",
      value: stats.totals.totalUsers,
      icon: Users,
      color: "from-emerald-400 to-emerald-600",
      bgGlow: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400",
      link: "/users",
    },
  ];

  const totalProd = stats.totals.totalProducts || 1;

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg sm:text-2xl font-bold text-slate-100 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-amber-400 shrink-0" />
            <span>Analytics Overview</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Real-time MongoDB aggregation statistics across inventory & roles
          </p>
        </div>

        <button
          onClick={fetchStats}
          disabled={loading}
          className="self-start xs:self-auto inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs sm:text-sm font-medium text-slate-200 transition cursor-pointer"
        >
          <RefreshCw
            className={`w-4 h-4 text-amber-400 ${loading ? "animate-spin" : ""}`}
          />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* 4 KPI Summary Cards (Responsive 1 -> 2 -> 4 columns) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5 sm:gap-5">
        {kpiCards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.title}
              to={card.link}
              className="group bg-slate-900/90 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 sm:p-5 transition-all shadow-lg flex items-center justify-between"
            >
              <div className="space-y-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-slate-400 truncate">
                  {card.title}
                </p>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-2xl sm:text-3xl font-bold text-slate-100">
                    {loading ? "..." : card.value}
                  </h3>
                </div>
                <span className="inline-flex items-center gap-1 text-[11px] text-amber-400 group-hover:translate-x-0.5 transition-transform">
                  Manage <ArrowUpRight className="w-3 h-3" />
                </span>
              </div>

              <div
                className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl border flex items-center justify-center shrink-0 ${card.bgGlow}`}
              >
                <Icon className="w-6 h-6 sm:w-7 sm:h-7" />
              </div>
            </Link>
          );
        })}
      </div>

      {/* Role-Wise User Breakdown Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0" />
            <h2 className="text-sm sm:text-base font-semibold text-slate-100">
              Role-Wise User Distribution
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {stats.roleWiseUsers.length === 0 && !loading ? (
              <span className="text-xs text-slate-500">
                No role data available
              </span>
            ) : (
              stats.roleWiseUsers.map((item) => (
                <div
                  key={item.role}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs"
                >
                  <span className="text-slate-400">{item.role}:</span>
                  <span className="font-bold text-amber-400">{item.count}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Category-wise & Subcategory-wise Product Counts (2 Columns on Desktop, Stacked on 320px Mobile) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Category-wise Product Count */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-6 flex flex-col">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
            <div>
              <h2 className="text-sm sm:text-base font-semibold text-slate-100 flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-400" />
                <span>Category-Wise Products</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Product count per parent category
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-xs font-medium text-slate-300">
              {stats.categoryWiseProducts.length} Categories
            </span>
          </div>

          {loading ? (
            <div className="py-12 text-center text-xs sm:text-sm text-slate-400">
              Loading category statistics...
            </div>
          ) : stats.categoryWiseProducts.length === 0 ? (
            <div className="py-12 text-center text-xs sm:text-sm text-slate-500">
              No categories created yet.
            </div>
          ) : (
            <div className="space-y-3.5 max-h-80 overflow-y-auto pr-1">
              {stats.categoryWiseProducts.map((cat) => {
                const percent = Math.round(
                  (cat.productCount / totalProd) * 100,
                );
                return (
                  <div
                    key={cat.categoryId}
                    className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2 text-xs sm:text-sm">
                      <span className="font-medium text-slate-200 truncate">
                        {cat.categoryName}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-400 font-semibold text-xs shrink-0">
                        {cat.productCount}{" "}
                        {cat.productCount === 1 ? "Product" : "Products"}
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full transition-all duration-500"
                        style={{
                          width: `${cat.productCount > 0 ? Math.max(percent, 6) : 0}%`,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Subcategory-wise Product Count */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-6 flex flex-col">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
            <div>
              <h2 className="text-sm sm:text-base font-semibold text-slate-100 flex items-center gap-2">
                <GitBranch className="w-4 h-4 text-sky-400" />
                <span>Subcategory-Wise Products</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Product breakdown with associated parent category
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-xs font-medium text-slate-300">
              {stats.subCategoryWiseProducts.length} Subcategories
            </span>
          </div>

          {loading ? (
            <div className="py-12 text-center text-xs sm:text-sm text-slate-400">
              Loading subcategory statistics...
            </div>
          ) : stats.subCategoryWiseProducts.length === 0 ? (
            <div className="py-12 text-center text-xs sm:text-sm text-slate-500">
              No subcategories created yet.
            </div>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {stats.subCategoryWiseProducts.map((sub) => (
                <div
                  key={sub.subCategoryId}
                  className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-slate-200 truncate">
                      {sub.subCategoryName}
                    </p>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">
                      Parent:{" "}
                      <span className="text-sky-400 font-medium">
                        {sub.parentCategoryName || "N/A"}
                      </span>
                    </p>
                  </div>

                  <span className="px-2.5 py-1 rounded-lg bg-sky-500/15 border border-sky-500/30 text-sky-400 font-semibold text-xs shrink-0">
                    {sub.productCount}{" "}
                    {sub.productCount === 1 ? "item" : "items"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
