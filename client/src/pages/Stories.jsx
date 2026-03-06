import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { storyService } from "../services";
import { useLocation } from "../context/LocationContext";
import { useUser } from "../context/UserContext";
import {
  HiOutlineNewspaper,
  HiOutlineFire,
  HiOutlineTag,
  HiOutlineRocketLaunch,
  HiOutlineCalendarDays,
  HiOutlineMegaphone,
  HiOutlineLightBulb,
  HiOutlineSparkles,
  HiOutlineMagnifyingGlass,
  HiOutlineMapPin,
  HiOutlineArrowRight,
  HiOutlinePlus,
  HiOutlineClock,
  HiOutlineUser,
} from "react-icons/hi2";

const Stories = () => {
  const navigate = useNavigate();
  const { district, taluka } = useLocation();
  const { user } = useUser();
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [radius, setRadius] = useState(5000); 
  const [filter, setFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const storyCategories = [
    "All",
    "News / Updates",
    "Trending Offer",
    "Sale / Offer",
    "Product Promotion",
    "Events / Campaigns",
    "Announcement",
    "Tips / Info",
  ];

  useEffect(() => {
    fetchStories();
  }, [district, filter, searchQuery, radius, user?.latitude]);

  const fetchStories = async () => {
    setLoading(true);
    try {
      const params = {
        type: filter,
        search: searchQuery,
      };

      if (user?.latitude && user?.longitude) {
        params.lat = user.latitude;
        params.lng = user.longitude;
        params.radius = radius;
      } else {
        params.district = district;
      }

      const response = await storyService.getStories(params);
      setStories(response.data.data || []);
    } catch (err) {
      console.error("Story fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const getIconForType = (type) => {
    switch (type) {
      case "News / Updates":
        return <HiOutlineNewspaper className="text-sky-400" />;
      case "Trending Offer":
        return <HiOutlineFire className="text-orange-400" />;
      case "Sale / Offer":
        return <HiOutlineTag className="text-emerald-400" />;
      case "Product Promotion":
        return <HiOutlineRocketLaunch className="text-violet-400" />;
      case "Events / Campaigns":
        return <HiOutlineCalendarDays className="text-pink-400" />;
      case "Announcement":
        return <HiOutlineMegaphone className="text-amber-400" />;
      case "Tips / Info":
        return <HiOutlineLightBulb className="text-yellow-400" />;
      default:
        return <HiOutlineSparkles className="text-slate-400" />;
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case "News / Updates":
        return "bg-sky-500/10 text-sky-400 border-sky-500/20";
      case "Trending Offer":
        return "bg-orange-500/10 text-orange-400 border-orange-500/20";
      case "Sale / Offer":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "Product Promotion":
        return "bg-violet-500/10 text-violet-400 border-violet-500/20";
      case "Events / Campaigns":
        return "bg-pink-500/10 text-pink-400 border-pink-500/20";
      case "Announcement":
        return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case "Tips / Info":
        return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
      default:
        return "bg-slate-500/10 text-slate-400 border-slate-500/20";
    }
  };
  const card = "bg-[#111827] border border-[#1f2a3d] rounded-2xl";
  const inputCls =
    "w-full bg-[#0d1424] border border-[#1f2a3d] rounded-xl px-4 py-3 text-sm text-slate-200 outline-none transition-all focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 placeholder:text-slate-600";

  return (
    <div className="min-h-screen bg-[#080e1a] pt-24 pb-20">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&display=swap');
        .st * { font-family: 'DM Sans', sans-serif; }
        .no-sb::-webkit-scrollbar { display: none; }
      `}</style>

      <div className="st max-w-6xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8"
        >
          <div>
            <p className="text-violet-400 text-[11px] font-semibold uppercase tracking-widest mb-1">
              Community Pulse
            </p>
            <h1 className="text-white font-bold text-3xl leading-tight">
              Community Updates
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Local signals from{" "}
              <span className="text-slate-300 font-medium">
                {user?.locationName || taluka || district || "your area"}
              </span>
            </p>
          </div>
          <button
            onClick={() => navigate("/stories/post")}
            className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 active:scale-[.98] text-white text-xs font-semibold px-5 py-3 rounded-xl transition-all shadow-lg shadow-violet-900/30 self-start sm:self-auto"
          >
            <HiOutlinePlus className="text-base" /> Broadcast Update
          </button>
        </motion.div>

        <div className={`${card} p-4 mb-6 flex flex-col gap-4`}>
          <div className="relative">
            <HiOutlineMagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 text-base pointer-events-none" />
            <input
              type="text"
              placeholder="Search community updates…"
              className={inputCls + " pl-11"}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap items-center gap-4">
            {user?.latitude && (
              <div className="flex items-center gap-2 bg-[#0d1424] border border-[#1f2a3d] rounded-xl px-3 py-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">
                  Radius
                </span>
                <select
                  value={radius}
                  onChange={(e) => setRadius(Number(e.target.value))}
                  className="bg-transparent text-xs font-bold text-violet-400 outline-none cursor-pointer"
                >
                  <option value={5000}>5 KM</option>
                  <option value={10000}>10 KM</option>
                  <option value={15000}>15 KM</option>
                  <option value={20000}>20 KM</option>
                  <option value={25000}>25 KM</option>
                  <option value={50000}>50 KM</option>
                </select>
              </div>
            )}
          </div>

          <div className="no-sb flex items-center gap-2 overflow-x-auto">
            {storyCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border
                  ${
                    filter === cat
                      ? "bg-violet-600 text-white border-violet-600 shadow-md shadow-violet-900/30"
                      : "bg-[#0d1424] text-slate-500 border-[#1f2a3d] hover:text-slate-300 hover:border-slate-600"
                  }`}
              >
                <span
                  className={`text-sm ${filter === cat ? "text-white" : ""}`}
                >
                  {getIconForType(cat)}
                </span>
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="min-h-64">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="bg-[#111827] h-80 rounded-2xl animate-pulse opacity-40"
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <AnimatePresence mode="popLayout">
                {stories.map((story) => (
                  <motion.div
                    layout
                    key={story._id}
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.97 }}
                    transition={{ duration: 0.18 }}
                    onClick={() => navigate(`/stories/${story._id}`)}
                    className={`${card} flex flex-col overflow-hidden hover:border-violet-500/30 hover:bg-[#131d2e] transition-all duration-300 cursor-pointer group`}
                  >
                    <div className="relative aspect-video overflow-hidden bg-[#0d1424]">
                      {story.image ? (
                        <img
                          src={story.image}
                          alt=""
                          className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-5xl opacity-10">
                            {getIconForType(story.type)}
                          </span>
                        </div>
                      )}

                      <div className="absolute top-3 left-3">
                        <span
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] font-semibold uppercase tracking-wide backdrop-blur-sm ${getTypeColor(story.type)}`}
                        >
                          <span className="text-sm">
                            {getIconForType(story.type)}
                          </span>
                          {story.type}
                        </span>
                      </div>
                    </div>

                    <div className="p-4 flex-1 flex flex-col">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="flex items-center gap-1 text-[11px] text-violet-400 font-medium line-clamp-1">
                          <HiOutlineMapPin className="text-xs shrink-0" />
                          {story.locationAddress ||
                            story.taluka ||
                            story.district}
                        </span>
                        <span className="w-1 h-1 bg-slate-700 rounded-full" />
                        <span className="flex items-center gap-1 text-[11px] text-slate-600">
                          <HiOutlineClock className="text-xs" />
                          {new Date(story.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      <h3 className="text-slate-100 font-semibold text-base leading-snug mb-2 group-hover:text-violet-400 transition-colors line-clamp-2 flex-1">
                        {story.title}
                      </h3>

                      <p className="text-slate-500 text-xs leading-relaxed line-clamp-2 mb-4">
                        {story.content}
                      </p>

                      <div className="flex items-center justify-between pt-3 border-t border-[#1f2a3d]">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 text-xs font-bold">
                            {story.author?.[0]?.toUpperCase()}
                          </div>
                          <div>
                            <p className="text-slate-300 text-xs font-medium leading-none">
                              {story.author}
                            </p>
                            <p className="text-slate-600 text-[10px] mt-0.5 flex items-center gap-1">
                              <HiOutlineUser className="text-xs" /> Reporter
                            </p>
                          </div>
                        </div>
                        <div className="w-7 h-7 rounded-lg bg-[#0d1424] border border-[#1f2a3d] flex items-center justify-center text-slate-600 group-hover:text-violet-400 group-hover:border-violet-500/30 transition-colors">
                          <HiOutlineArrowRight className="text-sm" />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {stories.length === 0 && !loading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="col-span-full border-2 border-dashed border-[#1f2a3d] rounded-2xl py-24 text-center"
                >
                  <div className="text-5xl mb-4 opacity-20">📡</div>
                  <h3 className="text-slate-500 font-semibold text-base mb-1">
                    No Updates Found
                  </h3>
                  <p className="text-slate-600 text-xs">
                    Try a different category or search term
                  </p>
                </motion.div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Stories;
