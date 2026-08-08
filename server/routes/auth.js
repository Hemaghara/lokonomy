const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const auth = require("../middleware/authMiddleware");
const { otpLimiter } = require("../middleware/rateLimiter");

const validateRequest = require("../middleware/validateRequest");
const {
  loginSchema,
  registerSchema,
  otpSchema,
  resendOtpSchema,
} = require("../validators/auth.schema");

router.post("/login", validateRequest(loginSchema), authController.login);
router.post("/register", validateRequest(registerSchema), authController.register);
router.post("/verify-otp", otpLimiter, validateRequest(otpSchema), authController.verifyOtp);
router.post("/resend-otp", otpLimiter, validateRequest(resendOtpSchema), authController.resendOtp);
router.post("/refresh", authController.refresh);
router.post("/logout", auth, authController.logout);
router.get("/me", auth, authController.getMe);

router.put("/update-profile", auth, authController.updateProfile);

module.exports = router;
