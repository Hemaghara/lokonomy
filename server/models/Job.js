const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema(
  {
    position: {
      type: String,
      required: true,
    },
    location: {
      type: String,
      required: true,
    },
    vacancies: {
      type: Number,
      required: true,
    },
    education: {
      type: String,
      enum: ["10th pass", "12th pass", "Graduate", "Post Graduate"],
      required: true,
    },
    district: {
      type: String,
      required: true,
    },
    experience: {
      type: String,
      required: true,
    },
    skills: {
      type: String,
      required: true,
    },
    salary: {
      type: String,
      required: true,
    },
    gender: {
      type: String,
      enum: ["Male", "Female", "Both"],
      required: true,
    },
    posterName: {
      type: String,
      required: true,
    },
    posterEmail: {
      type: String,
      required: true,
    },
    posterContact: {
      type: String,
      required: true,
    },
    posterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    isFlagged: {
      type: Boolean,
      default: false,
    },
    isSuspended: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ["Open", "Closed"],
      default: "Open",
    },
    applications: [
      {
        candidateName: { type: String, required: true },
        candidateEmail: { type: String, required: true },
        candidateContact: { type: String, required: true },
        candidateSkills: { type: String },
        candidateExperience: { type: String },
        candidateEducation: { type: String },
        candidateBiodata: { type: String },
        candidateCertificate: { type: String },
        candidateId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        applicationStatus: {
          type: String,
          enum: [
            "Applied",
            "Under Review",
            "Interview",
            "Selected",
            "Rejected",
          ],
          default: "Applied",
        },
        appliedAt: { type: Date, default: Date.now },
      },
    ],
    description: {
      type: String,
      default: "",
    },
    jobType: {
      type: String,
      enum: ["Full-time", "Part-time", "Freelance", "Contract"],
      default: "Full-time",
    },
    deadline: {
      type: Date,
      default: null,
    },
    salaryMin: {
      type: Number,
      default: null,
    },
    salaryMax: {
      type: Number,
      default: null,
    },
    views: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true },
);

jobSchema.index({ isFlagged: 1, isSuspended: 1, status: 1 });

module.exports = mongoose.model("Job", jobSchema);
