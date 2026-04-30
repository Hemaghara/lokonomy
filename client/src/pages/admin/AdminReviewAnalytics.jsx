import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import html2pdf from "html2pdf.js";
import { adminService } from "../../services";
import AdminLayout from "../../layouts/AdminLayout";
import {
  FiArrowLeft,
  FiStar,
  FiTrendingUp,
  FiMessageSquare,
  FiBarChart2,
  FiCalendar,
  FiAward,
  FiUsers,
  FiDownload,
} from "react-icons/fi";
import { toast } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
} from "recharts";

const AdminReviewAnalytics = () => {
  const { businessId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showReport, setShowReport] = useState(false);
  const reportRef = useRef(null);

  const fetchAnalytics = async () => {
    try {
      const res = await adminService.getBusinessReviewAnalytics(businessId);
      setData(res.data);
    } catch (error) {
      toast.error("Failed to fetch analytics data");
      navigate("/admin/reviews");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [businessId]);

  const handleDownloadReport = () => {
    if (!reportRef.current) return;

    const element = reportRef.current;
    const opt = {
      margin: 0,
      filename: `Report_${data.businessName.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: true },
      jsPDF: { unit: "in", format: "a4", orientation: "portrait" },
    };

    const downloadToast = toast.loading("Generating your secure report...");

    html2pdf()
      .set(opt)
      .from(element)
      .save()
      .then(() => {
        toast.success("Analytical Report Downloaded", { id: downloadToast });
      })
      .catch((err) => {
        toast.error("Generation failed. Try again.", { id: downloadToast });
        console.error("PDF generation error:", err);
      });
  };
  const getInsights = () => {
    const insights = [];
    if (!data || data.totalReviews === 0)
      return ["No data available for analysis."];

    const total = data.totalReviews;
    const distribution = data.ratingDistribution;
    const highRatings = (distribution[5] || 0) + (distribution[4] || 0);
    const lowRatings = (distribution[1] || 0) + (distribution[2] || 0);

    if (data.averageRating >= 4.5) {
      insights.push(
        "Exceptional performance: The business maintains an elite satisfaction level.",
      );
    } else if (data.averageRating >= 4) {
      insights.push(
        "Strong performance: Most customers have a positive experience.",
      );
    }

    if ((highRatings / total) * 100 > 80) {
      insights.push(
        "Strong brand loyalty: Over 80% of feedback is highly positive.",
      );
    }

    if ((lowRatings / total) * 100 > 15) {
      insights.push(
        "Critical Alert: High volume of negative feedback detected. Requires investigation.",
      );
    }

    if ((distribution[3] || 0) / total > 0.3) {
      insights.push(
        "Neutral saturation: Large segment of 'Indifferent' customers. Potential for growth through service refinements.",
      );
    }

    if (insights.length === 0)
      insights.push("Consistent performance across the board.");
    return insights;
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
          <div className="w-16 h-16 border-4 border-indigo-500/10 border-t-indigo-500 rounded-full animate-spin"></div>
          <p className="text-slate-500 font-bold animate-pulse text-lg">
            Analyzing feedback data...
          </p>
        </div>
      </AdminLayout>
    );
  }

  const COLORS = ["#ef4444", "#f97316", "#fbbf24", "#84cc16", "#22c55e"];

  const barData = Object.entries(data.ratingDistribution).map(
    ([rating, count]) => ({
      name: `${rating} Star`,
      count: count,
    }),
  );

  const pieData = Object.entries(data.ratingDistribution)
    .map(([rating, count], idx) => ({
      name: `${rating} Star`,
      value: count,
      color: COLORS[idx],
    }))
    .filter((d) => d.value > 0);

  return (
    <AdminLayout>
      <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 print:hidden">
        <header className="flex flex-col gap-6">
          <button
            onClick={() => navigate("/admin/reviews")}
            className="group flex items-center gap-2 text-slate-500 hover:text-white transition-colors w-fit"
          >
            <FiArrowLeft className="group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-bold uppercase tracking-widest">
              Back to Management
            </span>
          </button>

          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
            <div>
              <h1 className="text-4xl font-black text-white tracking-tight leading-tight">
                {data.businessName}{" "}
                <span className="text-indigo-500">Analytics</span>
              </h1>
              <p className="text-slate-400 mt-2 font-medium flex items-center gap-2">
                <FiBarChart2 className="text-indigo-400" /> Comprehensive review
                performance report
              </p>
            </div>

            <div className="flex gap-4">
              <div className="bg-slate-900/50 border border-slate-800/80 px-6 py-3 rounded-2xl backdrop-blur-sm shadow-inner shadow-white/5">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">
                  Business ID
                </p>
                <p className="text-white font-mono text-sm">{businessId}</p>
              </div>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <motion.div
            whileHover={{ y: -5 }}
            className="bg-linear-to-br from-indigo-600/20 to-indigo-900/20 border border-indigo-500/20 p-8 rounded-3xl relative overflow-hidden group shadow-xl"
          >
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-indigo-500/20 rounded-full blur-2xl group-hover:scale-110 transition-transform" />
            <FiAward className="text-3xl text-indigo-400 mb-4" />
            <p className="text-sm font-bold text-indigo-300/60 uppercase tracking-widest">
              Average Rating
            </p>
            <div className="flex items-center gap-3 mt-1">
              <h3 className="text-4xl font-black text-white">
                {data.averageRating.toFixed(1)}
              </h3>
              <div className="flex text-yellow-500">
                <FiStar className="fill-yellow-500" />
              </div>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ y: -5 }}
            className="bg-slate-900/50 border border-slate-800/80 p-8 rounded-3xl relative overflow-hidden group shadow-xl"
          >
            <FiMessageSquare className="text-3xl text-emerald-400 mb-4" />
            <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">
              Total Feedback
            </p>
            <h3 className="text-4xl font-black text-white mt-1">
              {data.totalReviews}
            </h3>
          </motion.div>

          <motion.div
            whileHover={{ y: -5 }}
            className="bg-slate-900/50 border border-slate-800/80 p-8 rounded-3xl relative overflow-hidden group shadow-xl"
          >
            <FiUsers className="text-3xl text-sky-400 mb-4" />
            <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">
              Active Reviewers
            </p>
            <h3 className="text-4xl font-black text-white mt-1">
              {data.totalReviews}
            </h3>
          </motion.div>

          <motion.div
            whileHover={{ y: -5 }}
            className="bg-slate-900/50 border border-slate-800/80 p-8 rounded-3xl relative overflow-hidden group shadow-xl"
          >
            <FiTrendingUp className="text-3xl text-purple-400 mb-4" />
            <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">
              Sentiment Score
            </p>
            <h3 className="text-4xl font-black text-white mt-1">
              {data.averageRating >= 4
                ? "Positive"
                : data.averageRating >= 3
                  ? "Neutral"
                  : "Caution"}
            </h3>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          <div className="xl:col-span-2 bg-slate-900/50 border border-slate-800/80 rounded-[2.5rem] p-8 sm:p-10 backdrop-blur-md shadow-2xl">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h3 className="text-xl font-black text-white">
                  Rating Distribution
                </h3>
                <p className="text-slate-500 text-sm font-medium mt-1">
                  Number of reviews across star categories
                </p>
              </div>
              <div className="flex gap-2">
                <span className="px-3 py-1 bg-indigo-500/10 text-indigo-400 text-[10px] font-black uppercase tracking-widest rounded-full border border-indigo-500/20">
                  Frequency
                </span>
              </div>
            </div>

            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={barData}
                  margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#1e293b"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="name"
                    stroke="#475569"
                    fontSize={12}
                    fontWeight="bold"
                    tickLine={false}
                    axisLine={false}
                    dy={10}
                  />
                  <YAxis
                    stroke="#475569"
                    fontSize={12}
                    fontWeight="bold"
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    cursor={{ fill: "#ffffff05" }}
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      border: "1px solid #1e293b",
                      borderRadius: "16px",
                      color: "#fff",
                      fontSize: "12px",
                      boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.5)",
                    }}
                  />
                  <Bar dataKey="count" radius={[8, 8, 8, 8]} barSize={40}>
                    {barData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-slate-900/50 border border-slate-800/80 rounded-[2.5rem] p-8 sm:p-10 backdrop-blur-md shadow-2xl flex flex-col">
            <div className="mb-8">
              <h3 className="text-xl font-black text-white">Sentiment Share</h3>
              <p className="text-slate-500 text-sm font-medium mt-1">
                Percentage breakdown
              </p>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center">
              <div className="h-60 w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={8}
                      dataKey="value"
                      stroke="none"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#0f172a",
                        border: "1px solid #1e293b",
                        borderRadius: "12px",
                        fontSize: "10px",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-3xl font-black text-white">
                    {data.totalReviews}
                  </span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                    Total
                  </span>
                </div>
              </div>

              <div className="mt-8 space-y-3 w-full">
                {pieData.map((item, idx) => {
                  const percentage = (
                    (item.value / data.totalReviews) *
                    100
                  ).toFixed(0);
                  return (
                    <div
                      key={idx}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-xs font-bold text-slate-400">
                          {item.name}
                        </span>
                      </div>
                      <span className="text-xs font-black text-white">
                        {percentage}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-indigo-600 rounded-3xl p-8 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl shadow-indigo-600/20 relative overflow-hidden group">
          <div className="absolute inset-0 bg-linear-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
          <div className="relative z-10 text-center md:text-left">
            <h3 className="text-2xl font-black text-white flex items-center gap-3 justify-center md:justify-start">
              Executive Review Report
              <span className="px-3 py-1 bg-white/10 rounded-full text-[10px] font-black uppercase tracking-[0.2em]">
                Ready
              </span>
            </h3>
            <p className="text-indigo-100/80 font-medium mt-1">
              Generate a structured, printable report for administrative audits
              and performance reviews.
            </p>
          </div>
          <button
            onClick={() => setShowReport(true)}
            className="relative z-10 bg-white text-indigo-600 px-10 py-5 rounded-2xl font-black text-sm hover:bg-indigo-50 transition-all hover:scale-105 active:scale-95 shadow-xl shadow-indigo-700/20 flex items-center gap-3"
          >
            <FiAward className="text-lg" />
            Generate Full Report
          </button>
        </div>
      </div>
      <AnimatePresence>
        {showReport && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-100 bg-slate-950 flex flex-col overflow-y-auto p-4 md:p-12 print:p-0 print:static print:bg-white"
          >
            <div className="max-w-4xl mx-auto w-full mb-8 flex flex-col sm:flex-row justify-between items-center gap-4 print:hidden px-4 md:px-0">
              <button
                onClick={() => setShowReport(false)}
                className="w-full sm:w-auto px-6 py-3 md:py-4 bg-slate-900 border border-slate-800 text-slate-400 font-bold rounded-2xl hover:text-white hover:bg-slate-800 transition-all flex items-center justify-center gap-2 group"
              >
                <FiArrowLeft className="group-hover:-translate-x-1 transition-transform" />{" "}
                Close Preview
              </button>
              <button
                onClick={handleDownloadReport}
                className="w-full sm:w-auto px-8 py-3 md:py-4 bg-primary-dark text-white font-black rounded-2xl hover:bg-[#4338ca] shadow-xl shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95"
              >
                <FiDownload /> Download Executive Report
              </button>
            </div>

            <div
              ref={reportRef}
              className="max-w-4xl mx-auto w-full bg-white text-card-bg rounded-4xl p-6 sm:p-12 md:p-20 shadow-2xl print:shadow-none print:rounded-none print:m-0 print:p-12 font-sans transition-all duration-500 overflow-hidden"
              style={{ boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)" }}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b-2 border-[#f1f5f9] pb-8 md:pb-12 mb-12 font-sans gap-8 sm:gap-0">
                <div className="flex items-center gap-5 font-sans">
                  <div
                    className="w-14 h-14 shrink-0 rounded-2xl flex items-center justify-center text-white"
                    style={{
                      backgroundColor: "#4f46e5",
                      boxShadow: "0 10px 15px -3px rgba(79, 70, 229, 0.3)",
                    }}
                  >
                    <FiBarChart2 size={28} />
                  </div>
                  <div className="font-sans">
                    <h2 className="text-xl sm:text-3xl font-black tracking-tight text-card-bg uppercase leading-none font-sans italic">
                      Performance Report
                    </h2>
                    <p className="text-[10px] font-bold text-[#94a3b8] mt-2 uppercase tracking-[0.3em] font-sans">
                      Platform Authenticity Verified
                    </p>
                  </div>
                </div>
                <div className="sm:text-right font-sans pl-16 sm:pl-0 border-l border-[#f1f5f9] sm:border-0 self-center">
                  <p className="text-[10px] font-black uppercase tracking-widest text-primary-dark mb-1 font-sans">
                    Entity ID reference
                  </p>
                  <p className="font-mono text-xs sm:text-sm md:text-base font-black text-[#475569] tracking-tighter">
                    {businessId.slice(-12).toUpperCase()}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-16 font-sans">
                <div className="md:col-span-2 space-y-12 font-sans">
                  <section className="font-sans">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-6 font-sans">
                      Strategic Summary
                    </h3>
                    <div className="grid grid-cols-2 gap-6 font-sans">
                      <div className="bg-text-main p-6 rounded-3xl border border-[#f1f5f9] flex flex-col gap-2 font-sans">
                        <p className="text-[10px] font-black uppercase tracking-widest text-[#94a3b8] font-sans">
                          Average Satisfaction
                        </p>
                        <div className="flex items-center gap-2 font-sans">
                          <span className="text-3xl font-black text-card-bg font-sans">
                            {data.averageRating.toFixed(2)}
                          </span>
                          <div className="flex text-[#eab308] text-xs font-sans">
                            {[...Array(5)].map((_, i) => (
                              <FiStar
                                key={i}
                                className={
                                  i < Math.round(data.averageRating)
                                    ? "fill-[#eab308]"
                                    : "text-[#e2e8f0]"
                                }
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="bg-text-main p-6 rounded-3xl border border-[#f1f5f9] flex flex-col gap-2 font-sans">
                        <p className="text-[10px] font-black uppercase tracking-widest text-[#94a3b8] font-sans">
                          Total Samples
                        </p>
                        <span className="text-3xl font-black text-card-bg font-sans">
                          {data.totalReviews}{" "}
                          <span className="text-[#cbd5e1] font-medium text-lg italic font-sans">
                            logs
                          </span>
                        </span>
                      </div>
                    </div>
                  </section>

                  <section className="font-sans">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-6 font-sans">
                      Tactical Insights
                    </h3>
                    <div className="space-y-4 font-sans">
                      {getInsights().map((insight, idx) => (
                        <div
                          key={idx}
                          className="flex gap-4 p-5 bg-[#eef2ff] rounded-2xl border-l-4 border-primary-dark items-start group transition-colors font-sans"
                        >
                          <div className="mt-1 p-1 bg-white rounded-lg shadow-sm text-primary-dark font-sans">
                            <FiTrendingUp size={12} />
                          </div>
                          <p className="text-sm text-[#334155] font-bold leading-relaxed font-sans">
                            {insight}
                          </p>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>

                <div className="space-y-12 font-sans">
                  <section className="bg-text-main p-8 rounded-4xl border border-[#f1f5f9] relative overflow-hidden font-sans">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-6 relative z-10 font-sans">
                      Business Intel
                    </h3>
                    <div className="space-y-6 relative z-10 font-sans">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-[#94a3b8] mb-1 font-sans">
                          Entity Name
                        </p>
                        <p className="text-lg font-black text-card-bg tracking-tight font-sans">
                          {data.businessName}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-[#94a3b8] mb-1 font-sans">
                          Generated Date
                        </p>
                        <p className="text-sm font-bold text-[#475569] font-sans">
                          {new Date().toLocaleDateString("en-GB")}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-[#94a3b8] mb-1 font-sans">
                          Report Version
                        </p>
                        <p className="text-sm font-bold text-[#475569] font-sans">
                          v2.4.1.SR
                        </p>
                      </div>
                    </div>
                  </section>

                  <section className="font-sans">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-6 font-sans">
                      Sentiment Mix
                    </h3>
                    <div className="h-40 w-full font-sans">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={pieData}
                            innerRadius={30}
                            outerRadius={50}
                            paddingAngle={5}
                            dataKey="value"
                            stroke="none"
                          >
                            {pieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </section>
                </div>
              </div>

              <section className="mb-20 font-sans">
                <div className="flex items-center justify-between mb-8 border-b border-[#f1f5f9] pb-4 font-sans">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary font-sans">
                    Distribution Matrix
                  </h3>
                  <div className="flex gap-4 font-sans">
                    <div className="flex items-center gap-1.5 font-sans">
                      <div className="w-2 h-2 bg-[#10b981] rounded-full font-sans" />
                      <span className="text-[8px] font-black uppercase tracking-widest text-[#94a3b8] font-sans">
                        Positive
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 font-sans">
                      <div className="w-2 h-2 bg-[#f43f5e] rounded-full font-sans" />
                      <span className="text-[8px] font-black uppercase tracking-widest text-[#94a3b8] font-sans">
                        Negative
                      </span>
                    </div>
                  </div>
                </div>
                <div className="overflow-x-auto border border-[#f1f5f9] rounded-3xl bg-text-main font-sans">
                  <table className="w-full text-left font-sans min-w-150">
                    <thead>
                      <tr className="bg-text-main font-sans">
                        <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-text-dim border-b border-[#f1f5f9] font-sans">
                          Category
                        </th>
                        <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-text-dim border-b border-[#f1f5f9] font-sans">
                          Volume
                        </th>
                        <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-text-dim border-b border-[#f1f5f9] font-sans">
                          Market Segment
                        </th>
                        <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-text-dim border-b border-[#f1f5f9] font-sans">
                          Visual Scale
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#f1f5f9] text-sm font-sans">
                      {[5, 4, 3, 2, 1].map((star) => {
                        const count = data.ratingDistribution[star] || 0;
                        const percentage = (
                          (count / data.totalReviews) *
                          100
                        ).toFixed(1);
                        const barColorHex =
                          star >= 4
                            ? "#10b981"
                            : star >= 3
                              ? "#fbbf24"
                              : "#f43f5e";
                        return (
                          <tr
                            key={star}
                            className="bg-white hover:bg-text-main transition-colors duration-300 font-sans"
                          >
                            <td className="px-8 py-5 text-card-bg font-black tracking-tight font-sans">
                              {star} Stars
                            </td>
                            <td className="px-8 py-5 text-text-dim font-bold font-sans">
                              {count}
                            </td>
                            <td className="px-8 py-5 font-sans">
                              <span
                                style={{
                                  backgroundColor:
                                    star >= 4
                                      ? "#f0fdf4"
                                      : star >= 3
                                        ? "#fffbeb"
                                        : "#fef2f2",
                                  color: barColorHex,
                                }}
                                className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest font-sans"
                              >
                                {percentage}% Share
                              </span>
                            </td>
                            <td className="px-8 py-5 font-sans">
                              <div className="w-32 bg-[#f1f5f9] h-1 rounded-full overflow-hidden font-sans">
                                <div
                                  style={{
                                    width: `${percentage}%`,
                                    backgroundColor: barColorHex,
                                  }}
                                  className="h-full rounded-full font-sans"
                                />
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </section>

              <footer className="pt-12 border-t border-[#f1f5f9] grid grid-cols-1 sm:grid-cols-2 gap-10 opacity-80 font-sans">
                <div className="space-y-3 font-sans">
                  <p className="text-[10px] font-black text-card-bg uppercase tracking-[0.2em] mb-1 font-sans">
                    Confidentiality Clause
                  </p>
                  <p className="text-[9px] text-[#94a3b8] font-medium leading-relaxed font-sans">
                    This analytics report is intended solely for internal
                    administrative review. Any unauthorized distribution or
                    public disclosure of these metrics is prohibited under
                    platform policy 904.SR.
                  </p>
                </div>
                <div className="flex flex-col sm:items-end justify-end font-sans">
                  <div className="flex items-center gap-2 mb-2 font-sans">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-sans"
                      style={{ backgroundColor: "#4f46e5" }}
                    >
                      <FiAward />
                    </div>
                    <p className="text-[10px] font-black text-card-bg uppercase tracking-[0.2em] font-sans">
                      Lokonomy Intelligence
                    </p>
                  </div>
                  <p className="text-[9px] text-[#94a3b8] font-bold font-sans">
                    System Ref: LX-904-REV-ANL
                  </p>
                </div>
              </footer>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </AdminLayout>
  );
};

export default AdminReviewAnalytics;
