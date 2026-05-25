import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { guaranteeService } from "../services";
import { toast } from "react-hot-toast";
import {
  HiOutlineExclamationTriangle,
  HiOutlineCurrencyRupee,
  HiOutlineClock,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineArrowLeft,
  HiOutlineInbox,
} from "react-icons/hi2";

const MyClaims = () => {
  const navigate = useNavigate();
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClaims();
  }, []);

  const fetchClaims = async () => {
    setLoading(true);
    try {
      const res = await guaranteeService.getMyClaims();
      if (res.data.success) {
        setClaims(res.data.claims || []);
      }
    } catch (err) {
      console.error("Error fetching disputes:", err);
      toast.error("Failed to load dispute claims");
    } finally {
      setLoading(false);
    }
  };

  const statusMap = {
    pending: {
      label: "Pending Review",
      color: "text-amber-400",
      bg: "bg-amber-400/10",
      icon: <HiOutlineClock />,
    },
    investigating: {
      label: "Under Investigation",
      color: "text-indigo-400",
      bg: "bg-indigo-400/10",
      icon: <HiOutlineClock />,
    },
    resolved_buyer: {
      label: "Resolved (Buyer Refunded)",
      color: "text-emerald-400",
      bg: "bg-emerald-400/10",
      icon: <HiOutlineCheckCircle />,
    },
    resolved_seller: {
      label: "Resolved (Payout Cleared)",
      color: "text-blue-400",
      bg: "bg-blue-400/10",
      icon: <HiOutlineCheckCircle />,
    },
    rejected: {
      label: "Claim Rejected",
      color: "text-rose-400",
      bg: "bg-rose-400/10",
      icon: <HiOutlineXCircle />,
    },
  };

  const getStatusConfig = (status) => statusMap[status] || statusMap.pending;

  if (loading)
    return (
      <div className="min-h-screen bg-[#080e1a] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 border-2 border-violet-500/20 border-t-violet-500 rounded-full animate-spin" />
            <HiOutlineExclamationTriangle className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-violet-500 text-xl animate-pulse" />
          </div>
          <span className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em]">
            Loading Dispute Center...
          </span>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-[#080e1a] pt-24 pb-20">
      <div className="max-w-4xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10"
        >
          <div>
            <button
              onClick={() => navigate("/my-orders")}
              className="flex items-center gap-2 text-violet-400 hover:text-white text-xs font-bold mb-4 transition-colors"
            >
              <HiOutlineArrowLeft /> Back to Orders
            </button>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-violet-500" />
              <span className="text-[10px] font-bold text-violet-400 uppercase tracking-[0.2em]">
                Lokonomy Guarantee
              </span>
            </div>
            <h1 className="text-white font-black text-3xl md:text-4xl tracking-tight mb-2">
              Dispute{" "}
              <span className="text-transparent bg-clip-text bg-linear-to-r from-violet-400 to-indigo-400">
                Center
              </span>
            </h1>
            <p className="text-slate-500 text-sm">
              Track mediation claims and resolutions under the Guarantee Program.
            </p>
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          {claims.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-24 bg-[#111827] border border-[#1f2a3d] rounded-[2.5rem] shadow-2xl shadow-black/40"
            >
              <div className="w-20 h-20 bg-[#0d1424] rounded-full flex items-center justify-center text-4xl mx-auto mb-6 opacity-40">
                🛡️
              </div>
              <h2 className="text-white font-black text-2xl mb-2">
                No active disputes
              </h2>
              <p className="text-slate-500 text-sm max-w-xs mx-auto mb-8">
                Your account is in perfect standing. All orders are protected under the Lokonomy Guarantee.
              </p>
            </motion.div>
          ) : (
            <div className="space-y-6">
              {claims.map((claim, idx) => {
                const status = getStatusConfig(claim.status);
                return (
                  <motion.div
                    key={claim._id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="bg-[#111827] border border-[#1f2a3d] rounded-4xl overflow-hidden hover:border-violet-500/20 transition-all shadow-xl shadow-black/20 group"
                  >
                    <div className="p-6 sm:p-8">
                      <div className="flex flex-col md:flex-row justify-between gap-6">
                        <div className="flex-1 space-y-4">
                          <div className="flex flex-wrap items-center gap-3">
                            <span
                              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[9px] font-black uppercase tracking-wider ${status.color} ${status.bg}`}
                            >
                              {status.icon}
                              {status.label}
                            </span>
                            <span className="text-slate-600 text-[9px] font-black uppercase tracking-widest border border-slate-700 px-2 py-1 rounded-full">
                              Claim ID: #{claim._id.slice(-6).toUpperCase()}
                            </span>
                          </div>
                          
                          <div>
                            <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-1">Reason for Claim</p>
                            <p className="text-white text-sm leading-relaxed font-semibold">“{claim.reason}”</p>
                          </div>

                          {claim.evidence && (
                            <div>
                              <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-1">Evidence Provided</p>
                              <p className="text-slate-400 text-xs leading-relaxed italic">{claim.evidence}</p>
                            </div>
                          )}

                          {claim.resolution && (
                            <div className="bg-violet-950/10 border border-violet-500/15 p-4 rounded-2xl mt-2">
                              <p className="text-[10px] font-black text-violet-400 uppercase tracking-widest mb-1">Mediation Resolution Note</p>
                              <p className="text-slate-300 text-xs leading-relaxed">{claim.resolution}</p>
                              {claim.refundAmount > 0 && (
                                <div className="mt-2.5 flex items-center gap-1.5 text-emerald-400 font-bold text-sm">
                                  <HiOutlineCurrencyRupee /> Refund Amount: ₹{claim.refundAmount}
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="md:w-52 flex flex-col justify-between border-t md:border-t-0 md:border-l border-[#1f2a3d] pt-6 md:pt-0 md:pl-6 text-xs text-slate-500 space-y-3">
                          <div>
                            <p className="text-[9px] uppercase font-bold tracking-wider text-slate-600">Order ID</p>
                            <p className="text-slate-400 font-mono text-[11px] mt-0.5">#{claim.orderId?._id || claim.orderId}</p>
                          </div>
                          <div>
                            <p className="text-[9px] uppercase font-bold tracking-wider text-slate-600">Filing Date</p>
                            <p className="text-slate-400 text-[11px] mt-0.5">{new Date(claim.createdAt).toLocaleDateString()}</p>
                          </div>
                          <div className="pt-2 border-t border-white/5">
                            <button
                              onClick={() => navigate("/my-orders")}
                              className="w-full bg-[#080e1a] hover:bg-black border border-[#1f2a3d] text-slate-400 hover:text-white text-[9px] font-black uppercase tracking-widest py-2 rounded-lg transition-all"
                            >
                              Track Order
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default MyClaims;
