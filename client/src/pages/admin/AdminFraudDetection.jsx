import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import AdminLayout from "../../layouts/AdminLayout";
import { adminService } from "../../services";
import {
  FiShield,
  FiAlertCircle,
  FiArrowRight,
  FiRefreshCw,
  FiUsers,
  FiStar,
  FiFileText,
  FiRepeat,
} from "react-icons/fi";

const SEV = {
  critical: {
    ring: "border-rose-500/40",
    bg: "bg-rose-500/10",
    badge: "bg-rose-500/20 text-rose-400 border-rose-500/30",
  },
  high: {
    ring: "border-orange-500/40",
    bg: "bg-orange-500/10",
    badge: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  },
  medium: {
    ring: "border-amber-500/40",
    bg: "bg-amber-500/10",
    badge: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  },
};
const TYPE_ICON = {
  duplicate_phone: FiUsers,
  review_bombing: FiStar,
  duplicate_jobs: FiFileText,
  wash_trading: FiRepeat,
};

const RiskMeter = ({ score }) => {
  const color = score >= 75 ? "#ef4444" : score >= 50 ? "#f97316" : "#f59e0b";
  return (
    <div className="flex items-center gap-2 mt-2">
      <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${score}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-xs font-black" style={{ color }}>
        {score}
      </span>
    </div>
  );
};

const AdminFraudDetection = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      const res = await adminService.getFraudSignals();
      setData(res.data);
    } catch {
      toast.error("Failed to load fraud signals");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const filtered = (data?.signals || []).filter(
    (s) => filter === "all" || s.severity === filter,
  );

  return (
    <AdminLayout>
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tighter">
            Fraud <span className="text-rose-400">Detection</span>
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            Suspicious activity signals across the platform
          </p>
        </div>
        <button
          onClick={fetch}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2.5 bg-slate-800/80 border border-white/10 rounded-2xl text-sm font-bold text-slate-300 hover:text-white transition-all"
        >
          <FiRefreshCw size={14} className={loading ? "animate-spin" : ""} />{" "}
          Refresh
        </button>
      </header>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          {
            label: "Total",
            value: data?.total || 0,
            color: "text-white",
            bg: "bg-slate-800/60 border-slate-700",
          },
          {
            label: "Critical",
            value: data?.critical || 0,
            color: "text-rose-400",
            bg: "bg-rose-500/10 border-rose-500/30",
          },
          {
            label: "High",
            value: data?.high || 0,
            color: "text-orange-400",
            bg: "bg-orange-500/10 border-orange-500/30",
          },
          {
            label: "Medium",
            value: data?.medium || 0,
            color: "text-amber-400",
            bg: "bg-amber-500/10 border-amber-500/30",
          },
        ].map((c) => (
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

      <div className="flex gap-2 mb-6 flex-wrap">
        {["all", "critical", "high", "medium"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider border transition-all ${filter === f ? "bg-indigo-600 text-white border-indigo-500" : "bg-slate-800/60 text-slate-400 border-white/5 hover:border-white/20"}`}
          >
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-32 bg-slate-900/60 border border-white/5 rounded-2xl animate-pulse"
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <FiShield className="text-emerald-400 text-5xl mb-4" />
          <p className="text-white font-black text-lg">No Signals Detected</p>
          <p className="text-slate-500 text-sm mt-1">
            Platform looks clean for the selected filter.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((s, i) => {
            const cfg = SEV[s.severity] || SEV.medium;
            const Icon = TYPE_ICON[s.type] || FiAlertCircle;
            return (
              <div
                key={i}
                className={`border rounded-2xl p-5 transition-all hover:scale-[1.005] ${cfg.ring} ${cfg.bg}`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${cfg.badge}`}
                  >
                    <Icon size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className="text-sm font-black text-white">
                        {s.title}
                      </h3>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${cfg.badge}`}
                      >
                        {s.severity}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      {s.detail}
                    </p>
                    <RiskMeter score={s.riskScore} />
                    {s.entities?.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {s.entities.map((e, ei) => (
                          <span
                            key={ei}
                            className="px-2.5 py-1 bg-slate-800/80 border border-white/5 rounded-lg text-[11px] font-bold text-slate-400"
                          >
                            {e.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => navigate(s.actionPath)}
                    className="flex items-center gap-1 text-xs font-black text-indigo-400 hover:text-indigo-300 transition-colors shrink-0"
                  >
                    Review <FiArrowRight size={12} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminFraudDetection;
