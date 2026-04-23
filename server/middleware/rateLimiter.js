const rateLimit = require("express-rate-limit");

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30, // Increased from 10
  message: {
    success: false,
    message: "Too many login attempts. Please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const otpLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 15, // Increased from 5
  message: { success: false, message: "Too many OTP attempts." },
});

const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300, // Increased from 100
  message: { success: false, message: "Too many admin requests." },
});

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 1000, // Increased from 200
});

module.exports = { authLimiter, otpLimiter, adminLimiter, apiLimiter };

