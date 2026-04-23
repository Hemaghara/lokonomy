const request = require("supertest");
const app = require("../server");
const Product = require("../models/Product");
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

describe("Order Race Condition", () => {
  let product, buyerToken1, buyerToken2;

  beforeEach(async () => {
    const hash = await bcrypt.hash("pass", 10);
    const seller = await User.create({
      name: "Seller",
      email: "s@test.com",
      password: hash,
    });
    const buyer1 = await User.create({
      name: "B1",
      email: "b1@test.com",
      password: hash,
    });
    const buyer2 = await User.create({
      name: "B2",
      email: "b2@test.com",
      password: hash,
    });

    product = await Product.create({
      productName: "Test",
      mainCategory: "Test",
      subCategory: "Test",
      description: "Test",
      priceType: "sell",
      price: 100,
      isSold: false,
      sellerId: seller._id,
      sellerProfile: {
        name: "Seller",
        contactNumber: "9876543210",
        contactPreference: "call",
      },
    });

    buyerToken1 = jwt.sign(
      { user: { id: buyer1._id } },
      process.env.JWT_SECRET || "test",
    );
    buyerToken2 = jwt.sign(
      { user: { id: buyer2._id } },
      process.env.JWT_SECRET || "test",
    );
  });

  it("should only allow one buyer to purchase the same product", async () => {
    const orderData = {
      productId: product._id,
      paymentMethod: "upi",
      shippingAddress: "123 Test St",
      contactNumber: "9876543210",
    };

    const [res1, res2] = await Promise.all([
      request(app)
        .post("/api/orders")
        .set("Authorization", `Bearer ${buyerToken1}`)
        .send(orderData),
      request(app)
        .post("/api/orders")
        .set("Authorization", `Bearer ${buyerToken2}`)
        .send(orderData),
    ]);

    const successes = [res1, res2].filter((r) => r.status === 201);
    const failures = [res1, res2].filter((r) => r.status === 400);

    expect(successes).toHaveLength(1);
    expect(failures).toHaveLength(1);
  });
});
