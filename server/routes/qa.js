const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const {
  getQuestions,
  postQuestion,
  postAnswer,
  deleteQuestion,
  upvoteQuestion,
} = require("../controllers/qaController");

router.get("/:businessId", getQuestions);
router.post("/:businessId", auth, postQuestion);
router.post("/:businessId/:questionId/answer", auth, postAnswer);
router.delete("/:questionId", auth, deleteQuestion);
router.patch("/:questionId/upvote", auth, upvoteQuestion);

module.exports = router;
