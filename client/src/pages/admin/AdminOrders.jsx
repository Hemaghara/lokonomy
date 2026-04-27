import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { adminService } from "../../services";
import AdminLayout from "../../layouts/AdminLayout";
import {
  FiShoppingBag,
  FiSearch,
  FiFilter,
  FiDownload,
  FiEye,
  FiCheckCircle,
  FiTruck,
  FiPackage,
  FiXCircle,
  FiChevronLeft,
  FiChevronRight,
  FiTrendingUp,
  FiCalendar,
} from "react-icons/fi";

const statusConfig = {
  pending: {
    label: "Pending",
    dot: "bg-amber-400",
    badge:
      "bg-amber-500/10 text-amber-400 border-amber-500/20 ring-amber-500/10",
  },
  processing: {
    label: "Processing",
    dot: "bg-indigo-400",
    badge:
      "bg-indigo-500/10 text-indigo-400 border-indigo-500/20 ring-indigo-500/10",
  },
  shipped: {
    label: "Shipped",
    dot: "bg-blue-400",
    badge: "bg-blue-500/10 text-blue-400 border-blue-500/20 ring-blue-500/10",
  },
  delivered: {
    label: "Delivered",
    dot: "bg-emerald-400",
    badge:
      "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 ring-emerald-500/10",
  },
  cancelled: {
    label: "Cancelled",
    dot: "bg-rose-400",
    badge: "bg-rose-500/10 text-rose-400 border-rose-500/20 ring-rose-500/10",
  },
};

const StatusBadge = ({ status }) => {
  const cfg = statusConfig[status.toLowerCase()] || statusConfig.pending;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-widest border ${cfg.badge}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
};

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState({ totalRevenue: 0, totalOrders: 0 });
  const [selectedOrders, setSelectedOrders] = useState([]);

  const itemsPerPage = 6;
  const navigate = useNavigate();

  useEffect(() => {
    fetchOrders();
    setSelectedOrders([]);
  }, [currentPage, statusFilter, dateRange]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: itemsPerPage,
        status: statusFilter,
        startDate: dateRange.start,
        endDate: dateRange.end,
        search: searchQuery,
      };

      const response = await adminService.getMarketOrders(params);
      setOrders(response.data.orders);
      setTotalPages(response.data.totalPages);

      setStats((prev) => ({ ...prev, totalOrders: response.data.totalOrders }));
    } catch (error) {
      toast.error("Failed to fetch orders");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      await adminService.updateOrderStatus(id, status);
      toast.success("Order status updated");
      fetchOrders();
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const handleBulkUpdateStatus = async (status) => {
    if (selectedOrders.length === 0) return;
    try {
      await Promise.all(
        selectedOrders.map((id) => adminService.updateOrderStatus(id, status)),
      );
      toast.success(`Updated ${selectedOrders.length} orders`);
      setSelectedOrders([]);
      fetchOrders();
    } catch (error) {
      toast.error("Bulk update failed");
    }
  };

  const toggleSelectOrder = (id) => {
    setSelectedOrders((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const toggleSelectAll = () => {
    setSelectedOrders((prev) =>
      prev.length === orders.length ? [] : orders.map((o) => o._id),
    );
  };

  const exportToCSV = () => {
    const headers = [
      "Order ID",
      "Product",
      "Buyer",
      "Seller",
      "Price",
      "Status",
      "Date",
    ];
    const rows = orders.map((o) => [
      o._id,
      o.product?.productName,
      o.buyer?.name,
      o.seller?.name,
      `₹${o.price}`,
      o.orderStatus,
      new Date(o.createdAt).toLocaleDateString(),
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers, ...rows].map((r) => r.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `orders_report_${new Date().toISOString().split("T")[0]}.csv`,
    );
    document.body.appendChild(link);
    link.click();
  };

  return (
    <AdminLayout>
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-5 mb-8">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/15 border border-indigo-500/20 flex items-center justify-center">
              <FiShoppingBag className="text-indigo-400" size={15} />
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight">
              Order Management
            </h2>
          </div>
          
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={exportToCSV}
            className="flex-1 sm:flex-none justify-center flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold
              bg-slate-800/60 border border-slate-700/50 text-slate-400
              hover:bg-slate-700/60 hover:text-slate-200 hover:border-slate-600/60 transition-all"
          >
            <FiDownload size={14} /> Export CSV
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
              <FiPackage size={20} />
            </div>
            <span className="text-xs font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full">
              Total
            </span>
          </div>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">
            Total Orders
          </p>
          <p className="text-2xl font-black text-white">{stats.totalOrders}</p>
        </div>
        <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <FiTrendingUp size={20} />
            </div>
            <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
              Revenue
            </span>
          </div>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">
            Current Revenue
          </p>
          <p className="text-2xl font-black text-white">
            ₹
            {orders.reduce((acc, curr) => acc + curr.price, 0).toLocaleString()}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3 mb-6">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <FiSearch
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
              size={14}
            />
            <input
              type="text"
              placeholder="Search by order ID, buyer or seller..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && fetchOrders()}
              className="w-full bg-slate-900/60 border border-slate-700/50 rounded-xl py-2.5 pl-10 pr-4
                text-slate-200 text-sm placeholder:text-slate-600
                focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/50 transition-all"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`relative px-4 py-2.5 rounded-xl border text-sm font-bold flex items-center gap-2 transition-all shrink-0 ${
              showFilters
                ? "bg-indigo-600 border-indigo-500 text-white"
                : "bg-slate-800/60 border-slate-700/50 text-slate-400 hover:bg-slate-700/60 hover:text-slate-200"
            }`}
          >
            <FiFilter size={14} />
            <span className="hidden xs:inline">Filters</span>
          </button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-slate-900/40 border border-slate-700/40 rounded-2xl">
            <div>
              <label className="block text-[10px] font-black text-slate-600 uppercase tracking-widest mb-1.5">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700/60 rounded-lg px-3 py-2 text-sm text-slate-300 outline-none appearance-none cursor-pointer"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-600 uppercase tracking-widest mb-1.5">
                Start Date
              </label>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) =>
                  setDateRange({ ...dateRange, start: e.target.value })
                }
                className="w-full bg-slate-900 border border-slate-700/60 rounded-lg px-3 py-2 text-sm text-slate-300 outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-600 uppercase tracking-widest mb-1.5">
                End Date
              </label>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) =>
                  setDateRange({ ...dateRange, end: e.target.value })
                }
                className="w-full bg-slate-900 border border-slate-700/60 rounded-lg px-3 py-2 text-sm text-slate-300 outline-none"
              />
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <div className="w-10 h-10 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 animate-spin" />
        </div>
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-28 gap-3 text-center">
          <div className="w-14 h-14 rounded-2xl bg-slate-800/60 border border-slate-700/40 flex items-center justify-center">
            <FiShoppingBag size={22} className="text-slate-600" />
          </div>
          <p className="text-slate-400 font-bold">No orders found</p>
        </div>
      ) : (
        <div className="hidden lg:block rounded-2xl border border-slate-700/40 overflow-hidden bg-slate-900/30">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-700/40 bg-slate-950/30">
                <th className="px-5 py-3.5 text-center">
                  <input
                    type="checkbox"
                    checked={
                      selectedOrders.length === orders.length &&
                      orders.length > 0
                    }
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded-md bg-slate-800 border-slate-700 text-indigo-500 focus:ring-indigo-500/20 transition-all font-black"
                  />
                </th>
                {[
                  "Order ID",
                  "Product",
                  "Status",
                  "Buyer/Seller",
                  "Amount",
                  "Date",
                  "Actions",
                ].map((h) => (
                  <th
                    key={h}
                    className="px-5 py-3.5 text-[10px] font-black uppercase tracking-[0.18em] text-slate-600"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr
                  key={order._id}
                  className={`border-b border-white/3 hover:bg-indigo-500/3 transition-colors ${selectedOrders.includes(order._id) ? "bg-indigo-500/10" : ""}`}
                >
                  <td className="px-5 py-4 text-center">
                    <input
                      type="checkbox"
                      checked={selectedOrders.includes(order._id)}
                      onChange={() => toggleSelectOrder(order._id)}
                      className="w-4 h-4 rounded-md bg-slate-800 border-slate-700 text-indigo-500 focus:ring-indigo-500/20 transition-all"
                    />
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className="text-xs font-mono text-indigo-400 opacity-80 cursor-pointer hover:opacity-100"
                      onClick={() =>
                        navigate(`/admin/marketplace/order/${order._id}`)
                      }
                    >
                      #{order._id.slice(-8).toUpperCase()}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-sm font-bold text-slate-200">
                      {order.product?.productName || "Unknown Product"}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {order.product?.subCategory}
                    </p>
                  </td>
                  <td className="px-5 py-4">
                    <StatusBadge status={order.orderStatus} />
                  </td>
                  <td className="px-5 py-4">
                    <div className="text-xs">
                      <p className="text-slate-300 font-bold">
                        B: {order.buyer?.name}
                      </p>
                      <p className="text-slate-500">S: {order.seller?.name}</p>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-sm font-black text-white">
                      ₹{order.price}
                    </p>
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-xs text-slate-400">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() =>
                          navigate(`/admin/marketplace/order/${order._id}`)
                        }
                        className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-400 hover:bg-indigo-500/10 transition-all"
                      >
                        <FiEye size={15} />
                      </button>

                      <div className="relative group/menu">
                        <button className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all">
                          <FiCheckCircle size={15} />
                        </button>
                        <div className="absolute right-0 bottom-full mb-2 hidden group-hover/menu:block w-32 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-20 overflow-hidden">
                          {[
                            "pending",
                            "processing",
                            "shipped",
                            "delivered",
                            "cancelled",
                          ].map((s) => (
                            <button
                              key={s}
                              onClick={() => handleUpdateStatus(order._id, s)}
                              className="w-full text-left px-3 py-2 text-[10px] font-bold uppercase text-slate-400 hover:bg-slate-700 hover:text-white"
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {selectedOrders.length > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-slate-900 border border-indigo-500/50 rounded-2xl p-4 shadow-2xl z-50 flex items-center gap-6 animate-in slide-in-from-bottom-5">
          <div className="flex items-center gap-3 pr-6 border-r border-white/10 text-white">
            <span className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-black text-xs">
              {selectedOrders.length}
            </span>
            <span className="text-xs font-black uppercase tracking-widest">
              Selected
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mr-2">
              Update all to:
            </span>
            {["processing", "shipped", "delivered"].map((s) => (
              <button
                key={s}
                onClick={() => handleBulkUpdateStatus(s)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-[10px] font-black uppercase tracking-widest hover:bg-slate-700 hover:text-white transition-all border border-slate-700"
              >
                {s}
              </button>
            ))}
            <button
              onClick={() => setSelectedOrders([])}
              className="ml-4 p-2 text-slate-400 hover:text-rose-400"
            >
              <FiXCircle size={20} />
            </button>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminOrders;
