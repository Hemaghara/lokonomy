const Product = require("../models/Product");
const User = require("../models/User");
const { uploadToCloudinary } = require("../utils/cloudinary");

const buildLocationGeoJSON = (body) => {
  const { latitude, longitude, locationAddress } = body;
  if (latitude && longitude) {
    return {
      location: {
        type: "Point",
        coordinates: [parseFloat(longitude), parseFloat(latitude)],
      },
      locationAddress: locationAddress || null,
    };
  }
  return {};
};

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

    let products;
    if (lat && lng) {
      products = await Product.find(query);
    } else {
      products = await Product.find(query).sort({ createdAt: -1 });
    }
    // Coerce isSold to boolean for old docs without the field
    const result = products.map((p) => {
      const obj = p.toObject();
      obj.isSold = obj.isSold === true;
      return obj;
    });
    res.json(result);
  } catch (err) {
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
            return await uploadToCloudinary(image, "products");
          }
          return image;
        }),
      );
      productData.productImages = uploadedImages;
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
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

    const product = new Product(productData);
    const newProduct = await product.save();
    res.status(201).json({ success: true, product: newProduct });
  } catch (err) {
    console.error("Error adding product:", err);
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate(
      "sellerId",
      "upiId paymentQrCode phoneNumber name email",
    );
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    // Convert to plain object and coerce isSold to boolean
    // (handles old docs that were created before the isSold field was added)
    const productObj = product.toObject();
    productObj.isSold = productObj.isSold === true;
    res.json(productObj);
  } catch (err) {
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
      return res
        .status(403)
        .json({ message: "You are not authorized to delete this product" });
    }

    await Product.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Product deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
