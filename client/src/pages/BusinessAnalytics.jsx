import { useState, useEffect } from "react";
import { businessService } from "../services";
import { toast } from "react-hot-toast";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { 
  HiOutlineChartBar, 
  HiOutlineUsers, 
  HiOutlineBriefcase, 
  HiOutlineShoppingBag, 
  HiOutlineEye,
  HiOutlineStar
} from "react-icons/hi2";

const StatCard = ({ title, value, icon, color }) => {
  const IconComponent = icon;
  return (
    <div className="bg-[#111827] border border-[#1f2a3d] p-5 rounded-2xl flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color} bg-opacity-10 border border-current`}>
        <IconComponent className="text-xl" />
      </div>
      <div>
        <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">{title}</p>
        <h3 className="text-white text-2xl font-bold">{value}</h3>
      </div>
    </div>
  );
};

const BusinessAnalytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await businessService.getAnalytics();
        setData(response.data);
      } catch (err) {
        toast.error("Failed to fetch analytics");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080e1a] pt-24 pb-20 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500"></div>
      </div>
    );
  }

  if (!data?.stats) {
    return (
      <div className="min-h-screen bg-[#080e1a] pt-24 pb-20 flex flex-col items-center justify-center">
        <HiOutlineChartBar className="text-6xl text-slate-700 mb-4" />
        <h2 className="text-xl font-semibold text-slate-300">No Analytics Data Available</h2>
        <p className="text-slate-500 mt-2">Create a business profile to start tracking metrics.</p>
      </div>
    );
  }

  const { stats, chartData } = data;

  return (
    <div className="min-h-screen bg-[#080e1a] pt-24 pb-20">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Business Analytics</h1>
          <p className="text-slate-400">Track your business performance and user engagement on Lokonomy.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <StatCard 
            title="Profile Views" 
            value={stats.totalVisits} 
            icon={HiOutlineUsers} 
            color="text-violet-400 border-violet-400" 
          />
          <StatCard 
            title="Average Rating" 
            value={stats.rating.toFixed(1)} 
            icon={HiOutlineStar} 
            color="text-amber-400 border-amber-400" 
          />
          <StatCard 
            title="Total Reviews" 
            value={stats.reviewsCount} 
            icon={HiOutlineChartBar} 
            color="text-emerald-400 border-emerald-400" 
          />
          <StatCard 
            title="Products Listed" 
            value={stats.totalProducts} 
            icon={HiOutlineShoppingBag} 
            color="text-blue-400 border-blue-400" 
          />
          <StatCard 
            title="Product Views" 
            value={stats.totalProductViews} 
            icon={HiOutlineEye} 
            color="text-rose-400 border-rose-400" 
          />
          <StatCard 
            title="Jobs Posted" 
            value={stats.totalJobs} 
            icon={HiOutlineBriefcase} 
            color="text-indigo-400 border-indigo-400" 
          />
        </div>

        {chartData && chartData.length > 0 && (
          <div className="bg-[#111827] border border-[#1f2a3d] p-6 rounded-2xl">
            <h3 className="text-lg font-bold text-white mb-6">Profile Visits (Last 30 Days)</h3>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2a3d" vertical={false} />
                  <XAxis 
                    dataKey="date" 
                    stroke="#475569" 
                    tick={{ fill: '#94a3b8', fontSize: 12 }} 
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => {
                      const date = new Date(val);
                      return `${date.getDate()}/${date.getMonth() + 1}`;
                    }}
                  />
                  <YAxis 
                    stroke="#475569" 
                    tick={{ fill: '#94a3b8', fontSize: 12 }} 
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{ 
                      backgroundColor: '#111827', 
                      border: '1px solid #1f2a3d',
                      borderRadius: '8px',
                      color: '#fff'
                    }}
                    itemStyle={{ color: '#8b5cf6' }}
                    labelStyle={{ color: '#94a3b8', marginBottom: '4px' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="visits" 
                    stroke="#8b5cf6" 
                    strokeWidth={3}
                    dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4, stroke: '#fff' }}
                    activeDot={{ r: 6, fill: '#8b5cf6', stroke: '#fff', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BusinessAnalytics;
