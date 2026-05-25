import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { adminService } from "../../services";
import { connectSocket } from "../../services/socket";
import { motion } from "framer-motion";
import AdminLayout from "../../layouts/AdminLayout";

import {
  AreaChart,
  Area,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
} from "recharts";
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
  FiShield,
  FiMessageSquare,
  FiClock,
  FiCheckCircle,
  FiShoppingBag,
} from "react-icons/fi";

const STAT_COLORS = {
  emerald: {
    icon: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
    glow: "hover:shadow-emerald-500/20",
    ring: "hover:border-emerald-500/40",
    badge: "bg-emerald-500/10 text-emerald-400",
    chart: "#10b981",
  },
  indigo: {
    icon: "bg-indigo-500/10 border-indigo-500/20 text-indigo-400",
    glow: "hover:shadow-indigo-500/20",
    ring: "hover:border-indigo-500/40",
    badge: "bg-indigo-500/10 text-indigo-400",
    chart: "#6366f1",
  },
  rose: {
    icon: "bg-rose-500/10 border-rose-500/20 text-rose-400",
    glow: "hover:shadow-rose-500/10",
    ring: "hover:border-rose-500/40",
    badge: "bg-rose-500/10 text-rose-400",
    chart: "#f43f5e",
  },
  sky: {
    icon: "bg-sky-500/10 border-sky-500/20 text-sky-400",
    glow: "hover:shadow-sky-500/20",
    ring: "hover:border-sky-500/40",
    badge: "bg-sky-500/10 text-sky-400",
    chart: "#0ea5e9",
  },
  orange: {
    icon: "bg-orange-500/10 border-orange-500/20 text-orange-400",
    glow: "hover:shadow-orange-500/20",
    ring: "hover:border-orange-500/40",
    badge: "bg-orange-500/10 text-orange-400",
    chart: "#f97316",
  },
  purple: {
    icon: "bg-purple-500/10 border-purple-500/20 text-purple-400",
    glow: "hover:shadow-purple-500/20",
    ring: "hover:border-purple-500/40",
    badge: "bg-purple-500/10 text-purple-400",
    chart: "#a855f7",
  },
  amber: {
    icon: "bg-amber-500/10 border-amber-500/20 text-amber-400",
    glow: "hover:shadow-amber-500/20",
    ring: "hover:border-amber-500/40",
    badge: "bg-amber-500/10 text-amber-400",
    chart: "#f59e0b",
  },
};

const MiniChart = ({ data, color, height = 40 }) => {
  const chartData = data.map((val, i) => ({ val, i }));
  const gradId = `grad-${color.replace("#", "")}`;
  return (
    <div style={{ width: "80px", height: `${height}px` }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="val"
            stroke={color}
            strokeWidth={2}
            fill={`url(#${gradId})`}
            isAnimationActive={true}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

const StatCard = ({ item }) => {
  const navigate = useNavigate();
  const color = STAT_COLORS[item.color] || STAT_COLORS.indigo;

  return (
    <div
      data-testid={`stat-card-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
      onClick={() => item.path && navigate(item.path)}
      className={`group relative flex flex-col justify-between gap-4 bg-slate-900/60 border border-slate-800/80 ${color.ring} p-5 rounded-3xl transition-all duration-500 shadow-xl ${color.glow} backdrop-blur-md overflow-hidden ${item.path ? "cursor-pointer active:scale-95" : ""}`}
    >
      <div className="absolute -bottom-10 -right-10 w-32 h-32 rounded-full bg-white/5 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

      <div className="flex items-start justify-between relative z-10">
        <div
          className={`w-12 h-12 rounded-2xl border flex items-center justify-center shrink-0 transition-all duration-500 group-hover:rotate-6 group-hover:scale-110 ${color.icon}`}
        >
          <item.icon className="text-xl" />
        </div>

        {item.isLive ? (
          <span className="flex items-center gap-1.5 px-2.5 py-1 bg-rose-500/10 border border-rose-500/20 rounded-full text-[10px] font-black uppercase tracking-widest text-rose-400">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500" />
            </span>
            Live
          </span>
        ) : (
          <span
            className={`flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full border border-current/10 ${color.badge}`}
          >
            <FiTrendingUp className="text-xs" />
            {item.trend}
          </span>
        )}
      </div>

      <div className="relative z-10">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-1">
              {item.label}
            </p>
            <p 
              data-testid="stat-value"
              className="text-3xl font-black tracking-tight text-white leading-none"
            >
              {item.value}
            </p>
          </div>
          {item.trendData && (
            <MiniChart data={item.trendData} color={color.chart} />
          )}
        </div>
      </div>
    </div>
  );
};

const REVENUE_PLAN_CONFIG = {
  silver: {
    dot: "bg-slate-400",
    bar: "bg-gradient-to-r from-slate-500 to-slate-200",
    label: "text-slate-300",
  },
  gold: {
    dot: "bg-yellow-400",
    bar: "bg-gradient-to-r from-yellow-600 to-yellow-300",
    label: "text-yellow-300",
  },
  platinum: {
    dot: "bg-indigo-400",
    bar: "bg-gradient-to-r from-indigo-600 to-indigo-300",
    label: "text-indigo-300",
  },
};

const RevenueBar = ({ plan, value, total }) => {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  const config =
    REVENUE_PLAN_CONFIG[plan.toLowerCase()] || REVENUE_PLAN_CONFIG.silver;

  return (
    <div className="space-y-3 group">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`w-2.5 h-2.5 rounded-full shadow-[0_0_8px_rgba(255,255,255,0.2)] ${config.dot}`}
          />
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
              {plan} Tier
            </p>
            <p className={`text-xl font-black tracking-tight ${config.label}`}>
              ₹{(value || 0).toLocaleString()}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-lg font-black text-white">{pct}%</p>
          <p className="text-[10px] font-bold text-slate-600 uppercase tracking-tighter">
            Market Share
          </p>
        </div>
      </div>
      <div className="h-2.5 w-full bg-slate-800/40 rounded-full overflow-hidden border border-white/5">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className={`h-full rounded-full ${config.bar}`}
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
  const [activities, setActivities] = useState([]);
  const [dateRange, setDateRange] = useState({
    startDate: "",
    endDate: "",
  });

  const fetchStats = useCallback(async (range = {}) => {
    try {
      const { startDate, endDate } = range;
      const params = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const response = await adminService.getDashboardStats(params);
      setStats(response.data);

      const mixedActivities = [];

      if (response.data.recentUsers) {
        response.data.recentUsers.forEach((u) => {
          mixedActivities.push({
            id: `user-${u._id}`,
            type: "registration",
            user: u.name,
            time: u.createdAt,
            message: "signed up to Lokonomy",
            icon: <FiUsers className="text-indigo-400" />,
          });
        });
      }

      if (response.data.recentBusinesses) {
        response.data.recentBusinesses.forEach((b) => {
          mixedActivities.push({
            id: `biz-${b._id}`,
            type: "business",
            user: b.businessName,
            time: b.createdAt,
            message: "registered a new business",
            icon: <FiBriefcase className="text-sky-400" />,
          });
        });
      }

      mixedActivities.sort((a, b) => new Date(b.time) - new Date(a.time));
      setActivities(mixedActivities.slice(0, 10));
    } catch {
      toast.error("Failed to fetch statistics");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOnlineTrend();

    const adminInfo = JSON.parse(localStorage.getItem("adminInfo") || "{}");
    const adminId =
      adminInfo.id ||
      adminInfo._id ||
      "admin_" + Math.random().toString(36).substr(2, 9);

    const socket = connectSocket({ userId: adminId, isAdmin: true });
    socket.on("onlineUsersCount", (count) => setOnlineCount(count));
    socket.on("newActivity", (activity) => {
      setActivities((prev) => [activity, ...prev].slice(0, 10));
    });

    return () => {
      socket.off("onlineUsersCount");
      socket.off("newActivity");
    };
  }, []);

  useEffect(() => {
    fetchStats(dateRange);
  }, [dateRange, fetchStats]);

  const handleDateChange = (e) => {
    const { name, value } = e.target;
    const newRange = { ...dateRange, [name]: value };
    setDateRange(newRange);
  };

  const clearDateRange = () => {
    const cleared = { startDate: "", endDate: "" };
    setDateRange(cleared);
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
            <p className="text-slate-500 text-sm mt-0.5 uppercase tracking-widest font-bold">
              Preparing environment…
            </p>
          </div>
        </div>
      </div>
    );

  const statItems = [
    {
      label: "Total Revenue",
      value: `₹${(stats?.stats.totalRevenue || 0).toLocaleString()}`,
      icon: FiDollarSign,
      color: "emerald",
      trend: stats?.stats.trends?.revenue || "+0%",
      path: "/admin/subscriptions",
    },
    {
      label: "Total Users",
      value: stats?.stats.totalUsers?.toLocaleString(),
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
      trendData:
        onlineTrend.length > 0
          ? onlineTrend
          : [onlineCount * 0.8, onlineCount * 0.9, onlineCount],
    },
    {
      label: "Businesses",
      value: stats?.stats.totalBusinesses?.toLocaleString(),
      icon: FiBriefcase,
      color: "sky",
      trend: stats?.stats.trends?.businesses || "+0%",
      path: "/admin/businesses",
    },
    {
      label: "Products",
      value: stats?.stats.totalProducts?.toLocaleString(),
      icon: FiPackage,
      color: "orange",
      trend: stats?.stats.trends?.products || "+0%",
      path: "/admin/marketplace",
    },
    {
      label: "Job Postings",
      value: stats?.stats.totalJobs?.toLocaleString(),
      icon: FiClipboard,
      color: "purple",
      trend: stats?.stats.trends?.jobs || "+0%",
      path: "/admin/jobs",
    },
  ];

  return (
    <AdminLayout>
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10">
        <div>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tighter leading-none">
            Dashboard <span className="text-indigo-500 italic">Overview</span>
          </h2>
          
        </div>

        <div className="flex items-center gap-2 bg-slate-900/60 border border-slate-800/80 rounded-2xl px-4 py-2.5 backdrop-blur-md">
          <FiCalendar size={14} className="text-indigo-400 shrink-0" />
          <input
            type="date"
            name="startDate"
            value={dateRange.startDate}
            onChange={handleDateChange}
            className="bg-transparent text-xs text-slate-300 outline-none font-bold w-28 scheme-dark"
            title="Start date"
          />
          <span className="text-slate-600 text-xs font-bold">→</span>
          <input
            type="date"
            name="endDate"
            value={dateRange.endDate}
            onChange={handleDateChange}
            className="bg-transparent text-xs text-slate-300 outline-none font-bold w-28 scheme-dark"
            title="End date"
          />
          {(dateRange.startDate || dateRange.endDate) && (
            <button
              onClick={clearDateRange}
              className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
              title="Clear date range"
            >
              <FiX size={14} />
            </button>
          )}
        </div>
      </header>

      {stats && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-5">
            {statItems.map((item, i) => (
              <StatCard key={i} item={item} />
            ))}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            <div className="xl:col-span-1 bg-slate-900/60 border border-slate-800/80 rounded-4xl p-7 backdrop-blur-md shadow-2xl relative overflow-hidden">
              <div className="absolute -top-20 -left-20 w-64 h-64 bg-indigo-600/10 blur-[100px] rounded-full pointer-events-none" />

              <div className="flex items-center gap-4 mb-10 relative">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0 shadow-inner">
                  <FiDollarSign className="text-indigo-400 text-xl" />
                </div>
                <h3 className="text-xl font-black text-white tracking-tight">
                  Premium <span className="text-indigo-500">Analytics</span>
                </h3>
              </div>

              <div className="space-y-8 relative">
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

            <div className="xl:col-span-1 bg-slate-900/60 border border-slate-800/80 rounded-4xl overflow-hidden backdrop-blur-md shadow-2xl flex flex-col">
              <div className="flex items-center justify-between px-7 py-5 border-b border-white/5 bg-white/2">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                    <FiUsers className="text-emerald-400 text-lg" />
                  </div>
                  <h3 className="font-black text-lg text-white tracking-tight">
                    Recent <span className="text-emerald-400">Joiners</span>
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 text-[9px] font-black rounded-full uppercase tracking-[0.15em] border border-emerald-500/20">
                    Growth
                  </span>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto max-h-80 divide-y divide-white/5 scrollbar-hide">
                {stats.recentUsers?.length > 0 ? (
                  stats.recentUsers.map((user) => (
                    <div
                      key={user._id}
                      className="flex items-center justify-between px-7 py-4 hover:bg-white/3 transition-all duration-300 group cursor-default"
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="w-11 h-11 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-indigo-400 font-black text-base shrink-0 overflow-hidden group-hover:border-indigo-500 transition-all duration-300">
                          {user.profilePic ? (
                            <img
                              src={user.profilePic}
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
                          <p className="text-[11px] text-slate-500 truncate mt-0.5">
                            {user.email}
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] font-black text-slate-500 bg-slate-800/80 border border-slate-700/60 px-3 py-1.5 rounded-xl shrink-0 group-hover:border-indigo-500/30 transition-all uppercase tracking-tighter">
                        {new Date(user.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="flex items-center justify-center h-40 text-slate-500 text-sm italic">
                    No recent users found
                  </div>
                )}
              </div>

              <button
                onClick={() => navigate("/admin/users")}
                className="flex items-center justify-center gap-3 w-full py-4 text-[10px] font-black text-slate-500 hover:text-indigo-400 uppercase tracking-[0.2em] transition-all bg-white/2 border-t border-white/5 group"
              >
                Expansion Details
                <FiArrowRight className="text-sm group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            <div className="xl:col-span-1 bg-slate-900/60 border border-slate-800/80 rounded-4xl overflow-hidden backdrop-blur-md shadow-2xl flex flex-col">
              <div className="flex items-center justify-between px-7 py-5 border-b border-white/5 bg-white/2">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                    <FiActivity className="text-rose-400 text-lg" />
                  </div>
                  <h3 className="font-black text-lg text-white tracking-tight">
                    Live <span className="text-rose-400">Activity</span>
                  </h3>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                  <span className="text-[9px] font-black text-rose-400 uppercase tracking-widest">
                    Feed
                  </span>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto max-h-80 divide-y divide-white/5 scrollbar-hide">
                {activities.length > 0 ? (
                  activities.map((act) => (
                    <div
                      key={act.id}
                      className="px-7 py-4 hover:bg-white/3 transition-all group"
                    >
                      <div className="flex gap-4">
                        <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center shrink-0 group-hover:bg-slate-700 transition-colors">
                          {act.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] text-white">
                            <span className="font-bold text-indigo-400">
                              {act.user}
                            </span>{" "}
                            {act.message}
                          </p>
                          <div className="flex items-center gap-1.5 mt-1.5 text-slate-500">
                            <FiClock size={10} />
                            <span className="text-[10px] font-bold uppercase tracking-tighter">
                              {new Date(act.time).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center h-48 text-center px-6">
                    <FiActivity className="text-slate-800 text-4xl mb-3" />
                    <p className="text-slate-600 text-xs font-bold uppercase tracking-widest">
                      Waiting for activities...
                    </p>
                  </div>
                )}
              </div>

              <div className="p-4 bg-white/2 border-t border-white/5 text-center">
                <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.25em]">
                  End of feed
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminDashboard;
