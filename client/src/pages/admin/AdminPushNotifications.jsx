import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { adminService } from "../../services";
import AdminLayout from "../../layouts/AdminLayout";
import {
  FiSend,
  FiUsers,
  FiBell,
  FiInfo,
  FiActivity,
  FiPlus,
  FiZap,
  FiTarget,
  FiCheckCircle,
  FiClock,
  FiAlertCircle,
  FiRefreshCw,
} from "react-icons/fi";

const AdminPushNotifications = () => {
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [activeTab, setActiveTab] = useState("send");

  const [globalData, setGlobalData] = useState({
    title: "",
    message: "",
    actionUrl: "",
  });

  const [planData, setPlanData] = useState({
    plan: "silver",
    title: "",
    message: "",
    actionUrl: "",
  });

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const response = await adminService.getNotificationHistory();
      setHistory(response.data);
    } catch (error) {
      console.error("Error fetching history:", error);
    }
  };

  const applyPreset = (type) => {
    if (type === "maintenance") {
      setGlobalData({
        title: "System Maintenance",
        message:
          "Today our website server is down do not panic here solve the issue in 2 hour",
        actionUrl: "/",
      });
    } else if (type === "new_plan") {
      setGlobalData({
        title: "New Subscription Plan!",
        message:
          "Here add new plan for the subscription. Check out the new benefits now!",
        actionUrl: "/upgrade-plan",
      });
    }
  };

  const handleSendGlobal = async (e) => {
    e.preventDefault();
    if (!globalData.title || !globalData.message) {
      return toast.error("Please fill in title and message");
    }

    setLoading(true);
    try {
      await adminService.sendGlobalNotification(globalData);
      toast.success("Notification sent to all active users!");
      setGlobalData({ title: "", message: "", actionUrl: "" });
      fetchHistory();
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to send notification",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSendPlan = async (e) => {
    e.preventDefault();
    if (!planData.title || !planData.message) {
      return toast.error("Please fill in title and message");
    }

    setLoading(true);
    try {
      await adminService.sendPlanNotification(planData);
      toast.success(`Notification sent to ${planData.plan} users!`);
      setPlanData({ plan: "silver", title: "", message: "", actionUrl: "" });
      fetchHistory();
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to send notification",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-8 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 sm:gap-4">
          <div className="animate-in fade-in slide-in-from-left-4 duration-500">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight leading-tight">
              Push <span className="text-indigo-400">Notification Manager</span>
            </h2>
            <p className="text-slate-400 mt-2 font-medium italic text-xs sm:text-sm md:text-base max-w-2xl">
              Broadcast messages, alerts, and subscription reminders to your
              users across all platforms.
            </p>
          </div>
        </div>

        <div className="relative">
          <div className="flex p-1 bg-slate-900/50 border border-white/5 rounded-2xl w-full backdrop-blur-xl overflow-x-auto no-scrollbar scroll-smooth">
            <div className="flex min-w-max p-1 gap-1">
              {[
                { id: "send", label: "Send Notification", icon: FiSend },
                { id: "history", label: "Message History", icon: FiActivity },
                { id: "settings", label: "Automation Info", icon: FiZap },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2.5 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm font-bold transition-all duration-300 ${
                    activeTab === tab.id
                      ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20"
                      : "text-slate-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <tab.icon size={16} className="sm:w-4.5 sm:h-4.5" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="absolute right-0 top-0 h-full w-8 bg-linear-to-l from-slate-950/20 to-transparent pointer-events-none sm:hidden rounded-r-2xl" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {activeTab === "send" && (
            <>
              <div className="lg:col-span-6 animate-in fade-in slide-in-from-bottom-4 duration-500 h-full">
                <div className="bg-slate-900/40 p-5 sm:p-8 rounded-4xl sm:rounded-[2.5rem] border border-white/5 backdrop-blur-xl shadow-2xl relative overflow-hidden group h-full hover:bg-slate-900/50 transition-all">
                  <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-600/10 rounded-full blur-[100px] group-hover:bg-indigo-600/20 transition-all duration-700" />

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-indigo-600/20 flex items-center justify-center text-indigo-400 shadow-inner">
                        <FiUsers size={20} className="sm:w-6 sm:h-6" />
                      </div>
                      <div>
                        <h3 className="text-lg sm:text-xl font-black text-white leading-tight">
                          Broadcast to All
                        </h3>
                        <p className="text-slate-500 text-[9px] sm:text-[11px] font-bold uppercase tracking-widest mt-0.5">
                          Reach every active user
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2 self-end sm:self-auto">
                      <button
                        type="button"
                        onClick={() => applyPreset("maintenance")}
                        title="Maintenance Preset"
                        className="p-2 sm:p-2.5 bg-slate-800 text-slate-400 rounded-lg sm:rounded-xl hover:text-white hover:bg-indigo-600 transition-all active:scale-95"
                      >
                        <FiAlertCircle size={18} />
                      </button>
                      <button
                        type="button"
                        onClick={() => applyPreset("new_plan")}
                        title="New Plan Preset"
                        className="p-2 sm:p-2.5 bg-slate-800 text-slate-400 rounded-lg sm:rounded-xl hover:text-white hover:bg-indigo-600 transition-all active:scale-95"
                      >
                        <FiPlus size={18} />
                      </button>
                    </div>
                  </div>

                  <form
                    onSubmit={handleSendGlobal}
                    className="space-y-5 relative z-10"
                  >
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                        Notification Title
                      </label>
                      <input
                        type="text"
                        placeholder="e.g., System Maintenance"
                        className="w-full px-5 py-4 bg-slate-800/40 border border-white/5 rounded-2xl text-white font-bold focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all hover:bg-slate-800/60"
                        value={globalData.title}
                        onChange={(e) =>
                          setGlobalData({
                            ...globalData,
                            title: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                        Message Body
                      </label>
                      <textarea
                        rows="4"
                        placeholder="Type your message here... users cannot reply to this."
                        className="w-full px-5 py-4 bg-slate-800/40 border border-white/5 rounded-2xl text-white font-bold focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all hover:bg-slate-800/60 resize-none"
                        value={globalData.message}
                        onChange={(e) =>
                          setGlobalData({
                            ...globalData,
                            message: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                        Action URL (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g., /marketplace"
                        className="w-full px-5 py-4 bg-slate-800/40 border border-white/5 rounded-2xl text-white font-bold focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all hover:bg-slate-800/60"
                        value={globalData.actionUrl}
                        onChange={(e) =>
                          setGlobalData({
                            ...globalData,
                            actionUrl: e.target.value,
                          })
                        }
                      />
                    </div>

                    <button
                      disabled={loading}
                      type="submit"
                      className="group/btn w-full py-4 sm:py-5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl sm:rounded-2xl font-black text-base sm:text-lg shadow-xl shadow-indigo-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2.5 sm:gap-3 mt-4"
                    >
                      {loading ? (
                        <FiClock className="animate-spin" />
                      ) : (
                        <FiSend
                          size={20}
                          className="group-hover/btn:translate-x-1 transition-transform"
                        />
                      )}
                      <span>Send Global Broadcast</span>
                    </button>
                  </form>
                </div>
              </div>

              <div className="lg:col-span-6 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-150 h-full">
                <div className="bg-slate-900/40 p-5 sm:p-8 rounded-4xl sm:rounded-[2.5rem] border border-white/5 backdrop-blur-xl shadow-2xl relative overflow-hidden group h-full hover:bg-slate-900/50 transition-all">
                  <div className="absolute -top-24 -right-24 w-64 h-64 bg-emerald-600/10 rounded-full blur-[100px] group-hover:bg-emerald-600/20 transition-all duration-700" />

                  <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-emerald-600/20 flex items-center justify-center text-emerald-400 shadow-inner">
                      <FiTarget size={20} className="sm:w-6 sm:h-6" />
                    </div>
                    <div>
                      <h3 className="text-lg sm:text-xl font-black text-white leading-tight">
                        Targeted Plan Notification
                      </h3>
                      <p className="text-slate-500 text-[9px] sm:text-[11px] font-bold uppercase tracking-widest mt-0.5">
                        Reach specific tier users
                      </p>
                    </div>
                  </div>

                  <form
                    onSubmit={handleSendPlan}
                    className="space-y-5 relative z-10"
                  >
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                        Select Target Plan
                      </label>
                      <div className="grid grid-cols-3 gap-2 sm:gap-3">
                        {["silver", "gold", "platinum"].map((p) => (
                          <button
                            key={p}
                            type="button"
                            onClick={() =>
                              setPlanData({ ...planData, plan: p })
                            }
                            className={`py-2 sm:py-3 rounded-lg sm:rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest border transition-all active:scale-95 ${
                              planData.plan === p
                                ? "bg-emerald-600/20 border-emerald-500 text-emerald-400 shadow-lg"
                                : "bg-slate-800/40 border-white/5 text-slate-500 hover:text-white"
                            }`}
                          >
                            {p}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                        Notification Title
                      </label>
                      <input
                        type="text"
                        placeholder="e.g., Exclusive Gold Offer"
                        className="w-full px-5 py-4 bg-slate-800/40 border border-white/5 rounded-2xl text-white font-bold focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all hover:bg-slate-800/60"
                        value={planData.title}
                        onChange={(e) =>
                          setPlanData({ ...planData, title: e.target.value })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                        Message Body
                      </label>
                      <textarea
                        rows="4"
                        placeholder="Type your message for tier users..."
                        className="w-full px-5 py-4 bg-slate-800/40 border border-white/5 rounded-2xl text-white font-bold focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all hover:bg-slate-800/60 resize-none"
                        value={planData.message}
                        onChange={(e) =>
                          setPlanData({ ...planData, message: e.target.value })
                        }
                      />
                    </div>

                    <button
                      disabled={loading}
                      type="submit"
                      className="group/btn w-full py-4 sm:py-5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl sm:rounded-2xl font-black text-base sm:text-lg shadow-xl shadow-emerald-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2.5 sm:gap-3 mt-4"
                    >
                      {loading ? (
                        <FiClock className="animate-spin" />
                      ) : (
                        <FiBell
                          size={20}
                          className="group-hover/btn:scale-110 transition-transform"
                        />
                      )}
                      <span>Send Target Notification</span>
                    </button>
                  </form>
                </div>
              </div>
            </>
          )}

          {activeTab === "history" && (
            <div className="lg:col-span-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="bg-slate-900/40 rounded-3xl sm:rounded-[2.5rem] border border-white/5 backdrop-blur-xl overflow-hidden shadow-2xl">
                <div className="p-5 sm:p-8 border-b border-white/5 bg-slate-900/30 flex items-center justify-between gap-4">
                  <h3 className="text-lg sm:text-xl font-black text-white flex items-center gap-3">
                    <FiActivity
                      size={22}
                      className="text-indigo-400 sm:w-6 sm:h-6"
                    />
                    <span className="leading-tight">Message History</span>
                  </h3>
                  <button
                    onClick={fetchHistory}
                    className="p-2.5 sm:p-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-all shadow-lg active:scale-95"
                  >
                    <FiRefreshCw className={loading ? "animate-spin" : ""} />
                  </button>
                </div>

                <div className="relative group/table">
                  <div className="overflow-x-auto no-scrollbar scroll-smooth">
                    <table className="w-full text-left min-w-175 border-separate border-spacing-0">
                      <thead>
                        <tr className="bg-slate-950/20">
                          <th className="px-6 sm:px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                            Target
                          </th>
                          <th className="px-6 sm:px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                            Content
                          </th>
                          <th className="px-6 sm:px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                            Recipients
                          </th>
                          <th className="px-6 sm:px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                            Sent At
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {history.length === 0 ? (
                          <tr>
                            <td
                              colSpan="4"
                              className="px-8 py-20 text-center text-slate-500 font-bold italic"
                            >
                              No history found
                            </td>
                          </tr>
                        ) : (
                          history.map((h, i) => (
                            <tr
                              key={i}
                              className="hover:bg-white/2 transition-all group/row"
                            >
                              <td className="px-6 sm:px-8 py-6">
                                <span
                                  className={`px-3 sm:px-4 py-1.5 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-widest border transition-all ${
                                    h.targetPlan === "All Users"
                                      ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-400 group-hover/row:bg-indigo-500/20"
                                      : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 group-hover/row:bg-emerald-500/20"
                                  }`}
                                >
                                  {h.targetPlan}
                                </span>
                              </td>
                              <td className="px-6 sm:px-8 py-6 max-w-sm sm:max-w-md">
                                <p className="text-white font-black text-xs sm:text-sm mb-1 line-clamp-1">
                                  {h.title}
                                </p>
                                <p className="text-slate-500 text-[11px] font-medium line-clamp-2 leading-relaxed">
                                  {h.message}
                                </p>
                              </td>
                              <td className="px-6 sm:px-8 py-6">
                                <div className="flex items-center gap-2 text-indigo-400 font-black text-sm">
                                  <FiUsers size={16} />
                                  <span>{h.recipientCount}</span>
                                </div>
                              </td>
                              <td className="px-6 sm:px-8 py-6 text-slate-500 text-[10px] sm:text-xs font-bold whitespace-nowrap tabular-nums">
                                {new Date(h.sentAt).toLocaleString([], {
                                  month: "short",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                  {/* Table Scroll Shadow Fade */}
                  <div className="absolute top-0 right-0 h-full w-12 bg-linear-to-l from-slate-950/40 to-transparent pointer-events-none opacity-0 group-hover/table:opacity-100 transition-opacity duration-500 sm:hidden" />
                </div>
              </div>
            </div>
          )}

          {activeTab === "settings" && (
            <div className="lg:col-span-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-slate-900/40 p-6 sm:p-8 rounded-4xl sm:rounded-[2.5rem] border border-white/5 backdrop-blur-xl">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-amber-600/20 flex items-center justify-center text-amber-400 mb-6 font-black shadow-inner">
                    <FiZap size={20} className="sm:w-6 sm:h-6" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-black text-white mb-4 leading-tight">
                    Subscription Auto-Reminders
                  </h3>
                  <div className="space-y-4 relative">
                    <div className="flex items-start gap-4 p-4 bg-white/2 rounded-2xl border border-white/5 group/ai hover:bg-white/5 transition-all">
                      <FiCheckCircle className="text-emerald-400 mt-1 shrink-0 group-hover/ai:scale-110 transition-transform" />
                      <div>
                        <p className="text-sm font-black text-white">
                          Pre-Expiry (3 Days)
                        </p>
                        <p className="text-xs text-slate-500 mt-1 font-medium italic leading-relaxed">
                          Sent to users 3 days before their plan expires.
                          "Please renew the new plan your plan expire in 3 day."
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4 p-4 bg-white/2 rounded-2xl border border-white/5 group/ai hover:bg-white/5 transition-all">
                      <FiAlertCircle className="text-amber-400 mt-1 shrink-0 group-hover/ai:scale-110 transition-transform" />
                      <div>
                        <p className="text-sm font-black text-white">
                          Expiry Day
                        </p>
                        <p className="text-xs text-slate-500 mt-1 font-medium italic leading-relaxed">
                          Sent on the day of expiry. "Please renew the plan your
                          plan expire in some day."
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-indigo-600 p-6 sm:p-8 rounded-4xl sm:rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-700 pointer-events-none">
                    <FiBell size={120} />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black mb-6 relative z-10 leading-tight">
                    Push Best Practices
                  </h3>
                  <ul className="space-y-4 sm:space-y-5 text-indigo-100 font-bold text-xs sm:text-sm relative z-10">
                    {[
                      {
                        step: 1,
                        text: "Keep titles short and attention-grabbing.",
                      },
                      {
                        step: 2,
                        text: "Use the message body to add value or urgency.",
                      },
                      {
                        step: 3,
                        text: "Always include an Action URL if relevant.",
                      },
                      {
                        step: 4,
                        text: "Prefer targeted notifications over global broadcasts.",
                      },
                    ].map((item) => (
                      <li
                        key={item.step}
                        className="flex items-center gap-3 group/li"
                      >
                        <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-white/20 flex items-center justify-center text-[10px] sm:text-xs shrink-0 font-black group-hover/li:bg-white group-hover/li:text-indigo-600 transition-all">
                          {item.step}
                        </div>
                        <span className="leading-tight">{item.text}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminPushNotifications;
