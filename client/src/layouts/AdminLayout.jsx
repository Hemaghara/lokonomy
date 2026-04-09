import { useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";
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
} from "react-icons/fi";

const AdminLayout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const adminInfo = JSON.parse(localStorage.getItem("adminInfo") || "{}");

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
          fixed inset-y-0 left-0 z-50 w-80 bg-slate-950/90 lg:bg-slate-900/40 border-r border-white/5 
          backdrop-blur-3xl transform transition-transform duration-500 cubic-bezier(0.4, 0, 0.2, 1)
          ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0 lg:static lg:shrink-0
        `}
      >
        <div className="flex flex-col h-full p-8 overflow-y-auto scrollbar-hide">
          <div className="flex items-center justify-between lg:justify-start gap-4 mb-12 px-2">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-600 rounded-[1.25rem] flex items-center justify-center shadow-xl shadow-indigo-500/30 ring-4 ring-indigo-500/10">
                <FiShield className="text-white text-2xl" />
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-black tracking-tight text-white leading-none mb-1">
                  Lokonomy
                </span>
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-400 ml-0.5">
                  Admin Central
                </span>
              </div>
            </div>
            <button
              className="lg:hidden p-2 bg-slate-800/50 rounded-xl text-slate-400 hover:text-white transition-all active:scale-95"
              onClick={() => setIsSidebarOpen(false)}
            >
              <FiX size={24} />
            </button>
          </div>

          <nav className="flex-1 space-y-3">
            {navItems.map((item) => (
              <button
                key={item.path}
                onClick={() => handleNavClick(item.path)}
                className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold transition-all duration-300 relative group overflow-hidden ${
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
                <span className="text-sm tracking-wide">{item.label}</span>
              </button>
            ))}
          </nav>

          <div className="mt-auto pt-6 border-t border-white/5">
            <button
              onClick={() => navigate("/admin/profile")}
              className="w-full flex items-center gap-4 px-2 mb-8 hover:bg-white/5 p-3 rounded-2xl transition-all duration-300 group"
            >
              <div className="w-12 h-12 rounded-2xl bg-indigo-600/10 flex items-center justify-center text-indigo-400 font-bold border border-white/5 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-inner">
                {adminInfo.name?.charAt(0) || "A"}
              </div>
              <div className="flex-1 text-left overflow-hidden">
                <p className="text-sm font-bold truncate text-white group-hover:text-indigo-400 transition-colors">
                  {adminInfo.name || "Administrator"}
                </p>
                <p className="text-[10px] text-slate-500 truncate uppercase tracking-widest font-black opacity-60">
                  {adminInfo.role || "Super Admin"}
                </p>
              </div>
            </button>
            <button
              onClick={logout}
              className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-rose-400 hover:bg-rose-500/10 transition-all font-bold border border-transparent hover:border-rose-500/20 shadow-sm"
            >
              <FiLogOut className="text-xl" />
              <span className="text-sm tracking-wide">Logout Account</span>
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <header className="lg:hidden flex items-center justify-between p-5 bg-slate-950/80 backdrop-blur-xl border-b border-white/5 shadow-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <FiShield className="text-white text-xl" />
            </div>
            <span className="text-xl font-black text-white uppercase tracking-tighter">
              Lokonomy<span className="text-indigo-500 ml-0.5">Admin</span>
            </span>
          </div>
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-3 bg-slate-800/50 rounded-2xl text-slate-300 hover:text-white active:scale-95 transition-all shadow-inner border border-white/5"
          >
            <FiMenu size={24} />
          </button>
        </header>

        <main className="flex-1 overflow-y-auto custom-scrollbar bg-[radial-gradient(circle_at_top_right,var(--tw-gradient-stops))] from-indigo-500/5 via-transparent to-transparent">
          <div className="p-4 sm:p-8 lg:p-12 xl:p-16 max-w-400 mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
