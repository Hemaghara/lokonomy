import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { adminService } from "../../services";
import AdminLayout from "../../layouts/AdminLayout";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  FiPackage,
  FiShoppingBag,
  FiTrendingUp,
  FiAlertTriangle,
  FiCheckCircle,
  FiClock,
  FiSearch,
  FiFilter,
  FiEye,
  FiDollarSign,
  FiUser,
  FiArrowRight,
  FiSlash,
  FiPauseCircle,
  FiFlag,
  FiCalendar,
  FiChevronLeft,
  FiChevronRight,
} from "react-icons/fi";

const TABS = [
  { id: "products", icon: FiPackage, label: "Products" },
  { id: "orders", icon: FiShoppingBag, label: "Orders" },
  { id: "auctions", icon: FiTrendingUp, label: "Auctions" },
];

const FILTERS = ["all", "active", "sold", "banned", "suspended"];

const STAT_CONFIG = [
  { key: "activeProducts", label: "Active", icon: FiPackage, color: "indigo" },
  { key: "soldProducts", label: "Sold", icon: FiShoppingBag, color: "emerald" },
  { key: "bannedProducts", label: "Banned", icon: FiSlash, color: "rose" },
  {
    key: "suspendedProducts",
    label: "Suspended",
    icon: FiPauseCircle,
    color: "amber",
  },
];

const colorMap = {
  indigo: {
    bg: "bg-indigo-500/10",
    border: "border-indigo-500/20",
    text: "text-indigo-400",
    glow: "bg-indigo-500/10",
  },
  emerald: {
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    text: "text-emerald-400",
    glow: "bg-emerald-500/10",
  },
  rose: {
    bg: "bg-rose-500/10",
    border: "border-rose-500/20",
    text: "text-rose-400",
    glow: "bg-rose-500/10",
  },
  amber: {
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    text: "text-amber-400",
    glow: "bg-amber-500/10",
  },
};

const getStatusStyle = (status) => {
  const map = {
    delivered: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
    cancelled: "text-rose-400 bg-rose-500/10 border-rose-500/30",
    pending: "text-amber-400 bg-amber-500/10 border-amber-500/30",
  };
  return map[status] || "text-indigo-400 bg-indigo-500/10 border-indigo-500/30";
};

const StatusIcon = ({ status }) => {
  if (status === "delivered") return <FiCheckCircle size={11} />;
  if (status === "cancelled") return <FiAlertTriangle size={11} />;
  if (status === "pending") return <FiClock size={11} />;
  return null;
};

const Pagination = ({ page, totalPages, onPage }) =>
  totalPages > 1 ? (
    <div className="flex justify-center items-center gap-3 pt-8">
      <button
        disabled={page === 1}
        onClick={() => onPage(page - 1)}
        className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 text-xs font-bold disabled:opacity-30 disabled:cursor-not-allowed hover:border-slate-700 hover:text-white transition-all"
      >
        <FiChevronLeft size={14} /> Prev
      </button>
      <span className="text-xs text-slate-500 font-semibold px-2">
        <span className="text-white font-bold">{page}</span> / {totalPages}
      </span>
      <button
        disabled={page === totalPages}
        onClick={() => onPage(page + 1)}
        className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold disabled:opacity-30 disabled:cursor-not-allowed hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20"
      >
        Next <FiChevronRight size={14} />
      </button>
    </div>
  ) : null;

const EmptyState = ({ text }) => (
  <div className="col-span-full flex flex-col items-center justify-center gap-3 py-16 border border-dashed border-slate-800 rounded-2xl bg-slate-900/20">
    <div className="w-12 h-12 rounded-full bg-slate-800/80 flex items-center justify-center text-slate-600">
      <FiPackage size={22} />
    </div>
    <p className="text-slate-500 text-sm font-medium">{text}</p>
  </div>
);

const ProductCard = ({ product, onBan, onSuspend, onView }) => (
  <div
    onClick={() => onView(product)}
    className={`group relative flex flex-col bg-slate-900/60 border rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/5 hover:-translate-y-0.5 ${
      product.isFlagged
        ? "border-rose-500/40"
        : product.isSuspended
          ? "border-amber-500/40"
          : "border-slate-800 hover:border-indigo-500/40"
    }`}
  >
    <div className="relative w-full aspect-video bg-slate-800 overflow-hidden">
      <img
        src={product.productImages?.[0] || "https://via.placeholder.com/300"}
        alt={product.productName}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
      />
      <div className="absolute inset-0 bg-linear-to-t from-slate-950/70 via-transparent to-transparent" />

      <div className="absolute top-3 left-3 flex gap-1.5">
        {product.isFlagged && (
          <span className="flex items-center gap-1 bg-rose-500/90 text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider backdrop-blur-sm">
            <FiFlag size={9} /> Banned
          </span>
        )}
        {product.isSuspended && (
          <span className="bg-amber-500/90 text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider backdrop-blur-sm">
            Suspended
          </span>
        )}
      </div>

      <div className="absolute bottom-3 right-3">
        <span className="flex items-center gap-1 bg-slate-900/80 backdrop-blur-md border border-slate-700/50 text-white text-sm font-bold px-3 py-1.5 rounded-xl">
          <FiDollarSign size={12} className="text-indigo-400" />
          {product.price}
        </span>
      </div>
    </div>

    <div className="flex flex-col flex-1 p-4 gap-3">
      <div>
        <h4 className="font-bold text-white text-sm leading-snug truncate group-hover:text-indigo-300 transition-colors">
          {product.productName}
        </h4>
        <p className="text-[11px] text-slate-500 mt-0.5 truncate">
          {product.mainCategory} · {product.subCategory}
        </p>
      </div>

      <div className="flex items-center justify-between py-2.5 px-3 bg-slate-800/40 rounded-xl border border-slate-800">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-full bg-indigo-500/20 flex items-center justify-center shrink-0">
            <FiUser size={12} className="text-indigo-400" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] text-slate-500 leading-none mb-0.5">
              Seller
            </p>
            <p className="text-xs font-semibold text-white truncate">
              {product.sellerProfile?.name || "—"}
            </p>
          </div>
        </div>
        <span
          className={`text-[10px] font-bold uppercase tracking-wide ${
            product.isSold ? "text-rose-400" : "text-emerald-400"
          }`}
        >
          {product.isSold ? "Sold" : "Active"}
        </span>
      </div>

      <div className="flex gap-2 mt-auto">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onBan();
          }}
          title={product.isFlagged ? "Unban" : "Ban"}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all ${
            product.isFlagged
              ? "bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700"
              : "bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20"
          }`}
        >
          <FiSlash size={12} /> {product.isFlagged ? "Unban" : "Ban"}
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSuspend();
          }}
          title={product.isSuspended ? "Activate" : "Suspend"}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all ${
            product.isSuspended
              ? "bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700"
              : "bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20"
          }`}
        >
          <FiPauseCircle size={12} />{" "}
          {product.isSuspended ? "Activate" : "Suspend"}
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onView(product);
          }}
          className="w-10 h-10 flex items-center justify-center bg-slate-800 border border-slate-700 rounded-xl text-slate-400 hover:text-white hover:border-indigo-500 transition-all shrink-0"
        >
          <FiEye size={14} />
        </button>
      </div>
    </div>
  </div>
);

const AuctionCard = ({ auction, onView }) => (
  <div
    onClick={() => onView(auction)}
    className="group relative flex flex-col bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden cursor-pointer hover:border-indigo-500/40 hover:shadow-xl hover:shadow-indigo-500/5 hover:-translate-y-0.5 transition-all duration-300"
  >
    <div className="relative w-full aspect-video bg-slate-800 overflow-hidden">
      <img
        src={auction.productImages?.[0] || "https://via.placeholder.com/300"}
        alt={auction.productName}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
      />
      <div className="absolute inset-0 bg-linear-to-t from-slate-950/80 via-slate-950/20 to-transparent" />

      <span className="absolute top-3 right-3 bg-indigo-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider animate-pulse shadow-lg shadow-indigo-500/30">
        Live
      </span>

      <div className="absolute bottom-3 left-3 right-3">
        <p className="text-white font-bold text-sm leading-snug truncate">
          {auction.productName}
        </p>
        <p className="flex items-center gap-1.5 text-indigo-300 text-[10px] mt-1">
          <FiCalendar size={10} />
          Ends {new Date(auction.auctionEnd).toLocaleDateString()}
        </p>
      </div>
    </div>

    <div className="p-4 flex flex-col gap-3 flex-1">
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
          <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mb-1">
            Starting
          </p>
          <p className="text-sm font-bold text-white">
            ₹{auction.startingPrice}
          </p>
        </div>
        <div className="bg-indigo-500/10 p-3 rounded-xl border border-indigo-500/20">
          <p className="text-[10px] text-indigo-400 font-semibold uppercase tracking-wider mb-1 flex items-center gap-1">
            <FiTrendingUp size={10} /> Top Bid
          </p>
          <p className="text-sm font-bold text-white">
            ₹{auction.currentHighestBid || auction.startingPrice}
          </p>
        </div>
      </div>

      <div>
        <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mb-2">
          Recent Bids
        </p>
        <div className="space-y-1.5">
          {auction.bids?.slice(0, 3).map((bid, i) => (
            <div
              key={i}
              className="flex justify-between items-center px-3 py-2 bg-slate-800/30 rounded-lg"
            >
              <span className="text-xs text-slate-300 font-medium truncate max-w-[60%]">
                {bid.userName}
              </span>
              <span className="text-xs text-indigo-400 font-bold flex items-center gap-0.5">
                <FiDollarSign size={10} />
                {bid.amount}
              </span>
            </div>
          ))}
          {(!auction.bids || auction.bids.length === 0) && (
            <p className="text-xs text-slate-600 italic py-1">No bids yet</p>
          )}
        </div>
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation();
          onView(auction);
        }}
        className="mt-auto w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold uppercase tracking-wider transition-all"
      >
        <FiEye size={13} /> View Details
      </button>
    </div>
  </div>
);

const AdminMarketplace = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("products");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [auctions, setAuctions] = useState([]);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [orderStatus, setOrderStatus] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    fetchStats();
    fetchData();
  }, [activeTab, filter, search, page, orderStatus, startDate, endDate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === "products") {
        const r = await adminService.getMarketProducts({
          status: filter !== "all" ? filter : undefined,
          search,
          page,
          limit: 6,
        });
        setProducts(r.data.products);
        setTotalPages(r.data.totalPages);
      } else if (activeTab === "orders") {
        const r = await adminService.getMarketOrders({
          page,
          limit: 6,
          status: orderStatus !== "all" ? orderStatus : undefined,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          search,
        });
        setOrders(r.data.orders);
        setTotalPages(r.data.totalPages);
      } else if (activeTab === "auctions") {
        const r = await adminService.getMarketAuctions({ page, limit: 6 });
        setAuctions(r.data.auctions);
        setTotalPages(r.data.totalPages);
      }
    } catch {
      toast.error(`Failed to fetch ${activeTab}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const r = await adminService.getMarketStats();
      setStats(r.data);
    } catch (e) {
      console.error("Stats error:", e);
    }
  };

  const handleToggleBan = async (id) => {
    try {
      const r = await adminService.toggleBanProduct(id);
      toast.success(r.data.message);
      fetchData();
      fetchStats();
    } catch {
      toast.error("Action failed");
    }
  };

  const handleToggleSuspend = async (id) => {
    try {
      const r = await adminService.toggleSuspendProduct(id);
      toast.success(r.data.message);
      fetchData();
      fetchStats();
    } catch {
      toast.error("Action failed");
    }
  };

  const handleViewProduct = (productOrId) => {
    const id =
      typeof productOrId === "object"
        ? productOrId._id || productOrId.id
        : productOrId;
    if (id) navigate(`/admin/marketplace/product/${id}`);
  };

  const handleViewOrder = (id) => navigate(`/admin/marketplace/order/${id}`);

  const handleViewAuction = (auctionOrId) => {
    const id =
      typeof auctionOrId === "object"
        ? auctionOrId._id || auctionOrId.id
        : auctionOrId;
    if (id) navigate(`/admin/marketplace/auction/${id}`);
  };

  const handleTabChange = (id) => {
    setActiveTab(id);
    setPage(1);
  };
  const handleFilterChange = (f) => {
    setFilter(f);
    setPage(1);
  };

  return (
    <AdminLayout>
      <div className="max-w-screen-2xl mx-auto space-y-6 pb-16 px-1">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Marketplace <span className="text-indigo-400">Management</span>
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Monitor, ban or suspend listings across the platform.
            </p>
          </div>

          <div className="flex bg-slate-900 border border-slate-800 p-1 rounded-2xl self-start sm:self-auto">
            {TABS.map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                onClick={() => handleTabChange(id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 ${
                  activeTab === id
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20"
                    : "text-slate-500 hover:text-slate-300"
                }`}
              >
                <Icon size={14} />
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {STAT_CONFIG.map(({ key, label, icon: Icon, color }, i) => {
            const c = colorMap[color];
            return (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
                className="relative bg-slate-900/60 border border-slate-800 rounded-2xl p-4 overflow-hidden group hover:border-slate-700 transition-colors"
              >
                <div
                  className={`w-9 h-9 rounded-xl ${c.bg} ${c.border} border flex items-center justify-center mb-3`}
                >
                  <Icon size={16} className={c.text} />
                </div>
                <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-widest mb-1">
                  {label}
                </p>
                <p className="text-xl font-extrabold text-white">
                  {stats?.[key] ?? 0}
                </p>
              </motion.div>
            );
          })}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center bg-slate-900/50 border border-slate-800 rounded-2xl p-3">
          <div className="relative flex-1 min-w-0 sm:max-w-xs">
            <FiSearch
              size={14}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
            />
            <input
              type="text"
              placeholder={`Search ${activeTab}…`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/60 transition-all"
            />
          </div>

          {activeTab === "products" && (
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
              <FiFilter size={14} className="text-slate-600 shrink-0" />
              {FILTERS.map((f) => (
                <button
                  key={f}
                  onClick={() => handleFilterChange(f)}
                  className={`px-3.5 py-2 rounded-xl text-[11px] font-bold capitalize whitespace-nowrap transition-all ${
                    filter === f
                      ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30"
                      : "bg-slate-800/40 text-slate-500 border border-transparent hover:bg-slate-800 hover:text-slate-300"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          )}

          {activeTab === "orders" && (
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <FiFilter size={14} className="text-slate-600 shrink-0" />
                <select
                  value={orderStatus}
                  onChange={(e) => {
                    setOrderStatus(e.target.value);
                    setPage(1);
                  }}
                  className="bg-slate-800 border border-slate-700/50 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 transition-all cursor-pointer"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div className="flex items-center gap-3">
                <FiCalendar size={14} className="text-slate-600 shrink-0" />
                <div className="flex items-center gap-2 bg-slate-800/50 border border-slate-700/50 rounded-xl p-1 px-2">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      setPage(1);
                    }}
                    className="bg-transparent border-none text-[11px] text-white focus:outline-none accent-indigo-500 w-28"
                  />
                  <span className="text-slate-600 text-[10px]">to</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => {
                      setEndDate(e.target.value);
                      setPage(1);
                    }}
                    className="bg-transparent border-none text-[11px] text-white focus:outline-none accent-indigo-500 w-28"
                  />
                  {(startDate || endDate) && (
                    <button
                      onClick={() => {
                        setStartDate("");
                        setEndDate("");
                        setPage(1);
                      }}
                      className="ml-1 text-[10px] text-indigo-400 hover:text-indigo-300 font-bold"
                    >
                      Reset
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {loading ? (
              <div className="flex flex-col items-center justify-center h-64 gap-4">
                <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
                <p className="text-slate-500 text-sm font-medium animate-pulse capitalize">
                  Loading {activeTab}…
                </p>
              </div>
            ) : (
              <>
                {activeTab === "products" && (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                      {products.map((p) => (
                        <ProductCard
                          key={p._id}
                          product={p}
                          onBan={() => handleToggleBan(p._id)}
                          onSuspend={() => handleToggleSuspend(p._id)}
                          onView={handleViewProduct}
                        />
                      ))}
                      {products.length === 0 && (
                        <EmptyState text="No products found" />
                      )}
                    </div>
                    <Pagination
                      page={page}
                      totalPages={totalPages}
                      onPage={setPage}
                    />
                  </>
                )}

                {activeTab === "orders" && (
                  <>
                    <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left">
                          <thead>
                            <tr className="border-b border-slate-800 bg-slate-900/60">
                              {["Item", "Customer", "Amount", "Status", ""].map(
                                (h) => (
                                  <th
                                    key={h}
                                    className="px-5 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500 whitespace-nowrap"
                                  >
                                    {h}
                                  </th>
                                ),
                              )}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/50">
                            {orders.map((order) => (
                              <tr
                                key={order._id}
                                className="hover:bg-slate-800/20 transition-colors group"
                              >
                                <td className="px-5 py-4">
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 overflow-hidden shrink-0">
                                      <img
                                        src={
                                          order.product?.productImages?.[0] ||
                                          "https://via.placeholder.com/80"
                                        }
                                        alt=""
                                        className="w-full h-full object-cover"
                                      />
                                    </div>
                                    <div className="min-w-0">
                                      <p
                                        className="text-sm font-semibold text-white group-hover:text-indigo-400 transition-colors cursor-pointer truncate max-w-35 sm:max-w-50"
                                        onClick={() =>
                                          handleViewOrder(order._id)
                                        }
                                      >
                                        {order.product?.productName}
                                      </p>
                                      <p className="text-[11px] text-slate-600">
                                        #{order._id.slice(-6)}
                                      </p>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-5 py-4">
                                  <p className="text-sm font-semibold text-slate-300 truncate max-w-30">
                                    {order.buyer?.name}
                                  </p>
                                  <p className="text-[11px] text-slate-600 truncate max-w-30">
                                    {order.buyer?.email}
                                  </p>
                                </td>
                                <td className="px-5 py-4 font-bold text-white text-sm whitespace-nowrap">
                                  ₹{order.price}
                                </td>
                                <td className="px-5 py-4">
                                  <span
                                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${getStatusStyle(order.orderStatus)}`}
                                  >
                                    <StatusIcon status={order.orderStatus} />
                                    {order.orderStatus}
                                  </span>
                                </td>
                                <td className="px-5 py-4">
                                  <button
                                    onClick={() => handleViewOrder(order._id)}
                                    className="p-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-500 hover:text-white hover:border-indigo-500 transition-all"
                                  >
                                    <FiEye size={14} />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        {orders.length === 0 && (
                          <EmptyState text="No orders found" />
                        )}
                      </div>
                    </div>
                    <Pagination
                      page={page}
                      totalPages={totalPages}
                      onPage={setPage}
                    />
                  </>
                )}

                {activeTab === "auctions" && (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                      {auctions.map((a) => (
                        <AuctionCard
                          key={a._id}
                          auction={a}
                          onView={handleViewAuction}
                        />
                      ))}
                      {auctions.length === 0 && (
                        <EmptyState text="No active auctions" />
                      )}
                    </div>
                    <Pagination
                      page={page}
                      totalPages={totalPages}
                      onPage={setPage}
                    />
                  </>
                )}
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </AdminLayout>
  );
};

export default AdminMarketplace;
