import { useState, useEffect, useRef, useCallback, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { feedService } from "../services";
import { useLocation } from "../context/LocationContext";
import { useUser } from "../context/UserContext";
import { getSocket, joinFeedDistrict, leaveFeedDistrict } from "../services/socket";
import ReportModal from "../components/ReportModal";
import { toast } from "react-hot-toast";
import { FiFlag } from "react-icons/fi";
import {
  HiOutlineTag,
  HiOutlineGift,
  HiOutlineInformationCircle,
  HiOutlineNewspaper,
  HiOutlineMap,
  HiOutlineMagnifyingGlass,
  HiOutlineMapPin,
  HiOutlineArrowRight,
  HiOutlinePlus,
  HiOutlineClock,
  HiOutlineUser,
  HiOutlineFunnel,
  HiOutlineHeart,
  HiHeart,
  HiOutlineChatBubbleLeft,
  HiOutlineEye,
  HiOutlineBookmark,
  HiBookmark,
  HiOutlineArrowUp,
  HiOutlineCalendarDays,
  HiOutlineFire,
  HiOutlineChevronDown,
} from "react-icons/hi2";

const timeAgo = (dateStr) => {
  const now = Date.now();
  const created = new Date(dateStr).getTime();
  const diff = now - created;
  const mins = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const weeks = Math.floor(days / 7);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  if (weeks < 4) return `${weeks}w ago`;
  return new Date(dateStr).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
};

const getIconForType = (type) => {
  switch (type) {
    case "Sale": return <HiOutlineTag className="text-emerald-400" />;
    case "Offer": return <HiOutlineGift className="text-orange-400" />;
    case "Information": return <HiOutlineInformationCircle className="text-sky-400" />;
    case "New Arrival": return <HiOutlineNewspaper className="text-violet-400" />;
    case "Exhibition": return <HiOutlineMap className="text-pink-400" />;
    case "Event": return <HiOutlineCalendarDays className="text-amber-400" />;
    default: return <HiOutlineFunnel className="text-slate-400" />;
  }
};

const getTypeColor = (type) => {
  switch (type) {
    case "Sale": return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    case "Offer": return "bg-orange-500/10 text-orange-400 border-orange-500/20";
    case "Information": return "bg-sky-500/10 text-sky-400 border-sky-500/20";
    case "New Arrival": return "bg-violet-500/10 text-violet-400 border-violet-500/20";
    case "Exhibition": return "bg-pink-500/10 text-pink-400 border-pink-500/20";
    case "Event": return "bg-amber-500/10 text-amber-400 border-amber-500/20";
    default: return "bg-slate-500/10 text-slate-400 border-slate-500/20";
  }
};


const FeedCard = memo(({ item, onNavigate, onReport, onLike, onBookmark, onAuthorClick, user }) => {
  const card = "bg-[#111827] border border-[#1f2a3d] rounded-2xl";
  const isLiked = item.likes?.includes(user?.id);
  const likesCount = item.likes?.length || 0;
  const isBookmarked = item.bookmarks?.includes(user?.id);
  const commentsCount = item.commentCount || 0;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.18 }}
      onClick={() => onNavigate(item._id)}
      className={`${card} flex flex-col overflow-hidden hover:border-emerald-500/30 hover:bg-[#131d2e] transition-all duration-300 group relative cursor-pointer`}
      tabIndex={0}
      role="article"
      aria-label={`Feed post: ${item.title}`}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onNavigate(item._id); } }}
    >

      <div className="relative aspect-video overflow-hidden bg-[#0d1424]">
        {item.image ? (
          <img
            src={item.image}
            alt={item.title || "Feed image"}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-5xl opacity-10">
              {getIconForType(item.type)}
            </span>
          </div>
        )}


        <div className="absolute top-3 left-3">
          <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] font-semibold uppercase tracking-wide backdrop-blur-sm ${getTypeColor(item.type)}`}>
            <span className="text-sm">{getIconForType(item.type)}</span>
            {item.type}
          </span>
        </div>


        <button
          aria-label={`Report post: ${item.title}`}
          onClick={(e) => { e.stopPropagation(); onReport(item._id); }}
          className="absolute top-3 right-3 w-8 h-8 rounded-lg bg-slate-900/60 backdrop-blur-md border border-white/10 text-slate-400 opacity-0 group-hover:opacity-100 hover:text-rose-400 hover:bg-slate-900 transition-all flex items-center justify-center z-10"
        >
          <FiFlag size={14} />
        </button>


        {item.viewCount > 0 && (
          <div className="absolute bottom-3 right-3 flex items-center gap-1 px-2 py-0.5 rounded-md bg-black/50 backdrop-blur-sm text-slate-300 text-[10px] font-medium">
            <HiOutlineEye className="text-xs" />
            {item.viewCount}
          </div>
        )}
      </div>


      <div className="p-4 flex-1 flex flex-col">
        <div className="flex items-center gap-2 mb-3">
          <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-medium line-clamp-1">
            <HiOutlineMapPin className="text-xs shrink-0" />
            {item.locationAddress || item.taluka || item.district}
          </span>
          <span className="w-1 h-1 bg-slate-700 rounded-full" />
          <time
            dateTime={item.createdAt}
            className="flex items-center gap-1 text-[10px] text-slate-500 font-semibold"
          >
            <HiOutlineClock className="text-xs shrink-0" />
            {timeAgo(item.createdAt)}
          </time>
        </div>

        <h3 className="text-slate-100 font-semibold text-base leading-snug mb-2 group-hover:text-emerald-400 transition-colors line-clamp-2 flex-1">
          {item.title}
        </h3>

        <p className="text-slate-500 text-xs leading-relaxed line-clamp-3 mb-4">
          {item.content}
        </p>


        <div className="flex items-center justify-between pt-3 border-t border-[#1f2a3d]">
          <div
            className="flex items-center gap-2 cursor-pointer group/author"
            onClick={(e) => { e.stopPropagation(); onAuthorClick(item.authorId); }}
            title="View Profile"
          >
            <div
              className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 text-xs font-bold group-hover/author:bg-emerald-500/20 group-hover/author:scale-110 transition-all"
            >
              {item.author?.[0]?.toUpperCase()}
            </div>
            <div>
              <p className="text-slate-300 text-xs font-medium leading-none group-hover/author:text-emerald-400 transition-colors">
                {item.author}
              </p>
              <p className="text-slate-600 text-[10px] mt-0.5 flex items-center gap-1">
                <HiOutlineUser className="text-xs" /> Member
              </p>
            </div>
          </div>


          <div className="flex items-center gap-2.5">
            <button
              onClick={(e) => { e.stopPropagation(); onLike(item._id); }}
              className={`flex items-center gap-1 text-[11px] font-semibold transition-all duration-200 active:scale-90 ${isLiked ? "text-rose-400" : "text-slate-500 hover:text-rose-400"
                }`}
              aria-label={isLiked ? "Unlike this post" : "Like this post"}
            >
              {isLiked ? <HiHeart className="text-sm" /> : <HiOutlineHeart className="text-sm" />}
              {likesCount > 0 && <span>{likesCount}</span>}
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onBookmark(item._id); }}
              className={`flex items-center gap-1 text-[11px] font-semibold transition-all duration-200 active:scale-90 ${isBookmarked ? "text-amber-400" : "text-slate-500 hover:text-amber-400"
                }`}
              aria-label={isBookmarked ? "Remove bookmark" : "Bookmark this post"}
            >
              {isBookmarked ? <HiBookmark className="text-sm" /> : <HiOutlineBookmark className="text-sm" />}
            </button>
            <span className="flex items-center gap-1 text-[11px] text-slate-500 font-semibold">
              <HiOutlineChatBubbleLeft className="text-sm" />
              {commentsCount > 0 && commentsCount}
            </span>
            <div className="w-7 h-7 rounded-lg bg-[#0d1424] border border-[#1f2a3d] flex items-center justify-center text-slate-600 group-hover:text-emerald-400 group-hover:border-emerald-500/30 transition-colors">
              <HiOutlineArrowRight className="text-sm" />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
});
FeedCard.displayName = "FeedCard";


const TrendingCard = memo(({ item, onNavigate }) => (
  <div
    onClick={() => onNavigate(item._id)}
    className="min-w-[260px] max-w-[280px] bg-[#111827] border border-[#1f2a3d] rounded-2xl overflow-hidden hover:border-emerald-500/30 hover:bg-[#131d2e] transition-all duration-300 cursor-pointer group shrink-0"
  >
    <div className="relative h-28 overflow-hidden bg-[#0d1424]">
      {item.image ? (
        <img
          src={item.image}
          alt={item.title || "Trending feed"}
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <span className="text-3xl opacity-10">{getIconForType(item.type)}</span>
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-[#111827] to-transparent" />
      <div className="absolute top-2 left-2">
        <span className={`flex items-center gap-1 px-2 py-0.5 rounded-md border text-[9px] font-semibold uppercase tracking-wide backdrop-blur-sm ${getTypeColor(item.type)}`}>
          {item.type}
        </span>
      </div>
    </div>
    <div className="p-3">
      <h4 className="text-slate-100 text-xs font-semibold line-clamp-2 mb-1.5 group-hover:text-emerald-400 transition-colors">
        {item.title}
      </h4>
      <div className="flex items-center gap-3 text-[10px] text-slate-500">
        <span className="flex items-center gap-1">
          <HiOutlineHeart className="text-rose-400" /> {item.likesCount || item.likes?.length || 0}
        </span>
        <span className="flex items-center gap-1">
          <HiOutlineChatBubbleLeft /> {item.commentsCount || item.comments?.length || 0}
        </span>
        <span className="flex items-center gap-1">
          <HiOutlineEye /> {item.viewCount || 0}
        </span>
      </div>
    </div>
  </div>
));
TrendingCard.displayName = "TrendingCard";


const SkeletonCard = () => (
  <div className="bg-[#111827] border border-[#1f2a3d] rounded-2xl overflow-hidden animate-pulse">
    <div className="aspect-video bg-[#1a2332]" />
    <div className="p-4 space-y-3">
      <div className="flex gap-2">
        <div className="h-3 w-20 bg-[#1a2332] rounded" />
        <div className="h-3 w-14 bg-[#1a2332] rounded" />
      </div>
      <div className="h-4 w-3/4 bg-[#1a2332] rounded" />
      <div className="h-3 w-full bg-[#1a2332] rounded" />
      <div className="h-3 w-2/3 bg-[#1a2332] rounded" />
      <div className="flex items-center justify-between pt-3 border-t border-[#1f2a3d]">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#1a2332]" />
          <div className="space-y-1">
            <div className="h-3 w-16 bg-[#1a2332] rounded" />
            <div className="h-2 w-12 bg-[#1a2332] rounded" />
          </div>
        </div>
        <div className="flex gap-2">
          <div className="w-6 h-4 bg-[#1a2332] rounded" />
          <div className="w-6 h-4 bg-[#1a2332] rounded" />
        </div>
      </div>
    </div>
  </div>
);


const Feed = () => {
  const navigate = useNavigate();
  const { district, taluka } = useLocation();
  const { user } = useUser();
  const [feeds, setFeeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [radius, setRadius] = useState(5000);
  const [filter, setFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [reportConfig, setReportConfig] = useState({ isOpen: false, targetId: null });
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [sortBy, setSortBy] = useState("latest");
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [trendingFeeds, setTrendingFeeds] = useState([]);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [newFeedsBanner, setNewFeedsBanner] = useState(false);

  const observerRef = useRef(null);
  const sentinelRef = useRef(null);
  const filterScrollRef = useRef(null);
  const sortRef = useRef(null);

  const feedCategories = [
    "All",
    "Sale",
    "Offer",
    "Information",
    "New Arrival",
    "Exhibition",
    "Event",
  ];

  const sortOptions = [
    { value: "latest", label: "Latest", icon: <HiOutlineClock className="text-sm" /> },
    { value: "popular", label: "Most Liked", icon: <HiOutlineHeart className="text-sm" /> },
    { value: "most_commented", label: "Most Commented", icon: <HiOutlineChatBubbleLeft className="text-sm" /> },
  ];


  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);


  useEffect(() => {
    document.title = `Community Feed - ${district || "Lokonomy"}`;
    return () => { document.title = "Lokonomy"; };
  }, [district]);


  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const params = {};
        if (district) params.district = district;
        const res = await feedService.getTrendingFeeds(params);
        setTrendingFeeds(res.data.data || []);
      } catch (err) {
        console.error("Trending feeds error:", err);
      }
    };
    fetchTrending();
  }, [district]);


  useEffect(() => {
    fetchFeeds(true);
  }, [district, filter, debouncedSearch, radius, user?.latitude, sortBy]);

  const fetchFeeds = async (reset = false) => {
    if (reset) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }
    try {
      const nextPage = reset ? 1 : page;
      const params = {
        type: filter,
        search: debouncedSearch,
        page: nextPage,
        limit: 9,
        sort: sortBy,
      };

      if (user?.latitude && user?.longitude) {
        params.lat = user.latitude;
        params.lng = user.longitude;
        params.radius = radius;
      } else {
        params.district = district;
      }

      const response = await feedService.getFeeds(params);
      const newItems = response.data.data || [];

      if (reset) {
        setFeeds(newItems);
        setPage(2);
      } else {
        setFeeds((prev) => [...prev, ...newItems]);
        setPage((prev) => prev + 1);
      }

      setHasMore(nextPage < (response.data.totalPages || 1));
    } catch (err) {
      console.error("Feed fetch error:", err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };


  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          fetchFeeds(false);
        }
      },
      { threshold: 0.1, rootMargin: "200px" }
    );

    if (sentinelRef.current) {
      observerRef.current.observe(sentinelRef.current);
    }

    return () => {
      if (observerRef.current) observerRef.current.disconnect();
    };
  }, [hasMore, loadingMore, loading, page]);

  // --- Scroll to top visibility ---
  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 600);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // --- Close sort dropdown on outside click ---
  useEffect(() => {
    const handler = (e) => {
      if (sortRef.current && !sortRef.current.contains(e.target)) {
        setShowSortMenu(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // --- Socket: Real-time new feed notifications ---
  useEffect(() => {
    if (!district) return;
    const socket = getSocket();
    joinFeedDistrict(district);

    const handleNewFeed = () => {
      setNewFeedsBanner(true);
    };

    socket.on("new_feed", handleNewFeed);

    return () => {
      socket.off("new_feed", handleNewFeed);
      leaveFeedDistrict(district);
    };
  }, [district]);

  // --- Quick like from listing ---
  const handleQuickLike = useCallback(async (feedId) => {
    if (!user) {
      toast.error("Please login to like posts");
      return;
    }
    try {
      const res = await feedService.toggleLikeFeed(feedId);
      setFeeds((prev) =>
        prev.map((f) => {
          if (f._id === feedId) {
            const newLikes = res.data.isLiked
              ? [...(f.likes || []), user.id]
              : (f.likes || []).filter((id) => id !== user.id);
            return { ...f, likes: newLikes };
          }
          return f;
        })
      );
    } catch (err) {
      console.error("Like error:", err);
      toast.error("Failed to like post");
    }
  }, [user]);

  const handleQuickBookmark = useCallback(async (feedId) => {
    if (!user) {
      toast.error("Please login to bookmark posts");
      return;
    }
    try {
      const res = await feedService.toggleBookmark(feedId);
      setFeeds((prev) =>
        prev.map((f) => {
          if (f._id === feedId) {
            const newBookmarks = res.data.isBookmarked
              ? [...(f.bookmarks || []), user.id]
              : (f.bookmarks || []).filter((id) => id !== user.id);
            return { ...f, bookmarks: newBookmarks };
          }
          return f;
        })
      );
      toast.success(res.data.isBookmarked ? "Bookmarked!" : "Bookmark removed");
    } catch (err) {
      console.error("Bookmark error:", err);
      toast.error("Failed to bookmark post");
    }
  }, [user]);

  const handleNavigate = useCallback((id) => navigate(`/feed/${id}`), [navigate]);
  const handleAuthorClick = useCallback((authorId) => navigate(`/profile/${authorId}`), [navigate]);
  const handleReport = useCallback((id) => setReportConfig({ isOpen: true, targetId: id }), []);

  const handleRefreshBanner = () => {
    setNewFeedsBanner(false);
    fetchFeeds(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const card = "bg-[#111827] border border-[#1f2a3d] rounded-2xl";
  const inputCls =
    "w-full bg-[#0d1424] border border-[#1f2a3d] rounded-xl px-4 py-3 text-sm text-slate-200 outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 placeholder:text-slate-600";

  return (
    <div className="min-h-screen bg-[#080e1a] pt-24 pb-20">
      <style>{`
        .feed-font * { font-family: 'DM Sans', sans-serif; }
        .no-sb::-webkit-scrollbar { display: none; }
        .no-sb { -ms-overflow-style: none; scrollbar-width: none; }
        .filter-fade-r { mask-image: linear-gradient(to right, black 85%, transparent 100%); -webkit-mask-image: linear-gradient(to right, black 85%, transparent 100%); }
      `}</style>

      <div className="feed-font max-w-6xl mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8"
        >
          <div>
            <p className="text-emerald-400 text-[11px] font-semibold uppercase tracking-widest mb-1">
              Local Feeds
            </p>
            <h1 className="text-white font-bold text-3xl leading-tight">
              Community Feed
            </h1>
            <p className="text-slate-300 text-sm mt-1">
              What's happening in{" "}
              <span className="text-slate-300 font-medium">
                {user?.locationName || taluka || district || "your area"}
              </span>
            </p>
          </div>
          <button
            onClick={() => navigate("/feed/post")}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 active:scale-[.98] text-white text-xs font-semibold px-5 py-3 rounded-xl transition-all shadow-lg shadow-emerald-900/30 self-start sm:self-auto"
          >
            <HiOutlinePlus className="text-base" /> Add to Feed
          </button>
        </motion.div>

        {/* New feeds banner */}
        <AnimatePresence>
          {newFeedsBanner && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-4"
            >
              <button
                onClick={handleRefreshBanner}
                className="w-full flex items-center justify-center gap-2 bg-emerald-500/10 hover:bg-emerald-500/15 border border-emerald-500/20 text-emerald-400 text-xs font-semibold py-2.5 rounded-xl transition-all"
              >
                <HiOutlineArrowUp className="text-sm animate-bounce" />
                New posts available — tap to refresh
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Trending Section */}
        {trendingFeeds.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="mb-6"
          >
            <div className="flex items-center gap-2 mb-3">
              <HiOutlineFire className="text-orange-400 text-lg" />
              <h2 className="text-white font-bold text-sm">Trending This Week</h2>
            </div>
            <div className="no-sb flex gap-3 overflow-x-auto pb-2">
              {trendingFeeds.map((item) => (
                <TrendingCard key={item._id} item={item} onNavigate={handleNavigate} />
              ))}
            </div>
          </motion.div>
        )}

        {/* Search, Filter, and Sort Controls */}
        <div className={`${card} p-4 mb-6 flex flex-col gap-4`}>
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <HiOutlineMagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 text-base pointer-events-none" />
              <input
                type="text"
                placeholder="Search local feeds…"
                className={inputCls + " pl-11"}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Search feeds"
              />
            </div>

            {/* Sort Dropdown */}
            <div ref={sortRef} className="relative">
              <button
                onClick={() => setShowSortMenu((prev) => !prev)}
                className="flex items-center gap-2 bg-[#0d1424] border border-[#1f2a3d] rounded-xl px-4 py-3 text-xs font-semibold text-slate-300 hover:border-slate-600 transition-all whitespace-nowrap"
                aria-label="Sort feeds"
              >
                {sortOptions.find(s => s.value === sortBy)?.icon}
                {sortOptions.find(s => s.value === sortBy)?.label}
                <HiOutlineChevronDown className={`text-xs transition-transform ${showSortMenu ? "rotate-180" : ""}`} />
              </button>
              <AnimatePresence>
                {showSortMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.98 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 z-50 mt-2 w-48 bg-[#131929] border border-[#1f2a3d] rounded-xl shadow-2xl shadow-black/50 overflow-hidden"
                  >
                    {sortOptions.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => { setSortBy(opt.value); setShowSortMenu(false); }}
                        className={`w-full flex items-center gap-2 px-4 py-2.5 text-xs font-medium transition-all ${sortBy === opt.value
                          ? "bg-emerald-500/10 text-emerald-400"
                          : "text-slate-300 hover:bg-white/5 hover:text-white"
                          }`}
                      >
                        {opt.icon}
                        {opt.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Radius */}
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
                  id="radius"
                  value={radius}
                  onChange={(e) => setRadius(Number(e.target.value))}
                  className="bg-transparent text-xs font-bold text-emerald-400 outline-none cursor-pointer"
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

          {/* Category Filter Pills with fade gradient */}
          <div className="relative filter-fade-r">
            <div ref={filterScrollRef} className="no-sb flex items-center gap-2 overflow-x-auto">
              {feedCategories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFilter(cat)}
                  aria-label={`Filter by ${cat}`}
                  aria-pressed={filter === cat}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border
                    ${filter === cat
                      ? "bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-900/30"
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
        </div>

        {/* Feed Grid */}
        <div className="min-h-64">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <AnimatePresence mode="popLayout">
                {feeds.map((item) => (
                  <FeedCard
                    key={item._id}
                    item={item}
                    onNavigate={handleNavigate}
                    onReport={handleReport}
                    onLike={handleQuickLike}
                    onBookmark={handleQuickBookmark}
                    onAuthorClick={handleAuthorClick}
                    user={user}
                  />
                ))}
              </AnimatePresence>

              {feeds.length === 0 && !loading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="col-span-full border-2 border-dashed border-[#1f2a3d] rounded-2xl py-24 text-center"
                >
                  <h3 className="text-slate-500 font-semibold text-base mb-1">
                    Feed is Empty
                  </h3>
                  <p className="text-slate-600 text-xs">
                    Be the first to share something in your community!
                  </p>
                </motion.div>
              )}
            </div>
          )}

          {/* Infinite scroll sentinel */}
          {hasMore && feeds.length > 0 && !loading && (
            <div ref={sentinelRef} className="flex justify-center mt-10 py-6">
              {loadingMore && (
                <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold">
                  <div className="w-4 h-4 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
                  Loading more feeds…
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Scroll to top button */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="fixed bottom-24 right-5 w-11 h-11 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-lg shadow-emerald-900/40 flex items-center justify-center transition-all active:scale-90 z-50"
            aria-label="Scroll to top"
          >
            <HiOutlineArrowUp className="text-lg" />
          </motion.button>
        )}
      </AnimatePresence>

      <ReportModal
        isOpen={reportConfig.isOpen}
        onClose={() => setReportConfig({ isOpen: false, targetId: null })}
        targetType="feed"
        targetId={reportConfig.targetId}
      />
    </div>
  );
};

export default Feed;
