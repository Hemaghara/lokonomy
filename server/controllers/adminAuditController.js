const AdminActivityLog = require("../models/AdminActivityLog");
const Admin = require("../models/Admin");
const logger = require("../utils/logger");

exports.getAuditLogs = async (req, res) => {
  try {
    const {
      adminId,
      action,
      startDate,
      endDate,
      search,
      page = 1,
      limit = 20,
    } = req.query;

    let query = {};
    if (adminId && adminId !== "all") query.admin = adminId;
    if (action && action !== "all")
      query.action = { $regex: action, $options: "i" };
    if (search) {
      query.$or = [
        { action: { $regex: search, $options: "i" } },
        { details: { $regex: search, $options: "i" } },
      ];
    }
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    const currentPage = parseInt(page);
    const pageLimit = parseInt(limit);
    const skip = (currentPage - 1) * pageLimit;

    const totalLogs = await AdminActivityLog.countDocuments(query);
    const totalPages = Math.ceil(totalLogs / pageLimit);

    const logs = await AdminActivityLog.find(query)
      .populate("admin", "name email role")
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(pageLimit);

    const admins = await Admin.find().select("name email role");

    res.json({ logs, currentPage, totalPages, totalLogs, admins });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
exports.logAction = async (adminId, action, details, ipAddress) => {
  try {
    await AdminActivityLog.create({
      admin: adminId,
      action,
      details,
      ipAddress,
    });
  } catch (err) {
    logger.error({ err }, "Failed to log admin action");
  }
};
