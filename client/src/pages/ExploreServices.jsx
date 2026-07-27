import { useState, useEffect, useRef } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate, Link } from "react-router-dom";
import { categories } from "../data/categories";
import { motion, AnimatePresence } from "framer-motion";
import { businessService, promotedService } from "../services";
import { useLocation } from "../context/LocationContext";
import {
  HiOutlineMapPin,
  HiOutlineSquares2X2,
  HiOutlineArrowRight,
  HiOutlineChevronRight,
  HiOutlineCheckBadge,
  HiOutlineFire,
  HiStar,
  HiOutlineBuildingStorefront,
} from "react-icons/hi2";

const ExploreServices = () => {
  const navigate = useNavigate();
  const { district, taluka } = useLocation();
  
  const [trendingListings, setTrendingListings] = useState([]);
  const [trendingLoading, setTrendingLoading] = useState(true);
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  const displayedCategories = categories.slice(0, 6);

  useEffect(() => {
    const fetchTrending = async () => {
      try {
        setTrendingLoading(true);
        const params = { trending: "true" };
        
        const cachedCoords = sessionStorage.getItem("lokonomy_user_coords");
        if (cachedCoords) {
          const { lat, lng } = JSON.parse(cachedCoords);
          params.lat = lat;
          params.lng = lng;
          params.radius = 15000;
        } else {
          if (district) params.district = district;
          if (taluka) params.taluka = taluka;
        }

        const response = await businessService.getBusinesses(params);
        setTrendingListings(response.data.slice(0, 6));
      } catch (err) {
        console.error("Error fetching trending:", err);
      } finally {
        setTrendingLoading(false);
      }
    };

    fetchTrending();
  }, [district, taluka]);

  const trackedImpressions = useRef(new Set());
  useEffect(() => {
    trendingListings.forEach((biz) => {
      if (biz.isPromoted && biz.promotionId && !trackedImpressions.current.has(biz.promotionId)) {
        trackedImpressions.current.add(biz.promotionId);
        promotedService.trackImpression(biz.promotionId).catch((err) => console.error("Impression error:", err));
      }
    });
  }, [trendingListings]);

  const handleCategoryClick = (catName) => {
    if (verifiedOnly) {
      navigate(`/category/${catName}?verified=true`);
    } else {
      navigate(`/category/${catName}`);
    }
  };

  const handleServiceClick = (category, sub) => {
    if (verifiedOnly) {
      navigate(`/services/${category}/${sub}?verified=true`);
    } else {
      navigate(`/services/${category}/${sub}`);
    }
  };

  const card = "bg-[#111827] border border-[#1f2a3d] rounded-2xl";

  return (
    <div className="min-h-screen bg-[#080e1a] pt-24 pb-20">
      <Helmet>
        <title>Explore Local Services Directory | Lokonomy</title>
        <meta name="description" content="Browse hundreds of local services categorized for your convenience. Connect with local business owners GPS-based and get what you need instantly." />
      </Helmet>
      <style>{`
        .es * { font-family: 'DM Sans', sans-serif; }
        .no-sb::-webkit-scrollbar { display: none; }
      `}</style>

      <div className="es w-[96%] 3xl:w-[98%] mx-auto px-2 sm:px-4">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-[#111827] border border-[#1f2a3d] rounded-2xl p-6 mb-5"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-violet-400 text-[11px] font-semibold uppercase tracking-widest mb-1">
                Browse
              </p>
              <h1 className="text-white font-bold text-2xl sm:text-3xl leading-tight">
                Service Directory
              </h1>
              <p className="text-slate-300 text-xs mt-1 flex items-center gap-1.5 flex-wrap">
                <HiOutlineSquares2X2 className="text-violet-400 text-xs" />
                {categories.length} categories available
                <span className="text-slate-700">·</span>
                <HiOutlineMapPin className="text-rose-400 text-xs" />
                GPS-based nearby search
              </p>
            </div>

            {categories.length > 6 && (
              <Link
                to="/explore/all"
                className="shrink-0 flex items-center gap-2 bg-[#0d1424] hover:bg-violet-500/10 border border-[#1f2a3d] hover:border-violet-500/30 text-slate-300 hover:text-violet-400 text-xs font-semibold px-4 py-2.5 rounded-xl transition-all self-start sm:self-auto"
              >
                View All Services
                <HiOutlineArrowRight className="text-sm" />
              </Link>
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="flex items-center justify-between bg-[#111827]/40 border border-[#1f2a3d] rounded-2xl p-4 mb-6 backdrop-blur-md"
        >
          <div className="flex items-center gap-2">
            <HiOutlineCheckBadge className="text-emerald-400 text-lg" />
            <div>
              <h4 className="text-white font-semibold text-xs">Verified Partners Only</h4>
              <p className="text-[10px] text-slate-500">Only view businesses verified by Lokonomy KYC</p>
            </div>
          </div>
          <button
            onClick={() => setVerifiedOnly(!verifiedOnly)}
            className={`w-12 h-6 rounded-full p-1 transition-all duration-300 flex items-center ${
              verifiedOnly ? "bg-violet-600 justify-end" : "bg-[#0d1424] border border-[#1f2a3d] justify-start"
            }`}
          >
            <motion.div
              layout
              className="w-4 h-4 rounded-full bg-white shadow-md"
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            />
          </button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.3 }}
          className="mb-8"
        >
          <div className="flex items-center gap-2 mb-4">
            <HiOutlineFire className="text-rose-500 text-xl animate-pulse" />
            <h2 className="text-white font-bold text-lg sm:text-xl">Trending in Your Area</h2>
          </div>

          {trendingLoading ? (
            <div className="grid grid-cols-1 min-[540px]:grid-cols-2 min-[820px]:grid-cols-3 min-[1200px]:grid-cols-4 min-[1440px]:grid-cols-5 min-[1920px]:grid-cols-6 min-[2560px]:grid-cols-7 min-[3200px]:grid-cols-8 min-[3840px]:grid-cols-10 min-[5120px]:grid-cols-12 min-[7680px]:grid-cols-16 gap-4 sm:gap-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-[#111827] border border-[#1f2a3d] h-40 rounded-2xl animate-pulse opacity-40" />
              ))}
            </div>
          ) : trendingListings.length === 0 ? (
            <div className="border border-dashed border-[#1f2a3d] rounded-2xl p-8 text-center bg-[#111827]/10">
              <p className="text-slate-500 text-sm">No trending businesses in your direct area yet. Explore other categories below!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 min-[540px]:grid-cols-2 min-[820px]:grid-cols-3 min-[1200px]:grid-cols-4 min-[1440px]:grid-cols-5 min-[1920px]:grid-cols-6 min-[2560px]:grid-cols-7 min-[3200px]:grid-cols-8 min-[3840px]:grid-cols-10 min-[5120px]:grid-cols-12 min-[7680px]:grid-cols-16 gap-4 sm:gap-6">
              {trendingListings.map((biz) => (
                <motion.div
                  key={biz._id}
                  whileHover={{ y: -4 }}
                  onClick={() => {
                    if (biz.isPromoted && biz.promotionId) {
                      promotedService.trackClick(biz.promotionId).catch((err) => console.error("Click error:", err));
                    }
                    navigate(`/business/${biz._id}`);
                  }}
                  className="bg-[#111827] border border-[#1f2a3d] p-4 rounded-2xl hover:border-violet-500/40 hover:bg-[#131d2e] transition-all cursor-pointer flex flex-col justify-between"
                >
                  <div className="flex gap-3">
                    <div className="w-12 h-12 rounded-xl bg-[#0d1424] border border-[#1f2a3d] overflow-hidden flex items-center justify-center shrink-0">
                      {biz.logo ? (
                        <img src={biz.logo} alt={biz.businessName} className="w-full h-full object-cover" />
                      ) : (
                        <HiOutlineBuildingStorefront className="text-xl text-slate-600" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1">
                        <h3 className="text-white font-bold text-sm truncate">{biz.businessName}</h3>
                        {biz.verified && <HiOutlineCheckBadge className="text-emerald-400 text-sm shrink-0" />}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-[10px] text-violet-400 font-medium">{biz.subCategory}</p>
                        {biz.isPromoted && (
                          <span className="bg-violet-500/10 border border-violet-500/20 text-violet-300 px-1.5 py-0.2 rounded text-[8px] font-bold">
                            Promoted
                          </span>
                        )}
                      </div>
                      <p className="text-slate-400 text-[11px] line-clamp-2 mt-1">{biz.description || "Professional service provider"}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#1f2a3d]/50">
                    <div className="flex items-center gap-1 text-[10px] text-slate-300">
                      <HiOutlineMapPin className="text-rose-400" />
                      <span className="truncate max-w-40">{biz.locationAddress || biz.address || "Local"}</span>
                    </div>

                    <div className="flex items-center gap-0.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 px-2 py-0.5 rounded-lg text-[10px] font-bold">
                      <HiStar className="text-[10px]" />
                      {(biz.rating || 0.0).toFixed(1)}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        <div className="flex items-center gap-2 mb-4">
          <HiOutlineSquares2X2 className="text-violet-400 text-xl" />
          <h2 className="text-white font-bold text-lg sm:text-xl font-DM">Browse Categories</h2>
        </div>
        <div className="grid grid-cols-1 min-[540px]:grid-cols-2 min-[820px]:grid-cols-3 min-[1200px]:grid-cols-4 min-[1440px]:grid-cols-5 min-[1920px]:grid-cols-6 min-[2560px]:grid-cols-7 min-[3200px]:grid-cols-8 min-[3840px]:grid-cols-10 min-[5120px]:grid-cols-12 min-[7680px]:grid-cols-16 gap-4 sm:gap-6">
          {displayedCategories.map((cat, index) => {
            const visibleSubs = cat.subcategories.slice(0, 4);
            const extraCount = cat.subcategories.length - 4;

            return (
              <motion.div
                key={cat.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.06, duration: 0.25 }}
                className="group bg-gradient-to-br from-[#111827] to-[#0d131f] border border-[#1f2a3d] rounded-2xl p-5 hover:border-violet-500/50 hover:shadow-[0_8px_30px_rgba(139,92,246,0.12)] hover:-translate-y-1 transition-all duration-300 cursor-pointer relative overflow-hidden flex flex-col"
                onClick={() => handleCategoryClick(cat.name)}
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/5 rounded-full blur-3xl group-hover:bg-violet-500/10 transition-colors duration-500 pointer-events-none" />
                <div className="absolute bottom-0 left-0 h-0.5 w-0 bg-gradient-to-r from-violet-500 to-fuchsia-500 group-hover:w-full transition-all duration-500 rounded-full" />
                
                <div className="flex items-center gap-4 mb-5 pb-4 border-b border-[#1f2a3d]/60 relative z-10">
                  <div className={`w-12 h-12 rounded-xl border flex items-center justify-center text-3xl shrink-0 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-sm ${cat.color ? `${cat.color.bg} ${cat.color.text} border-transparent ${cat.color.hover}` : 'bg-gradient-to-br from-[#131d2e] to-[#0d1424] border-[#1f2a3d] group-hover:border-violet-500/30 text-slate-400'}`}>
                    {cat.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-slate-100 font-bold text-base group-hover:text-white group-hover:translate-x-0.5 transition-all truncate">
                      {cat.name}
                    </h2>
                    <p className="text-slate-400 text-xs mt-0.5 group-hover:text-slate-300 transition-colors">
                      {cat.subcategories.length} sub-categories
                    </p>
                  </div>
                  <HiOutlineArrowRight className="text-slate-600 text-base shrink-0 group-hover:text-violet-400 group-hover:translate-x-1 transition-all duration-300" />
                </div>
                
                <div className="grid grid-cols-2 gap-2.5 flex-1 relative z-10">
                  {visibleSubs.map((sub) => (
                    <button
                      key={sub.name}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleServiceClick(cat.name, sub.name);
                      }}
                      className="flex items-center gap-2 bg-[#0a0f18]/50 hover:bg-violet-500/10 border border-[#1f2a3d]/50 hover:border-violet-500/30 text-slate-400 hover:text-violet-300 px-3 py-2.5 rounded-xl text-xs font-medium transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md text-left overflow-hidden group/btn"
                    >
                      <span className="text-base shrink-0 group-hover/btn:scale-110 transition-transform">{sub.icon}</span>
                      <span className="truncate">{sub.name}</span>
                    </button>
                  ))}
                </div>
                
                {extraCount > 0 && (
                  <div className="mt-4 pt-3 border-t border-[#1f2a3d]/60 flex items-center justify-between relative z-10">
                    <span className="text-violet-400/80 group-hover:text-violet-400 text-xs font-semibold transition-colors">
                      +{extraCount} more services
                    </span>
                    <span className="flex items-center gap-1 text-slate-400 text-xs group-hover:text-white transition-colors font-medium">
                      Explore All <HiOutlineChevronRight className="text-xs group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
        {categories.length > 6 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.25 }}
            className="mt-6 flex justify-center"
          >
            <Link
              to="/explore/all"
              className="flex items-center gap-2 bg-[#111827] hover:bg-violet-600 border border-[#1f2a3d] hover:border-violet-600 text-slate-300 hover:text-white text-sm font-semibold px-6 py-3 rounded-xl transition-all shadow-lg hover:shadow-violet-900/30 group"
            >
              Explore All {categories.length} Services
              <HiOutlineArrowRight className="text-sm group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default ExploreServices;
