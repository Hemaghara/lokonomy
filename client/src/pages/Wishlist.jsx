import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { wishlistService } from "../services";
import { useUser } from "../context/UserContext";
import {
  HiOutlineHeart,
  HiOutlineShoppingBag,
  HiOutlineBuildingStorefront,
  HiOutlineBriefcase,
  HiOutlineArrowLeft,
  HiOutlineTrash,
  HiOutlineMapPin,
  HiOutlineCurrencyRupee,
} from "react-icons/hi2";
import WishlistButton from "../components/WishlistButton";

const Wishlist = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const [wishlist, setWishlist] = useState({
    products: [],
    businesses: [],
    jobs: [],
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("products");

  useEffect(() => {
    if (user) {
      fetchWishlist();
    } else {
      navigate("/login");
    }
  }, [user]);

  const fetchWishlist = async () => {
    try {
      setLoading(true);
      const response = await wishlistService.getWishlist();
      if (response.success) {
        setWishlist(response.wishlist);
      }
    } catch (err) {
      console.error("Error fetching wishlist:", err);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: "products", label: "Products", icon: <HiOutlineShoppingBag />, count: wishlist.products.length },
    { id: "businesses", label: "Businesses", icon: <HiOutlineBuildingStorefront />, count: wishlist.businesses.length },
    { id: "jobs", label: "Jobs", icon: <HiOutlineBriefcase />, count: wishlist.jobs.length },
  ];

  const card = "bg-[#111827] border border-[#1f2a3d] rounded-2xl overflow-hidden group hover:border-violet-500/30 transition-all duration-300";

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080e1a] flex flex-col items-center justify-center gap-3">
        <div className="w-9 h-9 border-2 border-violet-500/20 border-t-violet-500 rounded-full animate-spin" />
        <p className="text-slate-500 text-xs font-medium uppercase tracking-widest">Loading Wishlist…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080e1a] pt-24 pb-20">
      <div className="max-w-6xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8"
        >
          <div>
            <p className="text-violet-400 text-[11px] font-semibold uppercase tracking-widest mb-1">My Collection</p>
            <h1 className="text-white font-bold text-3xl leading-tight flex items-center gap-2">
              <HiOutlineHeart className="text-rose-500" /> Wishlist
            </h1>
          </div>
          <Link
            to="/market"
            className="flex items-center gap-2 text-slate-500 hover:text-slate-300 text-xs font-medium transition-colors"
          >
            <HiOutlineArrowLeft /> continue exploring
          </Link>
        </motion.div>

        <div className="flex items-center gap-1 bg-[#111827] border border-[#1f2a3d] rounded-2xl p-1 mb-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-semibold transition-all
                ${
                  activeTab === tab.id
                    ? "bg-violet-600 text-white shadow-md shadow-violet-900/30"
                    : "text-slate-500 hover:text-slate-300"
                }`}
            >
              <span className="text-sm">{tab.icon}</span>
              {tab.label}
              <span className={`ml-1 px-1.5 py-0.5 rounded-md text-[10px] ${activeTab === tab.id ? "bg-white/20" : "bg-white/5"}`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
          >
            {wishlist[activeTab].length === 0 ? (
              <div className="border-2 border-dashed border-[#1f2a3d] rounded-3xl py-32 text-center bg-[#111827]/30">
               
                <h3 className="text-slate-400 font-bold text-xl mb-2">No Saved {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</h3>
                <p className="text-slate-600 text-sm mb-8">Items you save will appear here for easy access later.</p>
                <Link
                  to={activeTab === 'products' ? '/market' : activeTab === 'businesses' ? '/explore' : '/jobs'}
                  className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold px-6 py-3 rounded-xl transition-all"
                >
                  Start Exploring
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {activeTab === "products" && wishlist.products.map((p) => (
                  <motion.div layout key={p._id} className={card}>
                    <div className="relative aspect-video overflow-hidden bg-[#0d1424]">
                      <img src={p.productImages?.[0] || p.productImage} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="" />
                      <div className="absolute top-3 right-3">
                        <WishlistButton 
                          type="product" 
                          id={p._id} 
                          onToggle={(saved) => !saved && setWishlist(prev => ({...prev, products: prev.products.filter(item => item._id !== p._id)}))}
                        />
                      </div>
                    </div>
                    <div className="p-5">
                      <h3 className="text-white font-bold text-base mb-2 line-clamp-1 group-hover:text-violet-400 transition-colors">{p.productName}</h3>
                      <div className="flex items-center justify-between">
                        <span className="text-emerald-400 font-bold flex items-center">
                          <HiOutlineCurrencyRupee /> {p.price.toLocaleString()}
                        </span>
                        <button 
                          onClick={() => navigate(`/market/product/${p._id}`)}
                          className="text-[11px] font-bold text-violet-400 hover:text-white transition-colors"
                        >
                          View Listing →
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}

                {activeTab === "businesses" && wishlist.businesses.map((b) => (
                  <motion.div layout key={b._id} className={card}>
                    <div className="p-6 flex items-start gap-4">
                      <div className="w-16 h-16 rounded-xl bg-[#0d1424] border border-[#1f2a3d] shrink-0 flex items-center justify-center overflow-hidden">
                        {b.logo ? <img src={b.logo} className="w-full h-full object-cover" /> : "🏢"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-white font-bold text-base truncate group-hover:text-violet-400">{b.businessName}</h3>
                        <p className="text-slate-500 text-xs mb-1">{b.subCategory}</p>
                        <div className="flex items-center gap-1 text-[10px] text-slate-600">
                           <HiOutlineMapPin className="text-rose-500" /> {b.district}
                        </div>
                      </div>
                      <WishlistButton 
                        type="business" 
                        id={b._id} 
                        onToggle={(saved) => !saved && setWishlist(prev => ({...prev, businesses: prev.businesses.filter(item => item._id !== b._id)}))}
                      />
                    </div>
                    <div className="px-6 pb-6 mt-auto">
                      <button 
                        onClick={() => navigate(`/business/${b._id}`)}
                        className="w-full py-2.5 bg-[#0d1424] hover:bg-violet-600 text-slate-400 hover:text-white border border-[#1f2a3d] rounded-xl text-[11px] font-bold transition-all"
                      >
                        Visit Business
                      </button>
                    </div>
                  </motion.div>
                ))}

                {activeTab === "jobs" && wishlist.jobs.map((j) => (
                  <motion.div layout key={j._id} className={card}>
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div className="w-12 h-12 rounded-xl bg-[#0d1424] border border-[#1f2a3d] flex items-center justify-center">
                          <HiOutlineBriefcase className="text-violet-400 text-xl" />
                        </div>
                        <WishlistButton 
                          type="job" 
                          id={j._id} 
                          onToggle={(saved) => !saved && setWishlist(prev => ({...prev, jobs: prev.jobs.filter(item => item._id !== j._id)}))}
                        />
                      </div>
                      <h3 className="text-white font-bold text-base mb-1 group-hover:text-violet-400">{j.position}</h3>
                      <p className="text-emerald-400 font-bold text-sm mb-4">₹{j.salary}/month</p>
                      <div className="flex items-center gap-3 text-[11px] text-slate-500">
                        <span className="flex items-center gap-1 text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded-lg border border-rose-500/20">
                          <HiOutlineMapPin /> {j.location}
                        </span>
                        <span className="text-slate-600">·</span>
                        <span>{j.vacancies} vacancies</span>
                      </div>
                    </div>
                    <div className="px-6 pb-6">
                      <button 
                        onClick={() => navigate(`/jobs/${j._id}`)}
                        className="w-full py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-[11px] font-bold transition-all"
                      >
                        View Details
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Wishlist;
