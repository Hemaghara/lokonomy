const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
require("dotenv").config();
const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder("ipv4first");
}

const validateEnv = require("./utils/validateEnv");
validateEnv();

const logger = require("./utils/logger");
const globalErrorHandler = require("./middleware/globalErrorHandler");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const { apiLimiter, authLimiter } = require("./middleware/rateLimiter");
const setupIndexes = require("./utils/setupIndexes");
const { initSocket } = require("./socket");
const { startSubscriptionCron } = require("./cron/subscriptionExpiry");
const { startBookingRemindersCron } = require("./cron/bookingReminders");
const {
  startScheduledNotificationsCron,
} = require("./cron/scheduledNotifications");
const startJobDeadlineCron = require("./cron/jobDeadlineCheck");
const startJobAlertsCron = require("./cron/jobAlertCheck");
const startLeaderboardCron = require("./cron/leaderboardCron");
const startSmartNotificationsCron = require("./cron/smartNotificationCron");
const allowedOrigins = require("./config/corsOrigins");
const Business = require("./models/Business");


const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;
const io = initSocket(server);
app.set("io", io);

app.use(helmet());

app.use(
  cors({
    origin: (origin, callback) => {
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else if (!origin && (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test")) {
        callback(null, true); // Allow local testing tools / test runner
      } else {
        callback(new Error("CORS policy violation"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  }),
);

const maintenanceCheck = require("./middleware/maintenanceCheck");

const largePayload = express.json({ limit: "10mb" });
const largeUrlencoded = express.urlencoded({ limit: "10mb", extended: true });

app.use("/api/auth", authLimiter, largePayload, largeUrlencoded, mongoSanitize(), require("./routes/auth"));
app.use("/api/market", largePayload, largeUrlencoded, mongoSanitize(), require("./routes/market"));
app.use("/api/stories", largePayload, largeUrlencoded, mongoSanitize(), require("./routes/stories"));

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ limit: "1mb", extended: true }));
app.use(mongoSanitize());
app.use("/api/", apiLimiter);
app.use("/api/", maintenanceCheck);
app.use("/api/ai", require("./routes/ai")); // Bug #2: server-side AI endpoints
app.use("/api/businesses", require("./routes/businesses"));
app.use("/api/jobs", require("./routes/jobs"));
app.use("/api/orders", require("./routes/orders"));
app.use("/api/feeds", require("./routes/feeds"));
app.use("/api/chat", require("./routes/chat"));
app.use("/api/subscription", require("./routes/subscription"));
app.use("/api/growth", require("./routes/growth"));
app.use("/api/wishlist", require("./routes/wishlist"));
app.use("/api/push", require("./routes/pushRoutes"));
app.use("/api/qa", require("./routes/qa"));
app.use("/api/referral", require("./routes/referralRoutes"));
app.use("/api/recommendations", require("./routes/recommendations"));
app.use("/api/rewards", require("./routes/rewards"));
app.use("/api/notifications", require("./routes/notifications"));
app.use("/api/reports", require("./routes/report"));
app.use("/api/commissions", require("./routes/commissions"));
app.use("/api/leaderboard", require("./routes/leaderboard"));
app.use("/api/promoted", require("./routes/promoted"));
app.use("/api/preorders", require("./routes/preorders"));
app.use("/api/flashsales", require("./routes/flashsales"));
app.use("/api/pricecomparison", require("./routes/pricecomparison"));
app.use("/api/aiinsights", require("./routes/aiinsights"));
app.use("/api/guarantee", require("./routes/guarantee"));
app.use("/api/influencer", require("./routes/influencer"));
app.use("/api/groups", require("./routes/groups"));
app.use("/api/subscriptionboxes", require("./routes/subscriptionboxes"));
app.use("/api/admin", require("./routes/adminRoutes"));


app.get("/", (req, res) => {
  res.send("Lokonomy API is running");
});

app.use(globalErrorHandler);

if (process.env.NODE_ENV !== "test") {
  mongoose.connect(process.env.MONGO_URI, { family: 4 })
    .then(async () => {
      logger.info("MongoDB Connected");
      await setupIndexes();


      try {
        await Business.updateMany({}, { $set: { isOwnerOnline: false } });
        logger.info("Reset all business isOwnerOnline on startup");
      } catch (resetErr) {
        logger.error({ err: resetErr }, "Failed to reset business owner online status on startup");
      }

      startSubscriptionCron();
      startBookingRemindersCron();
      startScheduledNotificationsCron();
      startJobDeadlineCron();
      startJobAlertsCron();
      startLeaderboardCron();
      startSmartNotificationsCron(io);

      server.listen(PORT, () => logger.info({ port: PORT }, "Server running"));
    })
    .catch((err) => {
      logger.fatal({ err }, "MongoDB connection failed");
      process.exit(1);
    });
}

const gracefulShutdown = async (signal) => {
  logger.info(`${signal} received. Shutting down gracefully...`);
  server.close(async () => {
    try {
      await mongoose.connection.close();
      logger.info("MongoDB connection closed.");
      process.exit(0);
    } catch (err) {
      logger.error({ err }, "Error during database disconnection");
      process.exit(1);
    }
  });
  // Force shutdown after 10 seconds
  setTimeout(() => {
    logger.error("Forceful shutdown after timeout");
    process.exit(1);
  }, 10000);
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

module.exports = app;
