const User = require("../models/User");
const Product = require("../models/Product");
const Business = require("../models/Business");
const Job = require("../models/Job");

exports.toggleWishlist = async (req, res) => {
  try {
    const { type, id } = req.body;
    const userId = req.user.id;
    const user = await User.findById(userId);

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    let field;
    switch (type) {
      case "product":
        field = "savedProducts";
        break;
      case "business":
        field = "savedBusinesses";
        break;
      case "job":
        field = "savedJobs";
        break;
      default:
        return res
          .status(400)
          .json({ success: false, message: "Invalid type" });
    }

    const isSavedAlready = user[field].some(
      (savedId) => savedId.toString() === id,
    );
    let isSaved;

    if (isSavedAlready) {
      await User.findByIdAndUpdate(userId, { $pull: { [field]: id } });
      isSaved = false;
    } else {
      await User.findByIdAndUpdate(userId, { $addToSet: { [field]: id } });
      isSaved = true;
    }

    console.log(
      `Wishlist updated for user ${userId}: ${type} ${id} - isSaved: ${isSaved}`,
    );

    res.json({
      success: true,
      message: isSaved ? "Added to wishlist" : "Removed from wishlist",
      isSaved,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getWishlist = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId)
      .populate("savedProducts")
      .populate("savedBusinesses")
      .populate("savedJobs");

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    res.json({
      success: true,
      wishlist: {
        products: user.savedProducts.filter((p) => p !== null),
        businesses: user.savedBusinesses.filter((b) => b !== null),
        jobs: user.savedJobs.filter((j) => j !== null),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.checkWishlistStatus = async (req, res) => {
  try {
    const { type, id } = req.params;
    const userId = req.user.id;
    const user = await User.findById(userId);

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    let field;
    switch (type) {
      case "product":
        field = "savedProducts";
        break;
      case "business":
        field = "savedBusinesses";
        break;
      case "job":
        field = "savedJobs";
        break;
      default:
        return res
          .status(400)
          .json({ success: false, message: "Invalid type" });
    }

    const isSaved = user[field].some((savedId) => savedId.toString() === id);
    res.json({ success: true, isSaved });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
