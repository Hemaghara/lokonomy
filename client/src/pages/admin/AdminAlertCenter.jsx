import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import AdminLayout from "../../layouts/AdminLayout";
import { adminService } from "../../services";
import { connectSocket } from "../../services/socket";
import {
  FiAlertCircle,
  FiAlertTriangle,
  FiInfo,
  FiRefreshCw,
  FiArrowRight,
  FiShield,
  FiClock,
  FiFlag,
  FiUser,
} from "react-icons/fi";

const SEVERITY_CONFIG = {
  critical: {
    bg: "bg-rose-500/10 border-rose-500/30",
    badge: "bg-rose-500/20 text-rose-400 border-rose-500/30",
    icon: FiAlertCircle,
    iconColor: "text-rose-400",
    dot: "bg-rose-500",
  },
  warning: {
    bg: "bg-amber-500/10 border-amber-500/30",
    badge: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    icon: FiAlertTriangle,
    iconColor: "text-amber-400",
    dot: "bg-amber-500",
  },
  info: {
    bg: "bg-sky-500/10 border-sky-500/30",
    badge: "bg-sky-500/20 text-sky-400 border-sky-500/30",
    icon: FiInfo,
    iconColor: "text-sky-400",
    dot: "bg-sky-500",
  },
};

const TYPE_ICON = {
  report_threshold: FiFlag,
  subscription_expiry: FiClock,
  kyc_pending: FiShield,
  stale_ticket: FiUser,
  system_health: FiAlertCircle,
};

const AlertCard = ({ alert, onNavigate }) => {
  const cfg = SEVERITY_CONFIG[alert.severity] || SEVERITY_CONFIG.info;
  const Icon = TYPE_ICON[alert.type] || FiAlertCircle;
  return (
    <div
      className={`border rounded-2xl p-5 transition-all duration-300 hover:scale-[1.01] ${cfg.bg}`}
    >
      <div className="flex items-start gap-4">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${cfg.badge} border`}
        >
          <Icon size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h3 className="text-sm font-black text-white">{alert.title}</h3>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${cfg.badge}`}
            >
              {alert.severity}
            </span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            {alert.message}
          </p>
          <div className="flex items-center gap-4 mt-3">
            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest flex items-center gap-1">
              <FiClock size={10} />
              {alert.timestamp
                ? new Date(alert.timestamp).toLocaleString()
                : "Just now"}
            </span>
            {alert.actionPath && (
              <button
                onClick={() => onNavigate(alert.actionPath)}
                className="flex items-center gap-1.5 text-[11px] font-black text-indigo-400 hover:text-indigo-300 transition-colors uppercase tracking-wider"
              >
                View <FiArrowRight size={11} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const AdminAlertCenter = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [lastRefresh, setLastRefresh] = useState(null);

  const fetchAlerts = useCallback(async () => {
    try {
      setLoading(true);
      const res = await adminService.getAlerts();
      setData(res.data);
      setLastRefresh(new Date());
    } catch {
      toast.error("Failed to fetch alerts");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAlerts();
    const adminInfo = JSON.parse(localStorage.getItem("adminInfo") || "{}");
    const socket = connectSocket({
      userId: adminInfo._id || "admin",
      isAdmin: true,
    });
    socket.on("newAlert", () => fetchAlerts());
    const interval = setInterval(fetchAlerts, 60000);
    return () => {
      socket.off("newAlert");
      clearInterval(interval);
    };
  }, [fetchAlerts]);

  const filtered =
    data?.alerts?.filter((a) => filter === "all" || a.severity === filter) ||
    [];

  const summaryCards = [
    {
      label: "Total",
      value: data?.total || 0,
      color: "text-white",
      bg: "bg-slate-800/60 border-slate-700/60",
    },
    {
      label: "Critical",
      value: data?.critical || 0,
      color: "text-rose-400",
      bg: "bg-rose-500/10 border-rose-500/30",
    },
    {
      label: "Warning",
      value: data?.warning || 0,
      color: "text-amber-400",
      bg: "bg-amber-500/10 border-amber-500/30",
    },
    {
      label: "Info",
      value: data?.info || 0,
      color: "text-sky-400",
      bg: "bg-sky-500/10 border-sky-500/30",
    },
  ];

  return (
    <AdminLayout>
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tighter">
            Alert <span className="text-rose-400">Center</span>
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            Real-time critical signals ·{" "}
            {lastRefresh
              ? `Last updated ${lastRefresh.toLocaleTimeString()}`
              : "Loading..."}
          </p>
        </div>
        <button
          onClick={fetchAlerts}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2.5 bg-slate-800/80 border border-white/10 rounded-2xl text-sm font-bold text-slate-300 hover:text-white hover:border-indigo-500/40 transition-all"
        >
          <FiRefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </header>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {summaryCards.map((c) => (
          <div
            key={c.label}
            className={`border rounded-2xl p-4 text-center ${c.bg}`}
          >
            <p className={`text-2xl font-black ${c.color}`}>{c.value}</p>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">
              {c.label}
            </p>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 mb-6 flex-wrap">
        {["all", "critical", "warning", "info"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all border ${filter === f ? "bg-indigo-600 text-white border-indigo-500" : "bg-slate-800/60 text-slate-400 border-white/5 hover:border-white/20"}`}
          >
            {f}
          </button>
        ))}
      </div>

      {loading && !data ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-24 bg-slate-900/60 border border-white/5 rounded-2xl animate-pulse"
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4">
            <FiAlertCircle className="text-emerald-400 text-2xl" />
          </div>
          <p className="text-white font-black text-lg">All Clear</p>
          <p className="text-slate-500 text-sm mt-1">
            No {filter !== "all" ? filter : ""} alerts at the moment.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((alert) => (
            <AlertCard key={alert.id} alert={alert} onNavigate={navigate} />
          ))}
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminAlertCenter;
