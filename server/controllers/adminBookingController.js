const Booking = require("../models/Booking");
const Business = require("../models/Business");

exports.getAllBookings = async (req, res) => {
  try {
    const {
      status,
      search,
      page = 1,
      limit = 10,
      startDate,
      endDate,
    } = req.query;
    let query = {};

    if (status && status !== "all") query.status = status;
    if (search) {
      query.$or = [
        { userName: { $regex: search, $options: "i" } },
        { serviceName: { $regex: search, $options: "i" } },
      ];
    }
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const currentPage = parseInt(page);
    const pageLimit = parseInt(limit);
    const skip = (currentPage - 1) * pageLimit;

    const totalBookings = await Booking.countDocuments(query);
    const totalPages = Math.ceil(totalBookings / pageLimit);

    const bookings = await Booking.find(query)
      .populate("userId", "name email phoneNumber")
      .populate("businessId", "name category")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageLimit);

    const stats = {
      pending: await Booking.countDocuments({ status: "pending" }),
      confirmed: await Booking.countDocuments({ status: "confirmed" }),
      completed: await Booking.countDocuments({ status: "completed" }),
      cancelled: await Booking.countDocuments({ status: "cancelled" }),
      total: await Booking.countDocuments(),
    };

    res.json({ bookings, currentPage, totalPages, totalBookings, stats });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
exports.getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate("userId", "name email phoneNumber")
      .populate("businessId", "name category phone address");
    if (!booking) return res.status(404).json({ message: "Booking not found" });
    res.json(booking);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
exports.updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true },
    );
    if (!booking) return res.status(404).json({ message: "Booking not found" });
    res.json({ message: "Booking status updated", booking });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
exports.deleteBooking = async (req, res) => {
  try {
    const booking = await Booking.findByIdAndDelete(req.params.id);
    if (!booking) return res.status(404).json({ message: "Booking not found" });
    res.json({ message: "Booking deleted" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
