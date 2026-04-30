import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useUser } from "../context/UserContext";
import { subscriptionService, referralService } from "../services";
import { toast } from "react-hot-toast";
import {
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineSparkles,
  HiOutlineCreditCard,
  HiOutlineShieldCheck,
  HiOutlineLightningBolt,
  HiOutlineClock,
  HiOutlineChartBar,
  HiOutlineStar,
  HiOutlineTicket,
} from "react-icons/hi";
import { Award, Medal, Tag, Gem } from "lucide-react";
import { Check, X } from "lucide-react";
const PLANS_CONFIG = [
  {
    key: "silver",
    name: "Silver",
    icon: <Medal />,
    color: "from-slate-400 to-slate-500",
    borderColor: "border-slate-500/40",
    glowColor: "shadow-slate-500/20",
    badgeColor: "bg-slate-500/10 text-slate-300 border-slate-500/30",
    prices: { 3: 199, 6: 349, 12: 599 },
    features: [
      { label: "20 Product Listings", included: true },
      { label: "50 Stories per Month", included: true },
      { label: "Basic Analytics", included: false },
      { label: "Featured Listings", included: false },
      { label: "Priority Support", included: false },
      { label: "Chat Messaging", included: true },
    ],
  },
  {
    key: "gold",
    name: "Gold",
    icon: <Award />,
    color: "from-amber-400 to-yellow-500",
    borderColor: "border-amber-500/60",
    glowColor: "shadow-amber-500/25",
    badgeColor: "bg-amber-500/10 text-amber-300 border-amber-500/30",
    badge: "Most Popular",
    prices: { 3: 399, 6: 699, 12: 1199 },
    features: [
      { label: "100 Product Listings", included: true },
      { label: "200 Stories per Month", included: true },
      { label: "Advanced Analytics", included: true },
      { label: "Featured Listings", included: false },
      { label: "Priority Support", included: false },
      { label: "Chat Messaging", included: true },
    ],
  },
  {
    key: "platinum",
    name: "Platinum",
    icon: <Gem />,
    color: "from-violet-400 to-purple-500",
    borderColor: "border-violet-500/60",
    glowColor: "shadow-violet-500/25",
    badgeColor: "bg-violet-500/10 text-violet-300 border-violet-500/30",
    badge: "Best Value",
    prices: { 3: 799, 6: 1399, 12: 2399 },
    features: [
      { label: "Unlimited Product Listings", included: true },
      { label: "Unlimited Stories", included: true },
      { label: "Advanced Analytics", included: true },
      { label: "Featured Listings", included: true },
      { label: "Priority Support", included: true },
      { label: "Chat Messaging", included: true },
    ],
  },
];

const DURATION_OPTIONS = [
  { months: 3, label: "3 Months", discount: "" },
  { months: 6, label: "6 Months", discount: "Save 12%" },
  { months: 12, label: "12 Months", discount: "Save 25%" },
];

const UpgradePlan = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useUser();

  const [selectedDuration, setSelectedDuration] = useState(3);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [subStatus, setSubStatus] = useState(null);
  const [statusLoading, setStatusLoading] = useState(true);
  const [refCodeInput, setRefCodeInput] = useState("");
  const [appliedRefCode, setAppliedRefCode] = useState("");
  const [refValidating, setRefValidating] = useState(false);
  const [refApplied, setRefApplied] = useState(false);
  const [dynamicPlans, setDynamicPlans] = useState({});

  useEffect(() => {
    if (user?.referredBy) {
      setRefApplied(true);
    }
  }, [user]);

  const DISCOUNT = 0.15;

  const getPrice = (basePrice) =>
    refApplied ? Math.round(basePrice * (1 - DISCOUNT)) : basePrice;

  useEffect(() => {
    window.scrollTo(0, 0);
    if (!user) {
      toast.error("Please login first");
      navigate("/");
      return;
    }
    fetchStatus();
    fetchPlans();
  }, [user]);

  const fetchPlans = async () => {
    try {
      const res = await subscriptionService.getPlans();
      if (res.data.success) {
        setDynamicPlans(res.data.plans);
      }
    } catch (err) {
      console.error("Error fetching plans:", err);
    }
  };

  const fetchStatus = async () => {
    try {
      const res = await subscriptionService.getStatus();
      setSubStatus(res.data);
    } catch {
    } finally {
      setStatusLoading(false);
    }
  };

  const handleValidateRef = async () => {
    if (!refCodeInput.trim()) return;
    setRefValidating(true);
    try {
      const res = await referralService.validateReferralCode(
        refCodeInput.trim(),
      );
      if (res.data.success) {
        setAppliedRefCode(res.data.referralCode);
        setRefApplied(true);
        toast.success("Referral code applied! 15% discount unlocked");
      }
    } catch {
      toast.error("Invalid referral code");
    } finally {
      setRefValidating(false);
    }
  };

  const loadRazorpay = () =>
    new Promise((resolve) => {
      if (window.Razorpay) return resolve(true);
      const existingScript = document.getElementById("razorpay-checkout-js");
      if (existingScript) {
        existingScript.onload = () => resolve(true);
        return;
      }
      const script = document.createElement("script");
      script.id = "razorpay-checkout-js";
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });

  const handlePurchase = async (planKey) => {
    if (!user) return toast.error("Please login first");
    console.log("planKey", planKey);
    setSelectedPlan(planKey);
    setLoading(true);

    try {
      const loaded = await loadRazorpay();
      if (!loaded) {
        toast.error("Payment gateway failed to load. Check your connection.");
        return;
      }

      const orderRes = await subscriptionService.createOrder(
        planKey,
        selectedDuration,
      );

      console.log("orderRes", orderRes);
      const { orderId, amount, currency, keyId } = orderRes.data;
      console.log("amount1:", amount);

      const plan = PLANS_CONFIG.find((p) => p.key === planKey);

      console.log("plan=====>", plan);

      const options = {
        key: keyId,
        amount: refApplied ? Math.round(amount * (1 - DISCOUNT)) : amount,
        currency,
        name: "Lokonomy",
        description: `${plan.name} Plan — ${selectedDuration} Month${selectedDuration > 1 ? "s" : ""}${refApplied ? " (15% off)" : ""}`,
        image: "https://via.placeholder.com/80x80?text=L",
        order_id: orderId,
        handler: async (response) => {
          try {
            const verifyRes = await subscriptionService.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              plan: planKey,
              durationMonths: selectedDuration,
              referralCode: appliedRefCode || "",
            });

            if (verifyRes.data.success) {
              updateUser(verifyRes.data.user);
              toast.success(`${plan.name} plan activated!`);
              if (refApplied)
                toast.success("Referral reward credited to your referrer!");
              fetchStatus();
            }
          } catch (err) {
            toast.error(
              err.response?.data?.message || "Payment verification failed",
            );
          }
        },
        prefill: {
          name: user.name,
          email: user.email,
          contact: user.phoneNumber || "",
        },
        theme: { color: "#7c3aed" },
        modal: {
          ondismiss: () => {
            setLoading(false);
            setSelectedPlan(null);
            subscriptionService.logFailedPayment({
              razorpay_order_id: orderId,
              plan: planKey,
              durationMonths: selectedDuration,
              failureReason: "Payment window closed by user",
            });
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", (response) => {
        toast.error("Payment failed: " + response.error.description);
        subscriptionService.logFailedPayment({
          razorpay_order_id: orderId,
          plan: planKey,
          durationMonths: selectedDuration,
          failureReason: response.error.description || "Payment failed",
        });
      });
      rzp.open();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to initiate payment");
    } finally {
      setLoading(false);
      setSelectedPlan(null);
    }
  };

  const currentPlan = subStatus?.subscription?.plan || "free";
  const isActive = subStatus?.subscription?.isActive;
  const isExpired = subStatus?.subscription?.isExpired;
  const originalPlan = subStatus?.subscription?.originalPlan;
  const expiry = subStatus?.subscription?.expiryDate;
  const activeDuration = subStatus?.subscription?.durationMonths;
  const limits = subStatus?.limits;
  const usage = subStatus?.usage;

  const card = "bg-[#111827] border border-[#1f2a3d] rounded-2xl";

  const FeatureIcon = ({ value }) => {
    if (value === "✓") {
      return <Check size={16} className="mx-auto text-emerald-400" />;
    }

    if (value === "✗") {
      return <X size={16} className="mx-auto text-slate-600" />;
    }

    return <span className="text-slate-400 font-medium">{value ?? "-"}</span>;
  };

  return (
    <div className="min-h-screen bg-[#080e1a] pt-24 pb-20">
      <style>{`
        .up * { font-family: 'DM Sans', sans-serif; }
        .plan-card { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
        .plan-card:hover { transform: translateY(-4px); }
        .gradient-text {
          background: linear-gradient(135deg, #a78bfa, #7c3aed);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        .shimmer {
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent);
          background-size: 200%;
          animation: shimmer 2s infinite;
        }
      `}</style>

      <div className="up max-w-5xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-semibold mb-6">
            <HiOutlineSparkles className="animate-pulse" />
            Premium Membership
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight mb-4">
            Elevate Your
            <span className="gradient-text"> Business</span>
          </h1>
          <p className="text-slate-400 text-base max-w-xl mx-auto">
            Unlock powerful features to grow your local business. More listings,
            analytics, featured placements, and priority support.
          </p>
        </motion.div>

        {!statusLoading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className={`${card} p-5 mb-8`}
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl
                  ${
                    currentPlan === "platinum"
                      ? "bg-violet-500/15"
                      : currentPlan === "gold"
                        ? "bg-amber-500/15"
                        : currentPlan === "silver"
                          ? "bg-slate-500/15"
                          : "bg-slate-700/30"
                  }`}
                >
                  {currentPlan === "platinum" ? (
                    <Gem />
                  ) : currentPlan === "gold" ? (
                    <Award />
                  ) : currentPlan === "silver" ? (
                    <Medal />
                  ) : (
                    <Tag />
                  )}
                </div>
                <div>
                  <p className="text-xs text-slate-300 uppercase tracking-widest font-bold mb-0.5">
                    Current Plan
                  </p>
                  <h2 className="text-white font-bold text-lg capitalize">
                    {currentPlan}{" "}
                    {isActive && activeDuration
                      ? `(${activeDuration} Months)`
                      : ""}
                    {isExpired &&
                      originalPlan !== "free" &&
                      `(${originalPlan} Expired)`}
                  </h2>
                  {isActive && expiry && (
                    <p className="text-slate-500 text-xs flex items-center gap-1.5 mt-0.5">
                      <HiOutlineClock className="text-violet-400" />
                      Expires{" "}
                      {new Date(expiry).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  )}
                </div>
              </div>

              {limits && usage && (
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <div className="flex items-baseline gap-1">
                      <span className="text-white font-bold text-xl">
                        {usage.productsUploaded || 0}
                      </span>
                      <span className="text-slate-600 text-xs">
                        /{" "}
                        {limits.productsUpload === 1e308
                          ? "∞"
                          : limits.productsUpload}
                      </span>
                    </div>
                    <p className="text-slate-600 text-[10px] uppercase tracking-wider mt-0.5">
                      Products
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-baseline gap-1">
                      <span className="text-white font-bold text-xl">
                        {usage.storiesPosted || 0}
                      </span>
                      <span className="text-slate-600 text-xs">
                        /{" "}
                        {limits.storiesPost === 1e308
                          ? "∞"
                          : limits.storiesPost}
                      </span>
                    </div>
                    <p className="text-slate-600 text-[10px] uppercase tracking-wider mt-0.5">
                      Stories
                    </p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {!user?.referredBy && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.12 }}
            className={`${card} p-5 mb-8`}
          >
            <div className="flex items-center gap-2 mb-3">
              <HiOutlineTicket className="text-violet-400 text-lg" />
              <h3 className="text-white font-semibold text-sm">
                Have a Referral Code?
              </h3>
              {refApplied && (
                <span className="ml-auto flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold px-2.5 py-1 rounded-full">
                  <HiOutlineCheckCircle className="text-base" />
                  Applied! 15% discount unlocked
                </span>
              )}
            </div>
            {!refApplied ? (
              <div className="flex gap-2">
                <input
                  id="referralCode"
                  name="referralCode"
                  type="text"
                  value={refCodeInput}
                  onChange={(e) =>
                    setRefCodeInput(e.target.value.toUpperCase())
                  }
                  placeholder="e.g. LOKO-AB12"
                  className="flex-1 bg-[#0d1424] border border-[#1f2a3d] rounded-xl px-4 py-2.5 text-sm text-slate-200 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 font-mono tracking-wider placeholder:text-slate-600"
                />
                <button
                  onClick={handleValidateRef}
                  disabled={refValidating || !refCodeInput.trim()}
                  className="px-4 py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold rounded-xl transition-all disabled:opacity-50 whitespace-nowrap"
                >
                  {refValidating ? "Checking..." : "Apply"}
                </button>
              </div>
            ) : (
              <p className="text-slate-500 text-xs">
                Your referral discount will be applied at checkout
                automatically.
              </p>
            )}
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="flex justify-center mb-8"
        >
          <div className="flex items-center gap-1 bg-[#111827] border border-[#1f2a3d] rounded-2xl p-1.5">
            {DURATION_OPTIONS.map((d) => (
              <button
                key={d.months}
                onClick={() => setSelectedDuration(d.months)}
                className={`relative flex flex-col items-center px-5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  selectedDuration === d.months
                    ? "bg-violet-600 text-white shadow-lg shadow-violet-900/40"
                    : "text-slate-500 hover:text-slate-300"
                }`}
              >
                {d.label}
                {d.discount && (
                  <span
                    className={`text-[9px] mt-0.5 font-bold ${
                      selectedDuration === d.months
                        ? "text-violet-200"
                        : "text-emerald-500"
                    }`}
                  >
                    {d.discount}
                  </span>
                )}
              </button>
            ))}
          </div>
        </motion.div>

        <div className="grid sm:grid-cols-3 gap-5 mb-12">
          {PLANS_CONFIG.map((plan, idx) => {
            const dynamicData = dynamicPlans[plan.key] || {};
            const price = dynamicData.prices
              ? dynamicData.prices[selectedDuration]
              : plan.prices[selectedDuration];

            const dynamicFeatures = dynamicData.limits
              ? [
                  {
                    label: `${dynamicData.limits.productsUploaded === 1e308 ? "Unlimited" : dynamicData.limits.productsUploaded} Product Listings`,
                    included: true,
                  },
                  {
                    label: `${dynamicData.limits.storiesPosted === 1e308 ? "Unlimited" : dynamicData.limits.storiesPosted} Stories`,
                    included: true,
                  },
                  {
                    label: "Advanced Analytics",
                    included: dynamicData.limits.analytics,
                  },
                  {
                    label: "Featured Listings",
                    included: dynamicData.limits.featuredListings,
                  },
                  {
                    label: "Priority Support",
                    included: dynamicData.limits.prioritySupport,
                  },
                  {
                    label: "Chat Messaging",
                    included: dynamicData.limits.chatMessaging,
                  },
                ]
              : plan.features;

            const isCurrentTier = currentPlan === plan.key && isActive;
            const isCurrentPlan =
              isCurrentTier && activeDuration === selectedDuration;
            const isBuying = loading && selectedPlan === plan.key;

            return (
              <motion.div
                key={plan.key}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 + idx * 0.08 }}
                className={`plan-card relative ${card} ${plan.borderColor} p-6 flex flex-col shadow-xl ${plan.glowColor}
                  ${plan.badge ? "ring-1 ring-amber-500/30" : ""}
                  ${isCurrentTier ? "ring-1 ring-violet-500/40" : ""}
                  ${isCurrentPlan ? "ring-2 ring-emerald-500/50" : ""}
                `}
              >
                {plan.badge && !isCurrentPlan && (
                  <div
                    className={`absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] font-bold border ${plan.badgeColor}`}
                  >
                    {plan.badge}
                  </div>
                )}
                {isCurrentPlan && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    ✓ Active Plan
                  </div>
                )}
                {!isCurrentPlan && isCurrentTier && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] font-bold bg-violet-500/10 text-violet-400 border border-violet-500/30">
                    Good Plan
                  </div>
                )}

                <div className="mb-5">
                  <div
                    className={`w-12 h-12 rounded-xl bg-linear-to-br ${plan.color} flex items-center justify-center text-2xl mb-3 shadow-lg`}
                  >
                    {plan.icon}
                  </div>
                  <h3 className="text-white font-bold text-xl">{plan.name}</h3>

                  <div className="mt-3 flex items-baseline gap-1 flex-wrap">
                    {refApplied ? (
                      <>
                        <span className="text-slate-500 line-through text-sm">
                          ₹{price}
                        </span>
                        <span className="text-slate-500 text-sm">₹</span>
                        <span className="text-emerald-400 font-extrabold text-3xl">
                          {getPrice(price)}
                        </span>
                        <span className="text-slate-500 text-xs ml-1">
                          / {selectedDuration}mo
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="text-slate-500 text-sm">₹</span>
                        <span className="text-white font-extrabold text-3xl">
                          {price}
                        </span>
                        <span className="text-slate-500 text-xs ml-1">
                          / {selectedDuration}mo
                        </span>
                      </>
                    )}
                  </div>
                  <p className="text-slate-600 text-[11px] mt-1">
                    ₹{Math.round(getPrice(price) / selectedDuration)}/month
                    billed{" "}
                    {selectedDuration === 1
                      ? "monthly"
                      : `every ${selectedDuration} months`}
                  </p>
                </div>

                <ul className="space-y-2.5 mb-6 flex-1">
                  {dynamicFeatures.map((f, fi) => (
                    <li key={fi} className="flex items-center gap-2.5 text-xs">
                      {f.included ? (
                        <HiOutlineCheckCircle className="text-emerald-400 shrink-0 text-base" />
                      ) : (
                        <HiOutlineXCircle className="text-slate-700 shrink-0 text-base" />
                      )}
                      <span
                        className={
                          f.included ? "text-slate-300" : "text-slate-600"
                        }
                      >
                        {f.label}
                      </span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => !isCurrentPlan && handlePurchase(plan.key)}
                  disabled={isCurrentPlan || isBuying || loading}
                  className={`w-full py-3 rounded-xl text-sm font-bold transition-all active:scale-[.97] flex items-center justify-center gap-2 ${
                    isCurrentPlan
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 cursor-default"
                      : isBuying
                        ? "bg-violet-600/60 text-violet-300 cursor-wait"
                        : `bg-linear-to-r ${plan.color} text-white shadow-lg hover:opacity-90`
                  }`}
                >
                  {isCurrentPlan ? (
                    <>
                      <HiOutlineCheckCircle /> Current Plan
                    </>
                  ) : isBuying ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Processing…
                    </>
                  ) : (
                    <>
                      <HiOutlineCreditCard />
                      Get {plan.name}
                    </>
                  )}
                </button>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className={`${card} p-6 mb-10`}
        >
          <h2 className="text-white font-bold text-lg mb-6 flex items-center gap-2">
            <HiOutlineChartBar className="text-violet-400" />
            Full Feature Comparison
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#1f2a3d]">
                  <th className="text-left text-slate-500 pb-3 font-semibold uppercase tracking-widest w-1/3">
                    Feature
                  </th>

                  <th className="text-center text-slate-500 pb-3 font-semibold uppercase tracking-widest">
                    Free
                  </th>

                  <th className="text-center text-slate-300 pb-3 font-semibold uppercase tracking-widest">
                    <div className="flex items-center justify-center gap-1">
                      <Medal size={16} />
                      Silver
                    </div>
                  </th>

                  <th className="text-center text-amber-400 pb-3 font-semibold uppercase tracking-widest">
                    <div className="flex items-center justify-center gap-1">
                      <Award size={16} />
                      Gold
                    </div>
                  </th>

                  <th className="text-center text-violet-400 pb-3 font-semibold uppercase tracking-widest">
                    <div className="flex items-center justify-center gap-1">
                      <Gem size={16} />
                      Platinum
                    </div>
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#1f2a3d]">
                {[
                  [
                    "Product Listings",
                    dynamicPlans.free?.limits?.productsUploaded || "3",
                    dynamicPlans.silver?.limits?.productsUploaded || "20",
                    dynamicPlans.gold?.limits?.productsUploaded || "100",
                    dynamicPlans.platinum?.limits?.productsUploaded ||
                      "Unlimited",
                  ],
                  [
                    "Stories / Month",
                    dynamicPlans.free?.limits?.storiesPosted || "5",
                    dynamicPlans.silver?.limits?.storiesPosted || "50",
                    dynamicPlans.gold?.limits?.storiesPosted || "200",
                    dynamicPlans.platinum?.limits?.storiesPosted || "Unlimited",
                  ],
                  [
                    "Analytics Dashboard",
                    dynamicPlans.free?.limits?.analytics ? "✓" : "✗",
                    dynamicPlans.silver?.limits?.analytics ? "✓" : "✗",
                    dynamicPlans.gold?.limits?.analytics ? "✓" : "✗",
                    dynamicPlans.platinum?.limits?.analytics ? "✓" : "✗",
                  ],
                  [
                    "Featured Listings",
                    dynamicPlans.free?.limits?.featuredListings ? "✓" : "✗",
                    dynamicPlans.silver?.limits?.featuredListings ? "✓" : "✗",
                    dynamicPlans.gold?.limits?.featuredListings ? "✓" : "✗",
                    dynamicPlans.platinum?.limits?.featuredListings ? "✓" : "✗",
                  ],
                  [
                    "Priority Support",
                    dynamicPlans.free?.limits?.prioritySupport ? "✓" : "✗",
                    dynamicPlans.silver?.limits?.prioritySupport ? "✓" : "✗",
                    dynamicPlans.gold?.limits?.prioritySupport ? "✓" : "✗",
                    dynamicPlans.platinum?.limits?.prioritySupport ? "✓" : "✗",
                  ],
                  [
                    "Chat Messaging",
                    dynamicPlans.free?.limits?.chatMessaging ? "✓" : "✗",
                    dynamicPlans.silver?.limits?.chatMessaging ? "✓" : "✗",
                    dynamicPlans.gold?.limits?.chatMessaging ? "✓" : "✗",
                    dynamicPlans.platinum?.limits?.chatMessaging ? "✓" : "✗",
                  ],
                ].map(([feature, free, silver, gold, platinum], i) => {
                  const formatVal = (v) => {
                    if (v === 1e308 || v === "1e+308" || v === Infinity)
                      return "Unlimited";
                    return v;
                  };
                  return (
                    <tr
                      key={i}
                      className="hover:bg-dark-bg/40 transition-colors"
                    >
                      <td className="py-3 text-slate-400 font-medium">
                        {feature}
                      </td>

                      <td className="py-3 text-center">
                        <FeatureIcon value={formatVal(free)} />
                      </td>

                      <td className="py-3 text-center">
                        <FeatureIcon value={formatVal(silver)} />
                      </td>

                      <td className="py-3 text-center">
                        <FeatureIcon value={formatVal(gold)} />
                      </td>

                      <td className="py-3 text-center">
                        <FeatureIcon value={formatVal(platinum)} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="grid grid-cols-3 gap-4 mb-8"
        >
          {[
            {
              icon: (
                <HiOutlineShieldCheck className="text-emerald-400 text-2xl" />
              ),
              title: "Secure Payments",
              desc: "256-bit SSL encrypted via Razorpay",
            },
            {
              icon: (
                <HiOutlineLightningBolt className="text-amber-400 text-2xl" />
              ),
              title: "Instant Activation",
              desc: "Plan active immediately after payment",
            },
            {
              icon: <HiOutlineStar className="text-violet-400 text-2xl" />,
              title: "24/7 Support",
              desc: "Priority assistance for our members",
            },
          ].map((b, i) => (
            <div key={i} className={`${card} p-4 text-center`}>
              <div className="flex justify-center mb-2">{b.icon}</div>
              <p className="text-white font-semibold text-xs mb-1">{b.title}</p>
              <p className="text-slate-600 text-[10px]">{b.desc}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
};

export default UpgradePlan;
