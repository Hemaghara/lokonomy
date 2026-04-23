const sanitizeInput = (obj) => {
  if (typeof obj !== "object" || obj === null) return obj;

  for (const key in obj) {
    if (typeof obj[key] === "string") {
      obj[key] = obj[key].replace(/\$|\{|\}/g, "");
      obj[key] = obj[key].replace(/</g, "&lt;").replace(/>/g, "&gt;");
    } else if (typeof obj[key] === "object") {
      for (const innerKey in obj[key]) {
        if (innerKey.startsWith("$")) {
          delete obj[key][innerKey];
        }
      }
      sanitizeInput(obj[key]);
    }
  }
  return obj;
};

const sanitizeMiddleware = (req, res, next) => {
  if (req.body) req.body = sanitizeInput(req.body);
  if (req.query) req.query = sanitizeInput(req.query);
  if (req.params) req.params = sanitizeInput(req.params);
  next();
};

module.exports = sanitizeMiddleware;
