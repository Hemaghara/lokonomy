const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
require("dotenv").config();
const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const validateEnv = require("./utils/validateEnv");
validateEnv();

const logger = require("./utils/logger");
const globalErrorHandler = require("./middleware/globalErrorHandler");
const sanitizeMiddleware = require("./middleware/sanitize");
const { apiLimiter, authLimiter } = require("./middleware/rateLimiter");
const setupIndexes = require("./utils/setupIndexes");
const initSocket = require("./socket");
const { startSubscriptionCron } = require("./cron/subscriptionExpiry");
const { startBookingRemindersCron } = require("./cron/bookingReminders");
const {
  startScheduledNotificationsCron,
} = require("./cron/scheduledNotifications");
const startJobDeadlineCron = require("./cron/jobDeadlineCheck");
const startJobAlertsCron = require("./cron/jobAlertCheck");


const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;
const io = initSocket(server);
app.set("io", io);

app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  next();
});

const allowedOrigins = [
  process.env.APP_URL,
  "https://lokonomy.vercel.app",
  "https://lokonomy.onrender.com",
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:3000",
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin) || origin.endsWith(".vercel.app")) {
        callback(null, true);
      } else {
        callback(new Error("CORS policy violation"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  }),
);

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(sanitizeMiddleware);
app.use("/api/", apiLimiter);

app.use("/api/auth", authLimiter, require("./routes/auth"));
app.use("/api/businesses", require("./routes/businesses"));
app.use("/api/market", require("./routes/market"));
app.use("/api/jobs", require("./routes/jobs"));
app.use("/api/stories", require("./routes/stories"));
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
app.use("/api/admin", require("./routes/adminRoutes"));

app.get("/", (req, res) => {
  res.send("Lokonomy API is running");
});

mongoose.connect(process.env.MONGO_URI, { family: 4 })
  .then(async () => {
    logger.info("MongoDB Connected");
    await setupIndexes();
    startSubscriptionCron();
    startBookingRemindersCron();
    startScheduledNotificationsCron();
    startJobDeadlineCron();
    startJobAlertsCron();

  })
  .catch((err) => {
    logger.fatal({ err }, "MongoDB connection failed");
    process.exit(1);
  });

process.on("SIGTERM", async () => {
  logger.info("SIGTERM received. Shutting down gracefully...");
  server.close(async () => {
    await mongoose.connection.close();
    process.exit(0);
  });
});

app.use(globalErrorHandler);
server.listen(PORT, () => logger.info({ port: PORT }, "Server running"));
module.exports = app;
