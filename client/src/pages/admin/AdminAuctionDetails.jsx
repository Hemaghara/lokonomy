import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { adminService } from "../../services";
import AdminLayout from "../../layouts/AdminLayout";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";
import {
  FiArrowLeft,
  FiTrendingUp,
  FiClock,
  FiDollarSign,
  FiUser,
  FiCalendar,
  FiActivity,
  FiShield,
  FiInfo,
  FiPackage,
  FiSlash,
  FiPauseCircle,
  FiAlertTriangle,
  FiCheckCircle,
} from "react-icons/fi";

const FADE_UP = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, ease: "easeOut" },
};

const SectionHead = ({ icon: Icon, label }) => (
  <div className="flex items-center gap-2 mb-4">
    <Icon size={14} className="text-indigo-400 shrink-0" />
    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
      {label}
    </span>
  </div>
);

const Card = ({ children, className = "" }) => (
  <div
    className={`bg-slate-900/60 border border-slate-800 rounded-2xl p-5 ${className}`}
  >
    {children}
  </div>
);

const AdminAuctionDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [auction, setAuction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchAuctionDetails();
  }, [id]);

  const fetchAuctionDetails = async () => {
    try {
      const res = await adminService.getMarketProductDetails(id);
      setAuction(res.data);
    } catch {
      toast.error("Failed to fetch auction details");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleBan = async () => {
    setActionLoading(true);
    try {
      const res = await adminService.toggleBanProduct(id);
      toast.success(res.data.message);
      fetchAuctionDetails();
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
      fetchAuctionDetails();
    } catch {
      toast.error("Action failed");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading)
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">
            Loading Auction Details...
          </p>
        </div>
      </AdminLayout>
    );

  if (!auction)
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
            <FiAlertTriangle size={32} className="text-rose-400" />
          </div>
          <div className="text-center">
            <h2 className="text-xl font-bold text-white">Auction Not Found</h2>
            <p className="text-slate-500 text-sm mt-1">
              The auction listing you're looking for doesn't exist.
            </p>
          </div>
          <button
            onClick={() => navigate("/admin/marketplace")}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all"
          >
            Back to Marketplace
          </button>
        </div>
      </AdminLayout>
    );

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto space-y-6 pb-20 px-1">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-all shadow-lg"
            >
              <FiArrowLeft size={18} />
            </button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl sm:text-2xl font-black text-white">
                  {auction.productName}
                </h1>
                <span className="px-2 py-0.5 rounded-full bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest animate-pulse">
                  Live
                </span>
              </div>
              <p className="text-slate-500 text-xs mt-0.5">
                Auction ID: {auction._id}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleBan}
              disabled={actionLoading}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                auction.isFlagged
                  ? "bg-slate-800 text-slate-400 border border-slate-700"
                  : "bg-rose-600 text-white shadow-lg shadow-rose-600/20"
              }`}
            >
              <FiSlash size={14} /> {auction.isFlagged ? "Unban" : "Ban"}
            </button>
            <button
              onClick={handleToggleSuspend}
              disabled={actionLoading}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                auction.isSuspended
                  ? "bg-slate-800 text-slate-400 border border-slate-700"
                  : "bg-amber-600 text-white shadow-lg shadow-amber-600/20"
              }`}
            >
              <FiPauseCircle size={14} />{" "}
              {auction.isSuspended ? "Activate" : "Suspend"}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="overflow-hidden p-0 border-slate-800/50">
              <div className="relative aspect-video sm:aspect-21/9 bg-slate-950">
                <img
                  src={
                    auction.productImages?.[0] ||
                    "https://via.placeholder.com/800x400"
                  }
                  alt={auction.productName}
                  className="w-full h-full object-cover opacity-80"
                />
                <div className="absolute inset-0 bg-linear-to-t from-slate-950 via-transparent to-transparent" />
                <div className="absolute bottom-6 left-6 right-6">
                  <div className="flex flex-wrap gap-2 mb-3">
                    <span className="px-2.5 py-1 rounded-lg bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 text-[10px] font-black uppercase tracking-widest backdrop-blur-md">
                      {auction.mainCategory}
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-slate-500/20 border border-slate-500/30 text-slate-300 text-[10px] font-black uppercase tracking-widest backdrop-blur-md">
                      {auction.subCategory}
                    </span>
                  </div>
                  <h2 className="text-2xl font-black text-white mb-1">
                    {auction.productName}
                  </h2>
                  <p className="text-slate-400 text-sm line-clamp-2">
                    {auction.description}
                  </p>
                </div>
              </div>
            </Card>

            <Card>
              <SectionHead icon={FiTrendingUp} label="Bidding History" />
              <div className="space-y-3">
                {auction.bids?.length > 0 ? (
                  auction.bids.map((bid, i) => (
                    <div
                      key={i}
                      className={`flex items-center justify-between p-4 rounded-xl border ${
                        i === 0
                          ? "bg-indigo-600/10 border-indigo-500/30 ring-1 ring-indigo-500/20"
                          : "bg-slate-900/40 border-slate-800"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center ${i === 0 ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-500"}`}
                        >
                          <FiUser size={16} />
                        </div>
                        <div>
                          <p
                            className={`text-sm font-bold ${i === 0 ? "text-white" : "text-slate-300"}`}
                          >
                            {bid.userName}{" "}
                            {i === 0 && (
                              <span className="ml-2 text-[10px] bg-indigo-600 text-white px-2 py-0.5 rounded-full uppercase tracking-widest">
                                Highest
                              </span>
                            )}
                          </p>
                          <p className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                            <FiClock size={10} />{" "}
                            {new Date(bid.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p
                          className={`text-base font-black ${i === 0 ? "text-indigo-400" : "text-white"}`}
                        >
                          ₹{bid.amount}
                        </p>
                        <p className="text-[10px] text-slate-500">Bid Amount</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-10 bg-slate-900/40 rounded-2xl border border-dashed border-slate-800">
                    <FiTrendingUp
                      size={30}
                      className="mx-auto text-slate-700 mb-3"
                    />
                    <p className="text-slate-500 text-sm">
                      No bids have been placed yet.
                    </p>
                  </div>
                )}
              </div>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="bg-linear-to-br from-indigo-600 to-indigo-800 border-none shadow-xl shadow-indigo-900/20">
              <div className="flex justify-between items-start mb-6">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white backdrop-blur-md">
                  <FiDollarSign size={20} />
                </div>
                <div className="text-right">
                  <p className="text-white/60 text-[10px] font-black uppercase tracking-widest">
                    Current Highest
                  </p>
                  <h3 className="text-3xl font-black text-white tracking-tight">
                    ₹{auction.currentHighestBid || auction.startingPrice}
                  </h3>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/5 backdrop-blur-md rounded-xl p-3 border border-white/10">
                  <p className="text-white/50 text-[9px] font-black uppercase tracking-widest mb-1">
                    Starting
                  </p>
                  <p className="text-white font-bold">
                    ₹{auction.startingPrice}
                  </p>
                </div>
                <div className="bg-white/5 backdrop-blur-md rounded-xl p-3 border border-white/10">
                  <p className="text-white/50 text-[9px] font-black uppercase tracking-widest mb-1">
                    Total Bids
                  </p>
                  <p className="text-white font-bold">
                    {auction.bids?.length || 0}
                  </p>
                </div>
              </div>
            </Card>

            <Card>
              <SectionHead icon={FiClock} label="Time Left" />
              <div className="flex flex-col items-center text-center py-2">
                <div className="w-16 h-16 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400 mb-4 animate-pulse">
                  <FiClock size={32} />
                </div>
                <p className="text-sm font-bold text-white mb-1">
                  {new Date(auction.auctionEnd) > new Date()
                    ? "Auction Ends In"
                    : "Auction Ended On"}
                </p>
                <div className="text-indigo-400 font-black text-lg">
                  {new Date(auction.auctionEnd).toLocaleString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </div>
                <div className="text-slate-500 text-xs mt-1">
                  {new Date(auction.auctionEnd).toLocaleTimeString()}
                </div>
              </div>
            </Card>

            <Card>
              <SectionHead icon={FiUser} label="Seller Information" />
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-indigo-400 border border-slate-700">
                  <FiUser size={20} />
                </div>
                <div className="min-w-0">
                  <p className="text-white font-bold truncate">
                    {auction.sellerId?.name || "Private Seller"}
                  </p>
                  <p className="text-slate-500 text-[10px] uppercase tracking-widest font-black">
                    ID: {auction.sellerId?._id?.slice(-8)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => navigate(`/admin/user/${auction.sellerId?._id}`)}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-xs font-bold rounded-xl border border-slate-700 transition-all"
              >
                View Seller Profile
              </button>
            </Card>

            <div className="p-5 bg-slate-900/40 border border-slate-800 rounded-2xl flex gap-3">
              <FiShield className="text-slate-600 shrink-0" size={16} />
              <p className="text-[10px] text-slate-600 leading-relaxed font-bold">
                As an administrator, you have the authority to moderate this
                auction listing for compliance and safety.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminAuctionDetails;
