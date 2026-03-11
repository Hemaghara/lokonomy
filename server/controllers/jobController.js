const Job = require("../models/Job");
const User = require("../models/User");
const { uploadToCloudinary } = require("../utils/cloudinary");

exports.getAllJobs = async (req, res) => {
  try {
    const { district, taluka, gender, search } = req.query;
    let query = {};

    query.$or = [{ status: "Open" }, { status: { $exists: false } }];

    if (district) {
      query.district = district;
    }
    if (taluka) {
      query.location = taluka;
    }
    if (gender && gender !== "All") {
      query.gender = gender;
    }
    if (search) {
      query.$and = [
        {
          $or: [
            { position: { $regex: search, $options: "i" } },
            { location: { $regex: search, $options: "i" } },
          ],
        },
      ];
    }
    const jobs = await Job.find(query).sort({ createdAt: -1 });
    res.json(jobs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createJob = async (req, res) => {
  try {
    const jobData = { ...req.body, posterId: req.user.id };
    const newJob = new Job(jobData);
    await newJob.save();

    await User.findByIdAndUpdate(req.user.id, {
      $inc: { "usage.jobsPosted": 1 },
    });

    res.status(201).json({
      success: true,
      message: "Job posted successfully",
      job: newJob,
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.getJobById = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }
    res.json(job);
  } catch (err) {
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
      biodataUrl = await uploadToCloudinary(candidateBiodata, "jobs/biodatas");
    }
    let certificateUrl = candidateCertificate;
    if (candidateCertificate && candidateCertificate.includes("base64")) {
      certificateUrl = await uploadToCloudinary(
        candidateCertificate,
        "jobs/certificates",
      );
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
    res
      .status(201)
      .json({ success: true, message: "Application submitted successfully" });
  } catch (err) {
    console.error("Error applying for job:", err);
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
      return res
        .status(403)
        .json({ message: "Not authorized to delete this job" });
    }

    await Job.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Job deleted successfully" });
  } catch (err) {
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
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        job[field] = req.body[field];
      }
    });

    await job.save();
    res.json({ success: true, message: "Job updated successfully", job });
  } catch (err) {
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
      return res
        .status(403)
        .json({ message: "Not authorized to update this job" });
    }

    job.status = job.status === "Open" ? "Closed" : "Open";
    await job.save();

    res.json({
      success: true,
      message: `Job marked as ${job.status}`,
      status: job.status,
    });
  } catch (err) {
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

    res.json({
      success: true,
      message: "Application status updated successfully",
    });
  } catch (err) {
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
        status: myApp?.applicationStatus || "Applied",
        appliedAt: myApp?.appliedAt,
        jobStatus: job.status || "Open",
      };
    });
    res.json(applications);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.toggleSaveJob = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const jobId = req.params.id;

    const index = user.savedJobs.indexOf(jobId);
    if (index > -1) {
      user.savedJobs.splice(index, 1);
      await user.save();
      return res.json({
        success: true,
        message: "Job removed from saved list",
        isSaved: false,
      });
    } else {
      user.savedJobs.push(jobId);
      await user.save();
      return res.json({
        success: true,
        message: "Job saved successfully",
        isSaved: true,
      });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getSavedJobs = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate("savedJobs");
    res.json(user.savedJobs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
