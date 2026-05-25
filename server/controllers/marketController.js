const Product = require("../models/Product");
const User = require("../models/User");
const Order = require("../models/Order");
const { uploadMedia } = require("../utils/uploadMedia");
const { awardPoints } = require("./rewardsController");
const { createNotification } = require("./notificationController");
const { buildLocationGeoJSON } = require("../utils/geoHelpers");
const logger = require("../utils/logger");

exports.getAllProducts = async (req, res) => {
  try {
    const {
      lat,
      lng,
      radius = 5000,
      district,
      mainCategory,
      subCategory,
      priceType,
    } = req.query;

    let query = {};

    if (lat && lng) {
      query.location = {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [parseFloat(lng), parseFloat(lat)],
          },
          $maxDistance: parseFloat(radius),
        },
      };
    } else if (district) {
      query.district = district;
    }

    if (mainCategory) query.mainCategory = mainCategory;
    if (subCategory) query.subCategory = subCategory;
    if (priceType && priceType !== "All") query.priceType = priceType;

    // EXCLUDE BANNED OR SUSPENDED FROM USER VIEW
    query.isFlagged = { $ne: true };
    query.isSuspended = { $ne: true };

    let products;
    if (lat && lng) {
      products = await Product.find(query).sort({ isFeatured: -1 });
    } else {
      products = await Product.find(query).sort({
        isFeatured: -1,
        createdAt: -1,
      });
    }
    const result = products.map((p) => {
      const obj = p.toObject();
      obj.isSold = obj.isSold === true;
      return obj;
    });
    res.json(result);
  } catch (err) {
    logger.error({ err }, "Error in getAllProducts");
    res.status(500).json({ message: err.message });
  }
};
exports.addProduct = async (req, res) => {
  try {
    const productData = req.body;

    if (productData.productImages && Array.isArray(productData.productImages)) {
      const uploadedImages = await Promise.all(
        productData.productImages.map(async (image) => {
          if (image.startsWith("data:image")) {
            const res = await uploadMedia(image, "products");
            return res.secure_url;
          }
          return image;
        }),
      );
      productData.productImages = uploadedImages;
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      logger.warn({ userId: req.user.id }, "addProduct: User not found");
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    productData.sellerProfile = productData.sellerProfile || {};
    productData.sellerProfile.name = user.name;
    productData.sellerId = req.user.id;

    const geoData = buildLocationGeoJSON(productData);
    if (geoData.location) {
      productData.location = geoData.location;
      productData.address = geoData.locationAddress;
      productData.locationAddress = geoData.locationAddress;
    }

    delete productData.latitude;
    delete productData.longitude;

    if (
      productData.isFeatured === true &&
      user.subscription?.plan !== "platinum"
    ) {
      productData.isFeatured = false;
    }

    if (productData.isAuction === "true" || productData.isAuction === true) {
      productData.isAuction = true;
      productData.startingPrice = Number(productData.startingPrice);
      productData.currentHighestBid = productData.startingPrice;
      productData.auctionEnd = new Date(productData.auctionEnd);
    } else {
      productData.isAuction = false;
    }

    const product = new Product(productData);
    const newProduct = await product.save();

    await User.findByIdAndUpdate(req.user.id, {
      $inc: { "usage.productsUploaded": 1 },
    });

    try {
      await awardPoints(
        req.user.id,
        "listing_product",
        `Listed product: ${newProduct.productName || newProduct.name || "New product"}`,
      );
    } catch (pointsErr) {
      logger.error(
        { err: pointsErr, userId: req.user.id },
        "points_award_failed in addProduct",
      );
    }

    logger.info(
      { productId: newProduct._id, userId: req.user.id },
      "Product added successfully",
    );
    res.status(201).json({ success: true, product: newProduct });
  } catch (err) {
    logger.error({ err }, "Error adding product");
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate(
      "sellerId",
      "upiId paymentQrCode phoneNumber name email bankName ifscCode branch accountNumber",
    );
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const FlashSale = require("../models/FlashSale");
    const now = new Date();
    // Fetch scheduled/active sales to update their statuses based on current time
    const pendingSales = await FlashSale.find({
      productId: product._id,
      status: { $in: ["scheduled", "active"] },
    });

    for (let sale of pendingSales) {
      let newStatus = sale.status;
      if (sale.status === "scheduled" && now >= sale.startTime && now < sale.endTime) {
        newStatus = "active";
      } else if ((sale.status === "scheduled" || sale.status === "active") && now >= sale.endTime) {
        newStatus = "ended";
      } else if (sale.status === "active" && sale.soldCount >= sale.maxQuantity) {
        newStatus = "ended";
      }
      if (newStatus !== sale.status) {
        sale.status = newStatus;
        await sale.save();
      }
    }

    const activeFlashSale = await FlashSale.findOne({
      productId: product._id,
      status: "active",
      startTime: { $lte: now },
      endTime: { $gte: now },
    });

    const productObj = product.toObject();
    productObj.isSold = productObj.isSold === true;
    productObj.activeFlashSale = activeFlashSale || null;

    res.json(productObj);
  } catch (err) {
    logger.error(
      { err, productId: req.params.id },
      "Error fetching product by ID",
    );
    res.status(500).json({ message: err.message });
  }
};

exports.getMyProducts = async (req, res) => {
  try {
    const products = await Product.find({ sellerId: req.user.id }).sort({
      createdAt: -1,
    });
    res.json(products);
  } catch (err) {
    logger.error({ err, userId: req.user.id }, "Error fetching my products");
    res.status(500).json({ message: err.message });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (product.sellerId.toString() !== req.user.id) {
      logger.warn(
        { productId: req.params.id, userId: req.user.id },
        "Unauthorized attempt to delete product",
      );
      return res
        .status(403)
        .json({ message: "You are not authorized to delete this product" });
    }

    await Product.findByIdAndDelete(req.params.id);
    logger.info(
      { productId: req.params.id, userId: req.user.id },
      "Product deleted successfully",
    );
    res.json({ success: true, message: "Product deleted successfully" });
  } catch (err) {
    logger.error({ err, productId: req.params.id }, "Error deleting product");
    res.status(500).json({ message: err.message });
  }
};
exports.addProductReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res
        .status(400)
        .json({ message: "Rating must be between 1 and 5" });
    }
    if (!comment || comment.trim().length < 3) {
      return res
        .status(400)
        .json({ message: "Please provide a comment (min 3 characters)" });
    }

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (product.sellerId.toString() === req.user.id) {
      return res
        .status(400)
        .json({ message: "You cannot review your own product" });
    }

    const completedOrder = await Order.findOne({
      product: req.params.id,
      buyer: req.user.id,
      paymentStatus: "completed",
    });
    if (!completedOrder) {
      return res.status(403).json({
        message: "You can only review products you have purchased.",
        requiresPurchase: true,
      });
    }

    const alreadyReviewed = product.reviews.find(
      (r) => r.userId.toString() === req.user.id,
    );
    if (alreadyReviewed) {
      return res
        .status(400)
        .json({ message: "You have already reviewed this product" });
    }

    const user = await User.findById(req.user.id);
    const review = {
      userId: req.user.id,
      userName: user.name,
      rating: Number(rating),
      comment: comment.trim(),
    };

    product.reviews.push(review);
    product.numReviews = product.reviews.length;
    product.rating =
      product.reviews.reduce((acc, item) => item.rating + acc, 0) /
      product.reviews.length;

    await product.save();

    const io = req.app.get("io");
    await createNotification({
      recipientId: product.sellerId.toString(),
      type: "review",
      title: "New Product Review",
      message: `${user.name} left a ${rating}★ review on ${product.productName || product.name || "your product"}.`,
      actionUrl: `/market/product/${product._id}`,
      metadata: { productId: product._id, rating },
      io,
    });

    if (Number(rating) === 5) {
      try {
        await awardPoints(
          req.user.id,
          "five_star_review",
          `5-star review on ${product.productName || product.name || "a product"}`,
        );
      } catch (pointsErr) {
        logger.error(
          { err: pointsErr, userId: req.user.id },
          "points_award_failed in addProductReview",
        );
      }
    }

    logger.info(
      { productId: product._id, userId: req.user.id, rating },
      "Review added successfully",
    );
    res
      .status(201)
      .json({ success: true, message: "Review added successfully" });
  } catch (err) {
    logger.error({ err }, "Error adding review");
    res.status(500).json({ message: err.message });
  }
};

exports.getProductReviews = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).select(
      "reviews rating numReviews productName",
    );
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    const sorted = [...product.reviews].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
    );
    res.json({
      success: true,
      reviews: sorted,
      avgRating: product.rating,
      reviewCount: product.numReviews,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.placeBid = async (req, res) => {
  try {
    const { amount } = req.body;
    const productId = req.params.id;

    if (!amount || isNaN(amount)) {
      return res.status(400).json({ message: "Invalid bid amount" });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (!product.isAuction) {
      return res
        .status(400)
        .json({ message: "This product is not for bidding" });
    }

    if (new Date() > new Date(product.auctionEnd)) {
      return res.status(400).json({ message: "Auction has ended" });
    }

    const minBid = Math.max(
      product.startingPrice || 0,
      product.currentHighestBid || 0,
    );
    if (amount <= minBid) {
      return res
        .status(400)
        .json({ message: `Bid must be higher than ${minBid}` });
    }

    const user = await User.findById(req.user.id);
    const bid = {
      userId: req.user.id,
      userName: user.name,
      amount: Number(amount),
      createdAt: new Date(),
    };

    product.bids.push(bid);
    product.currentHighestBid = amount;
    await product.save();

    const io = req.app.get("io");
    if (io) {
      io.emit("bidUpdate", {
        productId,
        currentHighestBid: amount,
        bidHistory: product.bids,
      });
    }

    await createNotification({
      recipientId: product.sellerId.toString(),
      type: "order",
      title: "New Bid Received",
      message: `${user.name} placed a ₹${Number(amount).toLocaleString()} bid on ${product.productName || product.name || "your auction"}.`,
      actionUrl: `/market/product/${productId}`,
      metadata: { productId, bidAmount: amount },
      io,
    });

    logger.info(
      { productId, userId: req.user.id, amount },
      "Bid placed successfully",
    );
    res.status(200).json({ success: true, product });
  } catch (err) {
    logger.error({ err, productId: req.params.id }, "Error placing bid");
    res.status(500).json({ message: err.message });
  }
};
