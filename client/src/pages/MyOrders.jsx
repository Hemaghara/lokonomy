import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { orderService, guaranteeService } from "../services";
import { toast } from "react-hot-toast";
import {
  HiOutlineShoppingBag,
  HiOutlineMapPin,
  HiOutlinePhone,
  HiOutlineClock,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineTruck,
  HiOutlineCurrencyRupee,
  HiOutlineTag,
  HiOutlineInbox,
  HiOutlineChevronDown,
  HiOutlineChevronUp,
  HiOutlineExclamationTriangle,
  HiOutlineCheck,
} from "react-icons/hi2";

const MyOrders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const [activeTrackingId, setActiveTrackingId] = useState(null);
  const [disputeOrder, setDisputeOrder] = useState(null);
  const [disputeReason, setDisputeReason] = useState("");
  const [disputeEvidence, setDisputeEvidence] = useState("");
  const [submittingDispute, setSubmittingDispute] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await orderService.getBuyerOrders();
      setOrders(response.data.orders);
    } catch (err) {
      console.error("Error fetching orders:", err);
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  const handleFileDispute = async (e) => {
    e.preventDefault();
    if (!disputeOrder || !disputeReason) return;
    setSubmittingDispute(true);
    try {
      const res = await guaranteeService.fileClaim({
        orderId: disputeOrder._id,
        reason: disputeReason,
        evidence: disputeEvidence,
      });
      if (res.data.success) {
        toast.success("Dispute filed under Lokonomy Guarantee!");
        setDisputeOrder(null);
        setDisputeReason("");
        setDisputeEvidence("");
        fetchOrders();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit dispute claim");
    } finally {
      setSubmittingDispute(false);
    }
  };


  const statusMap = {
    pending: {
      label: "Pending",
      color: "text-amber-400",
      bg: "bg-amber-400/10",
      icon: <HiOutlineClock />,
    },
    preparing: {
      label: "Preparing",
      color: "text-blue-400",
      bg: "bg-blue-400/10",
      icon: <HiOutlineTag />,
    },
    processing: {
      label: "Processing",
      color: "text-indigo-400",
      bg: "bg-indigo-400/10",
      icon: <HiOutlineTruck />,
    },
    shipped: {
      label: "Shipped",
      color: "text-violet-400",
      bg: "bg-violet-400/10",
      icon: <HiOutlineTruck />,
    },
    out_for_delivery: {
      label: "Out for Delivery",
      color: "text-pink-400",
      bg: "bg-pink-400/10",
      icon: <HiOutlineTruck />,
    },
    delivered: {
      label: "Delivered",
      color: "text-emerald-400",
      bg: "bg-emerald-400/10",
      icon: <HiOutlineCheckCircle />,
    },
    cancelled: {
      label: "Cancelled",
      color: "text-rose-400",
      bg: "bg-rose-400/10",
      icon: <HiOutlineXCircle />,
    },
  };

  const getStatusConfig = (status) => statusMap[status] || statusMap.pending;

  if (loading)
    return (
      <div className="min-h-screen bg-[#080e1a] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 border-2 border-violet-500/20 border-t-violet-500 rounded-full animate-spin" />
            <HiOutlineInbox className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-violet-500 text-xl" />
          </div>
          <span className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] animate-pulse">
            Fetching Order History
          </span>
        </div>
      </div>
    );

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
              <div className="w-2 h-2 rounded-full bg-violet-500" />
              <span className="text-[10px] font-bold text-violet-400 uppercase tracking-[0.2em]">
                Purchase History
              </span>
            </div>
            <h1 className="text-white font-black text-3xl md:text-4xl tracking-tight mb-2">
              My{" "}
              <span className="text-transparent bg-clip-text bg-linear-to-r from-violet-400 to-indigo-400">
                Orders
              </span>
            </h1>
            <p className="text-slate-500 text-sm">
              Manage your purchases, track deliveries, and contact sellers.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => navigate("/market")}
              className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white text-xs font-black uppercase tracking-widest px-6 py-3 rounded-xl transition-all shadow-lg shadow-violet-900/30"
            >
              <HiOutlineShoppingBag className="text-base" /> Market
            </button>
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          {orders.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-24 bg-[#111827] border border-[#1f2a3d] rounded-[2.5rem] shadow-2xl shadow-black/40"
            >
              <div className="w-20 h-20 bg-[#0d1424] rounded-full flex items-center justify-center text-4xl mx-auto mb-6 opacity-40">
                🛒
              </div>
              <h2 className="text-white font-black text-2xl mb-2">
                Your cart feels lonely
              </h2>
              <p className="text-slate-500 text-sm max-w-xs mx-auto mb-8">
                You haven't made any purchases yet. Start exploring local
                products today!
              </p>
              <button
                onClick={() => navigate("/market")}
                className="bg-white text-black text-[10px] font-black uppercase tracking-widest px-8 py-3.5 rounded-2xl hover:bg-slate-200 transition-all shadow-xl shadow-white/5"
              >
                Start Shopping Now
              </button>
            </motion.div>
          ) : (
            <div className="space-y-6">
              {orders.map((order, idx) => {
                const status = getStatusConfig(order.orderStatus);
                return (
                  <motion.div
                    key={order._id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="bg-[#111827] border border-[#1f2a3d] rounded-4xl overflow-hidden hover:border-violet-500/20 transition-all shadow-xl shadow-black/20 group"
                  >
                    <div className="p-6 sm:p-8">
                      <div className="flex flex-col md:flex-row gap-8">
                        <div className="flex-1 flex gap-6">
                          <div className="w-24 h-24 sm:w-32 sm:h-32 bg-[#080e1a] rounded-2xl overflow-hidden border border-[#1f2a3d] shrink-0 relative">
                            <img
                              src={
                                order.product?.productImages?.[0] ||
                                order.product?.productImage
                              }
                              alt={order.product?.productName}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                            />
                            <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/60 backdrop-blur-md rounded-md border border-white/5 text-[8px] font-black text-white uppercase">
                              #{order._id.slice(-6).toUpperCase()}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-3 mb-2">
                              <span
                                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[9px] font-black uppercase tracking-wider ${status.color} ${status.bg}`}
                              >
                                {status.icon}
                                {status.label}
                              </span>
                              <span className="text-slate-600 text-[9px] font-black uppercase tracking-widest border border-slate-700 px-2 py-1 rounded-full">
                                {new Date(order.createdAt).toLocaleDateString(
                                  "en-IN",
                                  { day: "2-digit", month: "short" },
                                )}
                              </span>
                            </div>
                            <h3 className="text-white font-black text-xl mb-1 truncate group-hover:text-violet-400 transition-colors">
                              {order.product?.productName}
                            </h3>
                            <div className="flex items-center gap-1 text-emerald-400 font-black text-lg mb-4">
                              <HiOutlineCurrencyRupee className="text-xl" />
                              {order.price.toLocaleString()}
                            </div>

                            <div className="flex flex-wrap gap-2">
                              <button
                                onClick={() =>
                                  navigate(
                                    `/market/product/${order.product?._id}`,
                                  )
                                }
                                className="bg-[#080e1a] hover:bg-black border border-[#1f2a3d] text-slate-400 hover:text-white text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl transition-all"
                              >
                                View Product
                              </button>
                              <a
                                href={`tel:${order.contactNumber}`}
                                className="bg-violet-600/10 hover:bg-violet-600 border border-violet-500/20 text-violet-400 hover:text-white text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl transition-all flex items-center gap-2"
                              >
                                <HiOutlinePhone /> Contact Seller
                              </a>
                              {order.tracking && (
                                <button
                                  onClick={() => setActiveTrackingId(activeTrackingId === order._id ? null : order._id)}
                                  className="bg-indigo-600/10 hover:bg-indigo-600 border border-indigo-500/20 text-indigo-400 hover:text-white text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl transition-all flex items-center gap-2"
                                >
                                  <HiOutlineTruck /> {activeTrackingId === order._id ? "Hide Track" : "Track Route"}
                                </button>
                              )}
                              {["shipped", "delivered"].includes(order.orderStatus) && (
                                <button
                                  onClick={() => setDisputeOrder(order)}
                                  className="bg-amber-600/10 hover:bg-amber-600 border border-amber-500/20 text-amber-400 hover:text-white text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl transition-all flex items-center gap-2"
                                >
                                  <HiOutlineExclamationTriangle /> Guarantee Dispute
                                </button>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="md:w-56 flex flex-col justify-center border-t md:border-t-0 md:border-l border-[#1f2a3d] pt-6 md:pt-0 md:pl-8 space-y-4">
                          <div className="space-y-1">
                            <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">
                              Deliver to
                            </p>
                            <div className="flex items-start gap-2">
                              <HiOutlineMapPin className="text-rose-400 mt-0.5" />
                              <p className="text-slate-400 text-[10px] leading-relaxed italic line-clamp-2">
                                {order.shippingAddress}
                              </p>
                            </div>
                          </div>
                          <div className="space-y-1">
                            <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">
                              Payment
                            </p>
                            <div className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-tight">
                                {order.paymentMethod?.replace(/_/g, " ")}{" "}
                                Successful
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {activeTrackingId === order._id && order.tracking && (
                        <div className="border-t border-[#1f2a3d] bg-[#080e1a] p-6 space-y-6">
                          <h4 className="text-white font-bold text-sm flex items-center gap-2">
                            <HiOutlineTruck className="text-indigo-400 animate-bounce" /> Live Delivery Route Tracking
                          </h4>
                          
                          <div className="relative h-44 bg-[#0d1424] border border-[#1f2a3d] rounded-2xl overflow-hidden flex items-center justify-center">
                            <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f2a3d_1px,transparent_1px),linear-gradient(to_bottom,#1f2a3d_1px,transparent_1px)] bg-[size:16px_16px] opacity-20" />
                            <svg className="w-full h-full absolute inset-0 text-indigo-500/30" xmlns="http://www.w3.org/2000/svg">
                              <path d="M 50 120 Q 150 40, 250 120 T 450 80" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" />
                              <circle cx="50" cy="120" r="4" fill="#6366f1" />
                              <circle cx="450" cy="80" r="4" fill="#10b981" />
                            </svg>
                            <div 
                              className="absolute w-4 h-4 bg-indigo-500 rounded-full border border-white flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.8)] animate-pulse"
                              style={{ left: "55%", top: "45%" }}
                            >
                              <div className="w-1.5 h-1.5 bg-white rounded-full" />
                            </div>
                            <div className="absolute top-3 left-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-lg border border-white/5 text-[9px] font-black text-slate-400">
                              CURRENT POSITION: {order.tracking.currentLocation?.lat || "19.0760"}° N, {order.tracking.currentLocation?.lng || "72.8777"}° E
                            </div>
                            <div className="absolute bottom-3 right-4 bg-emerald-500/15 border border-emerald-500/25 px-3 py-1 rounded-lg text-[9px] font-black text-emerald-400">
                              EST DELIVERY: {order.tracking.estimatedDelivery ? new Date(order.tracking.estimatedDelivery).toLocaleDateString() : "Pending"}
                            </div>
                          </div>

                          <div className="flex items-center justify-between relative max-w-md mx-auto">
                            <div className="absolute h-0.5 bg-[#1f2a3d] left-4 right-4 top-1/2 -translate-y-1/2" />
                            <div 
                              className="absolute h-0.5 bg-linear-to-r from-violet-500 to-indigo-500 left-4 top-1/2 -translate-y-1/2 transition-all duration-500" 
                              style={{ 
                                width: order.orderStatus === "delivered" ? "92%" : 
                                       order.orderStatus === "out_for_delivery" ? "68%" :
                                       order.orderStatus === "shipped" ? "42%" : "12%" 
                              }}
                            />
                            {[
                              { label: "Preparing", step: "preparing" },
                              { label: "Shipped", step: "shipped" },
                              { label: "Out for Delivery", step: "out_for_delivery" },
                              { label: "Delivered", step: "delivered" }
                            ].map((s, idx) => {
                              const steps = ["preparing", "processing", "shipped", "out_for_delivery", "delivered"];
                              const currentIdx = steps.indexOf(order.orderStatus);
                              const stepIdx = steps.indexOf(s.step);
                              const isCompleted = currentIdx >= stepIdx;
                              return (
                                <div key={idx} className="relative z-10 flex flex-col items-center gap-1.5 bg-[#080e1a] px-2">
                                  <div className={`w-6 h-6 rounded-full flex items-center justify-center border text-[10px] font-black transition-all ${
                                    isCompleted ? "bg-violet-600 border-violet-500 text-white shadow-lg shadow-violet-900/40" : "bg-[#0d1424] border-[#1f2a3d] text-slate-500"
                                  }`}>
                                    {isCompleted ? <HiOutlineCheck className="text-[10px]" /> : idx + 1}
                                  </div>
                                  <span className={`text-[9px] font-bold uppercase tracking-wider ${isCompleted ? "text-violet-400" : "text-slate-500"}`}>{s.label}</span>
                                </div>
                              );
                            })}
                          </div>

                          <div className="space-y-3 mt-4">
                            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Activity Logs</p>
                            <div className="space-y-2 max-h-36 overflow-y-auto pr-2">
                              {order.tracking.updates?.slice().reverse().map((upd, idx) => (
                                <div key={idx} className="bg-[#0d1424] border border-[#1f2a3d] p-3 rounded-xl flex justify-between gap-3 text-xs">
                                  <div>
                                    <p className="text-white font-semibold leading-relaxed">{upd.note}</p>
                                    <span className="text-[9px] font-bold uppercase tracking-wider text-indigo-400 mt-1 block">{upd.status.replace(/_/g, ' ')}</span>
                                  </div>
                                  <span className="text-slate-500 text-[10px] font-semibold">{new Date(upd.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}, {new Date(upd.timestamp).toLocaleDateString()}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </AnimatePresence>

        {disputeOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-[#111827] border border-[#1f2a3d] p-6 rounded-[2.5rem] w-full max-w-md relative shadow-2xl"
            >
              <h3 className="text-white font-black text-xl mb-4 flex items-center gap-2">
                <HiOutlineExclamationTriangle className="text-amber-500" /> Lokonomy Guarantee Dispute
              </h3>
              <p className="text-slate-500 text-xs mb-4">
                You are raising a claim for order #{disputeOrder._id.slice(-6).toUpperCase()}. Lokonomy mediators will investigate the dispute under the Guarantee Program.
              </p>
              <form onSubmit={handleFileDispute} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Reason for Dispute</label>
                  <textarea
                    rows={3}
                    placeholder="Describe why you are raising the dispute (e.g. item never arrived, defective or wrong item received)..."
                    value={disputeReason}
                    onChange={(e) => setDisputeReason(e.target.value)}
                    className="w-full bg-[#080e1a] border border-[#1f2a3d] text-xs text-white rounded-2xl p-3 outline-hidden focus:border-violet-500 resize-none"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Evidence Details</label>
                  <textarea
                    rows={2}
                    placeholder="Provide additional context or links to screenshot evidence..."
                    value={disputeEvidence}
                    onChange={(e) => setDisputeEvidence(e.target.value)}
                    className="w-full bg-[#080e1a] border border-[#1f2a3d] text-xs text-white rounded-2xl p-3 outline-hidden focus:border-violet-500 resize-none"
                  />
                </div>
                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setDisputeOrder(null)}
                    className="flex-1 py-3 bg-[#0d1424] hover:bg-black border border-[#1f2a3d] text-slate-400 hover:text-white text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingDispute}
                    className="flex-1 py-3 bg-linear-to-r from-violet-600 to-indigo-600 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all shadow-lg shadow-violet-900/30 flex justify-center items-center"
                  >
                    {submittingDispute ? "Filing Claim..." : "File Dispute"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyOrders;
