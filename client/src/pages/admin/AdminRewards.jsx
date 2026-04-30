import { useState, useEffect, useCallback } from "react";
import { adminService } from "../../services";
import AdminLayout from "../../layouts/AdminLayout";
import {
  FiGift,
  FiStar,
  FiEdit2,
  FiCheck,
  FiX,
  FiChevronLeft,
  FiChevronRight,
  FiUsers,
  FiTrendingUp,
  FiTrendingDown,
  FiActivity,
  FiClock,
  FiSearch,
} from "react-icons/fi";
import { toast } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

const fmtNum = (n) => Number(n || 0).toLocaleString();
const StatCard = ({ icon: Icon, label, value, color, sub }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    className={`bg-slate-900/40 border border-slate-800/60 rounded-2xl p-4 sm:p-5 flex flex-col gap-3 hover:border-${color}-500/30 transition-all duration-300 group shadow-lg overflow-hidden relative`}
  >
    <div
      className={`absolute top-0 right-0 w-16 h-16 bg-${color}-500/5 blur-2xl -mr-8 -mt-8 rounded-full`}
    />
    <div className="flex items-center justify-between relative z-10">
      <span
        className={`p-2.5 bg-${color}-500/10 rounded-xl border border-${color}-500/20 group-hover:bg-${color}-500/20 transition-colors`}
      >
        <Icon className={`text-${color}-400`} size={18} />
      </span>
      {sub && (
        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest bg-slate-900/80 px-2 py-0.5 rounded-lg border border-slate-800">
          {sub}
        </span>
      )}
    </div>
    <div className="relative z-10">
      <p className="text-xl sm:text-2xl font-black text-white">
        {fmtNum(value)}
      </p>
      <p className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider mt-1 truncate">
        {label}
      </p>
    </div>
  </motion.div>
);

const Pagination = ({ page, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between px-4 sm:px-6 py-4 border-t border-slate-800/60 bg-slate-900/20 gap-4">
      <p className="text-[10px] sm:text-xs font-black text-slate-500 uppercase tracking-widest order-2 sm:order-1">
        Page <span className="text-slate-300">{page}</span> of{" "}
        <span className="text-slate-300">{totalPages}</span>
      </p>
      <div className="flex items-center gap-1 sm:gap-2 order-1 sm:order-2">
        <button
          disabled={page === 1}
          onClick={() => onPageChange(page - 1)}
          className="p-2 bg-slate-800 border border-slate-700 text-slate-400 hover:text-white hover:border-amber-500 disabled:opacity-20 disabled:cursor-not-allowed rounded-xl transition-all shadow-sm"
        >
          <FiChevronLeft size={16} />
        </button>
        <div className="flex items-center gap-1.5 px-1">
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pg;
            if (totalPages <= 5) {
              pg = i + 1;
            } else if (page <= 3) {
              pg = i + 1;
            } else if (page >= totalPages - 2) {
              pg = totalPages - 4 + i;
            } else {
              pg = page - 2 + i;
            }
            if (pg > totalPages) return null;

            return (
              <button
                key={pg}
                onClick={() => onPageChange(pg)}
                className={`w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-xl text-[10px] sm:text-xs font-black transition-all ${
                  page === pg
                    ? "bg-amber-500 text-slate-900 shadow-lg shadow-amber-500/20"
                    : "bg-slate-800/50 text-slate-500 hover:text-white border border-slate-700/50 hover:border-slate-600"
                }`}
              >
                {pg}
              </button>
            );
          })}
        </div>
        <button
          disabled={page === totalPages}
          onClick={() => onPageChange(page + 1)}
          className="p-2 bg-slate-800 border border-slate-700 text-slate-400 hover:text-white hover:border-amber-500 disabled:opacity-20 disabled:cursor-not-allowed rounded-xl transition-all shadow-sm"
        >
          <FiChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};

const AdminRewards = () => {
  const [activeTab, setActiveTab] = useState("balances");
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [balancesLoading, setBalancesLoading] = useState(true);
  const [balancesPage, setBalancesPage] = useState(1);
  const [balancesTotalPages, setBalancesTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editPoints, setEditPoints] = useState("");
  const [editReason, setEditReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotalPages, setHistoryTotalPages] = useState(1);

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await adminService.getRewardsStats();
      setStats(res.data.stats);
    } catch {
      toast.error("Failed to load rewards stats");
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const fetchBalances = useCallback(async () => {
    setBalancesLoading(true);
    try {
      const res = await adminService.getLoyaltyBalances({
        page: balancesPage,
        limit: 6,
      });
      setUsers(res.data.users);
      setBalancesTotalPages(res.data.pagination.totalPages);
    } catch {
      toast.error("Failed to load loyalty balances");
    } finally {
      setBalancesLoading(false);
    }
  }, [balancesPage]);

  const fetchHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const res = await adminService.getRedemptionHistory({
        page: historyPage,
        limit: 6,
      });
      setHistory(res.data.history);
      setHistoryTotalPages(res.data.pagination.totalPages);
    } catch {
      toast.error("Failed to load redemption history");
    } finally {
      setHistoryLoading(false);
    }
  }, [historyPage]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    fetchBalances();
  }, [fetchBalances]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const startEdit = (user) => {
    setEditingId(user._id);
    setEditPoints(String(user.loyaltyPoints));
    setEditReason("");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditPoints("");
    setEditReason("");
  };

  const saveEdit = async (userId) => {
    if (editPoints === "" || isNaN(Number(editPoints))) {
      toast.error("Enter a valid points value");
      return;
    }
    setSaving(true);
    try {
      await adminService.updateLoyaltyPoints(userId, {
        points: Number(editPoints),
        reason: editReason || undefined,
      });
      toast.success("Points updated successfully");
      cancelEdit();
      fetchBalances();
      fetchStats();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Update failed");
    } finally {
      setSaving(false);
    }
  };

  const filteredUsers = search.trim()
    ? users.filter(
        (u) =>
          u.name.toLowerCase().includes(search.toLowerCase()) ||
          u.email.toLowerCase().includes(search.toLowerCase()),
      )
    : users;

  const statCards = stats
    ? [
        {
          icon: FiStar,
          label: "Active Points",
          value: stats.totalActivePoints,
          color: "amber",
          sub: "live",
        },
        {
          icon: FiTrendingUp,
          label: "Lifetime Total",
          value: stats.totalPointsEarned,
          color: "emerald",
        },
        {
          icon: FiTrendingDown,
          label: "Total Redeemed",
          value: stats.totalPointsRedeemed,
          color: "rose",
        },
        {
          icon: FiActivity,
          label: "Redemptions",
          value: stats.totalRedemptions,
          color: "indigo",
        },
        {
          icon: FiUsers,
          label: "Rewarded Users",
          value: stats.activeUsers,
          color: "violet",
        },
      ]
    : [];

  return (
    <AdminLayout>
      <div className="space-y-6 sm:space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tighter flex items-center gap-4">
              <span className="p-3 bg-amber-500/10 rounded-2xl border border-amber-500/20 shadow-xl shadow-amber-500/5">
                <FiGift className="text-amber-400" size={28} />
              </span>
              <span>
                Rewards &amp; <span className="text-amber-400">Loyalty</span>
              </span>
            </h1>
          </div>

          <div className="flex bg-slate-900 shadow-2xl p-1.5 rounded-2xl border border-slate-800/80 backdrop-blur-xl self-stretch lg:self-auto group">
            <button
              onClick={() => setActiveTab("balances")}
              className={`flex-1 lg:flex-none px-6 py-3 rounded-xl text-xs sm:text-sm font-black transition-all duration-300 flex items-center justify-center gap-2 ${
                activeTab === "balances"
                  ? "bg-amber-500 text-slate-900 shadow-xl shadow-amber-500/40"
                  : "text-slate-500 hover:text-slate-200 hover:bg-slate-800/50"
              }`}
            >
              <FiStar size={14} /> Balances
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`flex-1 lg:flex-none px-6 py-3 rounded-xl text-xs sm:text-sm font-black transition-all duration-300 flex items-center justify-center gap-2 ${
                activeTab === "history"
                  ? "bg-amber-500 text-slate-900 shadow-xl shadow-amber-500/40"
                  : "text-slate-500 hover:text-slate-200 hover:bg-slate-800/50"
              }`}
            >
              <FiClock size={14} /> Log
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
          {statsLoading
            ? [...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-6 h-32 animate-pulse shadow-inner"
                />
              ))
            : statCards.map((c, i) => <StatCard key={i} {...c} />)}
        </div>

        {activeTab === "balances" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-900/40 border border-slate-800/50 rounded-4xl overflow-hidden backdrop-blur-lg shadow-2xl"
          >
            <div className="px-6 sm:px-8 pt-8 pb-6 border-b border-slate-800/60 flex flex-col sm:flex-row gap-6 items-start sm:items-center justify-between bg-slate-800/10">
              <div className="space-y-1">
                <h2 className="text-xl font-black text-white">
                  Member Directory
                </h2>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-tighter">
                  Manage user loyalty allocations
                </p>
              </div>
              <div className="relative w-full sm:w-80 group">
                <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-amber-500 transition-colors" />
                <input
                  type="text"
                  placeholder="Search members..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-12 pr-6 py-3.5 text-sm bg-slate-800/40 border border-slate-700/50 rounded-2xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500/40 w-full transition-all shadow-inner"
                />
              </div>
            </div>

            {balancesLoading ? (
              <div className="py-32 flex flex-col items-center justify-center gap-6">
                <div className="w-14 h-14 border-4 border-amber-500/10 border-t-amber-500 rounded-full animate-spin shadow-xl" />
                <p className="text-slate-500 font-black text-xs uppercase tracking-widest animate-pulse">
                  Syncing user data...
                </p>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="py-32 flex flex-col items-center gap-6 text-center px-6">
                <div className="w-24 h-24 bg-slate-800/30 rounded-4xl flex items-center justify-center text-slate-700 border border-slate-700/30 shadow-2xl rotate-3">
                  <FiUsers size={44} />
                </div>
                <div className="space-y-2">
                  <h3 className="text-white font-black text-2xl tracking-tight">
                    No Results Found
                  </h3>
                  <p className="text-slate-500 text-sm max-w-sm mx-auto font-medium">
                    Your search filters didn't return any platform members. Try
                    a different query.
                  </p>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto selection:bg-amber-500 selection:text-slate-900">
                <table className="w-full text-left border-collapse min-w-175">
                  <thead>
                    <tr className="border-b border-slate-800/60">
                      {[
                        { label: "Profile", class: "pl-8 pr-6" },
                        {
                          label: "Credentials",
                          class: "px-6 hidden md:table-cell",
                        },
                        { label: "Level", class: "px-6 hidden sm:table-cell" },
                        { label: "Joined", class: "px-6 hidden lg:table-cell" },
                        { label: "Reward Points", class: "px-6" },
                        { label: "Management", class: "pr-8 pl-6 text-right" },
                      ].map((h) => (
                        <th
                          key={h.label}
                          className={`${h.class} py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500`}
                        >
                          {h.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <AnimatePresence mode="popLayout">
                      {filteredUsers.map((user, idx) => (
                        <motion.tr
                          key={user._id}
                          layout
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.04 }}
                          className="border-b border-slate-800/30 hover:bg-slate-800/20 transition-all group"
                        >
                          <td className="pl-8 pr-6 py-5">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-linear-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 rounded-2xl flex items-center justify-center text-amber-500 font-black text-sm shadow-lg group-hover:scale-110 transition-transform duration-500">
                                {user.name?.charAt(0).toUpperCase()}
                              </div>
                              <div className="flex flex-col min-w-0">
                                <span className="text-white font-bold text-sm tracking-tight truncate group-hover:text-amber-400 transition-colors">
                                  {user.name}
                                </span>
                                <span className="text-[10px] text-slate-500 font-black uppercase md:hidden mt-0.5 truncate tracking-tighter">
                                  {user.email}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td className="px-6 py-5 hidden md:table-cell">
                            <p className="text-slate-400 text-sm font-medium truncate max-w-45">
                              {user.email}
                            </p>
                          </td>

                          <td className="px-6 py-5 hidden sm:table-cell">
                            <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-slate-800 border border-slate-700 text-slate-400 group-hover:border-amber-500/30 group-hover:text-amber-400/80 transition-all duration-300 shadow-sm leading-none">
                              {user.subscription?.plan || "free tier"}
                            </span>
                          </td>

                          <td className="px-6 py-5 text-slate-500 text-xs font-bold hidden lg:table-cell whitespace-nowrap">
                            {fmtDate(user.createdAt)}
                          </td>

                          <td className="px-6 py-5">
                            {editingId === user._id ? (
                              <div className="flex flex-col gap-2 min-w-30">
                                <div className="relative">
                                  <FiStar
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-amber-500/50"
                                    size={14}
                                  />
                                  <input
                                    id={`edit-points-${user._id}`}
                                    type="number"
                                    min="0"
                                    value={editPoints}
                                    onChange={(e) =>
                                      setEditPoints(e.target.value)
                                    }
                                    className="w-full pl-4 pr-10 py-2 text-sm bg-slate-900 border border-amber-500/60 rounded-xl text-white focus:outline-none focus:ring-4 focus:ring-amber-500/20 font-black transition-all"
                                    autoFocus
                                  />
                                </div>
                                <input
                                  type="text"
                                  placeholder="Log entry reason..."
                                  value={editReason}
                                  onChange={(e) =>
                                    setEditReason(e.target.value)
                                  }
                                  className="w-full px-3 py-2 text-[10px] bg-slate-900 border border-slate-800 rounded-lg text-slate-300 placeholder-slate-700 focus:outline-none focus:border-amber-900 transition-all font-bold"
                                />
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 bg-amber-500/5 px-3 py-2 rounded-xl border border-amber-500/10 w-fit group-hover:border-amber-500/30 transition-all duration-500">
                                <FiStar
                                  className="text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]"
                                  size={13}
                                />
                                <span className="text-amber-300 font-black text-sm tracking-widest leading-none">
                                  {fmtNum(user.loyaltyPoints)}
                                </span>
                              </div>
                            )}
                          </td>

                          <td className="pr-8 pl-6 py-5 text-right">
                            {editingId === user._id ? (
                              <div className="flex gap-2 justify-end">
                                <button
                                  aria-label="Save"
                                  id={`save-btn-${user._id}`}
                                  disabled={saving}
                                  onClick={() => saveEdit(user._id)}
                                  className="p-2.5 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-slate-900 rounded-xl transition-all disabled:opacity-50 shadow-lg shadow-emerald-500/5 active:scale-95 border border-emerald-500/20"
                                >
                                  <FiCheck size={18} />
                                </button>
                                <button
                                  aria-label="Cancel"
                                  onClick={cancelEdit}
                                  disabled={saving}
                                  className="p-2.5 bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white rounded-xl transition-all disabled:opacity-50 shadow-lg shadow-rose-500/5 active:scale-95 border border-rose-500/20"
                                >
                                  <FiX size={18} />
                                </button>
                              </div>
                            ) : (
                              <button
                                aria-label="Edit"
                                id={`edit-btn-${user._id}`}
                                onClick={() => startEdit(user)}
                                className="p-3 bg-slate-800/80 text-slate-400 hover:bg-amber-500 hover:text-slate-900 rounded-2xl transition-all sm:opacity-0 sm:translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 shadow-xl border border-slate-700 hover:border-amber-300 active:scale-90 duration-500"
                              >
                                <FiEdit2 size={16} />
                              </button>
                            )}
                          </td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
            )}

            <Pagination
              page={balancesPage}
              totalPages={balancesTotalPages}
              onPageChange={(p) => {
                setBalancesPage(p);
                cancelEdit();
              }}
            />
          </motion.div>
        )}

        {activeTab === "history" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-900/40 border border-slate-800/50 rounded-4xl overflow-hidden backdrop-blur-lg shadow-2xl"
          >
            <div className="px-6 sm:px-8 pt-8 pb-6 border-b border-slate-800/60 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between bg-slate-800/10">
              <div className="space-y-1">
                <h2 className="text-xl font-black text-white flex items-center gap-3">
                  <FiClock className="text-amber-400" size={20} />
                  <span>
                    Activity <span className="text-amber-400">Ledger</span>
                  </span>
                </h2>
                <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">
                  Global redemption tracking
                </p>
              </div>
              <div className="px-4 py-2 bg-slate-800/60 rounded-xl border border-slate-700/50 text-[10px] font-black text-slate-400 uppercase tracking-widest shadow-inner">
                Real-time Audit Trail
              </div>
            </div>

            {historyLoading ? (
              <div className="py-32 flex flex-col items-center justify-center gap-6">
                <div className="w-14 h-14 border-4 border-rose-500/10 border-t-rose-500 rounded-full animate-spin shadow-xl shadow-rose-500/5" />
                <p className="text-slate-500 font-black text-xs uppercase tracking-widest animate-pulse">
                  Accessing archives...
                </p>
              </div>
            ) : history.length === 0 ? (
              <div className="py-32 flex flex-col items-center gap-6 text-center px-6">
                <div className="w-24 h-24 bg-slate-800/30 rounded-[2.5rem] flex items-center justify-center text-slate-700 border border-slate-700/30 shadow-2xl -rotate-6">
                  <FiClock size={44} />
                </div>
                <div className="space-y-2">
                  <h3 className="text-white font-black text-2xl tracking-tight">
                    Ledger Empty
                  </h3>
                  <p className="text-slate-500 text-sm max-w-sm mx-auto font-medium">
                    No point redemptions or adjustments have been recorded in
                    the platform history yet.
                  </p>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto selection:bg-rose-500/30 selection:text-white">
                <table className="w-full text-left border-collapse min-w-175">
                  <thead>
                    <tr className="border-b border-slate-800/60">
                      {[
                        { label: "Beneficiary", class: "pl-8 pr-6" },
                        { label: "Magnitude", class: "px-6" },
                        {
                          label: "Protocol",
                          class: "px-6 hidden sm:table-cell",
                        },
                        {
                          label: "Narrative",
                          class: "px-6 hidden md:table-cell",
                        },
                        {
                          label: "Timestamp",
                          class: "pr-8 pl-6 text-right whitespace-nowrap",
                        },
                      ].map((h) => (
                        <th
                          key={h.label}
                          className={`${h.class} py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500`}
                        >
                          {h.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <AnimatePresence mode="popLayout">
                      {history.map((entry, idx) => (
                        <motion.tr
                          key={entry._id}
                          layout
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.04 }}
                          className="border-b border-slate-800/30 hover:bg-slate-800/20 transition-all group"
                        >
                          <td className="pl-8 pr-6 py-5">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-center text-slate-500 font-black text-xs shadow-inner group-hover:bg-slate-800 transition-colors duration-500">
                                {entry.userName?.charAt(0).toUpperCase()}
                              </div>
                              <div className="flex flex-col min-w-0">
                                <span className="text-white font-bold text-sm tracking-tight truncate group-hover:text-white/80 transition-colors">
                                  {entry.userName}
                                </span>
                                <span className="text-[9px] text-slate-600 font-black uppercase whitespace-nowrap overflow-hidden text-ellipsis max-w-35 tracking-tighter">
                                  {entry.userEmail}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td className="px-6 py-5">
                            <span
                              className={`inline-flex items-center gap-2 font-black text-sm px-3 py-1.5 rounded-xl border-2 shadow-sm ${entry.amount < 0 ? "bg-rose-500/5 text-rose-400 border-rose-500/10" : "bg-emerald-500/5 text-emerald-400 border-emerald-500/10"}`}
                            >
                              {entry.amount < 0 ? (
                                <FiTrendingDown
                                  size={14}
                                  className="animate-bounce"
                                />
                              ) : (
                                <FiTrendingUp
                                  size={14}
                                  className="animate-pulse"
                                />
                              )}
                              {entry.amount < 0 ? "" : "+"}
                              {fmtNum(entry.amount)}
                            </span>
                          </td>

                          <td className="px-6 py-5 hidden sm:table-cell">
                            <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.15em] bg-slate-900 border border-slate-800 text-slate-500 shadow-inner">
                              {entry.event?.replace(/_/g, " ") ||
                                "system tweak"}
                            </span>
                          </td>

                          <td className="px-6 py-5 text-slate-500 text-xs hidden md:table-cell max-w-50 truncate italic font-medium">
                            "{entry.description || "Manual adjustment"}"
                          </td>

                          <td className="pr-8 pl-6 py-5 text-right whitespace-nowrap">
                            <div className="flex flex-col items-end">
                              <span className="text-slate-300 font-bold text-xs">
                                {fmtDate(entry.createdAt)}
                              </span>
                              <span className="text-[9px] text-emerald-500 font-black uppercase tracking-widest opacity-60 group-hover:opacity-100 transition-opacity">
                                Certified Agent
                              </span>
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
            )}

            <Pagination
              page={historyPage}
              totalPages={historyTotalPages}
              onPageChange={setHistoryPage}
            />
          </motion.div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminRewards;
