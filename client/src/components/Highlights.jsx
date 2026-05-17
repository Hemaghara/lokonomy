import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { storyService } from "../services";
import {
  HiOutlineTag,
  HiOutlinePhoto,
  HiOutlineCalendarDays,
  HiOutlineMegaphone,
  HiOutlineSparkles,
  HiOutlineXMark,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlinePause,
  HiOutlinePlay,
} from "react-icons/hi2";

const HighlightCircle = ({ highlight, onClick, isActive }) => {
  const getIcon = (category) => {
    switch (category) {
      case "Offers":
        return <HiOutlineTag />;
      case "Gallery":
        return <HiOutlinePhoto />;
      case "Events":
        return <HiOutlineCalendarDays />;
      case "Announcements":
        return <HiOutlineMegaphone />;
      default:
        return <HiOutlineSparkles />;
    }
  };

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => onClick(highlight)}
      className="flex flex-col items-center gap-2 cursor-pointer shrink-0 group"
    >
      <div
        className={`relative p-0.75 rounded-full transition-all duration-500 shadow-lg ${
          isActive
            ? "bg-linear-to-tr from-violet-500 via-primary to-violet-500 shadow-primary/30"
            : "bg-linear-to-tr from-amber-400 via-fuchsia-500 to-primary group-hover:from-primary group-hover:to-amber-400 shadow-primary/10"
        }`}
      >
        <div className="w-16 h-16 rounded-full border-2 border-[#111827] overflow-hidden bg-[#1f2a3d] flex items-center justify-center">
          {highlight.image ? (
            <img
              src={highlight.image}
              alt={highlight.highlightCategory}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-2xl text-primary/60">
              {getIcon(highlight.highlightCategory)}
            </span>
          )}
        </div>
      </div>
      <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider group-hover:text-primary transition-colors">
        {highlight.highlightCategory}
      </span>
    </motion.div>
  );
};

const StoryModal = ({ highlights, currentIndex, onClose, onNavigate }) => {
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef(null);
  const touchStartX = useRef(0);
  const DURATION = 5000;

  const highlight = highlights[currentIndex];
  if (!highlight) return null;

  const goNext = useCallback(() => {
    if (currentIndex < highlights.length - 1) {
      onNavigate(currentIndex + 1);
    } else {
      onClose();
    }
  }, [currentIndex, highlights.length, onNavigate, onClose]);

  const goPrev = useCallback(() => {
    if (currentIndex > 0) {
      onNavigate(currentIndex - 1);
    }
  }, [currentIndex, onNavigate]);

  useEffect(() => {
    setProgress(0);
    if (paused) return;

    const interval = 50;
    timerRef.current = setInterval(() => {
      setProgress((prev) => {
        const next = prev + (interval / DURATION) * 100;
        if (next >= 100) {
          goNext();
          return 0;
        }
        return next;
      });
    }, interval);

    return () => clearInterval(timerRef.current);
  }, [currentIndex, paused, goNext]);

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    setPaused(true);
  };

  const handleTouchEnd = (e) => {
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    setPaused(false);
    if (Math.abs(diff) > 60) {
      if (diff > 0) goNext();
      else goPrev();
    }
  };

  useEffect(() => {
    const handler = (e) => {
      if (e.key === "ArrowRight") goNext();
      else if (e.key === "ArrowLeft") goPrev();
      else if (e.key === "Escape") onClose();
      else if (e.key === " ") {
        e.preventDefault();
        setPaused((p) => !p);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [goNext, goPrev, onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-999 bg-black/95 backdrop-blur-xl flex items-center justify-center p-4"
      onClick={onClose}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <button
        onClick={onClose}
        className="absolute top-6 right-6 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-20"
      >
        <HiOutlineXMark className="text-2xl" />
      </button>

      <button
        onClick={(e) => {
          e.stopPropagation();
          setPaused((p) => !p);
        }}
        className="absolute top-6 right-20 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-20"
      >
        {paused ? (
          <HiOutlinePlay className="text-xl" />
        ) : (
          <HiOutlinePause className="text-xl" />
        )}
      </button>

      {currentIndex > 0 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            goPrev();
          }}
          className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors z-20"
        >
          <HiOutlineChevronLeft className="text-xl" />
        </button>
      )}
      {currentIndex < highlights.length - 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            goNext();
          }}
          className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors z-20"
        >
          <HiOutlineChevronRight className="text-xl" />
        </button>
      )}

      {/* Progress bars */}
      <div className="absolute top-4 left-6 right-20 flex gap-1.5 z-20">
        {highlights.map((_, idx) => (
          <div
            key={idx}
            className="flex-1 h-0.5 bg-white/20 rounded-full overflow-hidden"
          >
            <div
              className="h-full bg-white rounded-full transition-all ease-linear"
              style={{
                width:
                  idx < currentIndex
                    ? "100%"
                    : idx === currentIndex
                      ? `${progress}%`
                      : "0%",
                transitionDuration: idx === currentIndex ? "50ms" : "300ms",
              }}
            />
          </div>
        ))}
      </div>

      <motion.div
        key={currentIndex}
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="max-w-md w-full bg-[#111827]/80 rounded-[2.5rem] border border-white/10 overflow-hidden shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative aspect-9/16 bg-black">
          {highlight.image && (
            <img
              src={highlight.image}
              alt={highlight.title}
              className="w-full h-full object-cover"
            />
          )}
          <div className="absolute inset-x-0 top-0 p-8 pt-14 bg-linear-to-b from-black/80 via-black/40 to-transparent">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary text-sm font-bold shadow-lg shadow-primary/20">
                {highlight.author?.[0]?.toUpperCase()}
              </div>
              <div>
                <h3 className="text-white font-bold text-sm tracking-tight">
                  {highlight.author}
                </h3>
                <span className="text-white/50 text-[10px] uppercase tracking-widest font-semibold">
                  {highlight.highlightCategory} Highlight
                </span>
              </div>
            </div>
          </div>

          <div className="absolute inset-x-0 bottom-0 p-8 pb-12 bg-linear-to-t from-black/90 via-black/60 to-transparent">
            <h2 className="text-white text-xl font-bold mb-3 tracking-tight leading-tight">
              {highlight.title}
            </h2>
            <p className="text-white/70 text-sm leading-relaxed mb-6 line-clamp-4">
              {highlight.content}
            </p>

            <div className="flex items-center justify-center gap-2">
              <span className="text-white/40 text-xs font-medium">
                {currentIndex + 1} / {highlights.length}
              </span>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

const Highlights = ({ ownerId }) => {
  const [highlights, setHighlights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(-1);

  useEffect(() => {
    const fetchHighlights = async () => {
      try {
        const res = await storyService.getHighlights(ownerId);
        setHighlights(res.data.data);
      } catch (err) {
        console.error("Error fetching highlights:", err);
      } finally {
        setLoading(false);
      }
    };

    if (ownerId) fetchHighlights();
  }, [ownerId]);

  const openHighlight = (highlight) => {
    const idx = highlights.findIndex((h) => h._id === highlight._id);
    setCurrentIndex(idx >= 0 ? idx : 0);
  };

  if (loading)
    return (
      <div
        data-testid="loading-fallback"
        className="flex gap-4 overflow-hidden mb-8"
      >
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="w-20 h-24 bg-white/5 rounded-2xl animate-pulse"
          />
        ))}
      </div>
    );

  if (highlights.length === 0) return null;

  return (
    <div className="relative mb-10">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-white/40 text-[10px] uppercase tracking-[0.2em] font-bold flex items-center gap-2">
          <span className="w-4 h-px bg-white/10" />
          Business Highlights
        </h2>
      </div>

      <div className="no-sb flex items-center gap-6 overflow-x-auto pb-2 -mx-4 px-4 scroll-smooth">
        {highlights.map((h, idx) => (
          <HighlightCircle
            key={h._id}
            highlight={h}
            onClick={openHighlight}
            isActive={idx === currentIndex}
          />
        ))}
      </div>

      <AnimatePresence>
        {currentIndex >= 0 && (
          <StoryModal
            highlights={highlights}
            currentIndex={currentIndex}
            onClose={() => setCurrentIndex(-1)}
            onNavigate={setCurrentIndex}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Highlights;
