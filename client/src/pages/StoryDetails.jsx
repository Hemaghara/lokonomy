import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { storyService } from "../services";
import { useLocation } from "../context/LocationContext";
import { useUser } from "../context/UserContext";
import { getTimeRemaining, getIconForType, getTypeColor, formatTimeAgo } from "../utils/storyHelpers";
import { toast } from "react-hot-toast";
import CommentSection from "../components/CommentSection";
import PollCard from "../components/PollCard";
import MediaCarousel from "../components/MediaCarousel";
import { getSocket } from "../services/socket";
import {
  HiOutlineArrowLeft,
  HiOutlineMapPin,
  HiOutlineClock,
  HiOutlineShare,
  HiOutlineUser,
  HiOutlineChatBubbleLeftRight,
  HiOutlineCheckCircle,
  HiOutlinePencilSquare,
  HiOutlineBookmark,
  HiOutlineBookmarkSlash,
  HiOutlineHandThumbUp,
  HiOutlineEye,
  HiOutlineArrowRight,
} from "react-icons/hi2";

const StoryExpiryStatus = ({ expiresAt }) => {
  const [info, setInfo] = useState(() => getTimeRemaining(expiresAt));
  useEffect(() => {
    const id = setInterval(() => setInfo(getTimeRemaining(expiresAt)), 60000);
    return () => clearInterval(id);
  }, [expiresAt]);

  const textColor = info.expired
    ? "text-red-400"
    : info.urgent
      ? "text-orange-400"
      : "text-violet-400";

  const bgColor = info.expired
    ? "bg-red-500/10 border-red-500/20"
    : info.urgent
      ? "bg-orange-500/10 border-orange-500/20"
      : "bg-violet-500/10 border-violet-500/20";

  return (
    <div
      className={`px-2 py-1 rounded-lg border text-[10px] font-bold uppercase tracking-tight shrink-0 flex items-center gap-1 ${textColor} ${bgColor}`}
    >
      <div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
      {info.expired ? "Expired" : `${info.label} Left`}
    </div>
  );
};

const StoryDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { district } = useLocation();
  const { user } = useUser();
  const [story, setStory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [relatedStories, setRelatedStories] = useState([]);

  useEffect(() => {
    const fetchStory = async () => {
      try {
        setLoading(true);
        const response = await storyService.getStoryById(id);
        setStory(response.data.data);
      } catch (err) {
        console.error("Error fetching story details:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStory();
  }, [id]);

  // Fetch related stories
  useEffect(() => {
    if (id) {
      storyService.getRelatedStories(id)
        .then(res => setRelatedStories(res.data.data || []))
        .catch(() => {});
    }
  }, [id]);

  // Check bookmark status
  useEffect(() => {
    if (user && id) {
      storyService.getSavedStories()
        .then(res => {
          const savedIds = (res.data.data || []).map(s => s._id);
          setIsBookmarked(savedIds.includes(id));
        })
        .catch(() => {});
    }
  }, [user, id]);

  // Real-time comment updates
  useEffect(() => {
    const socket = getSocket();
    const handler = ({ storyId: sid, comment }) => {
      if (sid === id && story) {
        setStory(prev => ({
          ...prev,
          comments: prev.comments?.find(c => c._id === comment._id)
            ? prev.comments
            : [...(prev.comments || []), comment]
        }));
      }
    };
    socket.on("story_comment", handler);
    return () => socket.off("story_comment", handler);
  }, [id, story]);

  const handleShare = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: story?.title, url });
        await storyService.shareStory(id);
      } else {
        await navigator.clipboard.writeText(url);
      }
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

  const handleBookmark = async () => {
    if (!user) {
      toast.error("Please login to save stories");
      return;
    }
    try {
      const res = await storyService.toggleBookmark(id);
      setIsBookmarked(res.data.isBookmarked);
      toast.success(res.data.message);
    } catch (err) {
      toast.error("Failed to save story");
    }
  };

  const handleContactReporter = () => {
    if (!user) {
      toast.error("Please login to contact reporter");
      return;
    }
    navigate(`/my-chats?chatType=story_inquiry&receiverId=${story.authorId}&storyTitle=${encodeURIComponent(story.title)}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080e1a] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-9 h-9 border-2 border-violet-500/20 border-t-violet-500 rounded-full animate-spin" />
          <p className="text-slate-500 text-xs font-medium uppercase tracking-widest">
            Loading…
          </p>
        </div>
      </div>
    );
  }
  if (!story) {
    return (
      <div className="min-h-screen bg-[#080e1a] flex flex-col items-center justify-center text-center px-6">
        <h2 className="text-white font-semibold text-lg mb-2">
          Story Not Found
        </h2>
        <p className="text-slate-500 text-sm mb-6">
          This story may have been removed.
        </p>
        <Link
          to="/stories"
          className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold px-5 py-2.5 rounded-xl transition-all"
        >
          <HiOutlineArrowLeft /> Back to Stories
        </Link>
      </div>
    );
  }

  const card = "bg-[#111827] border border-[#1f2a3d] rounded-2xl";
  const isAuthor = user?.id === story.authorId?.toString();

  return (
    <div className="min-h-screen bg-[#080e1a] pt-32 md:pt-40 pb-20">
      <style>{`
        .sd * { font-family: 'DM Sans', sans-serif; }
      `}</style>

      <div className="sd max-w-5xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="flex items-center justify-between mb-6"
        >
          <Link
            to="/stories"
            className="flex items-center gap-2 text-slate-300 hover:text-white text-xs font-medium transition-colors"
          >
            <HiOutlineArrowLeft className="text-sm" /> Back to Stories
          </Link>

          <div className="flex items-center gap-2">
            {/* Bookmark button */}
            <button
              onClick={handleBookmark}
              className={`flex items-center gap-1.5 text-sm font-medium px-3.5 py-2 rounded-xl border transition-all ${
                isBookmarked
                  ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                  : "bg-[#111827] text-slate-300 border-[#1f2a3d] hover:text-amber-400"
              }`}
            >
              {isBookmarked ? (
                <><HiOutlineBookmarkSlash className="text-base" /> Saved</>
              ) : (
                <><HiOutlineBookmark className="text-base" /> Save</>
              )}
            </button>

            {/* Edit button (author only) */}
            {isAuthor && (
              <button
                onClick={() => navigate(`/stories/edit/${id}`)}
                className="flex items-center gap-1.5 text-sm font-medium px-3.5 py-2 rounded-xl border bg-[#111827] text-slate-300 border-[#1f2a3d] hover:text-violet-400 hover:border-violet-500/30 transition-all"
              >
                <HiOutlinePencilSquare className="text-base" /> Edit
              </button>
            )}

            {/* Share button */}
            <button
              onClick={handleShare}
              aria-label={copied ? "Copied!" : "Share"}
              className={`flex items-center gap-1.5 text-sm font-medium px-3.5 py-2 rounded-xl border transition-all
                ${
                  copied
                    ? "bg-emerald-600/10 text-emerald-300 border-emerald-500/20"
                    : "bg-[#111827] text-slate-300 border-[#1f2a3d] hover:text-white"
                }`}
            >
              {copied ? (
                <><HiOutlineCheckCircle className="text-base" /> Copied!</>
              ) : (
                <><HiOutlineShare className="text-base" /> Share</>
              )}
            </button>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left column: Media + Info cards */}
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.35 }}
            className="lg:col-span-4 space-y-3"
          >
            {/* Media carousel or single image */}
            {(story.media?.length > 0 || story.image) ? (
              <div className={`relative overflow-hidden ${card} aspect-3/4 group`}>
                <MediaCarousel
                  media={story.media}
                  image={story.image}
                  className="w-full h-full"
                />
                <div className="absolute bottom-4 left-4 z-10">
                  <span
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold backdrop-blur-sm ${getTypeColor(story.type)}`}
                  >
                    <span className="text-sm">{getIconForType(story.type)}</span>
                    {story.type}
                  </span>
                </div>
              </div>
            ) : (
              <div
                className={`${card} aspect-3/4 flex flex-col items-center justify-center gap-3 opacity-30`}
              >
                <span
                  className={`text-4xl flex items-center justify-center w-14 h-14 rounded-2xl border ${getTypeColor(story.type)}`}
                >
                  {getIconForType(story.type)}
                </span>
                <p className="text-slate-600 text-xs">No image available</p>
              </div>
            )}

            {/* Location + Validity cards */}
            <div className="grid grid-cols-2 gap-3">
              <div
                className={`${card} p-4 group hover:border-rose-500/30 hover:bg-[#131d2e] transition-all duration-300 relative overflow-hidden cursor-default`}
              >
                <div className="absolute bottom-0 left-0 h-0.5 w-0 bg-rose-400 group-hover:w-full transition-all duration-500 rounded-full" />
                <div className="w-8 h-8 bg-rose-500/10 border border-rose-500/20 rounded-lg flex items-center justify-center mb-2.5 group-hover:scale-110 group-hover:bg-rose-500/20 transition-all duration-300">
                  <HiOutlineMapPin className="text-rose-400 text-sm" />
                </div>
                <p className="text-[10px] text-slate-300 group-hover:text-rose-500/60 font-semibold uppercase tracking-widest mb-1 transition-colors duration-300">
                  Location
                </p>
                <p className="text-slate-200 font-semibold text-sm truncate group-hover:text-white transition-colors duration-300">
                  {story.locationAddress ||
                    (story.taluka
                      ? `${story.taluka}, ${story.district}`
                      : story.district) ||
                    "Local Neighborhood"}
                </p>
              </div>

              <div
                className={`${card} p-4 group hover:border-violet-500/30 hover:bg-[#131d2e] transition-all duration-300 relative overflow-hidden cursor-default`}
              >
                <div className="absolute bottom-0 left-0 h-0.5 w-0 bg-violet-400 group-hover:w-full transition-all duration-500 rounded-full" />
                <div className="flex items-center justify-between mb-2.5">
                  <div className="w-8 h-8 bg-violet-500/10 border border-violet-500/20 rounded-lg flex items-center justify-center group-hover:scale-110 group-hover:bg-violet-500/20 transition-all duration-300">
                    <HiOutlineClock className="text-violet-400 text-sm" />
                  </div>
                  <StoryExpiryStatus
                    expiresAt={
                      story.expiresAt ||
                      new Date(new Date(story.createdAt).getTime() + 24 * 60 * 60 * 1000)
                    }
                  />
                </div>
                <p className="text-[10px] text-slate-300 group-hover:text-violet-500/60 font-semibold uppercase tracking-widest mb-1 transition-colors duration-300">
                  Validity
                </p>
                <p className="text-slate-200 font-semibold text-xs leading-snug group-hover:text-white transition-colors duration-300">
                  {new Date(story.createdAt).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
                <p className="text-slate-300 text-[10px] mt-0.5 flex items-center gap-1">
                  Published:{" "}
                  {new Date(story.createdAt).toLocaleTimeString("en-GB", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>

            {/* Reporter card */}
            <div
              className={`${card} p-4 group hover:border-violet-500/30 hover:bg-[#131d2e] transition-all duration-300 relative overflow-hidden cursor-default`}
            >
              <div className="absolute bottom-0 left-0 h-0.5 w-0 bg-violet-400 group-hover:w-full transition-all duration-500 rounded-full" />
              <p className="text-[10px] text-slate-300 font-semibold uppercase tracking-widest mb-3">
                Reporter
              </p>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 font-bold text-sm shrink-0 group-hover:scale-110 group-hover:bg-violet-500/20 transition-all duration-300">
                  {story.author?.[0]?.toUpperCase()}
                </div>
                <div>
                  <p className="text-slate-200 font-semibold text-sm group-hover:text-white transition-colors duration-300">
                    {story.author}
                  </p>
                  <p className="text-slate-300 text-[10px] flex items-center gap-1 mt-0.5">
                    <HiOutlineUser className="text-xs" /> Community Reporter
                  </p>
                </div>
              </div>
            </div>

            {/* Engagement stats */}
            <div className={`${card} p-4`}>
              <p className="text-[10px] text-slate-300 font-semibold uppercase tracking-widest mb-3">
                Engagement
              </p>
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-violet-400 mb-1">
                    <HiOutlineHandThumbUp className="text-sm" />
                  </div>
                  <p className="text-white font-bold text-lg">{story.likes?.length || 0}</p>
                  <p className="text-slate-600 text-[9px] uppercase tracking-wider">Likes</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-sky-400 mb-1">
                    <HiOutlineEye className="text-sm" />
                  </div>
                  <p className="text-white font-bold text-lg">{story.views || 0}</p>
                  <p className="text-slate-600 text-[9px] uppercase tracking-wider">Views</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-emerald-400 mb-1">
                    <HiOutlineShare className="text-sm" />
                  </div>
                  <p className="text-white font-bold text-lg">{story.shares || 0}</p>
                  <p className="text-slate-600 text-[9px] uppercase tracking-wider">Shares</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right column: Content + Comments + Poll + Related */}
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.35, delay: 0.08 }}
            className="lg:col-span-8 space-y-5"
          >
            <div>
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border text-[11px] font-semibold mb-3 ${getTypeColor(story.type)}`}
              >
                <span className="text-sm">{getIconForType(story.type)}</span>
                {story.type}
              </span>

              <h1 className="text-white font-bold text-2xl md:text-3xl leading-snug mb-4">
                {story.title}
              </h1>
            </div>

            {/* Story content */}
            <div className={`${card} p-6 relative overflow-hidden`}>
              <div className="absolute left-0 top-6 bottom-6 w-0.5 to-transparent rounded-full" />
              <p className="text-slate-400 text-sm md:text-base leading-[1.9] whitespace-pre-wrap pl-5">
                {story.content}
              </p>
            </div>

            {/* Poll section */}
            {story.poll?.question && (
              <PollCard storyId={story._id} poll={story.poll} />
            )}

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-1">
              <button
                onClick={handleShare}
                aria-label={copied ? "Link Copied!" : "Share Story"}
                className={`flex-1 flex items-center justify-center gap-2 text-xs font-semibold py-3.5 rounded-xl transition-all
                  ${
                    copied
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      : "bg-violet-600 hover:bg-violet-500 active:scale-[.98] text-white shadow-lg shadow-violet-900/30"
                  }`}
              >
                {copied ? (
                  <><HiOutlineCheckCircle className="text-sm" /> Link Copied!</>
                ) : (
                  <><HiOutlineShare className="text-sm" /> Share Story</>
                )}
              </button>
              <button
                onClick={handleContactReporter}
                className="flex-1 flex items-center justify-center gap-2 bg-[#111827] hover:bg-[#131d2e] border border-[#1f2a3d] hover:border-violet-500/30 hover:text-violet-400 text-slate-400 text-xs font-semibold py-3.5 rounded-xl transition-all"
              >
                <HiOutlineChatBubbleLeftRight className="text-sm" /> Contact Reporter
              </button>
            </div>

            {/* Comments section */}
            <CommentSection
              storyId={story._id}
              comments={story.comments || []}
              storyAuthorId={story.authorId}
            />

            {/* Related stories */}
            {relatedStories.length > 0 && (
              <div>
                <h3 className="text-white font-semibold text-sm mb-4 flex items-center gap-2">
                  📍 More from your area
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {relatedStories.map(rs => (
                    <Link
                      key={rs._id}
                      to={`/stories/${rs._id}`}
                      className={`${card} p-3 flex items-center gap-3 hover:border-violet-500/30 hover:bg-[#131d2e] transition-all group`}
                    >
                      <div className="w-14 h-14 rounded-xl overflow-hidden bg-[#0d1424] shrink-0">
                        {rs.image ? (
                          <img src={rs.image} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-2xl opacity-20">
                            {getIconForType(rs.type)}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-slate-200 text-xs font-semibold line-clamp-2 group-hover:text-violet-400 transition-colors">
                          {rs.title}
                        </p>
                        <p className="text-slate-600 text-[10px] mt-1 flex items-center gap-1">
                          <HiOutlineEye className="text-xs" /> {rs.views || 0}
                          <span className="mx-1">·</span>
                          {formatTimeAgo(rs.createdAt)}
                        </p>
                      </div>
                      <HiOutlineArrowRight className="text-slate-600 group-hover:text-violet-400 transition-colors shrink-0" />
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default StoryDetails;
