const mongoose = require("mongoose");

const apiKeySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    key: { type: String, required: true, unique: true },
    prefix: { type: String, required: true },
    scopes: [
      {
        type: String,
        enum: [
          "users:read",
          "businesses:read",
          "jobs:read",
          "products:read",
          "orders:read",
          "analytics:read",
          "notifications:write",
        ],
      },
    ],
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
    },
    status: { type: String, enum: ["active", "revoked"], default: "active" },
    rateLimit: { type: Number, default: 1000 },
    usageCount: { type: Number, default: 0 },
    lastUsed: { type: Date, default: null },
    expiresAt: { type: Date, default: null },
    usageLogs: [
      {
        endpoint: String,
        method: String,
        statusCode: Number,
        ip: String,
        timestamp: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true },
);

apiKeySchema.index({ key: 1 });
apiKeySchema.index({ status: 1 });
apiKeySchema.index({ createdBy: 1 });

module.exports = mongoose.model("ApiKey", apiKeySchema);
