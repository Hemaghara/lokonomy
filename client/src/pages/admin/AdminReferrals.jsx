import { useState, useEffect } from "react";
import { adminService } from "../../services/adminService";
import AdminLayout from "../../layouts/AdminLayout";
import {
  FiUsers,
  FiTrendingUp,
  FiAward,
  FiChevronLeft,
  FiChevronRight,
  FiActivity,
  FiCode,
  FiMail,
  FiCalendar,
  FiCpu,
} from "react-icons/fi";
import { toast } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

const getRankStyle = (i) => {
  if (i === 0)
    return "bg-gradient-to-br from-yellow-400 to-amber-600 text-white shadow-lg shadow-yellow-500/20 scale-110 rotate-3";
  if (i === 1)
    return "bg-gradient-to-br from-slate-200 to-slate-400 text-slate-900 shadow-lg shadow-slate-100/10 scale-105";
  if (i === 2)
    return "bg-gradient-to-br from-amber-600 to-amber-800 text-white shadow-lg shadow-amber-900/10";
  return "bg-slate-800/80 text-slate-400 border border-white/5";
};

const getRankBadge = (i) => {
  if (i === 0) return "bg-yellow-500 text-black";
  if (i === 1) return "bg-slate-300 text-black";
  if (i === 2) return "bg-amber-600 text-white";
  return "bg-slate-800 text-slate-500";
};

const STAT_CONFIG = [
  {
    label: "Active Referral Codes",
    icon: FiCode,
    glow: "bg-indigo-500/5 group-hover:bg-indigo-500/10",
    labelCls: "text-indigo-400/70",
    iconWrap: "bg-indigo-500/10 border-indigo-500/10 text-indigo-400",
  },
  {
    label: "Growth Impact (Referrals)",
    icon: FiActivity,
    glow: "bg-emerald-500/5 group-hover:bg-emerald-500/10",
    labelCls: "text-emerald-400/70",
    iconWrap: "bg-emerald-500/10 border-emerald-500/10 text-emerald-400",
  },
  {
    label: "Platform Conversion",
    icon: FiCpu,
    glow: "bg-amber-500/5 group-hover:bg-amber-500/10",
    labelCls: "text-amber-400/70",
    iconWrap: "bg-amber-500/10 border-amber-500/10 text-amber-400",
  },
];

const TABS = [
  { id: "all", icon: FiCode, label: "All Codes" },
  { id: "top", icon: FiTrendingUp, label: "Top Referrers" },
  { id: "leaderboard", icon: FiAward, label: "Leaderboard" },
];
const AdminReferrals = () => {
  const [activeTab, setActiveTab] = useState("all");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [totalReferralsMade, setTotalReferralsMade] = useState(0);

  const fetchData = async () => {
    setLoading(true);
    try {
      const limit = activeTab === "leaderboard" ? 6 : 10;
      const params = { page, limit };
      let res;

      if (activeTab === "all") {
        res = await adminService.getAllReferrals(params);
        setData(res.data.referrals);
        setTotalPages(res.data.pagination.pages);
        setTotalCount(res.data.pagination.total);
        setTotalReferralsMade(res.data.stats.totalReferralsMade);
      } else if (activeTab === "top") {
        res = await adminService.getTopReferrers();
        setData(res.data.topReferrers);
        setTotalPages(1);
      } else {
        res = await adminService.getReferralLeaderboard(params);
        setData(res.data.leaderboard);
        setTotalPages(res.data.pagination.pages);
      }
    } catch (err) {
      toast.error("Failed to fetch referral data");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab, page]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setPage(1);
  };

  const statValues = [
    totalCount,
    totalReferralsMade,
    `${Math.round((totalReferralsMade / (totalCount || 1)) * 100)}%`,
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
  };
  const itemVariants = {
    hidden: { y: 16, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.35 } },
  };

  const absIdx = (localIdx) =>
    (page - 1) * (activeTab === "leaderboard" ? 6 : 10) + localIdx;

  return (
    <AdminLayout>
      <div className="space-y-6 md:space-y-8 xl:space-y-10">
        <header className="flex flex-col gap-4 md:gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="space-y-2 min-w-0">
            <h1 className="flex flex-wrap items-center gap-3 text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight">
              <span className="inline-flex shrink-0 items-center justify-center p-3 sm:p-3.5 bg-indigo-600/10 rounded-2xl border border-indigo-500/20 shadow-lg shadow-indigo-500/5">
                <FiUsers className="text-indigo-500 text-base sm:text-lg" />
              </span>
              Referral&nbsp;
              <span className="text-indigo-500">Analytics</span>
            </h1>
            <p className="flex flex-wrap items-center gap-2 text-slate-400 text-xs sm:text-sm font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              Real-time community growth tracking &amp; leaderboard management
            </p>
          </div>

          <div className="flex bg-slate-900/60 p-1.5 rounded-2xl border border-white/5 backdrop-blur-xl shadow-xl w-full xl:w-auto shrink-0">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={[
                  "flex-1 xl:flex-none flex items-center justify-center gap-1.5 px-3 sm:px-5 py-2 sm:py-2.5",
                  "rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-widest",
                  "transition-all duration-300 whitespace-nowrap",
                  activeTab === tab.id
                    ? "bg-indigo-600 text-white shadow-[0_0_18px_rgba(79,70,229,0.4)] scale-[1.03]"
                    : "text-slate-500 hover:text-slate-200 hover:bg-white/5 active:scale-95",
                ].join(" ")}
              >
                <tab.icon size={13} className="shrink-0" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>
        </header>

        {activeTab === "all" && (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5"
          >
            {STAT_CONFIG.map((cfg, i) => (
              <motion.div
                key={i}
                variants={itemVariants}
                className="relative overflow-hidden group bg-slate-900/40 border border-white/5 p-5 sm:p-6 xl:p-8 rounded-3xl backdrop-blur-3xl hover:border-white/10 transition-all duration-500 shadow-2xl"
              >
                <div
                  className={[
                    "absolute top-0 right-0 w-28 h-28 blur-[70px] transition-all duration-500 rounded-full",
                    cfg.glow,
                  ].join(" ")}
                />
                <div className="relative z-10 flex items-start justify-between gap-4">
                  <div className="space-y-2 min-w-0">
                    <p
                      className={`text-[9px] sm:text-[10px] font-black uppercase tracking-[0.18em] truncate ${cfg.labelCls}`}
                    >
                      {cfg.label}
                    </p>
                    <p className="text-3xl sm:text-4xl font-black text-white tracking-tighter">
                      {statValues[i]}
                    </p>
                  </div>
                  <div
                    className={[
                      "shrink-0 p-3 sm:p-3.5 rounded-2xl border shadow-inner",
                      "group-hover:scale-110 group-hover:rotate-12 transition-all duration-500",
                      cfg.iconWrap,
                    ].join(" ")}
                  >
                    <cfg.icon size={20} />
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        <div className="bg-slate-900/40 border border-white/5 rounded-3xl overflow-hidden backdrop-blur-3xl shadow-2xl">
          {loading && (
            <div className="flex flex-col items-center justify-center gap-5 py-24 sm:py-32">
              <div className="relative w-16 h-16 sm:w-20 sm:h-20">
                <div className="absolute inset-0 border-[5px] sm:border-[6px] border-indigo-500/10 border-t-indigo-500 rounded-full animate-spin" />

                <div className="absolute inset-[18%] border-4 border-indigo-400/20 border-b-indigo-400 rounded-full animate-spin-slow" />
              </div>
              <p className="text-slate-500 text-[10px] sm:text-xs font-black uppercase tracking-[0.3em] animate-pulse">
                Synchronizing data…
              </p>
            </div>
          )}

          {!loading && data.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-6 sm:gap-8 py-20 sm:py-32 px-6 text-center">
              <div className="flex items-center justify-center w-24 h-24 sm:w-32 sm:h-32 bg-slate-800/20 rounded-3xl border border-white/5 shadow-inner text-slate-700 animate-bounce">
                <FiUsers size={44} />
              </div>
              <div className="space-y-3 max-w-sm">
                <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  System is Idle
                </h3>
                <p className="text-slate-500 text-sm font-medium leading-relaxed">
                  None of your users have initiated the referral program yet.
                  Insights will appear here once growth triggers.
                </p>
              </div>
            </div>
          )}

          {!loading && data.length > 0 && (
            <>
              <div className="hidden lg:block overflow-x-auto">
                <table
                  className="w-full text-left border-collapse"
                  style={{ minWidth: "640px" }}
                >
                  <thead>
                    <tr className="border-b border-white/5 bg-white/1.5">
                      {["Identity", "Referral Logic", "Growth Performance"].map(
                        (h, i) => (
                          <th
                            key={h}
                            className={[
                              "px-7 xl:px-10 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500",
                              i === 1 ? "text-center" : "",
                            ].join(" ")}
                          >
                            {h}
                          </th>
                        ),
                      )}
                      {activeTab === "leaderboard" && (
                        <th className="px-7 xl:px-10 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 text-right">
                          Rank
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/4">
                    <AnimatePresence mode="popLayout">
                      {data.map((item, idx) => (
                        <motion.tr
                          key={item._id}
                          variants={itemVariants}
                          initial="hidden"
                          animate="visible"
                          className="group hover:bg-white/2.5 transition-colors duration-200"
                        >
                          <td className="px-7 xl:px-10 py-6 xl:py-8">
                            <div className="flex items-center gap-4">
                              <div className="relative shrink-0">
                                <div className="w-11 h-11 xl:w-13 xl:h-13 bg-linear-to-br from-indigo-600 to-violet-600 rounded-2xl flex items-center justify-center text-white font-black text-lg xl:text-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                                  {item.name.charAt(0).toUpperCase()}
                                </div>
                                <span className="absolute -bottom-1 -right-1 w-4 h-4 xl:w-4.5 xl:h-4.5 bg-emerald-500 border-4 border-slate-900 rounded-full" />
                              </div>
                              <div className="min-w-0 space-y-1">
                                <p className="text-white font-black text-sm xl:text-base truncate max-w-40 xl:max-w-50">
                                  {item.name}
                                </p>
                                <div className="flex items-center gap-1.5 text-slate-500 text-[10px] xl:text-[11px] font-semibold">
                                  <FiMail
                                    size={10}
                                    className="text-indigo-400 shrink-0"
                                  />
                                  <span className="truncate max-w-32.5 xl:max-w-38.75">
                                    {item.email}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="px-7 xl:px-10 py-6 xl:py-8 text-center">
                            <span className="inline-block px-4 py-2 bg-slate-950 border border-white/5 text-indigo-400 font-mono text-xs font-black rounded-xl group-hover:border-indigo-500/40 transition-all duration-300 shadow-inner">
                              {item.referralCode}
                            </span>
                          </td>

                          <td className="px-7 xl:px-10 py-6 xl:py-8">
                            <div className="flex items-center gap-6 xl:gap-9">
                              <div className="space-y-1.5">
                                <span className="block text-[9px] xl:text-[10px] font-black text-slate-600 uppercase tracking-widest">
                                  Impact
                                </span>
                                <span className="flex items-baseline gap-1 text-white font-black text-xl xl:text-2xl leading-none">
                                  {item.referralRewards?.totalReferrals ?? 0}
                                  <span className="text-[10px] text-slate-600 font-bold uppercase tracking-tight">
                                    Nodes
                                  </span>
                                </span>
                              </div>
                              <div className="w-px h-10 xl:h-12 bg-white/6" />
                              <div className="space-y-1.5">
                                <span className="block text-[9px] xl:text-[10px] font-black text-slate-600 uppercase tracking-widest">
                                  Applied
                                </span>
                                <span className="flex items-baseline gap-0.5 text-emerald-400 font-black text-base xl:text-lg leading-none">
                                  {item.referralRewards?.appliedDays ?? 0}
                                  <span className="text-[10px] opacity-60">
                                    d
                                  </span>
                                </span>
                              </div>
                            </div>
                          </td>

                          {activeTab === "leaderboard" && (
                            <td className="px-7 xl:px-10 py-6 xl:py-8 text-right">
                              <div
                                className={`inline-flex items-center justify-center w-11 h-11 xl:w-12 xl:h-12 rounded-2xl font-black text-sm transition-all duration-300 ${getRankStyle(absIdx(idx))}`}
                              >
                                {absIdx(idx) + 1}
                              </div>
                            </td>
                          )}
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>

              <div className="hidden sm:grid lg:hidden grid-cols-2 gap-3 sm:gap-4 p-4 sm:p-5">
                <AnimatePresence mode="popLayout">
                  {data.map((item, idx) => (
                    <motion.div
                      key={item._id}
                      variants={itemVariants}
                      initial="hidden"
                      animate="visible"
                      className="bg-slate-900/60 border border-white/5 p-4 sm:p-5 rounded-2xl sm:rounded-3xl space-y-4 overflow-hidden"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 sm:w-11 sm:h-11 bg-linear-to-br from-indigo-600 to-violet-600 rounded-2xl flex items-center justify-center text-white font-black text-lg shrink-0 shadow-md">
                            {item.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0 space-y-0.5">
                            <p className="text-white font-black text-sm truncate">
                              {item.name}
                            </p>
                            <p className="text-slate-500 text-[10px] font-semibold truncate">
                              {item.email}
                            </p>
                          </div>
                        </div>
                        {activeTab === "leaderboard" && (
                          <div
                            className={`shrink-0 w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center font-black text-xs ${getRankBadge(absIdx(idx))}`}
                          >
                            {absIdx(idx) + 1}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between py-3 border-y border-white/6">
                        <span className="text-slate-500 text-[10px] font-black uppercase tracking-widest">
                          Code
                        </span>
                        <span className="text-indigo-400 font-mono font-black text-xs bg-slate-950 border border-white/5 px-3 py-1 rounded-lg">
                          {item.referralCode}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                        <div className="bg-white/3ded-xl sm:rounded-2xl p-3 space-y-1 border border-white/4">
                          <p className="text-slate-600 text-[9px] font-black uppercase tracking-widest">
                            Referrals
                          </p>
                          <p className="text-white font-black text-xl leading-none">
                            {item.referralRewards?.totalReferrals ?? 0}
                          </p>
                        </div>
                        <div className="bg-white/3 rounded-xl sm:rounded-2xl p-3 space-y-1 border border-white/4">
                          <p className="text-slate-600 text-[9px] font-black uppercase tracking-widest">
                            Applied
                          </p>
                          <p className="text-emerald-400 font-black text-xl leading-none">
                            {item.referralRewards?.appliedDays ?? 0}
                            <span className="text-[10px] opacity-60">d</span>
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              <div className="sm:hidden p-3 space-y-2.5">
                <AnimatePresence mode="popLayout">
                  {data.map((item, idx) => (
                    <motion.div
                      key={item._id}
                      variants={itemVariants}
                      initial="hidden"
                      animate="visible"
                      className="bg-slate-900/60 border border-white/5 p-4 rounded-2xl space-y-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 bg-linear-to-br from-indigo-600 to-violet-600 rounded-xl flex items-center justify-center text-white font-black text-base shrink-0 shadow-md">
                            {item.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-white font-black text-sm truncate">
                              {item.name}
                            </p>
                            <p className="text-slate-500 text-[10px] font-semibold truncate">
                              {item.email}
                            </p>
                          </div>
                        </div>
                        {activeTab === "leaderboard" && (
                          <div
                            className={`shrink-0 w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs ${getRankBadge(absIdx(idx))}`}
                          >
                            {absIdx(idx) + 1}
                          </div>
                        )}
                      </div>

                      <div className="space-y-2 py-3 border-y border-white/6">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500 text-[10px] font-black uppercase tracking-widest">
                            Code
                          </span>
                          <span className="text-indigo-400 font-mono font-black text-[11px] bg-slate-950 border border-white/5 px-2.5 py-1 rounded-lg">
                            {item.referralCode}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500 text-[10px] font-black uppercase tracking-widest">
                            Total Usage
                          </span>
                          <span className="text-white font-black text-sm">
                            {item.referralRewards?.totalReferrals ?? 0} Users
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-slate-500 text-[10px] font-black uppercase tracking-widest">
                          <FiCalendar size={10} className="text-indigo-500" />
                          {new Date(
                            item.createdAt || Date.now(),
                          ).toLocaleDateString()}
                        </div>
                        <span className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/10 text-emerald-400 text-[10px] font-black rounded-lg">
                          {item.referralRewards?.appliedDays ?? 0}d Applied
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </>
          )}

          {!loading && totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 sm:px-7 lg:px-10 py-5 sm:py-6 lg:py-7 border-t border-white/6 bg-white/[0.008]">
              <div className="flex items-center gap-2.5">
                <span className="text-[9px] sm:text-[10px] font-black text-slate-500 uppercase tracking-[0.28em]">
                  Trajectory
                </span>
                <span className="px-3 py-1 bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 rounded-full text-[9px] sm:text-[10px] font-black whitespace-nowrap">
                  {page} / {totalPages}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="p-2.5 sm:p-3 bg-slate-950 border border-white/5 text-slate-400 hover:text-white hover:border-indigo-500/40 disabled:opacity-30 disabled:cursor-not-allowed rounded-xl transition-all duration-300 active:scale-90"
                >
                  <FiChevronLeft size={17} />
                </button>

                <div className="flex gap-1.5">
                  {Array.from({ length: Math.min(3, totalPages) }, (_, i) => {
                    const num =
                      totalPages > 3 && page > 2 ? page - 1 + i : i + 1;
                    if (num > totalPages) return null;
                    return (
                      <button
                        key={num}
                        onClick={() => setPage(num)}
                        className={[
                          "w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl text-xs font-black transition-all duration-300",
                          page === num
                            ? "bg-indigo-600 text-white shadow-[0_0_16px_rgba(79,70,229,0.35)] scale-110"
                            : "bg-slate-950 text-slate-500 hover:text-white border border-white/5 hover:border-white/10",
                        ].join(" ")}
                      >
                        {num}
                      </button>
                    );
                  })}
                </div>

                <button
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="p-2.5 sm:p-3 bg-slate-950 border border-white/5 text-slate-400 hover:text-white hover:border-indigo-500/40 disabled:opacity-30 disabled:cursor-not-allowed rounded-xl transition-all duration-300 active:scale-90"
                >
                  <FiChevronRight size={17} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminReferrals;
