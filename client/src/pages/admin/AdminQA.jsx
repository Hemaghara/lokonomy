import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { adminService } from "../../services";
import AdminLayout from "../../layouts/AdminLayout";
import {
  FiHelpCircle,
  FiSearch,
  FiFilter,
  FiTrash2,
  FiCheckCircle,
  FiChevronLeft,
  FiChevronRight,
  FiAnchor,
  FiMessageSquare,
  FiUser,
  FiBriefcase,
} from "react-icons/fi";

const AdminQA = () => {
  const [qas, setQas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetchQA();
  }, [filter]);

  const fetchQA = async () => {
    try {
      setLoading(true);
      const response = await adminService.getQA({
        search: searchQuery,
        answered: filter,
      });
      setQas(response.data.qas);
      setStats(response.data.stats);
    } catch (error) {
      toast.error("Failed to fetch QA data");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteQuestion = async (id) => {
    if (!window.confirm("Delete this question permanently?")) return;
    try {
      await adminService.deleteQuestion(id);
      toast.success("Question deleted");
      fetchQA();
    } catch (error) {
      toast.error("Deletion failed");
    }
  };

  const handleTogglePin = async (id) => {
    try {
      await adminService.togglePinQA(id);
      toast.success("Pin status toggled");
      fetchQA();
    } catch (error) {
      toast.error("Operation failed");
    }
  };

  return (
    <AdminLayout>
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-5 mb-8">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/15 border border-indigo-500/20 flex items-center justify-center">
              <FiHelpCircle className="text-indigo-400" size={15} />
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight">
              Q&A Moderation
            </h2>
          </div>
          <p className="text-slate-500 text-sm pl-10.5">
            Moderate questions and answers for all businesses
          </p>
        </div>
      </header>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {[
          {
            label: "Total Questions",
            value: stats.total,
            color: "indigo",
            icon: FiMessageSquare,
          },
          {
            label: "Answered",
            value: stats.answered,
            color: "emerald",
            icon: FiCheckCircle,
          },
          {
            label: "Unanswered",
            value: stats.unanswered,
            color: "amber",
            icon: FiHelpCircle,
          },
        ].map((s, i) => (
          <div
            key={i}
            className="bg-slate-900/50 border border-white/5 rounded-2xl p-5"
          >
            <div className="flex items-center gap-4">
              <div
                className={`w-12 h-12 rounded-xl bg-${s.color}-500/10 flex items-center justify-center text-${s.color}-400`}
              >
                <s.icon size={24} />
              </div>
              <div>
                <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">
                  {s.label}
                </p>
                <p className="text-2xl font-black text-white">{s.value || 0}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3 mb-6">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <FiSearch
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
              size={14}
            />
            <input
              type="text"
              placeholder="Search by question text or user name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && fetchQA()}
              className="w-full bg-slate-900/60 border border-slate-700/50 rounded-xl py-2.5 pl-10 pr-4 text-slate-200 text-sm outline-none"
            />
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-slate-400 text-sm font-bold rounded-xl px-4 outline-none cursor-pointer"
          >
            <option value="all">All Questions</option>
            <option value="yes">Answered</option>
            <option value="no">Unanswered</option>
          </select>
        </div>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-2 border-t-indigo-500 rounded-full animate-spin" />
          </div>
        ) : qas.length === 0 ? (
          <div className="text-center py-20 bg-slate-900/30 rounded-3xl border border-white/5">
            <p className="text-slate-600 font-bold uppercase tracking-widest text-xs">
              No questions matched your search
            </p>
          </div>
        ) : (
          qas.map((qa) => (
            <div
              key={qa._id}
              className={`bg-slate-900/50 border rounded-3xl p-6 transition-all hover:bg-slate-800/40 ${qa.isPinned ? "border-indigo-500/50 shadow-lg shadow-indigo-500/5" : "border-white/5"}`}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 shrink-0 uppercase font-black">
                    {qa.askedByName?.[0]}
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">
                      Asked in: {qa.businessName}
                    </p>
                    <h4 className="text-base font-bold text-white leading-snug">
                      {qa.question}
                    </h4>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleTogglePin(qa._id)}
                    className={`p-2 rounded-lg transition-all ${qa.isPinned ? "text-indigo-400 bg-indigo-400/10" : "text-slate-500 hover:text-indigo-400 hover:bg-indigo-500/10"}`}
                  >
                    <FiAnchor size={16} />
                  </button>
                  <button
                    onClick={() => handleDeleteQuestion(qa._id)}
                    className="p-2 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                  >
                    <FiTrash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="pl-14 space-y-3">
                {qa.answers?.length > 0 ? (
                  qa.answers.map((ans, idx) => (
                    <div
                      key={idx}
                      className="bg-slate-950/50 border border-white/5 rounded-2xl p-4 relative group"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black text-slate-300 uppercase tracking-tight">
                            {ans.answeredByName}
                          </span>
                          {ans.isOwner && (
                            <span className="text-[8px] font-black bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-1 py-0.5 rounded uppercase">
                              Owner
                            </span>
                          )}
                        </div>
                        <span className="text-[9px] text-slate-600 font-bold">
                          {new Date(ans.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-slate-400 leading-relaxed">
                        {ans.answer}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="bg-slate-950/30 border border-dashed border-slate-800 rounded-2xl p-4 text-center">
                    <p className="text-xs text-slate-600 font-bold uppercase tracking-widest">
                      No answers yet
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminQA;
