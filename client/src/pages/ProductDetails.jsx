import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, useSearchParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { marketService, chatService, preOrderService } from "../services";
import { getSocket } from "../services/socket";
import recommendationService from "../services/recommendationService";
import { toast } from "react-hot-toast";
import { useUser } from "../context/UserContext";
import ChatBox from "../components/ChatBox";
import {
  HiOutlineArrowLeft,
  HiOutlineShare,
  HiOutlineMapPin,
  HiOutlineUser,
  HiOutlineTag,
  HiOutlineHome,
  HiOutlineCurrencyRupee,
  HiOutlinePhone,
  HiOutlineChatBubbleLeftRight,
  HiOutlineShoppingBag,
  HiOutlineClipboardDocument,
  HiOutlineCheckCircle,
  HiOutlineShoppingCart,
  HiStar,
} from "react-icons/hi2";
import WishlistButton from "../components/WishlistButton";
import ReportModal from "../components/ReportModal";
import { FiFlag } from "react-icons/fi";
import { ProductDetailsSkeleton } from "../components/Skeleton";

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useUser();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [copied, setCopied] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [sellerChats, setSellerChats] = useState([]);
  const [activeBuyerId, setActiveBuyerId] = useState(null);
  const [activeBuyerName, setActiveBuyerName] = useState("");
  const [activeTab, setActiveTab] = useState("details");
  const [productReview, setProductReview] = useState({
    rating: 5,
    comment: "",
  });
  const [submittingProduct, setSubmittingProduct] = useState(false);
  const [reviewsData, setReviewsData] = useState(null);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [bidAmount, setBidAmount] = useState("");
  const [submittingBid, setSubmittingBid] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [showPreOrderForm, setShowPreOrderForm] = useState(false);
  const [preOrderQty, setPreOrderQty] = useState(1);
  const [pickupDate, setPickupDate] = useState("");
  const [pickupTime, setPickupTime] = useState("");
  const [preOrderNotes, setPreOrderNotes] = useState("");
  const [submittingPreOrder, setSubmittingPreOrder] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    if (!product || !product.activeFlashSale) return;
    const calculateTimeLeft = () => {
      const difference = new Date(product.activeFlashSale.endTime) - new Date();
      if (difference <= 0) {
        setTimeLeft("Ended");
        return;
      }
      const hrs = Math.floor(difference / (1000 * 60 * 60));
      const mins = Math.floor((difference / 1000 / 60) % 60);
      const secs = Math.floor((difference / 1000) % 60);
      setTimeLeft(`${hrs}h ${mins}m ${secs}s`);
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(interval);
  }, [product]);

  useEffect(() => {
    if (product) {
      setQuantity(product.minOrderQuantity || 1);
      setPreOrderQty(product.minOrderQuantity || 1);
    }
  }, [product]);

  const getMinPickupDateString = () => {
    if (!product) return "";
    const leadTimeDays = product.preOrderLeadTimeDays || 0;
    const minDate = new Date(Date.now() + leadTimeDays * 24 * 60 * 60 * 1000);
    const yyyy = minDate.getFullYear();
    const mm = String(minDate.getMonth() + 1).padStart(2, "0");
    const dd = String(minDate.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  const isSeller =
    user &&
    product &&
    user.id ===
      (typeof product.sellerId === "object"
        ? product.sellerId._id
        : product.sellerId);
  const actualSellerId = product
    ? typeof product.sellerId === "object"
      ? product.sellerId._id
      : product.sellerId
    : null;

  useEffect(() => {
    if (searchParams.get("openChat") === "true" && product && user) {
      setShowChat(true);
    }
  }, [searchParams, product, user]);

  useEffect(() => {
    if (isSeller && product) {
      fetchSellerChats();
    }
  }, [isSeller, product]);

  const fetchSellerChats = async () => {
    try {
      const res = await chatService.getConversations();
      if (res.data.success) {
        const productChats = res.data.chats.filter(
          (chat) =>
            chat.product?._id?.toString() === id ||
            chat.productId?.toString() === id,
        );
        setSellerChats(productChats);
      }
    } catch (err) {
      console.error("Error fetching seller chats:", err);
    }
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchProductDetails();
  }, [id]);

  const fetchProductDetails = async () => {
    try {
      const response = await marketService.getProductById(id);
      setProduct(response.data);
      if (user) {
        recommendationService.trackInteraction("view", "product", id);
      }
    } catch (err) {
      console.error("Error fetching product:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const socket = getSocket();
    socket.on("bidUpdate", (data) => {
      if (data.productId === id) {
        setProduct((prev) =>
          prev
            ? {
                ...prev,
                currentHighestBid: data.currentHighestBid,
                bids: data.bidHistory,
              }
            : null,
        );
      }
    });

    return () => {
      socket.off("bidUpdate");
    };
  }, [id]);

  const handlePlaceBid = async (e) => {
    e.preventDefault();
    if (!user) return toast.error("Please login to place a bid");
    if (isSeller) return toast.error("You cannot bid on your own product");

    if (Number(bidAmount) <= (product.currentHighestBid || 0)) {
      return toast.error("Bid must be higher than current highest bid");
    }

    setSubmittingBid(true);
    try {
      const res = await marketService.placeBid(id, {
        amount: Number(bidAmount),
      });
      if (res.data.success) {
        toast.success("Bid placed successfully!");
        setBidAmount("");
        setProduct(res.data.product);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to place bid");
    } finally {
      setSubmittingBid(false);
    }
  };

  const fetchReviews = useCallback(async () => {
    setReviewsLoading(true);
    try {
      const res = await marketService.getProductReviews(id);
      if (res.data.success) {
        setReviewsData(res.data);
      }
    } catch (err) {
      console.error("Error fetching reviews:", err);
    } finally {
      setReviewsLoading(false);
    }
  }, [id]);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Link copied");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleProductReview = async (e) => {
    e.preventDefault();
    if (!user) return toast.error("Please login to review");
    if (isSeller) return toast.error("You cannot review your own product");

    setSubmittingProduct(true);
    try {
      await marketService.addProductReview(id, productReview);
      toast.success("Product review added");
      setProductReview({ rating: 5, comment: "" });
      fetchProductDetails();
      fetchReviews();
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to add review";
      if (err.response?.data?.requiresPurchase) {
        toast.error("Purchase required to leave a review");
      } else {
        toast.error(msg);
      }
    } finally {
      setSubmittingProduct(false);
    }
  };

  const getPriceForQuantity = (qty) => {
    if (!product) return 0;
    if (product.activeFlashSale) {
      return product.activeFlashSale.salePrice;
    }
    if (product.isBulkEnabled && product.bulkPricing && product.bulkPricing.length > 0) {
      const sortedTiers = [...product.bulkPricing].sort((a, b) => b.minQuantity - a.minQuantity);
      const matchingTier = sortedTiers.find(t => qty >= t.minQuantity);
      if (matchingTier) return matchingTier.pricePerUnit;
    }
    return product.price;
  };

  const handlePreOrder = async (e) => {
    e.preventDefault();
    if (!user) return toast.error("Please login to pre-order");
    if (isSeller) return toast.error("You cannot pre-order your own product");
    if (!pickupDate || !pickupTime) return toast.error("Please select pickup date and time");

    setSubmittingPreOrder(true);
    try {
      const res = await preOrderService.createPreOrder({
        productId: product._id,
        quantity: preOrderQty,
        pickupDate,
        pickupTime,
        notes: preOrderNotes,
      });

      toast.success("Pre-order requested successfully!");
      setShowPreOrderForm(false);
      setPreOrderQty(1);
      setPickupDate("");
      setPickupTime("");
      setPreOrderNotes("");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit pre-order");
    } finally {
      setSubmittingPreOrder(false);
    }
  };

  if (loading) return <ProductDetailsSkeleton />;

  if (!product)
    return (
      <div className="min-h-screen bg-[#080e1a] flex flex-col items-center justify-center text-center p-6">
        <h2 className="text-white font-semibold text-lg mb-2">
          Product Not Found
        </h2>
        <p className="text-slate-500 text-sm mb-6">
          This listing may have been removed or relocated.
        </p>
        <button
          onClick={() => navigate("/market")}
          className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold px-5 py-2.5 rounded-xl transition-all"
        >
          <HiOutlineArrowLeft /> Back to Marketplace
        </button>
      </div>
    );

  const images =
    product.productImages?.length > 0
      ? product.productImages
      : [product.productImage];

  const card = "bg-[#111827] border border-[#1f2a3d] rounded-2xl";

  return (
    <div className="min-h-screen bg-[#080e1a] pt-32 md:pt-40 pb-20">
      <style>{`
        .pd * { font-family: 'DM Sans', sans-serif; }
      `}</style>

      <div className="pd max-w-5xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="flex items-center justify-between mb-6"
        >
          <Link
            to="/market"
            className="flex items-center gap-2 text-slate-300 hover:text-slate-300 text-sm font-medium transition-colors"
          >
            <HiOutlineArrowLeft className="text-sm" /> Back to Marketplace
          </Link>
          <div className="flex gap-2">
            <button
              onClick={handleShare}
              className={`flex items-center gap-1.5 text-xs font-medium px-3.5 py-2 rounded-xl border transition-all
                ${
                  copied
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                    : "bg-[#111827] text-slate-500 border-[#1f2a3d] hover:text-slate-300"
                }`}
            >
              {copied ? (
                <>
                  <HiOutlineCheckCircle className="text-sm" /> Copied!
                </>
              ) : (
                <>
                  <HiOutlineShare className="text-sm" /> Share
                </>
              )}
            </button>
            <button
              onClick={() => setShowReport(true)}
              className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-3.5 py-2 rounded-xl border border-[#1f2a3d] text-slate-500 hover:text-rose-400 hover:border-rose-900/40 hover:bg-rose-950/20 transition-all"
            >
              <FiFlag className="text-xs" /> Report
            </button>
          </div>
        </motion.div>
        <div className="grid lg:grid-cols-2 gap-6 items-start">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-3"
          >
            <div
              className={`${card} overflow-hidden aspect-square relative group`}
            >
              <AnimatePresence mode="wait">
                <motion.img
                  key={activeImage}
                  src={images[activeImage]}
                  alt={product.productName}
                  data-testid="main-image"
                  initial={{ opacity: 0, scale: 1.03 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ duration: 0.25 }}
                  className="w-full h-full object-cover"
                />
              </AnimatePresence>
              {images.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 px-3 py-2 bg-black/50 backdrop-blur-sm rounded-full border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity">
                  {images.map((_, idx) => (
                    <div
                      key={idx}
                      className={`h-1.5 rounded-full transition-all duration-300 ${idx === activeImage ? "w-4 bg-violet-400" : "w-1.5 bg-white/30"}`}
                    />
                  ))}
                </div>
              )}
              <div className="absolute top-3 left-3">
                <span
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[10px] font-semibold uppercase tracking-wide backdrop-blur-sm
                  ${
                    product.priceType === "sell"
                      ? "bg-violet-500/80 text-white border-violet-400/30"
                      : "bg-emerald-500/80 text-white border-emerald-400/30"
                  }`}
                >
                  {product.priceType === "sell" ? (
                    <>
                      <HiOutlineTag className="text-xs" /> For Sale
                    </>
                  ) : (
                    <>
                      <HiOutlineHome className="text-xs" /> For Rent
                    </>
                  )}
                </span>
              </div>
              {product.isSold && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex flex-col items-center justify-center z-10 rounded-2xl">
                  <div className="bg-red-500/90 border border-red-400/50 px-6 py-3 rounded-2xl flex flex-col items-center gap-1 shadow-2xl">
                    <span className="text-white font-extrabold text-xl tracking-tight">
                      SOLD OUT
                    </span>
                    <span className="text-red-200 text-[10px] font-semibold uppercase tracking-widest">
                      No longer available
                    </span>
                  </div>
                </div>
              )}
            </div>
            {images.length > 1 && (
              <div className="grid grid-cols-5 gap-2">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onMouseEnter={() => setActiveImage(idx)}
                    onClick={() => setActiveImage(idx)}
                    aria-label={`View image ${idx + 1}`}
                    className={`aspect-square rounded-xl overflow-hidden border-2 transition-all
                      ${
                        idx === activeImage
                          ? "border-violet-500 ring-2 ring-violet-500/20"
                          : "border-[#1f2a3d] opacity-50 hover:opacity-100"
                      }`}
                  >
                    <img
                      src={img}
                      className="w-full h-full object-cover"
                      alt={`Product thumbnail ${idx + 1}`}
                    />
                  </button>
                ))}
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div className={`${card} p-4`}>
                <p className="text-[10px] font-semibold text-slate-300 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                  <HiOutlineTag className="text-violet-400" /> Listing Type
                </p>
                <p className="text-sm text-slate-200 font-semibold">
                  {product.priceType === "sell" ? "For Sale" : "For Rent"}
                </p>
              </div>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.05 }}
            className="space-y-5"
          >
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-violet-500/10 border border-violet-500/20 rounded-lg text-[11px] font-semibold text-violet-400 mb-3">
                <HiOutlineShoppingBag className="text-xs" />
                {product.mainCategory}
              </span>

              <h1 className="text-white font-bold text-2xl md:text-3xl leading-snug mb-3">
                {product.productName}
              </h1>

              <div className="flex items-center flex-wrap gap-3">
                {product.activeFlashSale ? (
                  <>
                    <div className="flex items-center gap-1 text-yellow-400 font-black text-3xl">
                      <HiOutlineCurrencyRupee className="text-2xl" />
                      {product.activeFlashSale.salePrice.toLocaleString()}
                    </div>
                    <span className="text-slate-500 line-through text-lg font-bold">
                      ₹{product.price.toLocaleString()}
                    </span>
                    <span className="text-[10px] font-black text-rose-500 bg-rose-500/10 border border-rose-500/20 px-2.5 py-0.5 rounded-lg uppercase tracking-wider">
                      {Math.round(((product.price - product.activeFlashSale.salePrice) / product.price) * 100)}% OFF Deal
                    </span>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-1 text-white font-bold text-2xl">
                      <HiOutlineCurrencyRupee className="text-emerald-400 text-2xl" />
                      {(product.isAuction
                        ? product.currentHighestBid || product.startingPrice
                        : product.price
                      )?.toLocaleString()}
                    </div>
                    <span className="text-[10px] font-medium text-slate-300 uppercase tracking-wide bg-[#111827] border border-[#1f2a3d] px-2.5 py-1 rounded-lg">
                      {product.isAuction
                        ? "Current Bid"
                        : product.priceType === "sell"
                          ? "Purchase Price"
                          : "Rental Price"}
                    </span>
                  </>
                )}
                {product.isBulkEnabled && (
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg">
                    🏷️ Bulk Pricing
                  </span>
                )}
                {product.isPreOrderEnabled && (
                  <span className="text-[10px] font-bold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2.5 py-1 rounded-lg">
                    ⏰ Pre-Order Ready
                  </span>
                )}
              </div>
            </div>

            {product.activeFlashSale && (
              <div className={`${card} p-5 space-y-4 border-yellow-500/20 bg-yellow-500/5`}>
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg animate-pulse">⚡</span>
                    <div>
                      <p className="text-[10px] font-black text-yellow-400 uppercase tracking-widest leading-none">
                        Active Flash Sale
                      </p>
                      <p className="text-slate-400 text-xs mt-1">
                        Limited time deal — grab it before it's gone!
                      </p>
                    </div>
                  </div>
                  <div className="bg-[#0d1424] border border-[#1f2a3d] px-4 py-2.5 rounded-xl text-center shrink-0">
                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest leading-none mb-1">
                      Ends In
                    </p>
                    <span className="text-yellow-400 font-extrabold text-sm font-mono tracking-wide">
                      {timeLeft}
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-medium">Claimed / Sold Count</span>
                    <span className="text-white font-bold">
                      {product.activeFlashSale.soldCount} / {product.activeFlashSale.maxQuantity} items
                    </span>
                  </div>
                  <div className="w-full bg-[#0d1424] h-2 rounded-full overflow-hidden border border-[#1f2a3d]">
                    <div 
                      className="bg-linear-to-r from-yellow-500 to-amber-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, (product.activeFlashSale.soldCount / product.activeFlashSale.maxQuantity) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            )}

            {product.isAuction && (
              <div
                className={`${card} p-5 space-y-4 bg-primary/2 border-primary/10`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5 mb-1">
                      <HiOutlineTag className="text-primary" /> Current Highest
                      Bid
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-primary font-black text-2xl">
                        ₹
                        {(
                          product.currentHighestBid || product.startingPrice
                        ).toLocaleString()}
                      </span>
                      {product.bids?.length > 0 && (
                        <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold uppercase tracking-tight">
                          {product.bids.length} bids
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest mb-1">
                      Auction Ends
                    </p>
                    <p className="text-white text-[11px] font-semibold">
                      {new Date(product.auctionEnd).toLocaleString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>

                {!product.isSold && (
                  <div className="pt-2">
                    {new Date(product.auctionEnd) > new Date() ? (
                      <form onSubmit={handlePlaceBid} className="flex gap-2">
                        <div className="relative flex-1">
                          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-sm">
                            ₹
                          </span>
                          <input
                            type="number"
                            placeholder={`Min ₹${(product.currentHighestBid || product.startingPrice) + 1}`}
                            className="w-full bg-[#0d1424] border border-[#1f2a3d] rounded-xl pl-8 pr-4 py-3 text-sm text-white outline-none focus:border-primary/50 transition-all font-bold"
                            value={bidAmount}
                            onChange={(e) => setBidAmount(e.target.value)}
                            required
                          />
                        </div>
                        <button
                          type="submit"
                          disabled={submittingBid}
                          className="bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-lg shadow-primary/40 disabled:opacity-50 active:scale-95 flex items-center justify-center min-w-30"
                        >
                          {submittingBid ? (
                            <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                          ) : (
                            "Place Bid"
                          )}
                        </button>
                      </form>
                    ) : (
                      <div className="w-full py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-center">
                        <span className="text-red-400 font-bold text-xs uppercase tracking-widest">
                          Auction Ended
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
            <div className={`${card} p-5`}>
              <p className="text-[11px] font-semibold text-slate-300 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                <HiOutlineClipboardDocument className="text-violet-400" />{" "}
                Description
              </p>
              <p className="text-slate-400 text-sm leading-relaxed">
                {product.description ||
                  "No additional details provided for this listing."}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className={`${card} p-4`}>
                <p className="text-[10px] font-semibold text-slate-300 uppercase tracking-widest mb-2 flex items-center gap-1">
                  <HiOutlineMapPin className="text-rose-400" /> Location
                </p>
                <p className="text-slate-200 text-sm font-semibold leading-snug">
                  {product.address ||
                    product.locationAddress ||
                    product.taluka ||
                    "Local Area"}
                </p>
                {(product.taluka || product.district) && (
                  <p className="text-slate-500 text-xs mt-0.5">
                    {product.taluka
                      ? `${product.taluka}, ${product.district}`
                      : product.district}
                  </p>
                )}
              </div>
              <div className={`${card} p-4`}>
                <p className="text-[10px] font-semibold text-slate-300 uppercase tracking-widest mb-2 flex items-center gap-1">
                  <HiOutlineUser className="text-violet-400" /> Seller
                </p>
                <p className="text-slate-200 text-sm font-semibold leading-snug">
                  {product.sellerProfile?.name || "Community Member"}
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-3 pt-1">
              {product.isSold && (
                <div className="w-full flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                  <div>
                    <p className="text-red-400 font-bold text-sm">
                      Product Sold Out
                    </p>
                    <p className="text-red-400/70 text-[11px] mt-0.5">
                      This item has already been purchased and is no longer
                      available.
                    </p>
                  </div>
                </div>
              )}

              {user && !isSeller && !product.isSold && !product.isAuction && (
                <div className="space-y-3">
                  {product.isBulkEnabled && (
                    <div className="space-y-3">
                      {product.bulkPricing && product.bulkPricing.length > 0 && (
                        <div className="bg-[#111827] border border-[#1f2a3d] rounded-xl p-4 space-y-3">
                          <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">
                            📦 Wholesale/Bulk Pricing Tiers
                          </p>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            {product.bulkPricing.map((tier, idx) => {
                              const isActive = quantity >= tier.minQuantity;
                              return (
                                <div 
                                  key={idx} 
                                  className={`p-2.5 rounded-lg border flex flex-col gap-0.5 transition-all ${
                                    isActive
                                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-sm"
                                      : "bg-[#0d1424] border-[#1f2a3d] text-slate-400"
                                  }`}
                                >
                                  <span className="font-bold text-[10px] uppercase tracking-wider">
                                    Qty {tier.minQuantity}+
                                  </span>
                                  <span className="text-sm font-black mt-0.5">
                                    ₹{tier.pricePerUnit.toLocaleString()} / unit
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-xl space-y-2">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-slate-300 text-xs font-semibold">Bulk Price Unit</p>
                            <p className="text-slate-500 text-[10px]">Price drops for higher volumes</p>
                          </div>
                          <div className="flex items-center gap-0.5 text-emerald-400 font-bold text-xl">
                            <HiOutlineCurrencyRupee />
                            {getPriceForQuantity(quantity).toLocaleString()}
                          </div>
                        </div>
                        <div className="flex justify-between items-center text-[11px] pt-1 border-t border-emerald-500/10">
                          <span className="text-slate-400">Total subtotal:</span>
                          <span className="text-emerald-400 font-bold">₹{(getPriceForQuantity(quantity) * quantity).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between p-3.5 bg-[#111827] border border-[#1f2a3d] rounded-xl">
                    <span className="text-slate-400 text-xs font-semibold">Select Quantity</span>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        disabled={quantity <= (product.minOrderQuantity || 1)}
                        onClick={() => setQuantity(prev => Math.max(product.minOrderQuantity || 1, prev - 1))}
                        className="w-8 h-8 rounded-lg bg-[#0d1424] hover:bg-slate-800 text-white font-bold flex items-center justify-center disabled:opacity-40 transition-colors"
                      >
                        -
                      </button>
                      <span className="text-white font-bold text-sm min-w-[20px] text-center">{quantity}</span>
                      <button
                        type="button"
                        onClick={() => setQuantity(prev => prev + 1)}
                        className="w-8 h-8 rounded-lg bg-[#0d1424] hover:bg-slate-800 text-white font-bold flex items-center justify-center transition-colors"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={() =>
                      navigate(`/market/product/${product._id}/checkout?qty=${quantity}`)
                    }
                    className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 active:scale-[.98] text-white text-sm font-bold py-4 rounded-xl transition-all shadow-lg shadow-emerald-900/30"
                  >
                    <HiOutlineShoppingBag className="text-lg" /> Buy Now (₹{(getPriceForQuantity(quantity) * quantity).toLocaleString()})
                  </button>

                  {product.isPreOrderEnabled && (
                    <button
                      type="button"
                      onClick={() => setShowPreOrderForm(true)}
                      className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 active:scale-[.98] text-white text-sm font-bold py-4 rounded-xl transition-all shadow-lg shadow-blue-900/30"
                    >
                      <span className="text-lg">⏰</span> Pre-Order Request
                    </button>
                  )}
                </div>
              )}

              {isSeller && (
                <div className="space-y-3">
                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                    <p className="text-emerald-400 text-xs font-semibold text-center">
                      You are the seller of this product
                    </p>
                  </div>

                  {sellerChats.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                        <HiOutlineChatBubbleLeftRight className="text-violet-400" />
                        Customer Messages ({sellerChats.length})
                      </p>
                      {sellerChats.map((chat) => (
                        <button
                          key={chat._id}
                          onClick={() => {
                            setActiveBuyerId(chat.buyerId);
                            setActiveBuyerName(
                              chat.otherUserName || "Customer",
                            );
                            setShowChat(true);
                          }}
                          className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                            showChat && activeBuyerId === chat.buyerId
                              ? "bg-violet-600/10 border-violet-500/30"
                              : "bg-[#111827] hover:bg-[#131d2e] border-[#1f2a3d] hover:border-violet-500/20"
                          }`}
                        >
                          <div className="w-8 h-8 rounded-lg bg-linear-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shrink-0">
                            {(chat.otherUserName || "C")
                              .charAt(0)
                              .toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-white text-xs font-semibold truncate">
                                {chat.otherUserName || "Customer"}
                              </p>
                              {chat.unreadCount > 0 && (
                                <span className="w-4 h-4 bg-violet-600 rounded-full flex items-center justify-center text-[8px] text-white font-bold">
                                  {chat.unreadCount}
                                </span>
                              )}
                            </div>
                            <p className="text-slate-500 text-[10px] truncate">
                              {chat.lastMessage}
                            </p>
                          </div>
                          <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-lg shrink-0">
                            Reply
                          </span>
                        </button>
                      ))}
                    </div>
                  )}

                  {sellerChats.length === 0 && (
                    <div className="p-4 bg-[#111827] border border-[#1f2a3d] rounded-xl text-center">
                      <p className="text-slate-500 text-xs">
                        No customer messages yet
                      </p>
                    </div>
                  )}
                </div>
              )}

              {!isSeller && (
                <>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <a
                      href={`tel:${product.sellerProfile?.contactNumber || product.contactNumber}`}
                      className="flex-1 flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 active:scale-[.98] text-white text-sm font-semibold py-3.5 rounded-xl transition-all shadow-lg shadow-violet-900/30"
                    >
                      <HiOutlinePhone className="text-base" /> Call Seller
                    </a>
                    <a
                      href={`https://wa.me/${product.sellerProfile?.whatsappNumber || product.sellerProfile?.contactNumber || product.contactNumber}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 flex items-center justify-center gap-2 bg-[#111827] hover:bg-[#131d2e] border border-[#1f2a3d] hover:border-emerald-500/30 hover:text-emerald-400 text-slate-300 text-sm font-semibold py-3.5 rounded-xl transition-all"
                    >
                      <HiOutlineChatBubbleLeftRight className="text-base" />{" "}
                      WhatsApp
                    </a>
                  </div>
                  <WishlistButton
                   aria-label="Add to wishlist"
                    type="product"
                    id={product._id}
                    className="w-full flex items-center justify-center gap-2 py-3.5"
                  />
                  {user && (
                    <button
                      onClick={() => setShowChat(!showChat)}
                      className={`w-full flex items-center justify-center gap-2 text-sm font-semibold py-3.5 rounded-xl transition-all ${
                        showChat
                          ? "bg-violet-600/20 text-violet-400 border border-violet-500/30"
                          : "bg-linear-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-lg shadow-violet-900/30 active:scale-[.98]"
                      }`}
                    >
                      <HiOutlineChatBubbleLeftRight className="text-base" />
                      {showChat ? "Close Chat" : "Chat with Seller"}
                    </button>
                  )}
                </>
              )}
            </div>
          </motion.div>
        </div>

        <div className="mt-12 space-y-8">
          <div className="flex border-b border-[#1f2a3d]">
            <button
              onClick={() => setActiveTab("details")}
              className={`px-6 py-3 text-sm font-bold transition-all border-b-2 ${activeTab === "details" ? "border-violet-500 text-white" : "border-transparent text-slate-500 hover:text-slate-300"}`}
            >
              Description & Details
            </button>
            <button
              onClick={() => {
                setActiveTab("reviews");
                if (!reviewsData) fetchReviews();
              }}
              className={`px-6 py-3 text-sm font-bold transition-all border-b-2 flex items-center gap-2 ${activeTab === "reviews" ? "border-violet-500 text-white" : "border-transparent text-slate-500 hover:text-slate-300"}`}
            >
              Reviews
              <span
                className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                  activeTab === "reviews"
                    ? "bg-violet-500/20 text-violet-300"
                    : "bg-[#1f2a3d] text-slate-500"
                }`}
              >
                {reviewsData
                  ? reviewsData.reviewCount
                  : product.numReviews || 0}
              </span>
              {(reviewsData?.avgRating || product.rating) > 0 && (
                <span className="flex items-center gap-0.5 text-amber-400 text-[11px] font-bold">
                  <HiStar className="text-xs" />
                  {(reviewsData?.avgRating || product.rating).toFixed(1)}
                </span>
              )}
            </button>
          </div>

          {activeTab === "details" ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid md:grid-cols-2 gap-8"
            >
              <div className={`${card} p-6`}>
                <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                  <HiOutlineClipboardDocument className="text-violet-400" />{" "}
                  Additional Context
                </h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest mb-1">
                      Posted On
                    </p>
                    <p className="text-slate-300 text-sm">
                      {new Date(product.createdAt).toLocaleDateString(
                        undefined,
                        { dateStyle: "long" },
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest mb-1">
                      Category
                    </p>
                    <p className="text-slate-300 text-sm">
                      {product.mainCategory} › {product.subCategory}
                    </p>
                  </div>
                </div>
              </div>
              <div className={`${card} p-6`}>
                <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                  <HiOutlineUser className="text-violet-400" /> Seller
                  Information
                </h3>
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 rounded-2xl bg-violet-600/10 border border-violet-500/20 flex items-center justify-center text-xl text-violet-400 font-bold uppercase">
                    {product.sellerProfile?.name?.[0] || "S"}
                  </div>
                  <div>
                    <p className="text-white font-bold">
                      {product.sellerProfile?.name || "Seller"}
                    </p>
                    <p className="text-slate-500 text-xs">Community Member</p>
                  </div>
                </div>
              </div>

              {product.isAuction && (
                <div
                  className={`${card} p-6 h-fit md:col-span-2 shadow-2xl shadow-primary/5`}
                >
                  <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                    <HiOutlineTag className="text-primary" /> Bid History
                  </h3>
                  {product.bids?.length > 0 ? (
                    <div className="space-y-3">
                      {[...product.bids].reverse().map((bid, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all
                            ${
                              idx === 0
                                ? "bg-primary/10 border-primary/30 ring-1 ring-primary/20"
                                : "bg-white/2 border-white/5 hover:bg-white/4"
                            }`}
                        >
                          <div className="flex items-center gap-3.5">
                            <div
                              className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shadow-sm
                              ${idx === 0 ? "bg-primary text-white" : "bg-white/5 text-slate-400"}`}
                            >
                              {bid.userName?.[0] || "U"}
                            </div>
                            <div>
                              <p className="text-white text-[13px] font-bold">
                                {bid.userName}
                              </p>
                              <p className="text-slate-500 text-[10px] font-medium">
                                {new Date(bid.createdAt).toLocaleString(
                                  undefined,
                                  {
                                    month: "short",
                                    day: "numeric",
                                    hour: "numeric",
                                    minute: "2-digit",
                                  },
                                )}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-primary font-black text-base">
                              ₹{bid.amount.toLocaleString()}
                            </p>
                            {idx === 0 && (
                              <span className="inline-block text-[8px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded-md font-black uppercase tracking-widest mt-1">
                                Current High
                              </span>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 border border-dashed border-white/10 rounded-2xl bg-white/2">
                      <p className="text-slate-500 font-medium text-xs">
                        No bids placed yet. Be the first to start!
                      </p>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-12"
            >
              <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-white font-bold flex items-center gap-2">
                      Product Reviews
                    </h3>
                    {(reviewsData?.avgRating || 0) > 0 && (
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                        <div className="flex items-center gap-0.5">
                          {[...Array(5)].map((_, i) => (
                            <HiStar
                              key={i}
                              className={`text-xs ${
                                i < Math.round(reviewsData.avgRating)
                                  ? "text-amber-400"
                                  : "text-slate-700"
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-amber-400 font-bold text-sm">
                          {reviewsData.avgRating.toFixed(1)}
                        </span>
                        <span className="text-slate-600 text-[10px]">
                          ({reviewsData.reviewCount} review
                          {reviewsData.reviewCount !== 1 ? "s" : ""})
                        </span>
                      </div>
                    )}
                  </div>
                  {reviewsLoading ? (
                    <div className="space-y-3">
                      {[...Array(2)].map((_, i) => (
                        <div
                          key={i}
                          className="bg-[#111827] border border-[#1f2a3d] rounded-2xl h-24 animate-pulse opacity-40"
                        />
                      ))}
                    </div>
                  ) : (reviewsData?.reviews || []).length > 0 ? (
                    (reviewsData?.reviews || []).map((r, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className={`${card} p-5`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-violet-600/10 border border-violet-500/20 flex items-center justify-center text-violet-400 font-bold text-xs uppercase shrink-0">
                              {r.userName?.[0] || "U"}
                            </div>
                            <div>
                              <span className="text-white font-bold text-sm block leading-tight">
                                {r.userName}
                              </span>
                              <div className="flex items-center gap-0.5 mt-0.5">
                                {[...Array(5)].map((_, idx) => (
                                  <HiStar
                                    key={idx}
                                    className={`text-[10px] ${
                                      idx < r.rating
                                        ? "text-amber-400"
                                        : "text-slate-700"
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>
                          </div>
                          <span className="text-[10px] text-slate-600">
                            {new Date(r.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-slate-400 text-sm leading-relaxed">
                          {r.comment}
                        </p>
                      </motion.div>
                    ))
                  ) : (
                    <div className="text-center py-12 border border-dashed border-[#1f2a3d] rounded-2xl">
                      <p className="text-slate-600 text-sm">
                        No reviews for this product yet.
                      </p>
                    </div>
                  )}
                </div>

                <div className={`${card} p-6 h-fit`}>
                  <h4 className="text-white font-bold text-sm mb-4">
                    Review Product
                  </h4>
                  {!user ? (
                    <div className="text-center py-6">
                      <p className="text-slate-500 text-xs mb-4">
                        Please login to rate this product.
                      </p>
                      <button
                        onClick={() => navigate("/login")}
                        className="w-full py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold rounded-xl transition-all"
                      >
                        Login to Review
                      </button>
                    </div>
                  ) : isSeller ? (
                    <div className="text-center py-6 bg-amber-500/5 border border-amber-500/10 rounded-xl">
                      <p className="text-amber-400/80 text-[11px] font-medium px-4">
                        Owners cannot review their own products.
                      </p>
                    </div>
                  ) : reviewsData?.reviews?.some(
                      (r) => r.userId?.toString() === user.id,
                    ) ||
                    product.reviews?.some(
                      (r) => r.userId?.toString() === user.id,
                    ) ? (
                    <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-xl text-center">
                      <HiOutlineCheckCircle className="text-emerald-400 text-2xl mx-auto mb-2" />
                      <p className="text-emerald-400/80 text-[11px] font-medium">
                        Thank you! You have already reviewed this product.
                      </p>
                    </div>
                  ) : !product.isSold ? (
                    <div className="text-center py-6 space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mx-auto">
                        <HiOutlineShoppingCart className="text-violet-400 text-xl" />
                      </div>
                      <p className="text-slate-400 text-xs leading-relaxed px-2">
                        Only verified buyers can leave reviews. Purchase this
                        product to share your experience.
                      </p>
                      <button
                        onClick={() =>
                          navigate(`/market/product/${product._id}/checkout`)
                        }
                        className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-all"
                      >
                        Buy to Review
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleProductReview} className="space-y-4">
                      <div>
                        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-2">
                          Your Rating
                        </p>
                        <div className="flex gap-2 mb-3">
                          {[1, 2, 3, 4, 5].map((num) => (
                            <button
                              key={num}
                              type="button"
                              aria-label={`${num} star${num > 1 ? "s" : ""}`}
                              onClick={() =>
                                setProductReview((prev) => ({
                                  ...prev,
                                  rating: num,
                                }))
                              }
                              className={`p-2 rounded-lg border transition-all ${
                                productReview.rating >= num
                                  ? "bg-amber-500/20 border-amber-500/50 text-amber-400 scale-110"
                                  : "bg-[#0d1424] border-[#1f2a3d] text-slate-700 hover:text-slate-500"
                              }`}
                            >
                              <HiStar />
                            </button>
                          ))}
                          <span className="ml-1 text-amber-400 text-xs font-bold self-center">
                            {productReview.rating}/5
                          </span>
                        </div>
                        <textarea
                          placeholder="Your thoughts on this product..."
                          className="w-full bg-[#0d1424] border border-[#1f2a3d] rounded-xl p-3 text-xs text-slate-300 outline-none focus:border-violet-500 transition-all h-24 resize-none"
                          value={productReview.comment}
                          onChange={(e) =>
                            setProductReview((prev) => ({
                              ...prev,
                              comment: e.target.value,
                            }))
                          }
                          required
                          minLength={3}
                        />
                      </div>
                      <button
                        disabled={submittingProduct}
                        className="w-full py-3 bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {submittingProduct ? (
                          <>
                            <div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />
                            Submitting...
                          </>
                        ) : (
                          <>Post Review</>
                        )}
                      </button>
                    </form>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      <ReportModal 
        isOpen={showReport}
        onClose={() => setShowReport(false)}
        targetType="product"
        targetId={product._id}
      />
      <AnimatePresence>
        {showPreOrderForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-[#111827] border border-[#1f2a3d] rounded-3xl w-full max-w-md overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b border-[#1f2a3d] flex justify-between items-center bg-[#0d1424]">
                <h3 className="text-white font-bold text-lg flex items-center gap-2">
                  <span>⏰</span> Request Pre-Order
                </h3>
                <button
                  type="button"
                  onClick={() => setShowPreOrderForm(false)}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handlePreOrder} className="p-6 space-y-4">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-1.5">
                    Select Quantity
                  </label>
                  <div className="flex items-center justify-between p-3.5 bg-[#0d1424] border border-[#1f2a3d] rounded-xl">
                    <span className="text-slate-400 text-xs font-semibold">Quantity</span>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        disabled={preOrderQty <= (product.minOrderQuantity || 1)}
                        onClick={() => setPreOrderQty(prev => Math.max(product.minOrderQuantity || 1, prev - 1))}
                        className="w-8 h-8 rounded-lg bg-[#111827] hover:bg-slate-800 text-white font-bold flex items-center justify-center disabled:opacity-40 transition-colors"
                      >
                        -
                      </button>
                      <span className="text-white font-bold text-sm min-w-[20px] text-center">{preOrderQty}</span>
                      <button
                        type="button"
                        onClick={() => setPreOrderQty(prev => prev + 1)}
                        className="w-8 h-8 rounded-lg bg-[#111827] hover:bg-slate-800 text-white font-bold flex items-center justify-center transition-colors"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-1.5">
                    Pickup Date (Min lead time: {product.preOrderLeadTimeDays} days)
                  </label>
                  <input
                    type="date"
                    required
                    min={getMinPickupDateString()}
                    value={pickupDate}
                    onChange={(e) => setPickupDate(e.target.value)}
                    className="w-full bg-[#0d1424] border border-[#1f2a3d] rounded-xl px-4 py-3 text-sm text-slate-200 outline-none focus:border-violet-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-1.5">
                    Pickup Time
                  </label>
                  <input
                    type="time"
                    required
                    value={pickupTime}
                    onChange={(e) => setPickupTime(e.target.value)}
                    className="w-full bg-[#0d1424] border border-[#1f2a3d] rounded-xl px-4 py-3 text-sm text-slate-200 outline-none focus:border-violet-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-1.5">
                    Special Notes
                  </label>
                  <textarea
                    value={preOrderNotes}
                    onChange={(e) => setPreOrderNotes(e.target.value)}
                    placeholder="Provide any instructions, customizations, or details..."
                    rows={3}
                    className="w-full bg-[#0d1424] border border-[#1f2a3d] rounded-xl px-4 py-3 text-sm text-slate-200 outline-none focus:border-violet-500 transition-all resize-none"
                  />
                </div>

                <div className="pt-2 border-t border-[#1f2a3d] space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Total Price:</span>
                    <span className="text-emerald-400 font-bold">
                      ₹{(getPriceForQuantity(preOrderQty) * preOrderQty).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-normal">
                    * Placing a pre-order request does not charge you immediately. The seller will review your request and confirm.
                  </p>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowPreOrderForm(false)}
                    className="flex-1 py-3 bg-[#0d1424] hover:bg-slate-800 border border-[#1f2a3d] text-slate-300 font-bold text-xs uppercase tracking-widest rounded-xl transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingPreOrder}
                    className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {submittingPreOrder ? (
                      <>
                        <div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      "Submit Request"
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showChat && product && user && (
          <ChatBox
            productId={product._id}
            sellerId={actualSellerId}
            buyerId={isSeller ? activeBuyerId : user.id}
            otherUserName={
              isSeller
                ? activeBuyerName
                : product.sellerProfile?.name || "Seller"
            }
            productName={product.productName}
            onClose={() => {
              setShowChat(false);
              setActiveBuyerId(null);
              setActiveBuyerName("");
              if (isSeller) fetchSellerChats();
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProductDetails;
