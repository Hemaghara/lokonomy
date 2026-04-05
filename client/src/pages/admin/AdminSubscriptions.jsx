import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { adminService } from "../../services";
import AdminLayout from "../../layouts/AdminLayout";
import {
  FiDollarSign,
  FiTrendingUp,
  FiFilter,
  FiDownload,
  FiCalendar,
  FiCheckCircle,
  FiXCircle,
  FiSearch,
  FiRefreshCw,
  FiCreditCard,
  FiPieChart,
  FiBarChart2,
  FiMoreHorizontal,
  FiClock,
  FiActivity,
  FiUsers,
  FiFileText,
} from "react-icons/fi";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from "recharts";

const AdminSubscriptions = () => {
  const [activeTab, setActiveTab] = useState("transactions");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [failedPayments, setFailedPayments] = useState([]);
  const [revenueData, setRevenueData] = useState(null);
  const [financialReport, setFinancialReport] = useState(null);
  const [filter, setFilter] = useState({
    plan: "all",
    status: "all",
    search: "",
  });
  const [revenuePeriod, setRevenuePeriod] = useState("month");
  const [reportPeriod, setReportPeriod] = useState("month");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchInitialData();
  }, [
    activeTab,
    filter.plan,
    filter.status,
    revenuePeriod,
    reportPeriod,
    page,
  ]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      if (activeTab === "transactions") {
        const response = await adminService.getSubscriptionTransactions({
          ...filter,
          page,
          limit: 15,
        });
        setTransactions(response.data.transactions);
        setTotalPages(response.data.totalPages);
        setStats({
          plans: response.data.planStats,
          failed: response.data.failedCount,
        });
      } else if (activeTab === "revenue") {
        const response = await adminService.getRevenueData(revenuePeriod);
        setRevenueData(response.data);
      } else if (activeTab === "failed") {
        const response = await adminService.getFailedPayments({
          search: filter.search,
          page,
        });
        setFailedPayments(response.data.payments);
        setTotalPages(response.data.totalPages);
      } else if (activeTab === "reports") {
        const response = await adminService.getFinancialReport(reportPeriod);
        setFinancialReport(response.data.report);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch subscription data");
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = (data, filename) => {
    if (!data || data.length === 0) return;
    const header = Object.keys(data[0]).join(",");
    const rows = data.map((obj) =>
      Object.values(obj)
        .map((val) => `"${val}"`)
        .join(","),
    );
    const csvContent = [header, ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${filename}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportReport = () => {
    if (!financialReport) return;
    const exportData = [
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
    ];
    exportToCSV(exportData, `financial_report_${reportPeriod}`);
    toast.success("Report exported successfully");
  };

  const formatChartData = () => {
    if (!revenueData) return [];
    return revenueData.labels.map((label, idx) => ({
      name: label,
      Total: revenueData.datasets.total[idx],
      Silver: revenueData.datasets.silver[idx],
      Gold: revenueData.datasets.gold[idx],
      Platinum: revenueData.datasets.platinum[idx],
    }));
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="animate-in fade-in slide-in-from-left-4 duration-500">
            <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">
              Subscription & <span className="text-indigo-400">Revenue</span>
            </h2>
            <p className="text-slate-400 mt-2 font-medium italic text-sm md:text-base">
              Manage platform tiers, track payments, and analyze growth.
            </p>
          </div>
          <div className="flex items-center gap-3 self-end lg:self-auto">
            <button
              onClick={fetchInitialData}
              title="Refresh Data"
              className="p-3.5 bg-slate-800/50 hover:bg-slate-800 text-slate-300 rounded-2xl transition-all border border-white/5 active:scale-95 group"
            >
              <FiRefreshCw
                size={22}
                className={`${loading ? "animate-spin" : "group-hover:rotate-180"} transition-transform duration-500`}
              />
            </button>
            <button
              onClick={() => setActiveTab("reports")}
              className="flex items-center gap-2.5 px-6 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold transition-all shadow-lg shadow-indigo-500/20 active:scale-95"
            >
              <FiDownload size={18} />
              <span className="hidden sm:inline">Export Report</span>
              <span className="sm:hidden">Export</span>
            </button>
          </div>
        </div>

        <div className="relative">
          <div className="flex p-1.5 bg-slate-900/50 border border-white/5 rounded-4xl w-full max-w-full overflow-x-auto no-scrollbar backdrop-blur-xl">
            <div className="flex min-w-max gap-1">
              {[
                { id: "transactions", label: "Transactions", icon: FiCreditCard },
                { id: "revenue", label: "Revenue", icon: FiBarChart2 },
                { id: "failed", label: "Failures", icon: FiXCircle },
                { id: "reports", label: "Reports", icon: FiPieChart },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setPage(1);
                  }}
                  className={`flex items-center gap-2.5 px-5 md:px-8 py-3 md:py-4 rounded-full text-xs md:text-sm font-bold transition-all duration-300 ${
                    activeTab === tab.id
                      ? "bg-indigo-600 text-white shadow-xl shadow-indigo-500/20 scale-[1.02]"
                      : "text-slate-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <tab.icon size={18} />
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>
          {/* Mobile indicator for scrollable tabs */}
          <div className="md:hidden absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-linear-to-l from-slate-900 to-transparent pointer-events-none" />
        </div>

        <div className="min-h-[60vh]">
          {activeTab === "transactions" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-slate-900/40 p-4 md:p-6 rounded-4xl border border-white/5 backdrop-blur-xl">
                <div className="relative group">
                  <FiFilter className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-400 opacity-60 group-focus-within:opacity-100 transition-opacity" />
                  <select
                    value={filter.plan}
                    onChange={(e) =>
                      setFilter({ ...filter, plan: e.target.value })
                    }
                    className="w-full pl-11 pr-4 py-3.5 bg-slate-800/20 border border-white/5 rounded-2xl text-white font-bold appearance-none hover:bg-slate-800/40 transition-all focus:ring-2 focus:ring-indigo-500/50 outline-none text-sm md:text-base"
                  >
                    <option value="all">All Plans</option>
                    <option value="silver">Silver Tier</option>
                    <option value="gold">Gold Tier</option>
                    <option value="platinum">Platinum Tier</option>
                  </select>
                </div>
                <div className="relative group">
                  <FiCheckCircle className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-400 opacity-60" />
                  <select
                    value={filter.status}
                    onChange={(e) =>
                      setFilter({ ...filter, status: e.target.value })
                    }
                    className="w-full pl-11 pr-4 py-3.5 bg-slate-800/20 border border-white/5 rounded-2xl text-white font-bold appearance-none hover:bg-slate-800/40 transition-all focus:ring-2 focus:ring-indigo-500/50 text-sm md:text-base"
                  >
                    <option value="all">All Status</option>
                    <option value="success">Successful</option>
                    <option value="pending">Pending</option>
                    <option value="failed">Failed</option>
                  </select>
                </div>
                <div className="sm:col-span-2 relative group">
                  <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search transactions..."
                    value={filter.search}
                    onChange={(e) =>
                      setFilter({ ...filter, search: e.target.value })
                    }
                    className="w-full pl-11 pr-4 py-3.5 bg-slate-800/20 border border-white/5 rounded-2xl text-white font-bold hover:bg-slate-800/40 transition-all focus:ring-2 focus:ring-indigo-500/50 outline-none text-sm md:text-base"
                  />
                </div>
              </div>

              <div className="bg-slate-950/40 rounded-3xl border border-white/5 overflow-hidden backdrop-blur-md shadow-2xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-900/50 border-b border-white/5">
                        <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                          User
                        </th>
                        <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                          Plan & Duration
                        </th>
                        <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                          Amount
                        </th>
                        <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                          Status
                        </th>
                        <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                          Date & ID
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {loading ? (
                        <tr>
                          <td
                            colSpan="5"
                            className="px-6 py-20 text-center text-slate-500 font-bold italic animate-pulse"
                          >
                            Loading transactions...
                          </td>
                        </tr>
                      ) : transactions.length === 0 ? (
                        <tr>
                          <td
                            colSpan="5"
                            className="px-6 py-20 text-center text-slate-500 font-bold italic"
                          >
                            No transactions found matching filters.
                          </td>
                        </tr>
                      ) : (
                        transactions.map((t) => (
                          <tr
                            key={t._id}
                            className="hover:bg-white/5 transition-colors group"
                          >
                            <td className="px-6 py-5">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-slate-800 border border-white/5 flex items-center justify-center text-indigo-400 font-black group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                  {t.user?.name?.[0].toUpperCase() || "?"}
                                </div>
                                <div className="min-w-0">
                                  <p className="text-white font-bold text-sm truncate">
                                    {t.user?.name || "Deleted User"}
                                  </p>
                                  <p className="text-slate-500 text-xs truncate font-medium">
                                    {t.user?.email || "N/A"}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-5">
                              <div className="flex flex-col">
                                <span
                                  className={`w-fit px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                                    t.plan === "platinum"
                                      ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-400"
                                      : t.plan === "gold"
                                        ? "bg-yellow-500/10 border-yellow-500/20 text-yellow-400"
                                        : "bg-slate-500/10 border-slate-500/20 text-slate-400"
                                  }`}
                                >
                                  {t.plan}
                                </span>
                                <span className="text-slate-500 text-[10px] font-bold mt-1.5 uppercase tracking-tighter">
                                  {t.durationMonths} Months Access
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-5 font-black text-white text-lg">
                              ₹{t.amount}
                            </td>
                            <td className="px-6 py-5 text-sm font-bold">
                              <span
                                className={`flex items-center gap-2 ${
                                  t.status === "success"
                                    ? "text-emerald-400"
                                    : t.status === "failed"
                                      ? "text-rose-400"
                                      : "text-amber-400"
                                }`}
                              >
                                {t.status === "success" ? (
                                  <FiCheckCircle />
                                ) : t.status === "failed" ? (
                                  <FiXCircle />
                                ) : (
                                  <FiClock />
                                )}
                                <span className="capitalize">{t.status}</span>
                              </span>
                            </td>
                            <td className="px-6 py-5">
                              <p className="text-white font-bold text-xs truncate">
                                {new Date(t.createdAt).toLocaleDateString()}{" "}
                                {new Date(t.createdAt).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </p>
                              <p className="text-slate-500 text-[10px] truncate mt-1">
                                ID:{" "}
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

                <div className="px-6 py-4 bg-slate-900/30 flex items-center justify-between">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-600">
                    Showing page {page} of {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <button
                      disabled={page === 1}
                      onClick={() => setPage((p) => p - 1)}
                      className="px-4 py-2 bg-slate-800 disabled:opacity-30 rounded-xl text-xs font-bold text-white hover:bg-slate-700 transition-all"
                    >
                      Prev
                    </button>
                    <button
                      disabled={page === totalPages}
                      onClick={() => setPage((p) => p + 1)}
                      className="px-4 py-2 bg-indigo-600 disabled:opacity-30 rounded-xl text-xs font-bold text-white hover:bg-indigo-500 transition-all"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "revenue" && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="bg-slate-900/50 p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] border border-white/5 shadow-2xl relative overflow-hidden backdrop-blur-md">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                  <h3 className="text-xl md:text-2xl font-black text-white flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-600/20 flex items-center justify-center text-indigo-400">
                      <FiTrendingUp size={20} />
                    </div>
                    Revenue <span className="text-indigo-400">Growth</span>
                  </h3>
                  
                  <div className="flex bg-slate-800/50 p-1.5 rounded-2xl border border-white/5 w-fit">
                    {["day", "week", "month", "year"].map((p) => (
                      <button
                        key={p}
                        onClick={() => setRevenuePeriod(p)}
                        className={`px-4 md:px-6 py-2 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest transition-all ${
                          revenuePeriod === p
                            ? "bg-indigo-600 text-white shadow-lg"
                            : "text-slate-500 hover:text-white"
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="h-72 md:h-100 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={formatChartData()}>
                      <defs>
                        <linearGradient
                          id="colorTotal"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#6366f1"
                            stopOpacity={0.3}
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
                        stroke="#ffffff05"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="name"
                        stroke="#475569"
                        fontSize={9}
                        fontWeight="bold"
                        tickLine={false}
                        axisLine={false}
                        minTickGap={30}
                      />
                      <YAxis
                        stroke="#475569"
                        fontSize={9}
                        fontWeight="bold"
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(val) => `₹${val}`}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#0f172a",
                          border: "1px solid #ffffff10",
                          borderRadius: "16px",
                          fontWeight: "bold",
                          fontSize: "10px"
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="Total"
                        stroke="#6366f1"
                        strokeWidth={4}
                        fillOpacity={1}
                        fill="url(#colorTotal)"
                      />
                      <Area
                        type="monotone"
                        dataKey="Silver"
                        stroke="#94a3b8"
                        fillOpacity={0}
                        strokeWidth={2}
                      />
                      <Area
                        type="monotone"
                        dataKey="Gold"
                        stroke="#fbbf24"
                        fillOpacity={0}
                        strokeWidth={2}
                      />
                      <Area
                        type="monotone"
                        dataKey="Platinum"
                        stroke="#818cf8"
                        fillOpacity={0}
                        strokeWidth={2}
                      />
                      <Legend
                        iconType="circle"
                        wrapperStyle={{
                          paddingTop: "20px",
                          fontSize: "9px",
                          textTransform: "uppercase",
                          fontWeight: "bold",
                        }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  {
                    label: "Period Revenue",
                    value: revenueData?.summary?.periodRevenue,
                    icon: FiDollarSign,
                    color: "bg-indigo-500",
                  },
                  {
                    label: "Silver Revenue",
                    value: revenueData?.summary?.revenueBreakdown?.silver,
                    icon: FiActivity,
                    color: "bg-slate-500",
                  },
                  {
                    label: "Platinum Revenue",
                    value: revenueData?.summary?.revenueBreakdown?.platinum,
                    icon: FiCheckCircle,
                    color: "bg-indigo-400",
                  },
                ].map((stat, i) => (
                  <div
                    key={i}
                    className="bg-slate-900/50 p-6 rounded-3xl border border-white/5 flex items-center gap-4"
                  >
                    <div
                      className={`w-12 h-12 rounded-2xl ${stat.color} flex items-center justify-center text-white shadow-lg`}
                    >
                      <stat.icon size={22} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                        {stat.label}
                      </p>
                      <p className="text-2xl font-black text-white">
                        ₹{stat.value || 0}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "failed" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="bg-slate-950/40 rounded-[2rem] border border-white/5 overflow-hidden backdrop-blur-xl shadow-2xl">
                <div className="p-6 md:p-8 bg-slate-900/50 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <h3 className="text-xl font-black text-white">
                    Payment <span className="text-rose-400">Failures</span>
                  </h3>
                  <div className="relative group w-full md:w-80">
                    <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="text"
                      placeholder="Search by user email..."
                      value={filter.search}
                      onChange={(e) =>
                        setFilter({ ...filter, search: e.target.value })
                      }
                      className="w-full pl-11 pr-4 py-3 bg-slate-800/30 border border-white/5 rounded-2xl text-white text-sm font-bold transition-all focus:ring-2 focus:ring-rose-500/30 outline-none"
                    />
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-900/50 border-b border-white/5">
                        <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                          User Details
                        </th>
                        <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                          Attempted Plan
                        </th>
                        <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                          Loss Value
                        </th>
                        <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                          Failure Reason
                        </th>
                        <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                          Timestamp
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {loading ? (
                        <tr>
                          <td
                            colSpan="5"
                            className="px-6 py-10 text-center text-slate-500"
                          >
                            Loading failed payments...
                          </td>
                        </tr>
                      ) : failedPayments.length === 0 ? (
                        <tr>
                          <td
                            colSpan="5"
                            className="px-6 py-10 text-center text-slate-500"
                          >
                            No failed payments recorded.
                          </td>
                        </tr>
                      ) : (
                        failedPayments.map((p) => (
                          <tr
                            key={p._id}
                            className="hover:bg-rose-500/5 transition-colors group"
                          >
                            <td className="px-6 py-5">
                              <p className="text-white font-bold text-sm">
                                {p.user?.name || "Unknown User"}
                              </p>
                              <p className="text-slate-500 text-xs">
                                {p.user?.email || "N/A"}
                              </p>
                            </td>
                            <td className="px-6 py-5 uppercase font-black text-slate-400 text-xs">
                              {p.plan} ({p.durationMonths}m)
                            </td>
                            <td className="px-6 py-5 font-black text-rose-400">
                              ₹{p.amount}
                            </td>
                            <td className="px-6 py-5">
                              <span className="text-[11px] font-medium text-slate-300 italic">
                                {p.failureReason || "Payment abandoned/failed"}
                              </span>
                            </td>
                            <td className="px-6 py-5 text-xs text-slate-500 font-bold">
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

          {activeTab === "reports" && (
            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
              {financialReport && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                      {
                        label: "All-Time Revenue",
                        value: `₹${financialReport.allTime.totalRevenue}`,
                        sub: "Total earnings",
                        icon: FiDollarSign,
                        color: "from-indigo-600 to-violet-700",
                        textColor: "text-indigo-400",
                      },
                      {
                        label: "Active Premium",
                        value: financialReport.subscribers.active,
                        sub: "Paying users",
                        icon: FiUsers,
                        color: "from-emerald-500 to-teal-600",
                        textColor: "text-emerald-400",
                      },
                      {
                        label: "Success Rate",
                        value: `${financialReport.transactions.successRate}%`,
                        sub: "Payment health",
                        icon: FiCheckCircle,
                        color: "from-amber-500 to-orange-600",
                        textColor: "text-amber-400",
                      },
                      {
                        label: "Avg. Ticket Size",
                        value: `₹${financialReport.allTime.avgRevenuePerUser}`,
                        sub: "Per sub",
                        icon: FiTrendingUp,
                        color: "from-pink-500 to-rose-600",
                        textColor: "text-rose-400",
                      },
                    ].map((card, i) => (
                      <div
                        key={i}
                        className="group relative bg-slate-900/40 p-6 rounded-4xl border border-white/5 backdrop-blur-xl hover:border-white/10 transition-all duration-300"
                      >
                        <div
                          className={`w-12 h-12 rounded-2xl bg-linear-to-br ${card.color} flex items-center justify-center text-white shadow-xl mb-4 group-hover:scale-110 transition-transform`}
                        >
                          <card.icon size={22} />
                        </div>
                        <p
                          className={`text-[10px] font-black uppercase tracking-[0.2em] ${card.textColor} mb-1`}
                        >
                          {card.label}
                        </p>
                        <h4 className="text-2xl font-black text-white tracking-tight">
                          {card.value}
                        </h4>
                        <p className="text-slate-500 text-[10px] font-medium mt-1">
                          {card.sub}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                    <div className="xl:col-span-2 bg-slate-900/60 p-6 md:p-10 rounded-4xl md:rounded-[3rem] border border-white/5 shadow-2xl relative overflow-hidden backdrop-blur-2xl">
                      <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-600/10 rounded-full blur-[100px]" />

                      <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 relative z-10 gap-6">
                        <div>
                          <h3 className="text-2xl font-black text-white">
                            Financial{" "}
                            <span className="text-indigo-400">Analysis</span>
                          </h3>
                          <p className="text-slate-500 text-xs font-medium mt-1">
                            Growth metrics for period
                          </p>
                        </div>
                        <div className="flex bg-slate-800/50 p-1.5 rounded-2xl border border-white/5 w-fit">
                          {["day", "week", "month", "year"].map((p) => (
                            <button
                              key={p}
                              onClick={() => setReportPeriod(p)}
                              className={`px-4 md:px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                reportPeriod === p
                                  ? "bg-indigo-600 text-white shadow-lg"
                                  : "text-slate-500 hover:text-white"
                              }`}
                            >
                              {p}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 relative z-10">
                        <div className="space-y-8">
                          <div className="p-6 md:p-8 bg-white/5 rounded-4xl border border-white/5 hover:bg-white/[0.07] transition-all text-center md:text-left">
                            <p className="text-[11px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-3">
                              Period Revenue
                            </p>
                            <div className="flex flex-col md:flex-row md:items-baseline gap-2">
                              <span className="text-4xl md:text-5xl font-black text-white tracking-tighter">
                                ₹{financialReport.periodStats.revenue}
                              </span>
                              <span className="text-emerald-400 text-xs font-bold flex items-center justify-center gap-1">
                                <FiTrendingUp size={14} /> +12%
                              </span>
                            </div>
                            <div className="mt-6 flex gap-4">
                              <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full bg-indigo-500 w-[70%]" />
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 md:p-6 bg-slate-800/30 rounded-4xl border border-white/5 text-center">
                              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">
                                Total Txns
                              </p>
                              <p className="text-xl font-black text-white">
                                {financialReport.transactions.total}
                              </p>
                            </div>
                            <div className="p-4 md:p-6 bg-slate-800/30 rounded-4xl border border-white/5 text-center">
                              <p className="text-[9px] font-black text-rose-400 uppercase tracking-widest mb-1">
                                Failed
                              </p>
                              <p className="text-xl font-black text-white">
                                {financialReport.transactions.failed}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col justify-center space-y-6">
                          <h4 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] px-1">
                            Tier Distribution
                          </h4>
                          <div className="space-y-5">
                            {Object.entries(
                              financialReport.subscribers.byPlan,
                            ).map(([plan, count]) => {
                              const total = financialReport.subscribers.active;
                              const pct =
                                total > 0
                                  ? Math.round((count / total) * 100)
                                  : 0;
                              return (
                                <div key={plan} className="group px-1">
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                      <div
                                        className={`w-2 h-2 rounded-full ${
                                          plan === "platinum"
                                            ? "bg-indigo-500"
                                            : plan === "gold"
                                              ? "bg-amber-500"
                                              : "bg-slate-400"
                                        }`}
                                      />
                                      <span className="text-[10px] font-black text-white uppercase tracking-widest">
                                        {plan}
                                      </span>
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-500">
                                      {pct}%
                                    </span>
                                  </div>
                                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                    <div
                                      className={`h-full rounded-full transition-all duration-1000 ${
                                        plan === "platinum"
                                          ? "bg-indigo-500"
                                          : plan === "gold"
                                            ? "bg-amber-500"
                                            : "bg-slate-400"
                                      }`}
                                      style={{ width: `${pct}%` }}
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-950/40 p-6 md:p-10 rounded-4xl md:rounded-[3rem] border border-white/5 shadow-2xl backdrop-blur-md flex flex-col justify-between">
                      <div>
                        <h3 className="text-xl font-black text-white mb-2">
                          Subscriber{" "}
                          <span className="text-indigo-400">Retention</span>
                        </h3>
                        <p className="text-slate-500 text-xs font-medium mb-10">
                          Churn & health analysis
                        </p>

                        <div className="space-y-6 md:space-y-8">
                          <div className="flex items-center justify-between p-5 md:p-6 bg-white/2 rounded-3xl border border-white/5">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                                <FiCheckCircle size={20} />
                              </div>
                              <div>
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                                  Active
                                </p>
                                <p className="text-xl font-black text-white">
                                  {financialReport.subscribers.active}
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between p-5 md:p-6 bg-white/2 rounded-3xl border border-white/5">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-400">
                                <FiXCircle size={20} />
                              </div>
                              <div>
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                                  Expired
                                </p>
                                <p className="text-xl font-black text-white">
                                  {financialReport.subscribers.expired}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="mt-10 p-5 md:p-6 bg-indigo-600/10 rounded-3xl border border-indigo-500/20">
                        <div className="flex items-center gap-3 mb-2">
                          <FiActivity className="text-indigo-400" size={16} />
                          <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">
                            Recommendation
                          </p>
                        </div>
                        <p className="text-[11px] text-slate-300 font-medium leading-relaxed">
                          Tier{" "}
                          <span className="text-white font-bold italic">
                            Platinum
                          </span>{" "}
                          conversion is up 5%. Launch a 12-month bundle for Silver users.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-center">
                    <button
                      onClick={handleExportReport}
                      className="px-6 md:px-10 py-4 md:py-5 bg-linear-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white rounded-2xl font-bold tracking-wide shadow-xl shadow-indigo-500/10 transition-all active:scale-[0.98] flex items-center justify-center gap-3 border border-white/10 w-full md:w-auto text-sm md:text-base"
                    >
                      <FiDownload size={20} />
                      <span>Download Financial CSV Report</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminSubscriptions;
