const User = require("../models/User");
const Business = require("../models/Business");
const Product = require("../models/Product");
const Job = require("../models/Job");

exports.getAllBusinesses = async (req, res) => {
  try {
    const businesses = await Business.find()
      .populate("ownerId", "name email")
      .sort({ createdAt: -1 });
    res.json(businesses);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.deleteContent = async (req, res) => {
  try {
    const { type, id } = req.params;
    let result;

    switch (type) {
      case "user":
        result = await User.findByIdAndDelete(id);
        break;
      case "business":
        result = await Business.findByIdAndDelete(id);
        break;
      case "product":
        result = await Product.findByIdAndDelete(id);
        break;
      case "job":
        result = await Job.findByIdAndDelete(id);
        break;
      default:
        return res.status(400).json({ message: "Invalid type provided" });
    }

    if (!result) {
      return res.status(404).json({ message: "Content not found" });
    }

    res.json({ message: "Content deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
