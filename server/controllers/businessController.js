const Business = require("../models/Business");
const User = require("../models/User");
const { uploadToCloudinary } = require("../utils/cloudinary");

const buildLocationGeoJSON = (body) => {
  const { latitude, longitude, locationAddress } = body;
  if (latitude && longitude) {
    return {
      location: {
        type: "Point",
        coordinates: [parseFloat(longitude), parseFloat(latitude)],
      },
      locationAddress: locationAddress || null,
    };
  }
  return {};
};

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
    const sortOpts = lat && lng ? {} : { createdAt: -1 };
    const businesses = await Business.find(query).sort(sortOpts);
    res.json(businesses);
  } catch (err) {
    console.error("Error fetching businesses:", err.message);
    res.status(500).json({ message: err.message });
  }
};

exports.addBusiness = async (req, res) => {
  try {
    const businessData = { ...req.body };
    if (businessData.logo && businessData.logo.startsWith("data:image")) {
      businessData.logo = await uploadToCloudinary(
        businessData.logo,
        "businesses/logos",
      );
    }
    if (businessData.photos && Array.isArray(businessData.photos)) {
      const uploadedPhotos = await Promise.all(
        businessData.photos.map(async (photo) => {
          if (photo.startsWith("data:image")) {
            return await uploadToCloudinary(photo, "businesses/gallery");
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
      console.log(
        `📍 Business location saved: [${businessData.latitude}, ${businessData.longitude}]`,
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
    console.error("Error saving business:", err);
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.getBusinessById = async (req, res) => {
  try {
    const business = await Business.findById(req.params.id);
    if (!business) {
      return res.status(404).json({ message: "Business not found" });
    }
    res.json(business);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.incrementVisitCount = async (req, res) => {
  try {
    const business = await Business.findByIdAndUpdate(
      req.params.id,
      { $inc: { visits: 1 } },
      { new: true },
    );
    if (!business)
      return res.status(404).json({ message: "Business not found" });
    res.json({ visits: business.visits });
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

    // Safely compare ownerId
    if (business.ownerId && business.ownerId.toString() === userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Business owners cannot review their own business",
      });
    }

    // Check if user already reviewed
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

    // Recalculate average rating
    const totalRating = business.reviews.reduce(
      (acc, rev) => acc + (Number(rev.rating) || 0),
      0,
    );
    business.rating = totalRating / business.reviews.length;

    await business.save();

    res.status(201).json({
      success: true,
      message: "Review added successfully",
      business,
    });
  } catch (err) {
    console.error("Error adding review:", err.message);
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
    if (business.ownerId !== req.user.id) {
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
      updateData.logo = await uploadToCloudinary(
        updateData.logo,
        "businesses/logos",
      );
    }

    if (updateData.photos && Array.isArray(updateData.photos)) {
      const uploadedPhotos = await Promise.all(
        updateData.photos.map(async (photo) => {
          if (photo.startsWith("data:image")) {
            return await uploadToCloudinary(photo, "businesses/gallery");
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
    console.error("Error updating business:", err);
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
    if (business.ownerId !== req.user.id) {
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
    console.error("Error deleting business:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};
