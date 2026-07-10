import { useState, useEffect, useRef } from "react";
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from "framer-motion";
import { leaderboardService, influencerService } from "../services";
import { useUser } from "../context/UserContext";
import toast from "react-hot-toast";
import {
  Trophy,
  Star,
  Award,
  Share2,
  Filter,
  Calendar,
  ChevronDown,
  ChevronUp,
  Loader2,
  TrendingUp,
  MapPin,
  Sparkles,
  RefreshCw,
  Crown,
  MessageSquare,
  Eye,
  ShoppingCart,
  Check,
} from "lucide-react";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const CATEGORIES = [
  "Retail", "Food & Beverage", "Grocery", "Electronics", "Fashion",
  "Services", "Automotive", "Healthcare", "Education", "Other"
];

const DISTRICTS = [
  "North Goa", "South Goa", "Mumbai", "Pune", "Bangalore", "Delhi"
];

const Leaderboard = () => {
  const { user } = useUser();
  const [leaderboard, setLeaderboard] = useState([]);
  const [activeLeaderboardTab, setActiveLeaderboardTab] = useState("businesses");
  const [influencers, setInfluencers] = useState([]);
  const [filters, setFilters] = useState({
    district: "",
    category: "",
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
  });
  const [availableFilters, setAvailableFilters] = useState({
    districts: [],
    categories: [],
  });
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [expandedBizId, setExpandedBizId] = useState(null);
  
  // Cache for instant tab switching
  const cache = useRef({ businesses: {}, influencers: {} });

  const fetchLeaderboard = async (forceRefresh = false) => {
    const cacheKey = JSON.stringify(filters);

    if (!forceRefresh) {
      if (activeLeaderboardTab === "businesses" && cache.current.businesses[cacheKey]) {
        setLeaderboard(cache.current.businesses[cacheKey].data);
        setAvailableFilters(cache.current.businesses[cacheKey].filters);
        return;
      }
      if (activeLeaderboardTab === "influencers" && cache.current.influencers[cacheKey]) {
        setInfluencers(cache.current.influencers[cacheKey].data);
        return;
      }
    }

    setLoading(true);
    try {
      if (activeLeaderboardTab === "businesses") {
        const res = await leaderboardService.getLeaderboard(filters);
        if (res.data.success) {
          const lbData = res.data.leaderboard || [];
          const filterData = {
            districts: res.data.filters.districts.length > 0 ? res.data.filters.districts : DISTRICTS,
            categories: res.data.filters.categories.length > 0 ? res.data.filters.categories : CATEGORIES,
          };
          setLeaderboard(lbData);
          setAvailableFilters(filterData);
          cache.current.businesses[cacheKey] = { data: lbData, filters: filterData };
        } else {
          toast.error("Failed to load leaderboard data");
        }
      } else {
        const res = await influencerService.getLocalInfluencers({ district: filters.district });
        if (res.data.success) {
          const infData = res.data.influencers || [];
          setInfluencers(infData);
          cache.current.influencers[cacheKey] = { data: infData };
        } else {
          toast.error("Failed to load influencer data");
        }
      }
    } catch (err) {
      console.error(err);
      toast.error("Error connecting to standings service");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLeaderboard();
  }, [filters, activeLeaderboardTab]);

  const handleRecalculate = async () => {
    setCalculating(true);
    try {
      const res = await leaderboardService.calculateLeaderboard();
      if (res.data.success) {
        toast.success("Leaderboard recalculated successfully!");
        cache.current.businesses = {}; // Clear cache on recalculation
        fetchLeaderboard(true);
      } else {
        toast.error(res.data.message || "Failed to recalculate leaderboard");
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Error starting calculation");
    }
    setCalculating(false);
  };

  const handleShare = (entry) => {
    const businessName = entry.businessId?.businessName || entry.businessName || "A business";
    const rankStr = entry.rank === 1 ? "🏆 1st Place" : entry.rank === 2 ? "🥈 2nd Place" : entry.rank === 3 ? "🥉 3rd Place" : `#${entry.rank}`;
    const shareText = `Check out ${businessName}! They are ranked ${rankStr} in ${entry.category} for ${entry.district} this month on Lokonomy! 🚀🏆\n\nSupport local business at Lokonomy: ${window.location.origin}/business/${entry.businessId?._id || entry.businessId}`;
    
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareText);
      toast.success("Rank details copied to clipboard!");
    } else {
      toast.error("Clipboard copy not supported. Share manually!");
    }
  };

  const toggleExpand = (bizId) => {
    setExpandedBizId(expandedBizId === bizId ? null : bizId);
  };

  const podiumEntries = leaderboard.slice(0, 3);
  const reorderedPodium = [];
  if (podiumEntries[1]) reorderedPodium.push(podiumEntries[1]);
  if (podiumEntries[0]) reorderedPodium.push(podiumEntries[0]);
  if (podiumEntries[2]) reorderedPodium.push(podiumEntries[2]);

  // Remove the top 3 from the list below the podium to avoid redundancy
  const listEntries = leaderboard.slice(3);

  const isAdmin = user?.role === "superadmin" || user?.role === "admin";

  return (
    <div className="min-h-screen bg-[#07070b] pb-20 sm:pb-16 pt-20 sm:pt-24">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-b from-violet-600/12 via-transparent to-transparent pointer-events-none" />
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-125 h-125 bg-violet-600/8 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-8 pb-6">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <p className="text-violet-400/80 text-[10px] sm:text-xs uppercase tracking-[0.3em] font-bold mb-2">
              Performance Rankings
            </p>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
              Local <span className="text-transparent bg-clip-text bg-linear-to-r from-violet-400 via-fuchsia-400 to-violet-400">Leaderboard</span>
            </h1>
            <p className="text-white/40 text-xs sm:text-sm mt-3 max-w-lg mx-auto">
              Discover the top-performing local standings ranked by community metrics.
            </p>
            <div className="flex justify-center mt-6">
              <div className="flex bg-[#111118]/80 border border-white/8 rounded-xl p-1">
                <button
                  onClick={() => setActiveLeaderboardTab("businesses")}
                  className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${activeLeaderboardTab === "businesses" ? "bg-violet-600 text-white" : "text-white/40 hover:text-white"}`}
                >
                  🏆 Top Businesses
                </button>
                <button
                  onClick={() => setActiveLeaderboardTab("influencers")}
                  className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${activeLeaderboardTab === "influencers" ? "bg-violet-600 text-white" : "text-white/40 hover:text-white"}`}
                >
                  ✨ Local Influencers
                </button>
              </div>
            </div>
          </motion.div>

          {isAdmin && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-6 flex justify-center"
            >
              <button
                onClick={handleRecalculate}
                disabled={calculating}
                className="px-4 py-2 bg-violet-500/10 border border-violet-500/20 rounded-xl text-xs font-bold text-violet-400 hover:bg-violet-500/20 hover:text-white transition-all flex items-center gap-2"
              >
                {calculating ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Calculating...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-3.5 h-3.5" />
                    Recalculate Leaderboard
                  </>
                )}
              </button>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-8 bg-[#111118]/80 backdrop-blur-md p-4 rounded-2xl border border-white/8 max-w-4xl mx-auto"
          >
            <div className={`grid grid-cols-1 ${activeLeaderboardTab === "businesses" ? "sm:grid-cols-4" : "sm:grid-cols-1 max-w-xs mx-auto"} gap-3`}>
              {activeLeaderboardTab === "businesses" && (
                <div>
                  <label className="text-[10px] text-white/40 uppercase tracking-wider font-bold block mb-1">
                    Category
                  </label>
                  <div className="relative">
                    <select
                      value={filters.category}
                      onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                      className="w-full bg-[#161622] text-white text-xs rounded-xl border border-white/8 p-2.5 outline-hidden appearance-none cursor-pointer pr-8"
                    >
                      <option value="">All Categories</option>
                      {availableFilters.categories.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                    <Filter className="w-3.5 h-3.5 text-white/30 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
              )}

              <div>
                <label className="text-[10px] text-white/40 uppercase tracking-wider font-bold block mb-1">
                  District
                </label>
                <div className="relative">
                  <select
                    value={filters.district}
                    onChange={(e) => setFilters({ ...filters, district: e.target.value })}
                    className="w-full bg-[#161622] text-white text-xs rounded-xl border border-white/8 p-2.5 outline-hidden appearance-none cursor-pointer pr-8"
                  >
                    <option value="">All Districts</option>
                    {availableFilters.districts.map((dist) => (
                      <option key={dist} value={dist}>{dist}</option>
                    ))}
                  </select>
                  <MapPin className="w-3.5 h-3.5 text-white/30 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {activeLeaderboardTab === "businesses" && (
                <div>
                  <label className="text-[10px] text-white/40 uppercase tracking-wider font-bold block mb-1">
                    Month
                  </label>
                  <div className="relative">
                    <select
                      value={filters.month}
                      onChange={(e) => setFilters({ ...filters, month: parseInt(e.target.value) })}
                      className="w-full bg-[#161622] text-white text-xs rounded-xl border border-white/8 p-2.5 outline-hidden appearance-none cursor-pointer pr-8"
                    >
                      {MONTHS.map((m, idx) => (
                        <option key={m} value={idx + 1}>{m}</option>
                      ))}
                    </select>
                    <Calendar className="w-3.5 h-3.5 text-white/30 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
              )}

              {activeLeaderboardTab === "businesses" && (
                <div>
                  <label className="text-[10px] text-white/40 uppercase tracking-wider font-bold block mb-1">
                    Year
                  </label>
                  <div className="relative">
                    <select
                      value={filters.year}
                      onChange={(e) => setFilters({ ...filters, year: parseInt(e.target.value) })}
                      className="w-full bg-[#161622] text-white text-xs rounded-xl border border-white/8 p-2.5 outline-hidden appearance-none cursor-pointer pr-8"
                    >
                      <option value={new Date().getFullYear()}>{new Date().getFullYear()}</option>
                      <option value={new Date().getFullYear() - 1}>{new Date().getFullYear() - 1}</option>
                    </select>
                    <Calendar className="w-3.5 h-3.5 text-white/30 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center gap-4">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 border-3 border-violet-500/20 rounded-full" />
              <div className="absolute inset-0 border-3 border-transparent border-t-violet-500 rounded-full animate-spin" />
              <span className="absolute inset-0 flex items-center justify-center">
                <Trophy className="w-8 h-8 text-violet-500 animate-pulse" />
              </span>
            </div>
            <p className="text-white/40 text-sm font-medium">Fetching standings...</p>
          </div>
        ) : activeLeaderboardTab === "influencers" ? (
          <div className="mt-8 max-w-4xl mx-auto space-y-3">
            <div className="hidden sm:grid grid-cols-[60px_1fr_120px_120px_120px] gap-4 px-5 py-2.5 text-[10px] text-white/20 uppercase tracking-wider font-bold">
              <span>Rank</span>
              <span>Influencer</span>
              <span>Tier</span>
              <span>District</span>
              <span className="text-right">Stats</span>
            </div>

            <div className="space-y-2">
              {influencers.map((inf, idx) => (
                <motion.div
                  key={inf._id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.04 }}
                  className="bg-[#111118]/80 backdrop-blur-md rounded-xl border border-white/8 overflow-hidden hover:border-white/15 hover:bg-[#14141e]/90 transition-all duration-300"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-[60px_1fr_120px_120px_120px] items-center gap-3 sm:gap-4 px-4 sm:px-5 py-3.5">
                    <div className="flex items-center gap-2 sm:gap-0 font-mono text-sm sm:text-base font-black text-white/60">
                      #{idx + 1}
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-violet-600/10 border border-violet-500/20 flex items-center justify-center text-violet-400 font-bold text-sm shrink-0">
                        {inf.name?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <h4 className="text-white font-bold text-sm">
                          {inf.name}
                        </h4>
                        {inf.influencerSince && (
                          <p className="text-[9px] text-slate-500 font-medium">
                            Influencer since {new Date(inf.influencerSince).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>

                    <div>
                      <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider border
                        ${inf.influencerBadge === "ambassador" 
                          ? "bg-amber-500/10 text-amber-400 border-amber-500/20" 
                          : inf.influencerBadge === "influencer" 
                            ? "bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/20" 
                            : "bg-sky-500/10 text-sky-400 border-sky-500/20"}`}
                      >
                        ✨ {inf.influencerBadge.replace("_", " ")}
                      </span>
                    </div>

                    <div>
                      <span className="text-white/40 text-xs font-semibold">{inf.district || "Local"}</span>
                    </div>

                    <div className="flex items-center justify-end gap-3 text-right">
                      <div className="flex items-center gap-3">
                        <div className="text-center">
                          <span className="text-white font-black text-sm block">{inf.reviewCount || 0}</span>
                          <span className="text-[8px] text-white/30 uppercase font-bold">Reviews</span>
                        </div>
                        <div className="text-center">
                          <span className="text-white font-black text-sm block">{inf.helpfulVotes || 0}</span>
                          <span className="text-[8px] text-white/30 uppercase font-bold">Votes</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}

              {influencers.length === 0 && (
                <div className="bg-[#111118] border border-white/8 rounded-2xl py-16 text-center max-w-xl mx-auto mt-8">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/5 border border-white/8 flex items-center justify-center">
                    <Trophy className="w-8 h-8 text-white/20" />
                  </div>
                  <p className="text-white/60 text-base font-semibold">No standings found</p>
                  <p className="text-white/30 text-xs mt-2 max-w-xs mx-auto">
                    We couldn't find any influencer standings in this district. Write some helpful reviews to start the leaderboard!
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="bg-[#111118] border border-white/8 rounded-2xl py-16 text-center max-w-xl mx-auto mt-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/5 border border-white/8 flex items-center justify-center">
              <Trophy className="w-8 h-8 text-white/20" />
            </div>
            <p className="text-white/60 text-base font-semibold">No standings found</p>
            <p className="text-white/30 text-xs mt-2 max-w-xs mx-auto">
              We couldn't find any ranking records for this category or district in this period.
            </p>
            {isAdmin && (
              <button
                onClick={handleRecalculate}
                className="mt-6 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-bold transition-all"
              >
                Compute Standings Now
              </button>
            )}
          </div>
        ) : (
          <>
            {reorderedPodium.length > 0 && (
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-4 max-w-4xl mx-auto pt-6 pb-8">
                {reorderedPodium.map((entry, idx) => {
                  const isFirst = entry.rank === 1;
                  const isSecond = entry.rank === 2;

                  const cardStyles = isFirst
                    ? {
                        borderColor: "border-amber-500/35",
                        glowColor: "shadow-amber-500/10",
                        medalColor: "text-amber-400",
                        height: "h-80 sm:h-96",
                        order: "order-2",
                      }
                    : isSecond
                    ? {
                        borderColor: "border-slate-400/25",
                        glowColor: "shadow-slate-400/5",
                        medalColor: "text-slate-300",
                        height: "h-80 sm:h-96",
                        order: "order-1",
                      }
                    : {
                        borderColor: "border-amber-800/25",
                        glowColor: "shadow-amber-800/5",
                        medalColor: "text-amber-700",
                        height: "h-80 sm:h-96",
                        order: "order-3",
                      };

                  const bizName = entry.businessId?.businessName || entry.businessName;
                  const bizLogo = entry.businessId?.logo || "/placeholder-biz.png";

                  return (
                    <motion.div
                      key={entry._id}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: idx * 0.1 }}
                      className={`relative flex-1 w-full max-w-[260px] sm:max-w-none flex flex-col justify-end ${cardStyles.order}`}
                    >
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-4 z-10">
                        {isFirst ? (
                          <motion.div
                            animate={{ rotate: [0, -10, 10, -5, 5, 0] }}
                            transition={{ repeat: Infinity, duration: 6, repeatDelay: 2 }}
                          >
                            <Crown className="w-10 h-10 text-amber-400 filter drop-shadow-[0_4px_12px_rgba(245,158,11,0.5)]" />
                          </motion.div>
                        ) : (
                          <Award className={`w-8 h-8 ${cardStyles.medalColor} filter drop-shadow-[0_2px_8px_rgba(255,255,255,0.1)]`} />
                        )}
                      </div>

                      <div className={`relative bg-[#111118]/80 backdrop-blur-md rounded-2xl border ${cardStyles.borderColor} ${cardStyles.height} flex flex-col items-center justify-between p-5 text-center shadow-2xl ${cardStyles.glowColor} hover:scale-[1.03] transition-all duration-300`}>
                        <div className="absolute inset-x-0 top-0 h-1 bg-linear-to-r from-transparent via-violet-500/30 to-transparent" />
                        
                        <div className="flex flex-col items-center mt-6 w-full">
                          <div className="relative group mb-3">
                            <div className={`absolute -inset-1 rounded-full bg-linear-to-tr ${isFirst ? "from-amber-500 to-yellow-400" : isSecond ? "from-slate-400 to-gray-300" : "from-amber-800 to-amber-600"} opacity-70 blur-xs`} />
                            <img
                              src={bizLogo}
                              alt={bizName}
                              onError={(e) => {
                                e.target.src = "https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=150&auto=format&fit=crop";
                              }}
                              className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-2 border-[#111118]"
                            />
                            <div className="absolute -bottom-1 -right-1 bg-white text-black text-[9px] font-black rounded-full w-5 h-5 flex items-center justify-center border border-black font-mono">
                              {entry.rank}
                            </div>
                          </div>

                          <h3 className="text-white font-bold text-sm sm:text-base line-clamp-1 px-1">
                            {bizName}
                          </h3>
                          <p className="text-white/30 text-[10px] sm:text-xs uppercase tracking-wider font-bold mt-0.5">
                            {entry.category}
                          </p>
                          <div className="mt-1 flex items-center gap-1 text-[11px] text-white/50">
                            <MapPin className="w-3 h-3" />
                            <span>{entry.district}</span>
                          </div>
                        </div>

                        <div className="w-full flex flex-col items-center gap-3">
                          <div className="bg-white/5 border border-white/8 rounded-xl px-3.5 py-1.5 flex items-baseline gap-1">
                            <span className="text-white/40 text-[9px] uppercase font-bold">Score</span>
                            <span className="text-white font-black text-base sm:text-lg tracking-tight tabular-nums">
                              {entry.score}
                            </span>
                          </div>

                          <div className="flex gap-2 w-full justify-center">
                            <button
                              onClick={() => toggleExpand(entry._id)}
                              className="px-3 py-1.5 bg-white/5 border border-white/8 rounded-lg text-[10px] font-bold text-white/60 hover:text-white hover:bg-white/10 transition-all flex items-center gap-1.5"
                            >
                              <span>Metrics</span>
                              {expandedBizId === entry._id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            </button>
                            <button
                              onClick={() => handleShare(entry)}
                              className="p-1.5 bg-white/5 border border-white/8 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-all"
                              title="Share ranking"
                            >
                              <Share2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>

                      <AnimatePresence>
                        {expandedBizId === entry._id && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="bg-[#161622] border border-white/8 rounded-2xl p-4 mt-2 overflow-hidden text-left"
                          >
                            <h4 className="text-white font-bold text-xs mb-3 flex items-center gap-1.5">
                              <TrendingUp className="w-3.5 h-3.5 text-violet-400" />
                              Metric Breakdown
                            </h4>
                            <div className="space-y-2.5 text-[11px] sm:text-xs">
                              <div className="flex justify-between items-center">
                                <span className="text-white/40 flex items-center gap-1">
                                  <ShoppingCart className="w-3 h-3" /> Orders (40%)
                                </span>
                                <span className="text-white font-bold">{entry.metrics?.orderCount || 0}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-white/40 flex items-center gap-1">
                                  <Star className="w-3 h-3" /> Rating (25%)
                                </span>
                                <span className="text-white font-bold">{entry.metrics?.reviewAvg || 0} ★</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-white/40 flex items-center gap-1">
                                  <Eye className="w-3 h-3" /> Visits (15%)
                                </span>
                                <span className="text-white font-bold">{entry.metrics?.visitCount || 0}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-white/40 flex items-center gap-1">
                                  <Sparkles className="w-3 h-3" /> Story Eng. (10%)
                                </span>
                                <span className="text-white font-bold">{entry.metrics?.storyEngagement || 0}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-white/40 flex items-center gap-1">
                                  <MessageSquare className="w-3 h-3" /> Reviews Count (10%)
                                </span>
                                <span className="text-white font-bold">{entry.metrics?.reviewCount || 0}</span>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </div>
            )}

            {listEntries.length > 0 && (
              <div className="mt-8 max-w-4xl mx-auto space-y-3">
                <div className="hidden sm:grid grid-cols-[60px_1fr_120px_120px_220px] gap-4 px-5 py-2.5 text-[10px] text-white/20 uppercase tracking-wider font-bold">
                  <span>Rank</span>
                  <span>Business</span>
                  <span>Category</span>
                  <span>District</span>
                  <span className="text-right">Score & Actions</span>
                </div>

                <div className="space-y-2">
                  {listEntries.map((entry, idx) => {
                    const bizName = entry.businessId?.businessName || entry.businessName;
                    const bizLogo = entry.businessId?.logo || "/placeholder-biz.png";
                    const isExpanded = expandedBizId === entry._id;

                    return (
                      <motion.div
                        key={entry._id}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.04 }}
                        className="bg-[#111118]/80 backdrop-blur-md rounded-xl border border-white/8 overflow-hidden hover:border-white/15 hover:bg-[#14141e]/90 transition-all duration-300"
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-[60px_1fr_120px_120px_220px] items-center gap-3 sm:gap-4 px-4 sm:px-5 py-3.5">
                          <div className="flex items-center gap-2 sm:gap-0">
                            <span className="text-white/20 text-[10px] uppercase font-bold sm:hidden">Rank</span>
                            <span className="font-mono text-sm sm:text-base font-black text-white/60">
                              #{entry.rank}
                            </span>
                          </div>

                          <div className="flex items-center gap-3">
                            <img
                              src={bizLogo}
                              alt={bizName}
                              onError={(e) => {
                                e.target.src = "https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=150&auto=format&fit=crop";
                              }}
                              className="w-10 h-10 rounded-full object-cover border border-white/10"
                            />
                            <div className="min-w-0">
                              <h4 className="text-white font-bold text-sm truncate flex items-center gap-1.5">
                                {bizName}
                                {entry.businessId?.verified && (
                                  <span className="text-[10px] text-sky-400 bg-sky-500/10 px-1.5 py-0.5 rounded-md font-mono">
                                    ✓
                                  </span>
                                )}
                              </h4>
                              <p className="text-[10px] text-white/30 sm:hidden uppercase font-bold tracking-wider mt-0.5">
                                {entry.category} • {entry.district}
                              </p>
                            </div>
                          </div>

                          <div className="hidden sm:block">
                            <span className="text-white/40 text-xs font-semibold">{entry.category}</span>
                          </div>

                          <div className="hidden sm:block">
                            <span className="text-white/40 text-xs font-semibold">{entry.district}</span>
                          </div>

                          <div className="flex items-center justify-between sm:justify-end gap-3 mt-2 sm:mt-0">
                            <div className="flex items-center gap-1.5 bg-white/5 border border-white/8 rounded-lg px-2 py-1">
                              <span className="text-white/30 text-[9px] uppercase font-bold">Score</span>
                              <span className="text-white font-black text-sm tabular-nums">
                                {entry.score}
                              </span>
                            </div>

                            <div className="flex gap-2">
                              <button
                                onClick={() => handleShare(entry)}
                                className="p-2 bg-white/5 border border-white/8 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-all"
                                title="Share stand"
                              >
                                <Share2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => toggleExpand(entry._id)}
                                className="px-3 py-2 bg-white/5 border border-white/8 rounded-lg text-xs font-bold text-white/60 hover:text-white hover:bg-white/10 transition-all flex items-center gap-1.5"
                              >
                                <span>Details</span>
                                {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                              </button>
                            </div>
                          </div>
                        </div>

                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              className="bg-[#161622] border-t border-white/6 p-4 sm:p-5 overflow-hidden"
                            >
                              <h5 className="text-white font-bold text-xs mb-3 flex items-center gap-1.5">
                                <TrendingUp className="w-3.5 h-3.5 text-violet-400" />
                                Metric Breakdown
                              </h5>
                              <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                                <div className="bg-[#111118] border border-white/6 p-3 rounded-xl">
                                  <p className="text-[10px] text-white/30 uppercase font-bold flex items-center gap-1">
                                    <ShoppingCart className="w-3 h-3" /> Orders
                                  </p>
                                  <p className="text-white font-black text-base sm:text-lg mt-1">{entry.metrics?.orderCount || 0}</p>
                                  <p className="text-[9px] text-violet-400/70 font-semibold mt-0.5">40% weight</p>
                                </div>

                                <div className="bg-[#111118] border border-white/6 p-3 rounded-xl">
                                  <p className="text-[10px] text-white/30 uppercase font-bold flex items-center gap-1">
                                    <Star className="w-3 h-3" /> Avg. Rating
                                  </p>
                                  <p className="text-white font-black text-base sm:text-lg mt-1">{entry.metrics?.reviewAvg || 0} ★</p>
                                  <p className="text-[9px] text-violet-400/70 font-semibold mt-0.5">25% weight</p>
                                </div>

                                <div className="bg-[#111118] border border-white/6 p-3 rounded-xl">
                                  <p className="text-[10px] text-white/30 uppercase font-bold flex items-center gap-1">
                                    <Eye className="w-3 h-3" /> Total Visits
                                  </p>
                                  <p className="text-white font-black text-base sm:text-lg mt-1">{entry.metrics?.visitCount || 0}</p>
                                  <p className="text-[9px] text-violet-400/70 font-semibold mt-0.5">15% weight</p>
                                </div>

                                <div className="bg-[#111118] border border-white/6 p-3 rounded-xl">
                                  <p className="text-[10px] text-white/30 uppercase font-bold flex items-center gap-1">
                                    <Sparkles className="w-3 h-3" /> Story Eng.
                                  </p>
                                  <p className="text-white font-black text-base sm:text-lg mt-1">{entry.metrics?.storyEngagement || 0}</p>
                                  <p className="text-[9px] text-violet-400/70 font-semibold mt-0.5">10% weight</p>
                                </div>

                                <div className="bg-[#111118] border border-white/6 p-3 rounded-xl col-span-2 sm:col-span-1">
                                  <p className="text-[10px] text-white/30 uppercase font-bold flex items-center gap-1">
                                    <MessageSquare className="w-3 h-3" /> Reviews Count
                                  </p>
                                  <p className="text-white font-black text-base sm:text-lg mt-1">{entry.metrics?.reviewCount || 0}</p>
                                  <p className="text-[9px] text-violet-400/70 font-semibold mt-0.5">10% weight</p>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Leaderboard;
