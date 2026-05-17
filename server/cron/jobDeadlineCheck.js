const cron = require("node-cron");
const Job = require("../models/Job");
const logger = require("../utils/logger");

const scheduleJobDeadlineCheck = () => {
  cron.schedule("0 0 * * *", async () => {
    try {
      const result = await Job.updateMany(
        {
          deadline: { $lt: new Date() },
          status: "Open",
        },
        { $set: { status: "Closed" } }
      );
      if (result.modifiedCount > 0) {
        logger.info(`Auto-closed ${result.modifiedCount} expired jobs`);
      }
    } catch (err) {
      logger.error({ err }, "Error in job deadline cron");
    }
  });
};

module.exports = scheduleJobDeadlineCheck;
