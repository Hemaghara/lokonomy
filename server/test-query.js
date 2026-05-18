const mongoose = require("mongoose");
require("dotenv").config();
const Feed = require("./models/Feed");

async function run() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected successfully!");

    // Clean existing coordinates that may be malformed or verify indexes
    console.log("Ensuring indexes...");
    await Feed.createIndexes();

    const query = {
      $and: [
        {
          $or: [
            { scheduledAt: { $exists: false } },
            { scheduledAt: { $lte: new Date() } },
          ],
        },
        {
          $or: [
            { expiresAt: { $exists: false } },
            { expiresAt: { $gt: new Date() } },
            { expiresAt: null },
          ],
        },
      ],
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [72.49859975, 22.993096]
          },
          $maxDistance: 5000
        }
      }
    };

    console.log("Executing query...");
    const feeds = await Feed.find(query).skip(0).limit(9);
    console.log("Success! Found feeds count:", feeds.length);
  } catch (error) {
    console.error("ERROR CAPTURED:");
    console.error(error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected.");
  }
}

run();
