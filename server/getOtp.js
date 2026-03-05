const mongoose = require("mongoose");
const User = require("./models/User");
require("dotenv").config();

async function getOtp() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const user = await User.findOne({ email: "rajesh@example.com" });
    if (user && user.otp) {
      console.log(`Current OTP for ${user.email}: ${user.otp}`);
    } else {
      console.log(
        "No active OTP found for rajesh@example.com. Please try logging in first.",
      );
    }
    process.exit();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

getOtp();
