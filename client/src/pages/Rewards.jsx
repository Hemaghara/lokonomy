import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { rewardsService } from "../services";
import { useUser } from "../context/UserContext";
import toast from "react-hot-toast";
import {
  Sun,
  PackagePlus,
  ShoppingCart,
  Star,
  Ticket,
  Rocket,
  Target,
  Gift,
  ClipboardList,
  Inbox,
  Check,
  ChevronDown,
  ChevronUp,
  Diamond,
  Trophy,
  Loader2,
} from "lucide-react";

const EARNING_RULES = [
  {
    event: "Daily Login",
    points: 5,
    icon: <Sun className="w-5 h-5" />,
    desc: "Log in every day to keep earning",
    color: "from-amber-500 to-orange-500",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    text: "text-amber-200",
  },
  {
    event: "List a Product",
    points: 10,
    icon: <PackagePlus className="w-5 h-5" />,
    desc: "Add a new product to the marketplace",
    color: "from-sky-500 to-blue-500",
    bg: "bg-sky-500/10",
    border: "border-sky-500/20",
    text: "text-sky-400",
  },
  {
    event: "Place an Order",
    points: 20,
    icon: <ShoppingCart className="w-5 h-5" />,
    desc: "Purchase a product from the market",
    color: "from-emerald-500 to-green-500",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    text: "text-emerald-400",
  },
  {
    event: "Give a 5★ Review",
    points: 15,
    icon: <Star className="w-5 h-5" />,
    desc: "Leave a 5-star review after purchase",
    color: "from-yellow-400 to-amber-500",
    bg: "bg-yellow-500/10",
    border: "border-yellow-500/20",
    text: "text-yellow-400",
  },
];

const EVENT_META = {
  daily_login: {
    label: "Daily Login",
    icon: <Sun className="w-4 h-4" />,
    color: "text-amber-400",
  },
  listing_product: {
    label: "Product Listed",
    icon: <PackagePlus className="w-4 h-4" />,
    color: "text-sky-400",
  },
  making_order: {
    label: "Order Placed",
    icon: <ShoppingCart className="w-4 h-4" />,
    color: "text-emerald-400",
  },
  five_star_review: {
    label: "5★ Review",
    icon: <Star className="w-4 h-4" />,
    color: "text-yellow-400",
  },
  redeem_coupon: {
    label: "Coupon Redeemed",
    icon: <Ticket className="w-4 h-4" />,
    color: "text-fuchsia-400",
  },
  redeem_upgrade: {
    label: "Plan Upgrade",
    icon: <Rocket className="w-4 h-4" />,
    color: "text-violet-400",
  },
};

const Rewards = () => {
  const { user, updateUser } = useUser();
  const [points, setPoints] = useState(user?.loyaltyPoints || 0);
  const [history, setHistory] = useState([]);
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [redeemingId, setRedeemingId] = useState(null);
  const [dailyClaimed, setDailyClaimed] = useState(false);
  const [claimingDaily, setClaimingDaily] = useState(false);
  const [showAllHistory, setShowAllHistory] = useState(false);
  const redeemRef = useRef(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [balRes, optRes] = await Promise.all([
        rewardsService.getBalance(),
        rewardsService.getOptions(),
      ]);
      if (balRes.data.success) {
        setPoints(balRes.data.points);
        setHistory(balRes.data.history || []);
      }
      if (optRes.data.success) {
        setOptions(optRes.data.options || []);
      }
      const today = new Date().toDateString();
      const lastLogin = user?.lastLoginDate
        ? new Date(user.lastLoginDate).toDateString()
        : null;
      if (lastLogin === today) setDailyClaimed(true);
    } catch {
      toast.error("Failed to load rewards data");
    }
    setLoading(false);
  };

  const handleClaimDaily = async () => {
    if (dailyClaimed || claimingDaily) return;
    setClaimingDaily(true);
    try {
      const res = await rewardsService.claimDailyLogin();
      if (res.data.success) {
        setPoints(res.data.points);
        setDailyClaimed(true);
        updateUser({
          loyaltyPoints: res.data.points,
          lastLoginDate: new Date().toISOString(),
        });
        toast.success(res.data.message);
        fetchData();
      } else {
        if (res.data.alreadyClaimed) setDailyClaimed(true);
        toast(res.data.message, { icon: "ℹ️" });
      }
    } catch {
      toast.error("Failed to claim daily login");
    }
    setClaimingDaily(false);
  };

  const handleRedeem = async (optionId) => {
    const option = options.find((o) => o.id === optionId);
    if (!option) return;
    if (points < option.cost) {
      toast.error(`You need ${option.cost - points} more points`);
      return;
    }
    setRedeemingId(optionId);
    try {
      const res = await rewardsService.redeem(optionId);
      if (res.data.success) {
        setPoints(res.data.points);
        updateUser({ loyaltyPoints: res.data.points });
        toast.success(res.data.message);
        fetchData();
      } else {
        toast.error(res.data.message);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Redemption failed");
    }
    setRedeemingId(null);
  };

  const tiers = [
    { name: "Bronze", threshold: 0, emoji: "🥉" },
    { name: "Silver", threshold: 200, emoji: "🥈" },
    { name: "Gold", threshold: 500, emoji: "🥇" },
    {
      name: "Diamond",
      threshold: 1000,
      emoji: <Diamond className="w-5 h-5 text-cyan-400" />,
    },
  ];
  const currentTier =
    [...tiers].reverse().find((t) => points >= t.threshold) || tiers[0];
  const nextTier = tiers[tiers.indexOf(currentTier) + 1] || null;
  const progressPercent = nextTier
    ? Math.min(
        100,
        ((points - currentTier.threshold) /
          (nextTier.threshold - currentTier.threshold)) *
          100,
      )
    : 100;

  const displayedHistory = showAllHistory ? history : history.slice(0, 6);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#07070b] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 border-3 border-violet-500/20 rounded-full" />
            <div className="absolute inset-0 border-3 border-transparent border-t-violet-500 rounded-full animate-spin" />
            <span className="absolute inset-0 flex items-center justify-center">
              <Diamond className="w-8 h-8 text-violet-500 animate-pulse" />
            </span>
          </div>
          <p className="text-white/40 text-sm font-medium">
            Loading your rewards...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07070b] pb-20 sm:pb-16">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-b from-violet-600/12 via-transparent to-transparent pointer-events-none" />
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-125 h-125 bg-violet-600/8 rounded-full blur-[140px] pointer-events-none" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-8 sm:pt-12 pb-6">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <p className="text-center text-white/30 text-[11px] sm:text-xs uppercase tracking-[0.25em] font-bold mb-1">
              Loyalty Program
            </p>
            <h1 className="text-center text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight">
              Lokonomy{" "}
              <span className="text-transparent bg-clip-text bg-linear-to-r from-violet-400 via-fuchsia-400 to-violet-400">
                Rewards
              </span>
            </h1>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-6 sm:mt-8 max-w-md mx-auto"
          >
            <div className="relative group">
              <div className="absolute -inset-px bg-linear-to-br from-violet-500/50 via-fuchsia-500/30 to-violet-600/50 rounded-2xl blur-sm opacity-50 group-hover:opacity-70 transition-opacity duration-500" />
              <div className="relative bg-[#111118] rounded-2xl border border-white/10 overflow-hidden">
                <div className="h-1 bg-linear-to-r from-transparent via-violet-500/60 to-transparent" />

                <div className="p-5 sm:p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-white/35 text-[10px] sm:text-[11px] uppercase tracking-[0.2em] font-bold">
                        Points Balance
                      </p>
                      <div className="flex items-baseline gap-1.5 mt-0.5">
                        <motion.span
                          key={points}
                          initial={{ scale: 1.2, color: "#c084fc" }}
                          animate={{ scale: 1, color: "#ffffff" }}
                          transition={{
                            type: "spring",
                            stiffness: 300,
                            damping: 20,
                          }}
                          className="text-3xl sm:text-4xl font-black text-white tabular-nums leading-none"
                        >
                          {points.toLocaleString()}
                        </motion.span>
                        <span className="text-white/20 text-[10px] uppercase font-bold tracking-wider">
                          pts
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white/5 border border-white/8 flex flex-col items-center justify-center">
                        <span className="text-xl sm:text-2xl leading-none">
                          {currentTier.emoji}
                        </span>
                        <span className="text-[8px] sm:text-[9px] font-black text-white/40 uppercase mt-0.5 tracking-wider">
                          {currentTier.name}
                        </span>
                      </div>
                    </div>
                  </div>

                  {nextTier && (
                    <div className="mb-5">
                      <div className="flex items-center justify-between text-[10px] text-white/30 font-semibold mb-1.5">
                        <span className="flex items-center gap-1">
                          {currentTier.emoji} {currentTier.name}
                        </span>
                        <span>
                          {nextTier.emoji} {nextTier.name} —{" "}
                          {nextTier.threshold - points} pts away
                        </span>
                      </div>
                      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${progressPercent}%` }}
                          transition={{
                            duration: 1,
                            ease: "easeOut",
                            delay: 0.3,
                          }}
                          className="h-full bg-linear-to-r from-violet-500 to-fuchsia-500 rounded-full"
                        />
                      </div>
                    </div>
                  )}
                  {!nextTier && (
                    <div className="mb-5 text-center">
                      <span className="text-[10px] font-bold text-violet-400 uppercase tracking-wider flex items-center justify-center gap-2">
                        <Trophy className="w-3 h-3" /> Max tier reached — you're
                        a Diamond!
                      </span>
                    </div>
                  )}

                  <button
                    onClick={handleClaimDaily}
                    disabled={dailyClaimed || claimingDaily}
                    className={`w-full py-3 sm:py-3.5 rounded-xl text-sm font-bold transition-all duration-300 flex items-center justify-center gap-2 ${
                      dailyClaimed
                        ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400/60 cursor-default"
                        : "bg-linear-to-r from-amber-500 to-orange-500 text-black shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40 hover:scale-[1.02] active:scale-[0.98]"
                    }`}
                  >
                    {claimingDaily ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Claiming...
                      </>
                    ) : dailyClaimed ? (
                      <>
                        <Check className="w-4 h-4" />
                        Daily Login Claimed
                      </>
                    ) : (
                      <>
                        <Sun className="w-4 h-4" />
                        Claim Daily Login
                        <span className="bg-black/15 px-2 py-0.5 rounded-md text-[11px] font-black">
                          +5 pts
                        </span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-8 sm:mt-10"
        >
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-8 h-8 rounded-lg bg-violet-500/15 border border-violet-500/20 flex items-center justify-center">
              <Target className="w-4 h-4 text-violet-400" />
            </div>
            <div>
              <h2 className="text-white font-bold text-base sm:text-lg leading-tight">
                How to Earn Points
              </h2>
              <p className="text-white/30 text-[11px] sm:text-xs">
                Complete actions and watch your balance grow
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
            {EARNING_RULES.map((rule, i) => (
              <motion.div
                key={rule.event}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 + i * 0.06 }}
                className={`group relative flex items-center gap-3 sm:gap-4 ${rule.bg} border ${rule.border} rounded-xl p-3.5 sm:p-4 hover:scale-[1.01] transition-all duration-300 cursor-default`}
              >
                <div
                  className={`w-10 h-10 sm:w-11 sm:h-11 shrink-0 rounded-xl bg-linear-to-br ${rule.color} flex items-center justify-center text-white shadow-md`}
                >
                  {rule.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-bold text-[13px] sm:text-sm">
                    {rule.event}
                  </p>
                  <p className="text-white/30 text-[11px] sm:text-xs mt-0.5 truncate">
                    {rule.desc}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <span
                    className={`text-base sm:text-lg font-black ${rule.text}`}
                  >
                    +{rule.points}
                  </span>
                  <p className="text-white/15 text-[9px] uppercase tracking-wider font-bold">
                    pts
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        <motion.section
          ref={redeemRef}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="mt-10 sm:mt-12"
        >
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-8 h-8 rounded-lg bg-fuchsia-500/15 border border-fuchsia-500/20 flex items-center justify-center">
              <Gift className="w-4 h-4 text-fuchsia-400" />
            </div>
            <div>
              <h2 className="text-white font-bold text-base sm:text-lg leading-tight">
                Redeem Rewards
              </h2>
              <p className="text-white/30 text-[11px] sm:text-xs">
                Spend your points on exclusive perks
              </p>
            </div>
          </div>

          <div className="mb-4">
            <p className="text-white/25 text-[10px] sm:text-[11px] uppercase tracking-[0.15em] font-bold mb-2 ml-1 flex items-center gap-2">
              <Ticket className="w-3 h-3" /> Discount Coupons
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
              {options
                .filter((o) => o.type === "coupon")
                .map((opt, i) => {
                  const canAfford = points >= opt.cost;
                  const isRedeeming = redeemingId === opt.id;
                  const pctFill = Math.min(100, (points / opt.cost) * 100);
                  return (
                    <motion.div
                      key={opt.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 + i * 0.06 }}
                      className={`relative bg-[#111118] border rounded-xl overflow-hidden transition-all duration-300 ${
                        canAfford
                          ? "border-violet-500/30 hover:border-violet-400/50 shadow-lg shadow-violet-500/5"
                          : "border-white/8"
                      }`}
                    >
                      {!canAfford && (
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/5">
                          <div
                            className="h-full bg-violet-500/40 rounded-r-full transition-all duration-700"
                            style={{ width: `${pctFill}%` }}
                          />
                        </div>
                      )}

                      <div className="p-4 sm:p-5">
                        <div className="flex items-start justify-between mb-3">
                          <div className="w-10 h-10 rounded-xl bg-linear-to-br from-fuchsia-500/20 to-violet-500/20 border border-fuchsia-500/20 flex items-center justify-center">
                            <Ticket className="w-5 h-5 text-fuchsia-400" />
                          </div>
                          <div className="flex items-center gap-1 bg-white/5 rounded-lg px-2 py-1">
                            <Diamond className="w-3 h-3 text-cyan-400" />
                            <span
                              className={`text-xs font-black tabular-nums ${canAfford ? "text-violet-400" : "text-white/30"}`}
                            >
                              {opt.cost}
                            </span>
                          </div>
                        </div>

                        <h3 className="text-white font-bold text-sm mb-0.5">
                          {opt.name}
                        </h3>
                        <p className="text-white/30 text-[11px] sm:text-xs mb-4 leading-relaxed">
                          {opt.description}
                        </p>

                        <button
                          onClick={() => handleRedeem(opt.id)}
                          disabled={!canAfford || isRedeeming}
                          aria-label={`Redeem ${opt.name}`}
                          className={`w-full py-2.5 rounded-lg text-xs font-bold transition-all duration-200 ${
                            canAfford
                              ? "bg-violet-600 text-white hover:bg-violet-500 active:scale-[0.97] shadow-md shadow-violet-600/20"
                              : "bg-white/5 text-white/20 cursor-not-allowed"
                          }`}
                        >
                          {isRedeeming ? (
                            <span className="flex items-center justify-center gap-1.5">
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              Processing...
                            </span>
                          ) : canAfford ? (
                            "Redeem Now"
                          ) : (
                            `Need ${opt.cost - points} more pts`
                          )}
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
            </div>
          </div>

          <div>
            <p className="text-white/25 text-[10px] sm:text-[11px] uppercase tracking-[0.15em] font-bold mb-2 ml-1 flex items-center gap-2">
              <Rocket className="w-3 h-3" /> Plan Upgrades
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
              {options
                .filter((o) => o.type === "upgrade")
                .map((opt, i) => {
                  const canAfford = points >= opt.cost;
                  const isRedeeming = redeemingId === opt.id;
                  const pctFill = Math.min(100, (points / opt.cost) * 100);
                  const planColor =
                    opt.plan === "gold"
                      ? {
                          from: "from-amber-500/20",
                          to: "to-yellow-500/20",
                          border: "border-amber-500/25",
                          text: "text-amber-400",
                          btnBg:
                            "bg-amber-500 hover:bg-amber-400 shadow-amber-500/20",
                          badge:
                            "bg-amber-500/15 text-amber-400 border-amber-500/20",
                        }
                      : {
                          from: "from-slate-400/20",
                          to: "to-gray-500/20",
                          border: "border-slate-400/25",
                          text: "text-slate-300",
                          btnBg:
                            "bg-slate-500 hover:bg-slate-400 shadow-slate-500/20",
                          badge:
                            "bg-slate-500/15 text-slate-300 border-slate-400/20",
                        };

                  return (
                    <motion.div
                      key={opt.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 + i * 0.06 }}
                      className={`relative bg-[#111118] border rounded-xl overflow-hidden transition-all duration-300 ${
                        canAfford
                          ? `${planColor.border} shadow-lg`
                          : "border-white/8"
                      }`}
                    >
                      {!canAfford && (
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/5">
                          <div
                            className="h-full bg-violet-500/40 rounded-r-full transition-all duration-700"
                            style={{ width: `${pctFill}%` }}
                          />
                        </div>
                      )}

                      <div className="p-4 sm:p-5">
                        <div className="flex items-start justify-between mb-3">
                          <div
                            className={`w-10 h-10 rounded-xl bg-linear-to-br ${planColor.from} ${planColor.to} border ${planColor.border} flex items-center justify-center`}
                          >
                            <Rocket className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${planColor.badge}`}
                            >
                              Premium
                            </span>
                            <div className="flex items-center gap-1 bg-white/5 rounded-lg px-2 py-1">
                              <Diamond className="w-3 h-3 text-cyan-400" />
                              <span
                                className={`text-xs font-black tabular-nums ${canAfford ? planColor.text : "text-white/30"}`}
                              >
                                {opt.cost}
                              </span>
                            </div>
                          </div>
                        </div>

                        <h3 className="text-white font-bold text-sm mb-0.5">
                          {opt.name}
                        </h3>
                        <p className="text-white/30 text-[11px] sm:text-xs mb-4 leading-relaxed">
                          {opt.description}
                        </p>

                        <button
                          onClick={() => handleRedeem(opt.id)}
                          disabled={!canAfford || isRedeeming}
                          aria-label={`Redeem ${opt.name}`}
                          className={`w-full py-2.5 rounded-lg text-xs font-bold transition-all duration-200 ${
                            canAfford
                              ? `${planColor.btnBg} text-white active:scale-[0.97] shadow-md`
                              : "bg-white/5 text-white/20 cursor-not-allowed"
                          }`}
                        >
                          {isRedeeming ? (
                            <span className="flex items-center justify-center gap-1.5">
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              Processing...
                            </span>
                          ) : canAfford ? (
                            "Redeem Now"
                          ) : (
                            `Need ${opt.cost - points} more pts`
                          )}
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
            </div>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-10 sm:mt-12"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center">
                <ClipboardList className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <h2 className="text-white font-bold text-base sm:text-lg leading-tight">
                  Points History
                </h2>
                <p className="text-white/30 text-[11px] sm:text-xs">
                  Your recent activity log
                </p>
              </div>
            </div>
            {history.length > 0 && (
              <div className="flex items-center gap-1.5 bg-white/5 rounded-lg px-2.5 py-1 border border-white/8">
                <span className="text-emerald-400 text-[11px] font-black">
                  {history
                    .filter((h) => h.type === "earn")
                    .reduce((a, h) => a + h.amount, 0)}
                </span>
                <span className="text-white/15 text-[10px]">earned</span>
                <span className="text-white/10 mx-0.5">|</span>
                <span className="text-red-400 text-[11px] font-black">
                  {history
                    .filter((h) => h.type === "redeem")
                    .reduce((a, h) => a + h.amount, 0)}
                </span>
                <span className="text-white/15 text-[10px]">spent</span>
              </div>
            )}
          </div>

          {history.length === 0 ? (
            <div className="bg-[#111118] border border-white/8 rounded-xl py-12 sm:py-16 text-center">
              <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-white/5 border border-white/8 flex items-center justify-center">
                <Inbox className="w-6 h-6 text-white/20" />
              </div>
              <p className="text-white/35 text-sm font-semibold">
                No activity yet
              </p>
              <p className="text-white/15 text-xs mt-1 max-w-xs mx-auto">
                Earn your first points by claiming the daily login bonus above!
              </p>
            </div>
          ) : (
            <div className="bg-[#111118] border border-white/8 rounded-xl overflow-hidden">
              <div className="hidden sm:grid grid-cols-[1fr_auto_auto] gap-4 px-5 py-2.5 border-b border-white/6 text-[10px] text-white/20 uppercase tracking-wider font-bold">
                <span>Activity</span>
                <span>Date</span>
                <span className="text-right">Points</span>
              </div>

              <div className="divide-y divide-white/5">
                <AnimatePresence>
                  {displayedHistory.map((item, i) => {
                    const meta = EVENT_META[item.event] || {
                      label: item.event,
                      icon: <Diamond className="w-4 h-4" />,
                      color: "text-white/50",
                    };
                    return (
                      <motion.div
                        key={`${item.createdAt}-${i}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.03 }}
                        className="flex items-center gap-3 px-4 sm:px-5 py-3 sm:py-3.5 hover:bg-white/2 transition-colors"
                      >
                        <div
                          className={`w-8 h-8 sm:w-9 sm:h-9 shrink-0 rounded-lg bg-white/5 flex items-center justify-center ${item.type === "redeem" ? "ring-1 ring-red-500/20" : ""}`}
                        >
                          <span className={meta.color}>{meta.icon}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-[13px] sm:text-sm font-semibold truncate">
                            {item.description || meta.label}
                          </p>
                          <p className="text-white/20 text-[10px] sm:text-[11px] mt-0.5">
                            <span className={meta.color}>{meta.label}</span>
                            <span className="mx-1.5 text-white/10">•</span>
                            {new Date(item.createdAt).toLocaleDateString(
                              "en-IN",
                              {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              },
                            )}
                          </p>
                        </div>
                        <span
                          className={`shrink-0 text-sm sm:text-base font-black tabular-nums ${
                            item.type === "earn"
                              ? "text-emerald-400"
                              : "text-red-400"
                          }`}
                        >
                          {item.type === "earn" ? "+" : "−"}
                          {item.amount}
                        </span>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>

              {history.length > 6 && (
                <button
                  onClick={() => setShowAllHistory(!showAllHistory)}
                  className="w-full py-3 text-center text-xs font-bold text-violet-400 hover:text-violet-300 hover:bg-violet-500/5 border-t border-white/6 transition-all flex items-center justify-center gap-2"
                >
                  {showAllHistory ? (
                    <>
                      Show Less <ChevronUp className="w-3 h-3" />
                    </>
                  ) : (
                    <>
                      View All {history.length} Entries{" "}
                      <ChevronDown className="w-3 h-3" />
                    </>
                  )}
                </button>
              )}
            </div>
          )}
        </motion.section>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mt-10 sm:mt-12 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[10px] sm:text-[11px] text-white/15 font-medium pb-4"
        >
          <span className="flex items-center gap-1.5">
            <Diamond className="w-3 h-3" /> Points never expire
          </span>
          <span className="hidden sm:inline text-white/8">•</span>
          <span className="flex items-center gap-1.5">
            <Rocket className="w-3 h-3" /> New rewards added regularly
          </span>
          <span className="hidden sm:inline text-white/8">•</span>
          <span className="flex items-center gap-1.5">
            <Check className="w-3 h-3" /> Loyalty points are non-transferable
          </span>
        </motion.div>
      </div>
    </div>
  );
};

export default Rewards;
