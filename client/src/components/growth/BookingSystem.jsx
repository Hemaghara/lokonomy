import React, { useState, useEffect } from "react";
import { growthService } from "../../services";
import { 
  Calendar, 
  Clock, 
  Check, 
  X, 
  Bell, 
  ChevronRight, 
  User, 
  Info,
  AlertCircle,
  MessageSquare
} from "lucide-react";
import toast from "react-hot-toast";
import io from "socket.io-client";
import { motion, AnimatePresence } from "framer-motion";

const BookingSystem = ({ businessId, isOwner, ownerId }) => {
  const [bookings, setBookings] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [formData, setFormData] = useState({
    serviceName: "",
    date: "",
    timeSlot: "",
    message: "",
  });

  useEffect(() => {
    fetchBookings();
    
    const socket = io("http://localhost:5000");
    if (isOwner) {
      socket.on(`newBooking_${ownerId}`, (data) => {
        toast.success(data.message, { icon: <Bell className="text-blue-500" /> });
        fetchBookings();
      });
    }

    return () => socket.disconnect();
  }, [businessId, isOwner, ownerId]);

  const fetchBookings = async () => {
    try {
      const res = await growthService.getBookings(businessId);
      setBookings(res.data);
    } catch (err) {
      console.error("Error fetching bookings:", err);
    } finally {
      setFetching(false);
    }
  };

  const hasActiveBooking = bookings.some(b => b.status === 'pending' || b.status === 'confirmed') && !isOwner;

  const handleBooking = async (e) => {
    e.preventDefault();
    if (hasActiveBooking) {
      return toast.error("You already have an active appointment request.");
    }
    setLoading(true);
    try {
      await growthService.createBooking({ ...formData, businessId });
      toast.success("Booking request sent successfully!");
      setShowModal(false);
      setFormData({ serviceName: "", date: "", timeSlot: "", message: "" });
      fetchBookings();
    } catch (err) {
      toast.error(err.response?.data?.message || "Booking failed");
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (bookingId, status) => {
    try {
      await growthService.updateBookingStatus({ bookingId, status });
      toast.success(`Appointment ${status === 'confirmed' ? 'Approved' : 'Cancelled'}`);
      fetchBookings();
    } catch (err) {
      toast.error("Status update failed");
    }
  };

  const cardCls = "bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden";

  return (
    <div className="w-full space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className={`${cardCls} p-5 flex items-center gap-4`}>
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
            <Calendar size={24} />
          </div>
          <div>
            <h3 className="text-white font-bold">Fast Booking</h3>
            <p className="text-gray-400 text-sm">Request slots in seconds</p>
          </div>
        </div>
        <div className={`${cardCls} p-5 flex items-center gap-4`}>
          <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center text-green-500">
            <Clock size={24} />
          </div>
          <div>
            <h3 className="text-white font-bold">Real-time Approval</h3>
            <p className="text-gray-400 text-sm">Get notified instantly</p>
          </div>
        </div>
      </div>

      {isOwner ? (
        <div className={`${cardCls} p-6`}>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Bell className="text-blue-500" /> Incoming Requests
            </h2>
            <div className="flex gap-2">
              <button 
                onClick={() => setShowModal(true)}
                className="bg-blue-600/20 text-blue-400 text-[10px] px-3 py-1 rounded-full uppercase font-bold hover:bg-blue-600/40 transition-all"
              >
                + Self Booking
              </button>
              <span className="bg-gray-800 text-gray-400 text-[10px] px-3 py-1 rounded-full uppercase font-bold tracking-wider">
                {bookings.length} Total
              </span>
            </div>
          </div>
          
          <div className="space-y-4">
            {bookings.map((booking) => (
              <motion.div 
                layout
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                key={booking._id} 
                className="bg-gray-800/40 border border-gray-700/50 p-4 rounded-xl flex items-center justify-between hover:border-gray-600 transition-all"
              >
                <div className="flex gap-4 items-center">
                  <div className="w-10 h-10 rounded-full bg-linear-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold">
                    {booking.userName[0]}
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">{booking.serviceName}</h4>
                    <p className="text-xs text-gray-400 flex items-center gap-1">
                      <User size={10} /> {booking.userName}
                    </p>
                    <div className="flex gap-3 mt-1.5 text-[10px] font-bold">
                      <span className="flex items-center gap-1 text-blue-400 uppercase tracking-tighter">
                        <Calendar size={10} /> {booking.date}
                      </span>
                      <span className="flex items-center gap-1 text-indigo-400 uppercase tracking-tighter">
                        <Clock size={10} /> {booking.timeSlot}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  {booking.status === "pending" ? (
                    <>
                      <button 
                        onClick={() => updateStatus(booking._id, "confirmed")}
                        className="p-2.5 bg-green-500 text-white rounded-xl hover:bg-green-400 transition-all shadow-lg shadow-green-900/20"
                        title="Approve"
                      >
                        <Check size={18} />
                      </button>
                      <button 
                        onClick={() => updateStatus(booking._id, "cancelled")}
                        className="p-2.5 bg-gray-700 text-white rounded-xl hover:bg-red-500 transition-all"
                        title="Reject"
                      >
                        <X size={18} />
                      </button>
                    </>
                  ) : (
                    <span className={`text-[10px] px-3 py-1 rounded-full font-bold uppercase ${
                      booking.status === "confirmed" ? "bg-green-500/10 text-green-500 border border-green-500/20" : "bg-red-500/10 text-red-500 border border-red-500/20"
                    }`}>
                      {booking.status}
                    </span>
                  )}
                </div>
              </motion.div>
            ))}
            {bookings.length === 0 && (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4 opacity-20">
                  <Calendar size={32} />
                </div>
                <p className="text-gray-500 text-sm">No appointment requests yet.</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {bookings.length > 0 && (
            <div className={`${cardCls} p-6 border-blue-500/30`}>
              <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                <Info size={18} className="text-blue-500" /> Your Appointments
              </h3>
              <div className="space-y-3">
                {bookings.map(b => (
                  <div key={b._id} className="bg-gray-800/30 p-4 rounded-xl border border-gray-700 flex justify-between items-center">
                    <div>
                      <p className="text-white font-medium text-sm">{b.serviceName}</p>
                      <p className="text-xs text-gray-500 mt-1">{b.date} at {b.timeSlot}</p>
                    </div>
                    <span className={`text-[10px] px-3 py-1 rounded-full font-bold uppercase ${
                      b.status === "confirmed" ? "bg-green-500/10 text-green-500" : 
                      b.status === "pending" ? "bg-blue-500/10 text-blue-500" : "bg-red-500/10 text-red-500"
                    }`}>
                      {b.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={() => setShowModal(true)}
            disabled={hasActiveBooking}
            className={`w-full h-16 rounded-2xl flex items-center justify-center gap-3 font-bold transition-all
              ${hasActiveBooking 
                ? "bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700" 
                : "bg-linear-to-r from-blue-600 to-indigo-600 text-white hover:shadow-xl hover:shadow-blue-900/30 active:scale-95"}`}
          >
            {hasActiveBooking ? (
              <><Check size={20} /> Request Under Review</>
            ) : (
              <><Calendar size={20} /> Book New Appointment</>
            )}
          </button>
          
          {hasActiveBooking && (
            <div className="flex items-center gap-2 text-amber-500 justify-center bg-amber-500/5 py-2 rounded-lg">
              <AlertCircle size={14} />
              <p className="text-[11px] font-medium">Only one active request allowed per business.</p>
            </div>
          )}
        </div>
      )}

      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-999 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-gray-900 border border-gray-800 w-full max-w-lg rounded-3xl p-8 relative shadow-2xl"
            >
              <button 
                onClick={() => setShowModal(false)} 
                className="absolute top-6 right-6 text-gray-500 hover:text-white transition-colors"
                aria-label="Close"
              >
                <X size={24} />
              </button>

              <div className="mb-8">
                <h2 className="text-3xl font-bold text-white tracking-tight">Schedule Visit</h2>
                <p className="text-gray-400 mt-2">Fill in the details for your appointment.</p>
              </div>

              <form onSubmit={handleBooking} className="space-y-5">
                <div className="grid grid-cols-1 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 uppercase ml-1 flex items-center gap-2">
                       Required Service
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Full Hair Grooming"
                      className="w-full bg-gray-800 border-2 border-gray-800 rounded-2xl p-4 text-white focus:border-blue-500/50 outline-none transition-all placeholder:text-gray-600"
                      value={formData.serviceName}
                      onChange={(e) => setFormData({ ...formData, serviceName: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-500 uppercase ml-1">Date</label>
                      <input
                        type="date"
                        required
                        className="w-full bg-gray-800 border-2 border-gray-800 rounded-2xl p-4 text-white focus:border-blue-500/50 outline-none transition-all"
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-500 uppercase ml-1">Time</label>
                      <input
                        type="time"
                        required
                        className="w-full bg-gray-800 border-2 border-gray-800 rounded-2xl p-4 text-white focus:border-blue-500/50 outline-none transition-all"
                        value={formData.timeSlot}
                        onChange={(e) => setFormData({ ...formData, timeSlot: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 uppercase ml-1 flex items-center gap-2">
                      <MessageSquare size={12} /> Special Notes
                    </label>
                    <textarea
                      placeholder="Add any specific requirements..."
                      className="w-full bg-gray-800 border-2 border-gray-800 rounded-2xl p-4 text-white h-28 focus:border-blue-500/50 outline-none transition-all resize-none placeholder:text-gray-600"
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    />
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-4 rounded-2xl transition-all shadow-xl shadow-blue-500/20 active:scale-95 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>Confirm Booking <ChevronRight size={18} /></>
                    )}
                  </button>
                  <p className="text-[10px] text-gray-600 text-center mt-4">
                    Appointments are pending approval from the service provider.
                  </p>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BookingSystem;
