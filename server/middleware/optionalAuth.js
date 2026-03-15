const jwt = require("jsonwebtoken");

// Optional auth: sets req.user if token is present, but doesn't block the request if no token
module.exports = function (req, res, next) {
  const authHeader = req.header("Authorization");

  if (!authHeader) {
    req.user = null;
    return next();
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret");
    req.user = decoded.user;
  } catch (err) {
    req.user = null;
  }

  next();
};
