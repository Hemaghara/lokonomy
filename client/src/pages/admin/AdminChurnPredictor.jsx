import { useState, useEffect, useCallback } from "react";
import { toast } from "react-hot-toast";
import AdminLayout from "../../layouts/AdminLayout";
import { adminService } from "../../services/adminService";
import {
  FiActivity,
  FiRefreshCw,
  FiSend,
  FiUser,
  FiClock,
  FiAlertTriangle,
  FiCheckCircle,
} from "react-icons/fi";

const RISK_CONFIG = {
  high: {
    color: "text-rose-400",
    bg: "bg-rose-500/10",
    border: "border-rose-500/30",
    label: "High Risk",
    icon: FiAlertTriangle,
  },
  medium: {
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
    label: "Medium Risk",
    icon: FiClock,
  },
  low: {
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
    label: "Low Risk",
    icon: FiCheckCircle,
  },
};

const AdminChurnPredictor = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sendingReminder, setSendingReminder] = useState(null);
  const [days, setDays] = useState(30);

  const fetchChurn = useCallback(async () => {
    try {
      setLoading(true);
      const res = await adminService.getChurnData(days);
      setData(res.data);
    } catch (err) {
      toast.error("Failed to fetch churn data");
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    fetchChurn();
  }, [fetchChurn]);

  const handleSendReminder = async (userId) => {
    try {
      setSendingReminder(userId);
      await adminService.sendRenewalReminder(userId);
      toast.success("Renewal reminder sent successfully");
    } catch (err) {
      toast.error("Failed to send reminder");
    } finally {
      setSendingReminder(null);
    }
  };

  return (
    <AdminLayout>
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tighter">
            Subscription{" "}
            <span className="text-indigo-400">Churn Predictor</span>
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            Identify users whose subscriptions are expiring soon
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="bg-slate-800 border border-white/10 rounded-xl px-4 py-2 text-sm text-white outline-none"
          >
            <option value={7}>Next 7 Days</option>
            <option value={14}>Next 14 Days</option>
            <option value={30}>Next 30 Days</option>
          </select>
          <button
            onClick={fetchChurn}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-800/80 border border-white/10 rounded-2xl text-sm font-bold text-slate-300 hover:text-white transition-all"
          >
            <FiRefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </header>

      {data && (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-5 text-center">
            <p className="text-2xl font-black text-white">
              {data.summary.total}
            </p>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">
              Expiring Soon
            </p>
          </div>
          <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-5 text-center">
            <p className="text-2xl font-black text-rose-400">
              {data.summary.highRisk}
            </p>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">
              High Risk
            </p>
          </div>
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-5 text-center">
            <p className="text-2xl font-black text-amber-400">
              {data.summary.mediumRisk}
            </p>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">
              Medium Risk
            </p>
          </div>
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-5 text-center">
            <p className="text-2xl font-black text-emerald-400">
              {data.summary.lowRisk}
            </p>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">
              Low Risk
            </p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-24 bg-slate-900/60 border border-white/5 rounded-2xl animate-pulse"
            />
          ))}
        </div>
      ) : data?.users.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <FiActivity className="text-emerald-400 text-5xl mb-4" />
          <p className="text-white font-black text-lg">No Impending Churn</p>
          <p className="text-slate-500 text-sm mt-1">
            No subscriptions expiring in the selected range.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5">
                <th className="py-4 px-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  User
                </th>
                <th className="py-4 px-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  Plan
                </th>
                <th className="py-4 px-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  Expiry
                </th>
                <th className="py-4 px-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  Engagement
                </th>
                <th className="py-4 px-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {data.users.map((user) => {
                const risk = RISK_CONFIG[user.churnRisk];
                const RiskIcon = risk.icon;
                return (
                  <tr
                    key={user._id}
                    className="group hover:bg-white/2 transition-all"
                  >
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-xs shrink-0">
                          {user.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white group-hover:text-indigo-400 transition-colors">
                            {user.name}
                          </p>
                          <p className="text-[10px] text-slate-500 truncate max-w-37.5">
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="px-2 py-1 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-black text-indigo-400 uppercase tracking-widest">
                        {user.subscription.plan}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-white">
                          {user.daysLeft} days left
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {new Date(
                            user.subscription.expiryDate,
                          ).toLocaleDateString()}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <div
                          className={`px-2 py-1 rounded-md ${risk.bg} border ${risk.border} flex items-center gap-1.5`}
                        >
                          <RiskIcon size={12} className={risk.color} />
                          <span
                            className={`text-[10px] font-black uppercase tracking-wider ${risk.color}`}
                          >
                            {risk.label}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-500">
                          {user.daysSinceLogin !== null
                            ? `${user.daysSinceLogin}d since login`
                            : "Never logged in"}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <button
                        onClick={() => handleSendReminder(user._id)}
                        disabled={sendingReminder === user._id}
                        className="p-2.5 bg-slate-800 border border-white/10 rounded-xl text-slate-400 hover:text-indigo-400 hover:border-indigo-400/30 transition-all active:scale-95 disabled:opacity-50"
                        title="Send Renewal Reminder"
                      >
                        {sendingReminder === user._id ? (
                          <div className="w-4 h-4 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
                        ) : (
                          <FiSend size={16} />
                        )}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminChurnPredictor;
