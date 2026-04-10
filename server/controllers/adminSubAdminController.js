const Admin = require("../models/Admin");
const AdminActivityLog = require("../models/AdminActivityLog");

exports.getSubAdmins = async (req, res) => {
  try {
    const { search, role, status } = req.query;
    let query = { role: { $ne: "superadmin" } };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    if (role) {
      query.role = role;
    }

    if (status) {
      query.status = status;
    }

    const subAdmins = await Admin.find(query)
      .select("-password")
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: subAdmins });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createSubAdmin = async (req, res) => {
  try {
    const { name, email, password, role, permissions } = req.body;

    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Admin with this email already exists",
        });
    }

    const subAdmin = await Admin.create({
      name,
      email,
      password,
      role,
      permissions,
    });

    await AdminActivityLog.create({
      admin: req.admin._id,
      action: "Created sub-admin",
      details: `Created sub-admin: ${name} (${email})`,
    });

    res.status(201).json({ success: true, data: subAdmin });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateSubAdmin = async (req, res) => {
  try {
    const { name, email, role, permissions, status } = req.body;
    const subAdmin = await Admin.findById(req.params.id);

    if (!subAdmin) {
      return res
        .status(404)
        .json({ success: false, message: "Sub-admin not found" });
    }

    subAdmin.name = name || subAdmin.name;
    subAdmin.email = email || subAdmin.email;
    subAdmin.role = role || subAdmin.role;
    subAdmin.permissions = permissions || subAdmin.permissions;
    subAdmin.status = status || subAdmin.status;

    await subAdmin.save();

    await AdminActivityLog.create({
      admin: req.admin._id,
      action: "Updated sub-admin",
      details: `Updated sub-admin: ${subAdmin.name} (${subAdmin.email})`,
    });

    res.status(200).json({ success: true, data: subAdmin });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteSubAdmin = async (req, res) => {
  try {
    const subAdmin = await Admin.findById(req.params.id);

    if (!subAdmin) {
      return res
        .status(404)
        .json({ success: false, message: "Sub-admin not found" });
    }

    await Admin.findByIdAndDelete(req.params.id);

    await AdminActivityLog.create({
      admin: req.admin._id,
      action: "Deleted sub-admin",
      details: `Deleted sub-admin: ${subAdmin.name} (${subAdmin.email})`,
    });

    res
      .status(200)
      .json({ success: true, message: "Sub-admin deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getActivityLogs = async (req, res) => {
  try {
    const logs = await AdminActivityLog.find()
      .populate("admin", "name email role")
      .sort({ createdAt: -1 })
      .limit(50);
    res.status(200).json({ success: true, data: logs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { password } = req.body;
    const subAdmin = await Admin.findById(req.params.id);

    if (!subAdmin) {
      return res
        .status(404)
        .json({ success: false, message: "Sub-admin not found" });
    }

    subAdmin.password = password;
    await subAdmin.save();

    await AdminActivityLog.create({
      admin: req.admin._id,
      action: "Reset password",
      details: `Reset password for sub-admin: ${subAdmin.name} (${subAdmin.email})`,
    });

    res
      .status(200)
      .json({ success: true, message: "Password reset successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
