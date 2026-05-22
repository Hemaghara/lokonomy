import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { feedService } from "../services";
import { useUser } from "../context/UserContext";
import { getSocket, joinFeedRoom, leaveFeedRoom } from "../services/socket";
import { toast } from "react-hot-toast";
import { FiFlag } from "react-icons/fi";
import ReportModal from "../components/ReportModal";
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
  HiOutlinePencilSquare,
  HiOutlineHeart,
  HiHeart,
  HiOutlineBookmark,
  HiBookmark,
  HiOutlineChatBubbleLeft,
  HiOutlineEye,
  HiOutlineArrowRight,
} from "react-icons/hi2";
import { FaWhatsapp } from "react-icons/fa";

const FeedDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useUser();
  const [feed, setFeed] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [liking, setLiking] = useState(false);
  const [comments, setComments] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingComments, setLoadingComments] = useState(false);
  const [totalComments, setTotalComments] = useState(0);
  const observerTarget = useRef(null);
  const knownComments = useRef(new Set());
  const [commentText, setCommentText] = useState("");
  const [postingComment, setPostingComment] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [bookmarking, setBookmarking] = useState(false);
  const [relatedFeeds, setRelatedFeeds] = useState([]);
  const [reportConfig, setReportConfig] = useState({ isOpen: false, targetId: null });

  useEffect(() => {
    if (!id) return;
    const socket = getSocket();
    joinFeedRoom(id);

    const handleNewComment = (data) => {
      if (data.feedId === id) {
        if (data.comment.user === user?.id) return;

        if (!knownComments.current.has(data.comment._id)) {
          knownComments.current.add(data.comment._id);
          setComments((prev) => [data.comment, ...prev]);
          setTotalComments(t => t + 1);
        }
      }
    };

    const handleLikeUpdate = (data) => {
      if (data.feedId === id) {
        setLikesCount(data.likesCount);
        if (data.userId === user?.id) {
          setIsLiked(data.isLiked);
        }
      }
    };

    socket.on("feed_comment", handleNewComment);
    socket.on("feed_like", handleLikeUpdate);

    return () => {
      socket.off("feed_comment", handleNewComment);
      socket.off("feed_like", handleLikeUpdate);
      leaveFeedRoom(id);
    };
  }, [id, user?.id]);

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.error("Please login to comment");
      return;
    }
    if (!commentText.trim()) return;
    try {
      setPostingComment(true);
      const res = await feedService.addComment(id, commentText);
      if (res.data.success) {
        toast.success("Comment posted successfully");
        const newComment = res.data.data;

        if (!knownComments.current.has(newComment._id)) {
          knownComments.current.add(newComment._id);
          setComments((prev) => [newComment, ...prev]);
          setTotalComments(t => t + 1);
        }
        setCommentText("");
      }
    } catch (err) {
      console.error("Error adding comment:", err);
      toast.error(err.response?.data?.message || "Failed to add comment");
    } finally {
      setPostingComment(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm("Are you sure you want to delete this comment?")) return;
    try {
      const res = await feedService.deleteComment(id, commentId);
      if (res.data.success) {
        toast.success("Comment deleted successfully");
        setComments((prev) => prev.filter((c) => c._id !== commentId));
        setTotalComments(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error("Error deleting comment:", err);
      toast.error("Failed to delete comment");
    }
  };

  const handleLike = async () => {
    if (!user) {
      toast.error("Please login to like this post");
      return;
    }
    if (liking) return;
    try {
      setLiking(true);
      const res = await feedService.toggleLikeFeed(id);
      setIsLiked(res.data.isLiked);
      setLikesCount(res.data.likesCount);
    } catch (err) {
      console.error("Error liking feed:", err);
      toast.error("Failed to like post");
    } finally {
      setLiking(false);
    }
  };

  const handleBookmark = async () => {
    if (!user) {
      toast.error("Please login to bookmark");
      return;
    }
    if (bookmarking) return;
    try {
      setBookmarking(true);
      const res = await feedService.toggleBookmark(id);
      setIsBookmarked(res.data.isBookmarked);
      toast.success(res.data.isBookmarked ? "Bookmarked!" : "Bookmark removed");
    } catch (err) {
      console.error("Error bookmarking:", err);
      toast.error("Failed to bookmark");
    } finally {
      setBookmarking(false);
    }
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

  const getAccentColor = (type) => {
    switch (type) {
      case "Sale": return "emerald";
      case "Offer": return "orange";
      case "Information": return "sky";
      case "New Arrival": return "violet";
      case "Exhibition": return "pink";
      case "Event": return "amber";
      default: return "slate";
    }
  };

  useEffect(() => {
    const fetchFeed = async () => {
      try {
        setLoading(true);
        const response = await feedService.getFeedById(id);
        const data = response.data.data;
        setFeed(data);
        setLikesCount(data.likes?.length || 0);
        setIsLiked(data.likes?.includes(user?.id) || false);
        setIsBookmarked(data.bookmarks?.includes(user?.id) || false);
        setTotalComments(data.commentCount || 0);

        document.title = `${data.title} - Lokonomy Feed`;
      } catch (err) {
        console.error("Error fetching feed details:", err);
        toast.error("Failed to load feed details");
      } finally {
        setLoading(false);
      }
    };
    fetchFeed();

    return () => { document.title = "Lokonomy"; };
  }, [id, user?.id]);

  useEffect(() => {
    if (!id) return;
    const fetchRelated = async () => {
      try {
        const res = await feedService.getRelatedFeeds(id, { limit: 4 });
        setRelatedFeeds(res.data.data || []);
      } catch (err) {
        console.error("Related feeds error:", err);
      }
    };
    fetchRelated();
  }, [id]);

  const fetchComments = async (pageNum, reset = false) => {
    try {
      setLoadingComments(true);
      const res = await feedService.getComments(id, pageNum);
      const newComments = res.data.data;

      newComments.forEach(c => knownComments.current.add(c._id));

      setComments(prev => reset ? newComments : [...prev, ...newComments]);
      setHasMore(pageNum < res.data.totalPages);
      setTotalComments(res.data.totalCount);
    } catch (err) {
      console.error("Error fetching comments:", err);
    } finally {
      setLoadingComments(false);
    }
  };

  useEffect(() => {
    if (id) {
      setPage(1);
      fetchComments(1, true);
    }
  }, [id]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !loadingComments) {
          setPage(prev => {
            const next = prev + 1;
            fetchComments(next, false);
            return next;
          });
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) observer.observe(currentTarget);

    return () => {
      if (currentTarget) observer.unobserve(currentTarget);
    };
  }, [hasMore, loadingComments]);

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

  const handleWhatsAppShare = () => {
    const url = window.location.href;
    const text = `Check out this feed: ${feed?.title} — ${url}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
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

  const timeAgo = (dateStr) => {
    const now = Date.now();
    const created = new Date(dateStr).getTime();
    const diff = now - created;
    const mins = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
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

  return (
    <div className="min-h-screen bg-[#080e1a] pt-32 md:pt-40 pb-20">
      <style>{`
        .fd * { font-family: 'DM Sans', sans-serif; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1f2a3d; border-radius: 99px; }
      `}</style>

      <div className="fd max-w-5xl mx-auto px-4">
        {/* Top navigation & actions */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="flex items-center justify-between mb-6 flex-wrap gap-3"
        >
          <Link
            to="/feed"
            className="flex items-center gap-2 text-slate-300 hover:text-white text-sm font-medium transition-colors"
          >
            <HiOutlineArrowLeft className="text-base" /> Back to Feed
          </Link>

          <div className="flex items-center gap-2 flex-wrap">

            <button
              onClick={handleLike}
              disabled={liking}
              className={`flex items-center gap-1.5 text-xs font-medium px-3.5 py-2 rounded-xl border transition-all duration-300 active:scale-95 disabled:opacity-55
                ${isLiked
                  ? "bg-rose-500/10 text-rose-500 border-rose-500/20 hover:bg-rose-500/20"
                  : "bg-[#111827] text-slate-300 border-[#1f2a3d] hover:text-white"
                }`}
              aria-label={isLiked ? "Unlike this post" : "Like this post"}
            >
              {isLiked ? (
                <HiHeart className="text-sm text-rose-500" />
              ) : (
                <HiOutlineHeart className="text-sm" />
              )}
              <span>{likesCount}</span>
            </button>


            <button
              onClick={handleBookmark}
              disabled={bookmarking}
              className={`flex items-center gap-1.5 text-xs font-medium px-3.5 py-2 rounded-xl border transition-all duration-300 active:scale-95 disabled:opacity-55
                ${isBookmarked
                  ? "bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20"
                  : "bg-[#111827] text-slate-300 border-[#1f2a3d] hover:text-white"
                }`}
              aria-label={isBookmarked ? "Remove bookmark" : "Bookmark this post"}
            >
              {isBookmarked ? (
                <HiBookmark className="text-sm text-amber-400" />
              ) : (
                <HiOutlineBookmark className="text-sm" />
              )}
              {isBookmarked ? "Saved" : "Save"}
            </button>


            {isOwner && (
              <>
                <Link
                  to={`/feed/edit/${feed._id}`}
                  className="flex items-center gap-1.5 text-xs font-medium px-3.5 py-2 rounded-xl border bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20 transition-all duration-300 active:scale-95"
                >
                  <HiOutlinePencilSquare className="text-sm" />
                  <span className="hidden sm:inline">Edit</span>
                </Link>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex items-center gap-1.5 text-xs font-medium px-3.5 py-2 rounded-xl border bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20 transition-all disabled:opacity-50 duration-300 active:scale-95"
                >
                  <HiOutlineTrash className="text-sm" />
                  <span className="hidden sm:inline">{deleting ? "Deleting…" : "Delete"}</span>
                </button>
              </>
            )}

            {!isOwner && (
              <button
                onClick={() => setReportConfig({ isOpen: true, targetId: feed._id })}
                className="flex items-center gap-1.5 text-xs font-medium px-3.5 py-2 rounded-xl border bg-[#111827] text-slate-300 border-[#1f2a3d] hover:text-white transition-all duration-300 active:scale-95"
                aria-label="Report this post"
              >
                <FiFlag className="text-sm" />
                <span className="hidden sm:inline">Report</span>
              </button>
            )}

            <button
              onClick={handleShare}
              className={`flex items-center gap-1.5 text-xs font-medium px-3.5 py-2 rounded-xl border transition-all duration-300 active:scale-95
                ${copied
                  ? "bg-emerald-600/20 text-emerald-300 border-emerald-500/30"
                  : "bg-[#111827] text-slate-300 border-[#1f2a3d] hover:text-white"
                }`}
              aria-label="Copy link to clipboard"
            >
              {copied ? (
                <>
                  <HiOutlineCheckCircle className="text-sm text-emerald-400" /> Copied!
                </>
              ) : (
                <>
                  <HiOutlineShare className="text-sm" /> <span className="hidden sm:inline">Share</span>
                </>
              )}
            </button>


            <button
              onClick={handleWhatsAppShare}
              className="flex items-center gap-1.5 text-xs font-medium px-3.5 py-2 rounded-xl border bg-green-500/10 text-green-400 border-green-500/20 hover:bg-green-500/20 transition-all duration-300 active:scale-95"
              aria-label="Share on WhatsApp"
            >
              <FaWhatsapp className="text-sm" />
              <span className="hidden sm:inline">WhatsApp</span>
            </button>
          </div>
        </motion.div>


        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          <motion.div
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.35 }}
            className="lg:col-span-4 space-y-3"
          >
            {feed.image ? (
              <div className={`relative overflow-hidden ${card} aspect-4/3 group`}>
                <img
                  src={feed.image}
                  alt={feed.title}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
                />
                <div className="absolute inset-0 bg-linear-to-t from-[#080e1a]/70 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4">
                  <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold backdrop-blur-sm ${getTypeColor(feed.type)}`}>
                    <span className="text-sm">{getIconForType(feed.type)}</span>
                    {feed.type}
                  </span>
                </div>
              </div>
            ) : (
              <div className={`${card} aspect-4/3 flex flex-col items-center justify-center gap-3 opacity-30`}>
                <span className={`text-4xl flex items-center justify-center w-14 h-14 rounded-2xl border ${getTypeColor(feed.type)}`}>
                  {getIconForType(feed.type)}
                </span>
                <p className="text-slate-600 text-xs">No image available</p>
              </div>
            )}


            <div className="grid grid-cols-2 gap-3">

              <div className={`${card} p-4 group hover:border-rose-500/30 hover:bg-[#131d2e] transition-all duration-300 relative overflow-hidden cursor-default`}>
                <div className="absolute bottom-0 left-0 h-0.5 w-0 bg-rose-400 group-hover:w-full transition-all duration-500 rounded-full" />
                <div className="w-8 h-8 bg-rose-500/10 border border-rose-500/20 rounded-lg flex items-center justify-center mb-2.5 group-hover:scale-110 group-hover:bg-rose-500/20 transition-all duration-300">
                  <HiOutlineMapPin className="text-rose-400 text-sm" />
                </div>
                <p className="text-[10px] text-slate-300 group-hover:text-rose-500/60 font-semibold uppercase tracking-widest mb-1 transition-colors duration-300">
                  Location
                </p>
                <p className="text-slate-200 font-semibold text-sm truncate group-hover:text-white transition-colors duration-300">
                  {feed.locationAddress ||
                    (feed.taluka ? `${feed.taluka}, ${feed.district}` : feed.district) ||
                    "Local Area"}
                </p>
              </div>


              <div className={`${card} p-4 group hover:border-sky-500/30 hover:bg-[#131d2e] transition-all duration-300 relative overflow-hidden cursor-default`}>
                <div className="absolute bottom-0 left-0 h-0.5 w-0 bg-sky-400 group-hover:w-full transition-all duration-500 rounded-full" />
                <div className="w-8 h-8 bg-sky-500/10 border border-sky-500/20 rounded-lg flex items-center justify-center mb-2.5 group-hover:scale-110 group-hover:bg-sky-500/20 transition-all duration-300">
                  <HiOutlineCalendarDays className="text-sky-400 text-sm" />
                </div>
                <p className="text-[10px] text-slate-300 group-hover:text-sky-500/60 font-semibold uppercase tracking-widest mb-1 transition-colors duration-300">
                  Posted
                </p>
                <p className="text-slate-200 font-semibold text-xs leading-snug group-hover:text-white transition-colors duration-300">
                  {formattedDate}
                </p>
                <p className="text-slate-300 text-[10px] mt-0.5 flex items-center gap-1">
                  <HiOutlineClock className="text-xs" /> {formattedTime}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className={`${card} p-3 text-center group hover:border-rose-500/30 transition-all duration-300`}>
                <div className="text-rose-400 text-lg mb-0.5">
                  {isLiked ? <HiHeart className="mx-auto" /> : <HiOutlineHeart className="mx-auto" />}
                </div>
                <p className="text-white font-bold text-sm">{likesCount}</p>
                <p className="text-slate-500 text-[9px] uppercase tracking-wider font-semibold">Likes</p>
              </div>
              <div className={`${card} p-3 text-center group hover:border-sky-500/30 transition-all duration-300`}>
                <HiOutlineChatBubbleLeft className="text-sky-400 text-lg mx-auto mb-0.5" />
                <p className="text-white font-bold text-sm">{totalComments}</p>
                <p className="text-slate-500 text-[9px] uppercase tracking-wider font-semibold">Comments</p>
              </div>
              <div className={`${card} p-3 text-center group hover:border-violet-500/30 transition-all duration-300`}>
                <HiOutlineEye className="text-violet-400 text-lg mx-auto mb-0.5" />
                <p className="text-white font-bold text-sm">{feed.viewCount || 0}</p>
                <p className="text-slate-500 text-[9px] uppercase tracking-wider font-semibold">Views</p>
              </div>
            </div>


            <Link
              to={`/profile/${feed.authorId}`}
              className={`${card} p-4 group hover:border-emerald-500/30 hover:bg-[#131d2e] transition-all duration-300 relative overflow-hidden block`}
            >
              <div className="absolute bottom-0 left-0 h-0.5 w-0 bg-emerald-400 group-hover:w-full transition-all duration-500 rounded-full" />
              <p className="text-[10px] text-slate-300 font-semibold uppercase tracking-widest mb-3">
                Posted By
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold text-sm shrink-0 group-hover:scale-110 group-hover:bg-emerald-500/20 transition-all duration-300 overflow-hidden">
                  {feed.authorProfilePhoto ? (
                    <img src={feed.authorProfilePhoto} alt={feed.author} className="w-full h-full object-cover" />
                  ) : (
                    feed.author?.[0]?.toUpperCase()
                  )}
                </div>
                <div>
                  <p className="text-slate-200 font-semibold text-sm group-hover:text-white transition-colors duration-300">
                    {feed.author}
                  </p>
                  <p className="text-slate-300 text-[10px] flex items-center gap-1 mt-0.5">
                    <HiOutlineUser className="text-xs" /> Community Member
                  </p>
                </div>
              </div>
            </Link>


            <div className={`${card} p-4 group hover:border-sky-500/30 hover:bg-[#131d2e] transition-all duration-300 relative overflow-hidden cursor-default`}>
              <div className="absolute bottom-0 left-0 h-0.5 w-0 bg-sky-400 group-hover:w-full transition-all duration-500 rounded-full" />
              <p className="text-[10px] text-slate-300 font-semibold uppercase tracking-widest mb-3">
                Category
              </p>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl ${getTypeColor(feed.type)} flex items-center justify-center text-lg shrink-0 group-hover:scale-110 transition-all duration-300`}>
                  {getIconForType(feed.type)}
                </div>
                <div>
                  <p className="text-slate-200 font-semibold text-sm group-hover:text-white transition-colors duration-300">
                    {feed.type}
                  </p>
                  <p className="text-slate-300 text-[10px] flex items-center gap-1 mt-0.5">
                    <HiOutlineBuildingStorefront className="text-xs" /> Feed Category
                  </p>
                </div>
              </div>
            </div>


            {feed.tags && feed.tags.length > 0 && (
              <div className={`${card} p-4`}>
                <p className="text-[10px] text-slate-300 font-semibold uppercase tracking-widest mb-3">
                  Tags
                </p>
                <div className="flex flex-wrap gap-2">
                  {feed.tags.map((tag, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg text-[10px] font-semibold"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </motion.div>


          <motion.article
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.35, delay: 0.08 }}
            className="lg:col-span-8 space-y-5"
          >

            <header>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border text-[11px] font-semibold ${getTypeColor(feed.type)}`}>
                  <span className="text-sm">{getIconForType(feed.type)}</span>
                  {feed.type}
                </span>
                <time dateTime={feed.createdAt} className="text-slate-300 text-xs font-medium">
                  {timeAgo(feed.createdAt)}
                </time>
              </div>

              <h1 className="text-white font-bold text-2xl md:text-3xl leading-snug mb-4">
                {feed.title}
              </h1>
            </header>


            <div className={`${card} p-6 relative overflow-hidden`}>
              <div className="absolute left-0 top-6 bottom-6 w-0.5 bg-linear-to-b to-transparent rounded-full" />
              <p className="text-slate-400 text-sm md:text-base leading-[1.9] whitespace-pre-wrap pl-5">
                {feed.content}
              </p>
            </div>


            <div className={`${card} p-4`}>
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <HiOutlineMapPin className="text-emerald-400 text-sm" />
                  <span>
                    {feed.locationAddress ||
                      (feed.taluka ? `${feed.taluka}, ${feed.district}` : feed.district) ||
                      "Local Area"}
                  </span>
                </div>
                <span className="w-1 h-1 bg-slate-700 rounded-full" />
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <HiOutlineClock className="text-emerald-400 text-sm" />
                  <time dateTime={feed.createdAt}>
                    {formattedDate} at {formattedTime}
                  </time>
                </div>
                <span className="w-1 h-1 bg-slate-700 rounded-full" />
                <Link
                  to={`/profile/${feed.authorId}`}
                  className="flex items-center gap-2 text-xs text-slate-300 hover:text-emerald-400 transition-colors"
                >
                  <HiOutlineUser className="text-emerald-400 text-sm" />
                  <span>{feed.author}</span>
                </Link>
              </div>
            </div>


            <div className="flex flex-col sm:flex-row gap-3 pt-1">
              <button
                onClick={handleShare}
                className={`flex-1 flex items-center justify-center gap-2 text-xs font-semibold py-3.5 rounded-xl transition-all
                  ${copied
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
                onClick={handleWhatsAppShare}
                className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 active:scale-[.98] text-white text-xs font-semibold py-3.5 rounded-xl transition-all shadow-lg shadow-green-900/30"
              >
                <FaWhatsapp className="text-sm" /> Share on WhatsApp
              </button>
              <button
                onClick={() => navigate("/feed")}
                className="flex-1 flex items-center justify-center gap-2 bg-[#111827] hover:bg-[#131d2e] border border-[#1f2a3d] hover:border-emerald-500/30 hover:text-emerald-400 text-slate-400 text-xs font-semibold py-3.5 rounded-xl transition-all"
              >
                <HiOutlineArrowLeft className="text-sm" /> Browse More Feeds
              </button>
            </div>


            <section className={`${card} p-6 mt-6 relative overflow-hidden`} aria-label="Comments">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500/20 via-sky-500/20 to-transparent" />
              <h3 className="text-white font-bold text-lg mb-6 flex items-center gap-2">
                <span className="text-emerald-400">💬</span> Comments ({totalComments})
              </h3>


              {user ? (
                <form onSubmit={handleAddComment} className="mb-8 sm:mb-8 sticky bottom-0 z-40 bg-[#111827] pt-2 pb-4 shadow-[0_-15px_15px_-15px_rgba(17,24,39,1)]">
                  <div className="flex gap-3 items-start">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold text-xs shrink-0 cursor-default">
                      {user.name?.[0]?.toUpperCase() || "U"}
                    </div>
                    <div className="flex-1 space-y-2">
                      <textarea
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        placeholder="Write a supportive comment, ask a question, or say thanks..."
                        rows={3}
                        maxLength={500}
                        className="w-full bg-[#111827] text-white text-sm rounded-xl border border-[#1f2a3d] focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/25 p-3 placeholder-slate-600 transition-all duration-300 resize-none"
                        aria-label="Write a comment"
                      />
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] text-slate-500">
                          {500 - commentText.length} characters left
                        </span>
                        <button
                          type="submit"
                          disabled={postingComment || !commentText.trim()}
                          className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:hover:bg-emerald-600 text-white text-xs font-bold px-4 py-2 rounded-lg transition-all duration-200 active:scale-95 shadow-md shadow-emerald-950/20"
                        >
                          {postingComment ? "Posting..." : "Post Comment"}
                        </button>
                      </div>
                    </div>
                  </div>
                </form>
              ) : (
                <div className="bg-[#111827]/40 border border-[#1f2a3d] rounded-xl p-4 text-center mb-8">
                  <p className="text-slate-500 text-xs mb-2">You must be logged in to participate in the local discussion.</p>
                  <Link to="/login" className="inline-block text-emerald-400 hover:text-emerald-300 text-xs font-bold">
                    Login / Sign Up
                  </Link>
                </div>
              )}


              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar" role="log" aria-live="polite" aria-label="Comments list">
                {comments.length > 0 ? (
                  comments.map((comment) => {
                    const isCommentAuthor = comment.user === user?.id || feed.authorId === user?.id;
                    return (
                      <div key={comment._id} className="flex gap-3 items-start border-b border-[#1f2a3d]/40 pb-4 last:border-0 last:pb-0 group/comment">
                        <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 font-semibold text-xs shrink-0">
                          {comment.userName?.[0]?.toUpperCase() || "U"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center gap-2 mb-1">
                            <span className="text-slate-200 text-xs font-bold truncate">
                              {comment.userName}
                            </span>
                            <div className="flex items-center gap-2 shrink-0">
                              <time dateTime={comment.createdAt} className="text-[10px] text-slate-500">
                                {new Date(comment.createdAt).toLocaleDateString(undefined, {
                                  month: "short",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </time>
                              {isCommentAuthor && (
                                <button
                                  onClick={() => handleDeleteComment(comment._id)}
                                  className="text-slate-500 hover:text-red-400 p-0.5 rounded transition-colors"
                                  title="Delete Comment"
                                  aria-label="Delete comment"
                                >
                                  <HiOutlineTrash className="text-xs" />
                                </button>
                              )}
                            </div>
                          </div>
                          <p className="text-slate-400 text-xs leading-relaxed whitespace-pre-wrap">
                            {comment.text}
                          </p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  !loadingComments && (
                    <div className="py-6 text-center text-slate-600 text-xs">
                      No comments yet. Share your thoughts to kickstart the conversation!
                    </div>
                  )
                )}

                {loadingComments && (
                  <div className="py-4 flex justify-center">
                    <div className="w-5 h-5 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
                  </div>
                )}

                {hasMore && !loadingComments && comments.length > 0 && (
                  <div ref={observerTarget} className="h-4" />
                )}
              </div>
            </section>


            {relatedFeeds.length > 0 && (
              <section className="mt-8" aria-label="Related feeds">
                <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                  <span className="text-emerald-400">📰</span> Related Feeds
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {relatedFeeds.map((item) => (
                    <Link
                      key={item._id}
                      to={`/feed/${item._id}`}
                      className={`${card} flex overflow-hidden hover:border-emerald-500/30 hover:bg-[#131d2e] transition-all duration-300 group`}
                    >
                      <div className="w-24 h-24 shrink-0 bg-[#0d1424] overflow-hidden">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.title}
                            loading="lazy"
                            decoding="async"
                            className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="text-2xl opacity-10">{getIconForType(item.type)}</span>
                          </div>
                        )}
                      </div>
                      <div className="p-3 flex-1 min-w-0">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[9px] font-semibold mb-1.5 ${getTypeColor(item.type)}`}>
                          {item.type}
                        </span>
                        <h4 className="text-slate-200 text-xs font-semibold line-clamp-2 group-hover:text-emerald-400 transition-colors mb-1">
                          {item.title}
                        </h4>
                        <div className="flex items-center gap-2 text-[10px] text-slate-500">
                          <span className="flex items-center gap-0.5">
                            <HiOutlineHeart className="text-xs" /> {item.likes?.length || 0}
                          </span>
                          <span className="flex items-center gap-0.5">
                            <HiOutlineChatBubbleLeft className="text-xs" /> {item.comments?.length || 0}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center pr-3">
                        <HiOutlineArrowRight className="text-slate-600 group-hover:text-emerald-400 transition-colors" />
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </motion.article>
        </div>
      </div>
      <ReportModal
        isOpen={reportConfig.isOpen}
        onClose={() => setReportConfig({ isOpen: false, targetId: null })}
        targetType="feed"
        targetId={reportConfig.targetId}
      />
    </div>
  );
};

export default FeedDetails;
