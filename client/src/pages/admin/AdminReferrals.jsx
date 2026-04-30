import { useState, useEffect } from "react";
import { adminService } from "../../services";
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
    return "bg-gradient-to-br from-yellow-400 to-amber-500 text-black shadow-lg shadow-yellow-500/30";
  if (i === 1)
    return "bg-gradient-to-br from-slate-300 to-slate-400 text-slate-900 shadow-lg";
  if (i === 2)
    return "bg-gradient-to-br from-amber-600 to-amber-700 text-white shadow-lg shadow-amber-700/20";
  return "bg-slate-800 text-slate-400 border border-white/5";
};

const getRankBadge = (i) => {
  if (i === 0) return "bg-yellow-400 text-black";
  if (i === 1) return "bg-slate-300 text-black";
  if (i === 2) return "bg-amber-600 text-white";
  return "bg-slate-800 text-slate-400";
};

const STAT_CONFIG = [
  {
    label: "Active Referral Codes",
    icon: FiCode,
    accent: "indigo",
    gradient: "from-indigo-500/20 to-indigo-600/5",
    border: "border-indigo-500/20",
    iconBg: "bg-indigo-500/15 text-indigo-400",
    valueCls: "text-indigo-300",
  },
  {
    label: "Growth Impact",
    icon: FiActivity,
    accent: "emerald",
    gradient: "from-emerald-500/20 to-emerald-600/5",
    border: "border-emerald-500/20",
    iconBg: "bg-emerald-500/15 text-emerald-400",
    valueCls: "text-emerald-300",
  },
  {
    label: "Platform Conversion",
    icon: FiCpu,
    accent: "violet",
    gradient: "from-violet-500/20 to-violet-600/5",
    border: "border-violet-500/20",
    iconBg: "bg-violet-500/15 text-violet-400",
    valueCls: "text-violet-300",
  },
];

const TABS = [
  { id: "all", icon: FiCode, label: "All Codes" },
  { id: "top", icon: FiTrendingUp, label: "Top Referrers" },
  { id: "leaderboard", icon: FiAward, label: "Leaderboard" },
];

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.32, delay: i * 0.06, ease: "easeOut" },
  }),
};

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

  const absIdx = (localIdx) =>
    (page - 1) * (activeTab === "leaderboard" ? 6 : 10) + localIdx;

  return (
    <AdminLayout>
      <div className="min-h-screen px-3 py-4 sm:px-5 sm:py-6 lg:px-8 lg:py-8 space-y-5 sm:space-y-6 lg:space-y-8">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <div className="flex items-center gap-3 mb-1.5">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-indigo-600/15 border border-indigo-500/25 flex items-center justify-center shrink-0">
                <FiUsers className="text-indigo-400 text-base sm:text-lg" />
              </div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-white tracking-tight leading-none">
                Referral <span className="text-indigo-400">Analytics</span>
              </h1>
            </div>
          </div>

          <div className="flex bg-slate-900 border border-white/8 rounded-xl p-1 gap-1 w-full sm:w-auto">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={[
                  "flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg",
                  "text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all duration-200",
                  activeTab === tab.id
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                    : "text-slate-500 hover:text-slate-300 hover:bg-white/5",
                ].join(" ")}
              >
                <tab.icon size={12} className="shrink-0" />
                <span className="hidden xs:inline sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>
        </motion.div>

        {activeTab === "all" && (
          <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
            {STAT_CONFIG.map((cfg, i) => (
              <motion.div
                key={i}
                custom={i}
                initial="hidden"
                animate="visible"
                variants={fadeUp}
                className={[
                  "relative overflow-hidden rounded-2xl p-3.5 sm:p-5 lg:p-6",
                  "bg-linear-to-br border",
                  cfg.gradient,
                  cfg.border,
                  "backdrop-blur-xl",
                ].join(" ")}
              >
                <div
                  className={`w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl flex items-center justify-center mb-2.5 sm:mb-3 ${cfg.iconBg}`}
                >
                  <cfg.icon size={14} className="sm:w-4 sm:h-4" />
                </div>
                <p className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 leading-tight line-clamp-2">
                  {cfg.label}
                </p>
                <p
                  className={`text-xl sm:text-2xl lg:text-3xl font-black tracking-tight ${cfg.valueCls}`}
                >
                  {statValues[i]}
                </p>
              </motion.div>
            ))}
          </div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.15 }}
          className="bg-slate-900/60 border border-white/8 rounded-2xl overflow-hidden backdrop-blur-xl"
        >
          {loading && (
            <div className="flex flex-col items-center justify-center gap-4 py-24 sm:py-32">
              <div className="relative w-12 h-12 sm:w-16 sm:h-16">
                <div className="absolute inset-0 border-[3px] sm:border-4 border-indigo-500/15 border-t-indigo-500 rounded-full animate-spin" />
                <div
                  className="absolute inset-[20%] border-2 border-indigo-400/20 border-b-indigo-400 rounded-full animate-spin"
                  style={{
                    animationDuration: "0.8s",
                    animationDirection: "reverse",
                  }}
                />
              </div>
              <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.3em] animate-pulse">
                Syncing data…
              </p>
            </div>
          )}

          {!loading && data.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-5 py-20 sm:py-28 px-6 text-center">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-800/60 rounded-2xl border border-white/6 flex items-center justify-center text-slate-600">
                <FiUsers size={32} />
              </div>
              <div className="space-y-2 max-w-xs">
                <h3 className="text-lg sm:text-xl font-bold text-white">
                  No Data Yet
                </h3>
                <p className="text-slate-500 text-sm leading-relaxed">
                  No users have initiated the referral program. Insights appear
                  once growth triggers.
                </p>
              </div>
            </div>
          )}

          {!loading && data.length > 0 && (
            <>
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full text-left" style={{ minWidth: 620 }}>
                  <thead>
                    <tr className="border-b border-white/6">
                      {["User", "Referral Code", "Performance"].map((h, i) => (
                        <th
                          key={h}
                          className={[
                            "px-6 xl:px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500",
                            i === 1 ? "text-center" : "",
                          ].join(" ")}
                        >
                          {h}
                        </th>
                      ))}
                      {activeTab === "leaderboard" && (
                        <th className="px-6 xl:px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500 text-right">
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
                          custom={idx}
                          variants={fadeUp}
                          initial="hidden"
                          animate="visible"
                          className="group hover:bg-white/2.5 transition-colors duration-150"
                        >
                          <td className="px-6 xl:px-8 py-5">
                            <div className="flex items-center gap-3.5">
                              <div className="relative shrink-0">
                                <div className="w-10 h-10 xl:w-11 xl:h-11 bg-linear-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center text-white font-black text-base xl:text-lg shadow-md group-hover:scale-105 transition-transform duration-200">
                                  {item.name.charAt(0).toUpperCase()}
                                </div>
                                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-slate-900 rounded-full" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-white font-bold text-sm truncate max-w-44">
                                  {item.name}
                                </p>
                                <div className="flex items-center gap-1 mt-0.5">
                                  <FiMail
                                    size={9}
                                    className="text-indigo-400 shrink-0"
                                  />
                                  <span className="text-slate-500 text-[10px] truncate max-w-36">
                                    {item.email}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="px-6 xl:px-8 py-5 text-center">
                            <span className="inline-block px-3.5 py-1.5 bg-slate-950 border border-white/6 text-indigo-400 font-mono text-xs font-bold rounded-lg group-hover:border-indigo-500/30 transition-colors duration-200">
                              {item.referralCode}
                            </span>
                          </td>

                          <td className="px-6 xl:px-8 py-5">
                            <div className="flex items-center gap-5 xl:gap-7">
                              <div>
                                <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">
                                  Referrals
                                </p>
                                <p className="text-white font-black text-xl leading-none">
                                  {item.referralRewards?.totalReferrals ?? 0}
                                  <span className="text-[10px] text-slate-600 font-semibold ml-1">
                                    users
                                  </span>
                                </p>
                              </div>
                              <div className="w-px h-8 bg-white/8" />
                              <div>
                                <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">
                                  Applied
                                </p>
                                <p className="text-emerald-400 font-black text-lg leading-none">
                                  {item.referralRewards?.appliedDays ?? 0}
                                  <span className="text-[10px] opacity-60">
                                    d
                                  </span>
                                </p>
                              </div>
                            </div>
                          </td>

                          {activeTab === "leaderboard" && (
                            <td className="px-6 xl:px-8 py-5 text-right">
                              <div
                                className={`inline-flex items-center justify-center w-10 h-10 rounded-xl font-black text-sm ${getRankStyle(absIdx(idx))}`}
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

              <div className="hidden sm:grid lg:hidden grid-cols-2 gap-3 p-4">
                <AnimatePresence mode="popLayout">
                  {data.map((item, idx) => (
                    <motion.div
                      key={item._id}
                      custom={idx}
                      variants={fadeUp}
                      initial="hidden"
                      animate="visible"
                      className="bg-slate-800/40 border border-white/6 rounded-xl p-4 space-y-3.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-10 h-10 shrink-0 bg-linear-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center text-white font-black text-base shadow-md">
                            {item.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-white font-bold text-sm truncate">
                              {item.name}
                            </p>
                            <p className="text-slate-500 text-[10px] truncate">
                              {item.email}
                            </p>
                          </div>
                        </div>
                        {activeTab === "leaderboard" && (
                          <div
                            className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs ${getRankBadge(absIdx(idx))}`}
                          >
                            {absIdx(idx) + 1}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between py-2.5 border-y border-white/6">
                        <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">
                          Code
                        </span>
                        <span className="text-indigo-400 font-mono font-bold text-xs bg-slate-950 border border-white/6 px-2.5 py-1 rounded-lg">
                          {item.referralCode}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-white/4 rounded-lg p-2.5 space-y-1">
                          <p className="text-slate-600 text-[9px] font-black uppercase tracking-widest">
                            Referrals
                          </p>
                          <p className="text-white font-black text-lg leading-none">
                            {item.referralRewards?.totalReferrals ?? 0}
                          </p>
                        </div>
                        <div className="bg-white/4 rounded-lg p-2.5 space-y-1">
                          <p className="text-slate-600 text-[9px] font-black uppercase tracking-widest">
                            Applied
                          </p>
                          <p className="text-emerald-400 font-black text-lg leading-none">
                            {item.referralRewards?.appliedDays ?? 0}
                            <span className="text-[10px] opacity-60">d</span>
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              <div className="sm:hidden divide-y divide-white/5">
                <AnimatePresence mode="popLayout">
                  {data.map((item, idx) => (
                    <motion.div
                      key={item._id}
                      custom={idx}
                      variants={fadeUp}
                      initial="hidden"
                      animate="visible"
                      className="p-4 space-y-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-9 h-9 shrink-0 bg-linear-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center text-white font-black text-sm shadow-md">
                            {item.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-white font-bold text-sm leading-tight truncate">
                              {item.name}
                            </p>
                            <p className="text-slate-500 text-[10px] truncate">
                              {item.email}
                            </p>
                          </div>
                        </div>
                        {activeTab === "leaderboard" && (
                          <div
                            className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs ${getRankBadge(absIdx(idx))}`}
                          >
                            {absIdx(idx) + 1}
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="bg-slate-800/60 rounded-lg py-2 px-1">
                          <p className="text-slate-600 text-[8px] font-black uppercase tracking-widest mb-0.5">
                            Code
                          </p>
                          <p className="text-indigo-400 font-mono font-bold text-[11px] truncate">
                            {item.referralCode}
                          </p>
                        </div>
                        <div className="bg-slate-800/60 rounded-lg py-2 px-1">
                          <p className="text-slate-600 text-[8px] font-black uppercase tracking-widest mb-0.5">
                            Users
                          </p>
                          <p className="text-white font-black text-base leading-none">
                            {item.referralRewards?.totalReferrals ?? 0}
                          </p>
                        </div>
                        <div className="bg-slate-800/60 rounded-lg py-2 px-1">
                          <p className="text-slate-600 text-[8px] font-black uppercase tracking-widest mb-0.5">
                            Applied
                          </p>
                          <p className="text-emerald-400 font-black text-base leading-none">
                            {item.referralRewards?.appliedDays ?? 0}
                            <span className="text-[9px] opacity-60">d</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 text-slate-600 text-[10px]">
                        <FiCalendar
                          size={9}
                          className="text-indigo-500 shrink-0"
                        />
                        <span>
                          {new Date(
                            item.createdAt || Date.now(),
                          ).toLocaleDateString()}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </>
          )}

          {!loading && totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 sm:px-6 lg:px-8 py-4 sm:py-5 border-t border-white/6 bg-white/1">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                Page <span className="text-indigo-400">{page}</span> of{" "}
                <span className="text-slate-400">{totalPages}</span>
              </p>

              <div className="flex items-center gap-1.5">
                <button
                  disabled={page === 1}
                  aria-label="Previous page"
                  onClick={() => setPage((p) => p - 1)}
                  className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center bg-slate-900 border border-white/8 text-slate-400 hover:text-white hover:border-indigo-500/30 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg transition-all duration-200 active:scale-90"
                >
                  <FiChevronLeft size={15} />
                </button>

                {Array.from({ length: Math.min(3, totalPages) }, (_, i) => {
                  const num = totalPages > 3 && page > 2 ? page - 1 + i : i + 1;
                  if (num > totalPages) return null;
                  return (
                    <button
                      key={num}
                      onClick={() => setPage(num)}
                      className={[
                        "w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-lg text-xs font-black transition-all duration-200",
                        page === num
                          ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/25"
                          : "bg-slate-900 text-slate-500 hover:text-white border border-white/8 hover:border-white/12",
                      ].join(" ")}
                    >
                      {num}
                    </button>
                  );
                })}

                <button
                  disabled={page === totalPages}
                  aria-label="Next page"
                  onClick={() => setPage((p) => p + 1)}
                  className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center bg-slate-900 border border-white/8 text-slate-400 hover:text-white hover:border-indigo-500/30 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg transition-all duration-200 active:scale-90"
                >
                  <FiChevronRight size={15} />
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AdminLayout>
  );
};

export default AdminReferrals;
