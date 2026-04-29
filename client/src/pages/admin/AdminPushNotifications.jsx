import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { adminService } from "../../services";
import AdminLayout from "../../layouts/AdminLayout";
import {
  FiSend,
  FiUsers,
  FiBell,
  FiActivity,
  FiPlus,
  FiZap,
  FiTarget,
  FiCheckCircle,
  FiClock,
  FiAlertCircle,
  FiRefreshCw,
  FiCalendar,
  FiTrash2,
} from "react-icons/fi";

const AdminPushNotifications = () => {
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [scheduled, setScheduled] = useState([]);
  const [activeTab, setActiveTab] = useState("send");

  const [globalData, setGlobalData] = useState({
    title: "",
    message: "",
    actionUrl: "",
  });
  const [isSchedulingGlobal, setIsSchedulingGlobal] = useState(false);
  const [scheduledGlobalDate, setScheduledGlobalDate] = useState("");

  const [planData, setPlanData] = useState({
    plan: "silver",
    title: "",
    message: "",
    actionUrl: "",
  });
  const [isSchedulingPlan, setIsSchedulingPlan] = useState(false);
  const [scheduledPlanDate, setScheduledPlanDate] = useState("");

  useEffect(() => {
    fetchHistory();
    fetchScheduled();
  }, []);

  const fetchHistory = async () => {
    try {
      const response = await adminService.getNotificationHistory();
      setHistory(response.data);
    } catch (error) {
      console.error("Error fetching history:", error);
    }
  };

  const fetchScheduled = async () => {
    try {
      const response = await adminService.getScheduledNotifications();
      setScheduled(response.data);
    } catch (error) {
      console.error("Error fetching scheduled:", error);
    }
  };

  const applyPreset = (type) => {
    if (type === "maintenance") {
      setGlobalData({
        title: "System Maintenance",
        message:
          "Today our website server is down. Do not panic — we are resolving the issue within 2 hours.",
        actionUrl: "/",
      });
    } else if (type === "new_plan") {
      setGlobalData({
        title: "New Subscription Plan!",
        message:
          "We have added a new subscription plan with exciting benefits. Check it out now!",
        actionUrl: "/upgrade-plan",
      });
    }
  };

  const handleSendGlobal = async (e) => {
    e.preventDefault();
    if (!globalData.title || !globalData.message)
      return toast.error("Please fill in title and message");
    if (isSchedulingGlobal && !scheduledGlobalDate)
      return toast.error("Please select a schedule date");

    setLoading(true);
    try {
      if (isSchedulingGlobal) {
        await adminService.scheduleNotification({
          ...globalData,
          target: "all",
          scheduledFor: scheduledGlobalDate,
        });
        toast.success("Notification scheduled successfully!");
        setScheduledGlobalDate("");
        setIsSchedulingGlobal(false);
        fetchScheduled();
      } else {
        await adminService.sendGlobalNotification(globalData);
        toast.success("Notification sent to all active users!");
      }
      setGlobalData({ title: "", message: "", actionUrl: "" });
      fetchHistory();
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to process notification",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSendPlan = async (e) => {
    e.preventDefault();
    if (!planData.title || !planData.message)
      return toast.error("Please fill in title and message");
    if (isSchedulingPlan && !scheduledPlanDate)
      return toast.error("Please select a schedule date");

    setLoading(true);
    try {
      if (isSchedulingPlan) {
        await adminService.scheduleNotification({
          ...planData,
          target: "plan",
          targetPlan: planData.plan,
          scheduledFor: scheduledPlanDate,
        });
        toast.success(`Notification scheduled for ${planData.plan} users!`);
        setScheduledPlanDate("");
        setIsSchedulingPlan(false);
        fetchScheduled();
      } else {
        await adminService.sendPlanNotification(planData);
        toast.success(`Notification sent to ${planData.plan} users!`);
      }
      setPlanData({ plan: "silver", title: "", message: "", actionUrl: "" });
      fetchHistory();
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to process notification",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSchedule = async (id) => {
    if (
      !window.confirm(
        "Are you sure you want to cancel this scheduled notification?",
      )
    )
      return;
    try {
      await adminService.cancelScheduledNotification(id);
      toast.success("Scheduled notification cancelled");
      fetchScheduled();
    } catch (error) {
      toast.error("Failed to cancel schedule");
    }
  };

  const tabs = [
    { id: "send", label: "Send Notification", icon: FiSend },
    { id: "scheduled", label: "Scheduled", icon: FiCalendar },
    { id: "history", label: "Message History", icon: FiActivity },
    { id: "settings", label: "Automation Info", icon: FiZap },
  ];

  const inputClass =
    "w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 transition-all";

  const labelClass =
    "block text-[11px] font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1.5";

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            Push <span className="text-indigo-500">Notification Manager</span>
          </h1>
        </div>

        <div className="flex overflow-x-auto no-scrollbar gap-1 border-b border-slate-200 dark:border-slate-700/60">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-all duration-200 ${
                activeTab === tab.id
                  ? "border-indigo-500 text-indigo-600 dark:text-indigo-400"
                  : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:border-slate-300"
              }`}
            >
              <tab.icon size={15} />
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "send" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-5 sm:p-6 shadow-sm">
              <div className="flex items-start justify-between gap-3 mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-500 shrink-0">
                    <FiUsers size={18} />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                      Broadcast to All
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Reach every active user
                    </p>
                  </div>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => applyPreset("maintenance")}
                    title="Maintenance preset"
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-indigo-600 hover:border-indigo-300 dark:hover:border-indigo-500 transition-all"
                  >
                    <FiAlertCircle size={13} />
                    <span className="hidden sm:inline">Alert</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset("new_plan")}
                    title="New plan preset"
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-indigo-600 hover:border-indigo-300 dark:hover:border-indigo-500 transition-all"
                  >
                    <FiPlus size={13} />
                    <span className="hidden sm:inline">Plan</span>
                  </button>
                </div>
              </div>

              <form onSubmit={handleSendGlobal} className="space-y-4">
                <div>
                  <label className={labelClass}>Notification Title</label>
                  <input
                    type="text"
                    className={inputClass}
                    placeholder="e.g., System Maintenance"
                    value={globalData.title}
                    onChange={(e) =>
                      setGlobalData({ ...globalData, title: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className={labelClass}>Message Body</label>
                  <textarea
                    rows={4}
                    className={inputClass + " resize-none"}
                    placeholder="Type your message here... users cannot reply."
                    value={globalData.message}
                    onChange={(e) =>
                      setGlobalData({ ...globalData, message: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className={labelClass}>Action URL (Optional)</label>
                  <input
                    type="text"
                    className={inputClass}
                    placeholder="e.g., /marketplace"
                    value={globalData.actionUrl}
                    onChange={(e) =>
                      setGlobalData({
                        ...globalData,
                        actionUrl: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="flex items-center gap-3 pt-1">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={isSchedulingGlobal}
                    onClick={() => setIsSchedulingGlobal(!isSchedulingGlobal)}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 ${
                      isSchedulingGlobal
                        ? "bg-indigo-500"
                        : "bg-slate-300 dark:bg-slate-600"
                    }`}
                  >
                    <span
                      className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform duration-200 ${
                        isSchedulingGlobal ? "translate-x-4" : "translate-x-1"
                      }`}
                    />
                  </button>
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    Schedule for later
                  </span>
                </div>

                {isSchedulingGlobal && (
                  <div>
                    <label className={labelClass}>Date &amp; Time</label>
                    <input
                      type="datetime-local"
                      className={inputClass + " scheme-dark"}
                      value={scheduledGlobalDate}
                      onChange={(e) => setScheduledGlobalDate(e.target.value)}
                      min={new Date().toISOString().slice(0, 16)}
                    />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold transition-all active:scale-[0.98] shadow-sm shadow-indigo-500/20 mt-2"
                >
                  {loading ? (
                    <FiClock className="animate-spin" size={16} />
                  ) : (
                    <FiSend size={15} />
                  )}
                  {isSchedulingGlobal
                    ? "Schedule Broadcast"
                    : "Send Global Broadcast"}
                </button>
              </form>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-5 sm:p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0">
                  <FiTarget size={18} />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                    Targeted Plan Notification
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Reach specific tier users
                  </p>
                </div>
              </div>

              <form onSubmit={handleSendPlan} className="space-y-4">
                <div>
                  <label className={labelClass}>Target Plan</label>
                  <div className="grid grid-cols-3 gap-2">
                    {["silver", "gold", "platinum"].map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setPlanData({ ...planData, plan: p })}
                        className={`py-2.5 rounded-xl text-xs font-semibold capitalize border transition-all active:scale-95 ${
                          planData.plan === p
                            ? "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-400 text-emerald-600 dark:text-emerald-400"
                            : "border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-500 hover:text-slate-700 dark:hover:text-slate-200"
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Notification Title</label>
                  <input
                    type="text"
                    className={inputClass}
                    placeholder="e.g., Exclusive Gold Offer"
                    value={planData.title}
                    onChange={(e) =>
                      setPlanData({ ...planData, title: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className={labelClass}>Message Body</label>
                  <textarea
                    rows={4}
                    className={inputClass + " resize-none"}
                    placeholder="Type your message for tier users..."
                    value={planData.message}
                    onChange={(e) =>
                      setPlanData({ ...planData, message: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className={labelClass}>Action URL (Optional)</label>
                  <input
                    type="text"
                    className={inputClass}
                    placeholder="e.g., /upgrade-plan"
                    value={planData.actionUrl}
                    onChange={(e) =>
                      setPlanData({ ...planData, actionUrl: e.target.value })
                    }
                  />
                </div>
                <div className="flex items-center gap-3 pt-1">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={isSchedulingPlan}
                    onClick={() => setIsSchedulingPlan(!isSchedulingPlan)}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 ${
                      isSchedulingPlan
                        ? "bg-emerald-500"
                        : "bg-slate-300 dark:bg-slate-600"
                    }`}
                  >
                    <span
                      className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform duration-200 ${
                        isSchedulingPlan ? "translate-x-4" : "translate-x-1"
                      }`}
                    />
                  </button>
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    Schedule for later
                  </span>
                </div>

                {isSchedulingPlan && (
                  <div>
                    <label className={labelClass}>Date &amp; Time</label>
                    <input
                      type="datetime-local"
                      className={inputClass + " scheme-dark"}
                      value={scheduledPlanDate}
                      onChange={(e) => setScheduledPlanDate(e.target.value)}
                      min={new Date().toISOString().slice(0, 16)}
                    />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold transition-all active:scale-[0.98] shadow-sm shadow-emerald-500/20 mt-2"
                >
                  {loading ? (
                    <FiClock className="animate-spin" size={16} />
                  ) : (
                    <FiBell size={15} />
                  )}
                  {isSchedulingPlan
                    ? "Schedule Notification"
                    : "Send Target Notification"}
                </button>
              </form>
            </div>
          </div>
        )}
        {activeTab === "scheduled" && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/60 rounded-2xl shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-100 dark:border-slate-700/60">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                <FiCalendar size={16} className="text-amber-500" />
                Pending Schedules
              </h2>
              <button
                onClick={fetchScheduled}
                className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:border-slate-300 transition-all"
              >
                <FiRefreshCw
                  size={14}
                  className={loading ? "animate-spin" : ""}
                />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-150">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/40">
                    {["Target", "Content", "Scheduled For", "Actions"].map(
                      (h) => (
                        <th
                          key={h}
                          className="px-5 sm:px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500"
                        >
                          {h}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                  {scheduled.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-6 py-16 text-center text-sm text-slate-400 dark:text-slate-500"
                      >
                        No pending schedules
                      </td>
                    </tr>
                  ) : (
                    scheduled.map((s) => (
                      <tr
                        key={s._id}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
                      >
                        <td className="px-5 sm:px-6 py-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                              s.target === "all"
                                ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20"
                                : "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20"
                            }`}
                          >
                            {s.target === "all"
                              ? "All Users"
                              : `${s.targetPlan} Users`}
                          </span>
                        </td>
                        <td className="px-5 sm:px-6 py-4 max-w-xs">
                          <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                            {s.title}
                          </p>
                          <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
                            {s.message}
                          </p>
                        </td>
                        <td className="px-5 sm:px-6 py-4">
                          <div className="flex items-center gap-1.5 text-amber-500 text-xs font-medium">
                            <FiClock size={13} />
                            {new Date(s.scheduledFor).toLocaleString([], {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                        </td>
                        <td className="px-5 sm:px-6 py-4">
                          <button
                            onClick={() => handleCancelSchedule(s._id)}
                            className="p-2 rounded-lg border border-red-200 dark:border-red-500/20 text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 transition-all"
                            title="Cancel"
                          >
                            <FiTrash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {activeTab === "history" && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/60 rounded-2xl shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-100 dark:border-slate-700/60">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                <FiActivity size={16} className="text-indigo-500" />
                Message History
              </h2>
              <button
                onClick={fetchHistory}
                className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:border-slate-300 transition-all"
              >
                <FiRefreshCw
                  size={14}
                  className={loading ? "animate-spin" : ""}
                />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-150">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/40">
                    {["Target", "Content", "Recipients", "Sent At"].map((h) => (
                      <th
                        key={h}
                        className="px-5 sm:px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                  {history.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-6 py-16 text-center text-sm text-slate-400 dark:text-slate-500"
                      >
                        No history found
                      </td>
                    </tr>
                  ) : (
                    history.map((h, i) => (
                      <tr
                        key={i}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
                      >
                        <td className="px-5 sm:px-6 py-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                              h.targetPlan === "All Users"
                                ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20"
                                : "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20"
                            }`}
                          >
                            {h.targetPlan}
                          </span>
                        </td>
                        <td className="px-5 sm:px-6 py-4 max-w-xs">
                          <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                            {h.title}
                          </p>
                          <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
                            {h.message}
                          </p>
                        </td>
                        <td className="px-5 sm:px-6 py-4">
                          <div className="flex items-center gap-1.5 text-indigo-500 text-xs font-medium">
                            <FiUsers size={13} />
                            {h.recipientCount?.toLocaleString()}
                          </div>
                        </td>
                        <td className="px-5 sm:px-6 py-4 text-xs text-slate-400 tabular-nums whitespace-nowrap">
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
          </div>
        )}
        {activeTab === "settings" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-5 sm:p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0">
                  <FiZap size={18} />
                </div>
                <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Subscription Auto-Reminders
                </h2>
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50">
                  <FiCheckCircle
                    size={16}
                    className="text-emerald-500 mt-0.5 shrink-0"
                  />
                  <div>
                    <p className="text-sm font-medium text-slate-800 dark:text-white">
                      Pre-Expiry (3 Days)
                    </p>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      Sent to users 3 days before their plan expires. "Please
                      renew — your plan expires in 3 days."
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50">
                  <FiAlertCircle
                    size={16}
                    className="text-amber-500 mt-0.5 shrink-0"
                  />
                  <div>
                    <p className="text-sm font-medium text-slate-800 dark:text-white">
                      Expiry Day
                    </p>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      Sent on the day of expiry. "Please renew the plan — your
                      plan expires today."
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-indigo-500 rounded-2xl p-5 sm:p-6 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 opacity-10 pointer-events-none">
                <FiBell size={120} className="translate-x-6 -translate-y-4" />
              </div>
              <h2 className="text-sm font-semibold text-white mb-4 relative z-10">
                Push Best Practices
              </h2>
              <ul className="space-y-3.5 relative z-10">
                {[
                  "Keep titles short and attention-grabbing.",
                  "Use the message body to add value or urgency.",
                  "Always include an Action URL if relevant.",
                  "Prefer targeted notifications over global broadcasts.",
                ].map((tip, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-bold text-white shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <span className="text-xs text-indigo-100 leading-relaxed">
                      {tip}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminPushNotifications;
