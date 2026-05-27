const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const aiController = require("../controllers/aiController");

router.post("/generate-description", auth, aiController.generateDescription);
router.post("/local-guide", auth, aiController.askLocalGuide);

module.exports = router;
