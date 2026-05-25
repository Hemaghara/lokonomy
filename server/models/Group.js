const mongoose = require("mongoose");

const groupSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  district: { type: String, required: true },
  taluka: { type: String },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  type: { type: String, enum: ["area", "interest", "business_association"], default: "area" },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Group", groupSchema);
