import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  HiOutlineXMark, 
  HiOutlineHandThumbUp,
  HiOutlineChatBubbleLeftRight,
  HiOutlineShare,
  HiOutlineBookmark,
  HiOutlineBookmarkSlash,
  HiOutlinePause,
  HiOutlinePlay
} from "react-icons/hi2";
import { formatTimeAgo, getTypeColor, getIconForType } from "../utils/storyHelpers";
import MediaCarousel from "./MediaCarousel";
import PollCard from "./PollCard";
import CommentSection from "./CommentSection";

const StoryFullscreenViewer = ({ 
  stories, 
  initialIndex = 0, 
  onClose,
  onLike,
  onBookmark,
  onShare,
  isBookmarked
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [showComments, setShowComments] = useState(false);
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const DURATION = 5000;
  const story = stories[currentIndex];

  const handleNext = useCallback(() => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setShowComments(false);
      setProgress(0);
    } else {
      onClose();
    }
  }, [currentIndex, stories.length, onClose]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setShowComments(false);
      setProgress(0);
    }
  }, [currentIndex]);

  useEffect(() => {
    if (paused || showComments) return;

    const interval = 50;
    const timer = setInterval(() => {
      setProgress(prev => {
        const next = prev + (interval / DURATION) * 100;
        if (next >= 100) {
          handleNext();
          return 0;
        }
        return next;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [currentIndex, paused, showComments, handleNext]);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === "ArrowRight") handleNext();
      else if (e.key === "ArrowLeft") handlePrev();
      else if (e.key === "ArrowUp") handlePrev();
      else if (e.key === "ArrowDown") handleNext();
      else if (e.key === "Escape") onClose();
      else if (e.key === " ") {
        e.preventDefault();
        setPaused(p => !p);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleNext, handlePrev, onClose]);

  if (!story) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-60 bg-black flex flex-col items-center justify-center overflow-hidden touch-none"
    >
      {/* Background Blur */}
      <div 
        className="absolute inset-0 opacity-20 blur-3xl pointer-events-none transition-all duration-1000"
        style={{ 
          backgroundImage: `url(${story.media?.[0]?.url || story.image})`,
          backgroundSize: 'cover'
        }}
      />

      <div className="relative w-full max-w-lg h-full flex flex-col overflow-hidden">
        
        {/* Progress Bars */}
        <div className="absolute top-4 left-4 right-4 flex gap-1 z-30">
          {stories.map((_, idx) => (
            <div key={idx} className="flex-1 h-0.5 bg-white/20 rounded-full overflow-hidden">
              <div 
                className="h-full bg-white rounded-full transition-all ease-linear"
                style={{ 
                  width: idx < currentIndex ? '100%' : idx === currentIndex ? `${progress}%` : '0%',
                  transitionDuration: idx === currentIndex ? '50ms' : '0ms'
                }}
              />
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="absolute top-8 left-0 right-0 z-20 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full border border-white/20 overflow-hidden bg-slate-800">
              <div className="w-full h-full flex items-center justify-center text-white font-bold text-xs">
                {story.author?.[0]}
              </div>
            </div>
            <div>
              <p className="text-white text-xs font-bold">{story.author}</p>
              <p className="text-white/50 text-[9px] uppercase tracking-wider">{formatTimeAgo(story.createdAt)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setPaused(!paused)}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-black/20 text-white hover:bg-black/40 transition-colors"
            >
              {paused ? <HiOutlinePlay size={18} /> : <HiOutlinePause size={18} />}
            </button>
            <button 
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-black/20 text-white hover:bg-black/40 transition-colors"
            >
              <HiOutlineXMark size={20} />
            </button>
          </div>
        </div>

        {/* Main Content with Vertical Swipe */}
        <div className="flex-1 flex flex-col justify-center relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={story._id}
              initial={{ y: 300, opacity: 0, scale: 0.9 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: -300, opacity: 0, scale: 0.9 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              onDragEnd={(_, info) => {
                if (info.offset.y < -100) handleNext();
                else if (info.offset.y > 100) handlePrev();
              }}
              className="w-full h-full relative"
            >
              {/* Tap Navigation Areas */}
              <div className="absolute inset-0 z-10 flex">
                <div 
                  className="w-[30%] h-full cursor-pointer" 
                  onClick={(e) => { e.stopPropagation(); handlePrev(); }}
                />
                <div 
                  className="w-[40%] h-full cursor-pointer" 
                  onClick={(e) => { e.stopPropagation(); setPaused(!paused); }}
                />
                <div 
                  className="w-[30%] h-full cursor-pointer" 
                  onClick={(e) => { e.stopPropagation(); handleNext(); }}
                />
              </div>

              <div className="w-full h-full relative overflow-hidden bg-black flex flex-col justify-center">
                 <MediaCarousel 
                   media={story.media?.length > 0 ? story.media : [{ url: story.image, type: 'image' }]} 
                   className="w-full h-full"
                 />
                 
                 {/* Story Info Overlay */}
                 <div className="absolute bottom-0 left-0 right-0 p-6 pt-20 bg-linear-to-t from-black via-black/40 to-transparent text-white pointer-events-none">
                    <div className="flex items-center gap-2 mb-3">
                      <span className={`px-2 py-0.5 rounded-sm text-[9px] font-black uppercase tracking-widest ${getTypeColor(story.type)}`}>
                        {getIconForType(story.type)} {story.type}
                      </span>
                      {story.district && (
                        <span className="text-[10px] font-bold text-white/60">📍 {story.district}</span>
                      )}
                    </div>
                    <h2 className="text-xl font-black mb-2 tracking-tight leading-tight">{story.title}</h2>
                    <p className="text-sm text-white/80 line-clamp-3 mb-6 leading-relaxed">{story.content}</p>
                    
                    {story.poll?.question && (
                      <div className="mb-4 pointer-events-auto">
                        <PollCard storyId={story._id} poll={story.poll} compact />
                      </div>
                    )}
                 </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer Actions */}
        <div className="p-4 pt-2 bg-black flex items-center justify-around border-t border-white/5 relative z-20">
          <button 
            onClick={() => onLike(story._id)}
            className="flex flex-col items-center gap-1.5 text-white/40 hover:text-rose-500 transition-colors"
          >
            <HiOutlineHandThumbUp size={22} className={story.likes?.includes(story.userId) ? 'text-rose-500 fill-rose-500' : ''} />
            <span className="text-[9px] font-black uppercase tracking-widest">{story.likes?.length || 0}</span>
          </button>
          <button 
            onClick={() => { setShowComments(!showComments); setPaused(true); }}
            className="flex flex-col items-center gap-1.5 text-white/40 hover:text-sky-500 transition-colors"
          >
            <HiOutlineChatBubbleLeftRight size={22} />
            <span className="text-[9px] font-black uppercase tracking-widest">{story.comments?.length || 0}</span>
          </button>
          <button 
            onClick={() => onBookmark(story._id)}
            className="flex flex-col items-center gap-1.5 text-white/40 hover:text-amber-500 transition-colors"
          >
            {isBookmarked(story._id) ? <HiOutlineBookmarkSlash size={22} className="text-amber-500" /> : <HiOutlineBookmark size={22} />}
            <span className="text-[9px] font-black uppercase tracking-widest">Save</span>
          </button>
          <button 
            onClick={() => onShare(story)}
            className="flex flex-col items-center gap-1.5 text-white/40 hover:text-emerald-500 transition-colors"
          >
            <HiOutlineShare size={22} />
            <span className="text-[9px] font-black uppercase tracking-widest">Share</span>
          </button>
        </div>

        {/* Comments Drawer */}
        <AnimatePresence>
          {showComments && (
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="absolute inset-0 z-50 bg-[#0d1424] flex flex-col rounded-t-3xl overflow-hidden shadow-2xl"
            >
              <div className="p-4 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse" />
                  <h3 className="text-white font-bold text-sm tracking-tight">Community Discussion</h3>
                </div>
                <button 
                  onClick={() => { setShowComments(false); setPaused(false); }}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 text-slate-400 hover:text-white"
                >
                  <HiOutlineXMark size={20} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                <CommentSection 
                  storyId={story._id}
                  comments={story.comments || []}
                  storyAuthorId={story.authorId}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default StoryFullscreenViewer;
