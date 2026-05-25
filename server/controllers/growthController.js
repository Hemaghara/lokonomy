const Business = require("../models/Business");
const Coupon = require("../models/Coupon");
const Booking = require("../models/Booking");
const QRCode = require("qrcode");
const User = require("../models/User");
const Plan = require("../models/Plan");
const { createNotification } = require("./notificationController");
const logger = require("../utils/logger");

const DEFAULT_FREE_LIMITS = {
  productsUpload: 10,
  storiesPost: 15,
  jobsPost: 5,
  analytics: true,
  featuredListings: false,
  prioritySupport: false,
  chatMessaging: true,
  couponsPerMonth: 0,
  bookingEnabled: false,
  customUrl: false,
  removeBranding: false,
  aiInsights: "none",
  autoResponder: false,
  promotedListings: false,
  guaranteeBadge: false,
  commissionRate: 5,
};

async function getLimitsForUser(user) {
  const planSlug = user.subscription?.plan || "free";
  const planDoc = await Plan.findOne({ slug: planSlug });
  return planDoc?.limits || DEFAULT_FREE_LIMITS;
}

exports.getBusinessAnalytics = async (req, res) => {
  try {
    const business = await Business.findById(req.params.businessId);
    if (!business)
      return res.status(404).json({ message: "Business not found" });

    if (business.ownerId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const user = await User.findById(req.user.id);
    const limits = await getLimitsForUser(user);

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
    logger.error({ err }, "Error in getBusinessAnalytics");
    res.status(500).json({ message: err.message });
  }
};

exports.createCoupon = async (req, res) => {
  try {
    const { businessId, code, discount, discountType, expiryDate, usageLimit } =
      req.body;

    const business = await Business.findById(businessId);
    if (!business)
      return res.status(404).json({ message: "Business not found" });

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
    logger.error({ err }, "Error in createCoupon");
    res.status(500).json({ message: err.message });
  }
};

exports.getBusinessCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find({
      businessId: req.params.businessId,
    }).sort({ createdAt: -1 });
    res.json(coupons);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getActiveCoupons = async (req, res) => {
  try {
    const now = new Date();
    const coupons = await Coupon.find({
      businessId: req.params.businessId,
      status: "active",
      expiryDate: { $gt: now },
    }).sort({ createdAt: -1 });

    const userId = req.user ? req.user.id : null;
    const result = coupons.map((c) => ({
      _id: c._id,
      code: c.code,
      discount: c.discount,
      discountType: c.discountType,
      expiryDate: c.expiryDate,
      usageLimit: c.usageLimit,
      usedCount: c.usedCount,
      alreadyUsed: userId
        ? c.usedBy.some((id) => id.toString() === userId)
        : false,
      spotsLeft: c.usageLimit - c.usedCount,
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateCoupon = async (req, res) => {
  try {
    const { couponId } = req.params;
    const { code, discount, discountType, expiryDate, usageLimit, status } =
      req.body;

    const coupon = await Coupon.findById(couponId);
    if (!coupon) return res.status(404).json({ message: "Coupon not found" });

    const business = await Business.findById(coupon.businessId);
    if (!business || business.ownerId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    if (code !== undefined) coupon.code = code.toUpperCase();
    if (discount !== undefined) coupon.discount = discount;
    if (discountType !== undefined) coupon.discountType = discountType;
    if (expiryDate !== undefined) coupon.expiryDate = expiryDate;
    if (usageLimit !== undefined) coupon.usageLimit = usageLimit;
    if (status !== undefined) coupon.status = status;

    if (new Date(coupon.expiryDate) < new Date()) {
      coupon.status = "expired";
    }

    await coupon.save();
    res.json({ success: true, coupon });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteCoupon = async (req, res) => {
  try {
    const { couponId } = req.params;
    const coupon = await Coupon.findById(couponId);
    if (!coupon) return res.status(404).json({ message: "Coupon not found" });

    const business = await Business.findById(coupon.businessId);
    if (!business || business.ownerId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    await Coupon.findByIdAndDelete(couponId);
    res.json({ success: true, message: "Coupon deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.validateCoupon = async (req, res) => {
  try {
    const { code, businessId, sellerId } = req.body;
    const userId = req.user.id;

    let targetBusinessId = businessId;
    if (!targetBusinessId && sellerId) {
      const biz = await Business.findOne({ ownerId: sellerId });
      if (biz) {
        targetBusinessId = biz._id;
      }
    }

    const coupon = await Coupon.findOne({ code, businessId: targetBusinessId });
    if (!coupon)
      return res.status(404).json({ message: "Invalid coupon code" });

    if (coupon.status !== "active") {
      return res
        .status(400)
        .json({ message: "This coupon is no longer active" });
    }

    if (new Date(coupon.expiryDate) < new Date()) {
      coupon.status = "expired";
      await coupon.save();
      return res.status(400).json({ message: "This coupon has expired" });
    }

    if (coupon.usedCount >= coupon.usageLimit) {
      return res
        .status(400)
        .json({ message: "This coupon's usage limit has been reached" });
    }

    const alreadyUsed = coupon.usedBy.some((id) => id.toString() === userId);
    if (alreadyUsed) {
      return res
        .status(400)
        .json({ message: "You have already used this coupon" });
    }

    res.json({
      success: true,
      valid: true,
      discount: coupon.discount,
      discountType: coupon.discountType,
      code: coupon.code,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.redeemCoupon = async (req, res) => {
  try {
    const { code, businessId, sellerId } = req.body;
    const userId = req.user.id;

    let targetBusinessId = businessId;
    if (!targetBusinessId && sellerId) {
      const biz = await Business.findOne({ ownerId: sellerId });
      if (biz) {
        targetBusinessId = biz._id;
      }
    }

    const coupon = await Coupon.findOne({ code, businessId: targetBusinessId });
    if (!coupon)
      return res.status(404).json({ message: "Invalid coupon code" });

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

    const alreadyUsed = coupon.usedBy.some((id) => id.toString() === userId);
    if (alreadyUsed) {
      return res
        .status(400)
        .json({ message: "You have already used this coupon" });
    }

    coupon.usedCount += 1;
    coupon.usedBy.push(userId);

    if (coupon.usedCount >= coupon.usageLimit) {
      coupon.status = "disabled";
    }
    await coupon.save();

    res.json({
      success: true,
      message: "Coupon redeemed successfully!",
      coupon,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createBooking = async (req, res) => {
  try {
    const { businessId, serviceName, date, timeSlot, message, couponCode } =
      req.body;

    const business = await Business.findById(businessId);
    if (!business)
      return res.status(404).json({ message: "Business not found" });

    const businessOwner = await User.findById(business.ownerId);
    const ownerLimits = await getLimitsForUser(businessOwner);

    if (ownerLimits.featuredListings) {
      const existingBooking = await Booking.findOne({
        businessId,
        date,
        timeSlot,
        status: { $in: ["pending", "confirmed"] },
      });

      if (existingBooking) {
        return res
          .status(400)
          .json({ message: "This time slot is already booked" });
      }
    }

    const isBusinessOwner = business.ownerId.toString() === req.user.id;

    if (!isBusinessOwner) {
      const existingUserBooking = await Booking.findOne({
        businessId,
        userId: req.user.id,
        status: { $in: ["pending", "confirmed"] },
      });

      if (existingUserBooking) {
        return res.status(400).json({
          message:
            "You already have an active appointment request with this business.",
        });
      }
    }

    const user = await User.findById(req.user.id);

    let appliedCoupon = null;
    if (couponCode) {
      const coupon = await Coupon.findOne({
        code: couponCode.toUpperCase(),
        businessId,
      });
      if (
        coupon &&
        coupon.status === "active" &&
        new Date(coupon.expiryDate) >= new Date()
      ) {
        const alreadyUsed = coupon.usedBy.some(
          (id) => id.toString() === req.user.id,
        );
        if (!alreadyUsed && coupon.usedCount < coupon.usageLimit) {
          coupon.usedCount += 1;
          coupon.usedBy.push(req.user.id);
          if (coupon.usedCount >= coupon.usageLimit) coupon.status = "disabled";
          await coupon.save();
          appliedCoupon = {
            code: coupon.code,
            discount: coupon.discount,
            discountType: coupon.discountType,
          };
        }
      }
    }

    const newBooking = new Booking({
      userId: req.user.id,
      userName: user.name,
      businessId,
      serviceName,
      date,
      timeSlot,
      message,
      isOwnerSelf: isBusinessOwner,
      couponApplied: appliedCoupon,
    });

    await newBooking.save();

    const io = req.app.get("io");
    if (io) {
      io.emit(`newBooking_${business.ownerId}`, {
        message: `New booking request from ${user.name}`,
        booking: newBooking,
      });
    }

    try {
      const { sendPushNotification } = require("../utils/pushService");
      await sendPushNotification(business.ownerId, {
        title: "New Booking Request",
        body: `${user.name} has requested a booking for ${serviceName}.`,
        data: {
          url: "/dashboard/bookings",
          type: "booking",
        },
      });
    } catch (pushErr) {
      logger.error({ err: pushErr }, "Error sending push notification for booking");
    }

    await createNotification({
      recipientId: business.ownerId,
      type: "booking",
      title: "New Booking Request",
      message: `${user.name} requested a booking for ${serviceName} on ${date}.`,
      actionUrl: `/business/${businessId}`,
      metadata: { bookingId: newBooking._id, businessId },
      io,
    });

    res.json({ success: true, booking: newBooking, appliedCoupon });
  } catch (err) {
    logger.error({ err }, "Error in createBooking");
    res.status(500).json({ message: err.message });
  }
};

exports.getBusinessBookings = async (req, res) => {
  try {
    const business = await Business.findById(req.params.businessId);
    if (!business)
      return res.status(404).json({ message: "Business not found" });

    let query = { businessId: req.params.businessId };

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

    const io = req.app.get("io");

    try {
      const { sendPushNotification } = require("../utils/pushService");
      await sendPushNotification(booking.userId, {
        title: "Booking Update",
        body: `Your booking for ${booking.serviceName} has been ${status}.`,
        data: {
          url: "/my-bookings",
          type: "booking_update",
        },
      });
    } catch (pushErr) {
      logger.error({ err: pushErr }, "Error sending push notification for booking status update");
    }

    await createNotification({
      recipientId: booking.userId.toString(),
      type: "booking",
      title: "Booking Status Updated",
      message: `Your booking for ${booking.serviceName} has been ${status}.`,
      actionUrl: `/business/${booking.businessId}`,
      metadata: { bookingId: booking._id, status },
      io,
    });

    res.json({ success: true, booking });
  } catch (err) {
    logger.error({ err }, "Error in updateBookingStatus");
    res.status(500).json({ message: err.message });
  }
};
