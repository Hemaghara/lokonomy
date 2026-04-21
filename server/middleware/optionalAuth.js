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
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "lokonomy_secret_key_123");
    
    // Support both user and admin payload structures
    if (decoded.user) {
      req.user = decoded.user;
    } else if (decoded.id) {
      req.user = { id: decoded.id };
    }
    
    next();
  } catch (err) {
    req.user = null;
    next();
  }
};
