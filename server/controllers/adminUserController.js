const User = require("../models/User");
const Business = require("../models/Business");
const Product = require("../models/Product");
const Job = require("../models/Job");
const Order = require("../models/Order");

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.getUserDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id).select("-password").lean();
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const businesses = await Business.find({ ownerId: id });
    const products = await Product.find({ creator: id });
    const jobs = await Job.find({ postedBy: id });
    const orders = await Order.find({ buyer: id }).populate(
      "product",
      "name price images",
    );

    res.json({
      user,
      businesses,
      products,
      jobs,
      orders,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["active", "suspended", "banned"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const user = await User.findByIdAndUpdate(id, { status }, { new: true });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: `User status updated to ${status}`, user });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
