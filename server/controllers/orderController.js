const Order = require("../models/Order");
const Product = require("../models/Product");
const { awardPoints } = require("./rewardsController");
const { createNotification } = require("./notificationController");
const logger = require("../utils/logger");

exports.createOrder = async (req, res) => {
  try {
    const {
      productId,
      paymentMethod,
      shippingAddress,
      contactNumber,
      transactionId,
    } = req.body;

    if (!productId || !paymentMethod || !shippingAddress || !contactNumber) {
      return res.status(400).json({
        success: false,
        message:
          "Missing required fields (productId, paymentMethod, shippingAddress, contactNumber).",
      });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    if (product.isSold === true) {
      return res.status(400).json({
        success: false,
        message: "This product has already been sold to another buyer.",
      });
    }

    if (!product.sellerId) {
      return res.status(400).json({
        success: false,
        message: "This product listing is incomplete (missing sellerId).",
      });
    }

    if (product.sellerId.toString() === req.user.id) {
      return res.status(400).json({
        success: false,
        message: "You cannot purchase your own product.",
      });
    }

    const existingOrder = await Order.findOne({
      product: productId,
      buyer: req.user.id,
    });
    if (existingOrder) {
      return res.status(400).json({
        success: false,
        message: "You have already placed an order for this product.",
      });
    }

    const newOrder = new Order({
      product: productId,
      buyer: req.user.id,
      seller: product.sellerId,
      price: product.price,
      paymentMethod,
      shippingAddress,
      contactNumber,
      transactionId,
      paymentStatus: "completed",
    });

    const savedOrder = await newOrder.save();

    await Product.findByIdAndUpdate(
      productId,
      { $set: { isSold: true } },
      { strict: false },
    );

    const { sendPushNotification } = require("../utils/pushService");
    await sendPushNotification(product.sellerId, {
      title: "New Order Received",
      body: `You have a new order for ${product.name}.`,
      data: {
        url: "/seller/orders",
        type: "order",
      },
    });

    const io = req.app.get("io");
    await createNotification({
      recipientId: product.sellerId,
      type: "order",
      title: "New Order Received",
      message: `You have a new order for ${product.name} — ₹${product.price}.`,
      actionUrl: "/sales-management",
      metadata: { orderId: savedOrder._id, productId },
      io,
    });

    try {
      await awardPoints(
        req.user.id,
        "making_order",
        `Order placed for ${product.name}`,
      );
    } catch (pointsErr) {
      logger.error({ err: pointsErr, userId: req.user.id }, "points_award_failed in createOrder");
    }

    logger.info({ orderId: savedOrder._id, productId, buyerId: req.user.id }, "Order created successfully");
    res.status(201).json({ success: true, order: savedOrder });
  } catch (err) {
    logger.error({ err }, "Order Creation Error");
    if (err.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message:
          "Validation Error: " +
          Object.values(err.errors)
            .map((e) => e.message)
            .join(", "),
      });
    }
    if (err.name === "CastError") {
      return res
        .status(400)
        .json({ success: false, message: "Invalid ID provided." });
    }
    res.status(500).json({
      success: false,
      message: "Server Error: " + err.message,
    });
  }
};

exports.getBuyerOrders = async (req, res) => {
  try {
    const orders = await Order.find({ buyer: req.user.id })
      .populate("product")
      .populate("seller", "name email")
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, orders });
  } catch (err) {
    logger.error({ err, userId: req.user.id }, "Error in getBuyerOrders");
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getSellerOrders = async (req, res) => {
  try {
    const orders = await Order.find({ seller: req.user.id })
      .populate("product")
      .populate("buyer", "name email")
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, orders });
  } catch (err) {
    logger.error({ err, userId: req.user.id }, "Error in getSellerOrders");
    res.status(500).json({ success: false, message: err.message });
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
      logger.warn({ orderId: req.params.id, userId: req.user.id }, "Unauthorized order status update attempt");
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    order.orderStatus = orderStatus;
    await order.save();

    const { sendPushNotification } = require("../utils/pushService");
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

    logger.info({ orderId: order._id, status: orderStatus }, "Order status updated");
    res.status(200).json({ success: true, order });
  } catch (err) {
    logger.error({ err, orderId: req.params.id }, "Error in updateOrderStatus");
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getSellerDashboardStats = async (req, res) => {
  try {
    const sellerId = req.user.id;
    const orders = await Order.find({ seller: sellerId });
    const stats = {
      totalOrders: orders.length,
      totalEarnings: orders
        .filter((o) => o.orderStatus === "delivered")
        .reduce((acc, curr) => acc + curr.price, 0),
      statusCounts: {
        pending: 0,
        preparing: 0,
        processing: 0,
        shipped: 0,
        out_for_delivery: 0,
        delivered: 0,
        cancelled: 0,
      },
      dailySales: [],
    };

    orders.forEach((o) => {
      if (stats.statusCounts[o.orderStatus] !== undefined) {
        stats.statusCounts[o.orderStatus]++;
      }
    });

    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      last7Days.push({ date: dateStr, amount: 0 });
    }

    orders.forEach((o) => {
      if (o.orderStatus === "delivered") {
        const dateStr = new Date(o.createdAt).toISOString().split("T")[0];
        const day = last7Days.find((d) => d.date === dateStr);
        if (day) {
          day.amount += o.price;
        }
      }
    });

    stats.dailySales = last7Days;

    res.status(200).json({ success: true, stats });
  } catch (err) {
    logger.error({ err, userId: req.user.id }, "Error in getSellerDashboardStats");
    res.status(500).json({ success: false, message: err.message });
  }
};
