const mongoose = require("mongoose");
require("dotenv").config();
const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder("ipv4first");
}

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB");

  const User = require("../models/User");
  const Business = require("../models/Business");

  const users = await User.find({ district: { $in: [null, ""] } });
  console.log(`Found ${users.length} users with missing district.`);

  for (const user of users) {
    let district = "";
    let taluka = "";

    // 1. Try to find from coordinates
    if (user.latitude && user.longitude) {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${user.latitude}&lon=${user.longitude}&format=json&accept-language=en`);
        const data = await res.json();
        if (data && data.address) {
          const addr = data.address;
          const rawDistrict = addr.state_district || addr.county || addr.city || "";
          district = rawDistrict.replace(/ District/i, "").trim();
          taluka = (addr.suburb || addr.town || addr.village || addr.city_district || "").trim();
          console.log(`Found district from coordinates for ${user.name}: ${district}`);
        }
      } catch (err) {
        console.log(`Geocoding failed for user ${user.name}: ${err.message}`);
      }
    }

    // 2. Try to find from their registered business
    if (!district) {
      const biz = await Business.findOne({ ownerId: user._id });
      if (biz && biz.district) {
        district = biz.district;
        taluka = biz.taluka || "";
        console.log(`Found district from owned business for ${user.name}: ${district}`);
      }
    }

    // 3. Try to find from reviews they wrote
    if (!district) {
      const biz = await Business.findOne({ "reviews.userId": user._id });
      if (biz && biz.district) {
        district = biz.district;
        taluka = biz.taluka || "";
        console.log(`Found district from reviewed business for ${user.name}: ${district}`);
      }
    }

    // 4. Default to Ahmedabad (since it's the main district in the screenshot)
    if (!district) {
      district = "Ahmedabad";
      taluka = "Ahmedabad";
      console.log(`Defaulted district to Ahmedabad for ${user.name}`);
    }

    user.district = district;
    user.taluka = taluka;
    await user.save();
    console.log(`Updated ${user.name} to ${district}, ${taluka}`);
  }

  console.log("All done!");
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
