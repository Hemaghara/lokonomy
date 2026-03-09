import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { feedService } from "../services";
import { useUser } from "../context/UserContext";
import { toast } from "react-hot-toast";
import {
  HiOutlineArrowLeft,
  HiOutlineMapPin,
  HiOutlineClock,
  HiOutlineShare,
  HiOutlineTag,
  HiOutlineGift,
  HiOutlineInformationCircle,
  HiOutlineNewspaper,
  HiOutlineMap,
  HiOutlineUser,
  HiOutlineCheckCircle,
  HiOutlineTrash,
  HiOutlineFunnel,
  HiOutlineCalendarDays,
  HiOutlineBuildingStorefront,
} from "react-icons/hi2";

const FeedDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useUser();
  const [feed, setFeed] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const getIconForType = (type) => {
    switch (type) {
      case "Sale":
        return <HiOutlineTag className="text-emerald-400" />;
      case "Offer":
        return <HiOutlineGift className="text-orange-400" />;
      case "Information":
        return <HiOutlineInformationCircle className="text-sky-400" />;
      case "New Arrival":
        return <HiOutlineNewspaper className="text-violet-400" />;
      case "Exhibition":
        return <HiOutlineMap className="text-pink-400" />;
      default:
        return <HiOutlineFunnel className="text-slate-400" />;
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case "Sale":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "Offer":
        return "bg-orange-500/10 text-orange-400 border-orange-500/20";
      case "Information":
        return "bg-sky-500/10 text-sky-400 border-sky-500/20";
      case "New Arrival":
        return "bg-violet-500/10 text-violet-400 border-violet-500/20";
      case "Exhibition":
        return "bg-pink-500/10 text-pink-400 border-pink-500/20";
      default:
        return "bg-slate-500/10 text-slate-400 border-slate-500/20";
    }
  };

  const getAccentColor = (type) => {
    switch (type) {
      case "Sale":
        return "emerald";
      case "Offer":
        return "orange";
      case "Information":
        return "sky";
      case "New Arrival":
        return "violet";
      case "Exhibition":
        return "pink";
      default:
        return "slate";
    }
  };

  useEffect(() => {
    const fetchFeed = async () => {
      try {
        setLoading(true);
        const response = await feedService.getFeedById(id);
        setFeed(response.data.data);
      } catch (err) {
        console.error("Error fetching feed details:", err);
        toast.error("Failed to load feed details");
      } finally {
        setLoading(false);
      }
    };
    fetchFeed();
  }, [id]);

  const handleShare = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const el = document.createElement("textarea");
      el.value = url;
      el.style.cssText = "position:fixed;opacity:0";
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    toast.success("Link copied to clipboard!");
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this feed post?"))
      return;
    try {
      setDeleting(true);
      await feedService.deleteFeed(id);
      toast.success("Feed deleted successfully");
      navigate("/feed");
    } catch (err) {
      console.error("Error deleting feed:", err);
      toast.error("Failed to delete feed");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080e1a] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-9 h-9 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
          <p className="text-slate-500 text-xs font-medium uppercase tracking-widest">
            Loading…
          </p>
        </div>
      </div>
    );
  }

  if (!feed) {
    return (
      <div className="min-h-screen bg-[#080e1a] flex flex-col items-center justify-center text-center px-6">
        <div className="text-5xl mb-4 opacity-20">📭</div>
        <h2 className="text-white font-semibold text-lg mb-2">
          Feed Not Found
        </h2>
        <p className="text-slate-500 text-sm mb-6">
          This feed post may have been removed or doesn't exist.
        </p>
        <button
          onClick={() => navigate("/feed")}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-5 py-2.5 rounded-xl transition-all"
        >
          <HiOutlineArrowLeft /> Back to Feed
        </button>
      </div>
    );
  }

  const accent = getAccentColor(feed.type);
  const card = "bg-[#111827] border border-[#1f2a3d] rounded-2xl";
  const isOwner = user && feed.authorId === user.id;

  const formattedDate = new Date(feed.createdAt).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const formattedTime = new Date(feed.createdAt).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const timeAgo = () => {
    const now = Date.now();
    const created = new Date(feed.createdAt).getTime();
    const diff = now - created;
    const mins = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return formattedDate;
  };

  return (
    <div className="min-h-screen bg-[#080e1a] pt-24 pb-20">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&display=swap');
        .fd * { font-family: 'DM Sans', sans-serif; }
      `}</style>

      <div className="fd max-w-5xl mx-auto px-4">
        {/* Top Bar */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="flex items-center justify-between mb-6"
        >
          <button
            onClick={() => navigate("/feed")}
            className="flex items-center gap-2 text-slate-500 hover:text-slate-300 text-xs font-medium transition-colors"
          >
            <HiOutlineArrowLeft className="text-sm" /> Back to Feed
          </button>

          <div className="flex items-center gap-2">
            {isOwner && (
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex items-center gap-1.5 text-xs font-medium px-3.5 py-2 rounded-xl border bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20 transition-all disabled:opacity-50"
              >
                <HiOutlineTrash className="text-sm" />
                {deleting ? "Deleting…" : "Delete"}
              </button>
            )}
            <button
              onClick={handleShare}
              className={`flex items-center gap-1.5 text-xs font-medium px-3.5 py-2 rounded-xl border transition-all
                ${
                  copied
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                    : "bg-[#111827] text-slate-500 border-[#1f2a3d] hover:text-slate-300"
                }`}
            >
              {copied ? (
                <>
                  <HiOutlineCheckCircle className="text-sm" /> Copied!
                </>
              ) : (
                <>
                  <HiOutlineShare className="text-sm" /> Share
                </>
              )}
            </button>
          </div>
        </motion.div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.35 }}
            className="lg:col-span-4 space-y-3"
          >
            {/* Image */}
            {feed.image ? (
              <div
                className={`relative overflow-hidden ${card} aspect-4/3 group`}
              >
                <img
                  src={feed.image}
                  alt={feed.title}
                  className="w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
                />
                <div className="absolute inset-0 bg-linear-to-t from-[#080e1a]/70 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4">
                  <span
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold backdrop-blur-sm ${getTypeColor(feed.type)}`}
                  >
                    <span className="text-sm">{getIconForType(feed.type)}</span>
                    {feed.type}
                  </span>
                </div>
              </div>
            ) : (
              <div
                className={`${card} aspect-4/3 flex flex-col items-center justify-center gap-3 opacity-30`}
              >
                <span
                  className={`text-4xl flex items-center justify-center w-14 h-14 rounded-2xl border ${getTypeColor(feed.type)}`}
                >
                  {getIconForType(feed.type)}
                </span>
                <p className="text-slate-600 text-xs">No image available</p>
              </div>
            )}

            {/* Info Cards */}
            <div className="grid grid-cols-2 gap-3">
              {/* Location Card */}
              <div
                className={`${card} p-4 group hover:border-rose-500/30 hover:bg-[#131d2e] transition-all duration-300 relative overflow-hidden cursor-default`}
              >
                <div className="absolute bottom-0 left-0 h-0.5 w-0 bg-rose-400 group-hover:w-full transition-all duration-500 rounded-full" />
                <div className="w-8 h-8 bg-rose-500/10 border border-rose-500/20 rounded-lg flex items-center justify-center mb-2.5 group-hover:scale-110 group-hover:bg-rose-500/20 transition-all duration-300">
                  <HiOutlineMapPin className="text-rose-400 text-sm" />
                </div>
                <p className="text-[10px] text-slate-600 group-hover:text-rose-500/60 font-semibold uppercase tracking-widest mb-1 transition-colors duration-300">
                  Location
                </p>
                <p className="text-slate-200 font-semibold text-sm truncate group-hover:text-white transition-colors duration-300">
                  {feed.locationAddress ||
                    (feed.taluka
                      ? `${feed.taluka}, ${feed.district}`
                      : feed.district) ||
                    "Local Area"}
                </p>
              </div>

              {/* Date Card */}
              <div
                className={`${card} p-4 group hover:border-${accent}-500/30 hover:bg-[#131d2e] transition-all duration-300 relative overflow-hidden cursor-default`}
              >
                <div
                  className={`absolute bottom-0 left-0 h-0.5 w-0 bg-${accent}-400 group-hover:w-full transition-all duration-500 rounded-full`}
                />
                <div
                  className={`w-8 h-8 bg-${accent}-500/10 border border-${accent}-500/20 rounded-lg flex items-center justify-center mb-2.5 group-hover:scale-110 group-hover:bg-${accent}-500/20 transition-all duration-300`}
                >
                  <HiOutlineCalendarDays
                    className={`text-${accent}-400 text-sm`}
                  />
                </div>
                <p
                  className={`text-[10px] text-slate-600 group-hover:text-${accent}-500/60 font-semibold uppercase tracking-widest mb-1 transition-colors duration-300`}
                >
                  Posted
                </p>
                <p className="text-slate-200 font-semibold text-xs leading-snug group-hover:text-white transition-colors duration-300">
                  {formattedDate}
                </p>
                <p className="text-slate-600 text-[10px] mt-0.5 flex items-center gap-1">
                  <HiOutlineClock className="text-xs" /> {formattedTime}
                </p>
              </div>
            </div>

            {/* Author Card */}
            <div
              className={`${card} p-4 group hover:border-emerald-500/30 hover:bg-[#131d2e] transition-all duration-300 relative overflow-hidden cursor-default`}
            >
              <div className="absolute bottom-0 left-0 h-0.5 w-0 bg-emerald-400 group-hover:w-full transition-all duration-500 rounded-full" />
              <p className="text-[10px] text-slate-600 font-semibold uppercase tracking-widest mb-3">
                Posted By
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold text-sm shrink-0 group-hover:scale-110 group-hover:bg-emerald-500/20 transition-all duration-300">
                  {feed.author?.[0]?.toUpperCase()}
                </div>
                <div>
                  <p className="text-slate-200 font-semibold text-sm group-hover:text-white transition-colors duration-300">
                    {feed.author}
                  </p>
                  <p className="text-slate-600 text-[10px] flex items-center gap-1 mt-0.5">
                    <HiOutlineUser className="text-xs" /> Community Member
                  </p>
                </div>
              </div>
            </div>

            {/* Category Card */}
            <div
              className={`${card} p-4 group hover:border-${accent}-500/30 hover:bg-[#131d2e] transition-all duration-300 relative overflow-hidden cursor-default`}
            >
              <div
                className={`absolute bottom-0 left-0 h-0.5 w-0 bg-${accent}-400 group-hover:w-full transition-all duration-500 rounded-full`}
              />
              <p className="text-[10px] text-slate-600 font-semibold uppercase tracking-widest mb-3">
                Category
              </p>
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl bg-${accent}-500/10 border border-${accent}-500/20 flex items-center justify-center text-lg shrink-0 group-hover:scale-110 group-hover:bg-${accent}-500/20 transition-all duration-300`}
                >
                  {getIconForType(feed.type)}
                </div>
                <div>
                  <p className="text-slate-200 font-semibold text-sm group-hover:text-white transition-colors duration-300">
                    {feed.type}
                  </p>
                  <p className="text-slate-600 text-[10px] flex items-center gap-1 mt-0.5">
                    <HiOutlineBuildingStorefront className="text-xs" /> Feed
                    Category
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right Content */}
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.35, delay: 0.08 }}
            className="lg:col-span-8 space-y-5"
          >
            {/* Title Section */}
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border text-[11px] font-semibold ${getTypeColor(feed.type)}`}
                >
                  <span className="text-sm">{getIconForType(feed.type)}</span>
                  {feed.type}
                </span>
                <span className="text-slate-600 text-xs font-medium">
                  {timeAgo()}
                </span>
              </div>

              <h1 className="text-white font-bold text-2xl md:text-3xl leading-snug mb-4">
                {feed.title}
              </h1>

              <div className="flex items-center gap-1.5 mb-5">
                <div className="h-0.5 w-10 bg-emerald-500 rounded-full" />
                <div className="h-0.5 w-4 bg-emerald-500/30 rounded-full" />
                <div className="h-0.5 w-2 bg-emerald-500/10 rounded-full" />
              </div>
            </div>

            {/* Content */}
            <div className={`${card} p-6 relative overflow-hidden`}>
              <div className="absolute left-0 top-6 bottom-6 w-0.5 bg-linear-to-b from-emerald-500/60 via-emerald-500/20 to-transparent rounded-full" />
              <p className="text-slate-400 text-sm md:text-base leading-[1.9] whitespace-pre-wrap pl-5">
                {feed.content}
              </p>
            </div>

            {/* Meta Info Bar */}
            <div className={`${card} p-4`}>
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <HiOutlineMapPin className="text-emerald-400 text-sm" />
                  <span>
                    {feed.locationAddress ||
                      (feed.taluka
                        ? `${feed.taluka}, ${feed.district}`
                        : feed.district) ||
                      "Local Area"}
                  </span>
                </div>
                <span className="w-1 h-1 bg-slate-700 rounded-full" />
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <HiOutlineClock className="text-emerald-400 text-sm" />
                  <span>
                    {formattedDate} at {formattedTime}
                  </span>
                </div>
                <span className="w-1 h-1 bg-slate-700 rounded-full" />
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <HiOutlineUser className="text-emerald-400 text-sm" />
                  <span>{feed.author}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-1">
              <button
                onClick={handleShare}
                className={`flex-1 flex items-center justify-center gap-2 text-xs font-semibold py-3.5 rounded-xl transition-all
                  ${
                    copied
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      : "bg-emerald-600 hover:bg-emerald-500 active:scale-[.98] text-white shadow-lg shadow-emerald-900/30"
                  }`}
              >
                {copied ? (
                  <>
                    <HiOutlineCheckCircle className="text-sm" /> Link Copied!
                  </>
                ) : (
                  <>
                    <HiOutlineShare className="text-sm" /> Share Feed
                  </>
                )}
              </button>
              <button
                onClick={() => navigate("/feed")}
                className="flex-1 flex items-center justify-center gap-2 bg-[#111827] hover:bg-[#131d2e] border border-[#1f2a3d] hover:border-emerald-500/30 hover:text-emerald-400 text-slate-400 text-xs font-semibold py-3.5 rounded-xl transition-all"
              >
                <HiOutlineArrowLeft className="text-sm" /> Browse More Feeds
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default FeedDetails;
