const mongoose = require("mongoose");

const replySchema = new mongoose.Schema({
  sender: { type: String, enum: ["user", "admin"], required: true },
  senderName: { type: String, required: true },
  senderId: { type: mongoose.Schema.Types.ObjectId, refPath: "senderModel" },
  message: { type: String, required: true, trim: true },
  createdAt: { type: Date, default: Date.now },
});

const supportTicketSchema = new mongoose.Schema(
  {
    ticketNumber: { type: String, unique: true },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    userName: { type: String, required: true },
    userEmail: { type: String, required: true },
    subject: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ["technical", "billing", "account", "order", "other"],
      default: "other",
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    status: {
      type: String,
      enum: ["open", "in_progress", "resolved", "closed"],
      default: "open",
    },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
    assignedToName: { type: String },
    replies: [replySchema],
    resolvedAt: { type: Date },
    closedAt: { type: Date },
  },
  { timestamps: true },
);
supportTicketSchema.pre("save", async function (next) {
  if (!this.ticketNumber) {
    const count = await mongoose.model("SupportTicket").countDocuments();
    this.ticketNumber = `TKT-${String(count + 1).padStart(5, "0")}`;
  }
  next();
});

module.exports = mongoose.model("SupportTicket", supportTicketSchema);
