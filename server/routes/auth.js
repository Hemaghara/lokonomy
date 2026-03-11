const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const auth = require("../middleware/authMiddleware");

router.post("/login", authController.login);
router.post("/verify-otp", authController.verifyOtp);
router.post("/register", authController.register);
router.get("/me", auth, authController.getMe);
router.put("/update-profile", auth, authController.updateProfile);


module.exports = router;
