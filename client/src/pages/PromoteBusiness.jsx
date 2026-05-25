import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { businessService, promotedService } from "../services";
import toast from "react-hot-toast";
import {
  Sparkles,
  TrendingUp,
  Award,
  Zap,
  Calendar,
  DollarSign,
  BarChart3,
  CheckCircle2,
  AlertCircle,
  Megaphone,
  Percent,
  Plus,
  ArrowRight,
  Eye,
  MousePointerClick
} from "lucide-react";

const PROMO_TYPES = [
  {
    id: "search_boost",
    title: "Search Boost",
    description: "Appear at the top of local business searches in your category. Maximize discoverability.",
    icon: <TrendingUp className="w-6 h-6 text-emerald-400" />,
    color: "from-emerald-500/20 to-emerald-500/5 border-emerald-500/30 text-emerald-400",
    baseCpm: 0.10,
  },
  {
    id: "featured_badge",
    title: "Featured Badge",
    description: "Get a glowing golden border and a 'Featured' trust badge on your business listing.",
    icon: <Award className="w-6 h-6 text-amber-400" />,
    color: "from-amber-500/20 to-amber-500/5 border-amber-500/30 text-amber-400",
    baseCpm: 0.15,
  },
  {
    id: "story_boost",
    title: "Story Boost",
    description: "Boost your daily stories and offers directly to the home feed of all users in your district.",
    icon: <Sparkles className="w-6 h-6 text-indigo-400" />,
    color: "from-indigo-500/20 to-indigo-500/5 border-indigo-500/30 text-indigo-400",
    baseCpm: 0.12,
  }
];

const BUDGET_OPTIONS = [500, 1000, 2500, 5000];

const PromoteBusiness = () => {
  const [myBusinesses, setMyBusinesses] = useState([]);
  const [selectedBiz, setSelectedBiz] = useState(null);
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [promoType, setPromoType] = useState("search_boost");
  const [customBudget, setCustomBudget] = useState("");
  const [selectedBudget, setSelectedBudget] = useState(1000);
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );

  const budget = customBudget ? parseFloat(customBudget) : selectedBudget;

  useEffect(() => {
    fetchMyBusinesses();
  }, []);

  useEffect(() => {
    if (selectedBiz) {
      fetchBusinessPromotions(selectedBiz._id);
    }
  }, [selectedBiz]);

  const fetchMyBusinesses = async () => {
    setLoading(true);
    try {
      const res = await businessService.getMyBusinesses();
      const bizs = res.data || [];
      setMyBusinesses(bizs);
      if (bizs.length > 0) {
        setSelectedBiz(bizs[0]);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to load your businesses");
    }
    setLoading(false);
  };

  const fetchBusinessPromotions = async (bizId) => {
    try {
      const res = await promotedService.getBusinessPromotions(bizId);
      setPromotions(res.data?.promotions || []);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load active promotions");
    }
  };

  const handleCreatePromotion = async (e) => {
    e.preventDefault();
    if (!selectedBiz) {
      return toast.error("Please select a business to promote");
    }
    if (!budget || budget < 100) {
      return toast.error("Minimum budget is ₹100");
    }
    if (new Date(startDate) > new Date(endDate)) {
      return toast.error("End date must be after start date");
    }

    setSubmitting(true);
    try {
      const paymentId = "pay_sim_" + Math.random().toString(36).substr(2, 9);
      
      const res = await promotedService.createPromotion({
        businessId: selectedBiz._id,
        type: promoType,
        budget,
        startDate,
        endDate,
        paymentId
      });

      toast.success("Ad Campaign launched successfully!");
      fetchBusinessPromotions(selectedBiz._id);
      
      setCustomBudget("");
      setSelectedBudget(1000);
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to create campaign");
    }
    setSubmitting(false);
  };

  const selectedTypeDetails = PROMO_TYPES.find((t) => t.id === promoType);
  const estimatedImpressions = Math.round(budget / (selectedTypeDetails?.baseCpm || 0.10));

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-white">
        <Zap className="w-12 h-12 text-blue-500 animate-pulse mb-4" />
        <p className="text-gray-400">Loading business information...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 text-white">
      <div className="text-center mb-10">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm mb-4"
        >
          <Megaphone className="w-4 h-4" /> Lokonomy Ad Campaign Manager
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400"
        >
          Promote Your Local Business
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-gray-400 mt-2 max-w-2xl mx-auto"
        >
          Boost visibility, build credibility, and drive customers directly to your shop front. Better conversion rates than generic directories.
        </motion.p>
      </div>

      {myBusinesses.length === 0 ? (
        <div className="bg-slate-900/50 backdrop-blur-md rounded-2xl p-8 border border-slate-800 text-center max-w-lg mx-auto">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">No Businesses Registered</h2>
          <p className="text-gray-400 mb-6">
            You need to create a business listing before you can run promotional campaigns.
          </p>
          <a
            href="/add-business"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl font-semibold hover:from-blue-600 hover:to-indigo-700 transition"
          >
            <Plus className="w-5 h-5" /> Add Your Business
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 bg-slate-900/40 backdrop-blur-md border border-slate-800/80 rounded-3xl p-6 lg:p-8">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Zap className="w-6 h-6 text-blue-500" /> Configure Campaign
            </h2>

            <form onSubmit={handleCreatePromotion} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Select Business to Promote
                </label>
                <select
                  value={selectedBiz?._id || ""}
                  onChange={(e) =>
                    setSelectedBiz(myBusinesses.find((b) => b._id === e.target.value))
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition"
                >
                  {myBusinesses.map((b) => (
                    <option key={b._id} value={b._id}>
                      {b.businessName} ({b.district})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-3">
                  Choose Promotion Type
                </label>
                <div className="grid grid-cols-1 gap-4">
                  {PROMO_TYPES.map((type) => (
                    <div
                      key={type.id}
                      onClick={() => setPromoType(type.id)}
                      className={`relative flex items-start gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                        promoType === type.id
                          ? "bg-slate-850 border-blue-500 shadow-lg shadow-blue-500/10"
                          : "bg-slate-950/50 border-slate-800 hover:border-slate-700"
                      }`}
                    >
                      <div className="mt-1">{type.icon}</div>
                      <div>
                        <h3 className="font-bold text-lg">{type.title}</h3>
                        <p className="text-gray-400 text-sm mt-1">{type.description}</p>
                      </div>
                      {promoType === type.id && (
                        <div className="absolute right-4 top-4">
                          <CheckCircle2 className="w-5 h-5 text-blue-400" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-3">
                  Select Budget (INR)
                </label>
                <div className="grid grid-cols-4 gap-3 mb-4">
                  {BUDGET_OPTIONS.map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => {
                        setSelectedBudget(val);
                        setCustomBudget("");
                      }}
                      className={`py-2 rounded-xl font-bold border transition ${
                        selectedBudget === val && !customBudget
                          ? "bg-blue-600 border-blue-500"
                          : "bg-slate-950 border-slate-800 hover:border-slate-700 text-gray-400"
                      }`}
                    >
                      ₹{val}
                    </button>
                  ))}
                </div>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">
                    ₹
                  </span>
                  <input
                    type="number"
                    value={customBudget}
                    onChange={(e) => {
                      setCustomBudget(e.target.value);
                      setSelectedBudget(0);
                    }}
                    placeholder="Enter Custom Budget (Min ₹100)"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-4 py-3 text-white focus:outline-none focus:border-blue-500 transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">
                    Start Date
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-12 pr-4 py-3 text-white focus:outline-none focus:border-blue-500 transition"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">
                    End Date
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-12 pr-4 py-3 text-white focus:outline-none focus:border-blue-500 transition"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-4 rounded-xl font-bold bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 hover:from-blue-600 hover:via-indigo-600 hover:to-purple-700 transition flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>Launching Campaign...</>
                ) : (
                  <>
                    Pay & Launch Campaign <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="lg:col-span-5 space-y-6">
            <div className="bg-gradient-to-br from-indigo-950/40 via-slate-900/40 to-slate-950/40 border border-indigo-500/20 rounded-3xl p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl"></div>
              
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-indigo-400" /> Live Estimation
              </h3>

              <div className="space-y-4">
                <div className="flex justify-between border-b border-slate-800 pb-3">
                  <span className="text-gray-400">Selected Option</span>
                  <span className="font-semibold">{selectedTypeDetails?.title}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-3">
                  <span className="text-gray-400">Total Budget</span>
                  <span className="font-semibold text-emerald-400">₹{budget}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-3">
                  <span className="text-gray-400">Base CPM (cost per view)</span>
                  <span className="font-semibold">₹{(selectedTypeDetails?.baseCpm || 0.1).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-end">
                  <div>
                    <span className="text-gray-400 text-sm block">Estimated Views / Reach</span>
                    <span className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-teal-300">
                      ~{estimatedImpressions.toLocaleString()}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500 mb-1">Guaranteed reach</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/80 rounded-3xl p-6">
              <h3 className="text-xl font-bold mb-4">Active & Past Campaigns</h3>

              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                {promotions.length === 0 ? (
                  <p className="text-gray-500 text-center py-6 text-sm">
                    No active or past promotions for this business.
                  </p>
                ) : (
                  promotions.map((p) => {
                    const progress = Math.min((p.spent / p.budget) * 100, 100);
                    return (
                      <div
                        key={p._id}
                        className="bg-slate-950/60 border border-slate-800/60 rounded-2xl p-4 hover:border-slate-700 transition"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <span className="text-xs uppercase tracking-wider font-semibold px-2 py-0.5 rounded bg-slate-800 text-gray-400 mr-2">
                              {p.type.replace("_", " ")}
                            </span>
                            <span
                              className={`text-xs px-2 py-0.5 rounded font-semibold ${
                                p.status === "active"
                                  ? "bg-emerald-500/10 text-emerald-400"
                                  : p.status === "completed"
                                  ? "bg-gray-800 text-gray-500"
                                  : "bg-amber-500/10 text-amber-400"
                              }`}
                            >
                              {p.status}
                            </span>
                          </div>
                          <span className="font-bold text-sm text-gray-300">₹{p.budget}</span>
                        </div>

                        <div className="mt-3">
                          <div className="flex justify-between text-xs text-gray-400 mb-1">
                            <span>Spent: ₹{p.spent.toFixed(2)}</span>
                            <span>{progress.toFixed(0)}%</span>
                          </div>
                          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-blue-500 to-indigo-500"
                              style={{ width: `${progress}%` }}
                            ></div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mt-4 pt-3 border-t border-slate-800/40 text-center">
                          <div className="flex items-center justify-center gap-1.5 text-xs text-gray-400">
                            <Eye className="w-4 h-4 text-blue-400" />
                            <span>{p.impressions} Views</span>
                          </div>
                          <div className="flex items-center justify-center gap-1.5 text-xs text-gray-400">
                            <MousePointerClick className="w-4 h-4 text-indigo-400" />
                            <span>{p.clicks} Clicks</span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PromoteBusiness;
