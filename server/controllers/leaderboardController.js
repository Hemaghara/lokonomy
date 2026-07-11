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

    const businesses = await Business.find({}).lean();

    // Bulk calculate Order Counts
    const orderCounts = await Order.aggregate([
      { $match: { createdAt: { $gte: startOfMonth, $lte: endOfMonth } } },
      { $group: { _id: "$seller", count: { $sum: 1 } } }
    ]);
    const orderMap = new Map(orderCounts.map(o => [o._id.toString(), o.count]));

    // Bulk calculate Story Engagement
    const storyAgg = await Story.aggregate([
      { $match: { createdAt: { $gte: startOfMonth, $lte: endOfMonth } } },
      { 
        $group: { 
          _id: "$authorId", 
          views: { $sum: { $ifNull: ["$views", 0] } },
          likesCount: { $sum: { $size: { $ifNull: ["$likes", []] } } },
          shares: { $sum: { $ifNull: ["$shares", 0] } }
        }
      }
    ]);
    const storyMap = new Map(storyAgg.map(s => [
      s._id.toString(), 
      s.views + (s.likesCount * 2) + (s.shares * 3)
    ]));

    const scores = [];

    for (const biz of businesses) {
      if (!biz.district || !biz.mainCategory) continue;

      const ownerIdStr = biz.ownerId ? biz.ownerId.toString() : "";
      const orderCount = orderMap.get(ownerIdStr) || 0;
      const storyEngagement = storyMap.get(ownerIdStr) || 0;

      const reviewCount = biz.reviews ? biz.reviews.length : 0;
      const reviewAvg = biz.rating || 0;


      const monthStr = month.toString().padStart(2, '0');
      const prefix = `${year}-${monthStr}`;

      const monthVisits = (biz.dailyVisits || [])
        .filter((v) => v.date && v.date.startsWith(prefix))
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
      const bulkOps = toInsert.map(entry => ({
        updateOne: {
          filter: { businessId: entry.businessId, month: entry.month, year: entry.year },
          update: { $set: entry },
          upsert: true
        }
      }));
      
      const currentBusinessIds = toInsert.map(e => e.businessId);
      bulkOps.push({
        deleteMany: {
          filter: { month, year, businessId: { $nin: currentBusinessIds } }
        }
      });
      
      await Leaderboard.bulkWrite(bulkOps);
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
