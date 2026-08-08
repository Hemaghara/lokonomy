const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const groupController = require("../controllers/groupController");
const validateRequest = require("../middleware/validateRequest");
const { createGroupSchema } = require("../validators/social.schema");

router.post("/", auth, validateRequest(createGroupSchema), groupController.createGroup);
router.get("/", groupController.getGroups);
router.get("/:id", groupController.getGroupDetails);
router.post("/:id/join", auth, groupController.joinGroup);
router.post("/:id/leave", auth, groupController.leaveGroup);
router.post("/:id/posts", auth, groupController.createPost);
router.post("/posts/:id/like", auth, groupController.likePost);
router.post("/posts/:id/comments", auth, groupController.addComment);

module.exports = router;
