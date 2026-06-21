const request = require("supertest");
const app = require("../server");
const User = require("../models/User");
const bcrypt = require("bcryptjs");

describe("Auth Routes", () => {
  describe("POST /api/auth/login", () => {
    beforeEach(async () => {
      const hash = await bcrypt.hash("ValidPass123!", 10);
      await User.create({
        name: "Test",
        email: "test@test.com",
        password: hash,
      });
    });

    it("should reject missing credentials", async () => {
      const res = await request(app).post("/api/auth/login").send({});
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it("should reject invalid email", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: "notanemail", password: "pass" });
      expect(res.status).toBe(400);
    });

    it("should reject wrong password", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: "test@test.com", password: "WrongPass123!" });
      expect(res.status).toBe(401);
    });

    it("should not expose user existence on wrong email", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: "nonexistent@test.com", password: "AnyPass123!" });
      expect(res.status).toBe(401);
      expect(res.body.message).toBe("Invalid email or password"); 
    });

    it("should block suspended user", async () => {
      await User.findOneAndUpdate(
        { email: "test@test.com" },
        { status: "suspended" },
      );
      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: "test@test.com", password: "ValidPass123!" });
      expect(res.status).toBe(403);
    });
  });

  describe("POST /api/auth/verify-otp", () => {
    it("should reject invalid OTP format", async () => {
      const res = await request(app)
        .post("/api/auth/verify-otp")
        .send({ email: "test@test.com", otp: "abc" });
      expect(res.status).toBe(400);
    });

    it("should reject expired OTP", async () => {
      await User.findOneAndUpdate(
        { email: "test@test.com" },
        { otp: "123456", otpExpires: new Date(Date.now() - 1000) },
      );
      const res = await request(app)
        .post("/api/auth/verify-otp")
        .send({ email: "test@test.com", otp: "123456" });
      expect(res.status).toBe(400);
    });
  });

  describe("POST /api/auth/resend-otp", () => {
    beforeEach(async () => {
      const hash = await bcrypt.hash("ValidPass123!", 10);
      await User.create({
        name: "Test",
        email: "test@test.com",
        password: hash,
      });
    });

    it("should reject missing email", async () => {
      const res = await request(app).post("/api/auth/resend-otp").send({});
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it("should reject invalid email format", async () => {
      const res = await request(app)
        .post("/api/auth/resend-otp")
        .send({ email: "invalid-email" });
      expect(res.status).toBe(400);
    });

    it("should reject nonexistent email", async () => {
      const res = await request(app)
        .post("/api/auth/resend-otp")
        .send({ email: "nonexistent@test.com" });
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it("should successfully generate and resend OTP for existing user", async () => {
      const res = await request(app)
        .post("/api/auth/resend-otp")
        .send({ email: "test@test.com" });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.devOtp).toBeDefined();

      const user = await User.findOne({ email: "test@test.com" }).select("+otp +otpExpires");
      expect(user.otp).toBeDefined();
      expect(user.otpExpires).toBeDefined();
    });
  });
});
