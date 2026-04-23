const Job = require("../models/Job");
const User = require("../models/User");
const Plan = require("../models/Plan");
const { uploadMedia } = require("../utils/uploadMedia");
const { createNotification } = require("./notificationController");
const logger = require("../utils/logger");

exports.getAllJobs = async (req, res) => {
  try {
    const { district, taluka, gender, search, jobType } = req.query;
    let query = {};
    query.$or = [{ status: "Open" }, { status: { $exists: false } }];
    query.isFlagged = { $ne: true };
    query.isSuspended = { $ne: true };

    if (district) query.district = district;
    if (taluka) query.location = taluka;
    if (gender && gender !== "All") query.gender = gender;
    if (jobType && jobType !== "All") query.jobType = jobType;

    if (search) {
      query.$and = [
        {
          $or: [
            { position: { $regex: search, $options: "i" } },
            { location: { $regex: search, $options: "i" } },
            { skills: { $regex: search, $options: "i" } },
          ],
        },
      ];
    }
    const jobs = await Job.find(query).sort({ createdAt: -1 });
    res.json(jobs);
  } catch (err) {
    logger.error({ err }, "Error in getAllJobs");
    res.status(500).json({ message: err.message });
  }
};

exports.createJob = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const planSlug = user.subscription?.plan || "free";
    const plan = await Plan.findOne({ slug: planSlug });
    const jobsLimit = plan?.limits?.jobsPosted || 0;
    const currentPosted = user.usage?.jobsPosted || 0;

    if (currentPosted >= jobsLimit) {
      logger.warn(
        { userId: req.user.id, planSlug, jobsLimit },
        "Job posting limit reached",
      );
      return res.status(403).json({
        success: false,
        message: `Job posting limit reached for ${planSlug} plan (${jobsLimit} jobs max). Please upgrade your plan.`,
      });
    }

    const jobData = { ...req.body, posterId: req.user.id };
    const newJob = new Job(jobData);
    await newJob.save();

    await User.findByIdAndUpdate(req.user.id, {
      $inc: { "usage.jobsPosted": 1 },
    });

    logger.info(
      { jobId: newJob._id, userId: req.user.id },
      "Job posted successfully",
    );
    res.status(201).json({
      success: true,
      message: "Job posted successfully",
      job: newJob,
    });
  } catch (err) {
    logger.error({ err }, "Error in createJob");
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.getJobById = async (req, res) => {
  try {
    const job = await Job.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: true },
    );

    if (!job || job.isFlagged) {
      return res
        .status(404)
        .json({ message: "Job not found or has been removed." });
    }
    res.json(job);
  } catch (err) {
    logger.error({ err, jobId: req.params.id }, "Error in getJobById");
    res.status(500).json({ message: err.message });
  }
};
exports.applyForJob = async (req, res) => {
  try {
    const {
      candidateName,
      candidateEmail,
      candidateContact,
      candidateSkills,
      candidateExperience,
      candidateEducation,
      candidateBiodata,
      candidateCertificate,
    } = req.body;
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    const alreadyApplied = job.applications.find(
      (app) => app.candidateId && app.candidateId.toString() === req.user.id,
    );

    if (alreadyApplied) {
      return res.status(400).json({
        success: false,
        message: "You have already applied for this job",
      });
    }
    let biodataUrl = candidateBiodata;

    if (candidateBiodata && candidateBiodata.includes("base64")) {
      const uploadResult = await uploadMedia(candidateBiodata, "jobs/biodatas");
      biodataUrl = uploadResult.secure_url;
    }
    let certificateUrl = candidateCertificate;
    if (candidateCertificate && candidateCertificate.includes("base64")) {
      const uploadResult = await uploadMedia(
        candidateCertificate,
        "jobs/certificates",
      );
      certificateUrl = uploadResult.secure_url;
    }

    job.applications.push({
      candidateName,
      candidateEmail,
      candidateContact,
      candidateSkills,
      candidateExperience,
      candidateEducation,
      candidateBiodata: biodataUrl,
      candidateCertificate: certificateUrl,
      candidateId: req.user.id,
    });

    await job.save();

    const io = req.app.get("io");
    await createNotification({
      recipientId: job.posterId,
      type: "job_application",
      title: "New Job Application",
      message: `${candidateName} applied for your ${job.position} position.`,
      actionUrl: `/job-dashboard`,
      metadata: { jobId: job._id, applicantName: candidateName },
      io,
    });

    logger.info(
      { jobId: job._id, userId: req.user.id },
      "Job application submitted",
    );
    res
      .status(201)
      .json({ success: true, message: "Application submitted successfully" });
  } catch (err) {
    logger.error(
      { err, jobId: req.params.id, userId: req.user.id },
      "Error applying for job",
    );
    res.status(500).json({ message: err.message });
  }
};

exports.getMyJobs = async (req, res) => {
  try {
    const jobs = await Job.find({ posterId: req.user.id }).sort({
      createdAt: -1,
    });
    res.json(jobs);
  } catch (err) {
    logger.error({ err, userId: req.user.id }, "Error in getMyJobs");
    res.status(500).json({ message: err.message });
  }
};

exports.deleteJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }
    if (job.posterId.toString() !== req.user.id) {
      logger.warn(
        { jobId: req.params.id, userId: req.user.id },
        "Unauthorized job deletion attempt",
      );
      return res
        .status(403)
        .json({ message: "Not authorized to delete this job" });
    }

    await Job.findByIdAndDelete(req.params.id);
    logger.info(
      { jobId: req.params.id, userId: req.user.id },
      "Job deleted successfully",
    );
    res.json({ success: true, message: "Job deleted successfully" });
  } catch (err) {
    logger.error({ err, jobId: req.params.id }, "Error in deleteJob");
    res.status(500).json({ message: err.message });
  }
};

exports.updateJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }
    if (job.posterId.toString() !== req.user.id) {
      logger.warn(
        { jobId: req.params.id, userId: req.user.id },
        "Unauthorized job update attempt",
      );
      return res
        .status(403)
        .json({ message: "Not authorized to update this job" });
    }

    const allowedFields = [
      "position",
      "location",
      "vacancies",
      "education",
      "district",
      "experience",
      "skills",
      "salary",
      "gender",
      "posterName",
      "posterEmail",
      "posterContact",
      "status",
      "description",
      "jobType",
      "deadline",
      "salaryMin",
      "salaryMax",
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        job[field] = req.body[field];
      }
    });

    await job.save();
    logger.info(
      { jobId: job._id, userId: req.user.id },
      "Job updated successfully",
    );
    res.json({ success: true, message: "Job updated successfully", job });
  } catch (err) {
    logger.error({ err, jobId: req.params.id }, "Error in updateJob");
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.toggleJobStatus = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }
    if (job.posterId.toString() !== req.user.id) {
      logger.warn(
        { jobId: req.params.id, userId: req.user.id },
        "Unauthorized job toggle attempt",
      );
      return res
        .status(403)
        .json({ message: "Not authorized to update this job" });
    }

    job.status = job.status === "Open" ? "Closed" : "Open";
    await job.save();

    logger.info({ jobId: job._id, status: job.status }, "Job status toggled");
    res.json({
      success: true,
      message: `Job marked as ${job.status}`,
      status: job.status,
    });
  } catch (err) {
    logger.error({ err, jobId: req.params.id }, "Error in toggleJobStatus");
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateApplicationStatus = async (req, res) => {
  try {
    const { id, applicantId } = req.params;
    const { status } = req.body;

    const job = await Job.findById(id);
    if (!job) return res.status(404).json({ message: "Job not found" });

    if (job.posterId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const application = job.applications.id(applicantId);
    if (!application)
      return res.status(404).json({ message: "Application not found" });

    application.applicationStatus = status;
    await job.save();

    if (application.candidateId) {
      const io = req.app.get("io");
      await createNotification({
        recipientId: application.candidateId.toString(),
        type: "job_application",
        title: `Application ${status}`,
        message: `Your application for ${job.position} has been ${status.toLowerCase()}.`,
        actionUrl: `/jobs/${job._id}`,
        metadata: { jobId: job._id, status },
        io,
      });
    }

    logger.info(
      { jobId: job._id, applicantId, status },
      "Application status updated",
    );
    res.json({
      success: true,
      message: "Application status updated successfully",
    });
  } catch (err) {
    logger.error(
      { err, jobId: req.params.id },
      "Error in updateApplicationStatus",
    );
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getAppliedJobs = async (req, res) => {
  try {
    const jobs = await Job.find({ "applications.candidateId": req.user.id });
    const applications = jobs.map((job) => {
      const myApp = job.applications.find(
        (app) => app.candidateId?.toString() === req.user.id,
      );
      return {
        jobId: job._id,
        position: job.position,
        location: job.location,
        district: job.district,
        salary: job.salary,
        jobType: job.jobType || "Full-time",
        status: myApp?.applicationStatus || "Applied",
        appliedAt: myApp?.appliedAt,
        applicationId: myApp?._id,
        jobStatus: job.status || "Open",
        posterName: job.posterName,
      };
    });
    res.json(applications);
  } catch (err) {
    logger.error({ err, userId: req.user.id }, "Error in getAppliedJobs");
    res.status(500).json({ message: err.message });
  }
};
