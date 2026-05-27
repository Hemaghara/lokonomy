const Coupon = require("../models/Coupon");
const Business = require("../models/Business");

exports.getAllCoupons = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 10 } = req.query;
    let query = {};

    if (status && status !== "all") query.status = status;
    if (search) {
      query.$or = [{ code: { $regex: search, $options: "i" } }];
    }

    const currentPage = parseInt(page);
    const pageLimit = parseInt(limit);
    const skip = (currentPage - 1) * pageLimit;

    const totalCoupons = await Coupon.countDocuments(query);
    const totalPages = Math.ceil(totalCoupons / pageLimit);

    const coupons = await Coupon.find(query)
      .populate("businessId", "businessName mainCategory")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageLimit)
      .lean();
    const now = new Date();
    const expiredIds = coupons
      .filter((c) => c.status === "active" && new Date(c.expiryDate) < now)
      .map((c) => c._id);
    if (expiredIds.length > 0) {
      await Coupon.updateMany(
        { _id: { $in: expiredIds } },
        { status: "expired" },
      );
      expiredIds.forEach((id) => {
        const coupon = coupons.find((c) => String(c._id) === String(id));
        if (coupon) coupon.status = "expired";
      });
    }

    const totalActive = await Coupon.countDocuments({ status: "active" });
    const totalExpired = await Coupon.countDocuments({ status: "expired" });
    const totalDisabled = await Coupon.countDocuments({ status: "disabled" });
    const totalUsed = await Coupon.aggregate([
      { $group: { _id: null, total: { $sum: "$usedCount" } } },
    ]);

    res.json({
      coupons,
      currentPage,
      totalPages,
      totalCoupons,
      stats: {
        totalActive,
        totalExpired,
        totalDisabled,
        totalUsed: totalUsed[0]?.total || 0,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
exports.getCouponById = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id)
      .populate("businessId", "businessName mainCategory")
      .populate("usedBy", "name email");
    if (!coupon) return res.status(404).json({ message: "Coupon not found" });
    res.json(coupon);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
exports.createCoupon = async (req, res) => {
  try {
    const {
      code,
      businessId,
      discount,
      discountType,
      expiryDate,
      usageLimit,
      status,
    } = req.body;

    const existing = await Coupon.findOne({ code: code.toUpperCase() });
    if (existing)
      return res.status(400).json({ message: "Coupon code already exists" });

    const business = await Business.findById(businessId);
    if (!business)
      return res.status(404).json({ message: "Business not found" });

    const coupon = await Coupon.create({
      code: code.toUpperCase(),
      businessId,
      discount,
      discountType,
      expiryDate,
      usageLimit: usageLimit || 100,
      status: status || "active",
    });

    res.status(201).json({ message: "Coupon created", coupon });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
exports.updateCoupon = async (req, res) => {
  try {
    const { code, discount, discountType, expiryDate, usageLimit, status } =
      req.body;

    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) return res.status(404).json({ message: "Coupon not found" });

    if (code && code.toUpperCase() !== coupon.code) {
      const existing = await Coupon.findOne({ code: code.toUpperCase() });
      if (existing)
        return res.status(400).json({ message: "Coupon code already in use" });
      coupon.code = code.toUpperCase();
    }

    if (discount !== undefined) coupon.discount = discount;
    if (discountType) coupon.discountType = discountType;
    if (expiryDate) coupon.expiryDate = expiryDate;
    if (usageLimit !== undefined) coupon.usageLimit = usageLimit;
    if (status) coupon.status = status;

    await coupon.save();
    res.json({ message: "Coupon updated", coupon });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
exports.deleteCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findByIdAndDelete(req.params.id);
    if (!coupon) return res.status(404).json({ message: "Coupon not found" });
    res.json({ message: "Coupon deleted" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
exports.toggleCouponStatus = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) return res.status(404).json({ message: "Coupon not found" });

    coupon.status = coupon.status === "active" ? "disabled" : "active";
    await coupon.save();
    res.json({ message: `Coupon ${coupon.status}`, status: coupon.status });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
