const User = require("../models/User");
const Business = require("../models/Business");
const Product = require("../models/Product");
const Job = require("../models/Job");
const Order = require("../models/Order");

exports.getAllUsers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      status,
      plan,
      district,
      date,
      sortBy,
      sortOrder,
    } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phoneNumber: { $regex: search, $options: "i" } },
      ];
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

    if (date) {
      const start = new Date(date);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      query.createdAt = { $gte: start, $lte: end };
    }

    let sort = { createdAt: -1 };
    if (sortBy === "lastLoginDate") {
      sort = { lastLoginDate: sortOrder === "asc" ? 1 : -1 };
    } else if (sortBy === "createdAt") {
      sort = { createdAt: sortOrder === "asc" ? 1 : -1 };
    }

    const [users, total] = await Promise.all([
      User.find(query)
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(Number(limit)),
      User.countDocuments(query),
    ]);

    res.json({
      users,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.exportUsers = async (req, res) => {
  try {
    const { search, status, plan, district, date } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phoneNumber: { $regex: search, $options: "i" } },
      ];
    }
    if (status && status !== "All") query.status = status;
    if (plan && plan !== "All") query["subscription.plan"] = plan;
    if (district && district !== "All") query.district = district;
    if (date) {
      const start = new Date(date);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      query.createdAt = { $gte: start, $lte: end };
    }

    const users = await User.find(query).sort({ createdAt: -1 }).lean();

    const headers = [
      "ID",
      "Name",
      "Email",
      "Phone",
      "District",
      "Plan",
      "Status",
      "Joined Date",
      "Last Login",
    ];
    const rows = users.map((u) => [
      u._id,
      u.name,
      u.email,
      u.phoneNumber || "N/A",
      u.district || "N/A",
      u.subscription?.plan || "free",
      u.status || "active",
      new Date(u.createdAt).toLocaleDateString(),
      u.lastLoginDate ? new Date(u.lastLoginDate).toLocaleString() : "Never",
    ]);

    const csvContent = [headers, ...rows]
      .map((row) =>
        row.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(","),
      )
      .join("\n");

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=users_export_${new Date().toISOString().split("T")[0]}.csv`,
    );
    res.send(csvContent);
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

const adminAuditController = require("./adminAuditController");

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

    await adminAuditController.logAction(
      req.admin.id,
      "USER_STATUS_UPDATE",
      `Updated user ${user.email} status to ${status}`,
      req.ip,
    );

    res.json({ message: `User status updated to ${status}`, user });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.bulkUpdateUserStatus = async (req, res) => {
  try {
    const { ids, status } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "User IDs array is required" });
    }

    if (!["active", "suspended", "banned"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const result = await User.updateMany(
      { _id: { $in: ids } },
      { $set: { status } },
    );

    await adminAuditController.logAction(
      req.admin.id,
      "USER_BULK_STATUS_UPDATE",
      `Bulk updated ${result.modifiedCount} users status to ${status}`,
      req.ip,
    );

    res.json({
      message: `${result.modifiedCount} users updated to ${status}`,
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
