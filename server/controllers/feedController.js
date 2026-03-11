const Feed = require("../models/Feed");
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

exports.getAllFeeds = async (req, res, next) => {
  try {
    const { lat, lng, radius = 5000, district, type, search } = req.query;
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

    if (type && type !== "All") {
      query.type = type;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { content: { $regex: search, $options: "i" } },
      ];
    }

    let feeds;
    if (lat && lng) {
      feeds = await Feed.find(query);
    } else {
      feeds = await Feed.find(query).sort({ createdAt: -1 });
    }

    res.status(200).json({
      success: true,
      count: feeds.length,
      data: feeds,
    });
  } catch (error) {
    next(error);
  }
};

exports.getFeedById = async (req, res, next) => {
  try {
    const feed = await Feed.findById(req.params.id);
    console.log(`Feed: ${feed}`);

    if (!feed) {
      return res
        .status(404)
        .json({ success: false, message: "Feed not found" });
    }

    res.status(200).json({
      success: true,
      data: feed,
    });
  } catch (error) {
    next(error);
  }
};

exports.createFeed = async (req, res, next) => {
  try {
    const { title, content, type, image, district, taluka, author } = req.body;
    console.log(`Title: ${title}`);
    console.log(`Content: ${content}`);
    console.log(`Type: ${type}`);
    console.log(`Image: ${image}`);
    console.log(`District: ${district}`);
    console.log(`Taluka: ${taluka}`);
    console.log(`Author: ${author}`);

    let imageUrl = image;
    if (image && image.startsWith("data:image")) {
      imageUrl = await uploadToCloudinary(image, "feeds");
    }

    const feedData = {
      title,
      content,
      type,
      image: imageUrl,
      district,
      taluka,
      author,
      authorId: req.user.id,
      createdAt: new Date(),
    };
    console.log(`Feed Data: ${feedData}`);

    const geoData = buildLocationGeoJSON(req.body);
    if (geoData.location) {
      feedData.location = geoData.location;
      feedData.locationAddress = geoData.locationAddress;
    }

    const feed = await Feed.create(feedData);
    console.log(`Feed: ${feed}`);

    res.status(201).json({
      success: true,
      data: feed,
      message: "Feed posted successfully",
    });
  } catch (error) {
    console.error("Error creating feed:", error);
    next(error);
  }
};

exports.deleteFeed = async (req, res, next) => {
  try {
    const feed = await Feed.findById(req.params.id);

    if (!feed) {
      return res
        .status(404)
        .json({ success: false, message: "Feed not found" });
    }

    if (feed.authorId.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        message: "Not authorized to delete this feed",
      });
    }

    await feed.deleteOne();

    res.status(200).json({
      success: true,
      message: "Feed deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
