const Business = require("../models/Business");
const Product = require("../models/Product");

exports.getAllBusinessReviews = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 6;
    const skip = (page - 1) * limit;
    const rating = req.query.rating ? parseInt(req.query.rating) : null;

    const pipeline = [
      { $unwind: "$reviews" },
      {
        $project: {
          _id: 0,
          businessId: "$_id",
          businessName: 1,
          reviewId: "$reviews._id",
          userId: "$reviews.userId",
          userName: "$reviews.userName",
          rating: "$reviews.rating",
          comment: "$reviews.comment",
          createdAt: "$reviews.createdAt",
        },
      },
      { $sort: { createdAt: -1 } },
    ];

    if (rating) {
      pipeline.push({ $match: { rating: rating } });
    }

    const allReviews = await Business.aggregate(pipeline);
    const total = allReviews.length;
    const reviews = allReviews.slice(skip, skip + limit);

    res.json({
      reviews,
      page,
      pages: Math.ceil(total / limit),
      total,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
exports.getAllProductReviews = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 6;
    const skip = (page - 1) * limit;
    const rating = req.query.rating ? parseInt(req.query.rating) : null;

    const pipeline = [
      { $unwind: "$reviews" },
      {
        $project: {
          _id: 0,
          productId: "$_id",
          productName: 1,
          reviewId: "$reviews._id",
          userId: "$reviews.userId",
          userName: "$reviews.userName",
          rating: "$reviews.rating",
          comment: "$reviews.comment",
          createdAt: "$reviews.createdAt",
        },
      },
      { $sort: { createdAt: -1 } },
    ];

    if (rating) {
      pipeline.push({ $match: { rating: rating } });
    }

    const allReviews = await Product.aggregate(pipeline);
    const total = allReviews.length;
    const reviews = allReviews.slice(skip, skip + limit);

    res.json({
      reviews,
      page,
      pages: Math.ceil(total / limit),
      total,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
exports.deleteBusinessReview = async (req, res) => {
  try {
    const { businessId, reviewId } = req.params;

    const business = await Business.findById(businessId);
    if (!business) {
      return res.status(404).json({ message: "Business not found" });
    }

    business.reviews = business.reviews.filter(
      (rev) => rev._id.toString() !== reviewId,
    );

    if (business.reviews.length > 0) {
      const totalRating = business.reviews.reduce(
        (acc, item) => item.rating + acc,
        0,
      );
      business.rating = totalRating / business.reviews.length;
    } else {
      business.rating = 0;
    }

    await business.save();
    res.json({ message: "Review deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
exports.deleteProductReview = async (req, res) => {
  try {
    const { productId, reviewId } = req.params;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    product.reviews = product.reviews.filter(
      (rev) => rev._id.toString() !== reviewId,
    );
    product.numReviews = product.reviews.length;

    if (product.reviews.length > 0) {
      const totalRating = product.reviews.reduce(
        (acc, item) => item.rating + acc,
        0,
      );
      product.rating = totalRating / product.reviews.length;
    } else {
      product.rating = 0;
    }

    await product.save();
    res.json({ message: "Review deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
exports.getBusinessReviewAnalytics = async (req, res) => {
  try {
    const { businessId } = req.params;
    const business = await Business.findById(businessId);
    if (!business) {
      return res.status(404).json({ message: "Business not found" });
    }

    const ratingDistribution = {
      5: 0,
      4: 0,
      3: 0,
      2: 0,
      1: 0,
    };

    business.reviews.forEach((rev) => {
      if (ratingDistribution[rev.rating] !== undefined) {
        ratingDistribution[rev.rating]++;
      }
    });

    res.json({
      businessName: business.businessName,
      totalReviews: business.reviews.length,
      averageRating: business.rating,
      ratingDistribution,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
