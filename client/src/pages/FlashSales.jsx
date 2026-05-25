import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { flashSaleService, businessService, marketService } from "../services";
import { useUser } from "../context/UserContext";
import toast from "react-hot-toast";
import {
  HiOutlineLightningBolt,
  HiOutlineClock,
  HiOutlineCalendar,
  HiOutlineInbox,
  HiOutlinePlus,
  HiOutlineCurrencyRupee,
  HiOutlineTrash,
  HiOutlineExclamation
} from "react-icons/hi";

const CountdownTimer = ({ targetDate, type, onComplete }) => {
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const intervalRef = useRef(null);

  useEffect(() => {
    const calculateTime = () => {
      const difference = new Date(targetDate) - new Date();
      if (difference <= 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
        if (intervalRef.current) clearInterval(intervalRef.current);
        if (onComplete) onComplete();
        return;
      }

      const hours = Math.floor(difference / (1000 * 60 * 60));
      const minutes = Math.floor((difference / 1000 / 60) % 60);
      const seconds = Math.floor((difference / 1000) % 60);

      setTimeLeft({ hours, minutes, seconds });
    };

    calculateTime();
    intervalRef.current = setInterval(calculateTime, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [targetDate]);

  const padZero = (num) => String(num).padStart(2, "0");

  return (
    <div className="flex items-center gap-1.5 text-xs font-bold font-mono">
      <span className="text-[10px] uppercase font-black tracking-wider text-slate-500 mr-1">
        {type === "active" ? "Ends in" : "Starts in"}:
      </span>
      <span className="px-2 py-1 rounded bg-[#0d1424] border border-white/5 text-amber-400">
        {padZero(timeLeft.hours)}h
      </span>
      <span>:</span>
      <span className="px-2 py-1 rounded bg-[#0d1424] border border-white/5 text-amber-400">
        {padZero(timeLeft.minutes)}m
      </span>
      <span>:</span>
      <span className="px-2 py-1 rounded bg-[#0d1424] border border-white/5 text-amber-400">
        {padZero(timeLeft.seconds)}s
      </span>
    </div>
  );
};

const FlashSales = () => {
  const navigate = useNavigate();
  const { user } = useUser();

  const [activeTab, setActiveTab] = useState("live");
  const [activeSales, setActiveSales] = useState([]);
  const [scheduledSales, setScheduledSales] = useState([]);
  const [sellerSales, setSellerSales] = useState([]);
  const [myBusinesses, setMyBusinesses] = useState([]);
  const [myProducts, setMyProducts] = useState([]);
  const [hasBusiness, setHasBusiness] = useState(false);
  const [loading, setLoading] = useState(true);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    productId: "",
    salePrice: "",
    startTime: "",
    endTime: "",
    maxQuantity: "",
  });

  useEffect(() => {
    fetchFlashSales();
    if (user) {
      checkSellerStatus();
    }
  }, [user]);

  const fetchFlashSales = async () => {
    try {
      const res = await flashSaleService.getFlashSales();
      setActiveSales(res.data.active || []);
      setScheduledSales(res.data.scheduled || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load flash sales");
    } finally {
      setLoading(false);
    }
  };

  const checkSellerStatus = async () => {
    try {
      const bizRes = await businessService.getMyBusinesses();
      const userHasBiz = bizRes.data && bizRes.data.length > 0;
      setHasBusiness(userHasBiz);
      setMyBusinesses(bizRes.data || []);

      if (userHasBiz) {
        const sellerSalesRes = await flashSaleService.getSellerFlashSales();
        setSellerSales(sellerSalesRes.data.flashSales || []);

        const productsRes = await marketService.getSellerProducts();
        setMyProducts(productsRes.data.products || productsRes.data || []);
      }
    } catch (err) {
      console.error("Error setting up seller info:", err);
    }
  };

  const handleCreateFlashSale = async (e) => {
    e.preventDefault();
    if (!formData.productId || !formData.salePrice || !formData.startTime || !formData.endTime || !formData.maxQuantity) {
      return toast.error("Please fill in all fields");
    }

    const selectedProduct = myProducts.find(p => p._id === formData.productId);
    if (selectedProduct && parseFloat(formData.salePrice) >= selectedProduct.price) {
      return toast.error("Sale price must be lower than original price");
    }

    setSubmitting(true);
    try {
      await flashSaleService.createFlashSale(formData);
      toast.success("Flash sale created successfully!");
      setShowCreateModal(false);
      setFormData({
        productId: "",
        salePrice: "",
        startTime: "",
        endTime: "",
        maxQuantity: "",
      });
      fetchFlashSales();
      checkSellerStatus();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create flash sale");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelSale = async (id) => {
    if (!window.confirm("Are you sure you want to cancel this flash sale?")) return;
    try {
      await flashSaleService.cancelFlashSale(id);
      toast.success("Flash sale cancelled");
      fetchFlashSales();
      checkSellerStatus();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to cancel flash sale");
    }
  };

  const handleProductChange = (productId) => {
    const prod = myProducts.find(p => p._id === productId);
    setFormData(prev => ({
      ...prev,
      productId,
      salePrice: prod ? Math.round(prod.price * 0.8) : ""
    }));
  };

  const activeProduct = myProducts.find(p => p._id === formData.productId);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080e1a] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
          <span className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] animate-pulse">
            Loading Flash Deals...
          </span>
        </div>
      </div>
    );
  }

  const currentList =
    activeTab === "live"
      ? activeSales
      : activeTab === "upcoming"
      ? scheduledSales
      : sellerSales;

  return (
    <div className="min-h-screen bg-[#080e1a] pt-24 pb-20 text-white">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <HiOutlineLightningBolt className="text-amber-400 text-lg animate-bounce" />
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-[0.2em]">
                Time-Limited Super Deals
              </span>
            </div>
            <h1 className="text-white font-black text-3xl md:text-5xl tracking-tight mb-2">
              Lokonomy{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400">
                Flash Sales
              </span>
            </h1>
            <p className="text-slate-400 text-sm max-w-xl">
              Grab premium products from top local businesses at direct discounts. Unbeatable prices, but only for a few hours!
            </p>
          </div>

          {hasBusiness && (
            <button
              onClick={() => {
                if (!user) {
                  toast.error("Please login to create flash sales");
                  return navigate("/login");
                }
                setShowCreateModal(true);
              }}
              className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-black font-black text-xs uppercase tracking-widest px-6 py-4 rounded-2xl transition-all shadow-xl shadow-amber-500/10 flex items-center gap-2 self-start md:self-auto"
            >
              <HiOutlinePlus className="text-base" /> Create Flash Sale
            </button>
          )}
        </div>

        <div className="flex border-b border-[#1f2a3d] mb-8 overflow-x-auto whitespace-nowrap">
          <button
            onClick={() => setActiveTab("live")}
            className={`px-6 py-4 text-xs font-black uppercase tracking-widest transition-all border-b-2 ${
              activeTab === "live"
                ? "border-amber-500 text-white"
                : "border-transparent text-slate-500 hover:text-slate-300"
            }`}
          >
            🔥 Live Deals ({activeSales.length})
          </button>
          <button
            onClick={() => setActiveTab("upcoming")}
            className={`px-6 py-4 text-xs font-black uppercase tracking-widest transition-all border-b-2 ${
              activeTab === "upcoming"
                ? "border-amber-500 text-white"
                : "border-transparent text-slate-500 hover:text-slate-300"
            }`}
          >
            ⏰ Coming Soon ({scheduledSales.length})
          </button>
          {hasBusiness && (
            <button
              onClick={() => setActiveTab("seller")}
              className={`px-6 py-4 text-xs font-black uppercase tracking-widest transition-all border-b-2 ${
                activeTab === "seller"
                  ? "border-amber-500 text-white"
                  : "border-transparent text-slate-500 hover:text-slate-300"
              }`}
            >
              💼 My Campaigns ({sellerSales.length})
            </button>
          )}
        </div>

        <AnimatePresence mode="wait">
          {currentList.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-center py-20 bg-[#111827] border border-[#1f2a3d] rounded-[2rem] shadow-2xl"
            >
              <div className="text-4xl mb-4 opacity-40">⚡</div>
              <h3 className="text-lg font-bold mb-2">No deals found here</h3>
              <p className="text-slate-500 text-xs max-w-xs mx-auto">
                {activeTab === "live"
                  ? "There are no live flash sales running right now. Keep checking back or view upcoming sales!"
                  : activeTab === "upcoming"
                  ? "No scheduled flash sales. Business owners, create yours now!"
                  : "You haven't scheduled any flash sale campaigns yet."}
              </p>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {currentList.map((sale) => {
                const product = sale.productId;
                const business = sale.businessId;
                if (!product) return null;

                const images = product.productImages || [];
                const mainImage = images[0] || product.productImage;
                const discount = Math.round(
                  ((sale.originalPrice - sale.salePrice) / sale.originalPrice) * 100
                );

                const soldPercentage = Math.round((sale.soldCount / sale.maxQuantity) * 100);

                return (
                  <motion.div
                    key={sale._id}
                    className="bg-[#111827] border border-[#1f2a3d] rounded-3xl overflow-hidden hover:border-amber-500/30 transition-all flex flex-col group relative"
                  >
                    <div className="absolute top-4 left-4 z-10 px-3 py-1.5 rounded-full bg-rose-600 text-white text-[10px] font-black uppercase tracking-wider shadow-lg">
                      🔥 {discount}% OFF
                    </div>

                    <div className="h-48 bg-[#0d1424] relative overflow-hidden border-b border-[#1f2a3d]">
                      {mainImage ? (
                        <img
                          src={mainImage}
                          alt={product.productName}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-600 text-xs">
                          No Product Image
                        </div>
                      )}
                    </div>

                    <div className="p-5 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start gap-2 mb-2">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest truncate max-w-[150px]">
                            {business?.businessName || "Local Shop"}
                          </span>
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                            {business?.district || "Nearby"}
                          </span>
                        </div>

                        <h3 className="text-white font-extrabold text-base mb-3 group-hover:text-amber-400 transition-colors line-clamp-1">
                          {product.productName}
                        </h3>

                        <div className="mb-4 pb-4 border-b border-white/5">
                          <CountdownTimer
                            targetDate={sale.status === "scheduled" ? sale.startTime : sale.endTime}
                            type={sale.status}
                            onComplete={fetchFlashSales}
                          />
                        </div>

                        <div className="flex items-baseline gap-2.5 mb-4">
                          <span className="text-2xl font-black text-emerald-400 flex items-center">
                            <HiOutlineCurrencyRupee />
                            {sale.salePrice}
                          </span>
                          <span className="text-xs text-slate-500 line-through flex items-center">
                            <HiOutlineCurrencyRupee />
                            {sale.originalPrice}
                          </span>
                        </div>

                        {sale.status === "active" && (
                          <div className="mb-5">
                            <div className="flex justify-between text-[10px] font-black uppercase text-slate-500 mb-1">
                              <span>Claimed</span>
                              <span className="text-slate-300">
                                {sale.soldCount} / {sale.maxQuantity}
                              </span>
                            </div>
                            <div className="w-full bg-[#0d1424] h-1.5 rounded-full overflow-hidden border border-white/5">
                              <div
                                className="h-full bg-gradient-to-r from-amber-500 to-rose-500"
                                style={{ width: `${soldPercentage}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      <div>
                        {activeTab === "seller" ? (
                          <button
                            onClick={() => handleCancelSale(sale._id)}
                            disabled={sale.status === "ended" || sale.status === "cancelled"}
                            className="w-full py-3 rounded-2xl bg-rose-500/10 hover:bg-rose-600 border border-rose-500/20 text-rose-400 hover:text-white font-bold text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:pointer-events-none"
                          >
                            <HiOutlineTrash /> Cancel Deal
                          </button>
                        ) : sale.status === "active" ? (
                          <button
                            onClick={() => navigate(`/market/product/${product._id}`)}
                            disabled={sale.soldCount >= sale.maxQuantity}
                            className="w-full py-3.5 rounded-2xl bg-white hover:bg-amber-400 text-black font-black text-xs uppercase tracking-widest transition-all shadow-lg hover:shadow-amber-500/10 disabled:opacity-50 disabled:pointer-events-none"
                          >
                            {sale.soldCount >= sale.maxQuantity ? "Sold Out" : "Buy Deal Now"}
                          </button>
                        ) : (
                          <button
                            disabled
                            className="w-full py-3.5 rounded-2xl bg-slate-800 text-slate-500 font-black text-xs uppercase tracking-widest border border-white/5 cursor-not-allowed text-center"
                          >
                            Coming Soon
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showCreateModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-[#111827] border border-[#1f2a3d] rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl"
              >
                <div className="p-6 sm:p-8">
                  <h2 className="text-2xl font-black mb-1 flex items-center gap-2">
                    <HiOutlineLightningBolt className="text-amber-400" /> Start Flash Deal
                  </h2>
                  <p className="text-slate-400 text-xs mb-6">
                    Boost sales on specific products by offering deep discounts for a few hours.
                  </p>

                  <form onSubmit={handleCreateFlashSale} className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1.5">
                        Select Product
                      </label>
                      <select
                        value={formData.productId}
                        onChange={(e) => handleProductChange(e.target.value)}
                        required
                        className="w-full bg-[#0d1424] border border-[#1f2a3d] rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500 transition-colors"
                      >
                        <option value="">-- Choose one of your products --</option>
                        {myProducts.map(p => (
                          <option key={p._id} value={p._id}>
                            {p.productName} (Orig: ₹{p.price})
                          </option>
                        ))}
                      </select>
                    </div>

                    {activeProduct && (
                      <div className="p-3.5 bg-[#0d1424] border border-white/5 rounded-2xl flex items-center justify-between text-xs">
                        <span className="text-slate-400">Original Price:</span>
                        <span className="font-bold flex items-center text-slate-200 line-through">
                          <HiOutlineCurrencyRupee /> {activeProduct.price}
                        </span>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1.5">
                          Flash Price (₹)
                        </label>
                        <input
                          type="number"
                          value={formData.salePrice}
                          onChange={(e) => setFormData(p => ({ ...p, salePrice: e.target.value }))}
                          required
                          min="1"
                          placeholder="e.g. 199"
                          className="w-full bg-[#0d1424] border border-[#1f2a3d] rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500 transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1.5">
                          Item Slots
                        </label>
                        <input
                          type="number"
                          value={formData.maxQuantity}
                          onChange={(e) => setFormData(p => ({ ...p, maxQuantity: e.target.value }))}
                          required
                          min="1"
                          placeholder="e.g. 10"
                          className="w-full bg-[#0d1424] border border-[#1f2a3d] rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500 transition-colors"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1.5">
                        Start Time
                      </label>
                      <input
                        type="datetime-local"
                        value={formData.startTime}
                        onChange={(e) => setFormData(p => ({ ...p, startTime: e.target.value }))}
                        required
                        className="w-full bg-[#0d1424] border border-[#1f2a3d] rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500 transition-colors text-slate-300"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1.5">
                        End Time
                      </label>
                      <input
                        type="datetime-local"
                        value={formData.endTime}
                        onChange={(e) => setFormData(p => ({ ...p, endTime: e.target.value }))}
                        required
                        className="w-full bg-[#0d1424] border border-[#1f2a3d] rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500 transition-colors text-slate-300"
                      />
                    </div>

                    <div className="flex gap-3 pt-4 border-t border-white/5 mt-6">
                      <button
                        type="button"
                        onClick={() => setShowCreateModal(false)}
                        className="flex-1 py-3.5 rounded-2xl bg-[#0d1424] border border-[#1f2a3d] text-slate-400 hover:text-white font-bold text-xs uppercase tracking-widest transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={submitting}
                        className="flex-1 py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs uppercase tracking-widest transition-colors shadow-lg shadow-amber-500/10 disabled:opacity-50"
                      >
                        {submitting ? "Scheduling..." : "Launch Deal"}
                      </button>
                    </div>
                  </form>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default FlashSales;
