const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");
const logger = require("../utils/logger");

const protectAdmin = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer")) {
    return res.status(401).json({ message: "Not authorized, no token" });
  }

  try {
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_ADMIN_SECRET);

    req.admin = await Admin.findById(decoded.id).select("-password");
    if (!req.admin) {
      return res
        .status(401)
        .json({ message: "Not authorized, admin not found" });
    }
    if (req.admin.status !== "Active") {
      return res.status(403).json({ message: "Admin account is deactivated" });
    }
    return next();
  } catch (error) {
    logger.error({ err: error }, "Admin authorization failed");
    return res.status(401).json({ message: "Not authorized, token failed" });
  }
};

const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.admin || !roles.includes(req.admin.role)) {
      return res.status(403).json({
        message: `Role (${req.admin ? req.admin.role : "unknown"}) is not allowed to access this resource`,
      });
    }
    next();
  };
};

module.exports = { protectAdmin, authorizeRoles };
