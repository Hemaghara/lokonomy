import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { storyService } from "../services";
import { useLocation } from "../context/LocationContext";
import { toast } from "react-hot-toast";
import {
  HiOutlineArrowLeft,
  HiOutlineMapPin,
  HiOutlineClock,
  HiOutlineShare,
  HiOutlineNewspaper,
  HiOutlineFire,
  HiOutlineTag,
  HiOutlineRocketLaunch,
  HiOutlineCalendarDays,
  HiOutlineMegaphone,
  HiOutlineLightBulb,
  HiOutlineSparkles,
  HiOutlineUser,
  HiOutlineChatBubbleLeftRight,
  HiOutlineCheckCircle,
} from "react-icons/hi2";

const StoryDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { district } = useLocation();
  const [story, setStory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const getIconForType = (type) => {
    switch (type) {
      case "News / Updates":
        return <HiOutlineNewspaper className="text-sky-400" />;
      case "Trending Offer":
        return <HiOutlineFire className="text-orange-400" />;
      case "Sale / Offer":
        return <HiOutlineTag className="text-emerald-400" />;
      case "Product Promotion":
        return <HiOutlineRocketLaunch className="text-violet-400" />;
      case "Events / Campaigns":
        return <HiOutlineCalendarDays className="text-pink-400" />;
      case "Announcement":
        return <HiOutlineMegaphone className="text-amber-400" />;
      case "Tips / Info":
        return <HiOutlineLightBulb className="text-yellow-400" />;
      default:
        return <HiOutlineSparkles className="text-slate-400" />;
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case "News / Updates":
        return "bg-sky-500/10     text-sky-400     border-sky-500/20";
      case "Trending Offer":
        return "bg-orange-500/10  text-orange-400  border-orange-500/20";
      case "Sale / Offer":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "Product Promotion":
        return "bg-violet-500/10  text-violet-400  border-violet-500/20";
      case "Events / Campaigns":
        return "bg-pink-500/10    text-pink-400    border-pink-500/20";
      case "Announcement":
        return "bg-amber-500/10   text-amber-400   border-amber-500/20";
      case "Tips / Info":
        return "bg-yellow-500/10  text-yellow-400  border-yellow-500/20";
      default:
        return "bg-slate-500/10   text-slate-400   border-slate-500/20";
    }
  };

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
        <div className="text-5xl mb-4 opacity-20">📡</div>
        <h2 className="text-white font-semibold text-lg mb-2">
          Story Not Found
        </h2>
        <p className="text-slate-500 text-sm mb-6">
          This story may have been removed.
        </p>
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold px-5 py-2.5 rounded-xl transition-all"
        >
          <HiOutlineArrowLeft /> Go Back
        </button>
      </div>
    );
  }

  const card = "bg-[#111827] border border-[#1f2a3d] rounded-2xl";

  return (
    <div className="min-h-screen bg-[#080e1a] pt-24 pb-20">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&display=swap');
        .sd * { font-family: 'DM Sans', sans-serif; }
      `}</style>

      <div className="sd max-w-5xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="flex items-center justify-between mb-6"
        >
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-slate-500 hover:text-slate-300 text-xs font-medium transition-colors"
          >
            <HiOutlineArrowLeft className="text-sm" /> Back to Stories
          </button>

          <button
            onClick={handleShare}
            className={`flex items-center gap-1.5 text-xs font-medium px-3.5 py-2 rounded-xl border transition-all
              ${
                copied
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                  : "bg-[#111827] text-slate-500 border-[#1f2a3d] hover:text-slate-300"
              }`}
          >
            {copied ? (
              <>
                <HiOutlineCheckCircle className="text-sm" /> Copied!
              </>
            ) : (
              <>
                <HiOutlineShare className="text-sm" /> Share
              </>
            )}
          </button>
        </motion.div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.35 }}
            className="lg:col-span-4 space-y-3"
          >
            {story.image ? (
              <div
                className={`relative overflow-hidden ${card} aspect-3/4 group`}
              >
                <img
                  src={story.image}
                  alt=""
                  className="w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
                />
                <div className="absolute inset-0 bg-linear-to-t from-[#080e1a]/70 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4">
                  <span
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold backdrop-blur-sm ${getTypeColor(story.type)}`}
                  >
                    <span className="text-sm">
                      {getIconForType(story.type)}
                    </span>
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

            <div className="grid grid-cols-2 gap-3">
              <div
                className={`${card} p-4 group hover:border-rose-500/30 hover:bg-[#131d2e] transition-all duration-300 relative overflow-hidden cursor-default`}
              >
                <div className="absolute bottom-0 left-0 h-0.5 w-0 bg-rose-400 group-hover:w-full transition-all duration-500 rounded-full" />
                <div className="w-8 h-8 bg-rose-500/10 border border-rose-500/20 rounded-lg flex items-center justify-center mb-2.5 group-hover:scale-110 group-hover:bg-rose-500/20 transition-all duration-300">
                  <HiOutlineMapPin className="text-rose-400 text-sm" />
                </div>
                <p className="text-[10px] text-slate-600 group-hover:text-rose-500/60 font-semibold uppercase tracking-widest mb-1 transition-colors duration-300">
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
                <div className="w-8 h-8 bg-violet-500/10 border border-violet-500/20 rounded-lg flex items-center justify-center mb-2.5 group-hover:scale-110 group-hover:bg-violet-500/20 transition-all duration-300">
                  <HiOutlineCalendarDays className="text-violet-400 text-sm" />
                </div>
                <p className="text-[10px] text-slate-600 group-hover:text-violet-500/60 font-semibold uppercase tracking-widest mb-1 transition-colors duration-300">
                  Published
                </p>
                <p className="text-slate-200 font-semibold text-xs leading-snug group-hover:text-white transition-colors duration-300">
                  {new Date(story.createdAt).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
                <p className="text-slate-600 text-[10px] mt-0.5 flex items-center gap-1">
                  <HiOutlineClock className="text-xs" />
                  {new Date(story.createdAt).toLocaleTimeString("en-GB", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>

            <div
              className={`${card} p-4 group hover:border-violet-500/30 hover:bg-[#131d2e] transition-all duration-300 relative overflow-hidden cursor-default`}
            >
              <div className="absolute bottom-0 left-0 h-0.5 w-0 bg-violet-400 group-hover:w-full transition-all duration-500 rounded-full" />
              <p className="text-[10px] text-slate-600 font-semibold uppercase tracking-widest mb-3">
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
                  <p className="text-slate-600 text-[10px] flex items-center gap-1 mt-0.5">
                    <HiOutlineUser className="text-xs" /> Community Reporter
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

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

              <div className="flex items-center gap-1.5 mb-5">
                <div className="h-0.5 w-10 bg-violet-500 rounded-full" />
                <div className="h-0.5 w-4  bg-violet-500/30 rounded-full" />
                <div className="h-0.5 w-2  bg-violet-500/10 rounded-full" />
              </div>
            </div>

            <div className={`${card} p-6 relative overflow-hidden`}>
              <div className="absolute left-0 top-6 bottom-6 w-0.5 bg-linear-to-b from-violet-500/60 via-violet-500/20 to-transparent rounded-full" />
              <p className="text-slate-400 text-sm md:text-base leading-[1.9] whitespace-pre-wrap pl-5">
                {story.content}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 pt-1">
              <button
                onClick={handleShare}
                className={`flex-1 flex items-center justify-center gap-2 text-xs font-semibold py-3.5 rounded-xl transition-all
                  ${
                    copied
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      : "bg-violet-600 hover:bg-violet-500 active:scale-[.98] text-white shadow-lg shadow-violet-900/30"
                  }`}
              >
                {copied ? (
                  <>
                    <HiOutlineCheckCircle className="text-sm" /> Link Copied!
                  </>
                ) : (
                  <>
                    <HiOutlineShare className="text-sm" /> Share Story
                  </>
                )}
              </button>
              <button className="flex-1 flex items-center justify-center gap-2 bg-[#111827] hover:bg-[#131d2e] border border-[#1f2a3d] hover:border-violet-500/30 hover:text-violet-400 text-slate-400 text-xs font-semibold py-3.5 rounded-xl transition-all">
                <HiOutlineChatBubbleLeftRight className="text-sm" /> Contact
                Reporter
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default StoryDetails;
