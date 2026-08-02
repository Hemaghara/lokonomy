import { useState, useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { storyService } from "../services";
import { useLocation } from "../context/LocationContext";
import { useUser } from "../context/UserContext";
import { getIconForType } from "../utils/storyHelpers";
import { getSocket, joinStoryFeed, leaveStoryFeed } from "../services/socket";
import StoryCard from "../components/StoryCard";
import ReportModal from "../components/ReportModal";
import Pagination from "../components/Pagination";
import {
  HiOutlineMagnifyingGlass,
  HiOutlinePlus,
  HiOutlineFire,
  HiOutlineClock,
  HiOutlineMapPin,
} from "react-icons/hi2";
import { toast } from "react-hot-toast";
import StoryFullscreenViewer from "../components/StoryFullscreenViewer";
import StoryHeatmap from "../components/StoryHeatmap";
import {
  HiOutlinePlay,
  HiOutlineMap,
  HiOutlineInformationCircle,
} from "react-icons/hi2";

const Stories = () => {
  const navigate = useNavigate();
  const { district, taluka } = useLocation();
  const { user } = useUser();
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [savedStoryIds, setSavedStoryIds] = useState(new Set());
  const [newStoryIds, setNewStoryIds] = useState(new Set());
  const [reportConfig, setReportConfig] = useState({ isOpen: false, targetId: null });
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [filter, setFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("latest");
  const [radius, setRadius] = useState(10000);

  const storyCategories = [
    "All", "News", "Offers", "Promotions", "Events", "Announcements", "Tips",
  ];

  const sortOptions = [
    { id: "latest", label: "Latest", icon: <HiOutlineClock className="text-sm" /> },
    { id: "trending", label: "Trending", icon: <HiOutlineFire className="text-sm" /> },
    ...(user?.latitude ? [{ id: "nearest", label: "Nearest", icon: <HiOutlineMapPin className="text-sm" /> }] : []),
  ];

  useEffect(() => {
    if (user) {
      storyService.getSavedStories()
        .then(res => {
          const ids = new Set((res.data.data || []).map(s => s._id));
          setSavedStoryIds(ids);
        })
        .catch(() => {});
    }
  }, [user]);

  useEffect(() => {
    if (!district) return;
    const socket = getSocket();
    joinStoryFeed(district);

    const handleNewStory = (story) => {
      setStories(prev => {
        if (prev.find(s => s._id === story._id)) return prev;
        return [story, ...prev];
      });
      setNewStoryIds(prev => new Set([...prev, story._id]));
      setTimeout(() => {
        setNewStoryIds(prev => {
          const next = new Set(prev);
          next.delete(story._id);
          return next;
        });
      }, 3000);
    };

    const handleStoryUpdated = ({ _id, likes }) => {
      setStories(prev => prev.map(s =>
        s._id === _id ? { ...s, likes } : s
      ));
    };

    socket.on("new_story", handleNewStory);
    socket.on("story_updated", handleStoryUpdated);

    return () => {
      leaveStoryFeed(district);
      socket.off("new_story", handleNewStory);
      socket.off("story_updated", handleStoryUpdated);
    };
  }, [district]);
  const fetchStories = useCallback(async (pageNum = 1) => {
    setLoading(true);
    try {
      const params = {
        type: filter,
        search: searchQuery,
        sort: sortBy,
        page: pageNum,
        limit: 5,
        district: district,
      };

      if (user?.latitude && user?.longitude) {
        params.lat = user.latitude;
        params.lng = user.longitude;
        params.radius = radius;
      }

      const response = await storyService.getStories(params);
      const newData = response.data.data || [];
      const resPagination = response.data.pagination;

      setStories(newData);
      setPagination(resPagination);
      setPage(pageNum);
    } catch (err) {
      console.error("Story fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [filter, searchQuery, sortBy, district, user?.latitude, user?.longitude, radius]);

  useEffect(() => {
    setPage(1);
    setStories([]);
    fetchStories(1);
  }, [district, filter, searchQuery, radius, user?.latitude, sortBy, fetchStories]);

  const handleLike = async (e, storyId) => {
    e.stopPropagation();
    if (!user) {
      toast.error("Please login to like updates");
      return;
    }
    try {
      const response = await storyService.likeStory(storyId);
      setStories(stories.map(s => s._id === storyId ? response.data.data : s));
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
        setStories(stories.map(s =>
          s._id === story._id ? { ...s, shares: (s.shares || 0) + 1 } : s
        ));
      } else {
        await navigator.clipboard.writeText(shareData.url);
        toast.success("Link copied to clipboard!");
      }
    } catch (err) {
      console.error("Share error:", err);
    }
  };

  const handleBookmark = async (e, storyId) => {
    e.stopPropagation();
    if (!user) {
      toast.error("Please login to save stories");
      return;
    }
    try {
      const res = await storyService.toggleBookmark(storyId);
      setSavedStoryIds(prev => {
        const next = new Set(prev);
        if (res.data.isBookmarked) next.add(storyId);
        else next.delete(storyId);
        return next;
      });
      toast.success(res.data.message);
    } catch (err) {
      console.error("Bookmark error:", err);
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
              id="searchQuery"
              name="searchQuery"
              type="text"
              placeholder="Search community updates…"
              className={inputCls + " pl-11"}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

  
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center bg-[#0d1424] border border-[#1f2a3d] rounded-xl p-1 gap-1">
              {sortOptions.map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setSortBy(opt.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                    sortBy === opt.id
                      ? "bg-violet-600 text-white shadow-md shadow-violet-900/30"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {opt.icon}
                  {opt.label}
                </button>
              ))}
            </div>

            {user?.latitude && (
              <div className="flex items-center gap-2 bg-[#0d1424] border border-[#1f2a3d] rounded-xl px-3 py-2">
                <label
                  htmlFor="radius"
                  className="text-[10px] font-bold text-slate-500 uppercase tracking-tight"
                >
                  Radius
                </label>
                <select
                  id="radius"
                  name="radius"
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
                <span className={`text-sm ${filter === cat ? "text-white" : ""}`}>
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
                  <div key={story._id}>
                    <StoryCard
                      story={story}
                      onLike={handleLike}
                      onShare={handleShare}
                      onBookmark={handleBookmark}
                      onReport={(id) => setReportConfig({ isOpen: true, targetId: id })}
                      showDistance={!!user?.latitude}
                      userLocation={user?.latitude ? { lat: user.latitude, lng: user.longitude } : null}
                      isBookmarked={savedStoryIds.has(story._id)}
                      isNew={newStoryIds.has(story._id)}
                    />
                  </div>
                ))}
              </AnimatePresence>

              {stories.length > 0 && pagination?.totalPages > 1 && (
                <Pagination
                  page={page}
                  totalPages={pagination.totalPages}
                  onPage={(p) => {
                    fetchStories(p);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                />
              )}

              {stories.length === 0 && !loading && (
                <div
                  className="col-span-full border-2 border-dashed border-[#1f2a3d] rounded-2xl py-24 text-center"
                >
                  <h3 className="text-slate-500 font-semibold text-base mb-1">
                    No Updates Found
                  </h3>
                  <p className="text-slate-600 text-xs">
                    Try a different category or search term
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <ReportModal
        isOpen={reportConfig.isOpen}
        onClose={() => setReportConfig({ isOpen: false, targetId: null })}
        targetType="Story"
        targetId={reportConfig.targetId}
      />

      <div className="fixed bottom-24 right-6 flex flex-col gap-3 z-40">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowHeatmap(!showHeatmap)}
          className="w-14 h-14 rounded-full bg-slate-900 border border-slate-800 text-emerald-400 flex items-center justify-center shadow-2xl hover:border-emerald-500/50 transition-all"
          title="Story Heatmap"
        >
          <HiOutlineMap size={24} />
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            if (stories.length > 0) {
              setViewerIndex(0);
              setViewerOpen(true);
            } else {
              toast.error("No stories to play");
            }
          }}
          className="w-14 h-14 rounded-full bg-linear-to-tr from-violet-600 to-indigo-600 text-white flex items-center justify-center shadow-2xl shadow-violet-500/20"
          title="Immersive Experience"
        >
          <HiOutlinePlay size={24} className="ml-1" />
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate("/stories/post")}
          className="w-14 h-14 rounded-full bg-white text-black flex items-center justify-center shadow-2xl"
          title="Post Story"
        >
          <HiOutlinePlus size={24} />
        </motion.button>
      </div>

      <AnimatePresence>
        {viewerOpen && (
          <StoryFullscreenViewer
            stories={stories}
            initialIndex={viewerIndex}
            onClose={() => setViewerOpen(false)}
            onLike={handleLike}
            onBookmark={(id) => handleBookmark(null, id)}
            onShare={handleShare}
            isBookmarked={(id) => savedStoryIds.has(id)}
          />
        )}
        {showHeatmap && (
          <StoryHeatmap
            isOpen={showHeatmap}
            onClose={() => setShowHeatmap(false)}
            stories={stories}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Stories;
