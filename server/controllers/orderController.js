const Order = require("../models/Order");
const Product = require("../models/Product");

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

    res.status(201).json({ success: true, order: savedOrder });
  } catch (err) {
    console.error("Order Creation Error:", err);
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
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    order.orderStatus = orderStatus;
    await order.save();

    res.status(200).json({ success: true, order });
  } catch (err) {
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
    res.status(500).json({ success: false, message: err.message });
  }
};
