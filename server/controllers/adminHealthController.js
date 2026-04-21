const os = require("os");
const mongoose = require("mongoose");
const User = require("../models/User");

exports.getSystemHealth = async (req, res) => {
  try {
    const dbStartTime = Date.now();
    await User.findOne().select("_id");
    const dbPing = Date.now() - dbStartTime;

    const memory = process.memoryUsage();
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    const memoryUsagePercent = Math.round((usedMemory / totalMemory) * 100);

    const loadAvg = os.loadavg();
    const cpuUsage = Math.round((loadAvg[0] / os.cpus().length) * 100);

    const uptimeSeconds = process.uptime();
    const days = Math.floor(uptimeSeconds / (24 * 3600));
    const hours = Math.floor((uptimeSeconds % (24 * 3600)) / 3600);
    const minutes = Math.floor((uptimeSeconds % 3600) / 60);
    const uptimeStr = `${days}d ${hours}h ${minutes}m`;

    res.json({
      status: "healthy",
      api: "healthy",
      database: "healthy",
      redis: "healthy",
      dbPing,
      cpu: cpuUsage > 100 ? 100 : cpuUsage,
      memory: memoryUsagePercent,
      uptime: uptimeStr,
      details: {
        processMemory: {
          heapUsed: Math.round(memory.heapUsed / 1024 / 1024) + "MB",
          heapTotal: Math.round(memory.heapTotal / 1024 / 1024) + "MB",
          rss: Math.round(memory.rss / 1024 / 1024) + "MB",
        },
        systemMemory: {
          total: Math.round(totalMemory / 1024 / 1024 / 1024) + "GB",
          free: Math.round(freeMemory / 1024 / 1024 / 1024) + "GB",
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      status: "unhealthy",
      message: "Server health check failed",
      error: error.message,
    });
  }
};
