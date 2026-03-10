import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { marketService, orderService } from "../services";
import { useUser } from "../context/UserContext";
import { toast } from "react-hot-toast";
import {
  HiOutlineArrowLeft,
  HiOutlineShoppingBag,
  HiOutlineCurrencyRupee,
  HiOutlineMapPin,
  HiOutlinePhone,
  HiOutlineCheckCircle,
  HiOutlineTag,
  HiOutlineClipboardDocumentCheck,
  HiOutlineCreditCard,
} from "react-icons/hi2";

const Checkout = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useUser();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isOrdering, setIsOrdering] = useState(false);
  const [copied, setCopied] = useState(false);

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
    if (!user) {
      toast.error("Please login to place an order");
      navigate("/");
      return;
    }
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      const response = await marketService.getProductById(id);
      const p = response.data;

      // Block if already sold
      if (p.isSold) {
        toast.error("This product has already been sold.");
        navigate(`/market/product/${id}`);
        return;
      }

      // Block seller from buying their own product
      if (user && user.id === p.sellerId?._id) {
        toast.error("You cannot purchase your own product");
        navigate(`/market/product/${id}`);
        return;
      }

      setProduct(p);
    } catch (err) {
      console.error("Error fetching product:", err);
      toast.error("Product not found");
      navigate("/market");
    } finally {
      setLoading(false);
    }
  };

  const handleOrder = async (e) => {
    e.preventDefault();
    setIsOrdering(true);
    try {
      await orderService.createOrder({
        productId: product._id,
        ...orderForm,
      });
      toast.success("Order placed successfully! 🎉");
      navigate("/my-orders");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to place order");
    } finally {
      setIsOrdering(false);
    }
  };

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(product.sellerId.upiId);
    toast.success("UPI ID Copied");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const card = "bg-[#111827] border border-[#1f2a3d] rounded-2xl";
  const inputCls =
    "w-full bg-[#0d1424] border border-[#1f2a3d] rounded-xl px-4 py-3 text-sm text-slate-200 outline-none transition-all focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 placeholder:text-slate-600";
  const labelCls =
    "block text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-1.5";

  const paymentMethods = [
    { id: "upi", label: "UPI", icon: "📱" },
    { id: "bank_transfer", label: "Bank Transfer", icon: "🏦" },
    { id: "atm_card", label: "ATM Card", icon: "💳" },
    { id: "net_banking", label: "Net Banking", icon: "💻" },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080e1a] flex flex-col items-center justify-center gap-3">
        <div className="w-9 h-9 border-2 border-violet-500/20 border-t-violet-500 rounded-full animate-spin" />
        <p className="text-slate-500 text-xs font-medium uppercase tracking-widest">
          Loading…
        </p>
      </div>
    );
  }

  if (!product) return null;

  const images =
    product.productImages?.length > 0
      ? product.productImages
      : [product.productImage];

  return (
    <div className="min-h-screen bg-[#080e1a] pt-24 pb-20">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&display=swap');
        .co * { font-family: 'DM Sans', sans-serif; }
      `}</style>

      <div className="co max-w-2xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="mb-8"
        >
          <button
            type="button"
            onClick={() => navigate(`/market/product/${id}`)}
            className="flex items-center gap-2 text-slate-500 hover:text-slate-300 text-xs font-medium transition-colors mb-6"
          >
            <HiOutlineArrowLeft className="text-sm" /> Back to Product
          </button>
          <p className="text-emerald-400 text-[11px] font-semibold uppercase tracking-widest mb-1">
            Secure Checkout
          </p>
          <h1 className="text-white font-bold text-2xl md:text-3xl leading-snug">
            Complete Your Order
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Fill in your delivery and payment details below.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
          className={`${card} p-4 mb-5 flex gap-4 items-center`}
        >
          <img
            src={images[0]}
            className="w-20 h-20 object-cover rounded-xl border border-[#1f2a3d] shrink-0"
            alt={product.productName}
          />
          <div className="flex-1 min-w-0">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-violet-500/10 border border-violet-500/20 rounded-md text-[10px] font-semibold text-violet-400 mb-1.5">
              <HiOutlineTag className="text-xs" />
              {product.priceType === "sell" ? "For Sale" : "For Rent"}
            </span>
            <h3 className="text-white font-semibold text-sm line-clamp-1 mb-1">
              {product.productName}
            </h3>
            <div className="flex items-center gap-1 text-emerald-400 font-bold text-lg">
              <HiOutlineCurrencyRupee />
              {product.price.toLocaleString()}
            </div>
          </div>
          <div className="shrink-0 text-right hidden sm:block">
            <p className="text-[10px] text-slate-600 uppercase tracking-widest font-semibold mb-0.5">
              Seller
            </p>
            <p className="text-slate-300 text-xs font-semibold">
              {product.sellerProfile?.name || "Community Member"}
            </p>
          </div>
        </motion.div>

        <form onSubmit={handleOrder} className="space-y-5">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className={`${card} p-6`}
          >
            <h2 className="flex items-center gap-2.5 text-slate-200 font-semibold text-sm mb-5 pb-4 border-b border-[#1f2a3d]">
              <HiOutlineMapPin className="text-rose-400 text-base" />
              Delivery Details
            </h2>

            <div className="space-y-4">
              <div>
                <label className={labelCls}>
                  <HiOutlineMapPin className="inline text-rose-400 mr-1" />
                  Shipping Address *
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
                  placeholder="House/Flat No., Street, Area, City, PIN Code"
                  rows={3}
                  className={inputCls + " resize-none"}
                />
              </div>

              <div>
                <label className={labelCls}>
                  <HiOutlinePhone className="inline text-violet-400 mr-1" />
                  Contact Number *
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
                  className={inputCls}
                />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.15 }}
            className={`${card} p-6`}
          >
            <h2 className="flex items-center gap-2.5 text-slate-200 font-semibold text-sm mb-5 pb-4 border-b border-[#1f2a3d]">
              <HiOutlineCreditCard className="text-violet-400 text-base" />
              Payment Method
            </h2>

            <div className="grid grid-cols-2 gap-2 mb-5">
              {paymentMethods.map((method) => (
                <button
                  key={method.id}
                  type="button"
                  onClick={() =>
                    setOrderForm({ ...orderForm, paymentMethod: method.id })
                  }
                  className={`flex items-center gap-2 px-3 py-3 rounded-xl border text-xs font-semibold transition-all ${
                    orderForm.paymentMethod === method.id
                      ? "bg-violet-500/10 border-violet-500 text-violet-400"
                      : "bg-[#0d1424] border-[#1f2a3d] text-slate-500 hover:border-slate-600 hover:text-slate-400"
                  }`}
                >
                  <span className="text-base">{method.icon}</span>
                  {method.label}
                </button>
              ))}
            </div>

            {orderForm.paymentMethod === "upi" && (
              <div className="p-4 bg-violet-500/5 border border-violet-500/10 rounded-2xl space-y-3 mb-4">
                <p className="text-[10px] font-bold text-violet-400 uppercase tracking-widest text-center">
                  Pay directly to {product.sellerId?.name || "the seller"}
                </p>
                {product.sellerId?.upiId ? (
                  <div className="flex flex-col items-center gap-3">
                    {product.sellerId.paymentQrCode && (
                      <div className="w-36 h-36 bg-white p-2 rounded-xl shadow-inner">
                        <img
                          src={product.sellerId.paymentQrCode}
                          className="w-full h-full object-contain"
                          alt="Seller QR Code"
                        />
                      </div>
                    )}
                    <div className="text-center w-full">
                      <p className="text-white font-bold text-sm bg-black/30 py-2 px-4 rounded-lg mb-2 break-all">
                        {product.sellerId.upiId}
                      </p>
                      <button
                        type="button"
                        onClick={handleCopyUpi}
                        className={`text-[11px] font-bold transition-colors ${
                          copied
                            ? "text-emerald-400"
                            : "text-violet-400 hover:text-violet-300"
                        }`}
                      >
                        {copied ? "✓ Copied!" : "Copy UPI ID"}
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
              <div className="p-4 bg-[#0d1424] border border-[#1f2a3d] rounded-2xl mb-4">
                <div className="text-center mb-4">
                  <p className="text-slate-400 text-xs mb-1 font-medium">
                    Bank Transfer Details
                  </p>
                  <p className="text-slate-500 text-[10px] italic">
                    Pay using the details below and enter transaction ID.
                  </p>
                </div>

                {product.sellerId?.bankName ||
                product.sellerId?.accountNumber ? (
                  <div className="space-y-3 bg-white/5 p-4 rounded-xl border border-white/10">
                    <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-xs">
                      <div>
                        <p className="text-slate-500 uppercase text-[9px] font-bold tracking-wider mb-0.5">
                          Bank Name
                        </p>
                        <p className="text-slate-200 font-semibold">
                          {product.sellerId.bankName || "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-500 uppercase text-[9px] font-bold tracking-wider mb-0.5">
                          Account Number
                        </p>
                        <p className="text-slate-200 font-semibold font-mono">
                          {product.sellerId.accountNumber || "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-500 uppercase text-[9px] font-bold tracking-wider mb-0.5">
                          IFSC Code
                        </p>
                        <p className="text-slate-200 font-semibold font-mono">
                          {product.sellerId.ifscCode || "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-500 uppercase text-[9px] font-bold tracking-wider mb-0.5">
                          Branch
                        </p>
                        <p className="text-slate-200 font-semibold">
                          {product.sellerId.branch || "N/A"}
                        </p>
                      </div>
                      <div className="col-span-2 pt-2 border-t border-white/5">
                        <p className="text-slate-500 uppercase text-[9px] font-bold tracking-wider mb-0.5">
                          Account Holder
                        </p>
                        <p className="text-slate-200 font-semibold">
                          {product.sellerId.name}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-2">
                    <p className="text-amber-400 text-xs font-medium">
                      Seller hasn't provided bank details.
                    </p>
                    <p className="text-slate-500 text-[10px] mt-1">
                      Please contact them via phone or chat to get payment
                      details.
                    </p>
                  </div>
                )}
              </div>
            )}

            <div>
              <label className={labelCls}>
                <HiOutlineClipboardDocumentCheck className="inline text-emerald-400 mr-1" />
                Transaction ID / Reference Number *
              </label>
              <input
                required
                type="text"
                value={orderForm.transactionId}
                onChange={(e) =>
                  setOrderForm({ ...orderForm, transactionId: e.target.value })
                }
                placeholder="Enter payment reference number after paying"
                className={inputCls}
              />
              <p className="text-slate-600 text-[10px] mt-1.5">
                Complete the payment first, then enter the transaction/reference
                ID here.
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className={`${card} p-5`}
          >
            <h2 className="flex items-center gap-2.5 text-slate-200 font-semibold text-sm mb-4 pb-3 border-b border-[#1f2a3d]">
              <HiOutlineShoppingBag className="text-emerald-400 text-base" />
              Order Summary
            </h2>
            <div className="space-y-2 text-sm text-slate-400 mb-5">
              <div className="flex justify-between">
                <span>Product</span>
                <span className="text-slate-200 font-medium line-clamp-1 max-w-[60%] text-right">
                  {product.productName}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Qty</span>
                <span className="text-slate-200 font-medium">1</span>
              </div>
              <div className="flex justify-between">
                <span>Payment</span>
                <span className="text-slate-200 font-medium capitalize">
                  {orderForm.paymentMethod.replace("_", " ")}
                </span>
              </div>
              <div className="border-t border-[#1f2a3d] pt-2 mt-2 flex justify-between text-base font-bold">
                <span className="text-slate-200">Total</span>
                <span className="text-emerald-400 flex items-center gap-0.5">
                  <HiOutlineCurrencyRupee />
                  {product.price.toLocaleString()}
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isOrdering}
              className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[.98] text-white font-bold text-sm py-4 rounded-xl transition-all shadow-lg shadow-emerald-900/30"
            >
              {isOrdering ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  Placing Order…
                </>
              ) : (
                <>
                  <HiOutlineCheckCircle className="text-lg" />
                  Confirm Order (₹{product.price.toLocaleString()})
                </>
              )}
            </button>
          </motion.div>
        </form>
      </div>
    </div>
  );
};

export default Checkout;
