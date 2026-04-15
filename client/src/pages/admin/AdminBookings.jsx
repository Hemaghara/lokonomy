import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { adminService } from "../../services";
import AdminLayout from "../../layouts/AdminLayout";
import {
  FiCalendar,
  FiSearch,
  FiFilter,
  FiEye,
  FiCheckCircle,
  FiClock,
  FiSlash,
  FiMapPin,
  FiChevronLeft,
  FiChevronRight,
  FiActivity,
} from "react-icons/fi";

const statusConfig = {
  pending: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  confirmed: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
  completed: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  cancelled: "bg-rose-500/10 text-rose-400 border-rose-500/20",
};

const AdminBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchBookings();
  }, [filter]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const response = await adminService.getBookings({
        status: filter,
        search,
      });
      setBookings(response.data.bookings);
      setStats(response.data.stats);
    } catch (error) {
      toast.error("Failed to fetch bookings");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      await adminService.updateBookingStatus(id, status);
      toast.success("Booking updated");
      fetchBookings();
    } catch (error) {
      toast.error("Update failed");
    }
  };

  return (
    <AdminLayout>
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-5 mb-8">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/15 border border-indigo-500/20 flex items-center justify-center">
              <FiCalendar className="text-indigo-400" size={15} />
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight">
              Service Bookings
            </h2>
          </div>
          <p className="text-slate-500 text-sm pl-10.5">
            Manage appointments and service requests
          </p>
        </div>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          {
            label: "Pending",
            value: stats.pending,
            color: "amber",
            icon: FiClock,
          },
          {
            label: "Confirmed",
            value: stats.confirmed,
            color: "indigo",
            icon: FiCheckCircle,
          },
          {
            label: "Completed",
            value: stats.completed,
            color: "emerald",
            icon: FiActivity,
          },
          {
            label: "Cancelled",
            value: stats.cancelled,
            color: "rose",
            icon: FiSlash,
          },
        ].map((s, i) => (
          <div
            key={i}
            className="bg-slate-900/50 border border-white/5 rounded-2xl p-4"
          >
            <div className="flex justify-between items-center mb-1">
              <span className="text-2xl font-black text-white">
                {s.value || 0}
              </span>
              <s.icon className={`text-${s.color}-400`} size={16} />
            </div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
              {s.label}
            </p>
          </div>
        ))}
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
              placeholder="Search by user or service name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && fetchBookings()}
              className="w-full bg-slate-900/60 border border-slate-700/50 rounded-xl py-2.5 pl-10 pr-4 text-slate-200 text-sm outline-none"
            />
          </div>
          <select
            className="bg-slate-800 border border-slate-700 text-slate-400 text-sm font-bold rounded-xl px-4 outline-none cursor-pointer"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">All Bookings</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full py-20 flex justify-center">
            <div className="w-8 h-8 border-2 border-t-indigo-500 rounded-full animate-spin" />
          </div>
        ) : bookings.length === 0 ? (
          <div className="col-span-full py-20 text-center">
            <p className="text-slate-600 font-bold uppercase tracking-widest text-xs">
              No bookings found
            </p>
          </div>
        ) : (
          bookings.map((b) => (
            <div
              key={b._id}
              className="bg-slate-900/50 border border-white/5 rounded-3xl p-5 hover:bg-slate-800/40 transition-all"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 font-black">
                    {b.userName?.[0]}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white leading-tight">
                      {b.userName}
                    </h4>
                    <p className="text-[10px] text-slate-500 font-bold uppercase">
                      {b.userId?.phoneNumber || "No Phone"}
                    </p>
                  </div>
                </div>
                <span
                  className={`px-2 py-0.5 rounded text-[8px] font-black uppercase border ${statusConfig[b.status] || "bg-slate-800"}`}
                >
                  {b.status}
                </span>
              </div>

              <div className="space-y-3 mb-5 py-3 border-y border-white/5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-bold uppercase tracking-tight">
                    Service
                  </span>
                  <span className="text-white font-black truncate max-w-37.5">
                    {b.serviceName}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-bold uppercase tracking-tight">
                    Date/Time
                  </span>
                  <span className="text-slate-300 font-bold">
                    {b.date} • {b.timeSlot}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-bold uppercase tracking-tight">
                    Business
                  </span>
                  <span className="text-indigo-400 font-black truncate max-w-37.5">
                    {b.businessId?.name}
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                <div className="flex-1 relative group/status">
                  <button className="w-full py-2 rounded-xl bg-slate-800 text-slate-400 text-[10px] font-black uppercase tracking-widest border border-slate-700/50 hover:bg-slate-700 transition-all">
                    Change Status
                  </button>
                  <div className="absolute bottom-full left-0 w-full mb-1 hidden group-hover/status:block bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-20 overflow-hidden">
                    {["pending", "confirmed", "completed", "cancelled"].map(
                      (s) => (
                        <button
                          key={s}
                          onClick={() => handleUpdateStatus(b._id, s)}
                          className="w-full text-left px-4 py-2 text-[10px] font-black uppercase text-slate-400 hover:bg-slate-700 hover:text-white"
                        >
                          {s}
                        </button>
                      ),
                    )}
                  </div>
                </div>
                <button className="p-2 rounded-xl bg-slate-800 text-slate-400 border border-slate-700/50 hover:text-white transition-all">
                  <FiEye size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminBookings;
