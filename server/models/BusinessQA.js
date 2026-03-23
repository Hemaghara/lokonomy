const mongoose = require("mongoose");

const answerSchema = new mongoose.Schema(
  {
    answeredBy: { type: String },
    answeredByName: { type: String, required: true },
    isOwner: { type: Boolean, default: false },
    answer: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

const businessQASchema = new mongoose.Schema(
  {
    businessId: { type: String, required: true },
    question: { type: String, required: true, trim: true },
    askedBy: { type: String, required: true },
    askedByName: { type: String, required: true },
    upvotes: [{ type: String }],
    answers: [answerSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model("BusinessQA", businessQASchema);
