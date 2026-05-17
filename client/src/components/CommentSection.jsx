import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { storyService } from "../services";
import { useUser } from "../context/UserContext";
import { formatTimeAgo } from "../utils/storyHelpers";
import { HiOutlineTrash, HiOutlinePaperAirplane } from "react-icons/hi2";
import { toast } from "react-hot-toast";
import { getSocket } from "../services/socket";

const CommentSection = ({
  storyId,
  comments: initialComments = [],
  storyAuthorId,
}) => {
  const { user } = useUser();
  const [comments, setComments] = useState(initialComments);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    setComments(initialComments);
  }, [initialComments]);

  useEffect(() => {
    const socket = getSocket();
    const handler = ({ storyId: sid, comment }) => {
      if (sid === storyId && comment) {
        setComments((prev) => {
          if (prev.find((c) => c._id === comment._id)) return prev;
          return [...prev, comment];
        });
      }
    };
    socket.on("story_comment", handler);
    return () => socket.off("story_comment", handler);
  }, [storyId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim() || submitting) return;
    if (!user) {
      toast.error("Please login to comment");
      return;
    }
    setSubmitting(true);
    try {
      const res = await storyService.addComment(storyId, { text: text.trim() });
      if (res.data.success) {
        const newComment = res.data.data;
        setComments((prev) => {
          if (prev.find((c) => c._id === newComment._id)) return prev;
          return [...prev, newComment];
        });
        setText("");
        setTimeout(() => {
          scrollRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add comment");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (commentId) => {
    try {
      await storyService.deleteComment(storyId, commentId);
      setComments((prev) => prev.filter((c) => c._id !== commentId));
      toast.success("Comment deleted");
    } catch (err) {
      console.log(err);
      toast.error("Failed to delete comment");
    }
  };

  return (
    <div className="bg-[#111827] border border-[#1f2a3d] rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-[#1f2a3d]">
        <h3 className="text-white font-semibold text-sm flex items-center gap-2">
          💬 Discussion
          <span className="bg-violet-500/10 text-violet-400 border border-violet-500/20 px-2 py-0.5 rounded-lg text-[10px] font-bold">
            {comments.length}
          </span>
        </h3>
      </div>

      <div className="max-h-80 overflow-y-auto px-5 py-3 space-y-3">
        {comments.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-slate-600 text-xs">
              No comments yet. Start the conversation!
            </p>
          </div>
        ) : (
          comments.map((comment, idx) => (
            <motion.div
              key={comment._id || idx}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.15 }}
              className="flex gap-3 group"
            >
              <div className="w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 font-bold text-xs shrink-0 mt-0.5">
                {comment.userName?.[0]?.toUpperCase() || "?"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-slate-200 text-xs font-semibold">
                    {comment.userName}
                  </span>
                  <span className="text-slate-600 text-[10px]">
                    {formatTimeAgo(comment.createdAt)}
                  </span>
                  {(comment.user === user?.id ||
                    storyAuthorId === user?.id) && (
                    <button
                      onClick={() => handleDelete(comment._id)}
                      className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-rose-400 transition-all ml-auto"
                      title="Delete comment"
                    >
                      <HiOutlineTrash className="text-xs" />
                    </button>
                  )}
                </div>
                <p className="text-slate-400 text-xs leading-relaxed">
                  {comment.text}
                </p>
              </div>
            </motion.div>
          ))
        )}
        <div ref={scrollRef} />
      </div>

      {user && (
        <form
          onSubmit={handleSubmit}
          className="px-5 py-3 border-t border-[#1f2a3d] flex gap-2"
        >
          <div className="flex-1 relative">
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              maxLength={500}
              placeholder="Add a comment..."
              className="w-full bg-[#0d1424] border border-[#1f2a3d] rounded-xl px-4 py-2.5 text-xs text-slate-200 outline-none transition-all focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 placeholder:text-slate-600 pr-12"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-600 font-mono">
              {text.length}/500
            </span>
          </div>
          <button
            type="submit"
            disabled={!text.trim() || submitting}
            className="w-10 h-10 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-30 disabled:cursor-not-allowed text-white flex items-center justify-center transition-all active:scale-95 shrink-0"
          >
            <HiOutlinePaperAirplane
              className={`text-sm ${submitting ? "animate-pulse" : ""}`}
            />
          </button>
        </form>
      )}
    </div>
  );
};

export default CommentSection;
