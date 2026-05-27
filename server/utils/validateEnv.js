const required = [
  "MONGO_URI",
  "JWT_SECRET",
  "JWT_REFRESH_SECRET",
  "JWT_ADMIN_SECRET",
  "NODE_ENV",
  "VAPID_PUBLIC_KEY",
  "VAPID_PRIVATE_KEY",
  "RAZORPAY_KEY_ID",
  "RAZORPAY_KEY_SECRET",
];

const validateEnv = () => {
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}`,
    );
  }

  ["JWT_SECRET", "JWT_REFRESH_SECRET", "JWT_ADMIN_SECRET"].forEach((key) => {
    if (process.env[key] && process.env[key].length < 32) {
      throw new Error(`${key} must be at least 32 characters`);
    }
  });
};

module.exports = validateEnv;
