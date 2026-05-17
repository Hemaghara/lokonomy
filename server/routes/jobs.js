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
router.get("/:id/similar", jobController.getSimilarJobs);
router.post("/:id/apply", auth, jobController.applyForJob);
router.delete("/:id/withdraw", auth, jobController.withdrawApplication);
router.put("/:id", auth, jobController.updateJob);
router.patch("/:id/status", auth, jobController.toggleJobStatus);
router.patch(
  "/:id/applications/:applicantId/status",
  auth,
  jobController.updateApplicationStatus,
);
router.patch(
  "/:id/applications/:applicantId/notes",
  auth,
  jobController.updateApplicationNotes,
);
router.delete("/:id", auth, jobController.deleteJob);

// Job Alerts
router.get("/user/alerts", auth, jobController.getUserAlerts);
router.post("/user/alerts", auth, jobController.createJobAlert);
router.delete("/user/alerts/:alertId", auth, jobController.deleteJobAlert);


module.exports = router;

