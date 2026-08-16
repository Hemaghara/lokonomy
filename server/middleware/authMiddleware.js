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

    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ message: "Token is not valid" });
    }
    if (decoded.user) {
      req.user = decoded.user;
    } else if (decoded.id) {
      req.user = { id: decoded.id };
    } else {
      return res.status(401).json({ message: "Invalid token structure" });
    }

    // Flag impersonation sessions so sensitive routes can block them
    if (decoded.isImpersonation) {
      req.isImpersonation = true;
      req.impersonatedBy = decoded.impersonatedBy;
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(401).json({ message: "User not found, authorization denied" });
    }
    if (user.status && user.status !== "active") {
      return res.status(403).json({
        message: "Your account is " + user.status + ". Access denied.",
        status: user.status
      });
    }
    req.userDoc = user;

    next();
  } catch (err) {
    res.status(401).json({ message: "Token is not valid" });
  }
};
