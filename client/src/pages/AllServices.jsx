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
import { FaSearch } from "react-icons/fa";

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
        .as * { font-family: 'DM Sans', sans-serif; }
      `}</style>

      <div className="as w-[96%] 3xl:w-[98%] mx-auto px-2 sm:px-4">
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
                All Services For Market 
              </h1>
              <p className="text-slate-500 text-xs mt-1 flex items-center gap-1.5 flex-wrap">
                <HiOutlineSquares2X2 className="text-violet-400 text-xs" />
                {categories.length} categories available
                <span className="text-slate-700">·</span>
                <HiOutlineMapPin className="text-rose-400 text-xs" />
                GPS-based search near by shop
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
          <div className="grid grid-cols-1 min-[540px]:grid-cols-2 min-[820px]:grid-cols-3 min-[1200px]:grid-cols-4 min-[1440px]:grid-cols-5 min-[1920px]:grid-cols-6 min-[2560px]:grid-cols-7 min-[3200px]:grid-cols-8 min-[3840px]:grid-cols-10 min-[5120px]:grid-cols-12 min-[7680px]:grid-cols-16 gap-4 sm:gap-6">
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
                  className="group bg-gradient-to-br from-[#111827] to-[#0d131f] border border-[#1f2a3d] rounded-2xl p-5 hover:border-violet-500/50 hover:shadow-[0_8px_30px_rgba(139,92,246,0.12)] hover:-translate-y-1 transition-all duration-300 cursor-pointer relative overflow-hidden flex flex-col"
                  onClick={() => navigate(`/category/${cat.name}`)}
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/5 rounded-full blur-3xl group-hover:bg-violet-500/10 transition-colors duration-500 pointer-events-none" />
                  <div className="absolute bottom-0 left-0 h-0.5 w-0 bg-gradient-to-r from-violet-500 to-fuchsia-500 group-hover:w-full transition-all duration-500 rounded-full" />

                  <div className="flex items-center gap-4 mb-5 pb-4 border-b border-[#1f2a3d]/60 relative z-10">
                    <div className={`w-12 h-12 rounded-xl border flex items-center justify-center text-3xl shrink-0 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-sm ${cat.color ? `${cat.color.bg} ${cat.color.text} border-transparent ${cat.color.hover}` : 'bg-gradient-to-br from-[#131d2e] to-[#0d1424] border-[#1f2a3d] group-hover:border-violet-500/30 text-slate-400'}`}>
                      {cat.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h2 className="text-slate-100 font-bold text-base group-hover:text-white group-hover:translate-x-0.5 transition-all truncate">
                        {cat.name}
                      </h2>
                      <p className="text-slate-400 text-xs mt-0.5 group-hover:text-slate-300 transition-colors">
                        {cat.subcategories.length} sub-categories
                      </p>
                    </div>
                    <HiOutlineArrowRight className="text-slate-600 text-base shrink-0 group-hover:text-violet-400 group-hover:translate-x-1 transition-all duration-300" />
                  </div>

                  <div className="grid grid-cols-2 gap-2.5 flex-1 relative z-10">
                    {visibleSubs.map((sub) => (
                      <button
                        key={sub.name}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleServiceClick(cat.name, sub.name);
                        }}
                        className="flex items-center gap-2 bg-[#0a0f18]/50 hover:bg-violet-500/10 border border-[#1f2a3d]/50 hover:border-violet-500/30 text-slate-400 hover:text-violet-300 px-3 py-2.5 rounded-xl text-xs font-medium transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md text-left overflow-hidden group/btn"
                      >
                        <span className="text-base shrink-0 group-hover/btn:scale-110 transition-transform">{sub.icon}</span>
                        <span className="truncate">{sub.name}</span>
                      </button>
                    ))}
                  </div>

                  {extraCount > 0 && (
                    <div className="mt-4 pt-3 border-t border-[#1f2a3d]/60 flex items-center justify-between relative z-10">
                      <span className="text-violet-400/80 group-hover:text-violet-400 text-xs font-semibold transition-colors">
                        +{extraCount} more services
                      </span>
                      <span className="flex items-center gap-1 text-slate-400 text-xs group-hover:text-white transition-colors font-medium">
                        Explore All{" "}
                        <HiOutlineChevronRight className="text-xs group-hover:translate-x-0.5 transition-transform" />
                      </span>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="border-2 border-dashed border-[#1f2a3d] rounded-2xl py-20 text-center">
            <div className="text-4xl mb-3 opacity-20">
              <FaSearch />
            </div>
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
