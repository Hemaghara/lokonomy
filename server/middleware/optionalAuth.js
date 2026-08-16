const jwt = require("jsonwebtoken");

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
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.user) {
      req.user = decoded.user;
    } else if (decoded.id) {
      req.user = { id: decoded.id };
    }
    next();
  } catch (err) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_ADMIN_SECRET);
      req.user = { id: decoded.id, isAdmin: true };
      next();
    } catch (err2) {
      req.user = null;
      next();
    }
  }
};
