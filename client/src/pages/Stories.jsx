import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { storyService } from "../services";
import { useLocation } from "../context/LocationContext";
import { useUser } from "../context/UserContext";
import {
  HiOutlineNewspaper,
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
  HiOutlineHandThumbUp,
  HiOutlineEye,
  HiOutlineShare,
  HiOutlineCheckBadge,
} from "react-icons/hi2";
import ReportModal from "../components/ReportModal";
import { FiFlag } from "react-icons/fi";
import { toast } from "react-hot-toast";

const getTimeRemaining = (expiresAt) => {
  const now = Date.now();
  const exp = new Date(expiresAt).getTime();
  const diff = exp - now;
  if (diff <= 0)
    return { expired: true, label: "Expired", pct: 0, urgent: true };
  const totalMs = 24 * 60 * 60 * 1000;
  const pct = Math.max(0, Math.min(100, (diff / totalMs) * 100));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const urgent = diff < 3 * 60 * 60 * 1000;
  const label = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  return { expired: false, label, pct, urgent };
};

const ExpiryBadge = ({ expiresAt }) => {
  const [info, setInfo] = useState(() => getTimeRemaining(expiresAt));
  useEffect(() => {
    const id = setInterval(() => setInfo(getTimeRemaining(expiresAt)), 60000);
    return () => clearInterval(id);
  }, [expiresAt]);

  const barColor = info.expired
    ? "bg-red-500"
    : info.urgent
      ? "bg-orange-400"
      : "bg-violet-500";

  const textColor = info.expired
    ? "text-red-400"
    : info.urgent
      ? "text-orange-400"
      : "text-slate-500";

  return (
    <>
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-white/5 rounded-t-2xl overflow-hidden">
        <div
          className={`h-full ${barColor} transition-all duration-1000 ease-linear`}
          style={{ width: `${info.pct}%` }}
        />
      </div>
      <span
        className={`flex items-center gap-1 text-[10px] font-semibold ${textColor}`}
      >
        <HiOutlineClock className="text-xs shrink-0" />
        {info.expired ? "Expired" : `Expires in ${info.label}`}
      </span>
    </>
  );
};

const Stories = () => {
  const navigate = useNavigate();
  const { district, taluka } = useLocation();
  const { user } = useUser();
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [radius, setRadius] = useState(5000);
  const [filter, setFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [reportConfig, setReportConfig] = useState({
    isOpen: false,
    targetId: null,
  });

  const storyCategories = [
    "All",
    "News",
    "Offers",
    "Promotions",
    "Events",
    "Announcements",
    "Tips",
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
      case "News":
        return <HiOutlineNewspaper className="text-sky-400" />;
      case "Offers":
        return <HiOutlineTag className="text-emerald-400" />;
      case "Promotions":
        return <HiOutlineRocketLaunch className="text-violet-400" />;
      case "Events":
        return <HiOutlineCalendarDays className="text-pink-400" />;
      case "Announcements":
        return <HiOutlineMegaphone className="text-amber-400" />;
      case "Tips":
        return <HiOutlineLightBulb className="text-yellow-400" />;
      default:
        return <HiOutlineSparkles className="text-slate-400" />;
    }
  };

  const handleLike = async (e, storyId) => {
    e.stopPropagation();
    if (!user) {
      toast.error("Please login to like updates");
      return;
    }
    try {
      const response = await storyService.likeStory(storyId);
      setStories(
        stories.map((s) => (s._id === storyId ? response.data.data : s)),
      );
    } catch (err) {
      console.error("Like error:", err);
    }
  };

  const handleShare = async (e, story) => {
    e.stopPropagation();
    const shareData = {
      title: story.title,
      text: story.content,
      url: `${window.location.origin}/stories/${story._id}`,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        await storyService.shareStory(story._id);
        setStories(
          stories.map((s) =>
            s._id === story._id ? { ...s, shares: (s.shares || 0) + 1 } : s,
          ),
        );
      } else {
        await navigator.clipboard.writeText(shareData.url);
        toast.success("Link copied to clipboard!");
      }
    } catch (err) {
      console.error("Share error:", err);
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case "News":
        return "bg-sky-500/10 text-sky-400 border-sky-500/20";
      case "Offers":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "Promotions":
        return "bg-violet-500/10 text-violet-400 border-violet-500/20";
      case "Events":
        return "bg-pink-500/10 text-pink-400 border-pink-500/20";
      case "Announcements":
        return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case "Tips":
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
                <label
                  htmlFor="radius"
                  className="text-[10px] font-bold text-slate-500 uppercase tracking-tight"
                >
                  Radius
                </label>
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
                      : "bg-[#0d1424] text-slate-300 border-[#1f2a3d] hover:text-slate-300 hover:border-slate-600"
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
                    className={`${card} flex flex-col overflow-hidden hover:border-violet-500/30 hover:bg-[#131d2e] transition-all duration-300 cursor-pointer group relative`}
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

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setReportConfig({
                            isOpen: true,
                            targetId: story._id,
                          });
                        }}
                        className="absolute top-3 right-3 w-8 h-8 rounded-lg bg-slate-900/60 backdrop-blur-md border border-white/10 text-slate-400 opacity-0 group-hover:opacity-100 hover:text-rose-400 hover:bg-slate-900 transition-all flex items-center justify-center z-10"
                      >
                        <FiFlag size={14} />
                      </button>

                      {story.isVerified && (
                        <div className="absolute top-3 right-12">
                          <span className="flex items-center gap-1 bg-sky-500/20 text-sky-400 border border-sky-500/30 backdrop-blur-md px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                            <HiOutlineCheckBadge className="text-sm" /> Verified
                          </span>
                        </div>
                      )}
                    </div>

                    <div
                      className={`p-4 flex-1 flex flex-col transition-all duration-300 ${
                        !story.isHighlighted &&
                        getTimeRemaining(story.expiresAt).urgent
                          ? "ring-1 ring-inset ring-orange-500/20 bg-orange-500/2"
                          : ""
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <span className="flex items-center gap-1 text-[11px] text-violet-400 font-medium line-clamp-1">
                          <HiOutlineMapPin className="text-xs shrink-0" />
                          {story.locationAddress ||
                            story.taluka ||
                            story.district}
                        </span>
                        <span className="w-1 h-1 bg-slate-700 rounded-full" />
                        {story.isHighlighted ? (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                            <HiOutlineSparkles className="text-xs" /> Highlight
                          </span>
                        ) : (
                          <div
                            className={
                              getTimeRemaining(story.expiresAt).urgent
                                ? "animate-pulse"
                                : ""
                            }
                          >
                            <ExpiryBadge
                              expiresAt={
                                story.expiresAt ||
                                new Date(
                                  new Date(story.createdAt).getTime() +
                                    24 * 60 * 60 * 1000,
                                )
                              }
                            />
                          </div>
                        )}
                      </div>

                      <h3 className="text-slate-100 font-semibold text-base leading-snug mb-2 group-hover:text-violet-400 transition-colors line-clamp-2">
                        {story.title}
                      </h3>

                      <p className="text-slate-500 text-xs leading-relaxed line-clamp-2 mb-4">
                        {story.content}
                      </p>

                      <div className="flex items-center justify-between mt-auto pt-3 border-t border-[#1f2a3d]">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={(e) => handleLike(e, story._id)}
                            className={`flex items-center gap-1.5 text-[11px] font-semibold transition-colors ${
                              story.likes?.includes(user?.id)
                                ? "text-violet-400"
                                : "text-slate-500 hover:text-slate-300"
                            }`}
                          >
                            <HiOutlineHandThumbUp className="text-sm" />
                            {story.likes?.length || 0}
                          </button>
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-semibold">
                            <HiOutlineEye className="text-sm" />
                            {story.views || 0}
                          </div>
                          <button
                            onClick={(e) => handleShare(e, story)}
                            className="flex items-center gap-1.5 text-[11px] text-slate-500 hover:text-slate-300 font-semibold transition-colors"
                          >
                            <HiOutlineShare className="text-sm" />
                            {story.shares || 0}
                          </button>
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
      <ReportModal
        isOpen={reportConfig.isOpen}
        onClose={() => setReportConfig({ isOpen: false, targetId: null })}
        targetType="story"
        targetId={reportConfig.targetId}
      />
      <FloatingActionButton onClick={() => navigate("/stories/post")} />
    </div>
  );
};

const FloatingActionButton = ({ onClick }) => (
  <motion.button
    initial={{ scale: 0, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
    whileHover={{ scale: 1.1 }}
    whileTap={{ scale: 0.9 }}
    onClick={onClick}
    className="fixed bottom-24 right-6 z-50 sm:hidden w-14 h-14 bg-violet-600 text-white rounded-full shadow-2xl shadow-violet-900/50 flex items-center justify-center border border-violet-500/50 backdrop-blur-md"
  >
    <HiOutlinePlus className="text-2xl" />
  </motion.button>
);

export default Stories;
