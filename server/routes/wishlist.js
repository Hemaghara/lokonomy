const express = require("express");
const router = express.Router();
const wishlistController = require("../controllers/wishlistController");
const auth = require("../middleware/authMiddleware");

router.post("/toggle", auth, wishlistController.toggleWishlist);
router.get("/", auth, wishlistController.getWishlist);
router.get("/status/:type/:id", auth, wishlistController.checkWishlistStatus);

module.exports = router;
