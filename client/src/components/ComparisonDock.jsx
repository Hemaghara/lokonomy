import { motion, AnimatePresence } from "framer-motion";
import { useComparison } from "../context/ComparisonContext";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { businessService } from "../services";
import { FaTrash, FaChartBar, FaTimes } from "react-icons/fa";

const ComparisonDock = () => {
  const { selectedIds, toggleSelection, clearSelection } = useComparison();
  const navigate = useNavigate();
  const [data, setData] = useState([]);

  const shimmerStyle = `
    @keyframes shimmer {
      0% { transform: translateX(-100%); }
      100% { transform: translateX(100%); }
    }
    .animate-shimmer {
      animation: shimmer 2s infinite;
    }
  `;

  useEffect(() => {
    const fetch = async () => {
      if (selectedIds.length === 0) {
        setData([]);
        return;
      }
      try {
        const results = await Promise.all(
          selectedIds.map((id) => businessService.getBusinessById(id)),
        );
        setData(results.map((r) => r.data));
      } catch (e) {
        console.error("Comparison data fetch failed", e);
      }
    };
    fetch();
  }, [selectedIds]);

  if (selectedIds.length === 0) return null;

  return (
    <>
      <style>{shimmerStyle}</style>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-8 left-1/2 -translate-x-1/2 z-100 w-full max-w-2xl px-4 pointer-events-none"
      >
        <div className="bg-[#1a2133]/90 backdrop-blur-2xl border border-white/10 rounded-4xl p-3 pl-4 pr-6 shadow-[0_32px_128px_-16px_rgba(0,0,0,0.5)] flex items-center gap-6 overflow-hidden pointer-events-auto ring-1 ring-white/10">
          <div className="flex -space-x-3 ml-2 relative">
            {data.map((b) => (
              <motion.div
                layout
                key={b._id}
                className="relative w-14 h-14 rounded-3xl border-2 border-[#1a2133] bg-dark-bg overflow-hidden shadow-2xl ring-2 ring-primary/20 group cursor-pointer"
                onClick={() => toggleSelection(b._id)}
              >
                {b.logo ? (
                  <img
                    src={b.logo}
                    className="w-full h-full object-cover transition-transform group-hover:scale-110"
                    alt={b.name}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs">
                    🏢
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <FaTimes className="text-white text-xs" />
                </div>
              </motion.div>
            ))}
            {[...Array(Math.max(0, 3 - selectedIds.length))].map((_, i) => (
              <div
                key={i}
                className="w-14 h-14 rounded-3xl border-2 border-dashed border-white/5 bg-white/2 flex items-center justify-center text-text-dim/20 text-[12px] font-black"
              >
                +
              </div>
            ))}
          </div>

          <div className="flex-1 min-w-0">
            <span className="block text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-0.5 animate-pulse">
              Active Comparison
            </span>
            <span className="block text-white text-[13px] font-bold truncate">
              {selectedIds.length === 1
                ? "Select one more to unlock comparison"
                : `Comparing ${selectedIds.length} top choices`}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={clearSelection}
              className="group flex flex-col items-center gap-1 px-2"
            >
              <div className="p-2 rounded-xl bg-white/5 group-hover:bg-red-500/10 transition-colors">
                <FaTrash className="text-text-dim group-hover:text-red-400 text-xs transition-colors" />
              </div>
              <span className="text-[8px] font-black text-text-dim uppercase tracking-widest group-hover:text-red-400 transition-colors">
                reset
              </span>
            </button>

            <motion.button
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.95 }}
              disabled={selectedIds.length < 2 || selectedIds.length > 3}
              onClick={() => navigate(`/compare?ids=${selectedIds.join(",")}`)}
              className={`group relative h-14 px-8 rounded-3xl font-black text-[10px] uppercase tracking-[0.2em] transition-all duration-500 flex items-center gap-3 overflow-hidden ${
                selectedIds.length >= 2 && selectedIds.length <= 3
                  ? "bg-primary text-white shadow-lg shadow-primary/30"
                  : "bg-white/5 text-white/20 cursor-not-allowed border border-white/10"
              }`}
            >
              <div className="absolute inset-0 bg-linear-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:animate-shimmer" />
              <FaChartBar className="text-sm" />
              <span>Launch Analysis</span>
            </motion.button>
          </div>
        </div>
      </motion.div>
    </>
  );
};

export default ComparisonDock;
