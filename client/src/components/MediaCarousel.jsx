import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HiOutlineChevronLeft, HiOutlineChevronRight, HiOutlineXMark } from "react-icons/hi2";

const MediaCarousel = ({ media = [], image, className = "" }) => {
  const items = media.length > 0
    ? media
    : image
      ? [{ url: image, type: "image" }]
      : [];

  const [current, setCurrent] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const touchStart = useRef(0);

  if (items.length === 0) return null;

  const goTo = (idx) => {
    if (idx >= 0 && idx < items.length) setCurrent(idx);
  };

  const handleTouchStart = (e) => {
    touchStart.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    const diff = touchStart.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) goTo(current + 1);
      else goTo(current - 1);
    }
  };

  const currentItem = items[current];

  return (
    <>
      <div
        className={`relative overflow-hidden bg-[#0d1424] ${className}`}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="w-full h-full cursor-pointer"
            onClick={() => setLightbox(true)}
          >
            {currentItem.type === "video" ? (
              <video
                src={currentItem.url}
                poster={currentItem.thumbnail}
                controls
                className="w-full h-full object-cover"
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <img
                src={currentItem.url}
                alt=""
                className="w-full h-full object-cover"
              />
            )}
          </motion.div>
        </AnimatePresence>

        {items.length > 1 && (
          <>
            {current > 0 && (
              <button
                onClick={(e) => { e.stopPropagation(); goTo(current - 1); }}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm text-white flex items-center justify-center hover:bg-black/70 transition-colors"
              >
                <HiOutlineChevronLeft className="text-sm" />
              </button>
            )}
            {current < items.length - 1 && (
              <button
                onClick={(e) => { e.stopPropagation(); goTo(current + 1); }}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm text-white flex items-center justify-center hover:bg-black/70 transition-colors"
              >
                <HiOutlineChevronRight className="text-sm" />
              </button>
            )}
          </>
        )}

        {items.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {items.map((_, idx) => (
              <button
                key={idx}
                onClick={(e) => { e.stopPropagation(); goTo(idx); }}
                className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                  idx === current
                    ? "bg-white w-4"
                    : "bg-white/40 hover:bg-white/60"
                }`}
              />
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {lightbox && currentItem.type !== "video" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-999 bg-black/95 backdrop-blur-xl flex items-center justify-center p-4"
            onClick={() => setLightbox(false)}
          >
            <button
              onClick={() => setLightbox(false)}
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors z-10"
            >
              <HiOutlineXMark className="text-xl" />
            </button>
            <img
              src={currentItem.url}
              alt=""
              className="max-w-full max-h-full object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default MediaCarousel;
