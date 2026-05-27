const Leaderboard = require("../models/Leaderboard");
const Business = require("../models/Business");
const Order = require("../models/Order");
const Story = require("../models/Story");
const logger = require("../utils/logger");

exports.getLeaderboard = async (req, res) => {
  try {
    const { district, category, month, year, limit = 10 } = req.query;

    const now = new Date();
    const queryMonth = parseInt(month) || now.getMonth() + 1;
    const queryYear = parseInt(year) || now.getFullYear();

    const query = { month: queryMonth, year: queryYear };
    if (district) query.district = district;
    if (category) query.category = category;

    let entries;
    const isFiltered = district && category;

    if (isFiltered) {
      entries = await Leaderboard.find(query)
        .sort({ rank: 1 })
        .limit(parseInt(limit))
        .populate("businessId", "businessName logo rating verified verificationStatus");
    } else {
      entries = await Leaderboard.find(query)
        .sort({ score: -1 })
        .limit(parseInt(limit))
        .populate("businessId", "businessName logo rating verified verificationStatus");

      entries = entries.map((entry, idx) => {
        const obj = entry.toObject ? entry.toObject() : entry;
        return {
          ...obj,
          rank: idx + 1,
        };
      });
    }


    const distinctDistricts = await Leaderboard.distinct("district", {
      month: queryMonth,
      year: queryYear,
    });
    const distinctCategories = await Leaderboard.distinct("category", {
      month: queryMonth,
      year: queryYear,
    });

    res.json({
      success: true,
      leaderboard: entries,
      filters: {
        districts: distinctDistricts,
        categories: distinctCategories,
      },
      period: { month: queryMonth, year: queryYear },
    });
  } catch (err) {
    logger.error({ err }, "Error in getLeaderboard");
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.calculateLeaderboard = async (req, res) => {
  try {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();


    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59);

    const businesses = await Business.find({});

    const scores = [];

    for (const biz of businesses) {
      if (!biz.district || !biz.mainCategory) continue;


      const orderCount = await Order.countDocuments({
        seller: biz.ownerId,
        createdAt: { $gte: startOfMonth, $lte: endOfMonth },
      });


      const reviewCount = biz.reviews ? biz.reviews.length : 0;
      const reviewAvg = biz.rating || 0;


      const stories = await Story.find({
        authorId: biz.ownerId,
        createdAt: { $gte: startOfMonth, $lte: endOfMonth },
      });
      const storyEngagement = stories.reduce(
        (acc, s) => acc + (s.views || 0) + (s.likes?.length || 0) * 2 + (s.shares || 0) * 3,
        0
      );


      const monthVisits = (biz.dailyVisits || [])
        .filter((v) => {
          const d = new Date(v.date);
          return d >= startOfMonth && d <= endOfMonth;
        })
        .reduce((acc, v) => acc + v.count, 0);

      const score =
        orderCount * 40 +
        reviewAvg * 25 +
        monthVisits * 0.15 +
        storyEngagement * 0.1 +
        reviewCount * 10;

      scores.push({
        businessId: biz._id,
        businessName: biz.businessName,
        businessLogo: biz.logo,
        district: biz.district,
        category: biz.mainCategory,
        score: Math.round(score * 100) / 100,
        metrics: {
          orderCount,
          reviewAvg,
          reviewCount,
          responseTime: 0,
          storyEngagement,
          visitCount: monthVisits,
        },
      });
    }


    const groups = {};
    for (const entry of scores) {
      const key = `${entry.district}_${entry.category}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(entry);
    }


    await Leaderboard.deleteMany({ month, year });

    const toInsert = [];
    for (const key of Object.keys(groups)) {
      groups[key].sort((a, b) => b.score - a.score);
      groups[key].forEach((entry, idx) => {
        toInsert.push({
          ...entry,
          month,
          year,
          rank: idx + 1,
        });
      });
    }

    if (toInsert.length > 0) {
      await Leaderboard.insertMany(toInsert);
    }

    const message = `Leaderboard calculated: ${toInsert.length} entries for ${month}/${year}`;
    logger.info(message);

    if (res) {
      res.json({ success: true, message, count: toInsert.length });
    }
    return toInsert.length;
  } catch (err) {
    logger.error({ err }, "Error calculating leaderboard");
    if (res) {
      res.status(500).json({ success: false, message: err.message });
    }
    return 0;
  }
};


exports.getBusinessRanking = async (req, res) => {
  try {
    const { businessId } = req.params;
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    const entry = await Leaderboard.findOne({
      businessId,
      month,
      year,
    });

    if (!entry) {
      return res.json({
        success: true,
        ranking: null,
        message: "No ranking data for this month yet",
      });
    }


    const totalInCategory = await Leaderboard.countDocuments({
      district: entry.district,
      category: entry.category,
      month,
      year,
    });

    res.json({
      success: true,
      ranking: {
        ...entry.toObject(),
        totalInCategory,
      },
    });
  } catch (err) {
    logger.error({ err }, "Error in getBusinessRanking");
    res.status(500).json({ success: false, message: err.message });
  }
};
