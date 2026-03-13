import React, { useEffect, useState } from "react";
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
import { Lock, TrendingUp, Users, Calendar, Activity } from "lucide-react";
import { motion } from "framer-motion";

const BusinessAnalytics = ({ businessId, plan }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isLocked, setIsLocked] = useState(false);
  const [stats, setStats] = useState({ total: 0, growth: 0 });

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

        // Calculate simple growth (last 7 days vs previous 7 days)
        if (chartData.length >= 14) {
          const currentWeek = chartData
            .slice(-7)
            .reduce((acc, curr) => acc + curr.views, 0);
          const prevWeek = chartData
            .slice(-14, -7)
            .reduce((acc, curr) => acc + curr.views, 0);
          const growth =
            prevWeek === 0
              ? 100
              : Math.round(((currentWeek - prevWeek) / prevWeek) * 100);
          setStats({ total, growth });
        } else {
          setStats({ total, growth: 10 });
        }

        setData(chartData);
      } catch (err) {
        if (err.response && err.response.status === 403) {
          setIsLocked(true);
        }
        console.error("Error fetching analytics:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [businessId]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-900 border border-gray-700 p-3 rounded-xl shadow-2xl backdrop-blur-md">
          <p className="text-gray-400 text-[10px] font-bold uppercase mb-1">
            {label}
          </p>
          <p className="text-white font-bold flex items-center gap-2">
            <Users size={14} className="text-blue-500" />
            {payload[0].value}{" "}
            <span className="text-gray-500 text-xs font-normal">Visitors</span>
          </p>
        </div>
      );
    }
    return null;
  };

  const LockedOverlay = () => (
    <div className="relative h-87.5 w-full rounded-2xl bg-[#0a0f1d] flex flex-col items-center justify-center p-8 border border-gray-800 overflow-hidden">
      <div className="absolute inset-0 bg-blue-500/5 backdrop-blur-[2px] z-0" />
      <div className="relative z-10 flex flex-col items-center text-center max-w-sm">
        <div className="w-16 h-16 bg-yellow-500/10 rounded-full flex items-center justify-center mb-6 ring-4 ring-yellow-500/5">
          <Lock className="w-8 h-8 text-yellow-500" />
        </div>
        <h3 className="text-2xl font-bold text-white mb-3">Premium Insights</h3>
        <p className="text-gray-400 text-sm leading-relaxed mb-8">
          Unlock granular visitor analytics, trend detection, and performance
          tracking with our{" "}
          <span className="text-yellow-500 font-bold">Gold Plan</span>.
        </p>
        <button className="bg-linear-to-r from-yellow-500 to-amber-600 text-black px-10 py-3 rounded-full font-bold hover:scale-105 transition-all shadow-xl shadow-yellow-500/20 active:scale-95">
          Upgrade to Gold
        </button>
      </div>

      <div className="absolute inset-x-0 -bottom-10 h-40 opacity-20 blur-sm">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={[{ v: 10 }, { v: 30 }, { v: 20 }, { v: 50 }, { v: 40 }]}
          >
            <Area type="monotone" dataKey="v" stroke="#444" fill="#222" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  if (loading)
    return (
      <div className="h-64 flex flex-col items-center justify-center space-y-4">
        <div className="w-8 h-8 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
        <p className="text-gray-500 text-sm animate-pulse">
          Analyzing visitor data...
        </p>
      </div>
    );

  if (isLocked) return <LockedOverlay />;

  return (
    <div className="bg-[#0a0f1d] p-8 rounded-3xl border border-gray-800/50 shadow-2xl space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-blue-500 mb-2">
            <Activity size={18} />
            <span className="text-xs font-bold uppercase tracking-widest">
              Growth Dashboard
            </span>
          </div>
          <h2 className="text-3xl font-bold text-white tracking-tight">
            Analytics Overview
          </h2>
        </div>

        <div className="flex gap-4">
          <div className="bg-gray-800/20 rounded-2xl p-4 border border-gray-800/50 min-w-35">
            <p className="text-gray-500 text-[10px] font-bold uppercase mb-1">
              Total Views
            </p>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-white">
                {stats.total.toLocaleString()}
              </span>
              <Users size={14} className="text-blue-400" />
            </div>
          </div>
          <div className="bg-gray-800/20 rounded-2xl p-4 border border-gray-800/50 min-w-35">
            <p className="text-gray-500 text-[10px] font-bold uppercase mb-1">
              Weekly Growth
            </p>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-green-500">
                +{stats.growth}%
              </span>
              <TrendingUp size={14} className="text-green-500" />
            </div>
          </div>
        </div>
      </div>

      <div className="h-87.5 w-full relative">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="4 4"
              stroke="#1e293b"
              vertical={false}
            />
            <XAxis
              dataKey="name"
              stroke="#475569"
              fontSize={10}
              fontWeight="600"
              tickLine={false}
              axisLine={false}
              tickFormatter={(str) => {
                try {
                  const date = new Date(str);
                  return date.toLocaleDateString("en-US", {
                    day: "numeric",
                    month: "short",
                  });
                } catch (e) {
                  return str;
                }
              }}
              dy={10}
            />
            <YAxis
              stroke="#475569"
              fontSize={10}
              fontWeight="600"
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{
                stroke: "#3b82f6",
                strokeWidth: 1,
                strokeDasharray: "3 3",
              }}
            />
            <Area
              type="monotone"
              dataKey="views"
              stroke="#3b82f6"
              fillOpacity={1}
              fill="url(#colorViews)"
              strokeWidth={3}
              animationDuration={1500}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-blue-500/5 border border-blue-500/10 p-4 rounded-2xl flex items-center gap-4">
        <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-500">
          <TrendingUp size={20} />
        </div>
        <p className="text-sm text-gray-400">
          <span className="text-blue-400 font-bold">Smart Insight:</span> Most
          of your customers are visiting on{" "}
          <span className="text-white">weekends</span>. Consider launching
          coupons on Fridays to maximize reach.
        </p>
      </div>
    </div>
  );
};

export default BusinessAnalytics;
