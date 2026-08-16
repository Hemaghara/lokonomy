const User = require("../models/User");
const Business = require("../models/Business");
const logger = require("../utils/logger");

const getInfluencerTier = (reviewsCount, helpfulCount) => {
  if (reviewsCount >= 30 && helpfulCount >= 50) return "ambassador";
  if (reviewsCount >= 15 && helpfulCount >= 20) return "influencer";
  if (reviewsCount >= 5 && helpfulCount >= 5) return "rising_star";
  return "none";
};

exports.updateInfluencerStatus = async (req, res) => {
  try {
    const userId = req.user.id;

    const businesses = await Business.find({ "reviews.userId": userId });

    let reviewCount = 0;
    businesses.forEach(biz => {
      biz.reviews.forEach(rev => {
        if (rev.userId && rev.userId.toString() === userId) {
          reviewCount++;
        }
      });
    });

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const currentHelpful = user.helpfulVotes || 0;
    const newTier = getInfluencerTier(reviewCount, currentHelpful);
    const oldTier = user.influencerBadge || "none";

    user.reviewCount = reviewCount;
    user.influencerBadge = newTier;

    if (newTier !== "none" && oldTier === "none") {
      user.influencerSince = new Date();
    } else if (newTier === "none") {
      user.influencerSince = null;
    }

    await user.save();

    res.json({
      success: true,
      message: "Influencer status updated",
      influencerStats: {
        reviewCount,
        helpfulVotes: currentHelpful,
        influencerBadge: newTier,
        influencerSince: user.influencerSince
      }
    });

  } catch (err) {
    logger.error({ err }, "Error updating influencer status");
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.voteHelpfulReview = async (req, res) => {
  try {
    const { reviewerId, businessId, reviewId } = req.body;
    if (!reviewerId || !businessId || !reviewId) {
      return res.status(400).json({ success: false, message: "ReviewerId, businessId, and reviewId are required" });
    }

    if (reviewerId.toString() === req.user.id) {
      return res.status(400).json({ success: false, message: "You cannot vote your own review as helpful" });
    }

    const business = await Business.findById(businessId);
    if (!business) {
      return res.status(404).json({ success: false, message: "Business not found" });
    }

    const review = business.reviews.id(reviewId);
    if (!review) {
      return res.status(404).json({ success: false, message: "Review not found" });
    }

    if (review.helpfulVotes && review.helpfulVotes.includes(req.user.id)) {
      return res.status(400).json({ success: false, message: "You have already voted this review as helpful" });
    }

    if (!review.helpfulVotes) review.helpfulVotes = [];
    review.helpfulVotes.push(req.user.id);
    await business.save();

    const reviewer = await User.findById(reviewerId);
    if (!reviewer) {
      return res.status(404).json({ success: false, message: "Reviewer not found" });
    }

    reviewer.helpfulVotes = (reviewer.helpfulVotes || 0) + 1;

    const updatedTier = getInfluencerTier(reviewer.reviewCount || 0, reviewer.helpfulVotes);
    
    if (updatedTier !== "none" && reviewer.influencerBadge === "none") {
      reviewer.influencerSince = new Date();
    }
    reviewer.influencerBadge = updatedTier;
    await reviewer.save();

    res.json({
      success: true,
      message: "Voted review as helpful successfully",
      reviewerBadge: updatedTier,
      helpfulVotes: reviewer.helpfulVotes
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};


exports.getLocalInfluencers = async (req, res) => {
  try {
    const { district } = req.query;
    const filter = { influencerBadge: { $exists: true, $nin: ["none", null] } };
    if (district) {
      filter.district = district;
    }

    const influencers = await User.find(filter)
      .select("name district taluka influencerBadge reviewCount helpfulVotes influencerSince")
      .sort({ helpfulVotes: -1, reviewCount: -1 })
      .limit(10);

    res.json({ success: true, influencers });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getInfluencerTier = getInfluencerTier;
