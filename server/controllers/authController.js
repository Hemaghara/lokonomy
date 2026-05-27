const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("../models/User");
const nodemailer = require("nodemailer");
const { uploadMedia } = require("../utils/uploadMedia");
const { serializeUser } = require("../utils/userSerializer");
const logger = require("../utils/logger");
const { Resend } = require("resend");

const resendClient = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;


let DUMMY_HASH = "$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012";
(async () => {
  try {
    DUMMY_HASH = await bcrypt.hash("dummy_password_for_timing_attack_prevention", 10);
  } catch (e) {
    logger.warn("Could not pre-compute dummy hash, using fallback");
  }
})();

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

let transporter;
const getTransporter = () => {
  if (!transporter) {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      return null;
    }
    transporter = nodemailer.createTransport({
      pool: true,
      service: "gmail",
      family: 4,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      },
    });
  }
  return transporter;
};


const sendOtpEmail = async (email, userName, otp) => {
  const mailService = getTransporter();
  const isResendConfigured = !!resendClient;
  const isGmailConfigured = !!mailService && !process.env.EMAIL_USER.includes("your-email");
  const isEmailConfigured = isResendConfigured || isGmailConfigured;

  if (!isEmailConfigured) {
    if (process.env.NODE_ENV === "production") {
      logger.error({
        resendApiKey: !!process.env.RESEND_API_KEY,
        emailUser: !!process.env.EMAIL_USER,
        emailPass: !!process.env.EMAIL_PASS
      }, "Email configuration missing in production!");
      return { success: false, production: true };
    }
    logger.warn("Dev mode: OTP logged server-side only");
    logger.info({ otp }, "DEV OTP (never send to client in prod)");
    return { success: true, devMode: true };
  }

  const emailContent = {
    subject: "Your Verification Code",
    text: `Hello ${userName},\n\nYour login OTP is: ${otp}\n\nValid for 5 minutes. Do not share this code.`,
    html: `<div style="font-family:sans-serif;padding:20px">
      <h3>Verification Code</h3>
      <p>Hello <b>${userName}</b>,</p>
      <p>Your login OTP is:</p>
      <div style="background:#f4f4f4;padding:15px;text-align:center;font-size:24px;font-weight:bold;letter-spacing:5px">${otp}</div>
      <p style="font-size:12px;color:#888">Valid for 5 minutes. Do not share this code.</p>
    </div>`,
  };

  if (isResendConfigured) {
    logger.info({ to: email }, "Attempting to send OTP email via Resend...");
    resendClient.emails.send({
      from: process.env.RESEND_FROM || "Lokonomy <onboarding@resend.dev>",
      to: email,
      ...emailContent,
    })
      .then(() => logger.info({ to: email }, "OTP email sent via Resend"))
      .catch((err) => logger.error({ err: err.message, email }, "Resend delivery failed"));
  } else {
    logger.info({ to: email }, "Attempting to send OTP email via Gmail SMTP...");
    mailService.sendMail({
      from: `"Lokonomy" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
      to: email,
      ...emailContent,
    })
      .then(() => logger.info({ to: email }, "OTP email sent via Gmail SMTP"))
      .catch((mailErr) => logger.error({ err: mailErr.message, email }, "Gmail SMTP delivery failed"));
  }

  return { success: true };
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
  const normalizedEmail = email.toLowerCase().trim();
  if (!emailRegex.test(normalizedEmail)) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid email format" });
  }

  try {
    const user = await User.findOne({ email: normalizedEmail }).select(
      "+password +otp +otpExpires",
    );

    const isMatch = user
      ? await bcrypt.compare(password, user.password)
      : await bcrypt.compare(password, DUMMY_HASH);

    if (!user || !isMatch) {
      logger.warn({ email: normalizedEmail }, "Login failed: Invalid credentials");
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
      const lat = parseFloat(latitude);
      const lng = parseFloat(longitude);
      if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        user.latitude = lat;
        user.longitude = lng;
        user.locationName = locationName || null;
        user.locationPermission = "granted";
      } else {
        logger.warn({ latitude, longitude }, "Invalid coordinates received during login");
      }
    } else if (locationPermission === "denied") {
      user.locationPermission = "denied";
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 300000);
    const otpHash = crypto.createHash("sha256").update(otp).digest("hex");

    await User.findByIdAndUpdate(user._id, {
      $set: {
        otp: otpHash,
        otpExpires,
        latitude: user.latitude,
        longitude: user.longitude,
        locationName: user.locationName,
        locationPermission: user.locationPermission,
      },
    });

    const emailResult = await sendOtpEmail(normalizedEmail, user.name, otp);

    if (!emailResult.success && emailResult.production) {
      return res.status(503).json({
        success: false,
        message: "Email service is not configured. Please set RESEND_API_KEY or EMAIL_USER/EMAIL_PASS in Render settings.",
      });
    }

    return res.json({
      success: true,
      message: emailResult.devMode ? "OTP sent (dev mode)" : "Verification code sent.",
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
    const normalizedEmail = email ? email.toLowerCase().trim() : "";
    logger.info({ email: normalizedEmail }, "Verify OTP Attempt");
    const user = await User.findOne({ email: normalizedEmail }).select("+otp +otpExpires");

    const incomingHash = crypto.createHash("sha256").update(otp || "").digest("hex");

    const isOtpValid = user && user.otp &&
      crypto.timingSafeEqual(Buffer.from(user.otp), Buffer.from(incomingHash)) &&
      new Date() <= user.otpExpires;

    if (!isOtpValid) {
      logger.warn({ email: normalizedEmail }, "OTP verification failed: Invalid or expired OTP");
      return res
        .status(400)
        .json({ success: false, message: "Invalid or expired OTP" });
    }

    if (user.status && user.status !== "active") {
      logger.warn(
        { email: normalizedEmail, status: user.status },
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
      { expiresIn: "7d" },
    );
    const refreshToken = jwt.sign(
      { user: { id: user.id } },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: "30d" },
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

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.user.id);

    if (!user || user.refreshToken !== refreshToken) {
      return res
        .status(403)
        .json({ success: false, message: "Invalid refresh token" });
    }

    const newAccessToken = jwt.sign(
      { user: { id: user.id } },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );
    const newRefreshToken = jwt.sign(
      { user: { id: user.id } },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: "30d" },
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

exports.logout = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user.id, { refreshToken: null });
    res.json({ success: true, message: "Logged out successfully" });
  } catch (err) {
    logger.error({ err }, "Logout error");
    res.status(500).json({ success: false, message: "Logout failed" });
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
      district,
      taluka,
      referralCode: incomingReferralCode,
    } = req.body;

    const normalizedEmail = email ? email.toLowerCase().trim() : "";

    if (!password || !PASSWORD_REGEX.test(password)) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters with uppercase, lowercase, number, and special character (@$!%*?&)",
      });
    }

    let user = await User.findOne({ email: normalizedEmail });
    if (user) {
      logger.warn({ email: normalizedEmail }, "Registration failed: User already exists");
      return res.status(400).json({ success: false, message: "User already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const userData = {
      name,
      email: normalizedEmail,
      password: hashedPassword,
      locationPermission: locationPermission || "not_asked",
      district: district || null,
      taluka: taluka || null,
    };


    if (locationPermission === "granted" && latitude && longitude) {
      const lat = parseFloat(latitude);
      const lng = parseFloat(longitude);
      if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        userData.latitude = lat;
        userData.longitude = lng;
        userData.locationName = locationName || null;
        logger.debug({ name, latitude: lat, longitude: lng }, "Location saved during registration");
      } else {
        logger.warn({ latitude, longitude }, "Invalid coordinates during registration, skipping");
      }
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


    user.referralCode = `LOKO-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
    await user.save();


    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 300000);
    const otpHash = crypto.createHash("sha256").update(otp).digest("hex");

    await User.findByIdAndUpdate(user._id, {
      $set: { otp: otpHash, otpExpires },
    });

    if (referrerUser) {
      await User.findByIdAndUpdate(referrerUser._id, {
        $inc: { "referralRewards.totalReferrals": 1 },
      });
    }

    const emailResult = await sendOtpEmail(normalizedEmail, name, otp);

    if (!emailResult.success && emailResult.production) {
      logger.error({ email: normalizedEmail }, "Registration succeeded but OTP email failed");
    }

    logger.info({ userId: user._id, email: normalizedEmail }, "User registered — OTP sent for verification");

    res.status(201).json({
      success: true,
      message: "Registration successful. Please verify your email with the OTP sent.",
      step: "otp",
      email: normalizedEmail,
    });
  } catch (err) {
    logger.error({ err }, "Registration error");
    res.status(500).json({ success: false, message: "Registration failed" });
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

    if (latitude !== undefined && longitude !== undefined) {
      const lat = parseFloat(latitude);
      const lng = parseFloat(longitude);
      if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        user.latitude = lat;
        user.longitude = lng;
      } else {
        return res.status(400).json({ success: false, message: "Invalid coordinates" });
      }
    } else if (latitude !== undefined) {
      user.latitude = parseFloat(latitude);
    } else if (longitude !== undefined) {
      user.longitude = parseFloat(longitude);
    }

    if (locationName !== undefined) user.locationName = locationName;
    if (locationPermission) user.locationPermission = locationPermission;
    if (district !== undefined) user.district = district;
    if (taluka !== undefined) user.taluka = taluka;

    if (phoneNumber !== undefined) {
      if (phoneNumber && !/^\d{10}$/.test(phoneNumber)) {
        return res.status(400).json({ success: false, message: "Invalid phone number (must be 10 digits)" });
      }
      user.phoneNumber = phoneNumber;
    }
    if (upiId !== undefined) {
      if (upiId && !/^[\w.\-]+@[\w]+$/.test(upiId)) {
        return res.status(400).json({ success: false, message: "Invalid UPI ID format" });
      }
      user.upiId = upiId;
    }
    if (ifscCode !== undefined) {
      if (ifscCode && !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifscCode.toUpperCase())) {
        return res.status(400).json({ success: false, message: "Invalid IFSC code" });
      }
      user.ifscCode = ifscCode;
    }
    if (bankName !== undefined) user.bankName = bankName;
    if (branch !== undefined) user.branch = branch;
    if (accountNumber !== undefined) {
      if (accountNumber && !/^\d{6,18}$/.test(accountNumber)) {
        return res.status(400).json({ success: false, message: "Invalid account number" });
      }
      user.accountNumber = accountNumber;
    }

    if (paymentQrCode !== undefined) {
      if (paymentQrCode && paymentQrCode.startsWith("data:image")) {
        const uploadResult = await uploadMedia(paymentQrCode, "payments");
        user.paymentQrCode = uploadResult.secure_url;
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
