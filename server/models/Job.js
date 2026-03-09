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
        appliedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true },
);

module.exports = mongoose.model("Job", jobSchema);
