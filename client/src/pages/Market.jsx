import { Helmet } from "react-helmet-async";
import { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from "framer-motion";
import { marketService } from "../services";
import { useLocation } from "../context/LocationContext";
import { MARKET_CATEGORIES } from "../data/marketCategories";
import { useUser } from "../context/UserContext";
import {
  HiOutlineMagnifyingGlass,
  HiOutlineMapPin,
  HiOutlineTag,
  HiOutlineCurrencyRupee,
  HiOutlinePlus,
  HiOutlineArrowRight,
  HiOutlineSquares2X2,
  HiOutlineHome,
  HiOutlineDevicePhoneMobile,
  HiOutlineTruck,
  HiOutlineWrenchScrewdriver,
  HiOutlineSparkles,
  HiOutlineXMark,
  HiOutlineComputerDesktop,
  HiOutlineHeart,
  HiOutlineBriefcase,
  HiOutlineMusicalNote,
  HiOutlineBookOpen,
  HiOutlineCake,
  HiOutlineGlobeAlt,
  HiOutlineCamera,
  HiOutlineSwatch,
  HiOutlineBuildingOffice2,
  HiOutlineBeaker,
  HiOutlineSun,
  HiStar,
} from "react-icons/hi2";
import {
  FiPackage,
  FiScissors,
  FiAnchor,
  FiMonitor,
  FiDroplet,
  FiChevronLeft,
  FiChevronRight,
} from "react-icons/fi";
import {
  GiSofa,
  GiClothes,
  GiCow,
  GiFarmer,
  GiDiamondRing,
  GiWeight,
} from "react-icons/gi";
import {
  MdOutlineSportsSoccer,
  MdOutlinePets,
  MdOutlineAgriculture,
  MdOutlineElectricBolt,
  MdOutlineToys,
  MdOutlineMedicalServices,
} from "react-icons/md";
import WishlistButton from "../components/WishlistButton";
import { MarketSkeleton } from "../components/Skeleton";
import Pagination from "../components/Pagination";
import {
  TbCar,
  TbBike,
  TbTractor,
  TbBuilding,
  TbPlant,
  TbToolsKitchen2,
  TbAirConditioning,
  TbSofa,
} from "react-icons/tb";


const Market = () => {
  const navigate = useNavigate();
  const { district, taluka } = useLocation();
  const { user } = useUser();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [radius, setRadius] = useState(5000);
  const [filter, setFilter] = useState({ category: "All", priceType: "All" });
  const [searchQuery, setSearchQuery] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });

  useEffect(() => {
    setPage(1);
  }, [filter, radius, minPrice, maxPrice, sortBy]);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        mainCategory: filter.category !== "All" ? filter.category : undefined,
        priceType: filter.priceType !== "All" ? filter.priceType : undefined,
        minPrice: minPrice || undefined,
        maxPrice: maxPrice || undefined,
        sortBy: sortBy !== "newest" ? sortBy : undefined,
        page,
        limit: 12,
      };

      if (user?.latitude && user?.longitude) {
        params.lat = user.latitude;
        params.lng = user.longitude;
        params.radius = radius;
      } else {
        params.district = district;
      }
      const response = await marketService.getProducts(params);
      const data = response.data;
      setProducts(Array.isArray(data) ? data : (data?.products || []));
      if (data?.pagination) {
        setPagination(data.pagination);
      }
    } catch (err) {
      console.error("Market fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [district, filter, radius, user, page, minPrice, maxPrice, sortBy]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const categories = ["All", ...Object.keys(MARKET_CATEGORIES)];

  const priceTypes = [
    { label: "All", value: "All" },
    { label: "Sale", value: "sell" },
    { label: "Rent", value: "rent" },
  ];

  const filteredProducts = products.filter(
    (p) =>
      p.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const getCategoryIcon = (cat) => {
    const l = cat.toLowerCase();

    if (l === "all") return <HiOutlineSquares2X2 />;

    if (l.includes("car") || l.includes("automobile")) return <TbCar />;
    if (
      l.includes("bike") ||
      l.includes("motorcycle") ||
      l.includes("scooter") ||
      l.includes("two wheel")
    )
      return <TbBike />;
    if (
      l.includes("truck") ||
      l.includes("lorry") ||
      l.includes("van") ||
      l.includes("transport")
    )
      return <HiOutlineTruck />;
    if (l.includes("tractor") || l.includes("farm vehicle"))
      return <TbTractor />;
    if (l.includes("vehicle")) return <TbCar />;

    if (
      l.includes("propert") ||
      l.includes("real estate") ||
      l.includes("plot") ||
      l.includes("land") ||
      l.includes("flat") ||
      l.includes("apartment")
    )
      return <TbBuilding />;
    if (l.includes("house") || l.includes("villa") || l.includes("bungalow"))
      return <HiOutlineHome />;
    if (
      l.includes("commercial") ||
      l.includes("office space") ||
      l.includes("shop")
    )
      return <HiOutlineBuildingOffice2 />;

    if (l.includes("mobile") || l.includes("phone") || l.includes("smartphone"))
      return <HiOutlineDevicePhoneMobile />;
    if (
      l.includes("laptop") ||
      l.includes("computer") ||
      l.includes("desktop") ||
      l.includes("pc")
    )
      return <HiOutlineComputerDesktop />;
    if (
      l.includes("tv") ||
      l.includes("television") ||
      l.includes("monitor") ||
      l.includes("screen")
    )
      return <FiMonitor />;
    if (
      l.includes("electronic") ||
      l.includes("gadget") ||
      l.includes("device")
    )
      return <MdOutlineElectricBolt />;
    if (l.includes("camera") || l.includes("photo") || l.includes("optic"))
      return <HiOutlineCamera />;
    if (
      l.includes("ac") ||
      l.includes("air condition") ||
      l.includes("cooler") ||
      l.includes("refrigerator") ||
      l.includes("fridge")
    )
      return <TbAirConditioning />;

    if (
      l.includes("furniture") ||
      l.includes("sofa") ||
      l.includes("chair") ||
      l.includes("table") ||
      l.includes("bed")
    )
      return <TbSofa />;
    if (
      l.includes("home") ||
      l.includes("household") ||
      l.includes("interior") ||
      l.includes("decor")
    )
      return <HiOutlineHome />;
    if (
      l.includes("kitchen") ||
      l.includes("utensil") ||
      l.includes("cookware") ||
      l.includes("appliance")
    )
      return <TbToolsKitchen2 />;

    if (
      l.includes("cloth") ||
      l.includes("fashion") ||
      l.includes("apparel") ||
      l.includes("wear") ||
      l.includes("dress") ||
      l.includes("shirt") ||
      l.includes("saree")
    )
      return <GiClothes />;
    if (
      l.includes("jewel") ||
      l.includes("ornament") ||
      l.includes("gold") ||
      l.includes("silver") ||
      l.includes("diamond")
    )
      return <GiDiamondRing />;
    if (l.includes("tailor") || l.includes("stitch") || l.includes("sewing"))
      return <FiScissors />;
    if (l.includes("fabric") || l.includes("textile") || l.includes("material"))
      return <HiOutlineSwatch />;

    if (
      l.includes("agri") ||
      l.includes("farm") ||
      l.includes("crop") ||
      l.includes("seed") ||
      l.includes("fertilizer")
    )
      return <MdOutlineAgriculture />;
    if (
      l.includes("cattle") ||
      l.includes("cow") ||
      l.includes("goat") ||
      l.includes("livestock") ||
      l.includes("dairy")
    )
      return <GiCow />;
    if (
      l.includes("plant") ||
      l.includes("garden") ||
      l.includes("nursery") ||
      l.includes("flower") ||
      l.includes("tree")
    )
      return <TbPlant />;
    if (l.includes("farmer") || l.includes("kisan")) return <GiFarmer />;

    if (
      l.includes("sport") ||
      l.includes("cricket") ||
      l.includes("football") ||
      l.includes("game") ||
      l.includes("stadium")
    )
      return <MdOutlineSportsSoccer />;
    if (
      l.includes("fitness") ||
      l.includes("gym") ||
      l.includes("exercise") ||
      l.includes("weight")
    )
      return <GiWeight />;

    if (
      l.includes("medical") ||
      l.includes("health") ||
      l.includes("medicine") ||
      l.includes("pharma") ||
      l.includes("hospital")
    )
      return <MdOutlineMedicalServices />;
    if (
      l.includes("beauty") ||
      l.includes("cosmetic") ||
      l.includes("skin") ||
      l.includes("salon") ||
      l.includes("hair")
    )
      return <HiOutlineHeart />;

    if (
      l.includes("food") ||
      l.includes("grocery") ||
      l.includes("snack") ||
      l.includes("beverage") ||
      l.includes("sweets")
    )
      return <HiOutlineCake />;

    if (
      l.includes("book") ||
      l.includes("education") ||
      l.includes("study") ||
      l.includes("stationer") ||
      l.includes("school")
    )
      return <HiOutlineBookOpen />;

    if (
      l.includes("toy") ||
      l.includes("kids") ||
      l.includes("children") ||
      l.includes("baby") ||
      l.includes("infant")
    )
      return <MdOutlineToys />;

    if (
      l.includes("pet") ||
      l.includes("animal") ||
      l.includes("dog") ||
      l.includes("cat") ||
      l.includes("bird")
    )
      return <MdOutlinePets />;

    if (
      l.includes("music") ||
      l.includes("instrument") ||
      l.includes("guitar") ||
      l.includes("keyboard") ||
      l.includes("drum")
    )
      return <HiOutlineMusicalNote />;

    if (
      l.includes("tool") ||
      l.includes("hardware") ||
      l.includes("equipment") ||
      l.includes("machine") ||
      l.includes("spare")
    )
      return <HiOutlineWrenchScrewdriver />;

    if (l.includes("service") || l.includes("business") || l.includes("office"))
      return <HiOutlineBriefcase />;

    if (
      l.includes("solar") ||
      l.includes("energy") ||
      l.includes("power") ||
      l.includes("battery")
    )
      return <HiOutlineSun />;

    if (
      l.includes("water") ||
      l.includes("plumb") ||
      l.includes("pipe") ||
      l.includes("pump")
    )
      return <FiDroplet />;

    if (l.includes("chemical") || l.includes("lab") || l.includes("scientific"))
      return <HiOutlineBeaker />;

    if (
      l.includes("fish") ||
      l.includes("marine") ||
      l.includes("boat") ||
      l.includes("sea")
    )
      return <FiAnchor />;

    if (
      l.includes("travel") ||
      l.includes("tour") ||
      l.includes("trip") ||
      l.includes("holiday")
    )
      return <HiOutlineGlobeAlt />;

    return <HiOutlineSparkles />;
  };

  const card = "bg-[#111827] border border-[#1f2a3d] rounded-2xl";
  const inputCls =
    "w-full bg-[#0d1424] border border-[#1f2a3d] rounded-xl px-4 py-3 text-sm text-slate-200 outline-none transition-all focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 placeholder:text-slate-600";

  return (
    <div className="min-h-screen bg-[#080e1a] pt-24 pb-20">
      <Helmet>
        <title>Local Marketplace - Buy and Sell | Lokonomy</title>
        <meta
          name="description"
          content="Buy, sell, or rent local items within your community. Discover products for sale or rent near you on the Lokonomy Marketplace."
        />
      </Helmet>
      <style>{`
        .mk * { font-family: 'DM Sans', sans-serif; }
        .no-sb::-webkit-scrollbar { display: none; }
        .mk select option { background: #111827; color: #e2e8f0; }
      `}</style>

      <div className="mk w-[96%] max-w-none mx-auto px-2 sm:px-4 lg:px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8"
        >
          <div>
            <p className="text-violet-400 text-[11px] font-semibold uppercase tracking-widest mb-1">
              Resource Exchange
            </p>
            <h1 className="text-white font-bold text-3xl leading-tight">
              Marketplace
            </h1>
            <p className="text-slate-300 text-sm mt-1">
              Browse listings in{" "}
              <span className="text-slate-300 font-medium">
                {user?.locationName || taluka || district || "your area"}
              </span>
            </p>
          </div>

          <Link
            to="/market/sell"
            className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 active:scale-[.98] text-white text-xs font-semibold px-5 py-3 rounded-xl transition-all shadow-lg shadow-violet-900/30 self-start sm:self-auto"
          >
            <HiOutlinePlus className="text-base" /> List an Item
          </Link>
        </motion.div>

        <div className={`${card} p-4 mb-6 flex flex-col gap-4`}>
          <div className="relative">
            <HiOutlineMagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 text-base pointer-events-none" />
            <input
              id="searchQuery"
              name="searchQuery"
              type="text"
              placeholder="Search products…"
              className={inputCls + " pl-11"}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-md text-slate-500 hover:text-slate-300 transition-colors"
              >
                <HiOutlineXMark className="text-sm" />
              </button>
            )}
          </div>

          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
            <div className="flex items-center gap-3 overflow-x-auto no-sb w-full lg:w-auto pb-1">
              {user?.latitude && (
                <div className="flex items-center gap-2 bg-[#0d1424] border border-[#1f2a3d] rounded-xl px-3 py-2 shrink-0">
        
                  <label
                    htmlFor="radius"
                    className="text-[10px] font-bold text-slate-500 uppercase tracking-tight"
                  >
                    Radius
                  </label>
                  <select
                    id="radius"
                    name="radius"
                    aria-label="Select radius"
                    value={radius}
                    onChange={(e) => setRadius(Number(e.target.value))}
                    className="bg-transparent text-xs font-bold text-violet-400 outline-none cursor-pointer"
                  >
                    <option value={5000}>5 KM</option>
                    <option value={10000}>10 KM</option>
                    <option value={15000}>15 KM</option>
                    <option value={20000}>20 KM</option>
                    <option value={25000}>25 KM</option>
                    <option value={50000}>50 KM</option>
                  </select>
                </div>
              )}
              <div className="flex items-center gap-1 bg-[#0d1424] border border-[#1f2a3d] rounded-xl p-1 shrink-0">
                {priceTypes.map((type) => (
                  <button
                    key={type.value}
                    onClick={() =>
                      setFilter({ ...filter, priceType: type.value })
                    }
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all
                      ${
                        filter.priceType === type.value
                          ? "bg-violet-600 text-white shadow-md shadow-violet-900/30"
                          : "text-slate-300 hover:text-white"
                      }`}
                  >
                    {type.value === "sell" && (
                      <HiOutlineTag className="text-sm" />
                    )}
                    {type.value === "rent" && (
                      <HiOutlineHome className="text-sm" />
                    )}
                    {type.value === "All" && (
                      <HiOutlineSquares2X2 className="text-sm" />
                    )}
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

              <div className="hidden lg:block w-px h-7 bg-[#1f2a3d] shrink-0" />

              <div className="flex items-center gap-2 bg-[#0d1424] border border-[#1f2a3d] rounded-xl px-2 py-1 shrink-0">
                <input
                  type="number"
                  placeholder="Min ₹"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="w-20 bg-transparent text-xs text-white placeholder-slate-600 outline-none px-1"
                />
                <span className="text-slate-600">-</span>
                <input
                  type="number"
                  placeholder="Max ₹"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="w-20 bg-transparent text-xs text-white placeholder-slate-600 outline-none px-1"
                />
              </div>

              <div className="flex items-center gap-2 bg-[#0d1424] border border-[#1f2a3d] rounded-xl px-3 py-2 shrink-0">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">Sort</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-transparent text-xs font-bold text-violet-400 outline-none cursor-pointer"
                >
                  <option value="newest">Newest First</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                </select>
              </div>

            <div className="hidden lg:block w-px h-7 bg-[#1f2a3d] shrink-0" />

            <div className="no-sb flex items-center gap-2 overflow-x-auto w-full lg:flex-1 pb-1">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFilter({ ...filter, category: cat })}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border shrink-0
                    ${
                      filter.category === cat
                        ? "bg-violet-600 text-white border-violet-600 shadow-md shadow-violet-900/30"
                        : "bg-[#0d1424] text-slate-300 border-[#1f2a3d] hover:text-white hover:border-slate-500"
                    }`}
                >
                  <span
                    className={`text-base leading-none ${filter.category === cat ? "text-white" : "text-slate-400"}`}
                  >
                    {getCategoryIcon(cat)}
                  </span>
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>
        {!loading && (
          <p className="text-slate-600 text-xs mb-4">
            {filteredProducts.length} listing
            {filteredProducts.length !== 1 ? "s" : ""} found
            {searchQuery && (
              <span>
                {" "}
                for "<span className="text-slate-400">{searchQuery}</span>"
              </span>
            )}
          </p>
        )}

        <div className="min-h-64">
          {loading ? (
            <MarketSkeleton />
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 min-[1920px]:grid-cols-6 min-[2560px]:grid-cols-8 min-[3840px]:grid-cols-12 min-[5120px]:grid-cols-16 min-[7680px]:grid-cols-24 gap-4 sm:gap-6 lg:gap-8">
                <AnimatePresence mode="popLayout">
                  {filteredProducts.map((p) => (
                    <motion.div
                      layout
                      key={p._id}
                      initial={{ opacity: 0, scale: 0.97 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.97 }}
                      transition={{ duration: 0.18 }}
                      className="group relative bg-[#0d1424] border border-[#1f2a3d] rounded-2xl overflow-hidden hover:border-violet-500/40 hover:-translate-y-1 hover:shadow-[0_12px_40px_-15px_rgba(139,92,246,0.2)] transition-all duration-300 flex flex-col cursor-pointer"
                      onClick={() => navigate(`/market/product/${p._id}`)}
                    >
                      <div
                        className={`relative aspect-[4/3] overflow-hidden bg-[#0a0f1a] ${p.isFeatured ? "border-b-2 border-violet-500" : "border-b border-[#1f2a3d]"}`}
                      >
                        {p.productImages?.[0] || p.productImage ? (
                          <img
                            src={p.productImages?.[0] || p.productImage}
                            alt={p.productName}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <FiPackage className="text-5xl text-slate-700" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0d1424] via-transparent to-transparent opacity-90" />

                        <div className="absolute top-3 left-3 flex flex-col gap-2">
                          {p.isFeatured && (
                            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-[10px] font-black uppercase tracking-widest shadow-lg">
                              <HiOutlineSparkles className="text-sm animate-pulse" />{" "}
                              Featured
                            </span>
                          )}
                          <span
                            className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider shadow-lg backdrop-blur-md
                            ${
                              p.priceType === "sell"
                                ? "bg-violet-500/90 text-white border border-violet-400/20"
                                : "bg-emerald-500/90 text-white border border-emerald-400/20"
                            }`}
                          >
                            {p.priceType === "sell" ? (
                              <>
                                <HiOutlineTag className="text-[11px]" /> Sale
                              </>
                            ) : (
                              <>
                                <HiOutlineHome className="text-[11px]" /> Rent
                              </>
                            )}
                          </span>
                        </div>

                        <div className="absolute top-3 right-3 z-10 bg-[#0d1424]/60 backdrop-blur-md rounded-full border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <WishlistButton type="product" id={p._id} />
                        </div>
                      </div>

                      <div className="p-4 flex flex-col flex-1 relative z-10 bg-[#0d1424]">
                        <p className="text-[11px] text-violet-400 font-bold uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                          <span className="text-[13px]">
                            {getCategoryIcon(
                              p.subCategory || p.mainCategory || "",
                            )}
                          </span>
                          <span className="truncate">{p.subCategory}</span>
                        </p>

                        <h3 className="text-white font-semibold text-[15px] leading-snug line-clamp-2 mb-2 group-hover:text-violet-400 transition-colors flex-1">
                          {p.productName}
                        </h3>

                        <div className="flex items-center gap-1.5 mb-4">
                          <div className="flex items-center gap-0.5">
                            {[...Array(5)].map((_, i) => (
                              <HiStar
                                key={i}
                                className={`text-[12px] ${i < Math.round(p.rating || 0) ? "text-amber-400" : "text-slate-700"}`}
                              />
                            ))}
                          </div>
                          <span className="text-slate-500 text-[10px] font-bold">
                            ({p.numReviews || 0})
                          </span>
                        </div>

                        <div className="mt-auto pt-3 border-t border-[#1f2a3d] flex flex-col gap-3">
                          <div className="flex items-center justify-between">
                            <div className="flex flex-col">
                              <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider mb-0.5">Price</span>
                              <span className="text-lg font-bold text-white tracking-tight flex items-center gap-1">
                                <HiOutlineCurrencyRupee className="text-emerald-400 text-[18px] shrink-0" />
                                {p.price?.toLocaleString() || "0"}
                                {p.priceType === "rent" && (
                                  <span className="text-[11px] text-slate-400 font-medium tracking-normal ml-0.5 lowercase">
                                    /{p.rentDuration || "day"}
                                  </span>
                                )}
                              </span>
                            </div>
                            <div className="w-8 h-8 rounded-full bg-[#161f33] border border-[#1f2a3d] flex items-center justify-center text-slate-400 group-hover:bg-violet-600 group-hover:text-white group-hover:border-violet-600 transition-all duration-300">
                              <HiOutlineArrowRight className="text-sm group-hover:translate-x-0.5 transition-transform" />
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400">
                            <HiOutlineMapPin className="text-[13px] text-rose-400 shrink-0" />
                            <span className="truncate">
                              {p.taluka ? `${p.taluka}, ${p.district}` : p.district}
                            </span>
                            {p.distance !== undefined && (
                              <span className="text-slate-600 shrink-0 mx-0.5">•</span>
                            )}
                            {p.distance !== undefined && (
                              <span className="text-slate-400 shrink-0">
                                {p.distance < 1
                                  ? "< 1 km"
                                  : `${Math.round(p.distance)} km`}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {filteredProducts.length === 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="border-2 border-dashed border-[#1f2a3d] rounded-2xl py-24 text-center"
                >
                  <h3 className="text-slate-500 font-semibold text-base mb-1">
                    No Products Found
                  </h3>
                  <p className="text-slate-600 text-xs mb-5">
                    Try adjusting your filters or search
                  </p>
                  <button
                    onClick={() => {
                      setFilter({ category: "All", priceType: "All" });
                      setSearchQuery("");
                      setMinPrice("");
                      setMaxPrice("");
                      setSortBy("newest");
                    }}
                    className="inline-flex items-center gap-2 bg-[#1a2540] hover:bg-[#1f2d4d] text-slate-300 text-xs font-semibold px-5 py-2.5 rounded-xl transition-all border border-[#1f2a3d]"
                  >
                    <HiOutlineXMark /> Clear Filters
                  </button>
                </motion.div>
              )}

              {filteredProducts.length > 0 && pagination.pages > 1 && (
                <Pagination
                  page={page}
                  totalPages={pagination.pages}
                  onPage={(p) => setPage(p)}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Market;
