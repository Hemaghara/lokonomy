const User = require("../models/User");
const Business = require("../models/Business");
const Job = require("../models/Job");
const Order = require("../models/Order");

exports.getFraudSignals = async (req, res) => {
  try {
    const now = new Date();
    const signals = [];

    try {
      const dupPhones = await User.aggregate([
        { $match: { phoneNumber: { $ne: null, $ne: "" } } },
        {
          $group: {
            _id: "$phoneNumber",
            count: { $sum: 1 },
            users: {
              $push: {
                id: "$_id",
                name: "$name",
                email: "$email",
                status: "$status",
              },
            },
          },
        },
        { $match: { count: { $gt: 1 } } },
        { $limit: 20 },
      ]);
      dupPhones.forEach((d) => {
        signals.push({
          type: "duplicate_phone",
          severity: "high",
          title: "Multiple Accounts – Same Phone",
          detail: `Phone ${d._id} is used by ${d.count} accounts.`,
          affectedCount: d.count,
          entities: d.users.slice(0, 5),
          riskScore: Math.min(100, d.count * 15),
          actionPath: "/admin/users",
        });
      });
    } catch (_) {}

    try {
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      const reviewBombing = await Business.aggregate([
        {
          $project: {
            businessName: 1,
            district: 1,
            recentReviews: {
              $filter: {
                input: { $ifNull: ["$reviews", []] },
                as: "r",
                cond: { $gte: ["$$r.createdAt", oneHourAgo] },
              },
            },
          },
        },
        { $addFields: { recentCount: { $size: "$recentReviews" } } },
        { $match: { recentCount: { $gte: 10 } } },
        { $limit: 20 },
      ]);

      reviewBombing.forEach((biz) => {
        signals.push({
          type: "review_bombing",
          severity: "critical",
          title: "Review Bombing Detected",
          detail: `"${biz.businessName}" received ${biz.recentCount} reviews in the last hour.`,
          affectedCount: biz.recentCount,
          entities: [{ id: biz._id, name: biz.businessName }],
          riskScore: Math.min(100, biz.recentCount * 10),
          actionPath: `/admin/business/${biz._id}`,
        });
      });
    } catch (_) {}

    try {
      const recentJobs = await Job.find({
        createdAt: { $gte: new Date(now - 7 * 24 * 60 * 60 * 1000) },
      })
        .select("position description district poster")
        .lean();
      const seen = {};
      recentJobs.forEach((j) => {
        const key = `${(j.position || "").toLowerCase().trim()}|${(j.district || "").toLowerCase()}`;
        if (!seen[key]) seen[key] = [];
        seen[key].push(j);
      });
      Object.entries(seen).forEach(([key, jobs]) => {
        if (jobs.length >= 3) {
          const uniquePosters = [...new Set(jobs.map((j) => String(j.poster)))];
          if (uniquePosters.length >= 2) {
            signals.push({
              type: "duplicate_jobs",
              severity: "medium",
              title: "Duplicate Job Posts",
              detail: `"${key.split("|")[0]}" in ${key.split("|")[1]} posted by ${uniquePosters.length} different accounts (${jobs.length} total).`,
              affectedCount: jobs.length,
              entities: jobs
                .slice(0, 3)
                .map((j) => ({ id: j._id, name: j.position })),
              riskScore: Math.min(100, uniquePosters.length * 20),
              actionPath: "/admin/jobs",
            });
          }
        }
      });
    } catch (_) {}

    try {
      const selfOrders = await Order.aggregate([
        {
          $lookup: {
            from: "products",
            localField: "productId",
            foreignField: "_id",
            as: "product",
          },
        },
        { $unwind: { path: "$product", preserveNullAndEmptyArrays: true } },
        {
          $project: {
            buyer: "$buyer",
            seller: "$product.seller",
            productName: "$product.productName",
            amount: "$totalPrice",
            createdAt: 1,
          },
        },
        {
          $match: {
            $expr: { $eq: ["$buyer", "$seller"] },
          },
        },
        { $limit: 20 },
      ]);
      selfOrders.forEach((o) => {
        signals.push({
          type: "wash_trading",
          severity: "critical",
          title: "Self-Purchase (Wash Trading)",
          detail: `User purchased their own product "${o.productName || "N/A"}" for ₹${o.amount || 0}.`,
          affectedCount: 1,
          entities: [{ id: o._id, name: o.productName || "Order" }],
          riskScore: 90,
          actionPath: "/admin/marketplace/orders",
        });
      });
    } catch (_) {}

    const order = { critical: 0, high: 1, medium: 2, low: 3 };
    signals.sort((a, b) => (order[a.severity] || 3) - (order[b.severity] || 3));

    res.json({
      total: signals.length,
      critical: signals.filter((s) => s.severity === "critical").length,
      high: signals.filter((s) => s.severity === "high").length,
      medium: signals.filter((s) => s.severity === "medium").length,
      signals,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.getUserRiskScore = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password").lean();
    if (!user) return res.status(404).json({ message: "User not found" });

    let riskScore = 0;
    const flags = [];

    if (user.phoneNumber) {
      const count = await User.countDocuments({
        phoneNumber: user.phoneNumber,
      });
      if (count > 1) {
        riskScore += 30;
        flags.push(`Shared phone number with ${count - 1} other account(s)`);
      }
    }

    if (user.status === "suspended") {
      riskScore += 20;
      flags.push("Account currently suspended");
    }
    if (user.status === "banned") {
      riskScore += 40;
      flags.push("Account currently banned");
    }

    if (!user.lastLoginDate) {
      riskScore += 15;
      flags.push("Never logged in after registration");
    }

    if (user.loyaltyPoints === 0 && user.subscription?.plan !== "free") {
      riskScore += 10;
      flags.push("Paid subscription with zero engagement points");
    }

    riskScore = Math.min(100, riskScore);

    res.json({
      userId: user._id,
      name: user.name,
      email: user.email,
      riskScore,
      flags,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.getBusinessScore = async (req, res) => {
  try {
    const business = await Business.findById(req.params.id).lean();
    if (!business)
      return res.status(404).json({ message: "Business not found" });

    let score = 50;
    const signals = [];

    if (business.verificationStatus === "verified") {
      score += 20;
      signals.push({
        type: "positive",
        label: "Identity Verified",
        points: 20,
      });
    } else if (business.verificationStatus === "rejected") {
      score -= 30;
      signals.push({
        type: "negative",
        label: "Verification Rejected",
        points: -30,
      });
    } else {
      signals.push({
        type: "neutral",
        label: "Verification Pending",
        points: 0,
      });
    }

    if (business.reviews?.length > 0) {
      const avg =
        business.reviews.reduce((acc, curr) => acc + curr.rating, 0) /
        business.reviews.length;
      if (avg >= 4.5) {
        score += 15;
        signals.push({
          type: "positive",
          label: "Exceptional Rating",
          points: 15,
        });
      } else if (avg < 2.5) {
        score -= 20;
        signals.push({ type: "negative", label: "Poor Ratings", points: -20 });
      }

      if (business.reviews.length > 50) {
        score += 10;
        signals.push({
          type: "positive",
          label: "High Review Volume",
          points: 10,
        });
      }
    }

    if (business.isFeatured) {
      score += 10;
      signals.push({
        type: "positive",
        label: "Featured Business",
        points: 10,
      });
    }

    score = Math.max(0, Math.min(100, score));

    res.json({ businessId: business._id, score, signals });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
