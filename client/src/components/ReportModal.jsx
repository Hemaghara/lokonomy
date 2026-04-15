import { useState } from "react";
import { toast } from "react-hot-toast";
import axios from "axios";
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
      const token = localStorage.getItem("token");
      await axios.post(
        "/api/reports",
        {
          targetType,
          targetId,
          reason,
          description,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      toast.success("Thank you for your report. Our team will review it.");
      onClose();
    } catch (error) {
      toast.error("Failed to submit report");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-600 flex items-center justify-center">
              <FiFlag size={16} />
            </div>
            <h3 className="text-lg font-black text-slate-900 tracking-tight">
              Report Content
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600"
          >
            <FiX size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">
              Reason for Reporting
            </label>
            <div className="grid grid-cols-2 gap-2">
              {reasons.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setReason(r)}
                  className={`px-3 py-2 rounded-xl text-left text-xs font-bold border transition-all ${
                    reason === r
                      ? "bg-rose-50 border-rose-200 text-rose-600 shadow-sm"
                      : "bg-slate-50 border-slate-100 text-slate-500 hover:border-slate-300"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">
              Additional Details (Optional)
            </label>
            <textarea
              className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-sm outline-none focus:bg-white focus:border-rose-400 transition-all resize-none"
              rows={3}
              placeholder="Tell us more about why you are reporting this..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-2xl border border-amber-100">
            <FiAlertTriangle className="text-amber-500 shrink-0" size={18} />
            <p className="text-[10px] text-amber-700 font-bold leading-relaxed uppercase tracking-tight">
              Submitting false reports can result in account restrictions.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading || !reason}
            className="w-full py-4 bg-slate-900 text-white font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-rose-600 transition-all shadow-xl disabled:opacity-50"
          >
            {loading ? "Submitting..." : "Submit Report"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ReportModal;
