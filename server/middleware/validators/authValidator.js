const validateLogin = (req, res, next) => {
  const { email, password } = req.body;
  const errors = [];

  if (!email || typeof email !== "string") errors.push("Valid email required");
  if (!password || typeof password !== "string")
    errors.push("Password required");
  if (password && password.length > 128) errors.push("Password too long");
  if (email && email.length > 254) errors.push("Email too long");

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (email && !emailRegex.test(email)) errors.push("Invalid email format");

  if (errors.length > 0) {
    return res.status(400).json({ success: false, message: errors[0], errors });
  }
  next();
};

const validateRegister = (req, res, next) => {
  const { name, email, password } = req.body;
  const errors = [];

  if (!name || name.trim().length < 2)
    errors.push("Name must be at least 2 characters");
  if (name && name.length > 50) errors.push("Name too long");
  if (!email) errors.push("Email required");
  if (!password) errors.push("Password required");
  if (password && password.length < 8)
    errors.push("Password must be at least 8 characters");
  if (password && password.length > 128) errors.push("Password too long");
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  if (password && !passwordRegex.test(password)) {
    errors.push("Password must include uppercase, lowercase, number, and special character");
  }

  if (errors.length > 0) {
    return res.status(400).json({ success: false, message: errors[0], errors });
  }
  next();
};

const validateOtp = (req, res, next) => {
  const { email, otp } = req.body;
  if (!email || !otp) {
    return res
      .status(400)
      .json({ success: false, message: "Email and OTP required" });
  }
  if (!/^\d{6}$/.test(otp)) {
    return res
      .status(400)
      .json({ success: false, message: "OTP must be 6 digits" });
  }
  next();
};

module.exports = { validateLogin, validateRegister, validateOtp };
