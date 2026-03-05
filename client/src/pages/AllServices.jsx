import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { categories } from "../data/categories";
import { motion } from "framer-motion";
import {
  HiOutlineArrowLeft,
  HiOutlineMapPin,
  HiOutlineMagnifyingGlass,
  HiOutlineSquares2X2,
  HiOutlineArrowRight,
  HiOutlineXMark,
  HiOutlineChevronRight,
} from "react-icons/hi2";

const AllServices = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const handleServiceClick = (category, sub) => {
    navigate(`/services/${category}/${sub}`);
  };

  const filtered = categories.filter(
    (cat) =>
      cat.name.toLowerCase().includes(search.toLowerCase()) ||
      cat.subcategories.some((s) =>
        s.name.toLowerCase().includes(search.toLowerCase()),
      ),
  );

  return (
    <div className="min-h-screen bg-[#080e1a] pt-24 pb-20">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&display=swap');
        .as * { font-family: 'DM Sans', sans-serif; }
      `}</style>

      <div className="as max-w-6xl mx-auto px-4">
        <Link
          to="/explore"
          className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-300 text-xs font-medium transition-colors mb-6"
        >
          <HiOutlineArrowLeft className="text-sm" /> Back to Service Directory
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-[#111827] border border-[#1f2a3d] rounded-2xl p-6 mb-5"
        >
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-1">
              <p className="text-violet-400 text-[11px] font-semibold uppercase tracking-widest mb-1">
                Service Directory
              </p>
              <h1 className="text-white font-bold text-2xl sm:text-3xl leading-tight">
                All Services
              </h1>
              <p className="text-slate-500 text-xs mt-1 flex items-center gap-1.5 flex-wrap">
                <HiOutlineSquares2X2 className="text-violet-400 text-xs" />
                {categories.length} categories available
                <span className="text-slate-700">·</span>
                <HiOutlineMapPin className="text-rose-400 text-xs" />
                GPS-based nearby search
              </p>
            </div>

            <div className="relative sm:w-64 shrink-0">
              <HiOutlineMagnifyingGlass className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600 text-sm pointer-events-none" />
              <input
                type="text"
                placeholder="Search services…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-[#0d1424] border border-[#1f2a3d] rounded-xl pl-10 pr-9 py-2.5 text-sm text-slate-200 outline-none transition-all focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 placeholder:text-slate-600"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400 transition-colors"
                >
                  <HiOutlineXMark className="text-sm" />
                </button>
              )}
            </div>
          </div>
        </motion.div>

        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((cat, index) => {
              const matchedSubs = search
                ? cat.subcategories.filter((s) =>
                    s.name.toLowerCase().includes(search.toLowerCase()),
                  )
                : cat.subcategories;

              const visibleSubs = search
                ? matchedSubs
                : cat.subcategories.slice(0, 4);
              const extraCount = search ? 0 : cat.subcategories.length - 4;

              return (
                <motion.div
                  key={cat.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04, duration: 0.25 }}
                  className="group bg-[#111827] border border-[#1f2a3d] rounded-2xl p-5 hover:border-violet-500/40 hover:bg-[#131d2e] transition-all duration-300 cursor-pointer relative overflow-hidden flex flex-col"
                  onClick={() => navigate(`/category/${cat.name}`)}
                >
                  <div className="absolute bottom-0 left-0 h-0.5 w-0 bg-violet-400 group-hover:w-full transition-all duration-500 rounded-full" />

                  <div className="flex items-center gap-4 mb-5 pb-4 border-b border-[#1f2a3d]">
                    <div className="w-12 h-12 rounded-xl bg-[#0d1424] border border-[#1f2a3d] group-hover:border-violet-500/30 group-hover:bg-violet-500/10 flex items-center justify-center text-3xl shrink-0 group-hover:scale-110 transition-all duration-300">
                      {cat.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h2 className="text-slate-100 font-bold text-base group-hover:text-white transition-colors truncate">
                        {cat.name}
                      </h2>
                      <p className="text-slate-500 text-xs mt-0.5">
                        {cat.subcategories.length} sub-categories
                      </p>
                    </div>
                    <HiOutlineArrowRight className="text-slate-700 text-base shrink-0 group-hover:text-violet-400 group-hover:translate-x-0.5 transition-all duration-300" />
                  </div>

                  <div className="grid grid-cols-2 gap-2 flex-1">
                    {visibleSubs.map((sub) => (
                      <button
                        key={sub.name}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleServiceClick(cat.name, sub.name);
                        }}
                        className="flex items-center gap-2 bg-[#0d1424] hover:bg-violet-500/10 border border-[#1f2a3d] hover:border-violet-500/30 text-slate-400 hover:text-violet-400 px-3 py-2.5 rounded-xl text-xs font-medium transition-all text-left overflow-hidden"
                      >
                        <span className="text-base shrink-0">{sub.icon}</span>
                        <span className="truncate">{sub.name}</span>
                      </button>
                    ))}
                  </div>

                  {extraCount > 0 && (
                    <div className="mt-4 pt-3 border-t border-[#1f2a3d] flex items-center justify-between">
                      <span className="text-violet-400 text-xs font-semibold">
                        +{extraCount} more services
                      </span>
                      <span className="flex items-center gap-1 text-slate-500 text-xs group-hover:text-violet-400 transition-colors font-medium">
                        Explore All{" "}
                        <HiOutlineChevronRight className="text-xs" />
                      </span>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="border-2 border-dashed border-[#1f2a3d] rounded-2xl py-20 text-center">
            <div className="text-4xl mb-3 opacity-20">🔍</div>
            <p className="text-slate-500 text-sm font-semibold mb-4">
              No services found for "{search}"
            </p>
            <button
              onClick={() => setSearch("")}
              className="inline-flex items-center gap-2 bg-[#111827] border border-[#1f2a3d] text-slate-400 text-xs font-semibold px-4 py-2.5 rounded-xl transition-all hover:text-slate-300"
            >
              <HiOutlineXMark /> Clear Search
            </button>
          </div>
        )}

        {search && filtered.length > 0 && (
          <p className="text-slate-600 text-xs mt-4 text-center">
            {filtered.length} categor{filtered.length !== 1 ? "ies" : "y"} found
            for "{search}"
          </p>
        )}
      </div>
    </div>
  );
};

export default AllServices;
