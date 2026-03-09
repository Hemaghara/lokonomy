const express = require("express");
const router = express.Router();
const jobController = require("../controllers/jobController");
const auth = require("../middleware/authMiddleware");

router.get("/", jobController.getAllJobs);
router.get("/my", auth, jobController.getMyJobs);
router.post("/", auth, jobController.createJob);
router.get("/:id", jobController.getJobById);
router.post("/:id/apply", auth, jobController.applyForJob);
router.put("/:id", auth, jobController.updateJob);
router.patch("/:id/status", auth, jobController.toggleJobStatus);
router.delete("/:id", auth, jobController.deleteJob);

module.exports = router;
