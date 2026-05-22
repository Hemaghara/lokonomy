const rateLimit = require("express-rate-limit");

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: {
    success: false,
    message: "Too many login attempts. Please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const otpLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 15,
  message: { success: false, message: "Too many OTP attempts." },
});

const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: { success: false, message: "Too many admin requests." },
});

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 1000,
});

const feedLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { success: false, message: "Too many feeds created. Please try again later." },
});

module.exports = { authLimiter, otpLimiter, adminLimiter, apiLimiter, feedLimiter };
