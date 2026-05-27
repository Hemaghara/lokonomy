import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { preOrderService, businessService } from "../services";
import { useUser } from "../context/UserContext";
import { toast } from "react-hot-toast";
import {
  HiOutlineClock,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineCalendar,
  HiOutlineUser,
  HiOutlinePhone,
  HiOutlineChatBubbleLeftRight,
  HiOutlineInbox,
  HiOutlineCurrencyRupee,
  HiOutlineTag,
  HiOutlineCalendarDays
} from "react-icons/hi2";

const PreOrders = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState("buyer");
  const [buyerPreOrders, setBuyerPreOrders] = useState([]);
  const [sellerPreOrders, setSellerPreOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasBusiness, setHasBusiness] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    if (!user) {
      toast.error("Please login to view pre-orders");
      navigate("/login");
      return;
    }
    checkBusinessAndFetch();
  }, [user]);

  const checkBusinessAndFetch = async () => {
    setLoading(true);
    try {
      const bizRes = await businessService.getMyBusinesses();
      const userHasBiz = bizRes.data && bizRes.data.length > 0;
      setHasBusiness(userHasBiz);

      if (userHasBiz) {
        setActiveTab("seller");
      } else {
        setActiveTab("buyer");
      }

      await fetchAllData(userHasBiz);
    } catch (err) {
      console.error("Error setting up pre-orders page:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllData = async (userHasBiz) => {
    try {
      const buyerRes = await preOrderService.getBuyerPreOrders();
      setBuyerPreOrders(buyerRes.data.preOrders || []);

      if (userHasBiz) {
        const sellerRes = await preOrderService.getSellerPreOrders();
        setSellerPreOrders(sellerRes.data.preOrders || []);
      }
    } catch (err) {
      console.error("Error fetching pre-orders:", err);
      toast.error("Failed to load pre-orders");
    }
  };

  const handleUpdateStatus = async (preOrderId, newStatus) => {
    setUpdatingId(preOrderId);
    try {
      const res = await preOrderService.updatePreOrderStatus(preOrderId, newStatus);
      toast.success(`Pre-order ${newStatus} successfully!`);

      setBuyerPreOrders(prev =>
        prev.map(p => (p._id === preOrderId ? { ...p, status: newStatus } : p))
      );
      setSellerPreOrders(prev =>
        prev.map(p => (p._id === preOrderId ? { ...p, status: newStatus } : p))
      );
    } catch (err) {
      toast.error(err.response?.data?.message || `Failed to update pre-order status`);
    } finally {
      setUpdatingId(null);
    }
  };

  const statusMap = {
    pending: {
      label: "Requested",
      color: "text-amber-400 border-amber-500/30 bg-amber-400/10",
      icon: <HiOutlineClock className="animate-pulse" />,
    },
    accepted: {
      label: "Accepted / Readying",
      color: "text-blue-400 border-blue-500/30 bg-blue-400/10",
      icon: <HiOutlineCalendarDays />,
    },
    completed: {
      label: "Completed",
      color: "text-emerald-400 border-emerald-500/30 bg-emerald-400/10",
      icon: <HiOutlineCheckCircle />,
    },
    cancelled: {
      label: "Cancelled",
      color: "text-rose-400 border-rose-500/30 bg-rose-400/10",
      icon: <HiOutlineXCircle />,
    },
    rejected: {
      label: "Rejected",
      color: "text-orange-400 border-orange-500/30 bg-orange-400/10",
      icon: <HiOutlineXCircle />,
    },
  };

  const getStatusConfig = (status) => statusMap[status] || statusMap.pending;

  const preOrdersToDisplay = activeTab === "buyer" ? buyerPreOrders : sellerPreOrders;

  const card = "bg-[#111827] border border-[#1f2a3d] rounded-3xl overflow-hidden hover:border-violet-500/20 transition-all shadow-xl shadow-black/20 group";

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080e1a] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 border-2 border-violet-500/20 border-t-violet-500 rounded-full animate-spin" />
            <HiOutlineInbox className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-violet-500 text-xl" />
          </div>
          <span className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] animate-pulse">
            Loading Pre-Orders...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080e1a] pt-24 pb-20">
      <div className="max-w-4xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10"
        >
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <span className="text-[10px] font-bold text-blue-400 uppercase tracking-[0.2em]">
                Pre-Order & Reserves
              </span>
            </div>
            <h1 className="text-white font-black text-3xl md:text-4xl tracking-tight mb-2">
              Pre-Order{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
                Dashboard
              </span>
            </h1>
            <p className="text-slate-500 text-sm">
              Manage items reserved in advance, schedule pickups, and keep in touch.
            </p>
          </div>
        </motion.div>

        {hasBusiness && (
          <div className="flex border-b border-[#1f2a3d] mb-8">
            <button
              onClick={() => setActiveTab("seller")}
              className={`px-6 py-3.5 text-xs font-black uppercase tracking-widest transition-all border-b-2 ${activeTab === "seller"
                ? "border-blue-500 text-white"
                : "border-transparent text-slate-500 hover:text-slate-300"
                }`}
            >
              Received Requests ({sellerPreOrders.length})
            </button>
            <button
              onClick={() => setActiveTab("buyer")}
              className={`px-6 py-3.5 text-xs font-black uppercase tracking-widest transition-all border-b-2 ${activeTab === "buyer"
                ? "border-blue-500 text-white"
                : "border-transparent text-slate-500 hover:text-slate-300"
                }`}
            >
              My Pre-Orders ({buyerPreOrders.length})
            </button>
          </div>
        )}

        <AnimatePresence mode="wait">
          {preOrdersToDisplay.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-24 bg-[#111827] border border-[#1f2a3d] rounded-[2.5rem] shadow-2xl shadow-black/40"
            >
              <div className="w-20 h-20 bg-[#0d1424] rounded-full flex items-center justify-center text-4xl mx-auto mb-6 opacity-40">
                ⏰
              </div>
              <h2 className="text-white font-black text-2xl mb-2">
                No pre-orders found
              </h2>
              <p className="text-slate-500 text-sm max-w-xs mx-auto mb-8">
                {activeTab === "buyer"
                  ? "You haven't requested any pre-orders yet. Explore marketplace products with pre-ordering enabled!"
                  : "Your businesses haven't received any pre-order requests yet."}
              </p>
              <button
                onClick={() => navigate("/market")}
                className="bg-white text-black text-[10px] font-black uppercase tracking-widest px-8 py-3.5 rounded-2xl hover:bg-slate-200 transition-all shadow-xl shadow-white/5"
              >
                Go To Market
              </button>
            </motion.div>
          ) : (
            <div className="space-y-6">
              {preOrdersToDisplay.map((preOrder, idx) => {
                const status = getStatusConfig(preOrder.status);
                const isSeller = activeTab === "seller";
                const counterParty = isSeller ? preOrder.buyerId : preOrder.sellerId;
                const images = preOrder.productId?.productImages || [];
                const mainImage = images[0] || preOrder.productId?.productImage;

                return (
                  <motion.div
                    key={preOrder._id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className={card}
                  >
                    <div className="p-6 sm:p-8">
                      <div className="flex flex-col md:flex-row gap-8">
                        <div className="flex-1 flex gap-6">
                          <div className="w-24 h-24 sm:w-28 sm:h-28 bg-[#080e1a] rounded-2xl overflow-hidden border border-[#1f2a3d] shrink-0 relative">
                            {mainImage ? (
                              <img
                                src={mainImage}
                                alt={preOrder.productId?.productName || "Product"}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              />
                            ) : (
                              <div className="w-full h-full bg-[#0d1424] flex items-center justify-center text-slate-600 text-xs">
                                No Image
                              </div>
                            )}
                            <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/60 backdrop-blur-md rounded-md border border-white/5 text-[8px] font-black text-white uppercase">
                              #{preOrder._id.slice(-6).toUpperCase()}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-3 mb-2">
                              <span
                                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[9px] font-black uppercase tracking-wider ${status.color}`}
                              >
                                {status.icon}
                                {status.label}
                              </span>
                              <span className="text-slate-600 text-[9px] font-black uppercase tracking-widest border border-slate-700 px-2 py-1 rounded-full">
                                {new Date(preOrder.createdAt).toLocaleDateString(
                                  "en-IN",
                                  { day: "2-digit", month: "short" }
                                )}
                              </span>
                            </div>

                            <h3 className="text-white font-black text-lg mb-1 truncate">
                              {preOrder.productId?.productName || "Deleted Product"}
                            </h3>

                            <div className="flex flex-col gap-1.5 mt-3 text-xs text-slate-400">
                              <div className="flex items-center gap-2">
                                <span className="text-slate-600 font-bold uppercase tracking-wider text-[9px]">Quantity:</span>
                                <span className="text-slate-200 font-semibold">{preOrder.quantity} units</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-slate-600 font-bold uppercase tracking-wider text-[9px]">Total value:</span>
                                <span className="text-emerald-400 font-bold flex items-center">
                                  <HiOutlineCurrencyRupee />
                                  {preOrder.totalAmount?.toLocaleString()}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="md:w-64 flex flex-col justify-center border-t md:border-t-0 md:border-l border-[#1f2a3d] pt-6 md:pt-0 md:pl-8 space-y-4">
                          <div>
                            <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-1.5">
                              Pickup Schedule
                            </p>
                            <div className="flex items-start gap-2 text-slate-300">
                              <HiOutlineCalendar className="text-blue-400 mt-0.5 shrink-0" />
                              <div className="text-xs">
                                <p className="font-semibold">
                                  {new Date(preOrder.pickupDate).toLocaleDateString(undefined, {
                                    weekday: "short",
                                    year: "numeric",
                                    month: "short",
                                    day: "numeric",
                                  })}
                                </p>
                                <p className="text-slate-500 font-medium mt-0.5">at {preOrder.pickupTime}</p>
                              </div>
                            </div>
                          </div>

                          <div>
                            <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-1.5">
                              {isSeller ? "Buyer Contact" : "Seller Contact"}
                            </p>
                            <div className="flex items-start gap-2 text-slate-300">
                              <HiOutlineUser className="text-violet-400 mt-0.5 shrink-0" />
                              <div className="text-xs">
                                <p className="font-semibold">{counterParty?.name || "Community Member"}</p>
                                {counterParty?.contactNumber && (
                                  <p className="text-slate-500 font-medium flex items-center gap-1 mt-0.5">
                                    <HiOutlinePhone className="text-[10px]" /> {counterParty.contactNumber}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {preOrder.notes && (
                        <div className="mt-6 p-4 bg-[#0d1424] border border-[#1f2a3d] rounded-2xl text-xs">
                          <p className="text-[9px] font-black text-slate-600 uppercase tracking-wider mb-1">
                            Buyer Notes
                          </p>
                          <p className="text-slate-400 leading-relaxed italic">{preOrder.notes}</p>
                        </div>
                      )}

                      <div className="flex flex-wrap items-center justify-between gap-4 mt-6 pt-5 border-t border-[#1f2a3d]">
                        <div className="flex gap-2">
                          {preOrder.productId && (
                            <button
                              onClick={() => navigate(`/market/product/${preOrder.productId._id}`)}
                              className="bg-[#0d1424] hover:bg-[#131d2e] border border-[#1f2a3d] text-slate-400 hover:text-white text-[10px] font-bold uppercase tracking-widest px-4 py-2.5 rounded-xl transition-all"
                            >
                              View Product
                            </button>
                          )}
                          {counterParty && (
                            <button
                              onClick={() => navigate(`/market/product/${preOrder.productId?._id || ""}?openChat=true`)}
                              className="bg-violet-600/10 hover:bg-violet-600 border border-violet-500/20 text-violet-400 hover:text-white text-[10px] font-bold uppercase tracking-widest px-4 py-2.5 rounded-xl transition-all flex items-center gap-2"
                            >
                              <HiOutlineChatBubbleLeftRight /> Message
                            </button>
                          )}
                        </div>

                        <div className="flex gap-2">
                          {isSeller && preOrder.status === "pending" && (
                            <>
                              <button
                                disabled={updatingId !== null}
                                onClick={() => handleUpdateStatus(preOrder._id, "rejected")}
                                className="bg-rose-500/10 hover:bg-rose-600 border border-rose-500/20 hover:border-rose-500 text-rose-400 hover:text-white text-[10px] font-bold uppercase tracking-widest px-5 py-2.5 rounded-xl transition-all"
                              >
                                Reject
                              </button>
                              <button
                                disabled={updatingId !== null}
                                onClick={() => handleUpdateStatus(preOrder._id, "accepted")}
                                className="bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold uppercase tracking-widest px-5 py-2.5 rounded-xl transition-all"
                              >
                                Accept
                              </button>
                            </>
                          )}

                          {isSeller && preOrder.status === "accepted" && (
                            <button
                              disabled={updatingId !== null}
                              onClick={() => handleUpdateStatus(preOrder._id, "completed")}
                              className="bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold uppercase tracking-widest px-5 py-2.5 rounded-xl transition-all"
                            >
                              Mark Completed / Picked Up
                            </button>
                          )}

                          {!isSeller && ["pending", "accepted"].includes(preOrder.status) && (
                            <button
                              disabled={updatingId !== null}
                              onClick={() => handleUpdateStatus(preOrder._id, "cancelled")}
                              className="bg-rose-500/10 hover:bg-rose-600 border border-rose-500/20 hover:border-rose-500 text-rose-400 hover:text-white text-[10px] font-bold uppercase tracking-widest px-5 py-2.5 rounded-xl transition-all"
                            >
                              Cancel Request
                            </button>
                          )}
                        </div>
                      </div>
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

export default PreOrders;
