const logger = require("../utils/logger");

const globalErrorHandler = (err, req, res, next) => {
  logger.error({ err, url: req.url }, "Unhandled Application Error");

  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  res.status(statusCode).json({
    success: false,
    message,
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
};

module.exports = globalErrorHandler;
