const mongoose = require("mongoose");

const jobAlertSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  filters: {
    category: String,
    district: String,
    taluka: String,
    jobType: String,
    salaryMin: Number,
  },
  lastNotifiedAt: {
    type: Date,
    default: Date.now,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("JobAlert", jobAlertSchema);
