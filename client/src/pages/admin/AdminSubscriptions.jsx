import { useState, useCallback, useEffect } from "react";
import { toast } from "react-hot-toast";
import { adminService } from "../../services";
import AdminLayout from "../../layouts/AdminLayout";
import useAdminFetch from "../../hooks/useAdminFetch";
import { useUrlState } from "../../hooks/useUrlState";
import { TableSkeleton, StatsSkeleton } from "../../components/admin/Skeleton";
import useAdminPermission from "../../hooks/useAdminPermission";
import {
  FiDollarSign,
  FiTrendingUp,
  FiFilter,
  FiDownload,
  FiCheckCircle,
  FiXCircle,
  FiSearch,
  FiRefreshCw,
  FiCreditCard,
  FiPieChart,
  FiBarChart2,
  FiClock,
  FiActivity,
  FiUsers,
} from "react-icons/fi";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

/* ─── Design tokens ──────────────────────────────────────────── 
   Page bg  : #0d1117  (deep navy-black — not flat #000000)
   Card bg  : #161c27  (slate-900-ish with blue undertone)
   Elevated : #1e2535  (inner elements, hover states)
   Border   : rgba(255,255,255,0.07)
   ─────────────────────────────────────────────────────────── */

const AdminSubscriptions = () => {
  const { canViewAnalytics } = useAdminPermission();
  const { getParam, setParam, setParams } = useUrlState({
    tab: "transactions",
    plan: "all",
    status: "all",
    search: "",
    period: "month",
    report_period: "month",
    page: "1",
  });

  const activeTab = getParam("tab", "transactions");
  const currentPage = parseInt(getParam("page", "1"));
  
  const filter = {
    plan: getParam("plan", "all"),
    status: getParam("status", "all"),
    search: getParam("search", ""),
  };
  
  const revenuePeriod = getParam("period", "month");
  const reportPeriod = getParam("report_period", "month");

  const [stats, setStats] = useState(null);

  const fetchFn = useCallback(() => {
    const params = { ...filter, page: currentPage, limit: 15 };
    if (activeTab === "transactions") return adminService.getSubscriptionTransactions(params);
    if (activeTab === "revenue") return adminService.getRevenueData(revenuePeriod);
    if (activeTab === "failed") return adminService.getFailedPayments({ search: filter.search, page: currentPage });
    if (activeTab === "reports") return adminService.getFinancialReport(reportPeriod);
    return Promise.resolve({ data: {} });
  }, [activeTab, filter, currentPage, revenuePeriod, reportPeriod]);

  const { data, loading, refetch } = useAdminFetch(fetchFn, [activeTab, filter.plan, filter.status, filter.search, currentPage, revenuePeriod, reportPeriod], {
    onSuccess: (result) => {
      if (activeTab === "transactions") {
        setStats({ plans: result.planStats, failed: result.failedCount });
      }
    }
  });

  const transactions = activeTab === "transactions" ? data?.transactions || [] : [];
  const revenueData = activeTab === "revenue" ? data : null;
  const failedPayments = activeTab === "failed" ? data?.payments || [] : [];
  const financialReport = activeTab === "reports" ? data?.report : null;
  const totalPages = data?.totalPages || 1;

  const exportToCSV = (dataList, filename) => {
    if (!dataList?.length) return;
    const header = Object.keys(dataList[0]).join(",");
    const rows = dataList.map((o) =>
      Object.values(o)
        .map((v) => `"${v}"`)
        .join(",")
    );
    const blob = new Blob([[header, ...rows].join("\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${filename}.csv`;
    a.style.visibility = "hidden";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleExportReport = () => {
    if (!financialReport) return;
    exportToCSV(
      [
        {
          Metric: "Total Revenue",
          Value: `₹${financialReport.allTime.totalRevenue}`,
        },
        {
          Metric: "Period Revenue",
          Value: `₹${financialReport.periodStats.revenue}`,
        },
        {
          Metric: "Active Subscribers",
          Value: financialReport.subscribers.active,
        },
        {
          Metric: "Success Rate",
          Value: `${financialReport.transactions.successRate}%`,
        },
      ],
      `financial_report_${reportPeriod}`
    );
    toast.success("Report exported successfully");
  };

  const formatChartData = () => {
    if (!revenueData) return [];
    return revenueData.labels.map((label, i) => ({
      name: label,
      Total: revenueData.datasets.total[i],
      Silver: revenueData.datasets.silver[i],
      Gold: revenueData.datasets.gold[i],
      Platinum: revenueData.datasets.platinum[i],
    }));
  };

  const PERIODS = ["day", "week", "month", "year"];

  const TABS = [
    { id: "transactions", label: "Transactions", icon: FiCreditCard },
    { id: "revenue", label: "Revenue", icon: FiBarChart2 },
    { id: "failed", label: "Failures", icon: FiXCircle },
    { id: "reports", label: "Reports", icon: FiPieChart },
  ];

  const PeriodPicker = ({ value, onChange }) => (
    <div
      style={{
        background: "#1e2535",
        border: "1px solid rgba(255,255,255,0.07)",
      }}
      className="flex gap-0.5 p-1 rounded-xl w-fit"
    >
      {PERIODS.map((p) => (
        <button
          key={p}
          onClick={() => onChange(p)}
          className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all
            ${value === p ? "bg-indigo-600 text-white shadow" : "text-slate-500 hover:text-slate-200"}`}
        >
          {p}
        </button>
      ))}
    </div>
  );

  const planBadge = (plan) =>
    ({
      platinum: "bg-violet-500/10 border-violet-500/20 text-violet-400",
      gold: "bg-amber-500/10  border-amber-500/20  text-amber-400",
      silver: "bg-slate-500/10  border-slate-500/20  text-slate-400",
    })[plan] || "bg-slate-500/10 border-slate-500/20 text-slate-400";

  const statusEl = (status) =>
    ({
      success: (
        <span className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold">
          <FiCheckCircle size={12} /> Success
        </span>
      ),
      failed: (
        <span className="flex items-center gap-1.5 text-rose-400   text-xs font-bold">
          <FiXCircle size={12} /> Failed
        </span>
      ),
      pending: (
        <span className="flex items-center gap-1.5 text-amber-400  text-xs font-bold">
          <FiClock size={12} /> Pending
        </span>
      ),
    })[status] || null;

  const card = "rounded-2xl border border-[rgba(255,255,255,0.07)]";
  const cardBg = "bg-[#161c27]";
  const innerBg = "bg-[#1e2535]";

  return (
    <AdminLayout>
      <div
        className="min-h-screen px-3 py-4 sm:px-5 sm:py-6 lg:px-8 lg:py-8 space-y-5 sm:space-y-6"
        style={{ background: "#020617" }}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight leading-none">
              Subscription &{" "}
              <span className="bg-linear-to-rrom-indigo-400 to-violet-400 bg-clip-text text-transparent">
                Revenue
              </span>
            </h2>
            <p className="text-slate-500 mt-1.5 text-xs sm:text-sm">
              Manage tiers · track payments · analyze growth
            </p>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            <button
              onClick={() => refetch()}
              title="Refresh"
              className={`w-10 h-10 flex items-center justify-center rounded-xl ${innerBg} border border-[rgba(255,255,255,0.07)] text-slate-400 hover:text-white transition-all active:scale-95`}
            >
              <FiRefreshCw
                size={15}
                className={loading ? "animate-spin" : ""}
              />
            </button>
            <button
              onClick={() => {
                setParams({ tab: "reports", page: "1" });
              }}
              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs sm:text-sm font-bold transition-all active:scale-95 shadow-lg"
              style={{ boxShadow: "0 4px 24px rgba(99,102,241,0.25)" }}
            >
              <FiDownload size={14} /> Export
            </button>
          </div>
        </div>

        <div
          className={`flex gap-1 p-1 ${cardBg} ${card} overflow-x-auto no-scrollbar`}
        >
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setParams({ tab: tab.id, page: "1" });
              }}
              className={`flex items-center gap-1.5 px-3.5 py-2.5 sm:px-5 sm:py-3 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap flex-1 justify-center sm:flex-none transition-all duration-200
                ${
                  activeTab === tab.id
                    ? "bg-indigo-600 text-white"
                    : "text-slate-500 hover:text-slate-200 hover:bg-white/5"
                }`}
            >
              <tab.icon size={14} />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
        {activeTab === "transactions" && (
          <div className="space-y-4">
            <div
              className={`grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 p-3 sm:p-4 ${cardBg} ${card}`}
            >
              <div className="relative">
                <FiFilter
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none"
                  size={12}
                />
                <select
                  value={filter.plan}
                  onChange={(e) =>
                    setParams({ plan: e.target.value, page: "1" })
                  }
                  className={`w-full pl-8 pr-3 py-2.5 ${innerBg} border border-[rgba(255,255,255,0.07)] rounded-xl text-white text-xs font-semibold appearance-none focus:outline-none focus:ring-1 focus:ring-indigo-500/50 transition-all`}
                >
                  <option value="all">All Plans</option>
                  <option value="silver">Silver</option>
                  <option value="gold">Gold</option>
                  <option value="platinum">Platinum</option>
                </select>
              </div>
              <div className="relative">
                <FiCheckCircle
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none"
                  size={12}
                />
                <select
                  value={filter.status}
                  onChange={(e) =>
                    setParams({ status: e.target.value, page: "1" })
                  }
                  className={`w-full pl-8 pr-3 py-2.5 ${innerBg} border border-[rgba(255,255,255,0.07)] rounded-xl text-white text-xs font-semibold appearance-none focus:outline-none focus:ring-1 focus:ring-indigo-500/50 transition-all`}
                >
                  <option value="all">All Status</option>
                  <option value="success">Success</option>
                  <option value="pending">Pending</option>
                  <option value="failed">Failed</option>
                </select>
              </div>
              <div className="relative col-span-2">
                <FiSearch
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none"
                  size={12}
                />
                <input
                  type="text"
                  placeholder="Search transactions..."
                  value={filter.search}
                  onChange={(e) =>
                    setParams({ search: e.target.value, page: "1" })
                  }
                  className={`w-full pl-8 pr-4 py-2.5 ${innerBg} border border-[rgba(255,255,255,0.07)] rounded-xl text-white text-xs font-semibold placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 transition-all`}
                />
              </div>
            </div>

            <div className={`${cardBg} ${card} overflow-hidden`}>
              <div className="overflow-x-auto">
                <table className="w-full min-w-145 text-left">
                  <thead>
                    <tr
                      className={`${innerBg} border-b border-[rgba(255,255,255,0.06)]`}
                    >
                      {["User", "Plan", "Amount", "Status", "Date / ID"].map(
                        (h) => (
                          <th
                            key={h}
                            className="px-4 py-3.5 text-[10px] font-black uppercase tracking-[0.18em] text-slate-600"
                          >
                            {h}
                          </th>
                        )
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[rgba(255,255,255,0.04)]">
                    {loading ? (
                      <tr>
                        <td colSpan="5" className="p-0">
                          <TableSkeleton rows={10} cols={5} />
                        </td>
                      </tr>
                    ) : transactions.length === 0 ? (
                      <tr>
                        <td
                          colSpan="5"
                          className="py-16 text-center text-slate-600 text-xs font-semibold"
                        >
                          No transactions found.
                        </td>
                      </tr>
                    ) : (
                      transactions.map((t) => (
                        <tr
                          key={t._id}
                          className="transition-colors group"
                          style={{
                            ":hover": { background: "rgba(255,255,255,0.025)" },
                          }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.background =
                              "rgba(255,255,255,0.025)")
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.background = "")
                          }
                        >
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div
                                className={`w-8 h-8 shrink-0 rounded-lg ${innerBg} border border-[rgba(255,255,255,0.07)] flex items-center justify-center text-indigo-400 text-xs font-black group-hover:bg-indigo-600 group-hover:text-white transition-all`}
                              >
                                {t.user?.name?.[0]?.toUpperCase() || "?"}
                              </div>
                              <div className="min-w-0">
                                <p className="text-white text-xs font-bold truncate">
                                  {t.user?.name || "Deleted User"}
                                </p>
                                <p className="text-slate-600 text-[10px] truncate">
                                  {t.user?.email || "N/A"}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <span
                              className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border ${planBadge(t.plan)}`}
                            >
                              {t.plan}
                            </span>
                            <p className="text-slate-600 text-[10px] mt-1">
                              {t.durationMonths}mo
                            </p>
                          </td>
                          <td className="px-4 py-4 text-white font-black text-sm">
                            ₹{t.amount}
                          </td>
                          <td className="px-4 py-4">{statusEl(t.status)}</td>
                          <td className="px-4 py-4">
                            <p className="text-slate-300 text-[11px] font-semibold">
                              {new Date(t.createdAt).toLocaleDateString()}{" "}
                              {new Date(t.createdAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                            <p className="text-slate-600 text-[10px] mt-0.5 truncate max-w-32.5">
                              {t.razorpayPaymentId ||
                                t.razorpayOrderId ||
                                "SYSTEM"}
                            </p>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <div
                className={`flex items-center justify-between px-4 py-3 border-t border-[rgba(255,255,255,0.06)] ${innerBg}`}
              >
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-600">
                  Page {currentPage} / {totalPages}
                </p>
                <div className="flex gap-2">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setParam("page", (currentPage - 1).toString())}
                    className={`px-3 py-1.5 text-xs font-bold ${cardBg} disabled:opacity-25 text-slate-300 rounded-lg border border-[rgba(255,255,255,0.07)] hover:bg-[#1e2535] transition-all`}
                  >
                    Prev
                  </button>
                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setParam("page", (currentPage + 1).toString())}
                    className="px-3 py-1.5 text-xs font-bold bg-indigo-600 disabled:opacity-25 text-white rounded-lg hover:bg-indigo-500 transition-all"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        {activeTab === "revenue" && (
          <div className="space-y-4">
            <div className={`${cardBg} ${card} p-4 sm:p-6`}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-5">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/15 flex items-center justify-center text-indigo-400">
                    <FiTrendingUp size={15} />
                  </div>
                  <h3 className="text-base sm:text-lg font-black text-white">
                    Revenue <span className="text-indigo-400">Growth</span>
                  </h3>
                </div>
                <PeriodPicker
                  value={revenuePeriod}
                  onChange={(p) => setParam("period", p)}
                />
              </div>
              <div className="h-56 sm:h-72 lg:h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={formatChartData()}>
                    <defs>
                      <linearGradient id="gTotal" x1="0" y1="0" x2="0" y2="1">
                        <stop
                          offset="5%"
                          stopColor="#6366f1"
                          stopOpacity={0.2}
                        />
                        <stop
                          offset="95%"
                          stopColor="#6366f1"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgba(255,255,255,0.04)"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="name"
                      stroke="#475569"
                      fontSize={9}
                      fontWeight="bold"
                      tickLine={false}
                      axisLine={false}
                      minTickGap={25}
                    />
                    <YAxis
                      stroke="#475569"
                      fontSize={9}
                      fontWeight="bold"
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => `₹${v}`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#161c27",
                        border: "1px solid rgba(255,255,255,0.08)",
                        borderRadius: "12px",
                        fontWeight: "bold",
                        fontSize: "11px",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="Total"
                      stroke="#6366f1"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#gTotal)"
                    />
                    <Area
                      type="monotone"
                      dataKey="Silver"
                      stroke="#94a3b8"
                      strokeWidth={1.5}
                      fillOpacity={0}
                      strokeDasharray="4 3"
                    />
                    <Area
                      type="monotone"
                      dataKey="Gold"
                      stroke="#fbbf24"
                      strokeWidth={1.5}
                      fillOpacity={0}
                      strokeDasharray="4 3"
                    />
                    <Area
                      type="monotone"
                      dataKey="Platinum"
                      stroke="#a78bfa"
                      strokeWidth={1.5}
                      fillOpacity={0}
                      strokeDasharray="4 3"
                    />
                    <Legend
                      iconType="circle"
                      wrapperStyle={{
                        paddingTop: "16px",
                        fontSize: "9px",
                        textTransform: "uppercase",
                        fontWeight: "900",
                        letterSpacing: "0.12em",
                      }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                {
                  label: "Period Revenue",
                  value: revenueData?.summary?.periodRevenue,
                  icon: FiDollarSign,
                  accent:
                    "bg-indigo-500/10 border-indigo-500/20 text-indigo-400",
                },
                {
                  label: "Silver Revenue",
                  value: revenueData?.summary?.revenueBreakdown?.silver,
                  icon: FiActivity,
                  accent:
                    "bg-slate-500/10  border-slate-500/20  text-slate-400",
                },
                {
                  label: "Platinum Revenue",
                  value: revenueData?.summary?.revenueBreakdown?.platinum,
                  icon: FiCheckCircle,
                  accent:
                    "bg-violet-500/10  border-violet-500/20 text-violet-400",
                },
              ].map((s, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-3 ${cardBg} ${card} p-4`}
                >
                  <div
                    className={`w-10 h-10 shrink-0 rounded-xl border flex items-center justify-center ${s.accent}`}
                  >
                    <s.icon size={17} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-600">
                      {s.label}
                    </p>
                    <p className="text-xl font-black text-white">
                      ₹{s.value || 0}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "failed" && (
          <div className="space-y-4">
            <div
              className={`flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between p-4 ${cardBg} ${card}`}
            >
              <h3 className="text-base font-black text-white">
                Payment <span className="text-rose-400">Failures</span>
              </h3>
              <div className="relative w-full sm:w-72">
                <FiSearch
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none"
                  size={12}
                />
                <input
                  type="text"
                  placeholder="Search by email…"
                  value={filter.search}
                  onChange={(e) =>
                    setFilter({ ...filter, search: e.target.value })
                  }
                  className={`w-full pl-8 pr-4 py-2.5 ${innerBg} border border-[rgba(255,255,255,0.07)] rounded-xl text-white text-xs font-semibold placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-rose-500/40 transition-all`}
                />
              </div>
            </div>

            <div className={`${cardBg} ${card} overflow-hidden`}>
              <div className="overflow-x-auto">
                <table className="w-full min-w-130 text-left">
                  <thead>
                    <tr
                      className={`${innerBg} border-b border-[rgba(255,255,255,0.06)]`}
                    >
                      {["User", "Plan", "Loss", "Reason", "When"].map((h) => (
                        <th
                          key={h}
                          className="px-4 py-3.5 text-[10px] font-black uppercase tracking-[0.18em] text-slate-600"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[rgba(255,255,255,0.04)]">
                    {loading ? (
                      <tr>
                        <td
                          colSpan="5"
                          className="py-16 text-center text-slate-600 text-xs animate-pulse"
                        >
                          Loading…
                        </td>
                      </tr>
                    ) : failedPayments.length === 0 ? (
                      <tr>
                        <td
                          colSpan="5"
                          className="py-16 text-center text-slate-600 text-xs"
                        >
                          No failed payments recorded.
                        </td>
                      </tr>
                    ) : (
                      failedPayments.map((p) => (
                        <tr
                          key={p._id}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.background =
                              "rgba(244,63,94,0.03)")
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.background = "")
                          }
                          className="transition-colors"
                        >
                          <td className="px-4 py-4">
                            <p className="text-white text-xs font-bold">
                              {p.user?.name || "Unknown"}
                            </p>
                            <p className="text-slate-600 text-[10px]">
                              {p.user?.email || "N/A"}
                            </p>
                          </td>
                          <td className="px-4 py-4 text-slate-400 text-xs font-bold uppercase">
                            {p.plan}{" "}
                            <span className="text-slate-600 normal-case font-medium">
                              ({p.durationMonths}m)
                            </span>
                          </td>
                          <td className="px-4 py-4 font-black text-rose-400 text-sm">
                            ₹{p.amount}
                          </td>
                          <td className="px-4 py-4 text-slate-400 text-[11px] italic max-w-40">
                            {p.failureReason || "Payment abandoned"}
                          </td>
                          <td className="px-4 py-4 text-slate-500 text-[11px] font-semibold whitespace-nowrap">
                            {new Date(p.createdAt).toLocaleString()}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === "reports" && financialReport && (
          <div className="space-y-4 sm:space-y-5">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                {
                  label: "All-Time Revenue",
                  value: `₹${financialReport.allTime.totalRevenue}`,
                  sub: "Total earnings",
                  icon: FiDollarSign,
                  grad: "from-indigo-600 to-violet-700",
                  text: "text-indigo-300",
                },
                {
                  label: "Active Premium",
                  value: financialReport.subscribers.active,
                  sub: "Paying users",
                  icon: FiUsers,
                  grad: "from-emerald-600 to-teal-700",
                  text: "text-emerald-300",
                },
                {
                  label: "Success Rate",
                  value: `${financialReport.transactions.successRate}%`,
                  sub: "Payment health",
                  icon: FiCheckCircle,
                  grad: "from-amber-600 to-orange-700",
                  text: "text-amber-300",
                },
                {
                  label: "Avg Ticket",
                  value: `₹${financialReport.allTime.avgRevenuePerUser}`,
                  sub: "Per subscriber",
                  icon: FiTrendingUp,
                  grad: "from-pink-600 to-rose-700",
                  text: "text-rose-300",
                },
              ].map((c, i) => (
                <div
                  key={i}
                  className={`${cardBg} ${card} p-4 transition-all group`}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.borderColor =
                      "rgba(255,255,255,0.13)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.borderColor =
                      "rgba(255,255,255,0.07)")
                  }
                >
                  <div
                    className={`w-9 h-9 rounded-xl bg-linear-to-br ${c.grad} flex items-center justify-center text-white mb-3 group-hover:scale-105 transition-transform`}
                  >
                    <c.icon size={15} />
                  </div>
                  <p
                    className={`text-[10px] font-black uppercase tracking-[0.18em] ${c.text} mb-0.5`}
                  >
                    {c.label}
                  </p>
                  <p className="text-xl sm:text-2xl font-black text-white tracking-tight">
                    {c.value}
                  </p>
                  <p className="text-[10px] text-slate-600 mt-0.5">{c.sub}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
              <div className={`xl:col-span-2 ${cardBg} ${card} p-4 sm:p-6`}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-5">
                  <div>
                    <h3 className="text-base font-black text-white">
                      Financial{" "}
                      <span className="text-indigo-400">Analysis</span>
                    </h3>
                    <p className="text-slate-600 text-[11px] mt-0.5">
                      Growth metrics for period
                    </p>
                  </div>
                  <PeriodPicker
                    value={reportPeriod}
                    onChange={(p) => setParam("report_period", p)}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <div
                      className={`p-4 ${innerBg} border border-[rgba(255,255,255,0.07)] rounded-xl mb-4`}
                    >
                      <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2">
                        Period Revenue
                      </p>
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <span className="text-3xl sm:text-4xl font-black text-white tracking-tighter">
                          ₹{financialReport.periodStats.revenue}
                        </span>
                        <span className="text-emerald-400 text-xs font-bold flex items-center gap-1">
                          <FiTrendingUp size={11} /> +12%
                        </span>
                      </div>
                      <div
                        className="mt-3 h-1 rounded-full overflow-hidden"
                        style={{ background: "rgba(255,255,255,0.06)" }}
                      >
                        <div className="h-full bg-linear-to-r from-indigo-500 to-violet-500 w-[70%] rounded-full" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div
                        className={`p-3 ${innerBg} border border-[rgba(255,255,255,0.07)] rounded-xl text-center`}
                      >
                        <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">
                          Total Txns
                        </p>
                        <p className="text-lg font-black text-white">
                          {financialReport.transactions.total}
                        </p>
                      </div>
                      <div
                        className={`p-3 ${innerBg} border border-[rgba(255,255,255,0.07)] rounded-xl text-center`}
                      >
                        <p className="text-[9px] font-black text-rose-400 uppercase tracking-widest mb-1">
                          Failed
                        </p>
                        <p className="text-lg font-black text-white">
                          {financialReport.transactions.failed}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-3">
                      Tier Distribution
                    </p>
                    <div className="space-y-4">
                      {Object.entries(financialReport.subscribers.byPlan).map(
                        ([plan, count]) => {
                          const pct =
                            financialReport.subscribers.active > 0
                              ? Math.round(
                                  (count / financialReport.subscribers.active) *
                                    100,
                                )
                              : 0;
                          const barColor =
                            {
                              platinum: "#a78bfa",
                              gold: "#fbbf24",
                              silver: "#94a3b8",
                            }[plan] || "#94a3b8";
                          const dotColor =
                            {
                              platinum: "bg-violet-400",
                              gold: "bg-amber-400",
                              silver: "bg-slate-500",
                            }[plan] || "bg-slate-500";
                          return (
                            <div key={plan}>
                              <div className="flex items-center justify-between mb-1.5">
                                <div className="flex items-center gap-2">
                                  <div
                                    className={`w-1.5 h-1.5 rounded-full ${dotColor}`}
                                  />
                                  <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
                                    {plan}
                                  </span>
                                </div>
                                <span className="text-[10px] font-bold text-slate-600">
                                  {pct}%
                                </span>
                              </div>
                              <div
                                className="h-1 rounded-full overflow-hidden"
                                style={{ background: "rgba(255,255,255,0.06)" }}
                              >
                                <div
                                  className="h-full rounded-full transition-all duration-700"
                                  style={{
                                    width: `${pct}%`,
                                    background: barColor,
                                  }}
                                />
                              </div>
                            </div>
                          );
                        },
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div
                className={`${cardBg} ${card} p-4 sm:p-6 flex flex-col justify-between gap-5`}
              >
                <div>
                  <h3 className="text-base font-black text-white mb-0.5">
                    Subscriber{" "}
                    <span className="text-indigo-400">Retention</span>
                  </h3>
                  <p className="text-slate-600 text-[11px] mb-4">
                    Churn & health analysis
                  </p>
                  <div className="space-y-3">
                    {[
                      {
                        label: "Active",
                        value: financialReport.subscribers.active,
                        icon: FiCheckCircle,
                        textColor: "text-emerald-400",
                        boxCls: "bg-emerald-500/10 border-emerald-500/20",
                      },
                      {
                        label: "Expired",
                        value: financialReport.subscribers.expired,
                        icon: FiXCircle,
                        textColor: "text-rose-400",
                        boxCls: "bg-rose-500/10    border-rose-500/20",
                      },
                    ].map((row) => (
                      <div
                        key={row.label}
                        className={`flex items-center gap-3 p-3.5 ${innerBg} border border-[rgba(255,255,255,0.07)] rounded-xl`}
                      >
                        <div
                          className={`w-9 h-9 shrink-0 rounded-lg border flex items-center justify-center ${row.textColor} ${row.boxCls}`}
                        >
                          <row.icon size={15} />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-slate-600 uppercase tracking-wider">
                            {row.label}
                          </p>
                          <p className="text-xl font-black text-white">
                            {row.value}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div
                  className="p-4 rounded-xl border border-indigo-500/20"
                  style={{ background: "rgba(99,102,241,0.07)" }}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <FiActivity className="text-indigo-400" size={13} />
                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">
                      Recommendation
                    </p>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    <span className="text-white font-bold">Platinum</span>{" "}
                    conversion is up 5%. Launch a 12-month bundle for Silver
                    users.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-center">
              <button
                onClick={handleExportReport}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-sm transition-all active:scale-95 border border-indigo-500/30 w-full sm:w-auto"
                style={{ boxShadow: "0 4px 24px rgba(99,102,241,0.2)" }}
              >
                <FiDownload size={15} />
                Download Financial CSV Report
              </button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminSubscriptions;
