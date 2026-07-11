const express = require("express");
const router = express.Router();
const adminJobController = require("../../controllers/adminJobController");
const { protectAdmin } = require("../../middleware/adminMiddleware");

router.get("/jobs/stats", protectAdmin, adminJobController.getJobStats);
router.get("/jobs", protectAdmin, adminJobController.getAllJobs);
router.patch("/jobs/bulk/ban", protectAdmin, adminJobController.bulkFlagJobs);
router.patch("/jobs/bulk/suspend", protectAdmin, adminJobController.bulkSuspendJobs);
router.get("/jobs/:id", protectAdmin, adminJobController.getJobDetails);
router.patch("/jobs/:id/ban", protectAdmin, adminJobController.toggleFlagJob);
router.patch(
  "/jobs/:id/suspend",
  protectAdmin,
  adminJobController.toggleSuspendJob,
);
router.get(
  "/jobs/user/:userId/usage",
  protectAdmin,
  adminJobController.getJobPosterUsage,
);

module.exports = router;
