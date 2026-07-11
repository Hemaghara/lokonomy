const logger = require("../utils/logger");

const globalErrorHandler = (err, req, res, next) => {
  logger.error({ err, url: req.url }, "Unhandled Application Error");

  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";

  if (err.name === "ValidationError") {
    statusCode = 400;
    message = Object.values(err.errors).map(val => val.message).join(", ");
  }
  if (err.code === 11000) {
    statusCode = 400;
    message = "Duplicate field value entered";
  }
  if (err.name === "CastError") {
    statusCode = 404;
    message = "Resource not found";
  }

  res.status(statusCode).json({
    success: false,
    message,
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
};

module.exports = globalErrorHandler;
