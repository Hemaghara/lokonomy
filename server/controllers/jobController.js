const Job = require("../models/Job");
const User = require("../models/User");
const Plan = require("../models/Plan");
const { uploadMedia } = require("../utils/uploadMedia");
const { createNotification } = require("./notificationController");
const logger = require("../utils/logger");
const JobAlert = require("../models/JobAlert");
const emailService = require("../utils/emailService");



exports.getAllJobs = async (req, res) => {
  try {
    const {
      state,
      district,
      taluka,
      gender,
      search,
      jobType,
      category,
      salaryMin,
      salaryMax,
      page = 1,
      limit = 12,
    } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let query = {};
    query.$or = [{ status: "Open" }, { status: { $exists: false } }];
    query.isFlagged = { $ne: true };
    query.isSuspended = { $ne: true };

    if (state) query.state = state;
    if (district) query.district = district;
    if (taluka) query.taluka = taluka;
    if (gender && gender !== "All") query.gender = gender;

    if (jobType && jobType !== "All") query.jobType = jobType;
    if (category && category !== "All") query.category = category;
    if (salaryMin) query.salaryMax = { $gte: parseInt(salaryMin) };
    if (salaryMax) query.salaryMin = { $lte: parseInt(salaryMax) };

    if (search) {
      query.$text = { $search: search };
    }


    const sort = search
      ? { score: { $meta: "textScore" } }
      : { createdAt: -1 };

    const [jobs, total] = await Promise.all([
      Job.find(query, search ? { score: { $meta: "textScore" } } : {})
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit)),
      Job.countDocuments(query),
    ]);


    const sanitizedJobs = jobs.map((job) => {
      const j = job.toObject();
      j.applicationCount = j.applications?.length || 0;
      j.applications = (j.applications || []).map((app) => ({
        candidateId: app.candidateId,
      }));
      return j;
    });

    res.json({
      jobs: sanitizedJobs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
        hasMore: skip + jobs.length < total,
      },
    });
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

    const {
      position, location, vacancies, education, state, district, 
      experience, skills, salary, gender, posterName, 
      posterEmail, posterContact, description, jobType, 
      category, taluka, deadline, salaryMin, salaryMax
    } = req.body;

    if (vacancies <= 0 || vacancies > 999) {
      return res.status(400).json({ success: false, message: "Vacancies must be between 1 and 999." });
    }
    if (salaryMin && salaryMax && Number(salaryMin) > Number(salaryMax)) {
      return res.status(400).json({ success: false, message: "Minimum salary cannot be greater than maximum salary." });
    }

    const jobData = {
      position, location, vacancies, education, state, district,
      experience, skills, salary, gender, posterName,
      posterEmail, posterContact, description, jobType,
      category, taluka, deadline, salaryMin, salaryMax,
      posterId: req.user.id
    };
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
    const job = await Job.findById(req.params.id);

    if (!job || job.isFlagged) {
      return res
        .status(404)
        .json({ message: "Job not found or has been removed." });
    }

    const viewerId = req.user?.id;
    if (!viewerId || viewerId !== job.posterId.toString()) {
      const today = new Date().toISOString().split("T")[0];
      const historyIndex = job.viewHistory ? job.viewHistory.findIndex((h) => h.date === today) : -1;
      let updateQuery;
      if (historyIndex !== -1) {
        updateQuery = { 
          $inc: { 
            views: 1, 
            [`viewHistory.${historyIndex}.count`]: 1 
          } 
        };
      } else {
        updateQuery = { 
          $inc: { views: 1 }, 
          $push: { viewHistory: { date: today, count: 1 } } 
        };
      }

      await Job.findByIdAndUpdate(job._id, updateQuery);

      job.views = (job.views || 0) + 1;
      if (historyIndex !== -1) {
        job.viewHistory[historyIndex].count += 1;
      } else {
        if (!job.viewHistory) job.viewHistory = [];
        job.viewHistory.push({ date: today, count: 1 });
      }
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

    const MAX_BASE64_LENGTH = Math.ceil((5 * 1024 * 1024 * 4) / 3);
    if (candidateBiodata && candidateBiodata.length > MAX_BASE64_LENGTH) {
      return res.status(400).json({ success: false, message: "Resume file exceeds the 5MB limit." });
    }
    if (candidateCertificate && candidateCertificate.length > MAX_BASE64_LENGTH) {
      return res.status(400).json({ success: false, message: "Certificate file exceeds the 5MB limit." });
    }

    // Bug #34: Check duplicate application before uploading media
    const duplicateCheck = await Job.findOne({
      _id: req.params.id,
      "applications.candidateId": req.user.id
    });
    if (duplicateCheck) {
      return res.status(400).json({
        success: false,
        message: "You have already applied for this job.",
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

    const newApplication = {
      candidateName,
      candidateEmail,
      candidateContact,
      candidateSkills,
      candidateExperience,
      candidateEducation,
      candidateBiodata: biodataUrl,
      candidateCertificate: certificateUrl,
      candidateId: req.user.id,
      appliedAt: new Date(),
    };

    const updatedJob = await Job.findOneAndUpdate(
      {
        _id: req.params.id,
        "applications.candidateId": { $ne: req.user.id },
      },
      {
        $push: { applications: newApplication },
      },
      { new: true }
    );

    if (!updatedJob) {
      return res.status(400).json({
        success: false,
        message: "You have already applied for this job or the job is no longer available.",
      });
    }

    try {
      await User.findByIdAndUpdate(req.user.id, {
        $set: {
          jobProfile: {
            contact: candidateContact,
            skills: candidateSkills,
            experience: candidateExperience,
            education: candidateEducation,
            biodata: biodataUrl,
            certificate: certificateUrl,
            updatedAt: new Date(),
          },
        },
      });
    } catch (profileErr) {
      logger.warn({ profileErr, userId: req.user.id }, "Failed to update user job profile");
    }

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

    const { deleteMedia } = require("../utils/uploadMedia");
    if (job.applications && job.applications.length > 0) {
      for (const app of job.applications) {
        if (app.candidateBiodata) await deleteMedia(app.candidateBiodata).catch(() => {});
        if (app.candidateCertificate) await deleteMedia(app.candidateCertificate).catch(() => {});
      }
    }
    await Job.findByIdAndDelete(req.params.id);
    await User.findByIdAndUpdate(req.user.id, {
      $inc: { "usage.jobsPosted": -1 },
    });
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
      "state",
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
      "category",
      "taluka",
    ];

    if (req.body.vacancies !== undefined && (req.body.vacancies <= 0 || req.body.vacancies > 999)) {
      return res.status(400).json({ success: false, message: "Vacancies must be between 1 and 999." });
    }
    const newSalaryMin = req.body.salaryMin !== undefined ? req.body.salaryMin : job.salaryMin;
    const newSalaryMax = req.body.salaryMax !== undefined ? req.body.salaryMax : job.salaryMax;
    if (newSalaryMin && newSalaryMax && Number(newSalaryMin) > Number(newSalaryMax)) {
      return res.status(400).json({ success: false, message: "Minimum salary cannot be greater than maximum salary." });
    }

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

    // Send email notification to applicant
    try {
      if (application.candidateEmail) {
        const { sendEmail } = emailService;
        if (sendEmail) {

          await sendEmail({
            to: application.candidateEmail,
            subject: `Application Update: ${job.position} — ${status}`,
            html: `<div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 540px; margin: 0 auto; padding: 32px; background: #0d1117; color: #e6edf3; border-radius: 16px;">
              <h2 style="color: #a78bfa; margin-bottom: 8px;">Application Status Update</h2>
              <p style="color: #8b949e; margin-bottom: 24px;">Hi ${application.candidateName},</p>
              <p>Your application for <strong style="color: #f0f6fc;">${job.position}</strong> has been updated:</p>
              <div style="background: #161b22; border: 1px solid #30363d; border-radius: 12px; padding: 16px; margin: 16px 0; text-align: center;">
                <span style="font-size: 18px; font-weight: 700; color: ${status === 'Selected' ? '#3fb950' : status === 'Rejected' ? '#f85149' : status === 'Interview' ? '#d29922' : '#79c0ff'};">${status}</span>
              </div>
              <p style="color: #8b949e; font-size: 13px;">Visit Lokonomy to view the full details of your application.</p>
              <p style="color: #484f58; font-size: 12px; margin-top: 24px;">— Team Lokonomy</p>
            </div>`,
          });
        }
      }
    } catch (emailErr) {
      logger.warn({ emailErr }, "Failed to send status update email");
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

exports.withdrawApplication = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ message: "Job not found" });

    const appIndex = job.applications.findIndex(
      (app) => app.candidateId?.toString() === req.user.id,
    );
    if (appIndex === -1) {
      return res
        .status(400)
        .json({ success: false, message: "No application found" });
    }

    const appStatus = job.applications[appIndex].applicationStatus;
    if (!["Applied", "Under Review"].includes(appStatus)) {
      return res.status(400).json({
        success: false,
        message: `Cannot withdraw. Application is already "${appStatus}".`,
      });
    }

    const appToWithdraw = job.applications[appIndex];
    const { deleteMedia } = require("../utils/uploadMedia");
    if (appToWithdraw.candidateBiodata) await deleteMedia(appToWithdraw.candidateBiodata).catch(() => {});
    if (appToWithdraw.candidateCertificate) await deleteMedia(appToWithdraw.candidateCertificate).catch(() => {});

    await Job.updateOne(
      { _id: job._id },
      { $pull: { applications: { candidateId: req.user.id } } }
    );

    logger.info(
      { jobId: job._id, userId: req.user.id },
      "Application withdrawn",
    );
    res.json({ success: true, message: "Application withdrawn successfully" });
  } catch (err) {
    logger.error(
      { err, jobId: req.params.id },
      "Error in withdrawApplication",
    );
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getSimilarJobs = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ message: "Job not found" });

    const similar = await Job.find({
      _id: { $ne: job._id },
      status: "Open",
      isFlagged: { $ne: true },
      isSuspended: { $ne: true },
      $or: [
        { district: job.district },
        { education: job.education },
        { category: job.category },
        { position: { $regex: job.position.split(" ")[0], $options: "i" } },
      ],
    })
      .sort({ createdAt: -1 })
      .limit(4)
      .select(
        "position location district salary gender jobType category vacancies views createdAt deadline",
      );

    res.json(similar);
  } catch (err) {
    logger.error({ err, jobId: req.params.id }, "Error in getSimilarJobs");
    res.status(500).json({ message: err.message });
  }
};

exports.updateApplicationNotes = async (req, res) => {
  try {
    const { id, applicantId } = req.params;
    const { notes } = req.body;

    const job = await Job.findById(id);
    if (!job) return res.status(404).json({ message: "Job not found" });

    if (job.posterId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const application = job.applications.id(applicantId);
    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    application.employerNotes = notes;
    await job.save();

    logger.info(
      { jobId: job._id, applicantId },
      "Application notes updated",
    );
    res.json({ success: true, message: "Notes updated successfully" });
  } catch (err) {
    logger.error(
      { err, jobId: req.params.id },
      "Error in updateApplicationNotes",
    );
    res.status(500).json({ success: false, message: err.message });
  }
};


exports.createJobAlert = async (req, res) => {
  try {
    const { category, district, taluka, jobType, salaryMin } = req.body;
    
    
    const existingCount = await JobAlert.countDocuments({ userId: req.user.id });
    if (existingCount >= 5) {
      return res.status(400).json({ 
        success: false, 
        message: "You can only have up to 5 job alerts. Please delete an old one." 
      });
    }

    const alert = new JobAlert({
      userId: req.user.id,
      filters: { category, district, taluka, jobType, salaryMin }
    });

    await alert.save();
    res.status(201).json({ success: true, message: "Job alert created successfully", alert });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getUserAlerts = async (req, res) => {
  try {
    const alerts = await JobAlert.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(alerts);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteJobAlert = async (req, res) => {
  try {
    const alert = await JobAlert.findOneAndDelete({ _id: req.params.alertId, userId: req.user.id });
    if (!alert) return res.status(404).json({ message: "Alert not found" });
    res.json({ success: true, message: "Alert deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

