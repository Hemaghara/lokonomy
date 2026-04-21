import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiAlertTriangle, FiX } from "react-icons/fi";
import { useConfirmState } from "../../context/ConfirmContext";

const ConfirmModal = () => {
  const { modalState, closeConfirm } = useConfirmState();
  const { isOpen, title, description, confirmLabel, isDanger, onConfirm } =
    modalState;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeConfirm}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
          >
            <div className="p-6">
              <div className="flex items-start gap-4">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    isDanger
                      ? "bg-rose-500/10 text-rose-500"
                      : "bg-indigo-500/10 text-indigo-500"
                  }`}
                >
                  <FiAlertTriangle size={20} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h3 className="text-xl font-black text-white tracking-tight">
                      {title}
                    </h3>
                    <button
                      onClick={closeConfirm}
                      className="text-slate-500 hover:text-slate-300 transition-colors"
                    >
                      <FiX size={20} />
                    </button>
                  </div>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    {description}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 mt-8">
                <button
                  onClick={closeConfirm}
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={onConfirm}
                  className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-bold text-white shadow-lg transition-all ${
                    isDanger
                      ? "bg-rose-600 hover:bg-rose-500 shadow-rose-500/20"
                      : "bg-indigo-600 hover:bg-indigo-500 shadow-indigo-500/20"
                  }`}
                >
                  {confirmLabel}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ConfirmModal;
