const express = require("express");
const router = express.Router();
const marketController = require("../controllers/marketController");
const auth = require("../middleware/authMiddleware");
const { checkProductLimit } = require("../middleware/subscriptionMiddleware");
const validateRequest = require("../middleware/validateRequest");
const {
  createProductSchema,
  updateProductSchema,
} = require("../validators/market.schema");

router.get("/", marketController.getAllProducts);
router.get("/my", auth, marketController.getMyProducts);
router.get("/:id/reviews", marketController.getProductReviews);
router.get("/:id", marketController.getProductById);
router.post("/", auth, checkProductLimit, validateRequest(createProductSchema), marketController.addProduct);
router.delete("/:id", auth, marketController.deleteProduct);
router.post("/:id/review", auth, marketController.addProductReview);
router.post("/:id/bid", auth, marketController.placeBid);

module.exports = router;
