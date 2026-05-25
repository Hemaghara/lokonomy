const mongoose = require("mongoose");
const Admin = require("./models/Admin");
require("dotenv").config();

async function createAdmin() {
  try {
    const email = process.env.ADMIN_EMAIL;
    const password = process.env.ADMIN_PASSWORD;

    if (!email || !password) {
      console.error("Error: ADMIN_EMAIL and ADMIN_PASSWORD environment variables are required.");
      process.exit(1);
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB...");

    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      console.log("Admin already exists. Updating password...");
      existingAdmin.password = password;
      await existingAdmin.save();
    } else {
      await Admin.create({
        name: "Test Admin",
        email,
        password,
        role: "superadmin",
      });
      console.log("Admin created successfully!");
    }
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

createAdmin();
