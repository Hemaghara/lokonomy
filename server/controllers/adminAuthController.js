const Admin = require("../models/Admin");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const DUMMY_HASH = "$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012";
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d\s]).{8,128}$/;

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_ADMIN_SECRET, { expiresIn: "8h" });
};

exports.registerAdmin = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Defense in depth: only superadmins can register admins
    if (!req.admin || req.admin.role !== "superadmin") {
      return res.status(403).json({ success: false, message: "Only superadmins can register new admins" });
    }

    if (!email || typeof email !== "string") {
      return res.status(400).json({ success: false, message: "Valid email is required" });
    }

    if (!password || !PASSWORD_REGEX.test(password)) {
      return res.status(400).json({
        success: false,
        message: "Password must be 8-128 characters with uppercase, lowercase, number, and special character",
      });
    }

    const allowedRoles = ["admin", "Content Moderator", "Support Agent", "Finance Manager"];
    if (role && !allowedRoles.includes(role)) {
      return res.status(400).json({ success: false, message: "Invalid role" });
    }

    const adminExists = await Admin.findOne({ email: email?.toLowerCase().trim() });
    if (adminExists) {
      return res.status(400).json({ success: false, message: "Admin already exists" });
    }

    const admin = await Admin.create({
      name,
      email: email?.toLowerCase().trim(),
      password,
      role: role || "admin",
    });

    if (admin) {
      res.status(201).json({
        success: true,
        _id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        token: generateToken(admin._id),
      });
    } else {
      res.status(400).json({ success: false, message: "Invalid admin data" });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || typeof email !== "string" || !password) {
      return res.status(400).json({ success: false, message: "Valid email and password required" });
    }
    const admin = await Admin.findOne({ email: email.toLowerCase().trim() }).select("+password");

    const isMatch = admin
      ? await admin.comparePassword(password)
      : await bcrypt.compare(password, DUMMY_HASH);

    if (admin && isMatch) {
      admin.lastLogin = Date.now();
      await admin.save();

      res.json({
        success: true,
        _id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        token: generateToken(admin._id),
      });
    } else {
      res.status(401).json({ success: false, message: "Invalid email or password" });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.verifyAdmin = async (req, res) => {
  try {
    if (!req.admin) {
      return res.status(404).json({ success: false, message: "Admin not found" });
    }
    res.json({ success: true, admin: { _id: req.admin._id, name: req.admin.name, email: req.admin.email, role: req.admin.role, status: req.admin.status } });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.updateAdminProfile = async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin._id).select("+password");

    if (admin) {
      if (req.body.email && typeof req.body.email !== "string") {
        return res.status(400).json({ success: false, message: "Valid email is required" });
      }
      admin.name = req.body.name || admin.name;
      admin.email = req.body.email ? req.body.email.toLowerCase().trim() : admin.email;

      if (req.body.password) {
        if (!PASSWORD_REGEX.test(req.body.password)) {
          return res.status(400).json({
            success: false,
            message: "Password must be 8-128 characters with uppercase, lowercase, number, and special character.",
          });
        }
        admin.password = req.body.password;
      }

      if (req.body.role && admin.role === "superadmin") {
        admin.role = req.body.role;
      }

      const updatedAdmin = await admin.save();

      res.json({
        success: true,
        _id: updatedAdmin._id,
        name: updatedAdmin.name,
        email: updatedAdmin.email,
        role: updatedAdmin.role,
        token: generateToken(updatedAdmin._id),
      });
    } else {
      res.status(404).json({ success: false, message: "Admin not found" });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.reauthAdmin = async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ success: false, message: "Password is required" });
    }

    const admin = await Admin.findById(req.admin._id).select("+password");
    if (!admin) {
      return res.status(404).json({ success: false, message: "Admin not found" });
    }

    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid password" });
    }

    admin.lastLogin = Date.now();
    await admin.save();

    const newToken = generateToken(admin._id);
    res.json({
      success: true,
      token: newToken,
      admin: {
        _id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};
