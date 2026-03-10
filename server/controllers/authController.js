const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const nodemailer = require("nodemailer");
const { uploadToCloudinary } = require("../utils/cloudinary");

exports.login = async (req, res) => {
  const {
    email,
    password,
    latitude,
    longitude,
    locationName,
    locationPermission,
  } = req.body;
  console.log(`\n--- Login Attempt: ${email} ---`);

  try {
    const user = await User.findOne({ email });
    if (!user) {
      console.log("User not found");
      return res
        .status(400)
        .json({ success: false, message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log("Password mismatch");
      return res
        .status(400)
        .json({ success: false, message: "Invalid email or password" });
    }
    if (locationPermission === "granted" && latitude && longitude) {
      user.latitude = parseFloat(latitude);
      user.longitude = parseFloat(longitude);
      user.locationName = locationName || null;
      user.locationPermission = "granted";
      console.log(
        `Location updated for ${user.name}: [${latitude}, ${longitude}]`,
      );
    } else if (locationPermission === "denied") {
      user.locationPermission = "denied";
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 60000);

    user.otp = otp;
    user.otpExpires = otpExpires;
    await user.save();
    console.log(`OTP generated for ${user.name}: ${otp}`);

    const isConfigMissing = !process.env.EMAIL_USER || !process.env.EMAIL_PASS;
    const isPlaceholder =
      process.env.EMAIL_USER && process.env.EMAIL_USER.includes("your-email");

    if (isConfigMissing || isPlaceholder) {
      console.warn(
        "[Config Alert] EMAIL_USER placeholder still exists in .env. Please update line 7.",
      );
      return res.json({
        success: true,
        message:
          "Configuration Needed: Please change 'your-email@gmail.com' in your .env file to your actual Gmail address.",
        step: "otp",
        devOtp: otp,
      });
    }

    try {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      await transporter.sendMail({
        from: `"Lokonomy Security" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "Your Verification Code",
        html: `
          <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px; max-width: 400px;">
            <h3>Verification Code</h3>
            <p>Hello <b>${user.name}</b>,</p>
            <p>Your login code is:</p>
            <div style="background: #f4f4f4; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px;">
              ${otp}
            </div>
            <p style="font-size: 12px; color: #888;">Valid for 1 minute.</p>
          </div>
        `,
      });
      console.log("Email dispatched successfully");
      return res.json({
        success: true,
        message: "Verification code sent to your email.",
        step: "otp",
      });
    } catch (mailErr) {
      console.error("SMTP ERROR:", mailErr.message);
      if (mailErr.message.includes("535")) {
        return res.json({
          success: true,
          message:
            "Gmail Error: Using Debug OTP because App Password is incorrect.",
          step: "otp",
          devOtp: otp,
        });
      }
      throw mailErr;
    }
  } catch (err) {
    console.error("SERVER ERROR:", err.message);
    let msg = "A server error occurred.";
    if (err.message.includes("ENOTFOUND")) {
      msg = "Database Connection Error: Please check your internet connection.";
    }
    res.status(500).json({ success: false, message: msg });
  }
};

exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email });

    if (!user || user.otp !== otp || new Date() > user.otpExpires) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid or expired OTP" });
    }

    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    const token = jwt.sign(
      { user: { id: user.id } },
      process.env.JWT_SECRET || "secret",
      { expiresIn: 360000 },
    );

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        district: user.district,
        taluka: user.taluka,
        latitude: user.latitude,
        longitude: user.longitude,
        locationName: user.locationName,
        locationPermission: user.locationPermission,
        upiId: user.upiId,
        paymentQrCode: user.paymentQrCode,
        bankName: user.bankName,
        ifscCode: user.ifscCode,
        branch: user.branch,
        accountNumber: user.accountNumber,
        phoneNumber: user.phoneNumber,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Verification failed" });
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        district: user.district,
        taluka: user.taluka,
        latitude: user.latitude,
        longitude: user.longitude,
        locationName: user.locationName,
        locationPermission: user.locationPermission,
        upiId: user.upiId,
        paymentQrCode: user.paymentQrCode,
        bankName: user.bankName,
        ifscCode: user.ifscCode,
        branch: user.branch,
        accountNumber: user.accountNumber,
        phoneNumber: user.phoneNumber,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.register = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      latitude,
      longitude,
      locationName,
      locationPermission,
    } = req.body;
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: "User already exists" });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const userData = {
      name,
      email,
      password: hashedPassword,
      locationPermission: locationPermission || "not_asked",
    };
    if (locationPermission === "granted" && latitude && longitude) {
      userData.latitude = parseFloat(latitude);
      userData.longitude = parseFloat(longitude);
      userData.locationName = locationName || null;
      console.log(
        `📍 Location saved during registration for ${name}: [${latitude}, ${longitude}]`,
      );
    }

    user = new User(userData);
    await user.save();

    const token = jwt.sign(
      { user: { id: user.id } },
      process.env.JWT_SECRET || "secret",
      { expiresIn: 360000 },
    );

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        district: user.district,
        taluka: user.taluka,
        latitude: user.latitude,
        longitude: user.longitude,
        locationName: user.locationName,
        locationPermission: user.locationPermission,
        upiId: user.upiId,
        paymentQrCode: user.paymentQrCode,
        bankName: user.bankName,
        ifscCode: user.ifscCode,
        branch: user.branch,
        accountNumber: user.accountNumber,
        phoneNumber: user.phoneNumber,
      },
      message: "User registered successfully",
    });
  } catch (err) {
    res.status(501).json({ success: false, message: "Registration failed" });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const {
      name,
      latitude,
      longitude,
      locationName,
      locationPermission,
      district,
      taluka,
      upiId,
      phoneNumber,
      paymentQrCode,
      bankName,
      ifscCode,
      branch,
      accountNumber,
    } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    if (name) user.name = name;

    if (latitude !== undefined) user.latitude = parseFloat(latitude);
    if (longitude !== undefined) user.longitude = parseFloat(longitude);
    if (locationName !== undefined) user.locationName = locationName;
    if (locationPermission) user.locationPermission = locationPermission;
    if (district !== undefined) user.district = district;
    if (taluka !== undefined) user.taluka = taluka;

    if (upiId !== undefined) user.upiId = upiId;
    if (phoneNumber !== undefined) user.phoneNumber = phoneNumber;
    if (bankName !== undefined) user.bankName = bankName;
    if (ifscCode !== undefined) user.ifscCode = ifscCode;
    if (branch !== undefined) user.branch = branch;
    if (accountNumber !== undefined) user.accountNumber = accountNumber;

    if (paymentQrCode !== undefined) {
      if (paymentQrCode && paymentQrCode.startsWith("data:image")) {
        user.paymentQrCode = await uploadToCloudinary(
          paymentQrCode,
          "payments",
        );
      } else {
        user.paymentQrCode = paymentQrCode;
      }
    }

    await user.save();

    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        latitude: user.latitude,
        longitude: user.longitude,
        locationName: user.locationName,
        locationPermission: user.locationPermission,
        district: user.district,
        taluka: user.taluka,
        upiId: user.upiId,
        paymentQrCode: user.paymentQrCode,
        bankName: user.bankName,
        ifscCode: user.ifscCode,
        branch: user.branch,
        accountNumber: user.accountNumber,
        phoneNumber: user.phoneNumber,
      },
      message: "Profile updated successfully",
    });
  } catch (err) {
    console.error("Update Profile Error:", err.message);
    res
      .status(500)
      .json({ success: false, message: "Failed to update profile" });
  }
};
