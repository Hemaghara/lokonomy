import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, Link, useNavigate, useSearchParams } from "react-router-dom";
import { businessService, promotedService } from "../services";
import WishlistButton from "../components/WishlistButton";
import BusinessMapView from "../components/BusinessMapView";
import { FaSearch, FaThLarge, FaMapMarkedAlt } from "react-icons/fa";
import { HiOutlineMapPin, HiStar } from "react-icons/hi2";
import { useComparison } from "../context/ComparisonContext";
import { motion, AnimatePresence } from "framer-motion";
import { FaChartBar, FaPlus, FaCheck } from "react-icons/fa";
import { Clock, BadgeCheck, Tag, Flame } from "lucide-react";
const useUserLocation = () => {
  const [coords, setCoords] = useState(() => {
    const cached = sessionStorage.getItem("lokonomy_user_coords");
    if (cached) return JSON.parse(cached);
    return null;
  });
  const [geoStatus, setGeoStatus] = useState("idle");

  const requestGPS = useCallback(() => {
    if (!navigator.geolocation) {
      setGeoStatus("denied");
      return;
    }
    setGeoStatus("fetching");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const c = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setCoords(c);
        sessionStorage.setItem("lokonomy_user_coords", JSON.stringify(c));
        setGeoStatus("granted");
      },
      () => setGeoStatus("denied"),
      { enableHighAccuracy: true, timeout: 8000 },
    );
  }, []);

  return { coords, geoStatus, requestGPS };
};

const Services = () => {
  const { category, subcategory } = useParams();
  const navigate = useNavigate();
  const { coords, geoStatus, requestGPS } = useUserLocation();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [radius, setRadius] = useState(5000);
  const [viewMode, setViewMode] = useState("list");
  const [isCompareMode, setIsCompareMode] = useState(false);
  const { selectedIds, toggleSelection } = useComparison();
  const [searchParams] = useSearchParams();

  const [openNow, setOpenNow] = useState(false);
  const [verified, setVerified] = useState(() => searchParams.get("verified") === "true");
  const [hasOffers, setHasOffers] = useState(false);
  const [trending, setTrending] = useState(false);
  const [sortBy, setSortBy] = useState("newest");

  const filteredListings = listings.filter(
    (item) =>
      item.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  useEffect(() => {
    if (coords && sortBy === "newest") {
      setSortBy("distance");
    }
  }, [coords]);

  useEffect(() => {
  }, [selectedIds]);

  useEffect(() => {
    const fetchBusinesses = async () => {
      try {
        setLoading(true);
        const params = {};
        if (coords) {
          params.lat = coords.lat;
          params.lng = coords.lng;
          params.radius = radius;
        }
        if (category) params.category = category;
        if (subcategory) params.subcategory = subcategory;

        if (openNow) params.openNow = "true";
        if (verified) params.verified = "true";
        if (hasOffers) params.hasOffers = "true";
        if (trending) params.trending = "true";
        if (sortBy) params.sortBy = sortBy;

        const response = await businessService.getBusinesses(params);
        setListings(response.data);
      } catch (err) {
        console.error("Error fetching services:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchBusinesses();
  }, [category, subcategory, coords, radius, openNow, verified, hasOffers, trending, sortBy]);

  const trackedImpressions = useRef(new Set());
  useEffect(() => {
    filteredListings.forEach((shop) => {
      if (shop.isPromoted && shop.promotionId && !trackedImpressions.current.has(shop.promotionId)) {
        trackedImpressions.current.add(shop.promotionId);
        promotedService.trackImpression(shop.promotionId).catch((err) => console.error("Impression error:", err));
      }
    });
  }, [filteredListings]);

  useEffect(() => {
    if (!coords && geoStatus === "idle") {
      requestGPS();
    }
  }, []);

  const radiusOptions = [
    { label: "1 km", value: 1000 },
    { label: "3 km", value: 3000 },
    { label: "5 km", value: 5000 },
    { label: "10 km", value: 10000 },
    { label: "25 km", value: 25000 },
  ];

  return (
    <div className="min-h-screen bg-dark-bg pt-32 pb-24 relative overflow-hidden">
      <div className="fixed top-0 right-0 w-lg h-lg bg-primary/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />

      <div className="w-[96%] max-w-none mx-auto relative px-2 sm:px-4 lg:px-6">
        <div className="flex flex-wrap items-center gap-3 mb-10 text-[11px] font-bold uppercase tracking-[0.15em]">
          <Link
            to="/explore"
            className="text-slate-500 hover:text-white transition-colors"
          >
            Directory
          </Link>
          <span className="text-slate-700">/</span>
          <Link
            to={`/category/${category}`}
            className="text-slate-500 hover:text-white transition-colors"
          >
            {category}
          </Link>
          <span className="text-slate-700">/</span>
          <span className="text-primary">{subcategory || "Browse All"}</span>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-10 mb-10 border-b border-white/5 pb-10">
          <div className="max-w-3xl">
            <h1 className="text-white text-5xl md:text-6xl font-black mb-4 tracking-tight flex items-baseline gap-1">
              {subcategory || category}
              <span className="text-primary text-5xl md:text-6xl">.</span>
            </h1>
            <div className="text-slate-400 text-lg flex flex-wrap items-center gap-2 mt-2">
              <span>Found</span>
              <span className="px-2.5 py-0.5 bg-white/10 text-white font-bold rounded-md">
                {listings.length}
              </span>
              <span>businesses</span>
              {coords ? (
                <>
                  <span>within</span>
                  <span className="px-2.5 py-0.5 bg-primary/20 text-primary font-bold rounded-md border border-primary/20">
                    {radiusOptions.find((r) => r.value === radius)?.label || "5 km"}
                  </span>
                  <span>of your location</span>
                </>
              ) : (
                <span>— enable GPS to filter by distance</span>
              )}
            </div>
          </div>

          <div className="flex flex-col xl:flex-row gap-4 w-full lg:w-auto shrink-0 mt-6 lg:mt-0">
            <div className="flex items-center p-1.5 bg-[#111827]/80 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
              {/* Radius Options */}
              {coords && (
                <div className="flex relative items-center bg-black/20 rounded-xl p-1 mr-1.5 border border-white/5 overflow-x-auto no-scrollbar">
                  {radiusOptions.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setRadius(opt.value)}
                      className={`relative z-10 px-3.5 py-2 rounded-lg text-[11px] font-bold transition-colors duration-300 whitespace-nowrap ${
                        radius === opt.value
                          ? "text-white"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      {radius === opt.value && (
                        <motion.div
                          layoutId="radius-active"
                          className="absolute inset-0 bg-primary rounded-lg -z-10 shadow-[0_0_15px_rgba(var(--color-primary),0.3)]"
                          transition={{ type: "spring", stiffness: 400, damping: 30 }}
                        />
                      )}
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}

              {coords && <div className="hidden sm:block w-[1px] h-8 bg-white/10 mx-2" />}

              {/* View Mode */}
              <div className="flex relative items-center p-1 bg-black/20 rounded-xl border border-white/5 shrink-0">
                {["list", "map"].map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    className={`relative z-10 flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[11px] font-bold capitalize transition-colors duration-300 ${
                      viewMode === mode
                        ? "text-white"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {viewMode === mode && (
                      <motion.div
                        layoutId="view-active"
                        className="absolute inset-0 bg-primary rounded-lg -z-10 shadow-[0_0_15px_rgba(var(--color-primary),0.3)]"
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                      />
                    )}
                    {mode === "list" ? <FaThLarge /> : <FaMapMarkedAlt />}
                    <span className="hidden sm:inline">{mode}</span>
                  </button>
                ))}
              </div>

              <div className="w-[1px] h-8 bg-white/10 mx-3" />

              {/* Compare Button */}
              <button
                onClick={() => setIsCompareMode(!isCompareMode)}
                className={`group relative overflow-hidden flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all duration-500 shrink-0 ${
                  isCompareMode
                    ? "text-white shadow-[0_0_20px_rgba(var(--color-primary),0.4)]"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <div
                  className={`absolute inset-0 transition-all duration-500 rounded-xl ${
                    isCompareMode
                      ? "bg-primary"
                      : "bg-white/5 group-hover:bg-white/10 border border-white/5"
                  }`}
                />
                <FaChartBar className={`relative z-10 ${isCompareMode ? "animate-pulse" : ""}`} />
                <span className="relative z-10 hidden md:inline">
                  {isCompareMode ? "Close Compare" : "Compare"}
                </span>
              </button>
            </div>

            {/* Search Input */}
            <div className="relative group w-full xl:w-80 shrink-0">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-secondary rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-700" />
              <div className="relative flex items-center bg-[#111827]/90 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden h-full shadow-2xl focus-within:border-primary/50 transition-colors">
                <span className="pl-5 text-primary text-sm">
                  <FaSearch />
                </span>
                <input
                  id="searchQuery"
                  name="searchQuery"
                  type="text"
                  placeholder="Search by name or keyword..."
                  className="w-full bg-transparent p-4 text-[13px] font-semibold text-white focus:outline-none placeholder:text-slate-500"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="pr-5 text-slate-500 hover:text-white transition-colors"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 bg-[#1a2133]/50 backdrop-blur-md border border-white/5 rounded-2xl p-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-bold text-text-dim uppercase tracking-wider mr-2">Filters:</span>
            <button
              onClick={() => setOpenNow(!openNow)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${openNow
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                  : "bg-white/5 text-text-dim border-white/5 hover:border-white/10 hover:text-white"
                }`}
            >
              <Clock className="w-3.5 h-3.5" /> Open Now
            </button>
            <button
              onClick={() => setVerified(!verified)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${verified
                  ? "bg-primary/10 text-primary border-primary/20"
                  : "bg-white/5 text-text-dim border-white/5 hover:border-white/10 hover:text-white"
                }`}
            >
              <BadgeCheck className="w-3.5 h-3.5" /> Verified
            </button>
            <button
              onClick={() => setHasOffers(!hasOffers)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${hasOffers
                  ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                  : "bg-white/5 text-text-dim border-white/5 hover:border-white/10 hover:text-white"
                }`}
            >
              <Tag className="w-3.5 h-3.5" /> Has Offers
            </button>
            <button
              onClick={() => setTrending(!trending)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${trending
                  ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                  : "bg-white/5 text-text-dim border-white/5 hover:border-white/10 hover:text-white"
                }`}
            >
              <Flame className="w-3.5 h-3.5" /> Trending
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-text-dim uppercase tracking-wider">Sort By:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-[#111827] border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-primary cursor-pointer select-option-dark"
            >
              {coords && <option value="distance">Distance</option>}
              <option value="rating">Rating</option>
              <option value="trending">Trending</option>
              <option value="newest">Newest</option>
            </select>
          </div>
        </div>

        {geoStatus === "denied" && (
          <div className="mb-8 p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 flex items-center gap-3">
            <p className="text-amber-400 text-sm">
              Location access denied. Showing all businesses without distance
              filter.{" "}
              <button
                onClick={requestGPS}
                className="underline font-bold hover:text-amber-300"
              >
                Try again
              </button>
            </p>
          </div>
        )}

        <div className="min-h-100">
          {viewMode === "map" && !loading && (
            <BusinessMapView
              businesses={filteredListings}
              userCoords={coords}
              radius={radius}
            />
          )}

          {viewMode === "list" && (
            <>
              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 min-[2560px]:grid-cols-8 min-[3200px]:grid-cols-10 min-[3840px]:grid-cols-12 min-[5120px]:grid-cols-16 min-[7680px]:grid-cols-24 gap-6 xl:gap-8">
                  {[...Array(6)].map((_, i) => (
                    <div
                      key={i}
                      className="bg-white/2 border border-white/5 h-80 rounded-2xl animate-pulse"
                    />
                  ))}
                </div>
              ) : filteredListings.length === 0 ? (
                <div className="text-center py-40 border border-dashed border-white/10 rounded-3xl bg-white/2">
                  <h3 className="text-white text-2xl font-bold mb-3 tracking-tight">
                    No businesses nearby
                  </h3>
                  <p className="text-text-dim max-w-md mx-auto mb-10 text-lg">
                    {coords
                      ? `No businesses found within ${radiusOptions.find((r) => r.value === radius)?.label}. Try a larger radius.`
                      : "Enable GPS or try a different search."}
                  </p>
                  {coords && (
                    <button
                      onClick={() =>
                        setRadius(
                          radiusOptions[
                            Math.min(
                              radiusOptions.findIndex(
                                (r) => r.value === radius,
                              ) + 1,
                              radiusOptions.length - 1,
                            )
                          ].value,
                        )
                      }
                      className="btn-primary px-10 rounded-xl font-bold mr-4"
                    >
                      Expand Radius
                    </button>
                  )}
                  <button
                    onClick={() => navigate(-1)}
                    className="btn-primary px-10 rounded-xl font-bold"
                  >
                    ← Back
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 min-[2560px]:grid-cols-8 min-[3200px]:grid-cols-10 min-[3840px]:grid-cols-12 min-[5120px]:grid-cols-16 min-[7680px]:grid-cols-24 gap-6 xl:gap-8">
                  {filteredListings.map((shop) => (
                    <div
                      key={shop._id}
                      className={`group relative bg-[#131824] border ${selectedIds.includes(shop._id)
                          ? "border-primary shadow-[0_0_20px_rgba(99,102,241,0.2)]"
                          : "border-white/5"
                        } rounded-2xl overflow-hidden hover:border-primary/50 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 flex flex-col cursor-pointer`}
                      onClick={() => {
                        if (shop.isPromoted && shop.promotionId) {
                          promotedService.trackClick(shop.promotionId).catch((err) => console.error("Click error:", err));
                        }
                        navigate(`/business/${shop._id}`);
                      }}
                    >
                      {/* Main Content */}
                      <div className="p-5 flex-1 flex flex-col relative z-10">
                        {/* Header: Logo, Title, and Rating */}
                        <div className="flex items-start gap-3 mb-4">
                          {/* Logo (Left Corner) */}
                          <div className="w-14 h-14 bg-[#0a0f1a] rounded-xl border border-white/10 shadow-lg flex items-center justify-center text-2xl overflow-hidden shrink-0 group-hover:border-primary/50 transition-colors">
                            {shop.logo ? (
                              <img
                                src={shop.logo}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                alt=""
                              />
                            ) : (
                              "🏢"
                            )}
                          </div>

                          {/* Title and Category */}
                          <div className="flex-1 min-w-0 pt-1">
                            <h3 className="text-white text-lg font-bold mb-1 tracking-tight truncate group-hover:text-primary transition-colors">
                              {shop.businessName}
                            </h3>
                            <div className="text-[9px] font-black text-primary uppercase tracking-[0.2em]">
                              {shop.subCategory}
                            </div>
                          </div>

                          {/* Rating and Wishlist (Right Corner) */}
                          <div className="flex flex-col items-end gap-2 shrink-0">
                            <div className="flex items-center gap-1 bg-black/60 backdrop-blur-md px-2 py-1 rounded-lg border border-white/10 text-yellow-400 text-[10px] font-bold shadow-sm"
                              aria-label="Rating"
                            >
                              <HiStar className="text-[12px]" />
                              <span>{(shop.rating || 0.0).toFixed(1)}</span>
                            </div>
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                              <WishlistButton type="business" id={shop._id} aria-label="Add to wishlist" />
                            </div>
                          </div>
                        </div>

                        {/* Tags */}
                        <div className="flex flex-wrap gap-1.5 mb-4">
                          {shop.isPromoted && (
                            <span className="bg-violet-500/10 border border-violet-500/20 text-violet-400 text-[9px] px-2 py-0.5 rounded-full font-bold">
                              Promoted
                            </span>
                          )}
                          <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold border ${shop.isOpenNow
                              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                              : "bg-slate-500/10 border-slate-500/20 text-slate-400"
                            }`}>
                            {shop.isOpenNow ? "Open Now" : "Closed"}
                          </span>
                          {shop.hasActiveOffers && (
                            <span className="bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[9px] px-2 py-0.5 rounded-full font-bold">
                              Offers
                            </span>
                          )}
                        </div>

                        <p className="text-slate-400 text-xs leading-relaxed line-clamp-2 mb-4 group-hover:text-slate-300 transition-colors">
                          {shop.description ||
                            "A verified local provider specializing in professional services."}
                        </p>

                        {/* Footer */}
                        <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2 flex-1 min-w-0 text-slate-400">
                            <HiOutlineMapPin className="text-sm shrink-0 group-hover:text-primary transition-colors" />
                            <span className="text-[10px] truncate font-medium">
                              {shop.locationAddress || shop.address || "Location not available"}
                            </span>
                          </div>
                          
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (isCompareMode) {
                                toggleSelection(shop._id);
                              } else {
                                navigate(`/business/${shop._id}`);
                              }
                            }}
                            className={`shrink-0 text-[10px] font-bold px-4 py-2 rounded-lg transition-all ${isCompareMode
                                ? selectedIds.includes(shop._id)
                                  ? "bg-primary text-white shadow-md shadow-primary/20"
                                  : "bg-white/5 text-white hover:bg-white/10"
                                : "bg-white/5 text-white hover:bg-primary shadow-sm hover:shadow-md hover:shadow-primary/20"
                              }`}
                          >
                            {isCompareMode
                              ? selectedIds.includes(shop._id)
                                ? "Selected ✓"
                                : "+ Compare"
                              : "View"}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {viewMode === "map" && loading && (
            <div className="h-155 rounded-2xl border border-[#1f2a3d] bg-white/2 animate-pulse flex items-center justify-center">
              <p className="text-slate-600 text-sm font-semibold">
                Loading map…
              </p>
            </div>
          )}
        </div>
      </div>


    </div>
  );
};

export default Services;
