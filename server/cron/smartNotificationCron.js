const cron = require("node-cron");
const { runSmartNotifications } = require("../services/smartNotificationService");
const logger = require("../utils/logger");

const startSmartNotificationsCron = (io) => {
  cron.schedule("0 */6 * * *", async () => {
    logger.info("[Cron] Starting smart notifications generation...");
    try {
      const stats = await runSmartNotifications(io);
      logger.info({ stats }, "[Cron] Smart notifications completed successfully");
    } catch (err) {
      logger.error({ err }, "[Cron] Smart notifications failed");
    }
  });
  logger.info("[Cron] Smart notifications cron started (every 6 hours).");
};

module.exports = startSmartNotificationsCron;
