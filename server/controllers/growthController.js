const Business = require("../models/Business");
const Coupon = require("../models/Coupon");
const Booking = require("../models/Booking");
const QRCode = require("qrcode");
const { getPlanLimits } = require("../config/plans");
const User = require("../models/User");

exports.getBusinessAnalytics = async (req, res) => {
  try {
    const business = await Business.findById(req.params.businessId);
    if (!business) return res.status(404).json({ message: "Business not found" });

    if (business.ownerId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const user = await User.findById(req.user.id);
    const limits = getPlanLimits(user.subscription.plan);

    if (!limits.analytics) {
      return res.status(403).json({
        message: "Analytics are only available for Gold and Platinum plans.",
        locked: true,
      });
    }

    res.json({
      visits: business.visits,
      dailyVisits: business.dailyVisits,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createCoupon = async (req, res) => {
  try {
    const { businessId, code, discount, discountType, expiryDate, usageLimit } = req.body;

    const business = await Business.findById(businessId);
    if (!business) return res.status(404).json({ message: "Business not found" });

    if (business.ownerId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const qrData = JSON.stringify({ code, businessId });
    const qrCodeDataUrl = await QRCode.toDataURL(qrData);

    const newCoupon = new Coupon({
      businessId,
      code,
      discount,
      discountType,
      expiryDate,
      usageLimit,
    });

    await newCoupon.save();

    res.json({
      success: true,
      coupon: newCoupon,
      qrCode: qrCodeDataUrl,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getBusinessCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find({ businessId: req.params.businessId });
    res.json(coupons);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.redeemCoupon = async (req, res) => {
  try {
    const { code, businessId } = req.body;
    const coupon = await Coupon.findOne({ code, businessId });

    if (!coupon) return res.status(404).json({ message: "Invalid coupon code" });

    if (coupon.status !== "active") {
      return res.status(400).json({ message: "Coupon is no longer active" });
    }

    if (new Date(coupon.expiryDate) < new Date()) {
      coupon.status = "expired";
      await coupon.save();
      return res.status(400).json({ message: "Coupon has expired" });
    }

    if (coupon.usedCount >= coupon.usageLimit) {
      return res.status(400).json({ message: "Coupon usage limit reached" });
    }

    coupon.usedCount += 1;
    if (coupon.usedCount >= coupon.usageLimit) {
      coupon.status = "disabled";
    }
    await coupon.save();

    res.json({ success: true, message: "Coupon redeemed successfully", coupon });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createBooking = async (req, res) => {
  try {
    const { businessId, serviceName, date, timeSlot, message } = req.body;

    const business = await Business.findById(businessId);
    if (!business) return res.status(404).json({ message: "Business not found" });

    const businessOwner = await User.findById(business.ownerId);
    const ownerLimits = getPlanLimits(businessOwner?.subscription?.plan);

    if (ownerLimits.featuredListings) { 
      const existingBooking = await Booking.findOne({
        businessId,
        date,
        timeSlot,
        status: { $in: ["pending", "confirmed"] },
      });

      if (existingBooking) {
        return res.status(400).json({ message: "This time slot is already booked" });
      }
    }

    // Constraint: Only one active/pending booking per user for this business
    const existingUserBooking = await Booking.findOne({
      businessId,
      userId: req.user.id,
      status: { $in: ["pending", "confirmed"] },
    });

    if (existingUserBooking) {
      return res.status(400).json({ 
        message: "You already have an active appointment request with this business." 
      });
    }

    const user = await User.findById(req.user.id);

    const newBooking = new Booking({
      userId: req.user.id,
      userName: user.name,
      businessId,
      serviceName,
      date,
      timeSlot,
      message,
    });

    await newBooking.save();

    const io = req.app.get("io");
    if (io) {
   
      io.emit(`newBooking_${business.ownerId}`, {
        message: `New booking request from ${user.name}`,
        booking: newBooking,
      });
    }

    res.json({ success: true, booking: newBooking });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getBusinessBookings = async (req, res) => {
  try {
    const business = await Business.findById(req.params.businessId);
    if (!business) return res.status(404).json({ message: "Business not found" });

    let query = { businessId: req.params.businessId };

    // If not the owner, filter by the requesting user's ID
    if (business.ownerId.toString() !== req.user.id) {
      query.userId = req.user.id;
    }

    const bookings = await Booking.find(query).sort({ createdAt: -1 });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateBookingStatus = async (req, res) => {
  try {
    const { bookingId, status } = req.body;
    const booking = await Booking.findById(bookingId);

    if (!booking) return res.status(404).json({ message: "Booking not found" });

    const business = await Business.findById(booking.businessId);
    if (business.ownerId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    booking.status = status;
    await booking.save();

    res.json({ success: true, booking });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
