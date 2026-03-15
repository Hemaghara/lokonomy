import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { marketService, chatService } from "../services";
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
  const [reviewsData, setReviewsData] = useState(null); // { reviews, avgRating, reviewCount }
  const [reviewsLoading, setReviewsLoading] = useState(false);

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
    } catch (err) {
      console.error("Error fetching product:", err);
    } finally {
      setLoading(false);
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

  if (loading)
    return (
      <div className="min-h-screen bg-[#080e1a] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-9 h-9 border-2 border-violet-500/20 border-t-violet-500 rounded-full animate-spin" />
          <span className="text-slate-500 text-xs font-medium uppercase tracking-widest">
            Loading…
          </span>
        </div>
      </div>
    );

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
    <div className="min-h-screen bg-[#080e1a] pt-24 pb-20">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&display=swap');
        .pd * { font-family: 'DM Sans', sans-serif; }
      `}</style>

      <div className="pd max-w-5xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="flex items-center justify-between mb-6"
        >
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-slate-500 hover:text-slate-300 text-xs font-medium transition-colors"
          >
            <HiOutlineArrowLeft className="text-sm" /> Back to Marketplace
          </button>
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
                      alt=""
                    />
                  </button>
                ))}
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div className={`${card} p-4`}>
                <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest mb-1.5 flex items-center gap-1">
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

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 text-white font-bold text-2xl">
                  <HiOutlineCurrencyRupee className="text-emerald-400 text-2xl" />
                  {product.price.toLocaleString()}
                </div>
                <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wide bg-[#111827] border border-[#1f2a3d] px-2.5 py-1 rounded-lg">
                  {product.priceType === "sell"
                    ? "Purchase Price"
                    : "Rental Price"}
                </span>
              </div>
            </div>
            <div className={`${card} p-5`}>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
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
                <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest mb-2 flex items-center gap-1">
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
                <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest mb-2 flex items-center gap-1">
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

              {user && !isSeller && !product.isSold && (
                <button
                  onClick={() =>
                    navigate(`/market/product/${product._id}/checkout`)
                  }
                  className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 active:scale-[.98] text-white text-sm font-bold py-4 rounded-xl transition-all shadow-lg shadow-emerald-900/30"
                >
                  <HiOutlineShoppingBag className="text-lg" /> Buy Now
                </button>
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
              <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                activeTab === "reviews" ? "bg-violet-500/20 text-violet-300" : "bg-[#1f2a3d] text-slate-500"
              }`}>
                {reviewsData ? reviewsData.reviewCount : (product.numReviews || 0)}
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
                          ({reviewsData.reviewCount} review{reviewsData.reviewCount !== 1 ? "s" : ""})
                        </span>
                      </div>
                    )}
                  </div>
                  {reviewsLoading ? (
                    <div className="space-y-3">
                      {[...Array(2)].map((_, i) => (
                        <div key={i} className="bg-[#111827] border border-[#1f2a3d] rounded-2xl h-24 animate-pulse opacity-40" />
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
                                      idx < r.rating ? "text-amber-400" : "text-slate-700"
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
                      (r) => r.userId?.toString() === user.id
                    ) ||
                    product.reviews?.some(
                      (r) => r.userId?.toString() === user.id
                    ) ? (
                    <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-xl text-center">
                      <HiOutlineCheckCircle className="text-emerald-400 text-2xl mx-auto mb-2" />
                      <p className="text-emerald-400/80 text-[11px] font-medium">
                        Thank you! You have already reviewed this product.
                      </p>
                    </div>
                  ) : !product.isSold ? (
                    // Product not purchased — show purchase-required notice
                    <div className="text-center py-6 space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mx-auto">
                        <HiOutlineShoppingCart className="text-violet-400 text-xl" />
                      </div>
                      <p className="text-slate-400 text-xs leading-relaxed px-2">
                        Only verified buyers can leave reviews. Purchase this product to share your experience.
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
                        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-2">Your Rating</p>
                        <div className="flex gap-2 mb-3">
                          {[1, 2, 3, 4, 5].map((num) => (
                            <button
                              key={num}
                              type="button"
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
                          <><div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />Submitting...</>
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
