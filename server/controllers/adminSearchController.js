const User = require("../models/User");
const Business = require("../models/Business");
const Job = require("../models/Job");
const Product = require("../models/Product");
const logger = require("../utils/logger");
const escapeRegex = require("../utils/escapeRegex");

exports.globalSearch = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query) {
      return res.json({ users: [], businesses: [], jobs: [], products: [] });
    }

    const searchRegex = new RegExp(escapeRegex(query), "i");

    const [users, businesses, jobs, products] = await Promise.all([
      User.find({
        $or: [
          { name: searchRegex },
          { email: searchRegex },
          { phoneNumber: searchRegex },
        ],
      })
        .select("name email phoneNumber avatar status")
        .limit(5),

      Business.find({
        $or: [
          { businessName: searchRegex },
          { mainCategory: searchRegex },
          { district: searchRegex },
        ],
      })
        .select("businessName mainCategory district logo banner status")
        .limit(5),

      Job.find({
        $or: [
          { position: searchRegex },
          { posterName: searchRegex },
          { skills: searchRegex },
        ],
      })
        .select("position posterName district status")
        .limit(5),

      Product.find({
        $or: [
          { productName: searchRegex },
          { mainCategory: searchRegex },
          { description: searchRegex },
        ],
      })
        .select("productName mainCategory productImages price status")
        .limit(5),
    ]);

    res.json({
      users,
      businesses,
      jobs,
      products,
    });
  } catch (error) {
    logger.error({ err: error }, "Global search error");
    res.status(500).json({ success: false, message: "Server error" });
  }
};
