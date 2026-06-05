const Settings = require("../models/Settings");

let maintenanceCache = null;
let cacheTime = 0;
const CACHE_TTL = 30000; // 30 seconds

module.exports = async (req, res, next) => {
  try {
    // Skip check for admin routes or root wake up URL
    if (req.path.startsWith("/api/admin") || req.path === "/") {
      return next();
    }
    
    const now = Date.now();
    if (!maintenanceCache || now - cacheTime > CACHE_TTL) {
      maintenanceCache = await Settings.findOne().lean();
      cacheTime = now;
    }

    if (maintenanceCache && maintenanceCache.maintenanceMode) {
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
