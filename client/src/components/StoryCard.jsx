import { useNavigate } from "react-router-dom";
import { getTimeRemaining, getIconForType, getTypeColor } from "../utils/storyHelpers";
import { haversineDistance, formatDistance } from "../utils/geoUtils";
import { useUser } from "../context/UserContext";
import { useState, useEffect } from "react";
import {
  HiOutlineClock,
  HiOutlineMapPin,
  HiOutlineArrowRight,
  HiOutlineSparkles,
  HiOutlineHandThumbUp,
  HiOutlineEye,
  HiOutlineShare,
  HiOutlineCheckBadge,
  HiOutlineBookmarkSlash,
  HiOutlineBookmark,
  HiOutlineChatBubbleLeftRight,
} from "react-icons/hi2";
import { FiFlag } from "react-icons/fi";

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

const StoryCard = ({
  story,
  onLike,
  onShare,
  onBookmark,
  onReport,
  showDistance = false,
  userLocation = null,
  isBookmarked = false,
  isNew = false,
}) => {
  const navigate = useNavigate();
  const { user } = useUser();

  const distance = showDistance && userLocation && story.location?.coordinates
    ? haversineDistance(
        userLocation.lat,
        userLocation.lng,
        story.location.coordinates[1],
        story.location.coordinates[0]
      )
    : null;

  const card = "bg-[#111827] border border-[#1f2a3d] rounded-2xl";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.18 }}
      onClick={() => navigate(`/stories/${story._id}`)}
      className={`${card} flex flex-col overflow-hidden hover:border-violet-500/30 hover:bg-[#131d2e] transition-all duration-300 cursor-pointer group relative ${
        isNew ? "ring-2 ring-violet-500/40 animate-pulse" : ""
      }`}
    >
      <div className="relative aspect-video overflow-hidden bg-[#0d1424]">
        {(story.media?.length > 0 ? story.media[0]?.url : story.image) ? (
          story.media?.[0]?.type === 'video' ? (
            <video
              src={story.media[0].url}
              className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
              muted
              playsInline
              loop
              autoPlay
            />
          ) : (
            <img
              src={story.media?.length > 0 ? story.media[0].url : story.image}
              alt=""
              className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
            />
          )
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-5xl opacity-10">
              {getIconForType(story.type)}
            </span>
          </div>
        )}

        {story.media?.length > 1 && (
          <div className="absolute top-3 right-12 bg-black/50 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded-lg">
            1/{story.media.length}
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

        {onReport && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onReport(story._id);
            }}
            className="absolute top-3 right-3 w-8 h-8 rounded-lg bg-slate-900/60 backdrop-blur-md border border-white/10 text-slate-400 opacity-0 group-hover:opacity-100 hover:text-rose-400 hover:bg-slate-900 transition-all flex items-center justify-center z-10"
            aria-label="Report"
          >
            <FiFlag size={14} />
          </button>
        )}

        {story.isVerified && (
          <div className="absolute top-3 right-12">
            <span className="flex items-center gap-1 bg-sky-500/20 text-sky-400 border border-sky-500/30 backdrop-blur-md px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider">
              <HiOutlineCheckBadge className="text-sm" /> Verified
            </span>
          </div>
        )}

        {new Date() - new Date(story.createdAt) < 30 * 60 * 1000 && (
          <div className="absolute top-3 right-3 z-10">
            <span className="flex items-center gap-1.5 bg-rose-600/90 text-white px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest animate-pulse">
              <span className="w-1.5 h-1.5 bg-white rounded-full" />
              Live
            </span>
          </div>
        )}

        {distance !== null && (
          <div className="absolute bottom-3 left-3">
            <span className="flex items-center gap-1 bg-black/60 backdrop-blur-sm text-emerald-400 text-[10px] font-bold px-2 py-1 rounded-lg border border-emerald-500/20">
              📍 {formatDistance(distance)} away
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
            {story.locationAddress || story.taluka || story.district}
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

        <p className="text-slate-500 text-xs leading-relaxed line-clamp-2 mb-3">
          {story.content}
        </p>



        <div className="flex items-center justify-between mt-auto pt-3 border-t border-[#1f2a3d]">
          <div className="flex items-center gap-3">
            <button
              onClick={(e) => { e.stopPropagation(); onLike?.(e, story._id); }}
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
              onClick={(e) => { e.stopPropagation(); onShare?.(e, story); }}
              className="flex items-center gap-1.5 text-[11px] text-slate-500 hover:text-slate-300 font-semibold transition-colors"
            >
              <HiOutlineShare className="text-sm" />
              {story.shares || 0}
            </button>
            {story.comments?.length > 0 && (
              <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-semibold">
                <HiOutlineChatBubbleLeftRight className="text-sm" />
                {story.comments.length}
              </div>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {onBookmark && (
              <button
                onClick={(e) => { e.stopPropagation(); onBookmark?.(e, story._id); }}
                className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                  isBookmarked
                    ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                    : "bg-[#0d1424] border border-[#1f2a3d] text-slate-600 hover:text-amber-400 hover:border-amber-500/30"
                }`}
                title={isBookmarked ? "Remove bookmark" : "Save story"}
              >
                {isBookmarked ? (
                  <HiOutlineBookmarkSlash className="text-sm" />
                ) : (
                  <HiOutlineBookmark className="text-sm" />
                )}
              </button>
            )}
            <div className="w-7 h-7 rounded-lg bg-[#0d1424] border border-[#1f2a3d] flex items-center justify-center text-slate-600 group-hover:text-violet-400 group-hover:border-violet-500/30 transition-colors">
              <HiOutlineArrowRight className="text-sm" />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default StoryCard;
