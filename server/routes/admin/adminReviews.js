const express = require("express");
const router = express.Router();
const {
  getAllBusinessReviews,
  getAllProductReviews,
  deleteBusinessReview,
  deleteProductReview,
  getBusinessReviewAnalytics,
} = require("../../controllers/adminReviewController");


const { protectAdmin } = require("../../middleware/adminMiddleware");

router.get("/reviews/business", protectAdmin, getAllBusinessReviews);
router.get("/reviews/product", protectAdmin, getAllProductReviews);
router.delete("/reviews/business/:businessId/:reviewId", protectAdmin, deleteBusinessReview);
router.delete("/reviews/product/:productId/:reviewId", protectAdmin, deleteProductReview);
router.get("/reviews/analytics/:businessId", protectAdmin, getBusinessReviewAnalytics);

module.exports = router;
