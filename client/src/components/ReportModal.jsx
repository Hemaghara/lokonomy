import { useState } from "react";
import { toast } from "react-hot-toast";
import api from "../services/api";
import { FiFlag, FiX, FiAlertTriangle } from "react-icons/fi";

const ReportModal = ({ isOpen, onClose, targetType, targetId }) => {
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const reasons = [
    "Spam",
    "Inappropriate content",
    "Harassment",
    "Fraud/Scam",
    "Misleading information",
    "Intellectual property violation",
    "Other",
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason) return toast.error("Please select a reason");

    try {
      setLoading(true);
      await api.post("/reports", {
        targetType,
        targetId,
        reason,
        description,
      });

      toast.success("Thank you for your report. Our team will review it.");
      onClose();
    } catch (error) {
      console.log(error);
      toast.error("Failed to submit report");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-100 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="report-modal-title"
        className="bg-white w-full max-w-[calc(100vw-24px)] sm:max-w-md rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[calc(100vh-24px)] sm:max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-4 py-3 sm:px-6 sm:py-4 border-b border-slate-100 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center shrink-0">
              <FiFlag size={15} />
            </div>
            <h3
              id="report-modal-title"
              className="text-[15px] sm:text-lg font-black text-slate-900 tracking-tight"
            >
              Report Content
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 active:bg-slate-200 transition-all shrink-0"
          >
            <FiX size={18} />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="px-4 py-4 sm:px-6 sm:py-5 space-y-4 sm:space-y-5 overflow-y-auto flex-1 overscroll-contain"
        >
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2.5">
              Reason for Reporting
            </label>
            <div className="flex flex-wrap gap-2">
              {reasons.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setReason(r)}
                  className={`px-3 py-2 rounded-lg text-xs font-bold border transition-all ${reason === r
                      ? "bg-rose-50 border-rose-300 text-rose-600 shadow-sm ring-1 ring-rose-200"
                      : "bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300 active:bg-slate-100"
                    }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2.5">
              Additional Details (Optional)
            </label>
            <textarea
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-3 text-sm outline-none focus:bg-white focus:border-rose-400 focus:ring-2 focus:ring-rose-100 transition-all resize-none placeholder:text-slate-400"
              rows={3}
              placeholder="Tell us more about why you are reporting this..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="flex items-start gap-2.5 p-3 bg-amber-50 rounded-xl border border-amber-100">
            <FiAlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={14} />
            <p className="text-[10px] text-amber-700 font-bold leading-relaxed uppercase tracking-tight">
              Submitting false reports can result in account restrictions.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 sm:py-3.5 bg-slate-900 text-white text-xs sm:text-sm font-black uppercase tracking-widest rounded-xl hover:bg-rose-600 active:scale-[0.98] transition-all shadow-lg disabled:opacity-50"
          >
            {loading ? "Submitting..." : "Submit Report"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ReportModal;
