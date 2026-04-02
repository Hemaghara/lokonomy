import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { adminService } from "../../services";
import AdminLayout from "../../layouts/AdminLayout";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";
import {
  FiPackage,
  FiUser,
  FiAlertTriangle,
  FiArrowLeft,
  FiDollarSign,
  FiPhone,
  FiMapPin,
  FiSlash,
  FiPauseCircle,
  FiTag,
  FiEye,
  FiInfo,
  FiCheckCircle,
  FiClock,
  FiStar,
  FiGrid,
  FiShield,
  FiTrendingUp,
  FiActivity,
} from "react-icons/fi";

const FADE_UP = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, ease: "easeOut" },
};
const StatusPill = ({ isFlagged, isSuspended }) => {
  const cfg = isFlagged
    ? {
        label: "Banned",
        bg: "bg-rose-500/10",
        text: "text-rose-400",
        ring: "ring-rose-500/25",
      }
    : isSuspended
      ? {
          label: "Suspended",
          bg: "bg-amber-500/10",
          text: "text-amber-400",
          ring: "ring-amber-500/25",
        }
      : {
          label: "Active",
          bg: "bg-emerald-500/10",
          text: "text-emerald-400",
          ring: "ring-emerald-500/25",
        };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ring-1 ${cfg.bg} ${cfg.text} ${cfg.ring}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${isFlagged ? "bg-rose-400" : isSuspended ? "bg-amber-400 animate-pulse" : "bg-emerald-400"}`}
      />
      {cfg.label}
    </span>
  );
};

const StatTile = ({ icon: Icon, label, value, accent = "indigo" }) => (
  <div
    className={`flex items-center gap-3 p-3.5 rounded-xl bg-slate-800/50 border border-slate-700/40 hover:border-${accent}-500/30 transition-colors`}
  >
    <div
      className={`w-9 h-9 rounded-lg bg-${accent}-500/10 flex items-center justify-center shrink-0`}
    >
      <Icon size={16} className={`text-${accent}-400`} />
    </div>
    <div className="min-w-0">
      <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest truncate">
        {label}
      </p>
      <p className="text-xs font-black text-white truncate">{value}</p>
    </div>
  </div>
);

const Card = ({ children, className = "" }) => (
  <div
    className={`bg-slate-900/60 border border-slate-800/80 rounded-2xl backdrop-blur-sm ${className}`}
  >
    {children}
  </div>
);

const SectionHead = ({ icon: Icon, label }) => (
  <div className="flex items-center gap-2 mb-5">
    <Icon size={14} className="text-indigo-400 shrink-0" />
    <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">
      {label}
    </span>
  </div>
);

const ActionBtn = ({
  onClick,
  disabled,
  danger,
  warning,
  neutral,
  children,
}) => {
  const base =
    "flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all duration-150 active:scale-95 disabled:opacity-50 disabled:pointer-events-none shadow-sm";
  const variant = danger
    ? "bg-rose-600 hover:bg-rose-500 text-white"
    : warning
      ? "bg-amber-600 hover:bg-amber-500 text-white"
      : neutral
        ? "bg-slate-700 hover:bg-slate-600 text-slate-200 border border-slate-600"
        : "bg-emerald-600 hover:bg-emerald-500 text-white";
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${variant}`}
    >
      {children}
    </button>
  );
};
const Skeleton = () => (
  <div className="space-y-4 animate-pulse p-6">
    {[...Array(4)].map((_, i) => (
      <div
        key={i}
        className="h-14 rounded-xl bg-slate-800/60"
        style={{ opacity: 1 - i * 0.2 }}
      />
    ))}
  </div>
);
const LoadingScreen = () => (
  <AdminLayout>
    <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4">
      <div className="relative w-14 h-14">
        <div className="absolute inset-0 rounded-full border-4 border-indigo-500/15 border-t-indigo-500 animate-spin" />
        <FiPackage
          className="absolute inset-0 m-auto text-indigo-400 animate-pulse"
          size={18}
        />
      </div>
      <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em]">
        Loading product…
      </p>
    </div>
  </AdminLayout>
);
const NotFoundScreen = ({ onBack }) => (
  <AdminLayout>
    <div className="flex items-center justify-center min-h-[70vh] px-4">
      <motion.div {...FADE_UP} className="text-center max-w-sm">
        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
          <FiAlertTriangle size={36} className="text-rose-400" />
        </div>
        <h2 className="text-2xl font-black text-white mb-2">Not Found</h2>
        <p className="text-sm text-slate-500 mb-8">
          This product could not be located in the database.
        </p>
        <button
          onClick={onBack}
          className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-sm rounded-xl transition-colors"
        >
          Return to Marketplace
        </button>
      </motion.div>
    </div>
  </AdminLayout>
);
const AdminProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeImg, setActiveImg] = useState(0);

  useEffect(() => {
    fetchProductDetails();
  }, [id]);

  const fetchProductDetails = async () => {
    try {
      const res = await adminService.getMarketProductDetails(id);
      setProduct(res.data);
    } catch {
      toast.error("Failed to fetch product details");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleBan = async () => {
    setActionLoading(true);
    try {
      const res = await adminService.toggleBanProduct(id);
      toast.success(res.data.message);
      fetchProductDetails();
    } catch {
      toast.error("Action failed");
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleSuspend = async () => {
    setActionLoading(true);
    try {
      const res = await adminService.toggleSuspendProduct(id);
      toast.success(res.data.message);
      fetchProductDetails();
    } catch {
      toast.error("Action failed");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <LoadingScreen />;
  if (!product)
    return <NotFoundScreen onBack={() => navigate("/admin/marketplace")} />;

  const images = product.productImages ?? [];
  const seller = product.sellerProfile ?? {};

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto px-3 sm:px-5 lg:px-6 pb-20 space-y-5">
        <motion.div
          {...FADE_UP}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-2"
        >
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => navigate(-1)}
              className="w-9 h-9 shrink-0 flex items-center justify-center rounded-lg bg-slate-800 border border-slate-700/70 text-slate-400 hover:text-white hover:border-indigo-500/50 transition-all"
            >
              <FiArrowLeft size={16} />
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-lg sm:text-xl font-black text-white leading-tight truncate max-w-55 sm:max-w-xs md:max-w-none">
                  {product.productName}
                </h1>
                <StatusPill
                  isFlagged={product.isFlagged}
                  isSuspended={product.isSuspended}
                />
              </div>
              <p className="text-[10px] text-slate-500 font-bold mt-0.5 flex items-center gap-1.5">
                <FiTag size={10} className="text-indigo-400" />
                {product.mainCategory} · {product.subCategory}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <ActionBtn
              onClick={handleToggleBan}
              disabled={actionLoading}
              danger={!product.isFlagged}
              neutral={product.isFlagged}
            >
              <FiSlash size={13} />
              {product.isFlagged ? "Unban" : "Ban"}
            </ActionBtn>
            <ActionBtn
              onClick={handleToggleSuspend}
              disabled={actionLoading}
              warning={!product.isSuspended}
              neutral={product.isSuspended}
            >
              <FiPauseCircle size={13} />
              {product.isSuspended ? "Activate" : "Suspend"}
            </ActionBtn>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-2.5"
        >
          <StatTile
            icon={FiDollarSign}
            label="Price"
            value={`₹${product.price?.toLocaleString()}`}
            accent="indigo"
          />
          <StatTile
            icon={FiActivity}
            label="Status"
            value={product.isSold ? "Sold" : "Available"}
            accent={product.isSold ? "rose" : "emerald"}
          />
          <StatTile
            icon={FiStar}
            label="Rating"
            value={`${product.rating ?? 0} / 5`}
            accent="amber"
          />
          <StatTile
            icon={FiEye}
            label="Reviews"
            value={`${product.numReviews ?? 0} reviews`}
            accent="violet"
          />
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 space-y-5">
            {images.length > 0 && (
              <motion.div {...FADE_UP} transition={{ delay: 0.12 }}>
                <Card className="p-4">
                  <SectionHead icon={FiGrid} label="Product Images" />

                  <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-950 mb-3">
                    <AnimatePresence mode="wait">
                      <motion.img
                        key={activeImg}
                        src={images[activeImg]}
                        alt=""
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="w-full h-full object-cover"
                      />
                    </AnimatePresence>
                    {product.isFeatured && (
                      <span className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/90 text-[9px] font-black text-white uppercase tracking-widest backdrop-blur-sm">
                        <FiStar size={9} /> Featured
                      </span>
                    )}
                  </div>

                  {images.length > 1 && (
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {images.map((img, i) => (
                        <button
                          key={i}
                          onClick={() => setActiveImg(i)}
                          className={`shrink-0 w-16 h-12 rounded-lg overflow-hidden border-2 transition-all ${
                            activeImg === i
                              ? "border-indigo-500 opacity-100"
                              : "border-transparent opacity-50 hover:opacity-80"
                          }`}
                        >
                          <img
                            src={img}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </Card>
              </motion.div>
            )}

            <motion.div {...FADE_UP} transition={{ delay: 0.15 }}>
              <Card className="p-5">
                <SectionHead icon={FiInfo} label="Description" />
                <p className="text-sm text-slate-300 leading-relaxed">
                  {product.description}
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-5">
                  {[
                    { label: "Category", value: product.mainCategory },
                    { label: "Sub-Cat", value: product.subCategory },
                    { label: "Commerce", value: product.priceType },
                    {
                      label: "Inventory",
                      value: product.isSold ? "Sold" : "Available",
                    },
                  ].map(({ label, value }) => (
                    <div
                      key={label}
                      className="bg-slate-800/40 rounded-xl p-3 border border-slate-700/30"
                    >
                      <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-1">
                        {label}
                      </p>
                      <p className="text-[11px] font-bold text-white uppercase truncate">
                        {value}
                      </p>
                    </div>
                  ))}
                </div>
              </Card>
            </motion.div>

            <motion.div {...FADE_UP} transition={{ delay: 0.18 }}>
              <Card className="p-5">
                <SectionHead icon={FiUser} label="Seller Profile" />

                <div className="flex items-start gap-4">
                  <div className="relative shrink-0">
                    <div className="w-14 h-14 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                      <FiUser size={24} className="text-indigo-400" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-slate-900 border border-slate-700 rounded-lg flex items-center justify-center">
                      <FiCheckCircle size={11} className="text-emerald-400" />
                    </div>
                  </div>

                  <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <p className="text-[9px] text-slate-600 font-black uppercase tracking-widest mb-0.5">
                        Name
                      </p>
                      <button 
                        onClick={() => navigate(`/admin/user/${product.sellerId?._id}`)}
                        className="text-sm font-black text-white hover:text-indigo-400 transition-colors truncate block text-left"
                      >
                        {seller.name || product.sellerId?.name || "—"}
                      </button>
                    </div>
                    <div>
                      <p className="text-[9px] text-slate-600 font-black uppercase tracking-widest mb-0.5">
                        Phone
                      </p>
                      <a
                        href={`tel:${seller.contactNumber || product.sellerId?.phone}`}
                        className="text-sm font-bold text-indigo-400 hover:underline flex items-center gap-1.5 truncate"
                      >
                        <FiPhone size={12} /> {seller.contactNumber || product.sellerId?.phone || "—"}
                      </a>
                    </div>
                    <div>
                      <p className="text-[9px] text-slate-600 font-black uppercase tracking-widest mb-0.5">
                        Email
                      </p>
                      <p className="text-xs font-bold text-slate-300 truncate">
                        {seller.email || "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[9px] text-slate-600 font-black uppercase tracking-widest mb-0.5">
                        Preference
                      </p>
                      <span className="inline-block px-2 py-0.5 rounded-lg bg-indigo-500/10 text-indigo-400 text-[9px] font-black uppercase tracking-widest border border-indigo-500/15">
                        {seller.contactPreference || "Direct"}
                      </span>
                    </div>
                  </div>
                </div>

                {(seller.address || product.address) && (
                  <div className="mt-4 pt-4 border-t border-slate-800/60">
                    <p className="text-[9px] text-slate-600 font-black uppercase tracking-widest mb-2 flex items-center gap-1.5">
                      <FiMapPin size={11} className="text-rose-400" /> Address
                    </p>
                    <div className="text-xs text-slate-400 leading-relaxed bg-slate-800/30 rounded-xl p-3 border border-slate-700/30">
                      {seller.address || product.address}
                    </div>
                  </div>
                )}
              </Card>
            </motion.div>
          </div>

          <div className="space-y-5">
            <motion.div {...FADE_UP} transition={{ delay: 0.2 }}>
              <Card className="p-5">
                <SectionHead icon={FiDollarSign} label="Market Valuation" />

                <div className="bg-linear-to-br from-indigo-600/10 to-violet-600/10 border border-indigo-500/15 rounded-xl p-5 mb-4 text-center">
                  <p className="text-[9px] text-indigo-400/70 font-bold uppercase tracking-widest mb-1">
                    Listing Price
                  </p>
                  <p className="text-4xl font-black text-white tracking-tight">
                    ₹{product.price?.toLocaleString()}
                  </p>
                  <div className="mt-3 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: "65%" }}
                      transition={{ duration: 1.2, ease: "circOut" }}
                      className="h-full bg-linear-to-r from-indigo-500 to-violet-500 rounded-full"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div
                    className={`rounded-xl p-3 text-center border ${product.isSold ? "bg-rose-500/5 border-rose-500/15" : "bg-emerald-500/5 border-emerald-500/15"}`}
                  >
                    <FiPackage
                      size={14}
                      className={`mx-auto mb-1 ${product.isSold ? "text-rose-400" : "text-emerald-400"}`}
                    />
                    <p
                      className={`text-[10px] font-black uppercase tracking-widest ${product.isSold ? "text-rose-400" : "text-emerald-400"}`}
                    >
                      {product.isSold ? "Sold" : "Available"}
                    </p>
                  </div>
                  <div
                    className={`rounded-xl p-3 text-center border ${product.isFeatured ? "bg-amber-500/5 border-amber-500/15" : "bg-slate-800/30 border-slate-700/30"}`}
                  >
                    <FiStar
                      size={14}
                      className={`mx-auto mb-1 ${product.isFeatured ? "text-amber-400" : "text-slate-600"}`}
                    />
                    <p
                      className={`text-[10px] font-black uppercase tracking-widest ${product.isFeatured ? "text-amber-400" : "text-slate-600"}`}
                    >
                      {product.isFeatured ? "Featured" : "Standard"}
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-800/60">
                  <p className="text-[9px] text-slate-600 font-black uppercase tracking-widest mb-1.5">
                    Registry ID
                  </p>
                  <p className="text-[10px] font-mono text-slate-500 break-all leading-relaxed">
                    {product._id}
                  </p>
                </div>
              </Card>
            </motion.div>

            {product.isAuction && (
              <motion.div
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.22 }}
              >
                <Card className="p-5 border-indigo-500/25">
                  <div className="flex items-center justify-between mb-4">
                    <SectionHead icon={FiTrendingUp} label="Live Auction" />
                    <span className="flex items-center gap-1.5 text-[9px] font-black text-rose-400 uppercase">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />{" "}
                      Live
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div className="bg-slate-800/40 rounded-xl p-3 border border-slate-700/30">
                      <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-1 flex items-center gap-1.5">
                        <FiClock size={10} /> Ends
                      </p>
                      <p className="text-sm font-black text-white">
                        {new Date(product.auctionEnd).toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <div className="bg-emerald-500/5 rounded-xl p-3 border border-emerald-500/15">
                      <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-1">
                        Current Bid
                      </p>
                      <p className="text-2xl font-black text-emerald-400">
                        ₹
                        {(
                          product.currentHighestBid || product.startingPrice
                        )?.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            )}

            <motion.div {...FADE_UP} transition={{ delay: 0.24 }}>
              <Card className="p-5">
                <SectionHead icon={FiShield} label="Ecosystem Feedback" />

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-slate-800/40 rounded-xl p-4 text-center border border-slate-700/30">
                    <p className="text-3xl font-black text-white mb-1">
                      {product.numReviews ?? 0}
                    </p>
                    <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest">
                      Reviews
                    </p>
                  </div>
                  <div className="bg-slate-800/40 rounded-xl p-4 text-center border border-slate-700/30">
                    <p className="text-3xl font-black text-amber-400 mb-1">
                      {product.rating ?? 0}
                    </p>
                    <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest">
                      Rating / 5
                    </p>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[9px] font-bold text-slate-600 mb-1.5">
                    <span>Trust score</span>
                    <span>
                      {Math.round(((product.rating ?? 0) / 5) * 100)}%
                    </span>
                  </div>
                  <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{
                        width: `${((product.rating ?? 0) / 5) * 100}%`,
                      }}
                      transition={{ duration: 1, ease: "circOut", delay: 0.3 }}
                      className="h-full bg-linear-to-r from-amber-500 to-yellow-400 rounded-full"
                    />
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-800/60 flex gap-2.5 items-start">
                  <FiInfo
                    size={12}
                    className="text-slate-600 mt-0.5 shrink-0"
                  />
                  <p className="text-[9px] text-slate-600 leading-relaxed">
                    All admin actions are permanent and auditable by the
                    compliance engine.
                  </p>
                </div>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminProductDetails;
