import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

const Pagination = ({ page, totalPages, onPage }) =>
  totalPages > 1 ? (
    <div className="flex justify-center items-center gap-3 pt-8 pb-4">
      <button
        disabled={page === 1}
        onClick={() => onPage(page - 1)}
        aria-label="Previous Page"
        className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 text-xs font-bold disabled:opacity-30 disabled:cursor-not-allowed hover:border-slate-700 hover:text-white transition-all"
      >
        <FiChevronLeft size={14} /> Prev
      </button>
      <span className="text-xs text-slate-500 font-semibold px-2">
        <span className="text-white font-bold">{page}</span> / {totalPages}
      </span>
      <button
        disabled={page === totalPages}
        onClick={() => onPage(page + 1)}
        aria-label="Next Page"
        className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold disabled:opacity-30 disabled:cursor-not-allowed hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20"
      >
        Next <FiChevronRight size={14} />
      </button>
    </div>
  ) : null;

export default Pagination;
