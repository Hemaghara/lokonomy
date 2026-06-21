const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const auth = require("../middleware/authMiddleware");
const { otpLimiter } = require("../middleware/rateLimiter");

const {
  validateLogin,
  validateRegister,
  validateOtp,
  validateResendOtp,
} = require("../middleware/validators/authValidator");

router.post("/login", validateLogin, authController.login);
router.post("/register", validateRegister, authController.register);
router.post("/verify-otp", otpLimiter, validateOtp, authController.verifyOtp);
router.post("/resend-otp", validateResendOtp, authController.resendOtp);
router.post("/refresh", authController.refresh);
router.post("/logout", auth, authController.logout);
router.get("/me", auth, authController.getMe);

router.put("/update-profile", auth, authController.updateProfile);

module.exports = router;
