const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const adminSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    role: {
      type: String,
      enum: ["superadmin", "admin", "Content Moderator", "Support Agent", "Finance Manager"],
      default: "admin",
    },
    permissions: [{
      type: String,
      enum: ["Users", "Reports", "Transactions", "Content", "Support", "Finance", "Marketplace", "Analytics & Reports", "User Management", "Support System"],
    }],
    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },
    lastActive: {
      type: Date,
      default: Date.now,
    },
    lastLogin: {
      type: Date,
    },
  },
  { timestamps: true }
);

adminSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

adminSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("Admin", adminSchema);
