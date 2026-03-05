import { motion } from "framer-motion";
import { useParams, useNavigate } from "react-router-dom";
import { categories } from "../data/categories";
import { useLocation } from "../context/LocationContext";
import { useUser } from "../context/UserContext";
import { toast } from "react-hot-toast";
import {
  HiOutlineArrowLeft,
  HiOutlineMapPin,
  HiOutlineMagnifyingGlass,
  HiOutlineSquares2X2,
  HiOutlineArrowRight,
  HiOutlineXMark,
} from "react-icons/hi2";
import { useState } from "react";

const SubCategories = () => {
  const { categoryName } = useParams();
  const navigate = useNavigate();
  const { district, taluka } = useLocation();
  const { user } = useUser();
  const [search, setSearch] = useState("");

  const categoryData = categories.find((c) => c.name === categoryName);

  if (!categoryData) {
    return (
      <div className="min-h-screen bg-[#080e1a] flex flex-col items-center justify-center text-center px-6">
        <div className="text-5xl mb-4 opacity-20">🗂️</div>
        <h2 className="text-white font-semibold text-lg mb-2">
          Category Not Found
        </h2>
        <p className="text-slate-500 text-sm mb-6">
          This service category does not exist.
        </p>
        <button
          onClick={() => navigate("/explore")}
          className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold px-5 py-2.5 rounded-xl transition-all"
        >
          <HiOutlineArrowLeft /> Return to Directory
        </button>
      </div>
    );
  }

  const handleSubClick = (sub) => {
    // Check if we have ANY valid location info (GPS address or manual selection)
    const hasLocation = user?.locationName || (district && taluka);

    if (!hasLocation) {
      toast.error("Please select your location to view nearby services!");
      return;
    }
    navigate(`/services/${categoryName}/${sub}`);
  };

  const filtered = categoryData.subcategories.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-[#080e1a] pt-24 pb-20">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&display=swap');
        .sc * { font-family: 'DM Sans', sans-serif; }
      `}</style>

      <div className="sc max-w-6xl mx-auto px-4">
        <motion.button
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-300 text-xs font-medium transition-colors mb-6"
        >
          <HiOutlineArrowLeft className="text-sm" /> Back to Directory
        </motion.button>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-[#111827] border border-[#1f2a3d] rounded-2xl p-6 mb-5"
        >
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <div className="w-14 h-14 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-3xl shrink-0">
                {categoryData.icon}
              </div>
              <div>
                <p className="text-violet-400 text-[11px] font-semibold uppercase tracking-widest mb-0.5">
                  Service Category
                </p>
                <h1 className="text-white font-bold text-xl sm:text-2xl leading-tight">
                  {categoryData.name}
                </h1>
                <p className="text-slate-500 text-xs mt-0.5 flex items-center gap-1">
                  <HiOutlineMapPin className="text-rose-400 text-xs" />
                  {user?.locationName ||
                    (taluka && district
                      ? `${taluka}, ${district}`
                      : district || "Select your location")}
                  <span className="text-slate-700 mx-1">·</span>
                  <HiOutlineSquares2X2 className="text-violet-400 text-xs" />
                  {categoryData.subcategories.length} sub-categories
                </p>
              </div>
            </div>

            <div className="relative sm:w-64 shrink-0">
              <HiOutlineMagnifyingGlass className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600 text-sm pointer-events-none" />
              <input
                type="text"
                placeholder="Search sub-categories…"
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
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {filtered.map((sub, index) => (
              <motion.div
                key={sub.name}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04, duration: 0.25 }}
                onClick={() => handleSubClick(sub.name)}
                className="group relative bg-[#111827] border border-[#1f2a3d] rounded-2xl p-5 flex flex-col items-center text-center cursor-pointer
                           hover:border-violet-500/40 hover:bg-[#131d2e] transition-all duration-300 overflow-hidden"
              >
                <div className="absolute bottom-0 left-0 h-0.5 w-0 bg-violet-400 group-hover:w-full transition-all duration-500 rounded-full" />
                <div className="w-12 h-12 rounded-xl bg-[#0d1424] border border-[#1f2a3d] group-hover:border-violet-500/30 group-hover:bg-violet-500/10 flex items-center justify-center text-2xl mb-3 group-hover:scale-110 transition-all duration-300">
                  {sub.icon}
                </div>

                <h3 className="text-slate-300 font-semibold text-xs leading-snug group-hover:text-white transition-colors duration-300 mb-2">
                  {sub.name}
                </h3>

                <div className="w-6 h-6 rounded-lg bg-[#0d1424] border border-[#1f2a3d] flex items-center justify-center mt-auto opacity-0 group-hover:opacity-100 group-hover:border-violet-500/30 transition-all duration-300">
                  <HiOutlineArrowRight className="text-violet-400 text-xs" />
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="border-2 border-dashed border-[#1f2a3d] rounded-2xl py-20 text-center">
            <div className="text-4xl mb-3 opacity-20">🔍</div>
            <p className="text-slate-500 text-sm font-semibold mb-4">
              No sub-categories found for "
              <span className="text-slate-400">{search}</span>"
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
            {filtered.length} result{filtered.length !== 1 ? "s" : ""} for "
            {search}"
          </p>
        )}
      </div>
    </div>
  );
};

export default SubCategories;
