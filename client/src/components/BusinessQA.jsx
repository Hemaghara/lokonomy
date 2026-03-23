import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useUser } from "../context/UserContext";
import { qaService } from "../services";
import { toast } from "react-hot-toast";
import {
  HiOutlineQuestionMarkCircle,
  HiOutlineChatBubbleLeftRight,
  HiOutlineChevronDown,
  HiOutlineChevronUp,
  HiOutlineTrash,
  HiOutlineArrowUp,
  HiOutlinePaperAirplane,
  HiOutlineUser,
  HiOutlineCalendarDays,
  HiOutlineLockClosed,
} from "react-icons/hi2";
import { HiShieldCheck } from "react-icons/hi2";
import { useNavigate } from "react-router-dom";

const card = "bg-[#111827] border border-[#1f2a3d] rounded-2xl";
const inputCls =
  "w-full bg-[#0d1424] border border-[#1f2a3d] rounded-xl px-4 py-3 text-sm text-slate-200 outline-none transition-all focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 placeholder:text-slate-600";

function timeAgo(date) {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(date).toLocaleDateString();
}

const BusinessQA = ({ businessId, isOwner }) => {
  const { user } = useUser();
  const navigate = useNavigate();

  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [questionText, setQuestionText] = useState("");
  const [submittingQ, setSubmittingQ] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [answerTexts, setAnswerTexts] = useState({});
  const [submittingA, setSubmittingA] = useState({});
  const [deletingId, setDeletingId] = useState(null);
  const [upvotingId, setUpvotingId] = useState(null);

  useEffect(() => {
    fetchQuestions();
  }, [businessId]);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const res = await qaService.getQuestions(businessId);
      setQuestions(res.data);
    } catch {
      toast.error("Failed to load questions");
    } finally {
      setLoading(false);
    }
  };

  const handlePostQuestion = async (e) => {
    e.preventDefault();
    if (!questionText.trim()) return;
    setSubmittingQ(true);
    try {
      await qaService.postQuestion(businessId, questionText.trim());
      setQuestionText("");
      toast.success("Question posted!");
      fetchQuestions();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to post question");
    } finally {
      setSubmittingQ(false);
    }
  };

  const handlePostAnswer = async (questionId) => {
    const text = answerTexts[questionId]?.trim();
    if (!text) return;
    setSubmittingA((s) => ({ ...s, [questionId]: true }));
    try {
      await qaService.postAnswer(businessId, questionId, text);
      setAnswerTexts((a) => ({ ...a, [questionId]: "" }));
      toast.success("Answer posted!");
      fetchQuestions();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to post answer");
    } finally {
      setSubmittingA((s) => ({ ...s, [questionId]: false }));
    }
  };

  const handleDelete = async (questionId) => {
    setDeletingId(questionId);
    try {
      await qaService.deleteQuestion(questionId);
      toast.success("Question removed");
      setQuestions((q) => q.filter((item) => item._id !== questionId));
    } catch {
      toast.error("Failed to delete question");
    } finally {
      setDeletingId(null);
    }
  };

  const handleUpvote = async (questionId) => {
    if (!user) return toast.error("Please login to upvote");
    setUpvotingId(questionId);
    try {
      const res = await qaService.upvoteQuestion(questionId);
      setQuestions((prev) =>
        prev.map((q) =>
          q._id === questionId
            ? {
                ...q,
                upvotes: res.data.upvoted
                  ? [...q.upvotes, user.id]
                  : q.upvotes.filter((id) => id !== user.id),
              }
            : q,
        ),
      );
    } catch {
      toast.error("Failed to upvote");
    } finally {
      setUpvotingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className={card + " p-5"}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="flex items-center gap-2 text-slate-200 font-semibold text-sm">
              <HiOutlineQuestionMarkCircle className="text-violet-400 text-base" />
              Community Q&amp;A
            </h3>
            <p className="text-slate-600 text-xs mt-1">
              {questions.length} question{questions.length !== 1 ? "s" : ""} ·
              ask the community or the business owner
            </p>
          </div>
          {isOwner &&
            questions.filter((q) => q.answers.length === 0).length > 0 && (
              <span className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl text-[11px] font-semibold">
                <HiOutlineQuestionMarkCircle className="text-sm" />
                {questions.filter((q) => q.answers.length === 0).length}{" "}
                unanswered
              </span>
            )}
        </div>
      </div>

      <div className={card + " p-5"}>
        <h4 className="flex items-center gap-2 text-slate-300 font-semibold text-xs uppercase tracking-widest mb-4">
          <HiOutlinePaperAirplane className="text-violet-400" />
          Ask a Question
        </h4>
        {!user ? (
          <div className="flex flex-col items-center gap-3 py-4">
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
              <HiOutlineLockClosed className="text-violet-400 text-lg" />
            </div>
            <p className="text-slate-500 text-xs text-center">
              Login to ask a question about this business
            </p>
            <button
              onClick={() => navigate("/login")}
              className="px-5 py-2 bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold rounded-xl transition-all"
            >
              Login to Ask
            </button>
          </div>
        ) : isOwner ? (
          <div className="py-4 text-center bg-amber-500/5 border border-amber-500/10 rounded-xl">
            <p className="text-amber-400/80 text-[11px] font-medium px-4">
              As the business owner, you can answer questions but cannot post
              them yourself.
            </p>
          </div>
        ) : (
          <form onSubmit={handlePostQuestion} className="flex gap-3">
            <input
              type="text"
              className={inputCls + " flex-1"}
              placeholder="e.g. What are your working hours on Sunday?"
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              maxLength={300}
              required
            />
            <button
              type="submit"
              disabled={submittingQ || !questionText.trim()}
              className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold px-5 py-3 rounded-xl transition-all shrink-0 shadow-lg shadow-violet-900/30"
            >
              {submittingQ ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <HiOutlinePaperAirplane className="text-sm" />
              )}
              Post
            </button>
          </form>
        )}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-8 h-8 border-2 border-violet-500/20 border-t-violet-500 rounded-full animate-spin" />
          <p className="text-slate-600 text-xs uppercase tracking-widest">
            Loading…
          </p>
        </div>
      ) : questions.length === 0 ? (
        <div className="border-2 border-dashed border-[#1f2a3d] rounded-2xl py-24 text-center">
          <p className="text-slate-500 font-semibold text-sm">
            No questions yet — be the first to ask!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {questions.map((q, i) => {
            const isExpanded = expandedId === q._id;
            const hasUpvoted = user && q.upvotes.includes(user.id);
            const canDelete = user && (user.id === q.askedBy || isOwner);

            return (
              <motion.div
                key={q._id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className={card + " overflow-hidden"}
              >
                <div
                  className="p-5 cursor-pointer hover:bg-white/2 transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : q._id)}
                >
                  <div className="flex items-start gap-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUpvote(q._id);
                      }}
                      disabled={upvotingId === q._id}
                      className={`flex flex-col items-center gap-0.5 px-2.5 py-2 rounded-xl border transition-all shrink-0 min-w-11 ${
                        hasUpvoted
                          ? "bg-violet-600/20 border-violet-500/40 text-violet-400"
                          : "bg-[#0d1424] border-[#1f2a3d] text-slate-600 hover:text-violet-400 hover:border-violet-500/30"
                      }`}
                    >
                      <HiOutlineArrowUp className="text-sm" />
                      <span className="text-[10px] font-bold">
                        {q.upvotes.length}
                      </span>
                    </button>

                    <div className="flex-1 min-w-0">
                      <p className="text-slate-200 text-sm font-medium leading-relaxed">
                        {q.question}
                      </p>
                      <div className="flex items-center flex-wrap gap-3 mt-2">
                        <span className="flex items-center gap-1 text-[10px] text-slate-600">
                          <HiOutlineUser className="text-xs" />
                          {q.askedByName}
                        </span>
                        <span className="flex items-center gap-1 text-[10px] text-slate-600">
                          <HiOutlineCalendarDays className="text-xs" />
                          {timeAgo(q.createdAt)}
                        </span>
                        {q.answers.length > 0 ? (
                          <span className="flex items-center gap-1 px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg text-[10px] font-semibold">
                            <HiOutlineChatBubbleLeftRight className="text-xs" />
                            {q.answers.length} answer
                            {q.answers.length !== 1 ? "s" : ""}
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-lg text-[10px] font-semibold">
                            Unanswered
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {canDelete && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(q._id);
                          }}
                          disabled={deletingId === q._id}
                          className="p-1.5 rounded-lg text-slate-700 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                        >
                          {deletingId === q._id ? (
                            <span className="w-3.5 h-3.5 border border-rose-400/30 border-t-rose-400 rounded-full animate-spin inline-block" />
                          ) : (
                            <HiOutlineTrash className="text-sm" />
                          )}
                        </button>
                      )}
                      <span className="text-slate-600">
                        {isExpanded ? (
                          <HiOutlineChevronUp className="text-base" />
                        ) : (
                          <HiOutlineChevronDown className="text-base" />
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <div className="border-t border-[#1f2a3d] px-5 pt-4 pb-5 space-y-4 bg-[#0a0f1c]/40">
                        {q.answers.length > 0 && (
                          <div className="space-y-3">
                            {q.answers.map((ans, j) => (
                              <motion.div
                                key={j}
                                initial={{ opacity: 0, x: -6 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: j * 0.05 }}
                                className={`flex gap-3 p-4 rounded-xl border transition-all ${
                                  ans.isOwner
                                    ? "bg-violet-600/5 border-violet-500/20"
                                    : "bg-[#0d1424] border-[#1f2a3d]"
                                }`}
                              >
                                <div
                                  className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                                    ans.isOwner
                                      ? "bg-violet-500/20 border border-violet-500/30 text-violet-400"
                                      : "bg-slate-800 border border-[#1f2a3d] text-slate-500"
                                  }`}
                                >
                                  {ans.answeredByName?.[0]?.toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                    <span
                                      className={`text-[11px] font-semibold ${
                                        ans.isOwner
                                          ? "text-violet-300"
                                          : "text-slate-300"
                                      }`}
                                    >
                                      {ans.answeredByName}
                                    </span>
                                    {ans.isOwner && (
                                      <span className="flex items-center gap-1 px-2 py-0.5 bg-violet-600/20 border border-violet-500/30 text-violet-400 rounded-lg text-[10px] font-bold">
                                        <HiShieldCheck className="text-xs" />
                                        Owner
                                      </span>
                                    )}
                                    <span className="text-[10px] text-slate-700">
                                      {timeAgo(ans.createdAt)}
                                    </span>
                                  </div>
                                  <p className="text-slate-400 text-sm leading-relaxed">
                                    {ans.answer}
                                  </p>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        )}

                        {user && (
                          <div className="flex gap-3">
                            <div className="w-8 h-8 rounded-xl bg-slate-800 border border-[#1f2a3d] flex items-center justify-center font-bold text-xs text-slate-500 shrink-0">
                              {user.name?.[0]?.toUpperCase()}
                            </div>
                            <div className="flex-1 flex gap-2">
                              <input
                                type="text"
                                className={inputCls + " flex-1 text-xs py-2.5"}
                                placeholder={
                                  isOwner
                                    ? "Reply as owner…"
                                    : "Write an answer…"
                                }
                                value={answerTexts[q._id] || ""}
                                onChange={(e) =>
                                  setAnswerTexts((a) => ({
                                    ...a,
                                    [q._id]: e.target.value,
                                  }))
                                }
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault();
                                    handlePostAnswer(q._id);
                                  }
                                }}
                                maxLength={500}
                              />
                              <button
                                onClick={() => handlePostAnswer(q._id)}
                                disabled={
                                  submittingA[q._id] ||
                                  !answerTexts[q._id]?.trim()
                                }
                                className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-[11px] font-bold px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-violet-900/30 shrink-0"
                              >
                                {submittingA[q._id] ? (
                                  <span className="w-3.5 h-3.5 border border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                  <HiOutlinePaperAirplane className="text-sm" />
                                )}
                                {isOwner ? "Reply" : "Answer"}
                              </button>
                            </div>
                          </div>
                        )}

                        {!user && (
                          <p className="text-center text-slate-600 text-xs py-2">
                            <button
                              onClick={() => navigate("/login")}
                              className="text-violet-400 hover:underline font-semibold"
                            >
                              Login
                            </button>{" "}
                            to post an answer
                          </p>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default BusinessQA;
