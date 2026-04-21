const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const nodemailer = require("nodemailer");
const { uploadMedia } = require("../utils/uploadMedia");
const { serializeUser } = require("../utils/userSerializer");
const logger = require("../utils/logger");

exports.login = async (req, res) => {
  const {
    email,
    password,
    latitude,
    longitude,
    locationName,
    locationPermission,
  } = req.body;

  logger.info({ email }, "Login Attempt");

  if (!email || !password) {
    return res
      .status(400)
      .json({ success: false, message: "Please provide email and password" });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      logger.warn({ email }, "Login failed: User not found");
      return res
        .status(400)
        .json({ success: false, message: "Invalid email or password" });
    }

    if (user.status && user.status !== "active") {
      const statusMsg =
        user.status === "banned"
          ? "Your account has been permanently banned by the administrator."
          : "Your account is temporarily suspended. Please contact support.";

      logger.warn(
        { email, status: user.status },
        "Blocked login attempt for inactive user",
      );
      return res.status(403).json({
        success: false,
        message: statusMsg,
        status: user.status,
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      logger.warn({ email }, "Login failed: Password mismatch");
      return res
        .status(400)
        .json({ success: false, message: "Invalid email or password" });
    }
    if (locationPermission === "granted" && latitude && longitude) {
      user.latitude = parseFloat(latitude);
      user.longitude = parseFloat(longitude);
      user.locationName = locationName || null;
      user.locationPermission = "granted";
      logger.debug(
        { userId: user._id, latitude, longitude },
        "Location updated for user",
      );
    } else if (locationPermission === "denied") {
      user.locationPermission = "denied";
      logger.debug({ userId: user._id }, "Location permission denied for user");
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 60000);

    await User.findByIdAndUpdate(user._id, {
      $set: { otp, otpExpires },
    });
    // Log intent, not the OTP itself in production
    logger.debug({ userId: user._id }, "OTP generated for user");

    const isConfigMissing = !process.env.EMAIL_USER || !process.env.EMAIL_PASS;

    const isPlaceholder =
      process.env.EMAIL_USER && process.env.EMAIL_USER.includes("your-email");

    if (isConfigMissing || isPlaceholder) {
      logger.warn(
        "Email configuration missing or placeholder found. Using Debug OTP.",
      );

      return res.json({
        success: true,
        message: "give the orignal email and password",
        step: "otp",
        devOtp: otp,
      });
    }

    try {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        connectionTimeout: 10000,
        greetingTimeout: 5000,
        socketTimeout: 15000,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      await transporter.sendMail({
        from: `"Lokonomy Service" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
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
      logger.info({ email }, "Email dispatched successfully");
      return res.json({
        success: true,
        message: "Verification code sent to your email.",
        step: "otp",
      });
    } catch (mailErr) {
      logger.error({ err: mailErr }, "SMTP ERROR");

      return res.json({
        success: true,
        message: "OTP Service currently unavailable. Using Debug OTP.",
        step: "otp",
        devOtp: otp,
      });
    }
  } catch (err) {
    logger.error({ err }, "Login server error");
    let msg = "A server error occurred.";
    if (err.message.includes("ENOTFOUND")) {
      msg = "Database Connection Error: Please check your internet connection.";
    } else if (err.message.includes("timeout")) {
      msg = "Database request timed out. Please check your Atlas IP Whitelist.";
    }
    res
      .status(500)
      .json({ success: false, message: msg, details: err.message });
  }
};

exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    logger.info({ email }, "Verify OTP Attempt");
    const user = await User.findOne({ email });

    if (!user || user.otp !== otp || new Date() > user.otpExpires) {
      logger.warn({ email }, "OTP verification failed: Invalid or expired OTP");
      return res
        .status(400)
        .json({ success: false, message: "Invalid or expired OTP" });
    }

    if (user.status && user.status !== "active") {
      logger.warn(
        { email, status: user.status },
        "Access denied for inactive user during OTP verification",
      );
      return res.status(403).json({
        success: false,
        message: `Your account is ${user.status}. Access denied.`,
        status: user.status,
      });
    }

    user.otp = undefined;
    user.otpExpires = undefined;
    user.lastLoginDate = new Date();
    await user.save();

    const token = jwt.sign(
      { user: { id: user.id } },
      process.env.JWT_SECRET || "lokonomy_secret_key_123",
      { expiresIn: 360000 },
    );

    res.json({
      success: true,
      token,
      user: serializeUser(user),
    });
  } catch (err) {
    logger.error({ err }, "OTP verification error");
    res.status(500).json({ success: false, message: "Verification failed" });
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      logger.warn({ userId: req.user.id }, "getMe: User not found");
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    res.json({
      success: true,
      user: serializeUser(user),
    });
  } catch (err) {
    logger.error({ err, userId: req.user.id }, "getMe error");
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
      referralCode: incomingReferralCode,
    } = req.body;

    let user = await User.findOne({ email });
    if (user) {
      logger.warn({ email }, "Registration failed: User already exists");
      return res.status(400).json({ message: "User already exists" });
    }

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
      logger.debug(
        { name, latitude, longitude },
        "Location saved during registration",
      );
    }

    let referrerUser = null;
    if (incomingReferralCode) {
      referrerUser = await User.findOne({
        referralCode: incomingReferralCode.toUpperCase(),
      });
      if (referrerUser) {
        userData.referredBy = referrerUser._id;
      }
    }

    user = new User(userData);
    await user.save();

    const suffix = user._id.toString().slice(-4).toUpperCase();
    user.referralCode = `LOKO-${suffix}`;
    await user.save();

    if (referrerUser) {
      await User.findByIdAndUpdate(referrerUser._id, {
        $inc: { "referralRewards.totalReferrals": 1 },
      });
    }

    const token = jwt.sign(
      { user: { id: user.id } },
      process.env.JWT_SECRET || "lokonomy_secret_key_123",
      { expiresIn: 360000 },
    );

    logger.info({ userId: user._id, email }, "User registered successfully");

    res.status(201).json({
      success: true,
      token,
      user: serializeUser(user),
      message: "User registered successfully",
    });
  } catch (err) {
    logger.error({ err }, "Registration error");
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
      logger.warn({ userId: req.user.id }, "updateProfile: User not found");
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
        const res = await uploadMedia(paymentQrCode, "payments");
        user.paymentQrCode = res.secure_url;
      } else {
        user.paymentQrCode = paymentQrCode;
      }
    }

    await user.save();
    logger.info({ userId: user._id }, "User profile updated");

    res.json({
      success: true,
      user: serializeUser(user),
      message: "Profile updated successfully",
    });
  } catch (err) {
    logger.error({ err, userId: req.user.id }, "Profile update error");
    res
      .status(500)
      .json({ success: false, message: "Failed to update profile" });
  }
};
