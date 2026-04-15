const express = require("express");
const router = express.Router();
const ctrl = require("../../controllers/adminQAController");
const { protectAdmin } = require("../../middleware/adminMiddleware");

router.get("/qa", protectAdmin, ctrl.getAllQA);
router.delete("/qa/:id", protectAdmin, ctrl.deleteQuestion);
router.delete("/qa/:id/answer/:answerId", protectAdmin, ctrl.deleteAnswer);
router.patch("/qa/:id/pin", protectAdmin, ctrl.togglePinQA);

module.exports = router;
