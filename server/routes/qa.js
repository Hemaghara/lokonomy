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
const validateRequest = require("../middleware/validateRequest");
const { createCommentSchema } = require("../validators/social.schema");

router.get("/:businessId", getQuestions);
// Note: We're reusing the generic comment schema since Q&A essentially acts like a comment system
router.post("/:businessId", auth, validateRequest(createCommentSchema), postQuestion);
router.post("/:businessId/:questionId/answer", auth, postAnswer);
router.delete("/:questionId", auth, deleteQuestion);
router.patch("/:questionId/upvote", auth, upvoteQuestion);

module.exports = router;
