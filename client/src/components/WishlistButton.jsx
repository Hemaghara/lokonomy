import { useState, useEffect } from "react";
import { HiHeart, HiOutlineHeart } from "react-icons/hi2";
import { motion, AnimatePresence } from "framer-motion";
import { wishlistService } from "../services";
import { useUser } from "../context/UserContext";
import { toast } from "react-hot-toast";

const WishlistButton = ({ type, id, className = "", onToggle }) => {
  const { user } = useUser();
  const [isSaved, setIsSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user && id) {
      checkStatus();
    }
  }, [user, id]);

  const checkStatus = async () => {
    try {
      const { isSaved } = await wishlistService.checkWishlistStatus(type, id);
      setIsSaved(isSaved);
    } catch (err) {
      console.error("Error checking wishlist status:", err);
    }
  };

  const toggleWishlist = async (e) => {
    e.stopPropagation();
    if (!user) {
      toast.error("Please login to save items");
      return;
    }

    setLoading(true);
    try {
      const response = await wishlistService.toggleWishlist(type, id);
      setIsSaved(response.isSaved);
      toast.success(response.message);
      if (onToggle) onToggle(response.isSaved);
    } catch (err) {
      toast.error("Failed to update wishlist");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={toggleWishlist}
      disabled={loading}
      className={`p-2 rounded-xl transition-all duration-300 ${
        isSaved
          ? "bg-rose-500/10 text-rose-500 border border-rose-500/20 shadow-lg shadow-rose-500/10"
          : "bg-[#0d1424]/80 text-slate-400 border border-[#1f2a3d] backdrop-blur-md hover:text-rose-400"
      } ${className}`}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={isSaved ? "saved" : "unsaved"}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {isSaved ? <HiHeart className="text-xl" /> : <HiOutlineHeart className="text-xl" />}
        </motion.div>
      </AnimatePresence>
    </motion.button>
  );
};

export default WishlistButton;
