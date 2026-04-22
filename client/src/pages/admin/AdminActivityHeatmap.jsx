import { useState, useEffect, useCallback } from "react";
import { toast } from "react-hot-toast";
import AdminLayout from "../../layouts/AdminLayout";
import { adminService } from "../../services/adminService";
import { FiActivity, FiRefreshCw, FiInfo } from "react-icons/fi";
import CalendarHeatmap from "react-calendar-heatmap";
import "react-calendar-heatmap/dist/styles.css";
import { Tooltip } from "react-tooltip";

const AdminActivityHeatmap = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [metric, setMetric] = useState("signups");

  const fetchHeatmap = useCallback(async () => {
    try {
      setLoading(true);
      const res = await adminService.getHeatmapData(365);
      setData(res.data.dates);
    } catch (err) {
      toast.error("Failed to fetch heatmap data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHeatmap();
  }, [fetchHeatmap]);

  const getMetricColor = (value) => {
    if (value === 0) return "color-empty";
    if (metric === "revenue") {
      if (value > 5000) return "color-scale-4";
      if (value > 2000) return "color-scale-3";
      if (value > 500) return "color-scale-2";
      return "color-scale-1";
    }
    if (value > 10) return "color-scale-4";
    if (value > 5) return "color-scale-3";
    if (value > 2) return "color-scale-2";
    return "color-scale-1";
  };

  const metrics = [
    { id: "signups", label: "Signups", color: "text-indigo-400" },
    { id: "revenue", label: "Revenue", color: "text-emerald-400" },
    { id: "reports", label: "Reports", color: "text-rose-400" },
    { id: "content", label: "Content", color: "text-sky-400" },
  ];

  return (
    <AdminLayout>
      <style>{`
        .react-calendar-heatmap .color-scale-1 { fill: #312e81; }
        .react-calendar-heatmap .color-scale-2 { fill: #4338ca; }
        .react-calendar-heatmap .color-scale-3 { fill: #4f46e5; }
        .react-calendar-heatmap .color-scale-4 { fill: #6366f1; }
        .react-calendar-heatmap .color-empty { fill: #1e293b; }
        
        /* Specific colors per metric if we wanted more variety */
        .metric-revenue .color-scale-1 { fill: #064e3b; }
        .metric-revenue .color-scale-2 { fill: #065f46; }
        .metric-revenue .color-scale-3 { fill: #059669; }
        .metric-revenue .color-scale-4 { fill: #10b981; }

        .metric-reports .color-scale-1 { fill: #450a0a; }
        .metric-reports .color-scale-2 { fill: #7f1d1d; }
        .metric-reports .color-scale-3 { fill: #b91c1c; }
        .metric-reports .color-scale-4 { fill: #ef4444; }

        .metric-content .color-scale-1 { fill: #082f49; }
        .metric-content .color-scale-2 { fill: #075985; }
        .metric-content .color-scale-3 { fill: #0284c7; }
        .metric-content .color-scale-4 { fill: #0ea5e9; }
      `}</style>

      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tighter">
            Platform <span className="text-indigo-500">Activity Heatmap</span>
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            Visual calendar of platform health and growth
          </p>
        </div>
        <button
          onClick={fetchHeatmap}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2.5 bg-slate-800/80 border border-white/10 rounded-2xl text-sm font-bold text-slate-300 hover:text-white transition-all"
        >
          <FiRefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </header>

      <div className="flex gap-2 mb-8 flex-wrap">
        {metrics.map((m) => (
          <button
            key={m.id}
            onClick={() => setMetric(m.id)}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all border ${metric === m.id ? "bg-indigo-600 text-white border-indigo-500" : "bg-slate-800/60 text-slate-400 border-white/5 hover:border-white/20"}`}
          >
            {m.label}
          </button>
        ))}
      </div>

      <div
        className={`bg-slate-900/60 border border-white/5 rounded-3xl p-8 mb-8 metric-${metric}`}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
            <FiActivity className="text-indigo-400" />
            Daily {metric} Distribution
          </h3>
          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-tighter">
            <span>Less</span>
            <div className="flex gap-1">
              <div className="w-3 h-3 rounded-sm color-empty" />
              <div className="w-3 h-3 rounded-sm color-scale-1" />
              <div className="w-3 h-3 rounded-sm color-scale-2" />
              <div className="w-3 h-3 rounded-sm color-scale-3" />
              <div className="w-3 h-3 rounded-sm color-scale-4" />
            </div>
            <span>More</span>
          </div>
        </div>

        {loading ? (
          <div className="h-48 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
          </div>
        ) : (
          <div className="heatmap-container overflow-x-auto pb-4">
            <div style={{ minWidth: "800px" }}>
              <CalendarHeatmap
                startDate={
                  new Date(new Date().setFullYear(new Date().getFullYear() - 1))
                }
                endDate={new Date()}
                values={data.map((d) => ({ date: d.date, count: d[metric] }))}
                classForValue={(value) => {
                  if (!value) return "color-empty";
                  return getMetricColor(value.count);
                }}
                tooltipDataAttrs={(value) => {
                  if (!value || !value.date) return null;
                  return {
                    "data-tooltip-id": "heatmap-tooltip",
                    "data-tooltip-content": `${value.date}: ${value.count} ${metric}`,
                  };
                }}
              />
              <Tooltip id="heatmap-tooltip" />
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-6">
          <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <FiInfo className="text-indigo-400" />
            Insights
          </h4>
          <ul className="space-y-3">
            <li className="text-xs text-slate-500 flex items-start gap-2">
              <span className="w-1 h-1 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
              Heavier colors indicate peak platform engagement and content
              velocity.
            </li>
            <li className="text-xs text-slate-500 flex items-start gap-2">
              <span className="w-1 h-1 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
              Revenue clusters usually align with subscription expiry cycles.
            </li>
            <li className="text-xs text-slate-500 flex items-start gap-2">
              <span className="w-1 h-1 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
              Gaps in signups may correlate with platform downtime or
              maintenance.
            </li>
          </ul>
        </div>
        <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-6 flex flex-col justify-center items-center text-center">
          <p className="text-4xl font-black text-white mb-1">
            {data
              .reduce((acc, curr) => acc + (curr[metric] || 0), 0)
              .toLocaleString()}
          </p>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
            Total {metric} (Last 365 Days)
          </p>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminActivityHeatmap;
