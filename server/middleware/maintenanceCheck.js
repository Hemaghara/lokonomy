const Settings = require("../models/Settings");

module.exports = async (req, res, next) => {
  try {
    // Skip check for admin routes or root wake up URL
    if (req.path.startsWith("/api/admin") || req.path === "/") {
      return next();
    }
    const settings = await Settings.findOne();
    if (settings && settings.maintenanceMode) {
      return res.status(503).json({
        success: false,
        message: "Server is undergoing maintenance. Please try again later.",
        maintenanceMode: true,
      });
    }
    next();
  } catch (error) {
    next();
  }
};
