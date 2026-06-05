const mongoose = require("mongoose");
const Order = require("../models/Order");
const Product = require("../models/Product");
const User = require("../models/User");
const Plan = require("../models/Plan");
const Commission = require("../models/Commission");
const FlashSale = require("../models/FlashSale"); // Bug #27: Moved requires to top
const Coupon = require("../models/Coupon"); // Bug #27: Moved requires to top
const Business = require("../models/Business"); // Bug #27: Moved requires to top
const { awardPoints } = require("./rewardsController");
const { createNotification } = require("./notificationController");
const { sendPushNotification } = require("../utils/pushService"); // Bug #27: Moved requires to top
const logger = require("../utils/logger");

const DEFAULT_COMMISSION_RATES = {
  free: 5,
  silver: 4,
  gold: 3,
  platinum: 2,
};

const VALID_TRANSITIONS = {
  pending: ["preparing", "processing", "cancelled"],
  preparing: ["processing", "shipped", "cancelled"],
  processing: ["shipped", "cancelled"],
  shipped: ["out_for_delivery", "cancelled"],
  out_for_delivery: ["delivered", "cancelled"],
  delivered: [],
  cancelled: [],
};

async function getCommissionRate(sellerId) {
  try {
    const seller = await User.findById(sellerId);
    if (!seller) return DEFAULT_COMMISSION_RATES.free;
    const planSlug = seller.subscription?.plan || "free";
    const planDoc = await Plan.findOne({ slug: planSlug });
    if (planDoc?.limits?.commissionRate !== undefined) {
      return planDoc.limits.commissionRate;
    }
    return DEFAULT_COMMISSION_RATES[planSlug] || DEFAULT_COMMISSION_RATES.free;
  } catch (err) {
    logger.error({ err }, "Error getting commission rate");
    return DEFAULT_COMMISSION_RATES.free;
  }
}

exports.createOrder = async (req, res) => {
  const maxRetries = 3;
  let retryCount = 0;

  while (retryCount < maxRetries) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const {
        productId,
        paymentMethod,
        shippingAddress,
        contactNumber,
        transactionId,
        quantity = 1,
        appliedCoupon,
      } = req.body;

      if (!productId || !paymentMethod || !shippingAddress || !contactNumber) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({
          success: false,
          message:
            "Missing required fields (productId, paymentMethod, shippingAddress, contactNumber).",
        });
      }

      // Bug #17: Validate quantity (integer, 1-1000)
      const qty = parseInt(quantity, 10);
      if (isNaN(qty) || qty < 1 || qty > 1000 || qty !== Number(quantity)) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({
          success: false,
          message: "Quantity must be an integer between 1 and 1000.",
        });
      }

      const product = await Product.findOne({
        _id: productId,
        isSold: false,
        isFlagged: { $ne: true }
      }).session(session);

      if (!product) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({
          success: false,
          message: "Product not available or already sold.",
        });
      }

      if (!product.sellerId) {
        await session.abortTransaction();
        session.endSession();
        return res
          .status(400)
          .json({ success: false, message: "Invalid product listing." });
      }

      if (product.sellerId.toString() === req.user.id) {
        await session.abortTransaction();
        session.endSession();
        return res
          .status(400)
          .json({ success: false, message: "Cannot purchase your own product." });
      }

      const now = new Date();
      const activeFlashSale = await FlashSale.findOne({
        productId,
        status: "active",
        startTime: { $lte: now },
        endTime: { $gte: now },
      }).session(session);

      const isMultiUnit = product.isBulkEnabled || product.isPreOrderEnabled || !!activeFlashSale;

      if (!isMultiUnit) {
        const existingOrder = await Order.findOne({
          product: productId,
          buyer: req.user.id,
        }).session(session);
        if (existingOrder) {
          await session.abortTransaction();
          session.endSession();
          return res
            .status(400)
            .json({ success: false, message: "Already ordered this product." });
        }
      }

      let pricePerUnit = product.price;

      if (activeFlashSale) {
        if (activeFlashSale.soldCount + qty > activeFlashSale.maxQuantity) {
          await session.abortTransaction();
          session.endSession();
          return res.status(400).json({
            success: false,
            message: `Only ${activeFlashSale.maxQuantity - activeFlashSale.soldCount} items available at flash sale price.`
          });
        }
        pricePerUnit = activeFlashSale.salePrice;
        activeFlashSale.soldCount += qty;
        if (activeFlashSale.soldCount >= activeFlashSale.maxQuantity) {
          activeFlashSale.status = "ended";
        }
        await activeFlashSale.save({ session });
      } else if (product.isBulkEnabled && product.bulkPricing && product.bulkPricing.length > 0) {
        if (qty < (product.minOrderQuantity || 1)) {
          await session.abortTransaction();
          session.endSession();
          return res.status(400).json({
            success: false,
            message: `Quantity must be at least min order quantity of ${product.minOrderQuantity || 1}`,
          });
        }
        const sortedTiers = [...product.bulkPricing].sort((a, b) => b.minQuantity - a.minQuantity);
        const matchingTier = sortedTiers.find(tier => qty >= tier.minQuantity);
        if (matchingTier) {
          pricePerUnit = matchingTier.pricePerUnit;
        }
      }

      if (!isMultiUnit) {
        product.isSold = true;
        await product.save({ session });
      }

      let orderAmount = pricePerUnit * qty;

      let couponDoc = null;
      if (appliedCoupon) {
        const biz = await Business.findOne({ ownerId: product.sellerId });
        if (biz) {
          const query = { code: appliedCoupon.toUpperCase(), businessId: biz._id };
          couponDoc = await Coupon.findOne(query);
        }
        if (couponDoc && couponDoc.status === "active" && new Date(couponDoc.expiryDate) >= new Date() && couponDoc.usedBy.indexOf(req.user.id) === -1) {
          if (couponDoc.discountType === "percentage") {
            orderAmount = orderAmount - (orderAmount * couponDoc.discount) / 100;
          } else {
            orderAmount = Math.max(0, orderAmount - couponDoc.discount);
          }
          
          couponDoc.usedCount += 1;
          couponDoc.usedBy.push(req.user.id);
          if (couponDoc.usedCount >= couponDoc.usageLimit) {
            couponDoc.status = "disabled";
          }
          await couponDoc.save({ session });
        }
      }

      const commissionRate = await getCommissionRate(product.sellerId);
      const commissionAmount = Math.round((orderAmount * commissionRate) / 100 * 100) / 100;
      const sellerPayout = Math.round((orderAmount - commissionAmount) * 100) / 100;

      const newOrder = new Order({
        product: productId,
        buyer: req.user.id,
        seller: product.sellerId,
        price: orderAmount,
        paymentMethod,
        shippingAddress,
        contactNumber,
        transactionId,
        paymentStatus: "completed",
        quantity: qty,
        commissionRate,
        commissionAmount,
        sellerPayout,
      });

      const savedOrder = await newOrder.save({ session });

      const commission = new Commission({
        orderId: savedOrder._id,
        sellerId: product.sellerId,
        buyerId: req.user.id,
        orderAmount,
        commissionRate,
        commissionAmount,
        sellerPayout,
        sellerPlan: (await User.findById(product.sellerId))?.subscription?.plan || "free",
        status: "pending",
      });
      await commission.save({ session });

      await session.commitTransaction();
      session.endSession();

      try {
        await awardPoints(
          req.user.id,
          "making_order",
          `Order for ${product.productName || product.name}`,
        );
        await sendPushNotification(product.sellerId, {
          title: "New Order",
          body: `New order for ${product.productName || product.name}`,
          data: { url: "/sales" },
        });
        const io = req.app.get("io");
        await createNotification({
          recipientId: product.sellerId,
          type: "order",
          title: "New Order",
          // Bug #23: Show orderAmount instead of product.price in notification
          message: `Order for ${product.productName || product.name} - ₹${orderAmount}`,
          actionUrl: "/sales-management",
          metadata: { orderId: savedOrder._id },
          io,
        });
      } catch (sideEffectErr) {
        logger.error(
          { err: sideEffectErr },
          "Post-order side effects failed (non-critical)",
        );
      }

      return res.status(201).json({ success: true, order: savedOrder });
    } catch (err) {
      await session.abortTransaction();
      session.endSession();

      const isConflict = err.name === "MongoServerError" && 
        (err.code === 112 || err.code === 24 || err.message.includes("WriteConflict") || err.message.includes("LockTimeout"));
        
      if (isConflict) {
        retryCount++;
        logger.warn(`Write conflict/catalog change error (code ${err.code}) encountered during order creation. Retrying transaction (${retryCount}/${maxRetries})...`);
        await new Promise(resolve => setTimeout(resolve, Math.random() * 80 + 20));
        continue;
      }

      logger.error({ err }, "Order creation error");
      // Bug #33: Generic error message
      return res.status(500).json({ success: false, message: "Failed to create order" });
    }
  }

  return res.status(400).json({
    success: false,
    message: "Product is currently being purchased or has already been sold. Please try again."
  });
};

exports.getBuyerOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const total = await Order.countDocuments({ buyer: req.user.id });
    const orders = await Order.find({ buyer: req.user.id })
      .populate("product")
      .populate("seller", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    logger.error({ err, userId: req.user.id }, "Error in getBuyerOrders");
    res.status(500).json({ success: false, message: "Failed to retrieve buyer orders" });
  }
};

exports.getSellerOrders = async (req, res) => {
  try {
    // Bug #24: Add pagination to getSellerOrders
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const total = await Order.countDocuments({ seller: req.user.id });
    const orders = await Order.find({ seller: req.user.id })
      .populate("product")
      .populate("buyer", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    logger.error({ err, userId: req.user.id }, "Error in getSellerOrders");
    // Bug #33: Generic error message
    res.status(500).json({ success: false, message: "Failed to retrieve seller orders" });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { orderStatus } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    if (order.seller.toString() !== req.user.id) {
      logger.warn(
        { orderId: req.params.id, userId: req.user.id },
        "Unauthorized order status update attempt",
      );
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    // Bug #38: Add order status state machine validation
    const currentStatus = order.orderStatus || "pending";
    if (currentStatus !== orderStatus) {
      const allowedNext = VALID_TRANSITIONS[currentStatus] || [];
      if (!allowedNext.includes(orderStatus)) {
        return res.status(400).json({
          success: false,
          message: `Invalid status transition from ${currentStatus} to ${orderStatus}.`
        });
      }
    }

    order.orderStatus = orderStatus;
    await order.save();

    await sendPushNotification(order.buyer, {
      title: "Order Update",
      body: `Your order status has been updated to ${orderStatus}.`,
      data: {
        url: "/my-orders",
        type: "order_update",
      },
    });

    const io = req.app.get("io");
    await createNotification({
      recipientId: order.buyer.toString(),
      type: "order",
      title: "Order Status Updated",
      message: `Your order has been updated to: ${orderStatus}.`,
      actionUrl: "/my-orders",
      metadata: { orderId: order._id, status: orderStatus },
      io,
    });

    logger.info(
      { orderId: order._id, status: orderStatus },
      "Order status updated",
    );
    res.status(200).json({ success: true, order });
  } catch (err) {
    logger.error({ err, orderId: req.params.id }, "Error in updateOrderStatus");
    // Bug #33: Generic error message
    res.status(500).json({ success: false, message: "Failed to update order status" });
  }
};

exports.getSellerDashboardStats = async (req, res) => {
  try {
    const sellerId = req.user.id;
    const sellerObjectId = new mongoose.Types.ObjectId(sellerId);

    // 1. Get total orders and status counts via aggregation
    const statusCountsAgg = await Order.aggregate([
      { $match: { seller: sellerObjectId } },
      { $group: { _id: "$orderStatus", count: { $sum: 1 } } }
    ]);

    let totalOrders = 0;
    const statusCounts = {
      pending: 0,
      preparing: 0,
      processing: 0,
      shipped: 0,
      out_for_delivery: 0,
      delivered: 0,
      cancelled: 0,
    };

    statusCountsAgg.forEach((item) => {
      if (statusCounts[item._id] !== undefined) {
        statusCounts[item._id] = item.count;
      }
      totalOrders += item.count;
    });

    // 2. Get gross earnings and total commission (delivered orders only)
    const earningsAgg = await Order.aggregate([
      { $match: { seller: sellerObjectId, orderStatus: "delivered" } },
      {
        $group: {
          _id: null,
          gross: { $sum: "$price" },
          commission: { $sum: { $ifNull: ["$commissionAmount", 0] } }
        }
      }
    ]);

    const grossEarnings = earningsAgg[0]?.gross || 0;
    const totalCommission = earningsAgg[0]?.commission || 0;
    const netEarnings = grossEarnings - totalCommission;

    // 3. Get daily sales for last 7 days (delivered orders only)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const dailyAgg = await Order.aggregate([
      {
        $match: {
          seller: sellerObjectId,
          orderStatus: "delivered",
          createdAt: { $gte: sevenDaysAgo }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          gross: { $sum: "$price" },
          commission: { $sum: { $ifNull: ["$commissionAmount", 0] } },
          net: { $sum: { $cond: [{ $ifNull: ["$sellerPayout", null] }, "$sellerPayout", "$price"] } }
        }
      }
    ]);

    const last7Days = [];
    const dateToDayIndex = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      last7Days.push({ date: dateStr, gross: 0, commission: 0, net: 0 });
      dateToDayIndex[dateStr] = 6 - i;
    }

    dailyAgg.forEach((item) => {
      const dayIndex = dateToDayIndex[item._id];
      if (dayIndex !== undefined) {
        last7Days[dayIndex].gross = item.gross;
        last7Days[dayIndex].commission = item.commission;
        last7Days[dayIndex].net = item.net;
      }
    });

    const stats = {
      totalOrders,
      totalEarnings: netEarnings,
      grossEarnings,
      totalCommission,
      netEarnings,
      statusCounts,
      dailySales: last7Days,
    };

    const currentRate = await getCommissionRate(sellerId);
    stats.currentCommissionRate = currentRate;

    res.status(200).json({ success: true, stats });
  } catch (err) {
    logger.error(
      { err, userId: req.user.id },
      "Error in getSellerDashboardStats",
    );
    res.status(500).json({ success: false, message: "Failed to retrieve seller dashboard statistics" });
  }
};

exports.updateTracking = async (req, res) => {
  try {
    const { lat, lng, status, note, estimatedDelivery } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    if (order.seller.toString() !== req.user.id && req.user.role !== "admin" && req.user.role !== "superadmin") {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    if (!order.tracking) {
      order.tracking = {
        currentLocation: { lat: 23.0225, lng: 72.5714 },
        status: order.orderStatus || "pending",
        updates: []
      };
    }

    if (lat !== undefined && lng !== undefined) {
      order.tracking.currentLocation = { lat: parseFloat(lat), lng: parseFloat(lng) };
    }
    if (estimatedDelivery !== undefined) {
      order.tracking.estimatedDelivery = estimatedDelivery;
    }
    if (status) {
      order.tracking.status = status;
      order.tracking.updates.push({
        status,
        location: note || `Package status updated to ${status}`,
        timestamp: new Date(),
        note: note || ""
      });
    }

    await order.save();

    const io = req.app.get("io");
    if (io) {
      io.to(`user_${order.buyer}`).emit("orderTrackingUpdate", {
        orderId: order._id,
        tracking: order.tracking
      });
    }

    res.json({ success: true, tracking: order.tracking });
  } catch (err) {
    logger.error({ err }, "Error updating order tracking");
    // Bug #33: Generic error message
    res.status(500).json({ success: false, message: "Failed to update tracking information" });
  }
};
