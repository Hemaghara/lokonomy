const validateUserStatusUpdate = (req, res, next) => {
  const { status } = req.body;
  const allowed = ["active", "suspended", "banned"];
  if (!status || !allowed.includes(status)) {
    return res.status(400).json({
      success: false,
      message: `Status must be one of: ${allowed.join(", ")}`,
    });
  }
  next();
};

const validateBulkStatusUpdate = (req, res, next) => {
  const { ids, status } = req.body;
  const allowed = ["active", "suspended", "banned"];

  if (!Array.isArray(ids) || ids.length === 0) {
    return res
      .status(400)
      .json({ success: false, message: "ids must be non-empty array" });
  }
  if (ids.length > 100) {
    return res
      .status(400)
      .json({
        success: false,
        message: "Cannot update more than 100 users at once",
      });
  }
  if (!status || !allowed.includes(status)) {
    return res.status(400).json({ success: false, message: `Invalid status` });
  }
  next();
};

module.exports = { validateUserStatusUpdate, validateBulkStatusUpdate };
