const mongoose = require("mongoose");
const Admin = require("./models/Admin");
require("dotenv").config();

async function createAdmin() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB...");

    const existingAdmin = await Admin.findOne({ email: "admin@test.com" });
    if (existingAdmin) {
      console.log("Admin already exists. Updating password...");
      existingAdmin.password = "Password@123";
      await existingAdmin.save();
    } else {
      await Admin.create({
        name: "Test Admin",
        email: "admin@test.com",
        password: "Password@123",
        role: "superadmin"
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
