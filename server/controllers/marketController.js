const Product = require("../models/Product");
const User = require("../models/User");
const { uploadToCloudinary } = require("../utils/cloudinary");

const buildLocationGeoJSON = (body) => {
  const { latitude, longitude, locationAddress } = body;
  console.log(`Latitude: ${latitude}`);
  console.log(`Longitude: ${longitude}`);
  console.log(`Location Address: ${locationAddress}`);
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
    console.log(`Lat: ${lat}`);
    console.log(`Lng: ${lng}`);
    console.log(`Radius: ${radius}`);
    console.log(`District: ${district}`);
    console.log(`Main Category: ${mainCategory}`);
    console.log(`Sub Category: ${subCategory}`);
    console.log(`Price Type: ${priceType}`);

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
    res.status(500).json({ message: err.message });
  }
};
exports.addProduct = async (req, res) => {
  try {
    const productData = req.body;
    console.log(`Product Data: ${productData}`);
    if (productData.productImages && Array.isArray(productData.productImages)) {
      const uploadedImages = await Promise.all(
        productData.productImages.map(async (image) => {
          if (image.startsWith("data:image")) {
            return await uploadToCloudinary(image, "products");
          }
          return image;
        }),
      );
      console.log(`Uploaded Images: ${uploadedImages}`);
      productData.productImages = uploadedImages;
    }

    const user = await User.findById(req.user.id);
    console.log(`User: ${user}`);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    productData.sellerProfile.name = user.name;
    productData.sellerId = req.user.id;
    console.log(`Seller Profile: ${productData.sellerProfile}`);
    const geoData = buildLocationGeoJSON(productData);
    console.log(`Geo Data: ${geoData}`);
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

    const product = new Product(productData);
    const newProduct = await product.save();

    await User.findByIdAndUpdate(req.user.id, {
      $inc: { "usage.productsUploaded": 1 },
    });

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
      "upiId paymentQrCode phoneNumber name email bankName ifscCode branch accountNumber",
    );
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const productObj = product.toObject();
    console.log(`Product Object: ${productObj}`);
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
    console.log(`Products: ${products}`);
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    console.log(`Product: ${product}`);
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
exports.addProductReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const user = await User.findById(req.user.id);

    if (product.sellerId.toString() === req.user.id) {
      return res
        .status(400)
        .json({ message: "You cannot review your own product" });
    }

    const alreadyReviewed = product.reviews.find(
      (r) => r.userId.toString() === req.user.id,
    );

    if (alreadyReviewed) {
      return res
        .status(400)
        .json({ message: "Product already reviewed" });
    }

    const review = {
      userId: req.user.id,
      userName: user.name,
      rating: Number(rating),
      comment,
    };

    product.reviews.push(review);
    product.numReviews = product.reviews.length;
    product.rating =
      product.reviews.reduce((acc, item) => item.rating + acc, 0) /
      product.reviews.length;

    await product.save();
    res.status(201).json({ success: true, message: "Review added" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

