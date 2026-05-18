const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const nodemailer = require("nodemailer");
const { uploadMedia } = require("../utils/uploadMedia");
const { serializeUser } = require("../utils/userSerializer");
const logger = require("../utils/logger");

let transporter;
const getTransporter = () => {
  if (!transporter) {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      return null;
    }
    transporter = nodemailer.createTransport({
      pool: true,
      service: "gmail",
      family: 4, // Force IPv4 to prevent Render IPv6 DNS latency and spam-filter delay
      auth: { 
        user: process.env.EMAIL_USER, 
        pass: process.env.EMAIL_PASS 
      },
    });
  }
  return transporter;
};

exports.login = async (req, res) => {
  const {
    email,
    password,
    latitude,
    longitude,
    locationName,
    locationPermission,
  } = req.body;

  if (!email || !password) {
    return res
      .status(400)
      .json({ success: false, message: "Email and password required" });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid email format" });
  }

  try {
    const user = await User.findOne({ email }).select(
      "+password +otp +otpExpires",
    );

    const dummyHash = "$2a$10$dummy.hash.to.prevent.timing.attacks.xxx";
    const isMatch = user
      ? await bcrypt.compare(password, user.password)
      : await bcrypt.compare(password, dummyHash);

    if (!user || !isMatch) {
      logger.warn({ email }, "Login failed: Invalid credentials");
      return res
        .status(401)
        .json({ success: false, message: "Invalid email or password" });
    }

    if (user.status && user.status !== "active") {
      const msg =
        user.status === "banned"
          ? "Account permanently banned."
          : "Account suspended. Contact support.";
      return res
        .status(403)
        .json({ success: false, message: msg, status: user.status });
    }

    if (locationPermission === "granted" && latitude && longitude) {
      user.latitude = parseFloat(latitude);
      user.longitude = parseFloat(longitude);
      user.locationName = locationName || null;
      user.locationPermission = "granted";
    } else if (locationPermission === "denied") {
      user.locationPermission = "denied";
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 300000);

    await User.findByIdAndUpdate(user._id, {
      $set: {
        otp,
        otpExpires,
        latitude: user.latitude,
        longitude: user.longitude,
        locationName: user.locationName,
        locationPermission: user.locationPermission,
      },
    });

    const mailService = getTransporter();
    const isEmailConfigured = !!mailService && !process.env.EMAIL_USER.includes("your-email");

    if (!isEmailConfigured) {
      if (process.env.NODE_ENV === "production") {
        logger.error({
          emailUser: !!process.env.EMAIL_USER,
          emailPass: !!process.env.EMAIL_PASS
        }, "Email configuration missing in production!");
        
        return res.status(503).json({
          success: false,
          message: "Email service is not configured. Please set EMAIL_USER and EMAIL_PASS in Render settings.",
        });
      }
      logger.warn(
        { userId: user._id },
        "Dev mode: OTP logged server-side only",
      );
      logger.info({ otp }, "DEV OTP (never send to client in prod)");
      return res.json({
        success: true,
        message: "OTP sent (dev mode)",
        step: "otp",
      });
    }

    logger.info({ to: email }, "Attempting to send OTP email in background...");
    
    mailService.sendMail({
      from: `"Lokonomy" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
      to: email,
      subject: "Your Verification Code",
      text: `Hello ${user.name},\n\nYour login OTP is: ${otp}\n\nValid for 5 minutes. Do not share this code.`,
      html: `<div style="font-family:sans-serif;padding:20px">
        <h3>Verification Code</h3>
        <p>Hello <b>${user.name}</b>,</p>
        <p>Your login OTP is:</p>
        <div style="background:#f4f4f4;padding:15px;text-align:center;font-size:24px;font-weight:bold;letter-spacing:5px">${otp}</div>
        <p style="font-size:12px;color:#888">Valid for 5 minutes. Do not share this code.</p>
      </div>`,
    })
    .then(() => {
      logger.info({ to: email }, "OTP email sent successfully in the background");
    })
    .catch((mailErr) => {
      logger.error({ err: mailErr.message, email }, "Email delivery failed in the background");
    });

    return res.json({
      success: true,
      message: "Verification code sent.",
      step: "otp",
    });
  } catch (err) {
    logger.error({ err: err.message }, "Login controller error");
    return res.status(500).json({ success: false, message: "Internal server error" });
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

    const accessToken = jwt.sign(
      { user: { id: user.id } },
      process.env.JWT_SECRET,
      { expiresIn: "15m" },
    );
    const refreshToken = jwt.sign(
      { user: { id: user.id } },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    user.refreshToken = refreshToken;
    await user.save();

    res.json({
      success: true,
      token: accessToken,
      refreshToken,
      user: serializeUser(user),
    });
  } catch (err) {
    logger.error({ err }, "OTP verification error");
    res.status(500).json({ success: false, message: "Verification failed" });
  }
};

exports.refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res
        .status(401)
        .json({ success: false, message: "Refresh token required" });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
    const user = await User.findById(decoded.user.id);

    if (!user || user.refreshToken !== refreshToken) {
      return res
        .status(403)
        .json({ success: false, message: "Invalid refresh token" });
    }

    const newAccessToken = jwt.sign(
      { user: { id: user.id } },
      process.env.JWT_SECRET,
      { expiresIn: "15m" },
    );
    const newRefreshToken = jwt.sign(
      { user: { id: user.id } },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    user.refreshToken = newRefreshToken;
    await user.save();

    res.json({
      success: true,
      token: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (err) {
    logger.error({ err }, "Refresh token error");
    res
      .status(403)
      .json({ success: false, message: "Invalid or expired token" });
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

    const accessToken = jwt.sign(
      { user: { id: user.id } },
      process.env.JWT_SECRET,
      { expiresIn: "15m" },
    );
    const refreshToken = jwt.sign(
      { user: { id: user.id } },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    user.refreshToken = refreshToken;
    await user.save();

    if (referrerUser) {
      await User.findByIdAndUpdate(referrerUser._id, {
        $inc: { "referralRewards.totalReferrals": 1 },
      });
    }

    logger.info({ userId: user._id, email }, "User registered successfully");

    res.status(201).json({
      success: true,
      token: accessToken,
      refreshToken,
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
