const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  chatRoom: {
    type: String,
    required: true,
    index: true,
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  receiverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  senderName: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
    trim: true,
  },
  read: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

messageSchema.index({ senderId: 1, receiverId: 1 });
messageSchema.index({ receiverId: 1, read: 1 });

module.exports = mongoose.model("Message", messageSchema);
