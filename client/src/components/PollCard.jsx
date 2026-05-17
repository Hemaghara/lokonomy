import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { storyService } from "../services";
import { useUser } from "../context/UserContext";
import { toast } from "react-hot-toast";

const PollCard = ({ storyId, poll, compact = false }) => {
  const { user } = useUser();
  const [pollData, setPollData] = useState(poll);
  const [voted, setVoted] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(-1);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (poll) setPollData(poll);
  }, [poll]);

  useEffect(() => {
    if (!pollData?.options || !user) return;
    for (let i = 0; i < pollData.options.length; i++) {
      if (pollData.options[i].votes?.includes(user.id)) {
        setVoted(true);
        setSelectedIdx(i);
        break;
      }
    }
  }, [pollData, user]);

  if (!pollData || !pollData.question) return null;

  const totalVotes = pollData.options.reduce((sum, o) => sum + (o.votes?.length || 0), 0);
  const isExpired = pollData.endsAt && new Date(pollData.endsAt) < new Date();
  const showResults = voted || isExpired;

  const handleVote = async (optionIndex) => {
    if (!user) {
      toast.error("Please login to vote");
      return;
    }
    if (voted || isExpired || submitting) return;

    setSubmitting(true);
    try {
      const res = await storyService.votePoll(storyId, { optionIndex });
      if (res.data.success) {
        setPollData(res.data.data);
        setVoted(true);
        setSelectedIdx(optionIndex);
        toast.success("Vote recorded!");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to vote");
    } finally {
      setSubmitting(false);
    }
  };

  const getTimeLeft = () => {
    if (!pollData.endsAt) return null;
    const diff = new Date(pollData.endsAt).getTime() - Date.now();
    if (diff <= 0) return "Ended";
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours > 24) return `${Math.floor(hours / 24)}d left`;
    if (hours > 0) return `${hours}h left`;
    const mins = Math.floor(diff / (1000 * 60));
    return `${mins}m left`;
  };

  return (
    <div className={`bg-[#111827] border border-[#1f2a3d] rounded-2xl overflow-hidden ${compact ? "p-3" : "p-5"}`}>
      <div className="flex items-start gap-2 mb-3">
        <span className="text-lg">📊</span>
        <h4 className={`text-white font-semibold ${compact ? "text-xs" : "text-sm"} leading-snug`}>
          {pollData.question}
        </h4>
      </div>

      <div className="space-y-2">
        {pollData.options.map((option, idx) => {
          const voteCount = option.votes?.length || 0;
          const pct = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;
          const isSelected = idx === selectedIdx;

          return (
            <motion.button
              key={idx}
              onClick={() => handleVote(idx)}
              disabled={showResults || submitting}
              whileTap={!showResults ? { scale: 0.98 } : {}}
              className={`relative w-full text-left rounded-xl border transition-all duration-300 overflow-hidden
                ${compact ? "px-3 py-2" : "px-4 py-3"}
                ${showResults
                  ? isSelected
                    ? "border-violet-500/40 bg-violet-500/5"
                    : "border-[#1f2a3d] bg-[#0d1424]"
                  : "border-[#1f2a3d] bg-[#0d1424] hover:border-violet-500/30 hover:bg-violet-500/5 cursor-pointer"
                }`}
            >
              {showResults && (
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  className={`absolute inset-y-0 left-0 rounded-xl ${
                    isSelected ? "bg-violet-500/15" : "bg-white/3"
                  }`}
                />
              )}
              <div className="relative flex items-center justify-between gap-2">
                <span className={`${compact ? "text-[11px]" : "text-xs"} font-medium ${
                  isSelected ? "text-violet-300" : "text-slate-300"
                }`}>
                  {isSelected && "✓ "}{option.text}
                </span>
                {showResults && (
                  <span className={`${compact ? "text-[10px]" : "text-xs"} font-bold shrink-0 ${
                    isSelected ? "text-violet-400" : "text-slate-500"
                  }`}>
                    {pct}%
                  </span>
                )}
              </div>
            </motion.button>
          );
        })}
      </div>

      <div className={`flex items-center gap-2 ${compact ? "mt-2" : "mt-3"} ${compact ? "text-[9px]" : "text-[10px]"} text-slate-500 font-medium`}>
        <span>{totalVotes} vote{totalVotes !== 1 ? "s" : ""}</span>
        {getTimeLeft() && (
          <>
            <span className="w-1 h-1 bg-slate-700 rounded-full" />
            <span className={isExpired ? "text-red-400" : ""}>{getTimeLeft()}</span>
          </>
        )}
      </div>
    </div>
  );
};

export default PollCard;
