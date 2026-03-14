import { useEffect, useState } from "react";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
  Bar,
  BarChart,
  ReferenceLine,
  Cell,
} from "recharts";
import { growthService } from "../../services";
import {
  Lock,
  TrendingUp,
  TrendingDown,
  Users,
  Eye,
  Activity,
  BarChart2,
  Zap,
  Calendar,
  Award,
} from "lucide-react";
import { motion } from "framer-motion";

const BusinessAnalytics = ({ businessId, plan }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isLocked, setIsLocked] = useState(false);
  const [activeChart, setActiveChart] = useState("area");
  const [stats, setStats] = useState({
    total: 0,
    growth: 0,
    peak: 0,
    peakDay: "",
    avg: 0,
    thisWeek: 0,
    lastWeek: 0,
  });

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await growthService.getAnalytics(businessId);
        const rawData = res.data.dailyVisits;
        const total = res.data.visits || 0;

        const chartData = rawData.map((v) => ({
          name: v.date,
          views: v.count,
        }));

        let growth = 0,
          thisWeek = 0,
          lastWeek = 0;

        if (chartData.length >= 14) {
          thisWeek = chartData.slice(-7).reduce((a, c) => a + c.views, 0);
          lastWeek = chartData.slice(-14, -7).reduce((a, c) => a + c.views, 0);
          growth =
            lastWeek === 0
              ? 100
              : Math.round(((thisWeek - lastWeek) / lastWeek) * 100);
        } else if (chartData.length > 0) {
          thisWeek = chartData.reduce((a, c) => a + c.views, 0);
        }

        const peakEntry = chartData.reduce(
          (max, v) => (v.views > max.views ? v : max),
          chartData[0] || { views: 0, name: "" }
        );

        const avg =
          chartData.length > 0
            ? Math.round(chartData.reduce((s, v) => s + v.views, 0) / chartData.length)
            : 0;

        setStats({ total, growth, peak: peakEntry?.views || 0, peakDay: peakEntry?.name || "", avg, thisWeek, lastWeek });
        setData(chartData);
      } catch (err) {
        if (err.response?.status === 403) setIsLocked(true);
        console.error("Error fetching analytics:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [businessId]);

  const formatDate = (str) => {
    try {
      return new Date(str).toLocaleDateString("en-US", { day: "numeric", month: "short" });
    } catch {
      return str;
    }
  };


  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#0a0e1d] border border-indigo-500/30 rounded-2xl px-4 py-3 shadow-2xl">
          <p className="text-indigo-400 text-[10px] font-bold uppercase tracking-widest mb-1">
            {formatDate(label)}
          </p>
          <p className="text-white font-bold text-lg flex items-center gap-2">
            <Eye size={13} className="text-indigo-400" />
            {payload[0].value}
            <span className="text-slate-500 text-xs font-normal">views</span>
          </p>
        </div>
      );
    }
    return null;
  };
  const LockedOverlay = () => (
    <div className="relative rounded-3xl bg-linear-to-br from-[#0a0f1d] to-[#0d1020] border border-white/5 p-16 overflow-hidden flex flex-col items-center">
      <div className="absolute inset-0 opacity-10 blur-sm pointer-events-none">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={[{ v: 10 }, { v: 30 }, { v: 20 }, { v: 50 }, { v: 40 }, { v: 70 }, { v: 55 }]}>
            <Area type="monotone" dataKey="v" stroke="#818cf8" fill="#4f46e5" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="relative z-10 flex flex-col items-center text-center max-w-sm">
        <div className="w-20 h-20 rounded-full bg-yellow-500/10 border-2 border-yellow-500/25 flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(234,179,8,0.15)]">
          <Lock size={32} className="text-yellow-400" />
        </div>
        <h3 className="text-white text-2xl font-extrabold mb-3">Premium Insights</h3>
        <p className="text-slate-500 text-sm leading-relaxed mb-8">
          Unlock granular visitor analytics, growth trends, and performance
          tracking with our{" "}
          <span className="text-yellow-400 font-bold">Gold Plan</span>.
        </p>
        <button className="bg-linear-to-r from-yellow-400 to-amber-500 text-black font-extrabold px-10 py-3.5 rounded-full hover:scale-105 active:scale-95 transition-all shadow-lg shadow-yellow-500/30">
          Upgrade to Gold
        </button>
      </div>
    </div>
  );

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center h-60 gap-4">
        <div className="w-9 h-9 rounded-full border-[3px] border-indigo-500/20 border-t-indigo-500 animate-spin" />
        <p className="text-slate-500 text-[11px] font-bold uppercase tracking-widest animate-pulse">
          Loading analytics…
        </p>
      </div>
    );

  if (isLocked) return <LockedOverlay />;

  const growthUp = stats.growth >= 0;
  const recentData = data.slice(-14);
  const weekMax = Math.max(stats.thisWeek, stats.lastWeek, 1);

  const kpiCards = [
    {
      label: "Total Visitors",
      value: stats.total.toLocaleString(),
      icon: <Users size={17} />,
      colorText: "text-indigo-400",
      colorBg: "bg-indigo-500/10",
      colorBorder: "border-indigo-500/20",
      sub: "All time",
    },
    {
      label: "This Week",
      value: stats.thisWeek.toLocaleString(),
      icon: <Eye size={17} />,
      colorText: "text-cyan-400",
      colorBg: "bg-cyan-500/10",
      colorBorder: "border-cyan-500/20",
      sub: "Last 7 days",
    },
    {
      label: "Weekly Growth",
      value: `${growthUp ? "+" : ""}${stats.growth}%`,
      icon: growthUp ? <TrendingUp size={17} /> : <TrendingDown size={17} />,
      colorText: growthUp ? "text-emerald-400" : "text-red-400",
      colorBg: growthUp ? "bg-emerald-500/10" : "bg-red-500/10",
      colorBorder: growthUp ? "border-emerald-500/20" : "border-red-500/20",
      sub: "vs last week",
    },
    {
      label: "Daily Average",
      value: stats.avg.toLocaleString(),
      icon: <Activity size={17} />,
      colorText: "text-orange-400",
      colorBg: "bg-orange-500/10",
      colorBorder: "border-orange-500/20",
      sub: "Per day",
    },
    {
      label: "Peak Day",
      value: stats.peak.toLocaleString(),
      icon: <Award size={17} />,
      colorText: "text-violet-400",
      colorBg: "bg-violet-500/10",
      colorBorder: "border-violet-500/20",
      sub: stats.peakDay ? formatDate(stats.peakDay) : "N/A",
    },
  ];


  return (
    <div className="bg-linear-to-br from-[#080e1a] via-[#0a1020] to-[#080c18] rounded-3xl border border-white/[0.07] p-8 shadow-[0_24px_80px_rgba(0,0,0,0.6)] flex flex-col gap-7">

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/15 border border-indigo-500/25 flex items-center justify-center text-indigo-400">
              <BarChart2 size={15} />
            </div>
            <span className="text-indigo-400 text-[10px] font-bold uppercase tracking-[2px]">
              Growth Dashboard
            </span>
          </div>
          <h2 className="text-white text-[26px] font-extrabold tracking-tight leading-tight m-0">
            Analytics Overview
          </h2>
          <p className="text-slate-500 text-[13px] mt-1">
            Track how your business is performing over time
          </p>
        </div>

        <div className="flex bg-white/4 border border-white/[0.07] rounded-2xl p-1 gap-1">
          {[
            { id: "area", label: "Area", icon: <Activity size={12} /> },
            { id: "bar",  label: "Bar",  icon: <BarChart2 size={12} /> },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveChart(t.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-[11px] font-bold transition-all border-none cursor-pointer
                ${activeChart === t.id
                  ? "bg-indigo-600 text-white shadow-md"
                  : "text-slate-500 hover:text-slate-300 bg-transparent"
                }`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {kpiCards.map((card, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            className={`${card.colorBg} border ${card.colorBorder} rounded-2xl p-4 flex flex-col gap-2 hover:scale-[1.02] transition-transform`}
          >
            <div className="flex items-center justify-between">
              <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                {card.label}
              </span>
              <div className={`w-7 h-7 rounded-lg ${card.colorBg} border ${card.colorBorder} flex items-center justify-center ${card.colorText}`}>
                {card.icon}
              </div>
            </div>
            <div className={`${card.colorText} text-2xl font-extrabold leading-none`}>
              {card.value}
            </div>
            <div className="text-slate-600 text-[10px] font-semibold">{card.sub}</div>
          </motion.div>
        ))}
      </div>

      <div className="bg-white/2 border border-white/6 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-5">
          <Zap size={13} className="text-indigo-500" />
          <span className="text-slate-500 text-[11px] font-bold uppercase tracking-widest">
            Visitor Trend — Last {recentData.length} Days
          </span>
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            {activeChart === "area" ? (
              <AreaChart data={recentData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis
                  dataKey="name"
                  stroke="#1e293b"
                  fontSize={10}
                  fontWeight="600"
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={formatDate}
                  dy={10}
                  tick={{ fill: "#334155" }}
                />
                <YAxis
                  stroke="#1e293b"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "#334155" }}
                />
                <Tooltip
                  content={<CustomTooltip />}
                  cursor={{ stroke: "rgba(99,102,241,0.35)", strokeWidth: 1, strokeDasharray: "4 4" }}
                />
                {stats.avg > 0 && (
                  <ReferenceLine
                    y={stats.avg}
                    stroke="rgba(99,102,241,0.3)"
                    strokeDasharray="5 5"
                    label={{ value: `avg ${stats.avg}`, position: "right", fill: "#475569", fontSize: 9 }}
                  />
                )}
                <Area
                  type="monotone"
                  dataKey="views"
                  stroke="#6366f1"
                  strokeWidth={3}
                  fill="url(#areaFill)"
                  dot={false}
                  activeDot={{ r: 5, fill: "#6366f1", stroke: "#0a0f1d", strokeWidth: 2 }}
                  animationDuration={1200}
                />
              </AreaChart>
            ) : (
              <BarChart data={recentData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="barFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#818cf8" stopOpacity={1} />
                    <stop offset="100%" stopColor="#4f46e5" stopOpacity={0.85} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis
                  dataKey="name"
                  stroke="#1e293b"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={formatDate}
                  dy={10}
                  tick={{ fill: "#334155" }}
                />
                <YAxis stroke="#1e293b" fontSize={10} tickLine={false} axisLine={false} tick={{ fill: "#334155" }} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(99,102,241,0.06)" }} />
                {stats.avg > 0 && (
                  <ReferenceLine y={stats.avg} stroke="rgba(99,102,241,0.3)" strokeDasharray="5 5" />
                )}
                <Bar dataKey="views" fill="url(#barFill)" radius={[6, 6, 0, 0]}>
                  {recentData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.views === stats.peak ? "#a78bfa" : "url(#barFill)"}
                    />
                  ))}
                </Bar>
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-linear-to-r from-indigo-500/8 to-violet-500/5 border border-indigo-500/15 rounded-2xl p-4 flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
          <TrendingUp size={18} />
        </div>
        <div>
          <p className="text-indigo-400 text-[10px] font-bold uppercase tracking-widest mb-1">
            Smart Insight
          </p>
          <p className="text-slate-500 text-[13px] leading-relaxed">
            {growthUp
              ? `Your business grew by ${stats.growth}% this week. Keep it up — consider launching a coupon on your best-performing days!`
              : `Visits dropped ${Math.abs(stats.growth)}% this week. Try posting a story or offer to re-engage local customers.`}
          </p>
        </div>
      </div>

      {(stats.thisWeek > 0 || stats.lastWeek > 0) && (
        <div className="bg-white/2 border border-white/6 rounded-2xl p-6">
          <p className="flex items-center gap-2 text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-5">
            <Calendar size={12} className="text-indigo-500" />
            Week-over-week Comparison
          </p>
          <div className="flex flex-col gap-4">
            {[
              { label: "This Week", val: stats.thisWeek, bar: "bg-gradient-to-r from-indigo-600 to-indigo-400" },
              { label: "Last Week", val: stats.lastWeek, bar: "bg-slate-700/80" },
            ].map((row) => (
              <div key={row.label}>
                <div className="flex justify-between mb-2">
                  <span className="text-slate-500 text-[11px] font-semibold">{row.label}</span>
                  <span className="text-slate-200 text-[11px] font-bold">
                    {row.val.toLocaleString()} views
                  </span>
                </div>
                <div className="h-2 bg-white/4 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.round((row.val / weekMax) * 100)}%` }}
                    transition={{ duration: 0.9, ease: "easeOut" }}
                    className={`h-full ${row.bar} rounded-full`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BusinessAnalytics;
