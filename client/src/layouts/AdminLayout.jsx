import { useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import AdminGlobalSearch from "../components/admin/AdminGlobalSearch";
import AdminNotificationBell from "../components/admin/AdminNotificationBell";
import { toast } from "react-hot-toast";
import {
  FiUsers,
  FiBriefcase,
  FiLogOut,
  FiShield,
  FiActivity,
  FiMenu,
  FiX,
  FiUser,
  FiPackage,
  FiFileText,
  FiBookOpen,
  FiZap,
  FiDollarSign,
  FiMessageSquare,
  FiGift,
  FiPieChart,
} from "react-icons/fi";

const AdminLayout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem("adminSidebarCollapsed") === "true";
  });
  const adminInfo = JSON.parse(localStorage.getItem("adminInfo") || "{}");

  const toggleCollapse = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem("adminSidebarCollapsed", newState);
  };

  const getBreadcrumbs = () => {
    const paths = location.pathname
      .split("/")
      .filter((x) => x && x !== "admin" && x !== "dashboard");
    return paths.map((path, index) => {
      const url = `/admin/${paths.slice(0, index + 1).join("/")}`;
      const label =
        path.charAt(0).toUpperCase() + path.slice(1).replace(/-/g, " ");
      return { label, url, isLast: index === paths.length - 1 };
    });
  };

  const breadcrumbs = getBreadcrumbs();

  const logout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminInfo");
    toast.success("Logged out successfully");
    navigate("/admin/login");
  };

  const navItems = [
    { label: "Overview", path: "/admin/dashboard", icon: FiActivity },
    { label: "Manage Users", path: "/admin/users", icon: FiUsers },
    { label: "Businesses", path: "/admin/businesses", icon: FiBriefcase },
    { label: "Marketplace", path: "/admin/marketplace", icon: FiPackage },
    { label: "Jobs", path: "/admin/jobs", icon: FiFileText },
    { label: "Stories & Feed", path: "/admin/stories-feed", icon: FiBookOpen },
    { label: "Reviews", path: "/admin/reviews", icon: FiMessageSquare },
    { label: "Rewards & Loyalty", path: "/admin/rewards", icon: FiGift },
    { label: "Referral Management", path: "/admin/referrals", icon: FiUsers },
    { label: "Push Manager", path: "/admin/notifications", icon: FiZap },
    {
      label: "Revenue & Subs",
      path: "/admin/subscriptions",
      icon: FiDollarSign,
    },
    {
      label: "Sub-Admin",
      path: "/admin/sub-admins",
      icon: FiShield,
    },
    {
      label: "Analytics & Reports",
      path: "/admin/analytics",
      icon: FiPieChart,
    },
    { label: "My Profile", path: "/admin/profile", icon: FiUser },
  ];

  const handleNavClick = (path) => {
    navigate(path);
    setIsSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-dark-bg text-slate-200 flex overflow-x-hidden">
      <div
        onClick={() => setIsSidebarOpen(false)}
        className={`fixed inset-0 bg-slate-950/60 backdrop-blur-md z-40 lg:hidden transition-opacity duration-300 ${isSidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
      />

      <aside
        className={`
          fixed inset-y-0 left-0 z-50 bg-slate-950/95 lg:bg-slate-900/40 border-r border-white/5 
          backdrop-blur-3xl transform transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1)
          ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0 lg:static lg:shrink-0
          ${isCollapsed ? "w-24" : "w-80"}
        `}
      >
        <div
          className={`flex flex-col h-full ${isCollapsed ? "p-4" : "p-8"} overflow-y-auto scrollbar-hide`}
        >
          <div
            className={`flex items-center ${isCollapsed ? "justify-center" : "justify-between"} mb-12 px-2`}
          >
            <div
              className={`flex items-center ${isCollapsed ? "justify-center" : "gap-4"}`}
            >
              <div
                className={`${isCollapsed ? "w-10 h-10" : "w-12 h-12"} bg-indigo-600 rounded-[1.25rem] flex items-center justify-center shadow-xl shadow-indigo-500/30 ring-4 ring-indigo-500/10 shrink-0`}
              >
                <FiShield className="text-white text-xl lg:text-2xl" />
              </div>
              {!isCollapsed && (
                <div className="flex flex-col">
                  <span className="text-2xl font-black tracking-tight text-white leading-none mb-1">
                    Lokonomy
                  </span>
                  <span className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-400 ml-0.5">
                    Admin Central
                  </span>
                </div>
              )}
            </div>
            {!isCollapsed && (
              <button
                className="lg:hidden p-2 bg-slate-800/50 rounded-xl text-slate-400 hover:text-white transition-all active:scale-95"
                onClick={() => setIsSidebarOpen(false)}
              >
                <FiX size={24} />
              </button>
            )}
            <button
              onClick={toggleCollapse}
              className="hidden lg:flex p-2 hover:bg-white/5 rounded-xl text-slate-500 hover:text-white transition-all absolute -right-3 top-20 bg-slate-900 border border-white/5"
            >
              <FiMenu size={16} className={isCollapsed ? "rotate-180" : ""} />
            </button>
          </div>

          <nav className="flex-1 space-y-3">
            {navItems
              .filter((item) => {
                if (
                  (item.path === "/admin/sub-admins" ||
                    item.path === "/admin/analytics") &&
                  adminInfo.role !== "superadmin"
                ) {
                  return false;
                }
                return true;
              })
              .map((item) => (
                <button
                  key={item.path}
                  onClick={() => handleNavClick(item.path)}
                  title={isCollapsed ? item.label : ""}
                  className={`w-full flex items-center ${isCollapsed ? "justify-center px-0" : "gap-4 px-6"} py-4 rounded-2xl font-bold transition-all duration-300 relative group overflow-hidden ${
                    location.pathname === item.path ||
                    (item.path !== "/admin/dashboard" &&
                      location.pathname.startsWith(item.path + "/"))
                      ? "text-white bg-indigo-600 shadow-xl shadow-indigo-500/30"
                      : "text-slate-300 hover:text-slate-200 hover:bg-slate-800/50"
                  }`}
                >
                  <item.icon
                    className={`text-xl ${location.pathname === item.path || (item.path !== "/admin/dashboard" && location.pathname.startsWith(item.path + "/")) ? "scale-110" : "group-hover:scale-110"} transition-transform`}
                  />
                  {!isCollapsed && (
                    <span className="text-sm tracking-wide truncate">
                      {item.label}
                    </span>
                  )}
                </button>
              ))}
          </nav>

          <div className="mt-auto pt-6 border-t border-white/5">
            <button
              onClick={() => navigate("/admin/profile")}
              className={`w-full flex items-center ${isCollapsed ? "justify-center px-0" : "gap-4 px-2"} mb-8 hover:bg-white/5 p-3 rounded-2xl transition-all duration-300 group`}
            >
              <div
                className={`${isCollapsed ? "w-10 h-10" : "w-12 h-12"} rounded-2xl bg-indigo-600/10 flex items-center justify-center text-indigo-400 font-bold border border-white/5 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-inner shrink-0`}
              >
                {adminInfo.name?.charAt(0) || "A"}
              </div>
              {!isCollapsed && (
                <div className="flex-1 text-left overflow-hidden">
                  <p className="text-sm font-bold truncate text-white group-hover:text-indigo-400 transition-colors">
                    {adminInfo.name || "Administrator"}
                  </p>
                  <p className="text-[10px] text-slate-500 truncate uppercase tracking-widest font-black opacity-60">
                    {adminInfo.role || "Admin"}
                  </p>
                </div>
              )}
            </button>
            <button
              onClick={logout}
              className={`w-full flex items-center ${isCollapsed ? "justify-center px-0" : "gap-4 px-6"} py-4 rounded-2xl text-rose-400 hover:bg-rose-500/10 transition-all font-bold border border-transparent hover:border-rose-500/20 shadow-sm`}
            >
              <FiLogOut className="text-xl" />
              {!isCollapsed && (
                <span className="text-sm tracking-wide">Logout Account</span>
              )}
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <header className="flex items-center justify-between p-4 lg:p-6 bg-slate-950/40 backdrop-blur-3xl border-b border-white/5 shadow-2xl z-20">
          <div className="flex items-center gap-4 flex-1">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2.5 bg-slate-800/50 rounded-xl text-slate-300 hover:text-white active:scale-95 transition-all"
            >
              <FiMenu size={20} />
            </button>

            <div className="hidden lg:flex items-center gap-3">
              <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <FiShield className="text-white text-lg" />
              </div>
              <h2 className="text-lg font-black text-white uppercase tracking-tight">
                Admin<span className="text-indigo-500">Panel</span>
              </h2>
            </div>

            <AdminGlobalSearch />
          </div>

          <div className="flex items-center gap-3 lg:gap-5">
            <AdminNotificationBell />

            <div className="h-8 w-px bg-white/5 hidden sm:block mx-1"></div>

            <div className="flex items-center gap-3 pl-2">
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-xs font-bold text-white">
                  {adminInfo.name || "Admin"}
                </span>
                <span className="text-[9px] text-indigo-400 font-black uppercase tracking-widest opacity-70">
                  {adminInfo.role || "Admin"}
                </span>
              </div>
              <button
                onClick={() => navigate("/admin/profile")}
                className="w-10 h-10 rounded-xl bg-indigo-600/10 border border-white/5 flex items-center justify-center text-indigo-400 hover:bg-indigo-600 hover:text-white transition-all shadow-inner overflow-hidden"
              >
                {adminInfo.avatar ? (
                  <img
                    src={adminInfo.avatar}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  adminInfo.name?.charAt(0) || "A"
                )}
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto custom-scrollbar bg-[radial-gradient(circle_at_top_right,var(--tw-gradient-stops))] from-indigo-500/5 via-transparent to-transparent">
          <div className="px-4 py-6 sm:px-8 lg:px-12 xl:px-16 pt-8 max-w-7xl mx-auto">
            <nav className="flex items-center gap-2 mb-8 text-[11px] font-black uppercase tracking-widest overflow-x-auto whitespace-nowrap scrollbar-hide">
              <button
                onClick={() => navigate("/admin/dashboard")}
                className="text-slate-500 hover:text-indigo-400 transition-colors"
              >
                Dashboard
              </button>
              {breadcrumbs.map((crumb, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="text-slate-700">/</span>
                  <button
                    onClick={() => !crumb.isLast && navigate(crumb.url)}
                    disabled={crumb.isLast}
                    className={`${crumb.isLast ? "text-indigo-400" : "text-slate-500 hover:text-slate-300"} transition-colors`}
                  >
                    {crumb.label}
                  </button>
                </div>
              ))}
            </nav>

            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
