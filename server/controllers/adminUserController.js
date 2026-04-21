const User = require("../models/User");
const Business = require("../models/Business");
const Product = require("../models/Product");
const Job = require("../models/Job");
const Order = require("../models/Order");

exports.getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, status, plan, district } = req.query;
    const query = {};
    
    if (search) {
      query.name = { $regex: search, $options: "i" };
    }
    
    if (status && status !== "All") {
      query.status = status;
    }
    
    if (plan && plan !== "All") {
      query["subscription.plan"] = plan;
    }
    
    if (district && district !== "All") {
      query.district = district;
    }

    
    const [users, total] = await Promise.all([
      User.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(Number(limit)),
      User.countDocuments(query),
    ]);

    res.json({ 
      users, 
      total, 
      page: Number(page), 
      totalPages: Math.ceil(total / limit) 
    });
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
