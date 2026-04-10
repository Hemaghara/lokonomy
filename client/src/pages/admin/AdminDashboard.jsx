import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { adminService } from "../../services";
import { connectSocket } from "../../services/socket";
import AdminLayout from "../../layouts/AdminLayout";
import {
  FiUsers,
  FiBriefcase,
  FiPackage,
  FiClipboard,
  FiActivity,
  FiDollarSign,
  FiTrendingUp,
  FiArrowRight,
  FiCalendar,
  FiX,
} from "react-icons/fi";
const STAT_COLORS = {
  emerald: {
    icon: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
    glow: "hover:shadow-emerald-500/10",
    ring: "hover:border-emerald-500/40",
    badge: "bg-emerald-500/10 text-emerald-400",
  },
  indigo: {
    icon: "bg-indigo-500/10 border-indigo-500/20 text-indigo-400",
    glow: "hover:shadow-indigo-500/10",
    ring: "hover:border-indigo-500/40",
    badge: "bg-indigo-500/10 text-indigo-400",
  },
  rose: {
    icon: "bg-rose-500/10 border-rose-500/20 text-rose-400",
    glow: "hover:shadow-rose-500/10",
    ring: "hover:border-rose-500/40",
    badge: "bg-rose-500/10 text-rose-400",
  },
  sky: {
    icon: "bg-sky-500/10 border-sky-500/20 text-sky-400",
    glow: "hover:shadow-sky-500/10",
    ring: "hover:border-sky-500/40",
    badge: "bg-sky-500/10 text-sky-400",
  },
  orange: {
    icon: "bg-orange-500/10 border-orange-500/20 text-orange-400",
    glow: "hover:shadow-orange-500/10",
    ring: "hover:border-orange-500/40",
    badge: "bg-orange-500/10 text-orange-400",
  },
  purple: {
    icon: "bg-purple-500/10 border-purple-500/20 text-purple-400",
    glow: "hover:shadow-purple-500/10",
    ring: "hover:border-purple-500/40",
    badge: "bg-purple-500/10 text-purple-400",
  },
};

const Sparkline = ({ data = [], color = "currentColor" }) => {
  if (data.length < 2) return <div className="w-16 h-4 bg-slate-800/50 rounded-full animate-pulse" />;
  
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const height = 30;
  const width = 80;
  
  const points = data.map((val, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((val - min) / range) * height;
    return `${x},${y}`;
  }).join(" ");

  return (
    <svg viewBox={`0 -2 ${width} ${height + 4}`} className="w-16 h-6 overflow-visible">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
        className="drop-shadow-[0_0_3px_rgba(244,63,94,0.4)]"
      />
    </svg>
  );
};

const StatCard = ({ item }) => {
  const navigate = useNavigate();
  const color = STAT_COLORS[item.color] || STAT_COLORS.indigo;

  return (
    <div
      onClick={() => item.path && navigate(item.path)}
      className={`group relative flex flex-col justify-between gap-3 bg-slate-900/50 border border-slate-800/80 ${color.ring} p-4 sm:p-5 rounded-2xl transition-all duration-300 shadow-lg ${color.glow} hover:shadow-xl backdrop-blur-sm overflow-hidden ${item.path ? "cursor-pointer active:scale-95" : ""}`}
    >
      <div className="absolute -bottom-8 -right-8 w-24 h-24 rounded-full bg-indigo-500/5 opacity-0 group-hover:opacity-100 blur-2xl transition-opacity duration-500 pointer-events-none" />

      <div className="flex items-start justify-between">
        <div
          className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110 ${color.icon}`}
        >
          <item.icon className="text-lg" />
        </div>

        {item.isLive ? (
          <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-rose-400">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500" />
            </span>
            Live
          </span>
        ) : (
          <span
            className={`flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${color.badge}`}
          >
            <FiTrendingUp className="text-xs" />
            {item.trend}
          </span>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-0.5">
          <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-widest text-slate-500">
            {item.label}
          </p>
          {item.trendData && (
            <Sparkline data={item.trendData} color={item.label === "Online Users" ? "#f43f5e" : "#6366f1"} />
          )}
        </div>
        <p className="text-2xl sm:text-3xl font-black tracking-tight text-white leading-none">
          {item.value}
        </p>
      </div>
    </div>
  );
};

const REVENUE_PLAN_CONFIG = {
  silver: {
    dot: "bg-slate-400",
    bar: "bg-gradient-to-r from-slate-500 to-slate-300",
    label: "text-slate-300",
  },
  gold: {
    dot: "bg-yellow-400",
    bar: "bg-gradient-to-r from-yellow-600 to-yellow-400",
    label: "text-yellow-300",
  },
  platinum: {
    dot: "bg-indigo-400",
    bar: "bg-gradient-to-r from-indigo-600 to-indigo-400",
    label: "text-indigo-300",
  },
};

const RevenueBar = ({ plan, value, total }) => {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  const config = REVENUE_PLAN_CONFIG[plan.toLowerCase()] || REVENUE_PLAN_CONFIG.silver;

  return (
    <div className="space-y-2.5 group">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className={`w-2 h-2 rounded-full shrink-0 ${config.dot}`} />
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
              {plan} Tier
            </p>
            <p
              className={`text-lg sm:text-xl font-black tracking-tight ${config.label}`}
            >
              ₹{value || 0}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm font-black text-white">{pct}%</p>
          <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-tight">
            share
          </p>
        </div>
      </div>
      <div className="h-2 w-full bg-slate-800/60 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${config.bar}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [onlineCount, setOnlineCount] = useState(0);
  const [onlineTrend, setOnlineTrend] = useState([]);
  const [dateRange, setDateRange] = useState({
    startDate: "",
    endDate: "",
  });

  useEffect(() => {
    fetchStats(dateRange);
    fetchOnlineTrend();

    const adminInfo = JSON.parse(localStorage.getItem("adminInfo") || "{}");
    const adminId = adminInfo.id || adminInfo._id || "admin_" + Math.random().toString(36).substr(2, 9);

    const socket = connectSocket({ userId: adminId, isAdmin: true });
    socket.on("onlineUsersCount", (count) => setOnlineCount(count));

    return () => {
      socket.off("onlineUsersCount");
    };
  }, []);

  const fetchStats = async (range = {}) => {
    try {
      const { startDate, endDate } = range;
      const params = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const response = await adminService.getDashboardStats(params);
      setStats(response.data);
    } catch {
      toast.error("Failed to fetch statistics");
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (e) => {
    const { name, value } = e.target;
    const newRange = { ...dateRange, [name]: value };
    setDateRange(newRange);
    if (newRange.startDate && newRange.endDate) {
      fetchStats(newRange);
    }
  };

  const clearDateRange = () => {
    const cleared = { startDate: "", endDate: "" };
    setDateRange(cleared);
    fetchStats(cleared);
  };

  const fetchOnlineTrend = async () => {
    try {
      const response = await adminService.getOnlineTrend();
      setOnlineTrend(response.data.map((d) => d.count));
    } catch (err) {
      console.error("Failed to fetch online trend:", err);
    }
  };

  if (loading)
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-5">
          <div className="relative w-14 h-14">
            <div className="absolute inset-0 rounded-full border-4 border-indigo-500/10 border-t-indigo-500 animate-spin" />
            <div className="absolute inset-1 rounded-full border-4 border-transparent border-b-indigo-400/30 animate-spin [animation-duration:1.5s]" />
          </div>
          <div className="text-center">
            <p className="text-white font-extrabold text-lg tracking-tight animate-pulse">
              Lokonomy Admin
            </p>
            <p className="text-slate-500 text-sm mt-0.5">
              Preparing workspace…
            </p>
          </div>
        </div>
      </div>
    );

  const statItems = [
    {
      label: "Total Revenue",
      value: `₹${stats?.stats.totalRevenue || 0}`,
      icon: FiDollarSign,
      color: "emerald",
      trend: stats?.stats.trends?.revenue || "+0%",
    },
    {
      label: "Total Users",
      value: stats?.stats.totalUsers,
      icon: FiUsers,
      color: "indigo",
      trend: stats?.stats.trends?.users || "+0%",
      path: "/admin/users",
    },
    {
      label: "Online Users",
      value: onlineCount,
      icon: FiActivity,
      color: "rose",
      isLive: true,
      path: "/admin/users",
      trendData: onlineTrend.length > 0 ? onlineTrend : [onlineCount * 0.8, onlineCount * 0.9, onlineCount], 
    },
    {
      label: "Businesses",
      value: stats?.stats.totalBusinesses,
      icon: FiBriefcase,
      color: "sky",
      trend: stats?.stats.trends?.businesses || "+0%",
      path: "/admin/businesses",
    },
    {
      label: "Products",
      value: stats?.stats.totalProducts,
      icon: FiPackage,
      color: "orange",
      trend: stats?.stats.trends?.products || "+0%",
      path: "/admin/marketplace",
    },
    {
      label: "Job Postings",
      value: stats?.stats.totalJobs,
      icon: FiClipboard,
      color: "purple",
      trend: stats?.stats.trends?.jobs || "+0%",
      path: "/admin/jobs",
    },
  ];

  return (
    <AdminLayout>
      <header className="flex flex-col xs:flex-row justify-between items-start xs:items-center gap-4 mb-8 sm:mb-10">
        <div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-tight">
            Dashboard <span className="text-indigo-500">Overview</span>
          </h2>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
            <p className="text-slate-400 text-xs sm:text-sm font-medium">
              Real-time platform performance analytics
            </p>
          </div>
        </div>
      </header>

      {stats && (
        <div className="space-y-6 sm:space-y-8">
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
            {statItems.map((item, i) => (
              <StatCard key={i} item={item} />
            ))}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 sm:gap-8">
            <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-5 sm:p-7 backdrop-blur-sm shadow-xl relative overflow-hidden">
              <div className="absolute -top-20 -left-20 w-56 h-56 bg-indigo-500/5 blur-[80px] rounded-full pointer-events-none" />

              <div className="flex items-center gap-3 mb-7 relative">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
                  <FiActivity className="text-indigo-400 text-base" />
                </div>
                <h3 className="text-lg sm:text-xl font-extrabold text-white tracking-tight">
                  Premium <span className="text-indigo-500">Analytics</span>
                </h3>
              </div>

              <div className="space-y-6 relative">
                {["silver", "gold", "platinum"].map((plan) => (
                  <RevenueBar
                    key={plan}
                    plan={plan}
                    value={stats.stats.revenueBreakdown?.[plan.toLowerCase()]}
                    total={stats.stats.totalRevenue}
                  />
                ))}
              </div>
            </div>

            <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl overflow-hidden backdrop-blur-sm shadow-xl flex flex-col">
              <div className="flex items-center justify-between px-5 sm:px-7 py-4 border-b border-slate-800/60 bg-slate-800/20 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                    <FiUsers className="text-emerald-400 text-sm" />
                  </div>
                  <h3 className="font-extrabold text-base sm:text-lg text-white tracking-tight">
                    Recent <span className="text-emerald-400">Joiners</span>
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <div className="hidden md:flex items-center gap-2 bg-slate-900/80 border border-slate-700/50 rounded-lg px-2 py-1">
                    <FiCalendar className="text-slate-500 text-xs" />
                    <input
                      type="date"
                      name="startDate"
                      value={dateRange.startDate}
                      onChange={handleDateChange}
                      className="bg-transparent text-[10px] text-slate-300 outline-none border-none focus:ring-0 w-24 scheme-dark"
                    />
                    <span className="text-slate-600 text-[10px]">to</span>
                    <input
                      type="date"
                      name="endDate"
                      value={dateRange.endDate}
                      onChange={handleDateChange}
                      className="bg-transparent text-[10px] text-slate-300 outline-none border-none focus:ring-0 w-24 scheme-dark"
                    />
                    {(dateRange.startDate || dateRange.endDate) && (
                      <button
                        onClick={clearDateRange}
                        className="p-1 hover:bg-slate-800 rounded-md transition-colors"
                      >
                        <FiX className="text-rose-400 text-xs" />
                      </button>
                    )}
                  </div>
                  <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold rounded-full uppercase tracking-widest border border-emerald-500/20">
                    Active
                  </span>
                </div>
              </div>

              <div className="md:hidden flex flex-wrap items-center gap-2 px-5 py-3 border-b border-slate-800/40 bg-slate-800/10">
                <div className="flex items-center gap-2 bg-slate-900/80 border border-slate-700/50 rounded-lg px-2 py-1.5 flex-1">
                  <FiCalendar className="text-slate-500 text-xs" />
                  <input
                    type="date"
                    name="startDate"
                    value={dateRange.startDate}
                    onChange={handleDateChange}
                    className="bg-transparent text-[10px] text-slate-300 outline-none border-none focus:ring-0 flex-1 scheme-dark"
                  />
                  <span className="text-slate-600 text-[10px]">to</span>
                  <input
                    type="date"
                    name="endDate"
                    value={dateRange.endDate}
                    onChange={handleDateChange}
                    className="bg-transparent text-[10px] text-slate-300 outline-none border-none focus:ring-0 flex-1 scheme-dark"
                  />
                  {(dateRange.startDate || dateRange.endDate) && (
                    <button
                      onClick={clearDateRange}
                      className="p-1 hover:bg-slate-800 rounded-md transition-colors"
                    >
                      <FiX className="text-rose-400 text-xs" />
                    </button>
                  )}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto max-h-72 sm:max-h-80 divide-y divide-slate-800/40 scrollbar-hide">
                {stats.recentUsers?.length > 0 ? (
                  stats.recentUsers.map((user) => (
                    <div
                      key={user._id}
                      className="flex items-center justify-between px-5 sm:px-7 py-3.5 hover:bg-indigo-500/5 transition-colors duration-200 group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-indigo-400 font-black text-sm shrink-0 overflow-hidden group-hover:bg-indigo-500 group-hover:text-white group-hover:border-indigo-500 transition-all duration-300">
                          {user.profileImage ? (
                            <img
                              src={user.profileImage}
                              alt={user.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            user.name?.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-white text-sm truncate group-hover:text-indigo-400 transition-colors">
                            {user.name}
                          </p>
                          <p className="text-[11px] text-slate-500 truncate">
                            {user.email}
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] font-semibold text-slate-500 bg-slate-800/80 border border-slate-700/60 px-2.5 py-1 rounded-lg shrink-0 ml-3 group-hover:border-indigo-500/30 group-hover:text-indigo-300 transition-all">
                        {new Date(user.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="flex items-center justify-center h-32 text-slate-500 text-sm italic">
                    No recent users found
                  </div>
                )}
              </div>

              {stats.recentUsers?.length > 0 && (
                <button 
                  onClick={() => navigate("/admin/users")}
                  className="flex items-center justify-center gap-2 w-full py-3.5 text-[11px] font-bold text-slate-500 hover:text-indigo-400 uppercase tracking-widest transition-colors bg-slate-800/10 border-t border-slate-800/50 shrink-0 group"
                >
                  View All Users
                  <FiArrowRight className="text-xs group-hover:translate-x-0.5 transition-transform" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminDashboard;
