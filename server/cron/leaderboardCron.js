const cron = require("node-cron");
const { calculateLeaderboard } = require("../controllers/leaderboardController");
const logger = require("../utils/logger");

const startLeaderboardCron = () => {
  cron.schedule("0 0 * * *", async () => {
    logger.info("[Cron] Starting daily leaderboard calculation...");
    try {
      const count = await calculateLeaderboard(null, null);
      logger.info(`[Cron] Leaderboard calculated successfully. ${count} entries.`);
    } catch (err) {
      logger.error({ err }, "[Cron] Leaderboard calculation failed");
    }
  });
  logger.info("[Cron] Leaderboard calculation cron started (daily at midnight).");
};

module.exports = startLeaderboardCron;
