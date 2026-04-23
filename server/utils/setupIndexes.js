const mongoose = require("mongoose");
const logger = require("./logger");

const setupIndexes = async () => {
  try {
    const db = mongoose.connection.db;

    await db
      .collection("users")
      .createIndexes([
        { key: { email: 1 }, unique: true },
        { key: { district: 1, "subscription.status": 1 } },
        { key: { lastLoginDate: -1 } },
        {
          key: { "subscription.expiryDate": 1 },
          partialFilterExpression: { "subscription.status": "active" },
        },
        {
          key: { phoneNumber: 1 },
          partialFilterExpression: {
            phoneNumber: { $exists: true, $ne: null },
          },
        },
        { key: { status: 1, createdAt: -1 } },
      ]);

    await db
      .collection("businesses")
      .createIndexes([
        { key: { ownerId: 1 } },
        { key: { district: 1, mainCategory: 1 } },
        { key: { verificationStatus: 1, createdAt: -1 } },
        { key: { location: "2dsphere" } },
      ]);

    await db
      .collection("jobs")
      .createIndexes([
        { key: { posterId: 1 } },
        { key: { district: 1, status: 1 } },
        { key: { isFlagged: 1, isSuspended: 1, status: 1 } },
      ]);

    await db
      .collection("notifications")
      .createIndexes([
        { key: { recipient: 1, read: 1, createdAt: -1 } },
        { key: { createdAt: 1 }, expireAfterSeconds: 30 * 24 * 60 * 60 },
      ]);

    await db
      .collection("messages")
      .createIndexes([
        { key: { chatRoom: 1, createdAt: 1 } },
        { key: { receiverId: 1, read: 1 } },
      ]);

    await db
      .collection("reports")
      .createIndexes([
        { key: { status: 1, targetType: 1 } },
        { key: { targetId: 1, targetType: 1 } },
      ]);

    await db
      .collection("subscriptiontransactions")
      .createIndexes([
        { key: { user: 1, createdAt: -1 } },
        {
          key: { razorpayOrderId: 1 },
          unique: true,
          partialFilterExpression: { razorpayOrderId: { $ne: null } },
        },
        { key: { status: 1, createdAt: -1 } },
      ]);

    logger.info("Database indexes set up successfully");
  } catch (err) {
    logger.error({ err }, "Failed to set up indexes");
  }
};

module.exports = setupIndexes;
