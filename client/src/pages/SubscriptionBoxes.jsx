import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useUser } from "../context/UserContext";
import { subscriptionBoxService } from "../services/subscriptionBoxService";
import { businessService } from "../services/businessService";
import { toast } from "react-hot-toast";
import { motion } from "framer-motion";
import {
  Package,
  Calendar,
  Layers,
  MapPin,
  Building,
  CreditCard,
  Loader2,
  CheckCircle,
  AlertCircle
} from "lucide-react";

const SubscriptionBoxes = () => {
  const { user } = useUser();
  const navigate = useNavigate();
  const [boxes, setBoxes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterDistrict, setFilterDistrict] = useState("");
  const [submittingId, setSubmittingId] = useState(null);

  useEffect(() => {
    fetchBoxes();
  }, [filterDistrict]);

  const fetchBoxes = async () => {
    setLoading(true);
    try {
      const district = filterDistrict || user?.district || localStorage.getItem("lokonomy_district") || "";
      const bizRes = await businessService.getBusinesses({ district });
      
      let allBoxes = [];
      if (bizRes.data && Array.isArray(bizRes.data)) {
        await Promise.all(
          bizRes.data.map(async (biz) => {
            try {
              const boxRes = await subscriptionBoxService.getBusinessBoxes(biz._id);
              if (boxRes.data?.success) {
                const enrichedBoxes = (boxRes.data.boxes || []).map(box => ({
                  ...box,
                  business: biz
                }));
                allBoxes = [...allBoxes, ...enrichedBoxes];
              }
            } catch (err) {
              console.error(`Error loading boxes for business ${biz._id}:`, err);
            }
          })
        );
      }
      setBoxes(allBoxes);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load subscription crates");
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribeToggle = async (box) => {
    if (!user) {
      toast.error("Please login to subscribe");
      return navigate("/login");
    }

    const isSubscribed = box.subscribers?.includes(user.id);
    setSubmittingId(box._id);
    try {
      let res;
      if (isSubscribed) {
        if (!window.confirm(`Are you sure you want to cancel your subscription to ${box.name}?`)) {
          setSubmittingId(null);
          return;
        }
        res = await subscriptionBoxService.unsubscribeFromBox(box._id);
      } else {
        res = await subscriptionBoxService.subscribeToBox(box._id);
      }

      if (res.data.success) {
        toast.success(isSubscribed ? "Unsubscribed from crate" : "Subscribed to crate successfully!");
        fetchBoxes();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Operation failed");
    } finally {
      setSubmittingId(null);
    }
  };

  const card = "bg-[#111827] border border-[#1f2a3d] rounded-2xl overflow-hidden hover:border-violet-500/30 transition-all duration-300 flex flex-col justify-between";

  return (
    <div className="min-h-screen bg-[#080e1a] text-slate-100 pt-24 pb-20">
      <div className="max-w-6xl mx-auto px-4">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2">
              <Package className="text-violet-400 w-8 h-8" /> Curation Crates
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-1">
              Subscribe to recurring weekly or monthly curated bundles from local producers.
            </p>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto bg-[#111827] border border-[#1f2a3d] rounded-xl px-3 py-1.5">
            <MapPin className="w-4 h-4 text-slate-500 shrink-0" />
            <input
              type="text"
              placeholder="Search by district..."
              value={filterDistrict}
              onChange={(e) => setFilterDistrict(e.target.value)}
              className="bg-transparent text-xs text-slate-200 outline-none w-full md:w-44 placeholder:text-slate-600"
            />
          </div>
        </div>

        {loading ? (
          <div className="py-24 text-center flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
            <span className="text-sm text-slate-400">Loading curation crates...</span>
          </div>
        ) : boxes.length === 0 ? (
          <div className="bg-[#111827] border border-[#1f2a3d] rounded-2xl py-16 text-center max-w-lg mx-auto">
            <div className="w-16 h-16 bg-white/5 border border-white/8 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Package className="w-8 h-8 text-slate-600" />
            </div>
            <p className="text-slate-300 font-bold text-base">No Crates Available</p>
            <p className="text-slate-500 text-xs mt-2 px-4 max-w-sm mx-auto">
              There are no curation crates created by sellers in this district yet. Check back soon or filter by another district.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {boxes.map((box) => {
              const isSubscribed = box.subscribers?.includes(user?.id);
              return (
                <motion.div
                  key={box._id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={card}
                >
                  <div className="h-2 bg-linear-to-r from-violet-600 to-indigo-600" />
                  
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <Link
                        to={`/business/${box.business?._id}`}
                        className="flex items-center gap-2 text-[10px] text-violet-400 hover:underline font-bold uppercase tracking-wider mb-2.5"
                      >
                        <Building className="w-3.5 h-3.5" />
                        {box.business?.businessName || "Local Business"}
                      </Link>

                      <h3 className="text-white font-bold text-base mb-1">
                        {box.name}
                      </h3>
                      <p className="text-slate-400 text-xs leading-relaxed mb-4">
                        {box.description}
                      </p>

                      {box.items?.length > 0 && (
                        <div className="mb-4">
                          <p className="text-[9px] uppercase tracking-wider text-slate-500 font-bold mb-1.5 flex items-center gap-1">
                            <Layers className="w-3 h-3" /> Included in bundle
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {box.items.map((item, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 bg-[#0d1424] border border-[#1f2a3d] text-slate-300 rounded text-[10px] font-semibold"
                              >
                                {item}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="pt-4 border-t border-[#1f2a3d]/50 flex items-center justify-between gap-4 mt-4">
                      <div>
                        <div className="text-white font-black text-lg">
                          ₹{box.price}
                        </div>
                        <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider flex items-center gap-1 mt-0.5">
                          <Calendar className="w-3 h-3" /> {box.frequency}
                        </div>
                      </div>

                      <button
                        onClick={() => handleSubscribeToggle(box)}
                        disabled={submittingId === box._id}
                        className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 ${
                          isSubscribed
                            ? "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/20 hover:border-emerald-500/40"
                            : "bg-violet-600 hover:bg-violet-500 text-white border-transparent"
                        }`}
                      >
                        {submittingId === box._id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : isSubscribed ? (
                          <>
                            <CheckCircle className="w-3.5 h-3.5" /> Subscribed
                          </>
                        ) : (
                          <>
                            <CreditCard className="w-3.5 h-3.5" /> Subscribe
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default SubscriptionBoxes;
