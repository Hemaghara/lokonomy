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
  MessageSquare,
  Ticket,
  Tag,
  CheckCircle2,
  ChevronDown,
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

  const [availableCoupons, setAvailableCoupons] = useState([]);
  const [selectedCoupon, setSelectedCoupon] = useState(null);
  const [couponInput, setCouponInput] = useState("");
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [couponError, setCouponError] = useState("");
  const [showCouponList, setShowCouponList] = useState(false);

  useEffect(() => {
    fetchBookings();

    const socket = io("http://localhost:5000");
    if (isOwner) {
      socket.on(`newBooking_${ownerId}`, (data) => {
        toast.success(data.message, {
          icon: <Bell className="text-blue-500" />,
        });
        fetchBookings();
      });
    }

    return () => socket.disconnect();
  }, [businessId, isOwner, ownerId]);

  useEffect(() => {
    if (!isOwner) {
      fetchActiveCoupons();
    }
  }, [businessId, isOwner]);

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

  const fetchActiveCoupons = async () => {
    try {
      const res = await growthService.getActiveCoupons(businessId);
      setAvailableCoupons(res.data);
    } catch (err) {
      console.error("Error fetching coupons:", err);
    }
  };

  const handleApplyCoupon = async (code) => {
    const codeToApply = (code || couponInput).trim().toUpperCase();
    if (!codeToApply) return;

    setCouponError("");
    setValidatingCoupon(true);
    try {
      const res = await growthService.validateCoupon({
        code: codeToApply,
        businessId,
      });
      setSelectedCoupon(res.data);
      setCouponInput(codeToApply);
      setShowCouponList(false);
      toast.success(`Coupon "${codeToApply}" applied!`);
    } catch (err) {
      setCouponError(err.response?.data?.message || "Invalid coupon");
      setSelectedCoupon(null);
    } finally {
      setValidatingCoupon(false);
    }
  };

  const removeCoupon = () => {
    setSelectedCoupon(null);
    setCouponInput("");
    setCouponError("");
  };

  const hasActiveBooking =
    !isOwner &&
    bookings.some((b) => b.status === "pending" || b.status === "confirmed");

  const handleBooking = async (e) => {
    e.preventDefault();
    if (hasActiveBooking) {
      return toast.error("You already have an active appointment request.");
    }
    setLoading(true);
    try {
      const res = await growthService.createBooking({
        ...formData,
        businessId,
        couponCode: selectedCoupon?.code || null,
      });

      if (res.data.appliedCoupon) {
        const c = res.data.appliedCoupon;
        const saved =
          c.discountType === "percentage"
            ? `${c.discount}% discount`
            : `₹${c.discount} off`;
        toast.success(`Booking confirmed! Coupon applied: ${saved}`);
      } else {
        toast.success("Booking request sent successfully!");
      }

      setShowModal(false);
      setFormData({ serviceName: "", date: "", timeSlot: "", message: "" });
      setSelectedCoupon(null);
      setCouponInput("");
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
      toast.success(
        `Appointment ${status === "confirmed" ? "Approved" : "Cancelled"}`,
      );
      fetchBookings();
    } catch (err) {
      toast.error("Status update failed");
    }
  };

  const cardCls =
    "bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden";
  const unusedCoupons = availableCoupons.filter((c) => !c.alreadyUsed);

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
            <div className="flex gap-2 items-center">
              <button
                onClick={() => setShowModal(true)}
                className="flex items-center gap-1.5 bg-linear-to-r from-blue-600 to-indigo-600 text-white text-[10px] px-4 py-2 rounded-full uppercase font-bold hover:from-blue-500 hover:to-indigo-500 transition-all shadow-lg shadow-blue-900/30 active:scale-95"
              >
                <Calendar size={11} /> Self Book
              </button>
              <span className="bg-gray-800/60 border border-gray-700/50 text-gray-400 text-[10px] px-3 py-1.5 rounded-full uppercase font-bold tracking-wider">
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
                  <div className="w-10 h-10 rounded-full bg-linear-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                    {booking.userName[0]}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-bold text-white text-sm">
                        {booking.serviceName}
                      </h4>
                      {booking.isOwnerSelf && (
                        <span className="bg-violet-500/15 border border-violet-500/25 text-violet-400 text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide">
                          Self
                        </span>
                      )}
                      {booking.couponApplied?.code && (
                        <span className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-[9px] px-2 py-0.5 rounded-full font-bold uppercase flex items-center gap-1">
                          <Ticket size={8} /> {booking.couponApplied.code}
                        </span>
                      )}
                    </div>
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
                    <span
                      className={`text-[10px] px-3 py-1 rounded-full font-bold uppercase ${
                        booking.status === "confirmed"
                          ? "bg-green-500/10 text-green-500 border border-green-500/20"
                          : "bg-red-500/10 text-red-500 border border-red-500/20"
                      }`}
                    >
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
                <p className="text-gray-500 text-sm">
                  No appointment requests yet.
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {unusedCoupons.length > 0 && (
            <div className="bg-linear-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-yellow-400 font-bold text-sm flex items-center gap-2">
                  <Ticket size={16} /> Available Coupons ({unusedCoupons.length}
                  )
                </h3>
                <span className="text-[10px] text-yellow-500/70">
                  Apply while booking
                </span>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                {unusedCoupons.map((c) => (
                  <div
                    key={c._id}
                    className="shrink-0 bg-gray-900/70 border border-yellow-500/20 rounded-xl p-3 cursor-pointer hover:border-yellow-400/50 transition-all"
                    onClick={() => {
                      setCouponInput(c.code);
                      handleApplyCoupon(c.code);
                    }}
                  >
                    <p className="text-yellow-400 font-bold font-mono tracking-widest text-xs">
                      {c.code}
                    </p>
                    <p className="text-white font-semibold text-sm mt-0.5">
                      {c.discountType === "percentage"
                        ? `${c.discount}% Off`
                        : `₹${c.discount} Off`}
                    </p>
                    <p className="text-gray-500 text-[10px] mt-1">
                      Expires{" "}
                      {new Date(c.expiryDate).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                      })}
                      {" · "}
                      {c.spotsLeft} left
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {availableCoupons.some((c) => c.alreadyUsed) && (
            <div className="flex items-center gap-2 text-gray-500 text-xs">
              <Info size={12} />
              <span>
                Some coupons are hidden because you've already used them.
              </span>
            </div>
          )}

          {bookings.length > 0 && (
            <div className={`${cardCls} p-6 border-blue-500/30`}>
              <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                <Info size={18} className="text-blue-500" /> Your Appointments
              </h3>
              <div className="space-y-3">
                {bookings.map((b) => (
                  <div
                    key={b._id}
                    className="bg-gray-800/30 p-4 rounded-xl border border-gray-700 flex justify-between items-center"
                  >
                    <div>
                      <p className="text-white font-medium text-sm">
                        {b.serviceName}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {b.date} at {b.timeSlot}
                      </p>
                      {b.couponApplied?.code && (
                        <p className="text-[10px] text-yellow-400 flex items-center gap-1 mt-1">
                          <Ticket size={9} /> {b.couponApplied.code} –{" "}
                          {b.couponApplied.discountType === "percentage"
                            ? `${b.couponApplied.discount}% off`
                            : `₹${b.couponApplied.discount} off`}
                        </p>
                      )}
                    </div>
                    <span
                      className={`text-[10px] px-3 py-1 rounded-full font-bold uppercase ${
                        b.status === "confirmed"
                          ? "bg-green-500/10 text-green-500"
                          : b.status === "pending"
                            ? "bg-blue-500/10 text-blue-500"
                            : "bg-red-500/10 text-red-500"
                      }`}
                    >
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
              ${
                hasActiveBooking
                  ? "bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700"
                  : "bg-linear-to-r from-blue-600 to-indigo-600 text-white hover:shadow-xl hover:shadow-blue-900/30 active:scale-95"
              }`}
          >
            {hasActiveBooking ? (
              <>
                <Check size={20} /> Request Under Review
              </>
            ) : (
              <>
                <Calendar size={20} /> Book New Appointment
              </>
            )}
          </button>

          {hasActiveBooking && (
            <div className="flex items-center gap-2 text-amber-500 justify-center bg-amber-500/5 py-2 rounded-lg">
              <AlertCircle size={14} />
              <p className="text-[11px] font-medium">
                Only one active request allowed per business.
              </p>
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
              className="bg-gray-900 border border-gray-800 w-full max-w-lg rounded-3xl p-8 relative shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <button
                onClick={() => setShowModal(false)}
                className="absolute top-6 right-6 text-gray-500 hover:text-white transition-colors"
                aria-label="Close"
              >
                <X size={24} />
              </button>

              <div className="mb-6">
                <h2 className="text-3xl font-bold text-white tracking-tight">
                  Schedule Visit
                </h2>
                <p className="text-gray-400 mt-2">
                  Fill in the details for your appointment.
                </p>
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
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          serviceName: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-500 uppercase ml-1">
                        Date
                      </label>
                      <input
                        type="date"
                        required
                        className="w-full bg-gray-800 border-2 border-gray-800 rounded-2xl p-4 text-white focus:border-blue-500/50 outline-none transition-all"
                        value={formData.date}
                        onChange={(e) =>
                          setFormData({ ...formData, date: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-500 uppercase ml-1">
                        Time
                      </label>
                      <input
                        type="time"
                        required
                        className="w-full bg-gray-800 border-2 border-gray-800 rounded-2xl p-4 text-white focus:border-blue-500/50 outline-none transition-all"
                        value={formData.timeSlot}
                        onChange={(e) =>
                          setFormData({ ...formData, timeSlot: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 uppercase ml-1 flex items-center gap-2">
                      <MessageSquare size={12} /> Special Notes
                    </label>
                    <textarea
                      placeholder="Add any specific requirements..."
                      className="w-full bg-gray-800 border-2 border-gray-800 rounded-2xl p-4 text-white h-24 focus:border-blue-500/50 outline-none transition-all resize-none placeholder:text-gray-600"
                      value={formData.message}
                      onChange={(e) =>
                        setFormData({ ...formData, message: e.target.value })
                      }
                    />
                  </div>

                  {!isOwner && (
                    <div className="space-y-3">
                      <label className="text-xs font-bold text-gray-500 uppercase ml-1 flex items-center gap-2">
                        <Ticket size={12} className="text-yellow-500" /> Apply
                        Coupon{" "}
                        <span className="text-gray-600 normal-case font-normal">
                          (optional)
                        </span>
                      </label>

                      {unusedCoupons.length > 0 && !selectedCoupon && (
                        <div>
                          <button
                            type="button"
                            className="flex items-center gap-2 text-yellow-400 text-xs font-medium hover:text-yellow-300 transition-colors"
                            onClick={() => setShowCouponList(!showCouponList)}
                          >
                            <Tag size={12} /> Pick from available coupons
                            <ChevronDown
                              size={12}
                              className={`transition-transform ${showCouponList ? "rotate-180" : ""}`}
                            />
                          </button>
                          <AnimatePresence>
                            {showCouponList && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mt-2 bg-gray-800 rounded-xl border border-gray-700 overflow-hidden"
                              >
                                {unusedCoupons.map((c) => (
                                  <button
                                    key={c._id}
                                    type="button"
                                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-700 transition-colors text-left border-b border-gray-700/50 last:border-0"
                                    onClick={() => {
                                      setCouponInput(c.code);
                                      handleApplyCoupon(c.code);
                                    }}
                                  >
                                    <div>
                                      <p className="text-yellow-400 font-mono font-bold text-xs tracking-widest">
                                        {c.code}
                                      </p>
                                      <p className="text-gray-400 text-xs">
                                        {c.discountType === "percentage"
                                          ? `${c.discount}% Off`
                                          : `₹${c.discount} Off`}{" "}
                                        · Exp{" "}
                                        {new Date(
                                          c.expiryDate,
                                        ).toLocaleDateString("en-IN", {
                                          day: "numeric",
                                          month: "short",
                                        })}
                                      </p>
                                    </div>
                                    <span className="text-[9px] text-gray-600">
                                      {c.spotsLeft} left
                                    </span>
                                  </button>
                                ))}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      )}

                      {selectedCoupon ? (
                        <div className="flex items-center justify-between bg-yellow-500/10 border border-yellow-500/30 rounded-xl px-4 py-3">
                          <div className="flex items-center gap-2">
                            <CheckCircle2
                              size={16}
                              className="text-yellow-400"
                            />
                            <div>
                              <p className="text-yellow-400 font-bold font-mono text-sm tracking-widest">
                                {selectedCoupon.code}
                              </p>
                              <p className="text-yellow-500/70 text-xs">
                                {selectedCoupon.discountType === "percentage"
                                  ? `${selectedCoupon.discount}% discount applied`
                                  : `₹${selectedCoupon.discount} off applied`}
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={removeCoupon}
                            className="text-gray-500 hover:text-white transition-colors"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Enter coupon code"
                            className="flex-1 bg-gray-800 border-2 border-gray-800 rounded-xl p-3 text-white uppercase font-mono tracking-widest focus:border-yellow-500/50 outline-none transition-all placeholder:normal-case placeholder:tracking-normal placeholder:font-normal text-sm"
                            value={couponInput}
                            onChange={(e) => {
                              setCouponInput(e.target.value.toUpperCase());
                              setCouponError("");
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                handleApplyCoupon();
                              }
                            }}
                          />
                          <button
                            type="button"
                            disabled={validatingCoupon || !couponInput}
                            onClick={() => handleApplyCoupon()}
                            className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold px-4 rounded-xl transition-all disabled:opacity-40 active:scale-95 text-sm"
                          >
                            {validatingCoupon ? "..." : "Apply"}
                          </button>
                        </div>
                      )}

                      {couponError && (
                        <p className="text-red-400 text-xs flex items-center gap-1.5">
                          <AlertCircle size={12} /> {couponError}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-4 rounded-2xl transition-all shadow-xl shadow-blue-500/20 active:scale-95 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        Confirm Booking <ChevronRight size={18} />
                      </>
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
