const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const User = require("./models/User");
const Business = require("./models/Business");
const Product = require("./models/Product");
const Job = require("./models/Job");
const Story = require("./models/Story");

const MONGO_URI = process.env.MONGO_URI;

const dummyUsers = [
  {
    name: "Rajesh Kumar",
    email: "rajesh@example.com",
    password: "password123",
    district: "Ahmedabad",
    taluka: "Ahmedabad City",
  },
  {
    name: "Priya Patel",
    email: "priya@example.com",
    password: "password123",
    district: "Surat",
    taluka: "Surat City",
  },
  {
    name: "Amit Mehta",
    email: "amit@example.com",
    password: "password123",
    district: "Rajkot",
    taluka: "Rajkot",
  },
];

const dummyBusinesses = [
  {
    businessName: "Modern Electronics",
    description:
      "Best electronics shop in Ahmedabad with all latest gadgets and home appliances.",
    businessType: "Shop",
    mainCategory: "Electronics",
    subCategory: "Mobile & Accessories",
    contactNumber: "9876543210",
    address: "CG Road, Navrangpura",
    district: "Ahmedabad",
    taluka: "Ahmedabad City",
    ownerName: "Rajesh Kumar",
    rating: 4.5,
    verified: true,
  },
  {
    businessName: "Fashion Hub",
    description:
      "Trendy clothes for men and women. Latest collections every week.",
    businessType: "Shop",
    mainCategory: "Fashion",
    subCategory: "Clothing",
    contactNumber: "9876543211",
    address: "Varachha Road",
    district: "Surat",
    taluka: "Surat City",
    ownerName: "Priya Patel",
    rating: 4.8,
    verified: true,
  },
];

const dummyProducts = [
  {
    mainCategory: "Electronics",
    subCategory: "Mobile Phones",
    productName: "iPhone 13 Pro",
    description:
      "Slightly used iPhone 13 Pro, 256GB, Sierra Blue. Excellent condition.",
    priceType: "sell",
    price: 65000,
    district: "Ahmedabad",
    taluka: "Ahmedabad City",
    address: "Satellite Area",
    sellerProfile: {
      name: "Rajesh Kumar",
      contactNumber: "9876543210",
      contactPreference: "call",
    },
  },
  {
    mainCategory: "Home & Living",
    subCategory: "Furniture",
    productName: "Wooden Dining Table",
    description: "6-seater solid wood dining table. 2 years old.",
    priceType: "sell",
    price: 15000,
    district: "Surat",
    taluka: "Surat City",
    address: "Adajan",
    sellerProfile: {
      name: "Priya Patel",
      contactNumber: "9876543211",
      contactPreference: "whatsapp",
      whatsappNumber: "9876543211",
    },
  },
];

const dummyJobs = [
  {
    position: "Sales Executive",
    location: "Ahmedabad",
    vacancies: 2,
    education: "Graduate",
    district: "Ahmedabad",
    experience: "1-2 years",
    skills: "Communication, Sales, Basic Computer",
    salary: "15,000 - 20,000",
    gender: "Both",
    posterName: "Rajesh Kumar",
    posterEmail: "rajesh@example.com",
    posterContact: "9876543210",
  },
  {
    position: "Delivery Boy",
    location: "Surat",
    vacancies: 5,
    education: "10th pass",
    district: "Surat",
    experience: "Fresher",
    skills: "Driving, Local Area Knowledge",
    salary: "12,000 + Incentive",
    gender: "Male",
    posterName: "Priya Patel",
    posterEmail: "priya@example.com",
    posterContact: "9876543211",
  },
];

const dummyStories = [
  {
    title: "Big Diwali Sale Starting Tomorrow!",
    content:
      "Up to 50% off on all items in Modern Electronics. Visit us at CG Road.",
    type: "Sale / Offer",
    district: "Ahmedabad",
    taluka: "Ahmedabad City",
    author: "Rajesh Kumar",
  },
  {
    title: "New Collection Launch",
    content: "Check out our new winter collection at Fashion Hub Surat.",
    type: "Trending Offer",
    district: "Surat",
    taluka: "Surat City",
    author: "Priya Patel",
  },
];

async function seedData() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB for seeding...");

    await User.deleteMany({});
    await Business.deleteMany({});
    await Product.deleteMany({});
    await Job.deleteMany({});
    await Story.deleteMany({});
    console.log("Cleared existing data.");

    const hashedUsers = await Promise.all(
      dummyUsers.map(async (user) => {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
        return user;
      }),
    );

    const createdUsers = await User.insertMany(hashedUsers);
    console.log(`Created ${createdUsers.length} users.`);

    const rajesh = createdUsers.find((u) => u.email === "rajesh@example.com");
    const priya = createdUsers.find((u) => u.email === "priya@example.com");

    const businessesWithIds = dummyBusinesses.map((b) => {
      if (b.ownerName === "Rajesh Kumar") b.ownerId = rajesh._id;
      if (b.ownerName === "Priya Patel") b.ownerId = priya._id;
      return b;
    });
    await Business.insertMany(businessesWithIds);
    console.log("Created dummy businesses.");

    await Product.insertMany(dummyProducts);
    console.log("Created dummy products.");

    const jobsWithIds = dummyJobs.map((j) => {
      if (j.posterName === "Rajesh Kumar") j.posterId = rajesh._id;
      if (j.posterName === "Priya Patel") j.posterId = priya._id;
      return j;
    });
    await Job.insertMany(jobsWithIds);
    console.log("Created dummy jobs.");

    const storiesWithIds = dummyStories.map((s) => {
      if (s.author === "Rajesh Kumar") s.authorId = rajesh._id;
      if (s.author === "Priya Patel") s.authorId = priya._id;
      return s;
    });
    await Story.insertMany(storiesWithIds);
    console.log("Created dummy stories.");

    console.log("Seeding completed successfully!");
    process.exit();
  } catch (error) {
    console.error("Error seeding data:", error);
    process.exit(1);
  }
}

seedData();
