const { z } = require("zod");

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

const registerSchema = {
  body: z.object({
    name: z.string().min(2, "Name must be at least 2 characters").max(50, "Name too long"),
    email: z.string().email("Invalid email format").max(254, "Email too long"),
    password: z.string().min(8, "Password must be at least 8 characters").max(128, "Password too long").regex(passwordRegex, "Password must include uppercase, lowercase, number, and special character"),
  })
};

const loginSchema = {
  body: z.object({
    email: z.string().email("Invalid email format").max(254, "Email too long"),
    password: z.string().min(1, "Password required").max(128, "Password too long"),
  })
};

const otpSchema = {
  body: z.object({
    email: z.string().email("Invalid email format"),
    otp: z.string().regex(/^\d{6}$/, "OTP must be 6 digits"),
  })
};

const resendOtpSchema = {
  body: z.object({
    email: z.string().email("Invalid email format").max(254, "Email too long"),
  })
};

module.exports = {
  registerSchema,
  loginSchema,
  otpSchema,
  resendOtpSchema
};
