const Admin = require("../models/Admin");
const jwt = require("jsonwebtoken");

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || "lokonomy_secret_key", {
    expiresIn: "30d",
  });
};

exports.registerAdmin = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const adminExists = await Admin.findOne({ email });

    if (adminExists) {
      return res.status(400).json({ message: "Admin already exists" });
    }

    const admin = await Admin.create({
      name,
      email,
      password,
      role,
    });

    if (admin) {
      res.status(201).json({
        _id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        token: generateToken(admin._id),
      });
    } else {
      res.status(400).json({ message: "Invalid admin data" });
    }
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const admin = await Admin.findOne({ email });

    if (admin && (await admin.comparePassword(password))) {
      admin.lastLogin = Date.now();
      await admin.save();

      res.json({
        _id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        token: generateToken(admin._id),
      });
    } else {
      res.status(401).json({ message: "Invalid email or password" });
    }
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.verifyAdmin = async (req, res) => {
  try {
    if (!req.admin) {
      return res.status(404).json({ message: "Admin not found" });
    }
    res.json(req.admin);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.updateAdminProfile = async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin._id);

    if (admin) {
      admin.name = req.body.name || admin.name;
      admin.email = req.body.email || admin.email;

      if (req.body.password) {
        const passwordRegex =
          /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!passwordRegex.test(req.body.password)) {
          return res.status(400).json({
            message:
              "Password must be at least 8 characters long and include uppercase, lowercase, number, and special character.",
          });
        }
        admin.password = req.body.password;
      }

      if (req.body.role && admin.role === "superadmin") {
        admin.role = req.body.role;
      }

      const updatedAdmin = await admin.save();

      res.json({
        _id: updatedAdmin._id,
        name: updatedAdmin.name,
        email: updatedAdmin.email,
        role: updatedAdmin.role,
        token: generateToken(updatedAdmin._id),
      });
    } else {
      res.status(404).json({ message: "Admin not found" });
    }
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
