const Business = require("../models/Business");
const User = require("../models/User");
const { uploadMedia } = require("../utils/uploadMedia");
const { createNotification } = require("./notificationController");
const { buildLocationGeoJSON } = require("../utils/geoHelpers");
const logger = require("../utils/logger");

exports.getAllBusinesses = async (req, res) => {
  try {
    const {
      lat,
      lng,
      radius = 5000,
      district,
      taluka,
      category,
      subcategory,
      search,
      openNow,
      verified,
      trending,
      hasOffers,
      sortBy,
    } = req.query;

    let query = {};
    if (lat && lng) {
      query.location = {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [parseFloat(lng), parseFloat(lat)],
          },
          $maxDistance: parseFloat(radius),
        },
      };
    } else {
      if (district) query.district = district;
      if (taluka) query.taluka = taluka;
    }

    if (category && category !== "Daily Needs") query.mainCategory = category;
    if (subcategory) query.subCategory = { $regex: subcategory, $options: "i" };

    if (search) {
      query.$or = [
        { businessName: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    if (verified === "true") {
      query.verificationStatus = "verified";
    }

    let sortOpts = lat && lng ? {} : { createdAt: -1 };
    if (sortBy === "rating") sortOpts = { rating: -1 };
    else if (sortBy === "trending") sortOpts = { visits: -1 };
    else if (sortBy === "newest") sortOpts = { createdAt: -1 };

    let businesses = await Business.find(query).sort(sortOpts);

    if (openNow === "true") {
      const now = new Date();
      const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
      const currentDay = days[now.getDay()];
      const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

      businesses = businesses.filter((biz) => {
        if (!biz.businessHours) return false;
        const dayHours = biz.businessHours.get ? biz.businessHours.get(currentDay) : biz.businessHours[currentDay];
        if (!dayHours || !dayHours.isOpen) return false;
        return currentTime >= dayHours.startTime && currentTime <= dayHours.endTime;
      });
    }

    const now = new Date();
    const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    const currentDay = days[now.getDay()];
    const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

    const Coupon = require("../models/Coupon");

    let businessIdsWithOffers = null;
    if (hasOffers === "true") {
      const activeCoupons = await Coupon.find({
        status: "active",
        expiryDate: { $gt: now },
      }).distinct("businessId");
      businessIdsWithOffers = new Set(activeCoupons.map((id) => id.toString()));
      businesses = businesses.filter((biz) =>
        businessIdsWithOffers.has(biz._id.toString())
      );
    } else {
      const activeCoupons = await Coupon.find({
        status: "active",
        expiryDate: { $gt: now },
      }).distinct("businessId");
      businessIdsWithOffers = new Set(activeCoupons.map((id) => id.toString()));
    }

    const PromotedListing = require("../models/PromotedListing");
    const activePromotions = await PromotedListing.find({
      status: "active",
      type: "search_boost",
      startDate: { $lte: now },
      endDate: { $gte: now },
    });

    const promoMap = new Map(activePromotions.map((p) => [p.businessId.toString(), p._id.toString()]));

    const enriched = businesses.map((biz) => {
      const bizObj = biz.toObject ? biz.toObject() : { ...biz };
      if (biz.businessHours) {
        const dayHours = biz.businessHours.get ? biz.businessHours.get(currentDay) : biz.businessHours[currentDay];
        bizObj.isOpenNow = dayHours && dayHours.isOpen && currentTime >= dayHours.startTime && currentTime <= dayHours.endTime;
      } else {
        bizObj.isOpenNow = false;
      }
      bizObj.hasActiveOffers = businessIdsWithOffers ? businessIdsWithOffers.has(biz._id.toString()) : false;
      
      if (promoMap.has(biz._id.toString())) {
        bizObj.isPromoted = true;
        bizObj.promotionId = promoMap.get(biz._id.toString());
      } else {
        bizObj.isPromoted = false;
      }
      return bizObj;
    });

    // Sort promoted listings first
    enriched.sort((a, b) => {
      if (a.isPromoted && !b.isPromoted) return -1;
      if (!a.isPromoted && b.isPromoted) return 1;
      return 0;
    });

    res.json(enriched);
  } catch (err) {
    logger.error({ err }, "Error fetching businesses");
    res.status(500).json({ message: err.message });
  }
};

exports.addBusiness = async (req, res) => {
  try {
    const businessData = { ...req.body };
    if (businessData.logo && businessData.logo.startsWith("data:image")) {
      const res = await uploadMedia(businessData.logo, "businesses/logos");
      businessData.logo = res.secure_url;
    }
    if (businessData.photos && Array.isArray(businessData.photos)) {
      const uploadedPhotos = await Promise.all(
        businessData.photos.map(async (photo) => {
          if (photo.startsWith("data:image")) {
            const res = await uploadMedia(photo, "businesses/gallery");
            return res.secure_url;
          }
          return photo;
        }),
      );
      businessData.photos = uploadedPhotos;
    }
    const geoData = buildLocationGeoJSON(businessData);
    if (geoData.location) {
      businessData.location = geoData.location;
      businessData.locationAddress = geoData.locationAddress;
      logger.debug(
        { userId: req.user.id, businessName: businessData.businessName },
        "Business location saved",
      );
    }

    delete businessData.latitude;
    delete businessData.longitude;
    delete businessData.locationAddress;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const newBusiness = new Business({
      ...businessData,
      ...(geoData.locationAddress !== undefined
        ? { locationAddress: geoData.locationAddress }
        : {}),
      ownerId: req.user.id,
      ownerName: user.name,
    });
    await newBusiness.save();

    res.status(201).json({
      success: true,
      message: "Business registered successfully",
      business: newBusiness,
    });
  } catch (err) {
    logger.error({ err }, "Error saving business");
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.getBusinessById = async (req, res) => {
  try {
    const business = await Business.findById(req.params.id);
    if (!business) {
      return res.status(404).json({ message: "Business not found" });
    }

    const now = new Date();
    const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    const currentDay = days[now.getDay()];
    const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

    const userIds = business.reviews.map(r => r.userId).filter(Boolean);
    const users = await User.find({ _id: { $in: userIds } }).select("influencerBadge");
    const userMap = new Map(users.map(u => [u._id.toString(), u.influencerBadge || "none"]));

    const bizObj = business.toObject ? business.toObject() : { ...business };
    bizObj.reviews = bizObj.reviews.map(rev => ({
      ...rev,
      influencerBadge: rev.userId ? (userMap.get(rev.userId.toString()) || "none") : "none"
    }));

    if (business.businessHours) {
      const dayHours = business.businessHours.get ? business.businessHours.get(currentDay) : business.businessHours[currentDay];
      bizObj.isOpenNow = dayHours && dayHours.isOpen && currentTime >= dayHours.startTime && currentTime <= dayHours.endTime;
    } else {
      bizObj.isOpenNow = false;
    }

    const Coupon = require("../models/Coupon");
    const activeCoupon = await Coupon.findOne({
      businessId: business._id,
      status: "active",
      expiryDate: { $gt: now },
    });
    bizObj.hasActiveOffers = !!activeCoupon;

    // Check if the owner has platinum plan to display guarantee badge
    const owner = await User.findById(business.ownerId).select("subscription");
    bizObj.ownerPlan = owner?.subscription?.plan || "free";

    res.json(bizObj);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.incrementVisitCount = async (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0];
    const business = await Business.findById(req.params.id);

    if (!business)
      return res.status(404).json({ message: "Business not found" });

    business.visits = (business.visits || 0) + 1;

    const visitEntry = business.dailyVisits.find((v) => v.date === today);
    if (visitEntry) {
      visitEntry.count += 1;
    } else {
      business.dailyVisits.push({ date: today, count: 1 });
    }

    if (business.dailyVisits.length > 30) {
      business.dailyVisits.shift();
    }

    await business.save();
    res.json({ visits: business.visits, dailyVisits: business.dailyVisits });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.addReview = async (req, res) => {
  try {
    const { userName, rating, comment } = req.body;
    const userId = req.user.id;

    if (!rating) {
      return res.status(400).json({
        success: false,
        message: "Rating is required",
      });
    }

    const business = await Business.findById(req.params.id);
    if (!business) {
      return res.status(404).json({
        success: false,
        message: "Business not found",
      });
    }

    if (business.ownerId && business.ownerId.toString() === userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Business owners cannot review their own business",
      });
    }

    const alreadyReviewed = business.reviews.find(
      (rev) => rev.userId && rev.userId.toString() === userId.toString(),
    );
    if (alreadyReviewed) {
      return res.status(400).json({
        success: false,
        message: "You have already reviewed this business",
      });
    }

    const newReview = {
      userId,
      userName: userName || "Anonymous",
      rating: Number(rating),
      comment: comment || "",
    };

    business.reviews.push(newReview);

    const totalRating = business.reviews.reduce(
      (acc, rev) => acc + (Number(rev.rating) || 0),
      0,
    );
    business.rating = totalRating / business.reviews.length;

    await business.save();

    if (business.ownerId) {
      const io = req.app.get("io");
      await createNotification({
        recipientId: business.ownerId,
        type: "review",
        title: "New Business Review",
        message: `${userName || "Someone"} left a ${rating}★ review on ${business.businessName}.`,
        actionUrl: `/business/${business._id}`,
        metadata: { businessId: business._id, rating },
        io,
      });
    }

    res.status(201).json({
      success: true,
      message: "Review added successfully",
      business,
    });
  } catch (err) {
    logger.error({ err }, "Error adding review");
    res.status(500).json({
      success: false,
      message: "Server error: " + err.message,
    });
  }
};

exports.getMyBusinesses = async (req, res) => {
  try {
    const businesses = await Business.find({ ownerId: req.user.id }).sort({
      createdAt: -1,
    });
    res.json(businesses);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateBusiness = async (req, res) => {
  try {
    const business = await Business.findById(req.params.id);
    if (!business) {
      return res
        .status(404)
        .json({ success: false, message: "Business not found" });
    }
    if (business.ownerId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to edit this business",
      });
    }

    const updateData = { ...req.body };

    const user = await User.findById(req.user.id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    updateData.ownerName = user.name;
    if (updateData.logo && updateData.logo.startsWith("data:image")) {
      const res = await uploadMedia(updateData.logo, "businesses/logos");
      updateData.logo = res.secure_url;
    }

    if (updateData.photos && Array.isArray(updateData.photos)) {
      const uploadedPhotos = await Promise.all(
        updateData.photos.map(async (photo) => {
          if (photo.startsWith("data:image")) {
            const res = await uploadMedia(photo, "businesses/gallery");
            return res.secure_url;
          }
          return photo;
        }),
      );
      updateData.photos = uploadedPhotos;
    }
    const geoData = buildLocationGeoJSON(updateData);
    if (geoData.location) {
      updateData.location = geoData.location;
      updateData.locationAddress = geoData.locationAddress;
    }
    delete updateData.latitude;
    delete updateData.longitude;

    const updatedBusiness = await Business.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true },
    );

    res.json({
      success: true,
      message: "Business updated successfully",
      business: updatedBusiness,
    });
  } catch (err) {
    logger.error({ err }, "Error updating business");
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.deleteBusiness = async (req, res) => {
  try {
    const business = await Business.findById(req.params.id);
    if (!business) {
      return res
        .status(404)
        .json({ success: false, message: "Business not found" });
    }
    if (business.ownerId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this business",
      });
    }

    await Business.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Business deleted successfully",
    });
  } catch (err) {
    logger.error({ err }, "Error deleting business");
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.submitVerification = async (req, res) => {
  try {
    const { documentType, documentNumber, documentFile } = req.body;
    const business = await Business.findById(req.params.id);

    if (!business) {
      return res.status(404).json({ message: "Business not found" });
    }

    if (business.ownerId.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    business.verificationStatus = "pending";
    business.kycDocuments = business.kycDocuments || [];
    business.kycDocuments.push(documentFile);
    await business.save();

    res.json({ success: true, message: "Verification submitted", business });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
