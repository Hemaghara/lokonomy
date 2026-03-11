const mongoose = require("mongoose");
const Plan = require("./models/Plan");
require("dotenv").config();

const PLAN_DATA = [
  {
    name: "Free",
    slug: "free",
    prices: { 3: 0, 6: 0, 12: 0 },
    limits: {
      productsUpload: 3,
      storiesPost: 5,
      jobsPost: 2,
      analytics: false,
      featuredListings: false,
      prioritySupport: false,
      chatMessaging: true,
    },
  },
  {
    name: "Silver",
    slug: "silver",
    prices: { 3: 1, 6: 349, 12: 599 },
    limits: {
      productsUpload: 20,
      storiesPost: 50,
      jobsPost: 10,
      analytics: false,
      featuredListings: false,
      prioritySupport: false,
      chatMessaging: true,
    },
  },
  {
    name: "Gold",
    slug: "gold",
    prices: { 3: 399, 6: 699, 12: 1199 },
    limits: {
      productsUpload: 100,
      storiesPost: 200,
      jobsPost: 50,
      analytics: true,
      featuredListings: false,
      prioritySupport: false,
      chatMessaging: true,
    },
  },
  {
    name: "Platinum",
    slug: "platinum",
    prices: { 3: 799, 6: 1399, 12: 2399 },
    limits: {
      productsUpload: 999999, // use a large number instead of infinity in JS for DB compatibility
      storiesPost: 999999,
      jobsPost: 999999,
      analytics: true,
      featuredListings: true,
      prioritySupport: true,
      chatMessaging: true,
    },
  },
];

const seedPlans = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB for seeding plans...");

    for (const p of PLAN_DATA) {
      await Plan.findOneAndUpdate({ slug: p.slug }, p, {
        upsert: true,
        new: true,
      });
    }

    console.log("Plans seeded successfully!");
    process.exit(0);
  } catch (err) {
    console.error("Error seeding plans:", err);
    process.exit(1);
  }
};

seedPlans();
