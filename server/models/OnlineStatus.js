const mongoose = require("mongoose");

const onlineStatusSchema = new mongoose.Schema({
  count: {
    type: Number,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true,
  },
});

module.exports = mongoose.model("OnlineStatus", onlineStatusSchema);
