const jwt = require("jsonwebtoken");
const User = require("../models/User");

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
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret");
    req.user = decoded.user;

    const user = await User.findById(req.user.id).select("status");
    if (user && user.status && user.status !== "active") {
      return res.status(403).json({ 
        message: "Your account is " + user.status + ". Access denied.",
        status: user.status
      });
    }

    next();
  } catch (err) {
    res.status(401).json({ message: "Token is not valid" });
  }
};
