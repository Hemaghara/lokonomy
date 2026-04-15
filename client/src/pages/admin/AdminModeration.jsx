import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { adminService } from "../../services";
import AdminLayout from "../../layouts/AdminLayout";
import {
  FiShield,
  FiAlertTriangle,
  FiCheckCircle,
  FiSlash,
  FiEye,
  FiMoreVertical,
  FiMessageSquare,
  FiFlag,
  FiLayers,
} from "react-icons/fi";

const AdminModeration = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({
    status: "pending",
    targetType: "all",
  });

  useEffect(() => {
    fetchReports();
  }, [filter]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const response = await adminService.getModerationReports(filter);
      setReports(response.data.reports);
    } catch (error) {
      toast.error("Failed to fetch reports");
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (id, action) => {
    try {
      await adminService.resolveReport(id, { action, status: "resolved" });
      toast.success("Report resolved");
      fetchReports();
    } catch (error) {
      toast.error("Resolution failed");
    }
  };

  return (
    <AdminLayout>
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-5 mb-8">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-8 h-8 rounded-lg bg-rose-500/15 border border-rose-500/20 flex items-center justify-center">
              <FiShield className="text-rose-400" size={15} />
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight">
              Moderation Center
            </h2>
          </div>
          <p className="text-slate-500 text-sm pl-10.5">
            Manage reported content and platform safety
          </p>
        </div>
      </header>

      <div className="flex gap-2 p-1 bg-slate-900 border border-white/5 rounded-2xl w-fit mb-8">
        {["pending", "resolved", "dismissed"].map((s) => (
          <button
            key={s}
            onClick={() => setFilter({ ...filter, status: s })}
            className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              filter.status === s
                ? "bg-indigo-600 text-white shadow-lg"
                : "text-slate-500 hover:text-slate-300"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <div className="py-20 flex justify-center">
            <div className="w-8 h-8 border-2 border-t-rose-500 rounded-full animate-spin" />
          </div>
        ) : reports.length === 0 ? (
          <div className="py-20 text-center bg-slate-900/30 rounded-3xl border border-dashed border-white/10">
            <FiFlag className="mx-auto text-slate-700 mb-4" size={40} />
            <p className="text-slate-600 font-bold uppercase tracking-widest text-xs">
              No pending reports
            </p>
          </div>
        ) : (
          reports.map((r) => (
            <div
              key={r._id}
              className="bg-slate-900/50 border border-white/5 rounded-3xl p-6 hover:bg-slate-800/40 transition-all"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-start gap-4">
                  <div
                    className={`w-12 h-12 rounded-2xl bg-${r.targetType === "product" ? "blue" : "indigo"}-500/10 flex items-center justify-center text-${r.targetType === "product" ? "blue" : "indigo"}-400`}
                  >
                    <FiAlertTriangle size={24} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20">
                        Reported {r.targetType}
                      </span>
                      <span className="text-[10px] text-slate-500 font-bold uppercase">
                        {new Date(r.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <h4 className="text-lg font-bold text-white mb-1 group-hover:text-indigo-400">
                      "{r.reason}"
                    </h4>
                    <p className="text-sm text-slate-400 line-clamp-1">
                      {r.description || "No additional details provided."}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button className="p-2.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white border border-slate-700/50">
                    <FiEye size={18} />
                  </button>
                  {r.status === "pending" && (
                    <>
                      <button
                        onClick={() => handleResolve(r._id, "removed")}
                        className="px-4 py-2.5 rounded-xl bg-rose-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-rose-500 transition-all shrink-0"
                      >
                        Delete Content
                      </button>
                      <button
                        onClick={() => handleResolve(r._id, "ignored")}
                        className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-400 text-[10px] font-black uppercase tracking-widest hover:text-white transition-all shrink-0 border border-slate-700/50"
                      >
                        Dismiss
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-6 pt-4 border-t border-white/5 text-[10px] font-black uppercase tracking-widest text-slate-500">
                <span className="flex items-center gap-1.5">
                  <FiLayers size={12} className="text-slate-600" /> ID:{" "}
                  {r.targetId.slice(-8).toUpperCase()}
                </span>
                <span className="flex items-center gap-1.5">
                  <FiMessageSquare size={12} className="text-slate-600" /> By:{" "}
                  {r.reportedBy?.name}
                </span>
                {r.resolvedBy && (
                  <span className="flex items-center gap-1.5 ml-auto text-emerald-500">
                    <FiCheckCircle size={12} /> Resolved by {r.resolvedBy.name}
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminModeration;
