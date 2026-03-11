const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
require("dotenv").config();

const globalErrorHandler = require("./middleware/globalErrorHandler");
const initSocket = require("./socket");
const { startSubscriptionCron } = require("./cron/subscriptionExpiry");

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

const io = initSocket(server);

// app.use(
//   cors({
//     origin: (origin, callback) => {
//       callback(null, true);
//     },
//     credentials: true,
//     methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
//     allowedHeaders: [
//       "Content-Type",
//       "Authorization",
//       "X-Requested-With",
//       "Accept",
//     ],
//     exposedHeaders: ["Content-Range", "X-Content-Range"],
//   }),
// );

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://lokonomy.vercel.app"
    ],
    credentials: true,
  })
);
app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ limit: "100mb", extended: true }));
app.use("/api/businesses", require("./routes/businesses"));
app.use("/api/auth", require("./routes/auth"));
app.use("/api/market", require("./routes/market"));
app.use("/api/jobs", require("./routes/jobs"));
app.use("/api/stories", require("./routes/stories"));
app.use("/api/orders", require("./routes/orders"));
app.use("/api/feeds", require("./routes/feeds"));
app.use("/api/chat", require("./routes/chat"));
app.use("/api/subscription", require("./routes/subscription"));
app.get("/", (req, res) => {
  res.send("Lokonomy API is running");
});
app.use(globalErrorHandler);

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB Connected");
    startSubscriptionCron();
  })
  .catch((err) => {
    console.error("MongoDB Connection Error:");
    if (err.message.includes("ENOTFOUND")) {
      console.error(
        "Database Connection Error: Please check your internet connection.",
      );
    } else {
      console.error(err.message);
    }
  });

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
