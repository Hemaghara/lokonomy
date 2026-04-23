const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const auth = require("../middleware/authMiddleware");

const {
  validateLogin,
  validateRegister,
  validateOtp,
} = require("../middleware/validators/authValidator");

router.post("/login", validateLogin, authController.login);
router.post("/register", validateRegister, authController.register);
router.post("/verify-otp", validateOtp, authController.verifyOtp);
router.post("/refresh", authController.refresh);
router.get("/me", auth, authController.getMe);

router.put("/update-profile", auth, authController.updateProfile);

module.exports = router;
