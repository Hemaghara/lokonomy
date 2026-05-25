import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { priceComparisonService } from "../services";
import { useLocation } from "../context/LocationContext";
import toast from "react-hot-toast";
import {
  HiOutlineSearch,
  HiOutlineTag,
  HiOutlineStar,
  HiOutlineLocationMarker,
  HiOutlineSortAscending,
  HiOutlineSortDescending,
  HiOutlineCurrencyRupee,
  HiOutlineTrendingUp
} from "react-icons/hi";

const getDistance = (lat1, lon1, lat2, lon2) => {
  if (lat1 === undefined || lon1 === undefined || lat2 === undefined || lon2 === undefined) return null;
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const PriceComparison = () => {
  const navigate = useNavigate();
  const { coords } = useLocation();

  const [searchQuery, setSearchQuery] = useState("");
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [sortBy, setSortBy] = useState("price_asc");

  const categories = ["Electronics", "Fashion", "Grocery", "Home decor", "Services", "Books"];

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) {
      return toast.error("Please enter a product name to search");
    }

    setLoading(true);
    try {
      const res = await priceComparisonService.comparePrices({ q: searchQuery });
      const rawProducts = res.data.products || [];

      const processed = rawProducts.map((p) => {
        let distance = null;
        if (coords && p.business?.location?.coordinates) {
          const [lon, lat] = p.business.location.coordinates;
          distance = getDistance(coords.lat, coords.lng, lat, lon);
        }
        return { ...p, distance };
      });

      setProducts(processed);
      setHasSearched(true);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch price comparisons");
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryClick = async (cat) => {
    setSearchQuery(cat);
    setLoading(true);
    try {
      const res = await priceComparisonService.comparePrices({ category: cat });
      const rawProducts = res.data.products || [];

      const processed = rawProducts.map((p) => {
        let distance = null;
        if (coords && p.business?.location?.coordinates) {
          const [lon, lat] = p.business.location.coordinates;
          distance = getDistance(coords.lat, coords.lng, lat, lon);
        }
        return { ...p, distance };
      });

      setProducts(processed);
      setHasSearched(true);
    } catch (err) {
      console.error(err);
      toast.error("Failed to compare items in this category");
    } finally {
      setLoading(false);
    }
  };

  const lowestPrice = products.length > 0 ? Math.min(...products.map((p) => p.price)) : null;

  const sortedProducts = [...products].sort((a, b) => {
    if (sortBy === "price_asc") {
      return a.price - b.price;
    }
    if (sortBy === "price_desc") {
      return b.price - a.price;
    }
    if (sortBy === "distance") {
      if (a.distance === null) return 1;
      if (b.distance === null) return -1;
      return a.distance - b.distance;
    }
    if (sortBy === "rating") {
      const aRating = a.business?.rating || 0;
      const bRating = b.business?.rating || 0;
      return bRating - aRating;
    }
    return 0;
  });

  return (
    <div className="min-h-screen bg-[#080e1a] pt-24 pb-20 text-white">
      <div className="max-w-5xl mx-auto px-4">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs mb-4">
            <HiOutlineTrendingUp /> Compare Prices Locally
          </div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight mb-3">
            Local Price{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-indigo-400">
              Comparison
            </span>
          </h1>
          <p className="text-slate-400 text-sm max-w-lg mx-auto">
            Search for any item to compare prices across nearby shops. Find the best deal and support your local merchants.
          </p>
        </div>

        <form onSubmit={handleSearch} className="mb-8 max-w-2xl mx-auto">
          <div className="relative flex items-center bg-[#111827] border border-[#1f2a3d] rounded-3xl overflow-hidden p-1.5 focus-within:border-violet-500/50 transition-all shadow-xl shadow-black/20">
            <HiOutlineSearch className="text-slate-400 text-xl ml-4 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="What product are you looking for today? (e.g. Milk, Cake, Shoes...)"
              className="w-full bg-transparent border-0 outline-none text-sm px-3 py-3.5 placeholder-slate-500 text-white"
            />
            <button
              type="submit"
              disabled={loading}
              className="bg-gradient-to-r from-violet-500 to-indigo-500 hover:from-violet-600 hover:to-indigo-600 text-white font-bold text-xs uppercase tracking-widest px-6 py-3.5 rounded-2xl transition-all"
            >
              {loading ? "Searching..." : "Compare"}
            </button>
          </div>
        </form>

        <div className="flex flex-wrap justify-center gap-2.5 mb-12">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => handleCategoryClick(cat)}
              className="px-4 py-2 rounded-full bg-[#111827] border border-[#1f2a3d] hover:border-violet-500/30 text-xs font-bold text-slate-300 hover:text-white transition-all"
            >
              🏷️ {cat}
            </button>
          ))}
        </div>

        {hasSearched && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-[#1f2a3d]">
            <p className="text-slate-400 text-xs font-semibold">
              Found <span className="text-white font-black">{products.length}</span> matching listings near you
            </p>

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                Sort By:
              </span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-[#111827] border border-[#1f2a3d] rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none cursor-pointer"
              >
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                {coords && <option value="distance">Distance: Nearest First</option>}
                <option value="rating">Shop Rating: High to Low</option>
              </select>
            </div>
          </div>
        )}

        <AnimatePresence mode="wait">
          {loading ? (
            <div className="py-20 text-center">
              <div className="w-10 h-10 border-2 border-violet-500/20 border-t-violet-500 rounded-full animate-spin mx-auto mb-4" />
              <p className="text-slate-500 text-xs font-black uppercase tracking-widest animate-pulse">
                Comparing Prices...
              </p>
            </div>
          ) : !hasSearched ? (
            <div className="py-12 text-center text-slate-600 text-xs uppercase tracking-widest font-black">
              Enter a search query above to see comparisons
            </div>
          ) : sortedProducts.length === 0 ? (
            <div className="text-center py-16 bg-[#111827] border border-[#1f2a3d] rounded-[2rem]">
              <div className="text-3xl mb-3">🔍</div>
              <h3 className="text-white font-bold mb-1">No products found</h3>
              <p className="text-slate-500 text-xs max-w-xs mx-auto">
                No shops seem to list this product near you. Try checking another keyword.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {sortedProducts.map((p, index) => {
                const isBestDeal = p.price === lowestPrice;
                const images = p.productImages || [];
                const mainImage = images[0] || p.productImage;

                return (
                  <motion.div
                    key={p._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`bg-[#111827] border ${
                      isBestDeal ? "border-emerald-500/40 shadow-emerald-500/5 shadow-lg" : "border-[#1f2a3d]"
                    } rounded-3xl p-5 flex flex-col md:flex-row items-center justify-between gap-6 hover:border-violet-500/30 transition-all`}
                  >
                    <div className="flex gap-4 items-center w-full md:w-auto">
                      <div className="w-20 h-20 bg-[#0d1424] rounded-2xl overflow-hidden border border-white/5 shrink-0">
                        {mainImage ? (
                          <img
                            src={mainImage}
                            alt={p.productName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-700 text-[10px]">
                            No Image
                          </div>
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className="text-white font-black text-base truncate max-w-[200px] md:max-w-xs">
                            {p.productName}
                          </h3>
                          {isBestDeal && (
                            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] font-black uppercase tracking-wider animate-pulse">
                              💎 Best Deal
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-xs text-slate-400 flex-wrap">
                          <span className="font-semibold text-slate-300">
                            Sold by:{" "}
                            <Link
                              to={`/business/${p.business?._id}`}
                              className="text-violet-400 hover:underline font-bold"
                            >
                              {p.business?.businessName}
                            </Link>
                          </span>
                          <span className="text-slate-600">•</span>
                          <span className="flex items-center gap-0.5 text-amber-400 font-bold">
                            <HiOutlineStar className="text-amber-500" />
                            {p.business?.rating?.toFixed(1) || "5.0"}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 mt-2.5 text-[11px] text-slate-500 font-medium">
                          <HiOutlineLocationMarker className="text-violet-400 text-sm" />
                          <span>
                            {p.business?.district}, {p.business?.taluka}
                          </span>
                          {p.distance !== null && (
                            <>
                              <span className="text-slate-700 font-black">•</span>
                              <span className="text-slate-400 font-bold">
                                {p.distance.toFixed(1)} km away
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between md:justify-end gap-6 w-full md:w-auto border-t md:border-t-0 border-white/5 pt-4 md:pt-0">
                      <div>
                        <div className="text-slate-500 text-[9px] font-black uppercase tracking-widest text-right mb-0.5">
                          Price
                        </div>
                        <div className="text-2xl font-black text-white flex items-center justify-end">
                          <HiOutlineCurrencyRupee className="text-slate-400 text-lg" />
                          {p.price.toLocaleString()}
                        </div>
                      </div>

                      <button
                        onClick={() => navigate(`/market/product/${p._id}`)}
                        className="bg-white hover:bg-violet-500 hover:text-white text-black font-black text-[10px] uppercase tracking-widest px-5 py-3.5 rounded-2xl transition-all shadow-md shrink-0"
                      >
                        View Details
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default PriceComparison;
