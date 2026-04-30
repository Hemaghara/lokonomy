import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { adminService } from "../../services";
import AdminLayout from "../../layouts/AdminLayout";
import { useConfirm } from "../../context/ConfirmContext";
import {
  FiShield,
  FiAlertTriangle,
  FiCheckCircle,
  FiSlash,
  FiEye,
  FiMessageSquare,
  FiFlag,
  FiLayers,
  FiX,
  FiAlertOctagon,
} from "react-icons/fi";

const ContentPreview = ({ report, onClose }) => {
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const res = await adminService.getReportedContent(report._id);
        setContent(res.data);
      } catch {
        setContent({
          targetType: report.targetType,
          content: { deleted: true, message: "Failed to load content" },
        });
      } finally {
        setLoading(false);
      }
    };
    fetchContent();
  }, [report._id]);

  if (loading) {
    return (
      <div className="p-4 bg-slate-800/40 rounded-2xl border border-slate-700/50 animate-pulse">
        <div className="h-4 bg-slate-700 rounded w-3/4 mb-2" />
        <div className="h-3 bg-slate-700 rounded w-1/2" />
      </div>
    );
  }

  const data = content?.content;
  if (!data || data.deleted) {
    return (
      <div className="p-4 bg-slate-800/40 rounded-2xl border border-slate-700/50 text-center">
        <p className="text-slate-500 text-xs font-bold">
          Content has been removed or is unavailable.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-slate-800/40 rounded-2xl border border-slate-700/50 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
          {content.targetType} Preview
        </span>
        <button
          onClick={onClose}
          className="p-1 text-slate-500 hover:text-white transition-colors"
        >
          <FiX size={14} />
        </button>
      </div>
      {data.images?.[0] && (
        <img
          src={data.images[0]}
          alt=""
          className="w-full h-32 object-cover rounded-xl"
        />
      )}
      {data.image && (
        <img
          src={data.image}
          alt=""
          className="w-full h-32 object-cover rounded-xl"
        />
      )}
      <h5 className="text-sm font-bold text-white">
        {data.title ||
          data.name ||
          data.businessName ||
          data.position ||
          "Untitled"}
      </h5>
      <p className="text-xs text-slate-400 line-clamp-3">
        {data.description ||
          data.content ||
          data.message ||
          "No content available."}
      </p>
    </div>
  );
};

const AdminModeration = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({
    status: "pending",
    targetType: "all",
  });
  const [selectedReports, setSelectedReports] = useState([]);
  const [previewId, setPreviewId] = useState(null);
  const confirm = useConfirm();

  useEffect(() => {
    fetchReports();
  }, [filter]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const response = await adminService.getModerationReports(filter);
      setReports(response.data.reports);
      setSelectedReports([]);
    } catch (error) {
      toast.error("Failed to fetch reports");
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (id, action) => {
    const actionLabels = {
      removed: "Delete Content",
      ignored: "Dismiss Report",
      warned: "Warn User",
    };

    const isConfirmed = await confirm({
      title: actionLabels[action] || "Resolve Report",
      description:
        action === "removed"
          ? "This will permanently delete the reported content and notify the content owner."
          : action === "warned"
            ? "This will send a warning notification to the content owner without removing the content."
            : "This will dismiss the report without any action.",
      confirmLabel: actionLabels[action],
      isDanger: action === "removed",
    });
    if (!isConfirmed) return;

    try {
      await adminService.resolveReport(id, { action, status: "resolved" });
      toast.success("Report resolved");
      fetchReports();
    } catch (error) {
      toast.error("Resolution failed");
    }
  };

  const handleBulkResolve = async (action) => {
    if (selectedReports.length === 0) return;

    const isConfirmed = await confirm({
      title: `Bulk ${action === "removed" ? "Delete" : action === "warned" ? "Warn" : "Dismiss"}`,
      description: `Apply this action to ${selectedReports.length} selected reports?`,
      confirmLabel: `${action === "removed" ? "Delete All" : action === "warned" ? "Warn All" : "Dismiss All"}`,
      isDanger: action === "removed",
    });
    if (!isConfirmed) return;

    try {
      await Promise.all(
        selectedReports.map((id) =>
          adminService.resolveReport(id, { action, status: "resolved" }),
        ),
      );
      toast.success(`${selectedReports.length} reports resolved`);
      fetchReports();
    } catch {
      toast.error("Bulk action failed");
    }
  };

  const toggleSelect = (id) => {
    setSelectedReports((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const toggleSelectAll = () => {
    if (selectedReports.length === reports.length) {
      setSelectedReports([]);
    } else {
      setSelectedReports(reports.map((r) => r._id));
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

      {selectedReports.length > 0 && (
        <div className="flex items-center gap-3 p-3 mb-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl">
          <span className="text-xs font-bold text-rose-300 px-2">
            {selectedReports.length} selected
          </span>
          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={() => handleBulkResolve("warned")}
              className="px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest bg-amber-500/15 text-amber-400 border border-amber-500/20 hover:bg-amber-500/25 transition-all"
            >
              <FiAlertOctagon className="inline mr-1" size={11} /> Warn All
            </button>
            <button
              onClick={() => handleBulkResolve("removed")}
              className="px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest bg-rose-500/15 text-rose-400 border border-rose-500/20 hover:bg-rose-500/25 transition-all"
            >
              <FiSlash className="inline mr-1" size={11} /> Delete All
            </button>
            <button
              onClick={() => handleBulkResolve("ignored")}
              className="px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest bg-slate-500/15 text-slate-400 border border-slate-500/20 hover:bg-slate-500/25 transition-all"
            >
              Dismiss All
            </button>
            <button
              onClick={() => setSelectedReports([])}
              className="px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-white transition-all"
            >
              Clear
            </button>
          </div>
        </div>
      )}

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
          <>
            {filter.status === "pending" && reports.length > 0 && (
              <label className="flex items-center gap-2 px-2 cursor-pointer w-fit">
                <input
                  type="checkbox"
                  checked={selectedReports.length === reports.length}
                  onChange={toggleSelectAll}
                  className="w-3.5 h-3.5 rounded border-slate-600 bg-slate-800 text-rose-500 focus:ring-rose-500/30 cursor-pointer"
                />
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                  Select All
                </span>
              </label>
            )}

            {reports.map((r) => (
              <div
                key={r._id}
                className="bg-slate-900/50 border border-white/5 rounded-3xl p-6 hover:bg-slate-800/40 transition-all"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-start gap-4">
                    {filter.status === "pending" && (
                      <input
                        type="checkbox"
                        checked={selectedReports.includes(r._id)}
                        onChange={() => toggleSelect(r._id)}
                        className="w-3.5 h-3.5 mt-3 rounded border-slate-600 bg-slate-800 text-rose-500 focus:ring-rose-500/30 cursor-pointer shrink-0"
                      />
                    )}
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

                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() =>
                        setPreviewId(previewId === r._id ? null : r._id)
                      }
                      className={`p-2.5 rounded-xl border transition-all ${
                        previewId === r._id
                          ? "bg-indigo-500/20 text-indigo-400 border-indigo-500/30"
                          : "bg-slate-800 text-slate-400 hover:text-white border-slate-700/50"
                      }`}
                      title="Preview content"
                    >
                      <FiEye size={18} />
                    </button>
                    {r.status === "pending" && (
                      <>
                        <button
                          onClick={() => handleResolve(r._id, "warned")}
                          className="px-4 py-2.5 rounded-xl bg-amber-600/20 text-amber-400 text-[10px] font-black uppercase tracking-widest hover:bg-amber-500/30 border border-amber-500/20 transition-all shrink-0"
                          title="Warn user"
                        >
                          <FiAlertOctagon className="inline mr-1" size={12} />{" "}
                          Warn
                        </button>
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

                {/* Content Preview */}
                {previewId === r._id && (
                  <div className="mb-4">
                    <ContentPreview
                      report={r}
                      onClose={() => setPreviewId(null)}
                    />
                  </div>
                )}

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
                      <FiCheckCircle size={12} /> Resolved by{" "}
                      {r.resolvedBy.name}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminModeration;
