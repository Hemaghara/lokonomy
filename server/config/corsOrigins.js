
const allowedOrigins = [
  process.env.APP_URL,
  "https://lokonomy.vercel.app",
  "https://lokonomy.onrender.com",
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:3000",
].filter(Boolean);

module.exports = allowedOrigins;
