import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { adminService } from "../../services";
import AdminLayout from "../../layouts/AdminLayout";
import { useConfirm } from "../../context/ConfirmContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiBookOpen,
  FiRss,
  FiSearch,
  FiFilter,
  FiTrash2,
  FiUser,
  FiMapPin,
  FiChevronLeft,
  FiChevronRight,
  FiClock,
  FiImage,
  FiCalendar,
  FiTag,
} from "react-icons/fi";

const TABS = [
  { key: "stories", label: "Stories", icon: FiBookOpen, color: "violet" },
  { key: "feeds", label: "Community Feed", icon: FiRss, color: "cyan" },
];

const STORY_TYPES = [
  "All",
  "News",
  "Offers",
  "Promotions",
  "Events",
  "Announcements",
  "Tips",
];
const FEED_TYPES = [
  "All",
  "Sale",
  "Offer",
  "Information",
  "New Arrival",
  "Exhibition",
  "Event",
];

const colorMap = {
  violet: {
    bg: "bg-violet-500/10",
    border: "border-violet-500/20",
    text: "text-violet-400",
    glow: "shadow-violet-500/20",
    pill: "bg-violet-500/20 text-violet-400 border-violet-500/30",
    solid: "bg-violet-600",
  },
  cyan: {
    bg: "bg-cyan-500/10",
    border: "border-cyan-500/20",
    text: "text-cyan-400",
    glow: "shadow-cyan-500/20",
    pill: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
    solid: "bg-cyan-600",
  },
  indigo: {
    bg: "bg-indigo-500/10",
    border: "border-indigo-500/20",
    text: "text-indigo-400",
  },
  emerald: {
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    text: "text-emerald-400",
  },
  rose: {
    bg: "bg-rose-500/10",
    border: "border-rose-500/20",
    text: "text-rose-400",
  },
  amber: {
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    text: "text-amber-400",
  },
};

const typeColorMap = {
  News: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  Offers: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  Promotions: "bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/30",
  Events: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  Announcements: "bg-orange-500/20 text-orange-300 border-orange-500/30",
  Tips: "bg-teal-500/20 text-teal-300 border-teal-500/30",
  Sale: "bg-rose-500/20 text-rose-300 border-rose-500/30",
  Offer: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  Information: "bg-sky-500/20 text-sky-300 border-sky-500/30",
  "New Arrival": "bg-lime-500/20 text-lime-300 border-lime-500/30",
  Exhibition: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  Event: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
};

const Pagination = ({ page, totalPages, onPage, accentColor }) => {
  if (totalPages <= 1) return null;
  const c = colorMap[accentColor] || colorMap.violet;
  return (
    <div className="flex justify-center items-center gap-3 pt-8">
      <button
        disabled={page === 1}
        onClick={() => onPage(page - 1)}
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
        className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl ${c.solid} text-white text-xs font-bold disabled:opacity-30 disabled:cursor-not-allowed hover:opacity-90 transition-all shadow-lg ${c.glow}`}
      >
        Next <FiChevronRight size={14} />
      </button>
    </div>
  );
};

const EmptyState = ({ text, icon: Icon }) => (
  <div className="col-span-full flex flex-col items-center justify-center gap-3 py-16 border border-dashed border-slate-800 rounded-2xl bg-slate-900/20">
    <div className="w-12 h-12 rounded-full bg-slate-800/80 flex items-center justify-center text-slate-600">
      <Icon size={22} />
    </div>
    <p className="text-slate-500 text-sm font-medium">{text}</p>
  </div>
);

const StoryCard = ({ story, onDelete, onView }) => (
  <motion.div
    layout
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, scale: 0.95 }}
    onClick={() => onView(story)}
    className="group relative flex flex-col bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-xl hover:shadow-violet-500/5 hover:-translate-y-0.5 hover:border-violet-500/40"
  >
    {story.image ? (
      <div className="relative h-36 overflow-hidden">
        <img
          src={story.image}
          alt={story.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-linear-to-t from-slate-900 via-slate-900/40 to-transparent" />
        <div className="absolute bottom-3 left-3 flex gap-1.5">
          <span
            className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider border ${typeColorMap[story.type] || "bg-slate-500/20 text-slate-300 border-slate-500/30"}`}
          >
            {story.type}
          </span>
          {story.isHighlighted && (
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
              ★ Highlighted
            </span>
          )}
        </div>
        <span className="absolute top-3 right-3 text-[10px] text-slate-400 font-mono bg-slate-900/80 px-2 py-1 rounded-lg">
          #{story._id?.slice(-6)}
        </span>
      </div>
    ) : (
      <div className="relative bg-linear-to-br from-violet-600/20 via-slate-900 to-slate-900 p-4 pb-3">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex gap-1.5 flex-wrap">
            <span
              className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider border ${typeColorMap[story.type] || "bg-slate-500/20 text-slate-300 border-slate-500/30"}`}
            >
              {story.type}
            </span>
            {story.isHighlighted && (
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                ★ Highlighted
              </span>
            )}
          </div>
          <span className="text-[10px] text-slate-600 font-mono shrink-0">
            #{story._id?.slice(-6)}
          </span>
        </div>
      </div>
    )}

    <div className="flex flex-col flex-1 p-4 gap-3">
      <h4 className="font-bold text-white text-sm leading-snug line-clamp-2 group-hover:text-violet-300 transition-colors">
        {story.title}
      </h4>
      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
        {story.content}
      </p>

      <div className="grid grid-cols-2 gap-2">
        {story.locationAddress && (
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 bg-slate-800/40 rounded-lg px-2.5 py-1.5 border border-slate-800">
            <FiMapPin size={10} className="text-violet-400 shrink-0" />
            <span className="truncate">{story.locationAddress}</span>
          </div>
        )}
        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 bg-slate-800/40 rounded-lg px-2.5 py-1.5 border border-slate-800">
          <FiClock size={10} className="text-violet-400 shrink-0" />
          <span className="truncate">
            {new Date(story.createdAt).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between py-2.5 px-3 bg-slate-800/40 rounded-xl border border-slate-800">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-full bg-violet-500/20 flex items-center justify-center shrink-0">
            {story.authorId?.profilePic ? (
              <img
                src={story.authorId.profilePic}
                alt=""
                className="w-7 h-7 rounded-full object-cover"
              />
            ) : (
              <FiUser size={12} className="text-violet-400" />
            )}
          </div>
          <div className="min-w-0">
            <p className="text-[10px] text-slate-500 leading-none mb-0.5">
              Posted by
            </p>
            <p className="text-xs font-semibold text-white truncate">
              {story.author}
            </p>
          </div>
        </div>
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete(story);
        }}
        className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 hover:border-rose-500/40 mt-auto"
      >
        <FiTrash2 size={12} /> Delete Content
      </button>
    </div>
  </motion.div>
);

const FeedCard = ({ feed, onDelete, onView }) => (
  <motion.div
    layout
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, scale: 0.95 }}
    onClick={() => onView(feed)}
    className="group relative flex flex-col bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-xl hover:shadow-cyan-500/5 hover:-translate-y-0.5 hover:border-cyan-500/40"
  >
    {feed.image ? (
      <div className="relative h-36 overflow-hidden">
        <img
          src={feed.image}
          alt={feed.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-linear-to-t from-slate-900 via-slate-900/40 to-transparent" />
        <div className="absolute bottom-3 left-3">
          <span
            className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider border ${typeColorMap[feed.type] || "bg-slate-500/20 text-slate-300 border-slate-500/30"}`}
          >
            {feed.type}
          </span>
        </div>
        <span className="absolute top-3 right-3 text-[10px] text-slate-400 font-mono bg-slate-900/80 px-2 py-1 rounded-lg">
          #{feed._id?.slice(-6)}
        </span>
      </div>
    ) : (
      <div className="relative bg-linear-to-br from-cyan-600/20 via-slate-900 to-slate-900 p-4 pb-3">
        <div className="flex items-start justify-between gap-2 mb-3">
          <span
            className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider border ${typeColorMap[feed.type] || "bg-slate-500/20 text-slate-300 border-slate-500/30"}`}
          >
            {feed.type}
          </span>
          <span className="text-[10px] text-slate-600 font-mono shrink-0">
            #{feed._id?.slice(-6)}
          </span>
        </div>
      </div>
    )}

    <div className="flex flex-col flex-1 p-4 gap-3">
      <h4 className="font-bold text-white text-sm leading-snug line-clamp-2 group-hover:text-cyan-300 transition-colors">
        {feed.title}
      </h4>
      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
        {feed.content}
      </p>

      <div className="grid grid-cols-2 gap-2">
        {feed.eventDate && (
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 bg-slate-800/40 rounded-lg px-2.5 py-1.5 border border-slate-800">
            <FiCalendar size={10} className="text-cyan-400 shrink-0" />
            <span className="truncate">
              {feed.eventDate} {feed.eventTime && `· ${feed.eventTime}`}
            </span>
          </div>
        )}
        {feed.locationAddress && (
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 bg-slate-800/40 rounded-lg px-2.5 py-1.5 border border-slate-800">
            <FiMapPin size={10} className="text-cyan-400 shrink-0" />
            <span className="truncate">{feed.locationAddress}</span>
          </div>
        )}
        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 bg-slate-800/40 rounded-lg px-2.5 py-1.5 border border-slate-800">
          <FiClock size={10} className="text-cyan-400 shrink-0" />
          <span className="truncate">
            {new Date(feed.createdAt).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between py-2.5 px-3 bg-slate-800/40 rounded-xl border border-slate-800">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-full bg-cyan-500/20 flex items-center justify-center shrink-0">
            {feed.authorId?.profilePic ? (
              <img
                src={feed.authorId.profilePic}
                alt=""
                className="w-7 h-7 rounded-full object-cover"
              />
            ) : (
              <FiUser size={12} className="text-cyan-400" />
            )}
          </div>
          <div className="min-w-0">
            <p className="text-[10px] text-slate-500 leading-none mb-0.5">
              Posted by
            </p>
            <p className="text-xs font-semibold text-white truncate">
              {feed.author}
            </p>
          </div>
        </div>
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete(feed);
        }}
        className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 hover:border-rose-500/40 mt-auto"
      >
        <FiTrash2 size={12} /> Delete Content
      </button>
    </div>
  </motion.div>
);

const AdminStoriesFeed = () => {
  const navigate = useNavigate();
  const confirm = useConfirm();
  const [activeTab, setActiveTab] = useState("stories");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const isStories = activeTab === "stories";
  const accent = isStories ? "violet" : "cyan";

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    fetchData();
  }, [activeTab, search, typeFilter, page]);

  const fetchStats = async () => {
    try {
      const r = await adminService.getStoriesFeedStats();
      setStats(r.data);
    } catch (e) {
      console.error("Stats error:", e);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: 6,
        search,
        type: typeFilter !== "All" ? typeFilter : undefined,
      };

      if (isStories) {
        const r = await adminService.getStories(params);
        setItems(r.data.stories);
        setTotalPages(r.data.totalPages);
      } else {
        const r = await adminService.getFeeds(params);
        setItems(r.data.feeds);
        setTotalPages(r.data.totalPages);
      }
    } catch {
      toast.error(`Failed to fetch ${activeTab}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (item) => {
    const isConfirmed = await confirm({
      title: `Delete ${isStories ? "Story" : "Feed Post"}`,
      description: `Are you sure you want to delete this ${isStories ? "story" : "feed post"}? This action cannot be undone.`,
      confirmLabel: "Delete Permanently",
      isDanger: true,
    });
    if (!isConfirmed) return;
    try {
      if (isStories) {
        await adminService.deleteStory(item._id);
        toast.success("Story deleted successfully");
      } else {
        await adminService.deleteFeed(item._id);
        toast.success("Feed post deleted successfully");
      }
      fetchData();
      fetchStats();
    } catch {
      toast.error("Delete failed");
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setPage(1);
    setSearch("");
    setTypeFilter("All");
  };

  const handleTypeChange = (t) => {
    setTypeFilter(t);
    setPage(1);
  };

  const typeFilters = isStories ? STORY_TYPES : FEED_TYPES;
  const ac = colorMap[accent];

  return (
    <AdminLayout>
      <div className="max-w-screen-2xl mx-auto space-y-6 pb-16 px-1">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Stories & Feed <span className={ac.text}>Management</span>
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Monitor and moderate all stories and community feed posts.
            </p>
          </div>
          <div className="flex items-center gap-3 self-start sm:self-auto">
            <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-4 py-2.5 rounded-2xl">
              <FiBookOpen size={16} className="text-violet-400" />
              <span className="text-sm font-bold text-white">
                {stats?.totalStories ?? 0}
              </span>
              <span className="text-xs text-slate-500">Stories</span>
            </div>
            <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-4 py-2.5 rounded-2xl">
              <FiRss size={16} className="text-cyan-400" />
              <span className="text-sm font-bold text-white">
                {stats?.totalFeeds ?? 0}
              </span>
              <span className="text-xs text-slate-500">Feeds</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {isStories
            ? STORY_TYPES.filter((t) => t !== "All").map((type, i) => (
                <motion.div
                  key={type}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 overflow-hidden hover:border-slate-700 transition-colors"
                >
                  <div
                    className={`w-9 h-9 rounded-xl ${colorMap.violet.bg} ${colorMap.violet.border} border flex items-center justify-center mb-3`}
                  >
                    <FiTag size={14} className={colorMap.violet.text} />
                  </div>
                  <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-widest mb-1">
                    {type}
                  </p>
                  <p className="text-xl font-extrabold text-white">
                    {stats?.storyTypes?.[type] ?? 0}
                  </p>
                </motion.div>
              ))
            : FEED_TYPES.filter((t) => t !== "All").map((type, i) => (
                <motion.div
                  key={type}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 overflow-hidden hover:border-slate-700 transition-colors"
                >
                  <div
                    className={`w-9 h-9 rounded-xl ${colorMap.cyan.bg} ${colorMap.cyan.border} border flex items-center justify-center mb-3`}
                  >
                    <FiTag size={14} className={colorMap.cyan.text} />
                  </div>
                  <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-widest mb-1">
                    {type}
                  </p>
                  <p className="text-xl font-extrabold text-white">
                    {stats?.feedTypes?.[type] ?? 0}
                  </p>
                </motion.div>
              ))}
        </div>

        <div className="flex flex-col gap-3 bg-slate-900/50 border border-slate-800 rounded-2xl p-3">
          <div className="flex items-center gap-2">
            {TABS.map((tab) => {
              const tc = colorMap[tab.color];
              const active = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => handleTabChange(tab.key)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    active
                      ? `${tc.pill} border shadow-lg ${tc.glow}`
                      : "bg-slate-800/40 text-slate-500 border border-transparent hover:bg-slate-800 hover:text-slate-300"
                  }`}
                >
                  <tab.icon size={14} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
            <div className="relative flex-1 min-w-0 sm:max-w-xs">
              <FiSearch
                size={14}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
              />
              <input
                type="text"
                placeholder={`Search ${isStories ? "stories" : "feed posts"}…`}
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  if (e.target._debounceTimer)
                    clearTimeout(e.target._debounceTimer);
                  const val = e.target.value;
                  e.target._debounceTimer = setTimeout(() => {
                    setPage(1);
                  }, 300);
                }}
                className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/60 transition-all"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
              <FiFilter size={14} className="text-slate-600 shrink-0" />
              {typeFilters.map((t) => (
                <button
                  key={t}
                  onClick={() => handleTypeChange(t)}
                  className={`px-3.5 py-2 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all ${
                    typeFilter === t
                      ? `${ac.pill} border`
                      : "bg-slate-800/40 text-slate-500 border border-transparent hover:bg-slate-800 hover:text-slate-300"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab + typeFilter}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {loading ? (
              <div className="flex flex-col items-center justify-center h-64 gap-4">
                <div
                  className={`w-10 h-10 border-4 ${ac.border} border-t-${accent}-500 rounded-full animate-spin`}
                  style={{
                    borderTopColor:
                      accent === "violet"
                        ? "rgb(139, 92, 246)"
                        : "rgb(6, 182, 212)",
                  }}
                />
                <p className="text-slate-500 text-sm font-medium animate-pulse">
                  Loading {isStories ? "stories" : "feed posts"}…
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {items.map((item) =>
                    isStories ? (
                      <StoryCard
                        key={item._id}
                        story={item}
                        onDelete={() => handleDelete(item)}
                        onView={(s) =>
                          navigate(`/admin/stories-feed/story/${s._id}`)
                        }
                      />
                    ) : (
                      <FeedCard
                        key={item._id}
                        feed={item}
                        onDelete={() => handleDelete(item)}
                        onView={(f) =>
                          navigate(`/admin/stories-feed/feed/${f._id}`)
                        }
                      />
                    ),
                  )}
                  {items.length === 0 && (
                    <EmptyState
                      text={`No ${isStories ? "stories" : "feed posts"} found`}
                      icon={isStories ? FiBookOpen : FiRss}
                    />
                  )}
                </div>
                <Pagination
                  page={page}
                  totalPages={totalPages}
                  onPage={setPage}
                  accentColor={accent}
                />
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </AdminLayout>
  );
};

export default AdminStoriesFeed;
