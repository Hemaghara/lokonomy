const Product = require("../models/Product");
const Order = require("../models/Order");

exports.getAllProducts = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 6 } = req.query;
    let query = {};

    if (status === "sold") query.isSold = true;
    else if (status === "active") query.isSold = false;
    else if (status === "banned") query.isFlagged = true;
    else if (status === "suspended") query.isSuspended = true;

    if (search) {
      query.productName = { $regex: search, $options: "i" };
    }

    const currentPage = parseInt(page);
    const pageLimit = parseInt(limit);
    const skip = (currentPage - 1) * pageLimit;

    const totalProducts = await Product.countDocuments(query);
    const totalPages = Math.ceil(totalProducts / pageLimit);

    const products = await Product.find(query)
      .populate("sellerProfile", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageLimit);

    res.json({
      products,
      currentPage,
      totalPages,
      totalProducts,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.getAllOrders = async (req, res) => {
  try {
    const { status, startDate, endDate, page = 1, limit = 6 } = req.query;
    let query = {};

    if (status && status !== "all") {
      query.orderStatus = status;
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const currentPage = parseInt(page);
    const pageLimit = parseInt(limit);
    const skip = (currentPage - 1) * pageLimit;

    const totalOrders = await Order.countDocuments(query);
    const totalPages = Math.ceil(totalOrders / pageLimit);

    const orders = await Order.find(query)
      .populate(
        "product",
        "productName price productImages subCategory mainCategory",
      )
      .populate("buyer", "name email")
      .populate("seller", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageLimit);

    res.json({
      orders,
      currentPage,
      totalPages,
      totalOrders,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.getAllAuctions = async (req, res) => {
  try {
    const { page = 1, limit = 6 } = req.query;
    const currentPage = parseInt(page);
    const pageLimit = parseInt(limit);
    const skip = (currentPage - 1) * pageLimit;

    const totalAuctions = await Product.countDocuments({ isAuction: true });
    const totalPages = Math.ceil(totalAuctions / pageLimit);

    const auctions = await Product.find({ isAuction: true })
      .populate("sellerId", "name")
      .sort({ auctionEnd: -1 })
      .skip(skip)
      .limit(pageLimit);

    res.json({
      auctions,
      currentPage,
      totalPages,
      totalAuctions,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.toggleFlagProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    product.isFlagged = !product.isFlagged;
    await product.save();

    res.json({
      message: `Product ${product.isFlagged ? "banned" : "unbanned"} successfully`,
      isFlagged: product.isFlagged,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.toggleSuspendProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    product.isSuspended = !product.isSuspended;
    await product.save();

    res.json({
      message: `Product ${product.isSuspended ? "suspended" : "activated"} successfully`,
      isSuspended: product.isSuspended,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { orderStatus } = req.body;
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { orderStatus },
      { new: true },
    );

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json({ message: "Order status updated", order });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.getMarketStats = async (req, res) => {
  try {
    const totalProducts = await Product.countDocuments();
    const activeProducts = await Product.countDocuments({
      isSold: false,
      isFlagged: false,
      isSuspended: false,
    });
    const soldProducts = await Product.countDocuments({ isSold: true });
    const bannedProducts = await Product.countDocuments({ isFlagged: true });
    const suspendedProducts = await Product.countDocuments({
      isSuspended: true,
    });
    const totalOrders = await Order.countDocuments();
    const totalAuctions = await Product.countDocuments({ isAuction: true });

    res.json({
      totalProducts,
      activeProducts,
      soldProducts,
      bannedProducts,
      suspendedProducts,
      totalOrders,
      totalAuctions,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
exports.getOrderDetails = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("product")
      .populate("buyer", "name email mobile location")
      .populate("seller", "name email mobile location");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.getProductDetails = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate(
      "sellerId",
      "name email mobile location",
    );

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json(product);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
