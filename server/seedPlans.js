const mongoose = require("mongoose");
const Plan = require("./models/Plan");
require("dotenv").config();

const PLAN_DATA = [
  {
    name: "Free",
    slug: "free",
    prices: { 3: 0, 6: 0, 12: 0 },
    limits: {
      productsUploaded: 10,
      storiesPosted: 15,
      jobsPosted: 5,
      analytics: true,
      featuredListings: false,
      prioritySupport: false,
      chatMessaging: true,
      couponsPerMonth: 0,
      bookingEnabled: false,
      customUrl: false,
      removeBranding: false,
      aiInsights: "none",
      autoResponder: false,
      promotedListings: false,
      guaranteeBadge: false,
      commissionRate: 5,
    },
  },
  {
    name: "Silver",
    slug: "silver",
    prices: { 3: 199, 6: 349, 12: 599 },
    limits: {
      productsUploaded: 50,
      storiesPosted: 100,
      jobsPosted: 5,
      analytics: true,
      featuredListings: false,
      prioritySupport: false,
      chatMessaging: true,
      couponsPerMonth: 2,
      bookingEnabled: false,
      customUrl: false,
      removeBranding: false,
      aiInsights: "none",
      autoResponder: false,
      promotedListings: false,
      guaranteeBadge: false,
      commissionRate: 4,
    },
  },
  {
    name: "Gold",
    slug: "gold",
    prices: { 3: 399, 6: 699, 12: 1199 },
    limits: {
      productsUploaded: 200,
      storiesPosted: 500,
      jobsPosted: 15,
      analytics: true,
      featuredListings: true,
      prioritySupport: false,
      chatMessaging: true,
      couponsPerMonth: 10,
      bookingEnabled: true,
      customUrl: false,
      removeBranding: false,
      aiInsights: "basic",
      autoResponder: true,
      promotedListings: false,
      guaranteeBadge: false,
      commissionRate: 3,
    },
  },
  {
    name: "Platinum",
    slug: "platinum",
    prices: { 3: 799, 6: 1399, 12: 2399 },
    limits: {
      productsUploaded: 999999, 
      storiesPosted: 999999,
      jobsPosted: 999999,
      analytics: true,
      featuredListings: true,
      prioritySupport: true,
      chatMessaging: true,
      couponsPerMonth: 999999,
      bookingEnabled: true,
      customUrl: true,
      removeBranding: true,
      aiInsights: "advanced",
      autoResponder: true,
      promotedListings: true,
      guaranteeBadge: true,
      commissionRate: 2,
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
