const express = require("express");
const router = express.Router();
const guaranteeController = require("../controllers/guaranteeController");
const auth = require("../middleware/authMiddleware");
const { protectAdmin } = require("../middleware/adminMiddleware");

router.post("/", auth, guaranteeController.fileClaim);
router.get("/my", auth, guaranteeController.getMyClaims);
router.get("/:id", auth, guaranteeController.getClaimStatus);
router.patch("/:id/resolve", protectAdmin, guaranteeController.updateClaimStatusByAdmin);

module.exports = router;
