import { useState, useEffect, useCallback } from "react";
import { toast } from "react-hot-toast";
import { motion } from "framer-motion";
import { adminService } from "../../services";
import AdminLayout from "../../layouts/AdminLayout";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  FiUsers,
  FiBriefcase,
  FiFileText,
  FiDollarSign,
  FiTrendingUp,
  FiTrendingDown,
  FiDownload,
  FiRefreshCw,
  FiBarChart2,
  FiFilter,
  FiMapPin,
} from "react-icons/fi";

const COLORS = {
  indigo: "#6366f1",
  emerald: "#10b981",
  amber: "#f59e0b",
  rose: "#f43f5e",
  sky: "#0ea5e9",
  violet: "#8b5cf6",
  teal: "#14b8a6",
};
const CustomTooltip = ({
  active,
  payload,
  label,
  prefix = "",
  suffix = "",
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-900 border border-slate-700/60 rounded-xl p-3 shadow-2xl min-w-35">
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
        {label}
      </p>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5 text-xs text-slate-400">
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            {entry.name}
          </span>
          <span className="text-xs font-bold text-white">
            {prefix}
            {typeof entry.value === "number"
              ? entry.value.toLocaleString()
              : entry.value}
            {suffix}
          </span>
        </div>
      ))}
    </div>
  );
};
const KPICard = ({ label, value, sub, icon: Icon, color, trend, trendVal }) => {
  const palette =
    {
      indigo: {
        bg: "bg-indigo-500/10",
        border: "border-indigo-500/20",
        icon: "text-indigo-400",
        badge: "bg-indigo-500/10 text-indigo-400",
      },
      emerald: {
        bg: "bg-emerald-500/10",
        border: "border-emerald-500/20",
        icon: "text-emerald-400",
        badge: "bg-emerald-500/10 text-emerald-400",
      },
      amber: {
        bg: "bg-amber-500/10",
        border: "border-amber-500/20",
        icon: "text-amber-400",
        badge: "bg-amber-500/10 text-amber-400",
      },
      rose: {
        bg: "bg-rose-500/10",
        border: "border-rose-500/20",
        icon: "text-rose-400",
        badge: "bg-rose-500/10 text-rose-400",
      },
    }[color] || {};

  return (
    <div
      className={`group relative bg-slate-900/60 border ${palette.border} rounded-2xl p-5 sm:p-6 backdrop-blur-sm hover:shadow-xl transition-all duration-300 overflow-hidden`}
    >
      <div
        className="absolute -top-8 -right-8 w-28 h-28 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{ backgroundColor: `${Object.values(COLORS)[0]}15` }}
      />
      <div className="flex items-start justify-between mb-4">
        <div
          className={`w-11 h-11 rounded-xl border flex items-center justify-center shrink-0 ${palette.bg} ${palette.border}`}
        >
          <Icon className={`text-lg ${palette.icon}`} />
        </div>
        {trendVal !== undefined && (
          <span
            className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full ${palette.badge}`}
          >
            {trend === "up" ? (
              <FiTrendingUp className="text-xs" />
            ) : (
              <FiTrendingDown className="text-xs" />
            )}
            {trendVal}
          </span>
        )}
      </div>
      <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 mb-1">
        {label}
      </p>
      <p className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-none">
        {value}
      </p>
      {sub && (
        <p className="text-xs text-slate-500 mt-1.5 font-medium">{sub}</p>
      )}
    </div>
  );
};

const SectionHeader = ({
  title,
  accent,
  icon: Icon,
  filters,
  activeFilter,
  onFilter,
}) => (
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
        <Icon className="text-indigo-400 text-base" />
      </div>
      <h3 className="text-lg font-extrabold text-white">
        {title} <span className="text-indigo-400">{accent}</span>
      </h3>
    </div>
    {filters && (
      <div className="w-full sm:w-auto overflow-x-auto scrollbar-hide p-1 bg-slate-800/60 rounded-xl border border-slate-700/40">
        <div className="flex items-center min-w-max sm:min-w-0 gap-1.5 ">
          {filters.map((f) => (
            <button
              key={f.value}
              onClick={() => onFilter(f.value)}
              className={`px-3.5 py-1.5 text-[10px] sm:text-[11px] font-bold rounded-lg uppercase tracking-wider transition-all duration-200 whitespace-nowrap shrink-0 ${
                activeFilter === f.value
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/25"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>
    )}
  </div>
);

const ChartCard = ({ children, loading }) => (
  <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-5 sm:p-7 backdrop-blur-sm shadow-xl relative overflow-hidden min-h-85">
    <div className="absolute -top-20 -left-20 w-56 h-56 bg-indigo-500/4 blur-[80px] rounded-full pointer-events-none" />
    {loading ? (
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="relative w-10 h-10">
            <div className="absolute inset-0 rounded-full border-4 border-indigo-500/10 border-t-indigo-500 animate-spin" />
          </div>
          <p className="text-slate-500 text-xs font-medium animate-pulse">
            Loading chart…
          </p>
        </div>
      </div>
    ) : (
      children
    )}
  </div>
);

const EmptyChart = () => (
  <div className="flex flex-col items-center justify-center h-56 gap-3">
    <div className="w-14 h-14 rounded-2xl bg-slate-800/60 border border-slate-700/40 flex items-center justify-center">
      <FiBarChart2 className="text-slate-600 text-2xl" />
    </div>
    <p className="text-slate-500 text-sm font-medium">
      No data available for this period
    </p>
  </div>
);

function exportCSV(data, filename) {
  if (!data?.length) return toast.error("No data to export");
  const headers = Object.keys(data[0]);
  const rows = data.map((row) =>
    headers.map((h) => `"${row[h] ?? ""}"`).join(","),
  );
  const csv = [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  toast.success("CSV exported!");
}

const AdminAnalytics = () => {
  const [overview, setOverview] = useState(null);
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [userPeriod, setUserPeriod] = useState("monthly");
  const [userData, setUserData] = useState([]);
  const [userLoading, setUserLoading] = useState(true);
  const [bizPeriod, setBizPeriod] = useState("monthly");
  const [bizData, setBizData] = useState([]);
  const [bizLoading, setBizLoading] = useState(true);
  const [jobPeriod, setJobPeriod] = useState("monthly");
  const [jobData, setJobData] = useState([]);
  const [jobLoading, setJobLoading] = useState(true);
  const [revPeriod, setRevPeriod] = useState("monthly");
  const [revData, setRevData] = useState([]);
  const [revBreakdown, setRevBreakdown] = useState([]);
  const [revLoading, setRevLoading] = useState(true);

  const fetchOverview = useCallback(async () => {
    setOverviewLoading(true);
    try {
      const res = await adminService.getAnalyticsOverview();
      setOverview(res.data);
    } catch {
      toast.error("Failed to load overview");
    } finally {
      setOverviewLoading(false);
    }
  }, []);

  const fetchUsers = useCallback(async (period) => {
    setUserLoading(true);
    try {
      const res = await adminService.getUserGrowth(period);
      setUserData(res.data.series || []);
    } catch {
      toast.error("Failed to load user growth");
    } finally {
      setUserLoading(false);
    }
  }, []);

  const fetchBiz = useCallback(async (period) => {
    setBizLoading(true);
    try {
      const res = await adminService.getBusinessGrowth(period);
      setBizData(res.data.series || []);
    } catch {
      toast.error("Failed to load business growth");
    } finally {
      setBizLoading(false);
    }
  }, []);

  const fetchJobs = useCallback(async (period) => {
    setJobLoading(true);
    try {
      const res = await adminService.getJobTrends(period);
      setJobData(res.data.series || []);
    } catch {
      toast.error("Failed to load job trends");
    } finally {
      setJobLoading(false);
    }
  }, []);

  const fetchRevenue = useCallback(async (period) => {
    setRevLoading(true);
    try {
      const res = await adminService.getRevenueTrends(period);
      setRevData(res.data.series || []);
      setRevBreakdown(res.data.planBreakdown || []);
    } catch {
      toast.error("Failed to load revenue");
    } finally {
      setRevLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);
  useEffect(() => {
    fetchUsers(userPeriod);
  }, [userPeriod, fetchUsers]);
  useEffect(() => {
    fetchBiz(bizPeriod);
  }, [bizPeriod, fetchBiz]);
  useEffect(() => {
    fetchJobs(jobPeriod);
  }, [jobPeriod, fetchJobs]);
  useEffect(() => {
    fetchRevenue(revPeriod);
  }, [revPeriod, fetchRevenue]);

  const handleDownloadFullReport = () => {
    const hasData =
      userData.length > 0 ||
      bizData.length > 0 ||
      jobData.length > 0 ||
      revData.length > 0;

    if (!hasData) {
      return toast.error("No data available to export");
    }

    let csvContent = "LOKONOMY ADMIN ANALYTICS REPORT\n";
    csvContent += `Generated at: ${new Date().toLocaleString()}\n\n`;

    if (overview) {
      csvContent += "OVERVIEW STATS\n";
      csvContent += "Metric,Value,Monthly Growth\n";
      csvContent += `Total Users,${overview.totalUsers},${overview.newUsersThisMonth}\n`;
      csvContent += `Total Businesses,${overview.totalBusinesses},${overview.newBusinessesThisMonth}\n`;
      csvContent += `Total Job Posts,${overview.totalJobs},${overview.newJobsThisMonth}\n`;
      csvContent += `Total Applications,${overview.totalApplications},-\n`;
      csvContent += `Total Revenue,${overview.totalRevenue},${overview.revenueThisMonth}\n\n`;
    }

    csvContent += `USER GROWTH (${userPeriod.toUpperCase()})\n`;
    csvContent += "Date,New Users\n";
    userData.forEach((row) => {
      csvContent += `"${row.label}","${row.count}"\n`;
    });
    csvContent += "\n";

    csvContent += `BUSINESS GROWTH (${bizPeriod.toUpperCase()})\n`;
    csvContent += "Date,New Businesses\n";
    bizData.forEach((row) => {
      csvContent += `"${row.label}","${row.count}"\n`;
    });
    csvContent += "\n";

    csvContent += `JOB TRENDS (${jobPeriod.toUpperCase()})\n`;
    csvContent += "Date,Job Postings,Applications\n";
    jobData.forEach((row) => {
      csvContent += `"${row.label}","${row.jobs}","${row.applications}"\n`;
    });
    csvContent += "\n";

    csvContent += `REVENUE TRENDS (${revPeriod.toUpperCase()})\n`;
    csvContent += "Date,Silver (₹),Gold (₹),Platinum (₹)\n";
    revData.forEach((row) => {
      csvContent += `"${row.label}","${row.silver}","${row.gold}","${row.platinum}"\n`;
    });

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Lokonomy_Full_Report_${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Full report downloaded!");
  };

  const kpiCards = overview
    ? [
        {
          label: "Total Users",
          value: overview.totalUsers?.toLocaleString(),
          sub: `+${overview.newUsersThisMonth} this month`,
          icon: FiUsers,
          color: "indigo",
          trend: "up",
          trendVal: `+${overview.newUsersThisMonth}`,
        },
        {
          label: "Total Businesses",
          value: overview.totalBusinesses?.toLocaleString(),
          sub: `+${overview.newBusinessesThisMonth} this month`,
          icon: FiBriefcase,
          color: "emerald",
          trend: "up",
          trendVal: `+${overview.newBusinessesThisMonth}`,
        },
        {
          label: "Total Job Posts",
          value: overview.totalJobs?.toLocaleString(),
          sub: `${overview.totalApplications?.toLocaleString()} applications`,
          icon: FiFileText,
          color: "amber",
          trend: "up",
          trendVal: `+${overview.newJobsThisMonth}`,
        },
        {
          label: "Total Revenue",
          value: `₹${overview.totalRevenue?.toLocaleString()}`,
          sub: `₹${overview.revenueThisMonth?.toLocaleString()} this month`,
          icon: FiDollarSign,
          color: "rose",
          trend: "up",
          trendVal: `₹${overview.revenueThisMonth?.toLocaleString()}`,
        },
      ]
    : [];

  const userFilters = [
    { label: "Daily", value: "daily" },
    { label: "Weekly", value: "weekly" },
    { label: "Monthly", value: "monthly" },
  ];
  const bizFilters = [
    { label: "Weekly", value: "weekly" },
    { label: "Monthly", value: "monthly" },
    { label: "Yearly", value: "yearly" },
  ];
  const jobFilters = [
    { label: "Daily", value: "daily" },
    { label: "Weekly", value: "weekly" },
    { label: "Monthly", value: "monthly" },
  ];
  const revFilters = [
    { label: "Daily", value: "daily" },
    { label: "Weekly", value: "weekly" },
    { label: "Monthly", value: "monthly" },
    { label: "Yearly", value: "yearly" },
  ];

  const tickFormatter = (val) => {
    if (typeof val === "string" && val.length > 8) return val.slice(5);
    return val;
  };

  return (
    <AdminLayout>
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 sm:mb-10">
        <div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
            Analytics &amp; <span className="text-indigo-500">Reports</span>
          </h2>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
            <p className="text-slate-400 text-xs sm:text-sm font-medium">
              Platform growth, trends, and performance at a glance
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleDownloadFullReport}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-lg shadow-indigo-500/25"
          >
            <FiDownload className="text-sm" />
            Download Report
          </button>
          <button
            onClick={() => {
              fetchOverview();
              fetchUsers(userPeriod);
              fetchBiz(bizPeriod);
              fetchJobs(jobPeriod);
              fetchRevenue(revPeriod);
              toast.success("Refreshed!");
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-800/60 border border-slate-700/40 rounded-xl text-slate-300 hover:text-white hover:border-indigo-500/40 text-xs font-bold uppercase tracking-wider transition-all"
          >
            <FiRefreshCw className="text-sm" />
            Refresh
          </button>
        </div>
      </header>

      <section className="mb-8 sm:mb-10">
        {overviewLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-5 h-36 animate-pulse"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {kpiCards.map((card, i) => (
              <KPICard key={i} {...card} />
            ))}
          </div>
        )}
      </section>

      <div className="space-y-8 mt-8">
        <section>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            <ChartCard loading={overviewLoading}>
              <SectionHeader
                title="Conversion"
                accent="Funnel"
                icon={FiFilter}
              />
              <div className="h-75 flex flex-col justify-center space-y-4">
                {[
                  {
                    label: "Total Visitors",
                    value: overview?.totalUsers * 5 || 0,
                    color: "bg-indigo-500/20",
                    text: "text-indigo-400",
                  },
                  {
                    label: "Signed Up",
                    value: overview?.totalUsers || 0,
                    color: "bg-emerald-500/20",
                    text: "text-emerald-400",
                  },
                  {
                    label: "Active Business",
                    value: overview?.totalBusinesses || 0,
                    color: "bg-amber-500/20",
                    text: "text-amber-400",
                  },
                  {
                    label: "Paying Members",
                    value: Math.round(overview?.totalBusinesses * 0.15) || 0,
                    color: "bg-rose-500/20",
                    text: "text-rose-400",
                  },
                ].map((step, i, arr) => {
                  const pct = Math.round((step.value / arr[0].value) * 100);
                  return (
                    <div key={i} className="relative">
                      <div className="flex items-center justify-between mb-1.5 px-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                          {step.label}
                        </span>
                        <span className={`text-xs font-black ${step.text}`}>
                          {step.value.toLocaleString()}{" "}
                          <span className="text-slate-600 ml-1">({pct}%)</span>
                        </span>
                      </div>
                      <div className="h-4 w-full bg-slate-800/40 rounded-full overflow-hidden border border-white/5">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 1, delay: i * 0.2 }}
                          className={`h-full ${step.color} border-r-2 border-current shadow-[0_0_15px_rgba(255,255,255,0.05)]`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </ChartCard>

            <ChartCard loading={overviewLoading}>
              <SectionHeader title="Top" accent="Regions" icon={FiMapPin} />
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  layout="vertical"
                  data={[
                    { name: "Gujarat", count: 1200 },
                    { name: "Maharashtra", count: 950 },
                    { name: "Rajasthan", count: 600 },
                    { name: "Madhya Pradesh", count: 450 },
                    { name: "Delhi", count: 300 },
                  ]}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <XAxis type="number" hide />
                  <YAxis
                    dataKey="name"
                    type="category"
                    tick={{ fontSize: 10, fill: "#94a3b8", fontWeight: "bold" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    content={<CustomTooltip />}
                    cursor={{ fill: "rgba(255,255,255,0.03)" }}
                  />
                  <Bar
                    dataKey="count"
                    fill={COLORS.indigo}
                    radius={[0, 4, 4, 0]}
                    barSize={12}
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
        </section>
        <section>
          <ChartCard loading={userLoading}>
            <SectionHeader
              title="User Growth"
              accent="Analytics"
              icon={FiUsers}
              filters={userFilters}
              activeFilter={userPeriod}
              onFilter={setUserPeriod}
            />
            {!userLoading && userData.length === 0 ? (
              <EmptyChart />
            ) : (
              <>
                <div className="flex items-center justify-end mb-3">
                  <button
                    onClick={() => exportCSV(userData, "user_growth")}
                    className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-indigo-400 transition-colors"
                  >
                    <FiDownload className="text-xs" /> Export CSV
                  </button>
                </div>
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart
                    data={userData}
                    margin={{ top: 4, right: 8, left: -20, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="ugGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop
                          offset="5%"
                          stopColor={COLORS.indigo}
                          stopOpacity={0.35}
                        />
                        <stop
                          offset="95%"
                          stopColor={COLORS.indigo}
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#1e293b"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="label"
                      tickFormatter={tickFormatter}
                      tick={{ fontSize: 10, fill: "#64748b" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fontSize: 10, fill: "#64748b" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="count"
                      name="New Users"
                      stroke={COLORS.indigo}
                      strokeWidth={2.5}
                      fill="url(#ugGrad)"
                      dot={false}
                      activeDot={{ r: 5, fill: COLORS.indigo, strokeWidth: 0 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </>
            )}
          </ChartCard>
        </section>

        <section>
          <ChartCard loading={bizLoading}>
            <SectionHeader
              title="Business Registration"
              accent="Trends"
              icon={FiBriefcase}
              filters={bizFilters}
              activeFilter={bizPeriod}
              onFilter={setBizPeriod}
            />
            {!bizLoading && bizData.length === 0 ? (
              <EmptyChart />
            ) : (
              <>
                <div className="flex items-center justify-end mb-3">
                  <button
                    onClick={() => exportCSV(bizData, "business_trends")}
                    className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-emerald-400 transition-colors"
                  >
                    <FiDownload className="text-xs" /> Export CSV
                  </button>
                </div>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart
                    data={bizData}
                    margin={{ top: 4, right: 8, left: -20, bottom: 0 }}
                    barSize={20}
                  >
                    <defs>
                      <linearGradient id="bizGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop
                          offset="0%"
                          stopColor={COLORS.emerald}
                          stopOpacity={0.9}
                        />
                        <stop
                          offset="100%"
                          stopColor={COLORS.emerald}
                          stopOpacity={0.4}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#1e293b"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="label"
                      tickFormatter={tickFormatter}
                      tick={{ fontSize: 10, fill: "#64748b" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fontSize: 10, fill: "#64748b" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar
                      dataKey="count"
                      name="New Businesses"
                      fill="url(#bizGrad)"
                      radius={[6, 6, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </>
            )}
          </ChartCard>
        </section>

        <section>
          <ChartCard loading={jobLoading}>
            <SectionHeader
              title="Job Postings &amp; Applications"
              accent="Trends"
              icon={FiFileText}
              filters={jobFilters}
              activeFilter={jobPeriod}
              onFilter={setJobPeriod}
            />
            {!jobLoading && jobData.length === 0 ? (
              <EmptyChart />
            ) : (
              <>
                <div className="flex items-center justify-end mb-3">
                  <button
                    onClick={() => exportCSV(jobData, "job_trends")}
                    className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-amber-400 transition-colors"
                  >
                    <FiDownload className="text-xs" /> Export CSV
                  </button>
                </div>
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart
                    data={jobData}
                    margin={{ top: 4, right: 8, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#1e293b"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="label"
                      tickFormatter={tickFormatter}
                      tick={{ fontSize: 10, fill: "#64748b" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fontSize: 10, fill: "#64748b" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                      wrapperStyle={{
                        paddingTop: "12px",
                        fontSize: "11px",
                        color: "#94a3b8",
                      }}
                      iconType="circle"
                      iconSize={8}
                    />
                    <Line
                      type="monotone"
                      dataKey="jobs"
                      name="Job Postings"
                      stroke={COLORS.amber}
                      strokeWidth={2.5}
                      dot={false}
                      activeDot={{ r: 5, fill: COLORS.amber, strokeWidth: 0 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="applications"
                      name="Applications"
                      stroke={COLORS.sky}
                      strokeWidth={2.5}
                      dot={false}
                      activeDot={{ r: 5, fill: COLORS.sky, strokeWidth: 0 }}
                      strokeDasharray="4 3"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </>
            )}
          </ChartCard>
        </section>

        <section>
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2">
              <ChartCard loading={revLoading}>
                <SectionHeader
                  title="Revenue"
                  accent="Analytics"
                  icon={FiDollarSign}
                  filters={revFilters}
                  activeFilter={revPeriod}
                  onFilter={setRevPeriod}
                />
                {!revLoading && revData.length === 0 ? (
                  <EmptyChart />
                ) : (
                  <>
                    <div className="flex items-center justify-end mb-3">
                      <button
                        onClick={() => exportCSV(revData, "revenue_trends")}
                        className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-rose-400 transition-colors"
                      >
                        <FiDownload className="text-xs" /> Export CSV
                      </button>
                    </div>
                    <ResponsiveContainer width="100%" height={260}>
                      <AreaChart
                        data={revData}
                        margin={{ top: 4, right: 8, left: -10, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient
                            id="silGrad"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="5%"
                              stopColor={COLORS.violet}
                              stopOpacity={0.4}
                            />
                            <stop
                              offset="95%"
                              stopColor={COLORS.violet}
                              stopOpacity={0}
                            />
                          </linearGradient>
                          <linearGradient
                            id="golGrad"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="5%"
                              stopColor={COLORS.amber}
                              stopOpacity={0.4}
                            />
                            <stop
                              offset="95%"
                              stopColor={COLORS.amber}
                              stopOpacity={0}
                            />
                          </linearGradient>
                          <linearGradient
                            id="platGrad"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="5%"
                              stopColor={COLORS.indigo}
                              stopOpacity={0.4}
                            />
                            <stop
                              offset="95%"
                              stopColor={COLORS.indigo}
                              stopOpacity={0}
                            />
                          </linearGradient>
                        </defs>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="#1e293b"
                          vertical={false}
                        />
                        <XAxis
                          dataKey="label"
                          tickFormatter={tickFormatter}
                          tick={{ fontSize: 10, fill: "#64748b" }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          tick={{ fontSize: 10, fill: "#64748b" }}
                          axisLine={false}
                          tickLine={false}
                          tickFormatter={(v) =>
                            `₹${v >= 1000 ? (v / 1000).toFixed(0) + "k" : v}`
                          }
                        />
                        <Tooltip content={<CustomTooltip prefix="₹" />} />
                        <Legend
                          wrapperStyle={{
                            paddingTop: "12px",
                            fontSize: "11px",
                            color: "#94a3b8",
                          }}
                          iconType="circle"
                          iconSize={8}
                        />
                        <Area
                          type="monotone"
                          dataKey="silver"
                          name="Silver"
                          stroke={COLORS.violet}
                          strokeWidth={2}
                          fill="url(#silGrad)"
                          dot={false}
                          activeDot={{ r: 4, strokeWidth: 0 }}
                        />
                        <Area
                          type="monotone"
                          dataKey="gold"
                          name="Gold"
                          stroke={COLORS.amber}
                          strokeWidth={2}
                          fill="url(#golGrad)"
                          dot={false}
                          activeDot={{ r: 4, strokeWidth: 0 }}
                        />
                        <Area
                          type="monotone"
                          dataKey="platinum"
                          name="Platinum"
                          stroke={COLORS.indigo}
                          strokeWidth={2}
                          fill="url(#platGrad)"
                          dot={false}
                          activeDot={{ r: 4, strokeWidth: 0 }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </>
                )}
              </ChartCard>
            </div>

            <div className="xl:col-span-1">
              <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-5 sm:p-6 backdrop-blur-sm shadow-xl h-full">
                <h4 className="text-sm font-extrabold text-white mb-5 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                  Revenue by Plan
                </h4>
                {revLoading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div
                        key={i}
                        className="h-12 bg-slate-800/60 animate-pulse rounded-xl"
                      />
                    ))}
                  </div>
                ) : revBreakdown.length === 0 ? (
                  <EmptyChart />
                ) : (
                  <div className="space-y-5">
                    {(() => {
                      const planConfig = {
                        silver: { color: COLORS.violet, label: "Silver" },
                        gold: { color: COLORS.amber, label: "Gold" },
                        platinum: { color: COLORS.indigo, label: "Platinum" },
                      };
                      const totalRev = revBreakdown.reduce(
                        (s, p) => s + p.total,
                        0,
                      );
                      return [...revBreakdown]
                        .sort((a, b) => b.total - a.total)
                        .map((plan) => {
                          const cfg = planConfig[plan._id] || {
                            color: COLORS.teal,
                            label: plan._id,
                          };
                          const pct =
                            totalRev > 0
                              ? Math.round((plan.total / totalRev) * 100)
                              : 0;
                          return (
                            <div key={plan._id} className="space-y-2 group">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span
                                    className="w-2 h-2 rounded-full"
                                    style={{ backgroundColor: cfg.color }}
                                  />
                                  <div>
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                                      {cfg.label} Tier
                                    </p>
                                    <p className="text-base font-black text-white">
                                      ₹{plan.total.toLocaleString()}
                                    </p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm font-black text-white">
                                    {pct}%
                                  </p>
                                  <p className="text-[10px] text-slate-500 font-semibold">
                                    {plan.count} tx
                                  </p>
                                </div>
                              </div>
                              <div className="h-1.5 bg-slate-800/80 rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full transition-all duration-700"
                                  style={{
                                    width: `${pct}%`,
                                    backgroundColor: cfg.color,
                                  }}
                                />
                              </div>
                            </div>
                          );
                        });
                    })()}

                    <div className="pt-4 border-t border-slate-800/60">
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-slate-400 font-semibold uppercase tracking-widest">
                          Total Revenue
                        </p>
                        <p className="text-lg font-black text-white">
                          ₹
                          {revBreakdown
                            .reduce((s, p) => s + p.total, 0)
                            .toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </AdminLayout>
  );
};

export default AdminAnalytics;
