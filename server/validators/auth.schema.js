const { z } = require("zod");

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d\s]).{8,128}$/;

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

const updateProfileSchema = {
  body: z.object({
    name: z.string().min(2).max(50).optional(),
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional(),
    locationName: z.string().max(200).optional().nullable(),
    locationPermission: z.enum(["granted", "denied", "not_asked"]).optional(),
    district: z.string().max(100).optional().nullable(),
    taluka: z.string().max(100).optional().nullable(),
    phoneNumber: z.string().regex(/^\d{10}$/).optional().nullable(),
    upiId: z.string().regex(/^[\w.\-]+@[\w]+$/).optional().nullable(),
    bankName: z.string().max(100).optional().nullable(),
    ifscCode: z.string().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/i).optional().nullable(),
    branch: z.string().max(100).optional().nullable(),
    accountNumber: z.string().regex(/^\d{6,18}$/).optional().nullable(),
    paymentQrCode: z.string().optional().nullable(),
  }).strict()
};

module.exports = {
  registerSchema,
  loginSchema,
  otpSchema,
  resendOtpSchema,
  updateProfileSchema
};
