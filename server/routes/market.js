const express = require("express");
const router = express.Router();
const marketController = require("../controllers/marketController");
const auth = require("../middleware/authMiddleware");
const { checkProductLimit } = require("../middleware/subscriptionMiddleware");

router.get("/", marketController.getAllProducts);
router.get("/my", auth, marketController.getMyProducts);
router.get("/:id", marketController.getProductById);
router.post("/", auth, checkProductLimit, marketController.addProduct);
router.delete("/:id", auth, marketController.deleteProduct);

module.exports = router;
