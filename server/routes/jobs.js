const express = require("express");
const router = express.Router();
const jobController = require("../controllers/jobController");
const auth = require("../middleware/authMiddleware");
const { checkJobLimit } = require("../middleware/subscriptionMiddleware");

router.get("/", jobController.getAllJobs);
router.get("/applied", auth, jobController.getAppliedJobs);
router.get("/my", auth, jobController.getMyJobs);
router.post("/", auth, checkJobLimit, jobController.createJob);
router.get("/:id", jobController.getJobById);
router.post("/:id/apply", auth, jobController.applyForJob);
router.put("/:id", auth, jobController.updateJob);
router.patch("/:id/status", auth, jobController.toggleJobStatus);
router.patch(
  "/:id/applications/:applicantId/status",
  auth,
  jobController.updateApplicationStatus,
);
router.delete("/:id", auth, jobController.deleteJob);

module.exports = router;
