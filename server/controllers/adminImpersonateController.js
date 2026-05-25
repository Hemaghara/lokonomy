const jwt = require("jsonwebtoken");
const User = require("../models/User");
const AdminActivityLog = require("../models/AdminActivityLog");

exports.impersonateUser = async (req, res) => {
  try {
    if (req.admin.role !== "superadmin") {
      return res
        .status(403)
        .json({ message: "Only superadmins can impersonate users." });
    }

    const user = await User.findById(req.params.userId).select(
      "-password -otp -otpExpires",
    );
    if (!user) return res.status(404).json({ message: "User not found." });

    const token = jwt.sign(
      { id: user._id, impersonatedBy: req.admin._id, isImpersonation: true },
      process.env.JWT_SECRET,
      { expiresIn: "30m" },
    );

    await AdminActivityLog.create({
      admin: req.admin._id,
      action: "IMPERSONATE_USER",
      targetType: "User",
      targetId: user._id,
      details: `Admin ${req.admin.name} (${req.admin.email}) started impersonation of user ${user.name} (${user.email})`,
    });

    res.json({
      message: `Impersonation session started for ${user.name}`,
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        district: user.district,
        subscription: user.subscription,
        status: user.status,
      },
      expiresIn: "30m",
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.verifyImpersonation = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "No token provided." });

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET,
    );
    if (!decoded.isImpersonation) {
      return res.status(400).json({ message: "Not an impersonation token." });
    }

    res.json({
      valid: true,
      userId: decoded.id,
      impersonatedBy: decoded.impersonatedBy,
    });
  } catch {
    res
      .status(401)
      .json({ valid: false, message: "Token expired or invalid." });
  }
};
