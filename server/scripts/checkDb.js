const mongoose = require("mongoose");
require("dotenv").config();
const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder("ipv4first");
}

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB");

  const User = require("../models/User");
  const Business = require("../models/Business");

  const users = await User.find({}).lean();
  console.log("\n=== USERS ===");
  users.forEach(u => {
    console.log({
      id: u._id,
      name: u.name,
      email: u.email,
      role: u.role,
      subscription: u.subscription
    });
  });

  const businesses = await Business.find({}).lean();
  console.log("\n=== BUSINESSES ===");
  businesses.forEach(b => {
    console.log({
      id: b._id,
      businessName: b.businessName,
      ownerId: b.ownerId,
      category: b.mainCategory
    });
  });

  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
