import { useState, useEffect } from "react";
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
} from "react-icons/fi";

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [onlineCount, setOnlineCount] = useState(0);

  useEffect(() => {
    fetchStats();

    const adminInfo = JSON.parse(localStorage.getItem("adminInfo") || "{}");
    const adminId =
      adminInfo.id ||
      adminInfo._id ||
      "admin_" + Math.random().toString(36).substr(2, 9);

    const socket = connectSocket({ userId: adminId, isAdmin: true });
    socket.on("onlineUsersCount", (count) => {
      setOnlineCount(count);
    });

    return () => {
      socket.off("onlineUsersCount");
    };
  }, []);

  const fetchStats = async () => {
    try {
      const response = await adminService.getDashboardStats();
      setStats(response.data);
    } catch (error) {
      toast.error("Failed to fetch statistics");
    } finally {
      setLoading(false);
    }
  };

  if (loading)
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-indigo-400">
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-indigo-500/10 border-t-indigo-500 rounded-full animate-spin"></div>
            <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-b-indigo-400/30 rounded-full animate-spin-slow"></div>
          </div>
          <div className="flex flex-col items-center">
            <p className="font-bold text-xl text-white tracking-tight animate-pulse mb-1">
              Lokonomy Admin
            </p>
            <p className="text-slate-500 text-sm font-medium">
              Preparing your workspace...
            </p>
          </div>
        </div>
      </div>
    );

  return (
    <AdminLayout>
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-10">
        <div className="relative overflow-hidden group">
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-2 text-white tracking-tight">
            Dashboard <span className="text-indigo-500">Overview</span>
          </h2>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
            <p className="text-slate-400 text-sm sm:text-base font-medium">
              Real-time platform performance analytics
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-5 py-2.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 backdrop-blur-md hidden sm:flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse ring-4 ring-emerald-500/20"></div>
            <span className="text-sm font-bold text-slate-200">
              System Secure
            </span>
          </div>
        </div>
      </header>

      {stats && (
        <div className="space-y-10">
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-6 gap-3 sm:gap-6">
            {[
              {
                label: "Total Revenue",
                value: `\u20B9${stats.stats.totalRevenue || 0}`,
                icon: FiDollarSign,
                color: "emerald",
                trend: "+12%",
                bg: "from-emerald-500/10 to-transparent",
              },
              {
                label: "Total Users",
                value: stats.stats.totalUsers,
                icon: FiUsers,
                color: "indigo",
                trend: "+5%",
                bg: "from-indigo-500/10 to-transparent",
              },
              {
                label: "Online Users",
                value: onlineCount,
                icon: FiActivity,
                color: "rose",
                trend: "Live",
                isLive: true,
                bg: "from-rose-500/10 to-transparent",
              },
              {
                label: "Businesses",
                value: stats.stats.totalBusinesses,
                icon: FiBriefcase,
                color: "sky",
                trend: "+8%",
                bg: "from-sky-500/10 to-transparent",
              },
              {
                label: "Products",
                value: stats.stats.totalProducts,
                icon: FiPackage,
                color: "orange",
                trend: "+15%",
                bg: "from-orange-500/10 to-transparent",
              },
              {
                label: "Job Postings",
                value: stats.stats.totalJobs,
                icon: FiClipboard,
                color: "purple",
                trend: "+2%",
                bg: "from-purple-500/10 to-transparent",
              },
            ].map((item, idx) => (
              <div
                key={idx}
                className="group relative overflow-hidden bg-slate-900/40 border border-slate-800 hover:border-indigo-500/50 p-4 sm:p-6 rounded-4xl transition-all duration-300 shadow-2xl hover:shadow-indigo-500/10 backdrop-blur-xl"
              >
                <div
                  className={`absolute -right-10 -bottom-10 w-32 h-32 bg-linear-to-br ${item.bg} blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
                ></div>

                {item.isLive && (
                  <div className="absolute top-4 right-4">
                    <span className="flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500 ring-2 ring-rose-500/20"></span>
                    </span>
                  </div>
                )}

                <div className="flex flex-col h-full justify-between gap-4">
                  <div className="flex justify-between items-start">
                    <div
                      className={`w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-${item.color}-500/10 border border-${item.color}-500/20 flex items-center justify-center group-hover:scale-110 transition-all duration-300 group-hover:shadow-[0_0_20px_rgba(var(--${item.color}-rgb),0.2)]`}
                    >
                      <item.icon
                        className={`text-xl sm:text-2xl text-${item.color}-500`}
                      />
                    </div>
                    {!item.isLive && (
                      <span className="text-[10px] font-black text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full flex items-center gap-1 uppercase tracking-tighter sm:tracking-normal">
                        <FiTrendingUp /> {item.trend}
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="text-slate-400 text-[11px] sm:text-sm font-bold uppercase tracking-widest mb-1 opacity-70 group-hover:opacity-100 transition-opacity">
                      {item.label}
                    </h3>
                    <p className="text-2xl sm:text-3xl font-black tracking-tight text-white group-hover:scale-[1.02] transition-transform origin-left">
                      {item.value}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 sm:gap-10">
            <div className="bg-slate-900/40 border border-slate-800 rounded-[2.5rem] p-6 sm:p-10 backdrop-blur-xl shadow-2xl relative overflow-hidden">
              <div className="absolute -top-24 -left-24 w-64 h-64 bg-indigo-500/5 blur-[100px] rounded-full"></div>

              <h3 className="text-xl sm:text-2xl font-black mb-10 flex items-center gap-4 relative">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 shadow-lg">
                  <FiActivity className="text-indigo-400 text-xl" />
                </div>
                Premium <span className="text-indigo-500">Analytics</span>
              </h3>

              <div className="space-y-10 relative">
                {["silver", "gold", "platinum"].map((plan) => (
                  <div key={plan} className="space-y-4 group">
                    <div className="flex justify-between items-end">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            plan === "silver"
                              ? "bg-slate-400"
                              : plan === "gold"
                                ? "bg-yellow-400"
                                : "bg-indigo-400"
                          }`}
                        ></div>
                        <div>
                          <span className="text-slate-500 uppercase text-[10px] font-black tracking-[0.2em] block mb-1">
                            {plan} Tier
                          </span>
                          <span className="font-black text-white text-xl sm:text-2xl tracking-tight">
                            \u20B9{stats.stats.revenueBreakdown?.[plan] || 0}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-black text-indigo-400 block">
                          {stats.stats.totalRevenue > 0
                            ? Math.round(
                                (stats.stats.revenueBreakdown?.[plan] /
                                  stats.stats.totalRevenue) *
                                  100,
                              )
                            : 0}
                          %
                        </span>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">
                          Contribution
                        </span>
                      </div>
                    </div>
                    <div className="h-4 w-full bg-slate-800/30 rounded-full overflow-hidden border border-slate-700/50 p-1 group-hover:border-indigo-500/30 transition-colors">
                      <div
                        className={`h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(0,0,0,0.5)] ${
                          plan === "silver"
                            ? "bg-slate-400/80"
                            : plan === "gold"
                              ? "bg-linear-to-r from-yellow-600 to-yellow-400"
                              : "bg-linear-to-r from-indigo-600 to-indigo-400"
                        }`}
                        style={{
                          width: `${stats.stats.totalRevenue > 0 ? (stats.stats.revenueBreakdown?.[plan] / stats.stats.totalRevenue) * 100 : 0}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-10">
              <div className="bg-slate-900/40 border border-slate-800 rounded-[2.5rem] overflow-hidden backdrop-blur-xl shadow-2xl flex flex-col h-full">
                <div className="p-8 border-b border-slate-800/50 bg-slate-800/20 flex items-center justify-between">
                  <h3 className="font-black text-xl flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                      <FiUsers className="text-emerald-400" />
                    </div>
                    Recent <span className="text-emerald-400">Joiners</span>
                  </h3>
                  <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 text-[10px] font-black rounded-full uppercase tracking-widest border border-emerald-500/20">
                    Active Now
                  </span>
                </div>
                <div className="flex-1 overflow-y-auto max-h-100 scrollbar-hide divide-y divide-slate-800/50">
                  {stats.recentUsers?.length > 0 ? (
                    stats.recentUsers.map((user) => (
                      <div
                        key={user._id}
                        className="p-6 flex items-center justify-between hover:bg-indigo-500/5 transition-all duration-300 group"
                      >
                        <div className="flex items-center gap-5">
                          <div className="w-12 h-12 rounded-[1.25rem] bg-slate-800 flex items-center justify-center text-indigo-400 font-black border border-slate-700 group-hover:scale-110 group-hover:bg-indigo-500 group-hover:text-white transition-all duration-300 shadow-inner overflow-hidden">
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
                          <div>
                            <p className="font-bold text-white group-hover:text-indigo-400 transition-colors text-lg">
                              {user.name}
                            </p>
                            <p className="text-xs text-slate-500 font-medium">
                              {user.email}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span className="text-[10px] bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-xl text-slate-400 font-bold group-hover:border-indigo-500/30 group-hover:text-indigo-300 transition-all">
                            {new Date(user.createdAt).toLocaleDateString(
                              "en-US",
                              { month: "short", day: "numeric" },
                            )}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-10 text-center text-slate-500 font-medium italic">
                      No recent users found
                    </div>
                  )}
                </div>
                {stats.recentUsers?.length > 0 && (
                  <button className="w-full py-4 text-center text-[10px] font-black text-slate-500 hover:text-indigo-400 uppercase tracking-[0.3em] transition-colors bg-slate-800/10 border-t border-slate-800/50">
                    View All Users
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminDashboard;
