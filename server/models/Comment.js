const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema({
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  targetType: {
    type: String,
    enum: ["Feed", "Story"],
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  userName: {
    type: String,
    required: true,
  },
  userAvatar: {
    type: String,
  },
  text: {
    type: String,
    required: true,
    maxlength: 1000,
  },
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Comment",
    default: null,
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

commentSchema.index({ targetId: 1, targetType: 1, createdAt: -1 });
commentSchema.index({ parentId: 1, createdAt: 1 });

module.exports = mongoose.model("Comment", commentSchema);
