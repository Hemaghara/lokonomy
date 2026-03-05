const Job = require("../models/Job");
const { uploadToCloudinary } = require("../utils/cloudinary");

exports.getAllJobs = async (req, res) => {
  try {
    const { district, taluka, gender, search } = req.query;
    let query = {};
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
      query.$or = [
        { position: { $regex: search, $options: "i" } },
        { location: { $regex: search, $options: "i" } },
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
