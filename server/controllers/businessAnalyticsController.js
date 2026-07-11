const Business = require("../models/Business");
const Product = require("../models/Product");
const Job = require("../models/Job");
const logger = require("../utils/logger");

exports.getBusinessAnalytics = async (req, res) => {
  try {
    const userId = req.user.id;

    // Fetch the business profile of the user
    const business = await Business.findOne({ ownerId: userId });

    if (!business) {
      return res.status(404).json({ success: false, message: "Business profile not found" });
    }

    // Get basic stats from the business profile
    const totalVisits = business.visits || 0;
    const dailyVisits = business.dailyVisits || [];
    const rating = business.rating || 0;
    const reviewsCount = business.reviews?.length || 0;

    // Get product stats
    const products = await Product.find({ sellerId: userId });
    const totalProducts = products.length;
    let totalProductViews = 0; 
    products.forEach((p) => {
      if (p.views) totalProductViews += p.views;
    });

    // Get job stats
    const jobs = await Job.find({ posterId: userId });
    const totalJobs = jobs.length;
    let totalJobViews = 0;
    let totalJobApplications = 0;
    jobs.forEach((j) => {
      if (j.views) totalJobViews += j.views;
      if (j.applications) totalJobApplications += j.applications.length;
    });

    // Format daily visits for charts
    const chartData = dailyVisits.slice(-30).map(v => ({
      date: v.date,
      visits: v.count
    }));

    res.json({
      success: true,
      stats: {
        totalVisits,
        rating,
        reviewsCount,
        totalProducts,
        totalJobs,
        totalJobApplications,
        totalProductViews,
        totalJobViews
      },
      chartData
    });
  } catch (err) {
    logger.error({ err, userId: req.user?.id }, "Error in getBusinessAnalytics");
    res.status(500).json({ success: false, message: err.message });
  }
};
