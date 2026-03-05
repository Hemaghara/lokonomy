const express = require("express");
const router = express.Router();
const marketController = require("../controllers/marketController");
const auth = require("../middleware/authMiddleware");

router.get("/", marketController.getAllProducts);
router.get("/my", auth, marketController.getMyProducts);
router.get("/:id", marketController.getProductById);
router.post("/", auth, marketController.addProduct);
router.delete("/:id", auth, marketController.deleteProduct);

module.exports = router;
