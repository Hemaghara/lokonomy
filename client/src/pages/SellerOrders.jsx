import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from "framer-motion";
import { orderService, marketService, businessService, aiInsightsService, subscriptionBoxService } from "../services";
import { useUser } from "../context/UserContext";
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
  HiOutlineUser,
  HiOutlineClipboardDocument,
  HiOutlineTag,
  HiOutlineCreditCard,
  HiOutlineBanknotes,
  HiOutlineArrowTrendingUp,
  HiOutlineFunnel,
  HiOutlineInbox,
  HiOutlineSparkles,
  HiOutlineChatBubbleLeftRight,
  HiOutlineServer,
} from "react-icons/hi2";

const SellerOrders = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const [orders, setOrders] = useState([]);
  const [myProducts, setMyProducts] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [statusFilter, setStatusFilter] = useState("all");

  const [myBusiness, setMyBusiness] = useState(null);
  const [aiInsights, setAiInsights] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);
  const [autoResponseEnabled, setAutoResponseEnabled] = useState(false);
  const [awayMessage, setAwayMessage] = useState("");
  const [autoResponses, setAutoResponses] = useState([]);
  const [newTrigger, setNewTrigger] = useState("");
  const [newResponse, setNewResponse] = useState("");

  const [trackingModalOrder, setTrackingModalOrder] = useState(null);
  const [trackingStatus, setTrackingStatus] = useState("");
  const [trackingLat, setTrackingLat] = useState("");
  const [trackingLng, setTrackingLng] = useState("");
  const [trackingEstDelivery, setTrackingEstDelivery] = useState("");
  const [trackingNote, setTrackingNote] = useState("");
  const [submittingTracking, setSubmittingTracking] = useState(false);

  const [subscriptionBoxes, setSubscriptionBoxes] = useState([]);
  const [boxName, setBoxName] = useState("");
  const [boxDescription, setBoxDescription] = useState("");
  const [boxPrice, setBoxPrice] = useState("");
  const [boxFrequency, setBoxFrequency] = useState("monthly");
  const [boxItems, setBoxItems] = useState("");
  const [creatingBox, setCreatingBox] = useState(false);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchData = async () => {
    console.log("Fetching data for SellerOrders...");
    setLoading(true);
    try {
      const [ordersRes, productsRes, statsRes, bizRes] = await Promise.all([
        orderService.getSellerOrders(),
        marketService.getMyProducts(),
        orderService.getSellerStats(),
        businessService.getMyBusinesses(),
      ]);
      console.log("Data fetched successfully", { orders: ordersRes.data, products: productsRes.data, stats: statsRes.data });
      setOrders(ordersRes.data.orders);
      setMyProducts(productsRes.data);
      setStats(statsRes.data.stats);

      if (bizRes.data && bizRes.data.length > 0) {
        const biz = bizRes.data[0];
        setMyBusiness(biz);
        setAutoResponseEnabled(biz.autoResponseEnabled || false);
        setAwayMessage(biz.awayMessage || "");
        setAutoResponses(biz.autoResponses || []);

        const plan = user?.subscription?.plan || "free";
        if (plan === "gold" || plan === "platinum") {
          setAiLoading(true);
          try {
            const aiRes = await aiInsightsService.getAIInsights(biz._id);
            if (aiRes.data.success) {
              setAiInsights(aiRes.data.insights);
            } else {
              setAiError(aiRes.data.message || "Failed to load AI Insights");
            }
          } catch (err) {
            console.error("Error fetching AI Insights:", err);
            setAiError(err.response?.data?.message || "Failed to load AI Insights");
          } finally {
            setAiLoading(false);
          }
        }

        try {
          const boxesRes = await subscriptionBoxService.getSellerBoxes();
          if (boxesRes.data.success) {
            setSubscriptionBoxes(boxesRes.data.boxes || []);
          }
        } catch (err) {
          console.error("Error fetching subscription boxes:", err);
        }
      }
    } catch (err) {
      console.error("Error fetching seller data:", err);
      toast.error("Failed to load dashboard data");
    } finally {
      console.log("Setting loading to false");
      setLoading(false);
    }
  };


  const handleUpdateStatus = async (orderId, newStatus) => {
    setUpdatingId(orderId);
    try {
      await orderService.updateOrderStatus(orderId, newStatus);
      toast.success(`Order marked as ${newStatus}`);
      const [oRes, sRes] = await Promise.all([
        orderService.getSellerOrders(),
        orderService.getSellerStats(),
      ]);
      setOrders(oRes.data.orders);
      setStats(sRes.data.stats);
    } catch {
      toast.error("Failed to update status");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleSaveChatbot = async () => {
    if (!myBusiness) return;
    try {
      const res = await businessService.updateBusiness(myBusiness._id, {
        autoResponseEnabled,
        awayMessage,
        autoResponses,
      });
      if (res.data.success) {
        toast.success("Chatbot settings updated successfully!");
        setMyBusiness(res.data.business);
      }
    } catch {
      toast.error("Failed to update chatbot settings");
    }
  };

  const handleAddResponse = () => {
    if (!newTrigger.trim() || !newResponse.trim()) {
      toast.error("Please fill in both keyword and response");
      return;
    }
    const updated = [...autoResponses, { trigger: newTrigger.trim(), response: newResponse.trim() }];
    setAutoResponses(updated);
    setNewTrigger("");
    setNewResponse("");
  };

  const handleDeleteResponse = (idx) => {
    const updated = autoResponses.filter((_, i) => i !== idx);
    setAutoResponses(updated);
  };

  const handleCreateSubscriptionBox = async (e) => {
    e.preventDefault();
    if (!boxName || !boxDescription || !boxPrice) {
      toast.error("Name, description, and price are required");
      return;
    }
    setCreatingBox(true);
    try {
      const res = await subscriptionBoxService.createBox({
        name: boxName,
        description: boxDescription,
        price: Number(boxPrice),
        frequency: boxFrequency,
        items: boxItems,
      });
      if (res.data.success) {
        toast.success("Subscription box created!");
        setBoxName("");
        setBoxDescription("");
        setBoxPrice("");
        setBoxItems("");
        const boxesRes = await subscriptionBoxService.getSellerBoxes();
        if (boxesRes.data.success) {
          setSubscriptionBoxes(boxesRes.data.boxes || []);
        }
      }
    } catch {
      toast.error("Failed to create subscription box");
    } finally {
      setCreatingBox(false);
    }
  };

  const handleUpdateTracking = async (e) => {
    e.preventDefault();
    if (!trackingModalOrder || !trackingStatus) return;
    setSubmittingTracking(true);
    try {
      const res = await orderService.updateOrderTracking(trackingModalOrder._id, {
        status: trackingStatus,
        lat: trackingLat || "0",
        lng: trackingLng || "0",
        estimatedDelivery: trackingEstDelivery,
        note: trackingNote || `Order status updated to ${trackingStatus.replace(/_/g, ' ')}`,
      });
      if (res.data.success) {
        toast.success("Delivery tracking updated successfully!");
        setTrackingModalOrder(null);
        const ordersRes = await orderService.getSellerOrders();
        setOrders(ordersRes.data.orders);
      }
    } catch {
      toast.error("Failed to update tracking information");
    } finally {
      setSubmittingTracking(false);
    }
  };

  const statusOptions = [
    {
      value: "pending",
      label: "Pending",
      icon: <HiOutlineClock />,
      color: "text-amber-400",
      bg: "bg-amber-400/10",
    },
    {
      value: "preparing",
      label: "Preparing",
      icon: <HiOutlineTag />,
      color: "text-blue-400",
      bg: "bg-blue-400/10",
    },
    {
      value: "processing",
      label: "Processing",
      icon: <HiOutlineTruck />,
      color: "text-indigo-400",
      bg: "bg-indigo-400/10",
    },
    {
      value: "shipped",
      label: "Shipped",
      icon: <HiOutlineTruck />,
      color: "text-violet-400",
      bg: "bg-violet-400/10",
    },
    {
      value: "out_for_delivery",
      label: "Out for Delivery",
      icon: <HiOutlineTruck />,
      color: "text-pink-400",
      bg: "bg-pink-400/10",
    },
    {
      value: "delivered",
      label: "Delivered",
      icon: <HiOutlineCheckCircle />,
      color: "text-emerald-400",
      bg: "bg-emerald-400/10",
    },
    {
      value: "cancelled",
      label: "Cancelled",
      icon: <HiOutlineXCircle />,
      color: "text-rose-400",
      bg: "bg-rose-400/10",
    },
  ];

  const filteredOrders = useMemo(() => {
    if (statusFilter === "all") return orders;
    return orders.filter((o) => o.orderStatus === statusFilter);
  }, [orders, statusFilter]);

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm("Are you sure you want to remove this product?"))
      return;
    try {
      await marketService.deleteProduct(productId);
      toast.success("Product removed");
      fetchData();
    } catch {
      toast.error("Failed to delete product");
    }
  };

  if (loading)
    return (
      <div className="min-h-screen bg-[#080e1a] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-9 h-9 border-2 border-violet-500/20 border-t-violet-500 rounded-full animate-spin" />
          <span className="text-slate-500 text-xs font-medium uppercase tracking-widest">
            Loading Dashboard…
          </span>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-[#080e1a] pt-24 pb-20">
      <div className="max-w-6xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10"
        >
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-violet-500 animate-pulse" />
              <span className="text-[10px] font-bold text-violet-400 uppercase tracking-[0.2em]">
                Live Seller Portal
              </span>
            </div>
            <h1 className="text-white font-black text-3xl md:text-4xl tracking-tight mb-2">
              Business{" "}
              <span className="text-transparent bg-clip-text bg-linear-to-r from-violet-400 to-indigo-400">
                Overview
              </span>
            </h1>
            <p className="text-slate-500 text-sm max-w-md">
              Monitor your growth, manage fulfillment, and track daily revenue
              metrics.
            </p>
          </div>

          <div className="flex flex-wrap bg-[#0d1424] border border-[#1f2a3d] p-1 rounded-2xl shadow-xl shadow-black/20 gap-1">
            {[
              {
                id: "dashboard",
                label: "Dashboard",
                icon: <HiOutlineArrowTrendingUp />,
              },
              { id: "orders", label: "Orders", icon: <HiOutlineInbox /> },
              { id: "products", label: "Products", icon: <HiOutlineTag /> },
              { id: "growth", label: "Growth & AI", icon: <HiOutlineSparkles /> },
              { id: "subscriptions", label: "Subscriptions", icon: <HiOutlineServer /> },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 ${
                  activeTab === tab.id
                    ? "bg-violet-600 text-white shadow-lg shadow-violet-900/40"
                    : "text-slate-500 hover:text-slate-300 hover:bg-white/5"
                }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          {activeTab === "dashboard" && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-[#111827] border border-[#1f2a3d] p-6 rounded-3xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                    <HiOutlineBanknotes className="text-7xl" />
                  </div>
                  <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">
                    Net Earnings
                  </p>
                  <h3 className="text-3xl font-black text-white mb-2">
                    ₹{stats?.netEarnings?.toLocaleString() || 0}
                  </h3>
                  <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                    <HiOutlineArrowTrendingUp className="text-xs" /> After {stats?.currentCommissionRate || 5}% commission
                  </div>
                </div>

                <div className="bg-[#111827] border border-[#1f2a3d] p-6 rounded-3xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                    <HiOutlineCurrencyRupee className="text-7xl" />
                  </div>
                  <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">
                    Gross Revenue
                  </p>
                  <h3 className="text-3xl font-black text-white mb-2">
                    ₹{stats?.grossEarnings?.toLocaleString() || 0}
                  </h3>
                  <p className="text-slate-600 text-[10px] font-medium uppercase tracking-tight">
                    Before commission
                  </p>
                </div>

                <div className="bg-[#111827] border border-[#1f2a3d] p-6 rounded-3xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                    <HiOutlineClipboardDocument className="text-7xl" />
                  </div>
                  <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">
                    Platform Fee
                  </p>
                  <h3 className="text-3xl font-black text-amber-400 mb-2">
                    ₹{stats?.totalCommission?.toLocaleString() || 0}
                  </h3>
                  <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-bold">
                    {stats?.currentCommissionRate || 5}% rate
                    {stats?.currentCommissionRate > 2 && (
                      <span className="ml-1 text-violet-400 cursor-pointer" title="Upgrade your plan to reduce commission rate!">
                        · Upgrade to save
                      </span>
                    )}
                  </div>
                </div>

                <div className="bg-[#111827] border border-[#1f2a3d] p-6 rounded-3xl">
                  <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">
                    Total Orders
                  </p>
                  <h3 className="text-3xl font-black text-white mb-2">
                    {stats?.totalOrders}
                  </h3>
                  <p className="text-slate-600 text-[10px] font-medium uppercase tracking-tight">
                    Across all time
                  </p>
                </div>

                {user?.subscription?.plan === "gold" ||
                user?.subscription?.plan === "platinum" ? (
                  <>
                    <div className="bg-[#111827] border border-[#1f2a3d] p-6 rounded-3xl">
                      <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">
                        Pending Sync
                      </p>
                      <h3 className="text-3xl font-black text-white mb-2">
                        {stats?.statusCounts.pending}
                      </h3>
                      <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-bold">
                        <HiOutlineClock className="text-xs" /> Awaiting action
                      </div>
                    </div>

                    <div className="bg-[#111827] border border-[#1f2a3d] p-6 rounded-3xl">
                      <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">
                        Product List
                      </p>
                      <h3 className="text-3xl font-black text-white mb-2">
                        {myProducts.length}
                      </h3>
                      <p className="text-slate-600 text-[10px] font-medium uppercase tracking-tight">
                        Market visibility: 100%
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="lg:col-span-2 bg-linear-to-br from-violet-600/10 to-indigo-600/10 border border-violet-500/20 p-6 rounded-3xl flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      
                      <div>
                        <h4 className="text-white font-bold text-sm">
                          Unlock Premium Stats
                        </h4>
                        <p className="text-slate-500 text-[10px]">
                          Get deeper insights with Gold or Platinum
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => navigate("/upgrade-plan")}
                      className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-violet-900/40"
                    >
                      Upgrade
                    </button>
                  </div>
                )}
              </div>

              {user?.subscription?.plan === "gold" ||
              user?.subscription?.plan === "platinum" ? (
                <div className="grid lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 bg-[#111827] border border-[#1f2a3d] p-8 rounded-[2.5rem] relative overflow-hidden">
                    <div className="flex items-center justify-between mb-8">
                      <div>
                        <h4 className="text-white font-bold text-lg">
                          Daily Revenue
                        </h4>
                        <p className="text-slate-500 text-xs">
                          Last 7 days performance
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5 text-slate-500 text-xs font-bold">
                          <div className="w-2 h-2 rounded-full bg-slate-500 opacity-40" /> Gross
                        </div>
                        <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold">
                          <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />{" "}
                          Net
                        </div>
                      </div>
                    </div>

                    <div className="h-48 flex items-end justify-between gap-4 px-2">
                      {stats?.dailySales.map((day, i) => {
                        const maxAmount = Math.max(
                          ...stats.dailySales.map((d) => d.gross || 0),
                          1,
                        );
                        const grossHeight = ((day.gross || 0) / maxAmount) * 100;
                        const netHeight = ((day.net || 0) / maxAmount) * 100;
                        return (
                          <div
                            key={i}
                            className="flex-1 flex flex-col items-center gap-3 group relative"
                          >
                            <div className="w-full flex justify-center items-end h-32 relative gap-0.5">
                              <motion.div
                                initial={{ height: 0 }}
                                animate={{ height: `${grossHeight}%` }}
                                transition={{ duration: 1, delay: i * 0.1 }}
                                className="w-1/2 sm:w-3 bg-linear-to-t from-slate-700 via-slate-600 to-slate-500 rounded-lg relative z-10 opacity-40"
                              />
                              <motion.div
                                initial={{ height: 0 }}
                                animate={{ height: `${netHeight}%` }}
                                transition={{ duration: 1, delay: i * 0.1 + 0.05 }}
                                className="w-1/2 sm:w-3 bg-linear-to-t from-violet-600 via-indigo-500 to-indigo-400 rounded-lg relative z-10 shadow-lg shadow-indigo-900/20 group-hover:from-violet-500 group-hover:to-indigo-300 transition-all duration-300"
                              />
                              <div className="absolute -top-10 scale-0 group-hover:scale-100 transition-transform bg-white text-black px-2 py-1 rounded text-xs font-bold z-20 whitespace-nowrap">
                                Net: ₹{(day.net || 0).toLocaleString()} | Fee: ₹{(day.commission || 0).toLocaleString()}
                              </div>
                            </div>
                            <p className="text-[10px] font-bold text-slate-500 uppercase">
                              {new Date(day.date).toLocaleDateString("en-IN", {
                                weekday: "short",
                              })}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="bg-[#111827] border border-[#1f2a3d] p-8 rounded-[2.5rem]">
                    <h4 className="text-white font-bold text-lg mb-6">
                      Order Status
                    </h4>
                    <div className="space-y-4">
                      {statusOptions.slice(0, 5).map((opt) => {
                        const count = stats?.statusCounts[opt.value] || 0;
                        const percentage =
                          stats?.totalOrders > 0
                            ? (count / stats.totalOrders) * 100
                            : 0;
                        return (
                          <div key={opt.value} className="space-y-2">
                            <div className="flex justify-between items-end">
                              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                {opt.icon} {opt.label}
                              </span>
                              <span className="text-white text-xs font-bold">
                                {count}
                              </span>
                            </div>
                            <div className="h-1.5 bg-[#0d1424] rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${percentage}%` }}
                                className={`h-full ${opt.bg.replace("/10", "")}`}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-[#111827] border border-[#1f2a3d] rounded-[2.5rem] p-12 text-center overflow-hidden relative">
                  <div className="absolute inset-0 bg-linear-to-br from-violet-600/5 to-indigo-600/5" />
                  <div className="relative z-10">
                   
                    <h3 className="text-white font-black text-2xl mb-3 tracking-tight">
                      Advanced Analytics Locked
                    </h3>
                    <p className="text-slate-500 text-sm max-w-sm mx-auto mb-8">
                      Upgrade to Gold or Platinum plan to unlock daily revenue
                      charts, order distribution metrics, and detailed business
                      growth tracking.
                    </p>
                    <button
                      onClick={() => navigate("/upgrade-plan")}
                      className="px-8 py-3.5 bg-linear-to-r from-violet-600 to-indigo-600 text-white font-black text-[13px] uppercase tracking-widest rounded-2xl shadow-xl shadow-violet-900/40 hover:scale-105 active:scale-95 transition-all"
                    >
                      Unlock Charts Now
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === "orders" && (
            <motion.div
              key="orders"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="space-y-6"
            >
              <div className="bg-[#111827] border border-[#1f2a3d] p-4 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-slate-400">
                  <HiOutlineFunnel className="text-lg" />
                  <span className="text-xs font-bold uppercase tracking-wider">
                    Filter Status:
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {["all", ...statusOptions.map((o) => o.value)].map((val) => (
                    <button
                      key={val}
                      onClick={() => setStatusFilter(val)}
                      className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                        statusFilter === val
                          ? "bg-white text-black"
                          : "bg-[#0d1424] text-slate-500 hover:text-slate-300 border border-[#1f2a3d]"
                      }`}
                    >
                      {val.replace(/_/g, " ")}{" "}
                      {val !== "all" &&
                        orders.filter((o) => o.orderStatus === val).length >
                          0 &&
                        `(${orders.filter((o) => o.orderStatus === val).length})`}
                    </button>
                  ))}
                </div>
              </div>

              {filteredOrders.length === 0 ? (
                <div className="text-center py-24 bg-[#111827] border border-[#1f2a3d] rounded-[2.5rem]">
                 
                  <h2 className="text-white font-bold text-xl mb-2">
                    No results found
                  </h2>
                  <p className="text-slate-500 text-sm">
                    We couldn't find any orders matching the "{statusFilter}"
                    filter.
                  </p>
                </div>
              ) : (
                <div className="grid gap-6">
                  {filteredOrders.map((order) => (
                    <motion.div
                      layout
                      key={order._id}
                      className="bg-[#111827] border border-[#1f2a3d] rounded-3xl overflow-hidden hover:border-violet-500/20 transition-all shadow-xl shadow-black/10"
                    >
                      <div className="p-6 md:p-8">
                        <div className="flex flex-col lg:flex-row gap-8">
                          <div className="flex-1 space-y-6">
                            <div className="flex items-start gap-5">
                              <div className="w-24 h-24 shrink-0 relative">
                                <img
                                  src={
                                    order.product?.productImages?.[0] ||
                                    order.product?.productImage
                                  }
                                  className="w-full h-full object-cover rounded-2xl border border-[#1f2a3d]"
                                  alt=""
                                />
                                <div className="absolute -bottom-2 -right-2 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-lg border border-white/5 text-[9px] font-black text-violet-400">
                                  #{order._id.slice(-6).toUpperCase()}
                                </div>
                              </div>
                              <div className="min-w-0 flex-1">
                                <h3 className="text-white font-black text-xl mb-1 truncate">
                                  {order.product?.productName}
                                </h3>
                                <div className="flex items-center gap-2 mb-3 flex-wrap">
                                  <span className="text-emerald-400 font-black text-lg">
                                    ₹{order.price?.toLocaleString()}
                                  </span>
                                  {order.commissionAmount > 0 && (
                                    <span className="text-amber-400/70 text-[10px] font-bold bg-amber-500/10 border border-amber-500/15 px-2 py-0.5 rounded-md" title={`Commission: ₹${order.commissionAmount} (${order.commissionRate}%)`}>
                                      Fee: ₹{order.commissionAmount} · Net: ₹{order.sellerPayout}
                                    </span>
                                  )}
                                  <span className="text-slate-600 text-xs font-bold uppercase tracking-widest bg-slate-400/5 px-2 py-0.5 rounded-md border border-slate-400/10">
                                    {order.paymentMethod?.replace(/_/g, " ")}
                                  </span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  {statusOptions.find(
                                    (o) => o.value === order.orderStatus,
                                  ) && (
                                    <span
                                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-wider ${statusOptions.find((o) => o.value === order.orderStatus).color} ${statusOptions.find((o) => o.value === order.orderStatus).bg}`}
                                    >
                                      {
                                        statusOptions.find(
                                          (o) => o.value === order.orderStatus,
                                        ).icon
                                      }
                                      {order.orderStatus.replace(/_/g, " ")}
                                    </span>
                                  )}
                                  {order.transactionId && (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-sky-400/20 bg-sky-400/5 text-sky-400 text-[10px] font-black uppercase tracking-wider">
                                      <HiOutlineCreditCard /> Paid
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="grid sm:grid-cols-2 gap-4">
                              <div className="bg-[#080e1a] p-5 rounded-3xl border border-[#1f2a3d]">
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-3">
                                  Buyer Profile
                                </p>
                                <div className="space-y-2">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-violet-600/10 flex items-center justify-center text-violet-400 text-sm">
                                      <HiOutlineUser />
                                    </div>
                                    <div>
                                      <p className="text-white text-xs font-bold leading-none">
                                        {order.buyer?.name}
                                      </p>
                                      <p className="text-slate-500 text-[10px]">
                                        {order.buyer?.email}
                                      </p>
                                    </div>
                                  </div>
                                  <button
                                    onClick={() =>
                                      (window.location.href = `tel:${order.contactNumber}`)
                                    }
                                    className="w-full mt-2 flex items-center justify-center gap-2 py-2 rounded-xl bg-violet-600/10 hover:bg-violet-600 text-violet-400 hover:text-white text-[10px] font-bold transition-all border border-violet-500/20"
                                  >
                                    <HiOutlinePhone className="text-xs" />{" "}
                                    {order.contactNumber}
                                  </button>
                                  {["shipped", "out_for_delivery", "processing", "preparing"].includes(order.orderStatus) && (
                                    <button
                                      onClick={() => {
                                        setTrackingModalOrder(order);
                                        setTrackingStatus(order.orderStatus);
                                        setTrackingLat(order.tracking?.currentLocation?.lat || "0");
                                        setTrackingLng(order.tracking?.currentLocation?.lng || "0");
                                        setTrackingEstDelivery(order.tracking?.estimatedDelivery ? new Date(order.tracking.estimatedDelivery).toISOString().substring(0, 10) : "");
                                        setTrackingNote("");
                                      }}
                                      className="w-full mt-2 flex items-center justify-center gap-2 py-2 rounded-xl bg-indigo-600/10 hover:bg-indigo-600 text-indigo-400 hover:text-white text-[10px] font-bold transition-all border border-[#1f2a3d] hover:border-indigo-500/30"
                                    >
                                      <HiOutlineTruck className="text-xs animate-bounce" /> Update Delivery Route
                                    </button>
                                  )}
                                </div>
                              </div>

                              <div className="bg-[#080e1a] p-5 rounded-3xl border border-[#1f2a3d] flex flex-col">
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-2">
                                  Delivery Log
                                </p>
                                <p className="text-slate-400 text-[11px] leading-relaxed flex-1 italic">
                                  “{order.shippingAddress}”
                                </p>
                                <div className="mt-3 pt-3 border-t border-white/5 flex items-center gap-2 text-slate-600 text-[9px] font-bold uppercase">
                                  <HiOutlineClock /> Received{" "}
                                  {new Date(
                                    order.createdAt,
                                  ).toLocaleDateString()}
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="lg:w-64 flex flex-col gap-3">
                            <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">
                              Fulfillment Status
                            </p>
                            <div className="grid gap-2">
                              {statusOptions.map((opt) => (
                                <button
                                  key={opt.value}
                                  disabled={
                                    updatingId === order._id ||
                                    order.orderStatus === opt.value
                                  }
                                  onClick={() =>
                                    handleUpdateStatus(order._id, opt.value)
                                  }
                                  className={`flex items-center justify-between px-4 py-3 rounded-2xl border text-[10px] font-black uppercase tracking-widest transition-all ${
                                    order.orderStatus === opt.value
                                      ? `border-white bg-white text-black shadow-xl`
                                      : `bg-[#0d1424] border-[#1f2a3d] text-slate-500 hover:border-slate-600 hover:text-slate-300`
                                  }`}
                                >
                                  <div className="flex items-center gap-3">
                                    <span
                                      className={
                                        order.orderStatus === opt.value
                                          ? ""
                                          : opt.color
                                      }
                                    >
                                      {opt.icon}
                                    </span>
                                    {opt.label}
                                  </div>
                                  {order.orderStatus === opt.value && (
                                    <HiOutlineCheckCircle className="text-sm" />
                                  )}
                                  {updatingId === order._id &&
                                    order.orderStatus !== opt.value && (
                                      <div className="w-3 h-3 border border-slate-600 border-t-slate-400 rounded-full animate-spin" />
                                    )}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === "products" && (
            <motion.div
              key="products"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              <motion.div
                whileHover={{ y: -5 }}
                className="bg-[#111827] border-2 border-dashed border-[#1f2a3d] rounded-[2.5rem] flex flex-col items-center justify-center p-8 text-center group cursor-pointer hover:border-violet-500/50 transition-all"
                onClick={() => (window.location.href = "/market/sell")}
              >
                <div className="w-16 h-16 rounded-3xl bg-violet-600/10 flex items-center justify-center text-3xl text-violet-400 mb-4 group-hover:scale-110 transition-transform">
                  +
                </div>
                <h4 className="text-white font-bold text-lg">List New Item</h4>
                <p className="text-slate-500 text-xs max-w-37.5 mx-auto">
                  Add products or rentables to your store
                </p>
              </motion.div>

              {myProducts.map((prod) => (
                <motion.div
                  layout
                  key={prod._id}
                  className="bg-[#111827] border border-[#1f2a3d] rounded-[2.5rem] overflow-hidden hover:border-violet-500/30 transition-all flex flex-col group shadow-xl shadow-black/10"
                >
                  <div className="aspect-4/3 relative overflow-hidden">
                    <img
                      src={prod.productImages?.[0] || prod.productImage}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      alt=""
                    />
                    <div className="absolute inset-0 bg-linear-to-t from-[#111827] via-transparent to-transparent opacity-60" />
                    <div className="absolute top-4 left-4">
                      <span className="bg-black/60 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl border border-white/10 shadow-xl">
                        {prod.subCategory}
                      </span>
                    </div>
                  </div>
                  <div className="p-6 flex-1 flex flex-col">
                    <h4 className="text-white font-black text-lg mb-1 truncate">
                      {prod.productName}
                    </h4>
                    <p className="text-emerald-400 font-black text-xl mb-6">
                      ₹{prod.price?.toLocaleString()}
                    </p>
                    <div className="mt-auto flex gap-3">
                      <button
                        onClick={() =>
                          window.open(`/product/${prod._id}`, "_blank")
                        }
                        className="flex-1 bg-[#0d1424] hover:bg-black border border-[#1f2a3d] text-slate-400 hover:text-white text-[10px] font-black uppercase tracking-widest py-3 rounded-2xl transition-all"
                      >
                        Live View
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(prod._id)}
                        className="w-12 h-12 flex items-center justify-center rounded-2xl bg-rose-500/10 hover:bg-rose-600 border border-rose-500/20 text-rose-500 hover:text-white transition-all group/del"
                      >
                        <HiOutlineXCircle className="text-xl group-hover/del:rotate-90 transition-transform" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}

          {activeTab === "growth" && (
            <motion.div
              key="growth"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              {!(user?.subscription?.plan === "gold" || user?.subscription?.plan === "platinum") ? (
                <div className="bg-[#111827] border border-[#1f2a3d] rounded-[2.5rem] p-12 text-center overflow-hidden relative">
                  <div className="absolute inset-0 bg-linear-to-br from-violet-600/5 to-indigo-600/5" />
                  <div className="relative z-10">
                    <div className="w-16 h-16 bg-violet-600/10 rounded-3xl flex items-center justify-center text-3xl text-violet-400 mx-auto mb-6">
                      ✨
                    </div>
                    <h3 className="text-white font-black text-2xl mb-3 tracking-tight">
                      AI Business Insights & Chatbot Locked
                    </h3>
                    <p className="text-slate-500 text-sm max-w-sm mx-auto mb-8">
                      Upgrade to the Gold or Platinum plan to unlock customer sentiment analytics, pricing suggestions, local demand predictions, and auto-response messaging chatbots.
                    </p>
                    <button
                      onClick={() => navigate("/upgrade-plan")}
                      className="px-8 py-3.5 bg-linear-to-r from-violet-600 to-indigo-600 text-white font-black text-[13px] uppercase tracking-widest rounded-2xl shadow-xl shadow-violet-900/40 hover:scale-105 active:scale-95 transition-all"
                    >
                      Unlock Growth Panel Now
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 space-y-6">
                    <div className="bg-[#111827] border border-[#1f2a3d] p-8 rounded-[2.5rem]">
                      <h3 className="text-white font-black text-xl mb-6 flex items-center gap-2">
                        <span className="text-violet-400">⚡</span> AI Business Insights
                      </h3>

                      {aiLoading ? (
                        <div className="py-12 flex justify-center">
                          <div className="w-8 h-8 border-2 border-violet-500/20 border-t-violet-500 rounded-full animate-spin" />
                        </div>
                      ) : aiError ? (
                        <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-2xl">
                          {aiError}
                        </div>
                      ) : aiInsights ? (
                        <div className="space-y-6">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="bg-[#080e1a] p-5 rounded-3xl border border-[#1f2a3d]">
                              <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest block mb-2">Peak Activity</span>
                              <div className="space-y-1">
                                <p className="text-white text-sm font-semibold">Peak Day: <span className="text-violet-400">{aiInsights.salesPatterns?.peakDay || "Saturday"}</span></p>
                                <p className="text-white text-sm font-semibold">Peak Hour: <span className="text-violet-400">{aiInsights.salesPatterns?.peakHour || "18:00"}</span></p>
                              </div>
                            </div>
                            <div className="bg-[#080e1a] p-5 rounded-3xl border border-[#1f2a3d]">
                              <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest block mb-2">Customer Sentiment</span>
                              <div className="flex items-center justify-between mb-1.5 text-xs text-white">
                                <span>😊 Positive ({aiInsights.sentiment?.positivePercent || 85}%)</span>
                                <span>😔 Negative ({aiInsights.sentiment?.negativePercent || 10}%)</span>
                              </div>
                              <div className="h-2 bg-[#080e1a] rounded-full overflow-hidden flex border border-[#1f2a3d]">
                                <div className="bg-emerald-500 h-full" style={{ width: `${aiInsights.sentiment?.positivePercent || 85}%` }} />
                                <div className="bg-slate-600 h-full" style={{ width: `${aiInsights.sentiment?.neutralPercent || 5}%` }} />
                                <div className="bg-rose-500 h-full" style={{ width: `${aiInsights.sentiment?.negativePercent || 10}%` }} />
                              </div>
                            </div>
                          </div>

                          <div>
                            <h4 className="text-white font-bold text-sm mb-3">Local Pricing Suggestions</h4>
                            <div className="space-y-3">
                              {aiInsights.pricingSuggestions?.map((sug, i) => (
                                <div key={i} className="bg-[#080e1a] p-4 rounded-2xl border border-[#1f2a3d] flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                                  <div>
                                    <h5 className="text-white text-xs font-bold">{sug.productName}</h5>
                                    <p className="text-[11px] text-slate-400 mt-1">{sug.recommendation}</p>
                                  </div>
                                  <div className="flex items-center gap-3 shrink-0">
                                    <div className="text-right">
                                      <p className="text-slate-500 text-[9px] uppercase font-bold">My Price</p>
                                      <p className="text-white text-xs font-black">₹{sug.myPrice}</p>
                                    </div>
                                    <div className="text-right">
                                      <p className="text-slate-500 text-[9px] uppercase font-bold">Market Avg</p>
                                      <p className="text-slate-400 text-xs font-semibold">₹{sug.marketAvg}</p>
                                    </div>
                                    <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                                      sug.status === "increase" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                                      sug.status === "decrease" ? "bg-rose-500/10 text-rose-400 border border-rose-500/20" :
                                      "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                    }`}>
                                      {sug.status}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div>
                            <h4 className="text-white font-bold text-sm mb-3">Demand Forecast Predictions</h4>
                            <div className="space-y-2">
                              {aiInsights.demandInsights?.map((insight, idx) => (
                                <div key={idx} className="bg-violet-950/20 border border-violet-500/15 p-4 rounded-2xl flex items-start gap-3">
                                  <span className="text-violet-400 text-sm">💡</span>
                                  <p className="text-slate-300 text-xs leading-relaxed">{insight}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <p className="text-slate-500 text-xs">No AI insights generated yet. Check back after receiving some orders and reviews!</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="bg-[#111827] border border-[#1f2a3d] p-6 rounded-[2.5rem] space-y-6">
                      <div className="flex items-center justify-between">
                        <h3 className="text-white font-black text-lg flex items-center gap-2">
                          <span className="text-violet-400"><HiOutlineChatBubbleLeftRight /></span> Auto-Chatbot
                        </h3>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={autoResponseEnabled}
                            onChange={(e) => setAutoResponseEnabled(e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-[#0d1424] border border-[#1f2a3d] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-violet-600 peer-checked:after:bg-white" />
                        </label>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Default Away Message</label>
                        <textarea
                          rows={3}
                          value={awayMessage}
                          onChange={(e) => setAwayMessage(e.target.value)}
                          placeholder="Thank you for contacting us! We are currently away and will get back to you soon."
                          className="w-full bg-[#080e1a] border border-[#1f2a3d] text-xs text-white rounded-2xl p-3 outline-hidden focus:border-violet-500 transition-colors resize-none"
                        />
                      </div>

                      <div className="space-y-3">
                        <label className="text-[10px] text-slate-500 uppercase tracking-widest font-bold block">Keyword Trigger Rules</label>
                        <div className="space-y-2">
                          {autoResponses.map((rule, idx) => (
                            <div key={idx} className="bg-[#080e1a] p-3 rounded-2xl border border-[#1f2a3d] flex items-start justify-between gap-2">
                              <div>
                                <span className="px-1.5 py-0.5 rounded bg-violet-600/10 border border-violet-500/20 text-violet-400 text-[9px] font-mono font-bold uppercase">{rule.trigger}</span>
                                <p className="text-white text-[11px] mt-1.5 leading-relaxed">{rule.response}</p>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleDeleteResponse(idx)}
                                className="text-rose-500 hover:text-rose-400 text-xs p-1"
                              >
                                <HiOutlineXCircle className="text-lg" />
                              </button>
                            </div>
                          ))}
                        </div>

                        <div className="bg-[#080e1a] border border-[#1f2a3d] p-3 rounded-2xl space-y-2.5">
                          <input
                            type="text"
                            placeholder="Keyword (e.g. price, menu, opening)"
                            value={newTrigger}
                            onChange={(e) => setNewTrigger(e.target.value.toLowerCase())}
                            className="w-full bg-[#111827] border border-[#1f2a3d] text-[11px] text-white rounded-xl px-3 py-2 outline-hidden focus:border-violet-500"
                          />
                          <textarea
                            placeholder="Response text"
                            rows={2}
                            value={newResponse}
                            onChange={(e) => setNewResponse(e.target.value)}
                            className="w-full bg-[#111827] border border-[#1f2a3d] text-[11px] text-white rounded-xl px-3 py-2 outline-hidden focus:border-violet-500 resize-none"
                          />
                          <button
                            type="button"
                            onClick={handleAddResponse}
                            className="w-full py-2 bg-violet-600 hover:bg-violet-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all"
                          >
                            Add Rule
                          </button>
                        </div>
                      </div>

                      <button
                        onClick={handleSaveChatbot}
                        className="w-full py-3 bg-linear-to-r from-violet-600 to-indigo-600 text-white text-[11px] font-black uppercase tracking-widest rounded-2xl transition-all shadow-lg shadow-violet-900/30"
                      >
                        Save Chatbot Config
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === "subscriptions" && (
            <motion.div
              key="subscriptions"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-8"
            >
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-[#111827] border border-[#1f2a3d] p-8 rounded-[2.5rem]">
                  <h3 className="text-white font-black text-xl mb-6 flex items-center gap-2">
                    <span className="text-violet-400"><HiOutlineServer /></span> Active Subscription Curations
                  </h3>

                  {subscriptionBoxes.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-slate-500 text-xs">No active subscription packages created yet. Set up one on the right to start recurring collections!</p>
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      {subscriptionBoxes.map((box) => (
                        <div key={box._id} className="bg-[#080e1a] p-6 rounded-3xl border border-[#1f2a3d] flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="text-white font-bold text-sm">{box.name}</h4>
                              <span className="text-[9px] uppercase font-bold tracking-widest bg-violet-600/10 text-violet-400 border border-violet-500/15 px-2 py-0.5 rounded-md">{box.frequency}</span>
                            </div>
                            <p className="text-xs text-slate-400">{box.description}</p>
                            {box.items && box.items.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 mt-3">
                                {box.items.map((it, idx) => (
                                  <span key={idx} className="bg-slate-800 text-slate-300 text-[9px] px-2 py-0.5 rounded-md border border-slate-700">{it}</span>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="text-right shrink-0 flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2">
                            <div>
                              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Price</p>
                              <p className="text-emerald-400 text-base font-black">₹{box.price}</p>
                            </div>
                            <div className="bg-violet-600/10 border border-violet-500/20 px-2.5 py-1 rounded-xl text-[10px] text-violet-400 font-bold">
                              {box.subscribers?.length || 0} Subscribers
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <div className="bg-[#111827] border border-[#1f2a3d] p-6 rounded-[2.5rem] space-y-6">
                  <h3 className="text-white font-black text-lg">Create Curation Crate</h3>
                  <form onSubmit={handleCreateSubscriptionBox} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Crate Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Weekly Fresh Pastry Box"
                        value={boxName}
                        onChange={(e) => setBoxName(e.target.value)}
                        className="w-full bg-[#080e1a] border border-[#1f2a3d] text-xs text-white rounded-2xl p-3 outline-hidden focus:border-violet-500"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Description</label>
                      <textarea
                        rows={2}
                        placeholder="Detail what is included in this recurring curate crate..."
                        value={boxDescription}
                        onChange={(e) => setBoxDescription(e.target.value)}
                        className="w-full bg-[#080e1a] border border-[#1f2a3d] text-xs text-white rounded-2xl p-3 outline-hidden focus:border-violet-500 resize-none"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Price (₹)</label>
                        <input
                          type="number"
                          placeholder="299"
                          value={boxPrice}
                          onChange={(e) => setBoxPrice(e.target.value)}
                          className="w-full bg-[#080e1a] border border-[#1f2a3d] text-xs text-white rounded-2xl p-3 outline-hidden focus:border-violet-500"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Frequency</label>
                        <select
                          value={boxFrequency}
                          onChange={(e) => setBoxFrequency(e.target.value)}
                          className="w-full bg-[#080e1a] border border-[#1f2a3d] text-xs text-white rounded-2xl p-3 outline-hidden focus:border-violet-500 cursor-pointer"
                        >
                          <option value="weekly">Weekly</option>
                          <option value="monthly">Monthly</option>
                        </select>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Items (comma-separated)</label>
                      <input
                        type="text"
                        placeholder="e.g. Croissant, Cupcake, Sourdough Bread"
                        value={boxItems}
                        onChange={(e) => setBoxItems(e.target.value)}
                        className="w-full bg-[#080e1a] border border-[#1f2a3d] text-xs text-white rounded-2xl p-3 outline-hidden focus:border-violet-500"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={creatingBox}
                      className="w-full py-3 bg-linear-to-r from-violet-600 to-indigo-600 text-white text-[11px] font-black uppercase tracking-widest rounded-2xl transition-all shadow-lg shadow-violet-900/30 flex justify-center items-center"
                    >
                      {creatingBox ? "Creating Crate..." : "Publish Crate"}
                    </button>
                  </form>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {trackingModalOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-[#111827] border border-[#1f2a3d] p-6 rounded-[2.5rem] w-full max-w-md relative shadow-2xl"
            >
              <h3 className="text-white font-black text-xl mb-4 flex items-center gap-2">
                <HiOutlineTruck className="text-indigo-400" /> Update Delivery Route
              </h3>
              <p className="text-slate-500 text-xs mb-4">
                Update the tracking details for order #{trackingModalOrder._id.slice(-6).toUpperCase()} to inform the buyer of delivery logs.
              </p>
              <form onSubmit={handleUpdateTracking} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Current Status</label>
                  <select
                    value={trackingStatus}
                    onChange={(e) => setTrackingStatus(e.target.value)}
                    className="w-full bg-[#080e1a] border border-[#1f2a3d] text-xs text-white rounded-2xl p-3 outline-hidden focus:border-violet-500"
                  >
                    <option value="preparing">Preparing</option>
                    <option value="processing">Processing</option>
                    <option value="shipped">Shipped</option>
                    <option value="out_for_delivery">Out for Delivery</option>
                    <option value="delivered">Delivered</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Latitude</label>
                    <input
                      type="text"
                      placeholder="18.9226"
                      value={trackingLat}
                      onChange={(e) => setTrackingLat(e.target.value)}
                      className="w-full bg-[#080e1a] border border-[#1f2a3d] text-xs text-white rounded-2xl p-3 outline-hidden focus:border-violet-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Longitude</label>
                    <input
                      type="text"
                      placeholder="72.8333"
                      value={trackingLng}
                      onChange={(e) => setTrackingLng(e.target.value)}
                      className="w-full bg-[#080e1a] border border-[#1f2a3d] text-xs text-white rounded-2xl p-3 outline-hidden focus:border-violet-500"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Estimated Delivery Date</label>
                  <input
                    type="date"
                    value={trackingEstDelivery}
                    onChange={(e) => setTrackingEstDelivery(e.target.value)}
                    className="w-full bg-[#080e1a] border border-[#1f2a3d] text-xs text-white rounded-2xl p-3 outline-hidden focus:border-violet-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Update Note / Log Description</label>
                  <textarea
                    placeholder="e.g. Package dispatched from Surat sorting facility."
                    rows={2}
                    value={trackingNote}
                    onChange={(e) => setTrackingNote(e.target.value)}
                    className="w-full bg-[#080e1a] border border-[#1f2a3d] text-xs text-white rounded-2xl p-3 outline-hidden focus:border-violet-500 resize-none"
                  />
                </div>
                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setTrackingModalOrder(null)}
                    className="flex-1 py-3 bg-[#0d1424] hover:bg-black border border-[#1f2a3d] text-slate-400 hover:text-white text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingTracking}
                    className="flex-1 py-3 bg-linear-to-r from-violet-600 to-indigo-600 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all shadow-lg shadow-violet-900/30 flex justify-center items-center"
                  >
                    {submittingTracking ? "Saving..." : "Save Log"}
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

export default SellerOrders;
