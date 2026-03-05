import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { marketService, orderService } from "../services";
import { toast } from "react-hot-toast";
import { useUser } from "../context/UserContext";
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
} from "react-icons/hi2";

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useUser();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [copied, setCopied] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [isOrdering, setIsOrdering] = useState(false);
  const [orderForm, setOrderForm] = useState({
    shippingAddress: "",
    contactNumber: "",
    paymentMethod: "upi",
    transactionId: "",
  });

  useEffect(() => {
    if (user) {
      setOrderForm((prev) => ({
        ...prev,
        shippingAddress: user.locationName || prev.shippingAddress,
        contactNumber: user.phoneNumber || prev.contactNumber,
      }));
    }
  }, [user]);

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

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Link copied");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOrder = async (e) => {
    e.preventDefault();
    setIsOrdering(true);
    try {
      await orderService.createOrder({
        productId: product._id,
        ...orderForm,
      });
      toast.success("Order placed successfully!");
      setShowCheckout(false);
      navigate("/my-orders");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to place order");
    } finally {
      setIsOrdering(false);
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
        <div className="text-5xl mb-4 opacity-20">📦</div>
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
              {user && user.id !== product.sellerId?._id && (
                <button
                  onClick={() => setShowCheckout(true)}
                  className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 active:scale-[.98] text-white text-sm font-bold py-4 rounded-xl transition-all shadow-lg shadow-emerald-900/30"
                >
                  <HiOutlineShoppingBag className="text-lg" /> Buy Now
                </button>
              )}
              {user && user.id === product.sellerId?._id && (
                <div className="p-4 bg-violet-500/10 border border-violet-500/20 rounded-xl text-center">
                  <p className="text-violet-400 text-xs font-semibold">
                    You are viewing your own product listing.
                  </p>
                </div>
              )}
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
            </div>
          </motion.div>
        </div>
      </div>

      <AnimatePresence>
        {showCheckout && (
          <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCheckout(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-[#111827] border border-[#1f2a3d] rounded-2xl overflow-hidden shadow-2xl"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-white font-bold text-xl">Checkout</h3>
                  <button
                    onClick={() => setShowCheckout(false)}
                    className="text-slate-500 hover:text-white transition-colors"
                  >
                    <HiOutlineArrowLeft className="rotate-90 text-xl" />
                  </button>
                </div>

                <div className="flex gap-4 p-3 bg-[#080e1a] rounded-xl border border-[#1f2a3d] mb-6">
                  <img
                    src={images[0]}
                    className="w-20 h-20 object-cover rounded-lg"
                    alt=""
                  />
                  <div>
                    <h4 className="text-white font-semibold text-sm line-clamp-1">
                      {product.productName}
                    </h4>
                    <p className="text-violet-400 font-bold mt-1">
                      ₹{product.price.toLocaleString()}
                    </p>
                    <p className="text-slate-500 text-[10px] uppercase font-bold tracking-widest mt-1">
                      Qty: 1
                    </p>
                  </div>
                </div>

                <form onSubmit={handleOrder} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">
                      Shipping Address
                    </label>
                    <textarea
                      required
                      value={orderForm.shippingAddress}
                      onChange={(e) =>
                        setOrderForm({
                          ...orderForm,
                          shippingAddress: e.target.value,
                        })
                      }
                      placeholder="Enter your full address"
                      className="w-full bg-[#080e1a] border border-[#1f2a3d] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-violet-500/50 transition-all min-h-25"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">
                      Contact Number
                    </label>
                    <input
                      required
                      type="tel"
                      value={orderForm.contactNumber}
                      onChange={(e) =>
                        setOrderForm({
                          ...orderForm,
                          contactNumber: e.target.value,
                        })
                      }
                      placeholder="e.g. +91 98765 43210"
                      className="w-full bg-[#080e1a] border border-[#1f2a3d] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-violet-500/50 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">
                      Payment Method
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: "upi", label: "UPI", icon: "📱" },
                        { id: "bank_transfer", label: "Bank ", icon: "🏦" },
                        { id: "atm_card", label: "ATM Card", icon: "💳" },
                        { id: "net_banking", label: "Net Bank", icon: "💻" },
                      ].map((method) => (
                        <button
                          key={method.id}
                          type="button"
                          onClick={() =>
                            setOrderForm({
                              ...orderForm,
                              paymentMethod: method.id,
                            })
                          }
                          className={`flex items-center gap-2 px-3 py-3 rounded-xl border text-xs font-semibold transition-all ${
                            orderForm.paymentMethod === method.id
                              ? "bg-violet-500/10 border-violet-500 text-violet-400"
                              : "bg-[#080e1a] border-[#1f2a3d] text-slate-500 hover:border-slate-700"
                          }`}
                        >
                          <span>{method.icon}</span>
                          {method.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Seller Payment Info */}
                  {orderForm.paymentMethod === "upi" && (
                    <div className="p-4 bg-violet-500/5 border border-violet-500/10 rounded-2xl space-y-3">
                      <p className="text-[10px] font-bold text-violet-400 uppercase tracking-widest text-center">
                        Pay directly to {product.sellerId?.name || "the seller"}
                      </p>
                      {product.sellerId?.upiId ? (
                        <div className="flex flex-col items-center gap-3">
                          {product.sellerId.paymentQrCode && (
                            <div className="w-32 h-32 bg-white p-1 rounded-xl shadow-inner shadow-black/5">
                              <img
                                src={product.sellerId.paymentQrCode}
                                className="w-full h-full object-contain"
                                alt="Seller QR Code"
                              />
                            </div>
                          )}
                          <div className="text-center w-full">
                            <p className="text-white font-bold text-sm bg-black/30 py-2 rounded-lg mb-2">
                              {product.sellerId.upiId}
                            </p>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(
                                  product.sellerId.upiId,
                                );
                                toast.success("UPI ID Copied");
                              }}
                              className="text-violet-400 text-[10px] font-bold hover:underline"
                            >
                              Copy UPI ID
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-2">
                          <p className="text-amber-400 text-xs font-medium">
                            Seller hasn't set up UPI details yet.
                          </p>
                          <p className="text-slate-500 text-[10px] mt-1">
                            Please contact them via phone before paying.
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {orderForm.paymentMethod !== "upi" && (
                    <div className="p-4 bg-[#080e1a] border border-[#1f2a3d] rounded-2xl text-center">
                      <p className="text-slate-400 text-xs mb-1 font-medium">
                        For non-UPI payments
                      </p>
                      <p className="text-slate-500 text-[10px] italic">
                        Coordinate details with the seller via call or chat.
                      </p>
                    </div>
                  )}

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">
                      Transaction ID / Reference Number
                    </label>
                    <input
                      required
                      type="text"
                      value={orderForm.transactionId}
                      onChange={(e) =>
                        setOrderForm({
                          ...orderForm,
                          transactionId: e.target.value,
                        })
                      }
                      placeholder="Enter payment reference number"
                      className="w-full bg-[#080e1a] border border-[#1f2a3d] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-violet-500/50 transition-all"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isOrdering}
                    className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl mt-4 transition-all shadow-lg shadow-violet-900/20 flex items-center justify-center gap-2"
                  >
                    {isOrdering ? (
                      <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <HiOutlineCheckCircle className="text-lg" /> Confirm
                        Order (₹{product.price.toLocaleString()})
                      </>
                    )}
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProductDetails;
