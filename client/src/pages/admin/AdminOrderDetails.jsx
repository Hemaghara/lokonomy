import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { adminService } from "../../services";
import AdminLayout from "../../layouts/AdminLayout";
import { motion } from "framer-motion";
import { toast } from "react-hot-toast";
import {
  FiPackage,
  FiUser,
  FiClock,
  FiAlertTriangle,
  FiArrowLeft,
  FiPhone,
  FiMapPin,
  FiCreditCard,
  FiTag,
  FiCheckCircle,
  FiTruck,
  FiShoppingBag,
} from "react-icons/fi";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] },
  }),
};

const STATUS = {
  delivered: {
    label: "Delivered",
    dot: "bg-emerald-500",
    ring: "ring-emerald-500/30",
    badge: "text-emerald-400 bg-emerald-500/10 border-emerald-500/25",
  },
  shipped: {
    label: "Shipped",
    dot: "bg-violet-500",
    ring: "ring-violet-500/30",
    badge: "text-violet-400 bg-violet-500/10 border-violet-500/25",
  },
  pending: {
    label: "Pending",
    dot: "bg-amber-400",
    ring: "ring-amber-400/30",
    badge: "text-amber-400 bg-amber-400/10 border-amber-400/25",
  },
  cancelled: {
    label: "Cancelled",
    dot: "bg-rose-500",
    ring: "ring-rose-500/30",
    badge: "text-rose-400 bg-rose-500/10 border-rose-500/25",
  },
};

const getStatus = (s) => STATUS[s] ?? STATUS.pending;

const Card = ({ children, className = "" }) => (
  <div
    className={`bg-slate-900/60 border border-slate-800/80 rounded-3xl backdrop-blur-md overflow-hidden ${className}`}
  >
    {children}
  </div>
);

const SectionHeading = ({ icon: Icon, label, accent = "text-indigo-400" }) => (
  <div className="flex items-center gap-2.5 mb-5">
    <span
      className={`inline-flex items-center justify-center w-7 h-7 rounded-xl bg-slate-800 ${accent}`}
    >
      <Icon size={14} />
    </span>
    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
      {label}
    </p>
  </div>
);

const InfoRow = ({ icon: Icon, value, accent = "text-indigo-400" }) => (
  <div className="flex items-start gap-3">
    <Icon size={13} className={`${accent} mt-0.5 shrink-0`} />
    <span className="text-xs font-medium text-slate-400 leading-relaxed">
      {value || "N/A"}
    </span>
  </div>
);

const StatBox = ({ label, value, valueClass = "text-white" }) => (
  <div className="bg-slate-800/40 border border-slate-800/60 rounded-2xl p-4">
    <p className="text-[9px] font-black uppercase tracking-widest text-slate-600 mb-1.5">
      {label}
    </p>
    <p className={`text-lg font-black ${valueClass}`}>{value}</p>
  </div>
);

const AdminOrderDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrderDetails();
  }, [id]);

  const fetchOrderDetails = async () => {
    try {
      const response = await adminService.getMarketOrderDetails(id);
      setOrder(response.data);
    } catch {
      toast.error("Failed to fetch order details");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <div className="relative w-14 h-14">
            <div className="absolute inset-0 rounded-full border-4 border-indigo-500/10" />
            <div className="absolute inset-0 rounded-full border-4 border-t-indigo-500 animate-spin" />
          </div>
          <p className="text-[10px] font-black tracking-[0.25em] uppercase text-slate-600 animate-pulse">
            Fetching Order Data…
          </p>
        </div>
      </AdminLayout>
    );
  }

  if (!order) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-5 text-center px-4">
          <div className="w-16 h-16 rounded-3xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
            <FiAlertTriangle size={28} className="text-rose-400" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white mb-1">
              Order Not Found
            </h2>
            <p className="text-slate-500 text-sm mb-4">
              This order may have been removed or doesn't exist.
            </p>
            <button
              onClick={() => navigate("/admin/marketplace")}
              className="text-xs font-black text-indigo-400 hover:text-indigo-300 underline underline-offset-4 transition-colors"
            >
              ← Back to Marketplace
            </button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  const { dot, ring, badge } = getStatus(order.orderStatus);
  const statusSteps = [
    {
      label: "Order Received",
      icon: FiShoppingBag,
      key: "pending",
      color: "amber",
    },
    { label: "Shipped", icon: FiTruck, key: "shipped", color: "violet" },
    {
      label: "Delivered",
      icon: FiCheckCircle,
      key: "delivered",
      color: "emerald",
    },
  ];
  const orderIndex = ["pending", "shipped", "delivered"].indexOf(
    order.orderStatus,
  );

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto px-2 sm:px-4 pb-20 space-y-6">
        <motion.header
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2"
        >
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => navigate(-1)}
              aria-label="Go back"
              className="shrink-0 p-2.5 sm:p-3 rounded-2xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-indigo-500/60 active:scale-95 transition-all"
            >
              <FiArrowLeft size={18} />
            </button>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-0.5">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight truncate">
                  Order{" "}
                  <span className="text-indigo-400">
                    #{order._id.slice(-8).toUpperCase()}
                  </span>
                </h1>
                <span
                  className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${badge}`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${dot} ring-2 ${ring}`}
                  />
                  {order.orderStatus}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium truncate">
                Placed{" "}
                {new Date(order.createdAt).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>
        </motion.header>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 lg:gap-6">
          <div className="xl:col-span-2 space-y-5">
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={1}
            >
              <Card className="group">
                <div className="p-5 sm:p-7">
                  <SectionHeading
                    icon={FiPackage}
                    label="Item Details"
                    accent="text-indigo-400"
                  />
                  <div className="flex flex-col sm:flex-row gap-5 sm:gap-6">
                    <div className="w-full sm:w-40 md:w-44 aspect-square sm:aspect-auto sm:h-40 md:h-44 rounded-2xl bg-slate-800 border border-slate-700/60 overflow-hidden shrink-0 shadow-xl">
                      <img
                        src={
                          order.product?.productImages?.[0] ||
                          "https://via.placeholder.com/200"
                        }
                        alt={order.product?.productName}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                    </div>

                    <div className="flex-1 min-w-0 space-y-4">
                      <div>
                        <h2 className="text-lg sm:text-xl font-black text-white group-hover:text-indigo-300 transition-colors leading-snug mb-1 truncate">
                          {order.product?.productName}
                        </h2>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                          {order.product?.mainCategory} •{" "}
                          {order.product?.subCategory}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <StatBox
                          label="Price"
                          value={`₹${order.price}`}
                          valueClass="text-emerald-400"
                        />
                        <StatBox label="Quantity" value="1 Unit" />
                      </div>

                      <div className="p-3 bg-indigo-500/5 border border-indigo-500/10 rounded-xl">
                        <p className="text-[9px] text-slate-600 font-black uppercase tracking-widest mb-1">
                          Product ID
                        </p>
                        <p className="text-[11px] font-mono text-indigo-300 break-all">
                          {order.product?._id}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <motion.div
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                custom={2}
              >
                <Card className="h-full">
                  <div className="p-5 sm:p-6">
                    <SectionHeading
                      icon={FiUser}
                      label="Buyer"
                      accent="text-emerald-400"
                    />
                    <div className="flex items-center gap-3 mb-5">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                        <FiUser size={16} className="text-emerald-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-black text-white truncate">
                          {order.buyer?.name}
                        </p>
                        <p className="text-[11px] text-slate-500 truncate">
                          {order.buyer?.email}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <InfoRow
                        icon={FiPhone}
                        value={order.contactNumber}
                        accent="text-emerald-400"
                      />
                      <InfoRow
                        icon={FiMapPin}
                        value={
                          order.shippingAddress ||
                          "No shipping address provided"
                        }
                        accent="text-emerald-400"
                      />
                    </div>
                  </div>
                </Card>
              </motion.div>

              <motion.div
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                custom={3}
              >
                <Card className="h-full">
                  <div className="p-5 sm:p-6">
                    <SectionHeading
                      icon={FiTag}
                      label="Seller"
                      accent="text-violet-400"
                    />
                    <div className="flex items-center gap-3 mb-5">
                      <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0">
                        <FiUser size={16} className="text-violet-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-black text-white truncate">
                          {order.seller?.name}
                        </p>
                        <p className="text-[11px] text-slate-500 truncate">
                          {order.seller?.email}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <InfoRow
                        icon={FiPhone}
                        value={order.seller?.mobile}
                        accent="text-violet-400"
                      />
                      <InfoRow
                        icon={FiMapPin}
                        value={
                          order.seller?.location?.address || "Location hidden"
                        }
                        accent="text-violet-400"
                      />
                    </div>
                  </div>
                </Card>
              </motion.div>
            </div>
          </div>

          <div className="space-y-5">
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={4}
            >
              <Card className="relative">
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
                <div className="p-5 sm:p-6">
                  <SectionHeading
                    icon={FiTag}
                    label="Order Summary"
                    accent="text-indigo-400"
                  />

                  <div className="space-y-3 mb-5">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                        Subtotal
                      </span>
                      <span className="text-sm font-bold text-slate-300">
                        ₹{order.price}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                        Shipping
                      </span>
                      <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">
                        Free
                      </span>
                    </div>
                    <div className="pt-3 border-t border-slate-800 flex justify-between items-center">
                      <span className="text-[10px] font-black uppercase tracking-widest text-white">
                        Total
                      </span>
                      <span className="text-2xl font-black text-indigo-400">
                        ₹{order.price}
                      </span>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-800/40 border border-slate-800/60 rounded-2xl space-y-2">
                    <div className="flex items-center gap-2.5">
                      <FiCreditCard
                        size={14}
                        className="text-indigo-400 shrink-0"
                      />
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                        Payment Method
                      </p>
                    </div>
                    <p className="text-xs font-bold text-slate-300 uppercase pl-6 tracking-wider">
                      {order.paymentMethod?.replace(/_/g, " ") || "COD"}
                    </p>
                    {order.transactionId && (
                      <div className="pl-6">
                        <p className="text-[9px] text-slate-600 font-black uppercase mb-1">
                          TXID
                        </p>
                        <p className="text-[10px] font-mono text-emerald-400 break-all">
                          {order.transactionId}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            </motion.div>

            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={5}
            >
              <Card>
                <div className="p-5 sm:p-6">
                  <SectionHeading
                    icon={FiClock}
                    label="Fulfillment"
                    accent="text-indigo-400"
                  />

                  <div className="relative">
                    <div className="absolute left-4.5 top-6 bottom-6 w-px bg-slate-800 z-0" />

                    <div className="space-y-5 relative z-10">
                      {statusSteps.map((step, i) => {
                        const isCompleted = orderIndex >= i;
                        const isActive =
                          order.orderStatus === step.key ||
                          (order.orderStatus === "cancelled" && i === 0);

                        const colorMap = {
                          amber: {
                            dot: isActive
                              ? "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]"
                              : isCompleted
                                ? "bg-amber-400/40"
                                : "bg-slate-800",
                            text: isCompleted ? "text-white" : "text-slate-600",
                          },
                          violet: {
                            dot: isActive
                              ? "bg-violet-500 shadow-[0_0_8px_rgba(139,92,246,0.5)]"
                              : isCompleted
                                ? "bg-violet-500/40"
                                : "bg-slate-800",
                            text: isCompleted ? "text-white" : "text-slate-600",
                          },
                          emerald: {
                            dot: isActive
                              ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                              : isCompleted
                                ? "bg-emerald-500/40"
                                : "bg-slate-800",
                            text: isCompleted ? "text-white" : "text-slate-600",
                          },
                        };

                        const c = colorMap[step.color];

                        return (
                          <div
                            key={step.key}
                            className="flex items-center gap-4"
                          >
                            <div
                              className={`w-9 h-9 rounded-xl border border-slate-700/50 flex items-center justify-center shrink-0 transition-all duration-300 ${c.dot}`}
                            >
                              <step.icon
                                size={15}
                                className={
                                  isCompleted ? "text-white" : "text-slate-600"
                                }
                              />
                            </div>
                            <div>
                              <p
                                className={`text-xs font-black uppercase tracking-tight ${c.text}`}
                              >
                                {step.label}
                              </p>
                              {isActive &&
                                order.orderStatus !== "cancelled" && (
                                  <p
                                    className={`text-[10px] font-medium mt-0.5 ${
                                      step.color === "emerald"
                                        ? "text-emerald-400"
                                        : step.color === "violet"
                                          ? "text-violet-400"
                                          : "text-amber-400"
                                    }`}
                                  >
                                    {step.key === "delivered"
                                      ? "Completed successfully"
                                      : step.key === "shipped"
                                        ? "On the way…"
                                        : "Processing…"}
                                  </p>
                                )}
                            </div>
                          </div>
                        );
                      })}

                      {order.orderStatus === "cancelled" && (
                        <div className="flex items-center gap-4">
                          <div className="w-9 h-9 rounded-xl bg-rose-500 border border-rose-500/20 flex items-center justify-center shrink-0 shadow-[0_0_8px_rgba(239,68,68,0.5)]">
                            <FiAlertTriangle size={15} className="text-white" />
                          </div>
                          <div>
                            <p className="text-xs font-black uppercase tracking-tight text-rose-400">
                              Cancelled
                            </p>
                            <p className="text-[10px] text-rose-400/60 font-medium mt-0.5">
                              Order was cancelled
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminOrderDetails;
