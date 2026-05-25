const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Admin = require("../models/Admin");

module.exports = async function (req, res, next) {
  const authHeader = req.header("Authorization");

  if (!authHeader) {
    return res.status(401).json({ message: "No token, authorization denied" });
  }
  const token = authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "No token, authorization denied" });
  }
  try {
    let decoded;
    let isAdmin = false;

    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      try {
        decoded = jwt.verify(token, process.env.JWT_ADMIN_SECRET);
        isAdmin = true;
      } catch (adminErr) {
        return res.status(401).json({ message: "Token is not valid" });
      }
    }
    
    // Support both user payload { user: { id } } and admin payload { id }
    if (decoded.user) {
      req.user = decoded.user;
    } else if (decoded.id) {
      req.user = { id: decoded.id, isAdmin };
    } else {
      return res.status(401).json({ message: "Invalid token structure" });
    }

    if (req.user.isAdmin) {
      const admin = await Admin.findById(req.user.id);
      if (!admin) {
        return res.status(401).json({ message: "Not authorized, admin not found" });
      }
    } else {
      const user = await User.findById(req.user.id).select("status");
      if (user && user.status && user.status !== "active") {
        return res.status(403).json({ 
          message: "Your account is " + user.status + ". Access denied.",
          status: user.status
        });
      }
    }

    next();
  } catch (err) {
    res.status(401).json({ message: "Token is not valid" });
  }
};
