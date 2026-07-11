const Job = require("../models/Job");
const User = require("../models/User");
const Plan = require("../models/Plan");

exports.getAllJobs = async (req, res) => {
  try {
    const { status, search, education, page = 1, limit = 6 } = req.query;
    let query = {};

    if (status === "open") query.status = "Open";
    else if (status === "closed") query.status = "Closed";
    else if (status === "banned") query.isFlagged = true;
    else if (status === "suspended") query.isSuspended = true;

    if (education) {
      query.education = education;
    }

    if (search) {
      query.$or = [
        { position: { $regex: search, $options: "i" } },
        { location: { $regex: search, $options: "i" } },
        { posterName: { $regex: search, $options: "i" } },
        { district: { $regex: search, $options: "i" } },
      ];
    }

    const currentPage = parseInt(page);
    const pageLimit = parseInt(limit);
    const skip = (currentPage - 1) * pageLimit;

    const totalJobs = await Job.countDocuments(query);
    const totalPages = Math.ceil(totalJobs / pageLimit);

    const jobs = await Job.find(query)
      .populate("posterId", "name email subscription usage")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageLimit);

    res.json({
      jobs,
      currentPage,
      totalPages,
      totalJobs,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.getJobStats = async (req, res) => {
  try {
    const totalJobs = await Job.countDocuments();
    const openJobs = await Job.countDocuments({
      status: "Open",
      isFlagged: { $ne: true },
      isSuspended: { $ne: true },
    });
    const closedJobs = await Job.countDocuments({ status: "Closed" });
    const bannedJobs = await Job.countDocuments({ isFlagged: true });
    const suspendedJobs = await Job.countDocuments({ isSuspended: true });

    const totalApplications = await Job.aggregate([
      { $project: { appCount: { $size: "$applications" } } },
      { $group: { _id: null, total: { $sum: "$appCount" } } },
    ]);

    res.json({
      totalJobs,
      openJobs,
      closedJobs,
      bannedJobs,
      suspendedJobs,
      totalApplications: totalApplications[0]?.total || 0,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.getJobDetails = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id).populate(
      "posterId",
      "name email phoneNumber subscription usage district taluka",
    );

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    res.json(job);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.toggleFlagJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    job.isFlagged = !job.isFlagged;
    await job.save();

    res.json({
      message: `Job ${job.isFlagged ? "banned" : "unbanned"} successfully`,
      isFlagged: job.isFlagged,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.toggleSuspendJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    job.isSuspended = !job.isSuspended;
    await job.save();

    res.json({
      message: `Job ${job.isSuspended ? "suspended" : "activated"} successfully`,
      isSuspended: job.isSuspended,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.bulkFlagJobs = async (req, res) => {
  try {
    const { jobIds, isFlagged } = req.body;
    if (!Array.isArray(jobIds) || jobIds.length === 0) {
      return res.status(400).json({ message: "No job IDs provided" });
    }

    await Job.updateMany({ _id: { $in: jobIds } }, { $set: { isFlagged } });

    res.json({ message: `${jobIds.length} jobs ${isFlagged ? "banned" : "unbanned"} successfully` });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.bulkSuspendJobs = async (req, res) => {
  try {
    const { jobIds, isSuspended } = req.body;
    if (!Array.isArray(jobIds) || jobIds.length === 0) {
      return res.status(400).json({ message: "No job IDs provided" });
    }

    await Job.updateMany({ _id: { $in: jobIds } }, { $set: { isSuspended } });

    res.json({ message: `${jobIds.length} jobs ${isSuspended ? "suspended" : "activated"} successfully` });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.getJobPosterUsage = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select(
      "name email subscription usage",
    );
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const planSlug = user.subscription?.plan || "free";
    const plan = await Plan.findOne({ slug: planSlug });

    const jobsPosted = user.usage?.jobsPosted || 0;
    const jobsLimit = plan?.limits?.jobsPost || 0;

    res.json({
      user: {
        name: user.name,
        email: user.email,
        plan: planSlug,
        subscriptionStatus: user.subscription?.status || "none",
      },
      usage: {
        jobsPosted,
        jobsLimit,
        remaining: Math.max(0, jobsLimit - jobsPosted),
        percentUsed:
          jobsLimit > 0 ? Math.round((jobsPosted / jobsLimit) * 100) : 0,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
