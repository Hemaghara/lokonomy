const Feed = require("../models/Feed");
const { uploadMedia } = require("../utils/uploadMedia");
const { buildLocationGeoJSON } = require("../utils/geoHelpers");
const logger = require("../utils/logger");

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
    logger.error({ err: error }, "Error fetching feeds");
    next(error);
  }
};

exports.getFeedById = async (req, res, next) => {
  try {
    const feed = await Feed.findById(req.params.id);

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
    logger.error({ err: error, feedId: req.params.id }, "Error fetching feed by ID");
    next(error);
  }
};

exports.createFeed = async (req, res, next) => {
  try {
    const { title, content, type, image, district, taluka, author } = req.body;
    
    logger.debug({ title, type, userId: req.user.id }, "Creating new feed");

    let imageUrl = image;
    if (image && image.startsWith("data:image")) {
      const res = await uploadMedia(image, "feeds");
      imageUrl = res.secure_url;
    }

    const feedData = {
      title,
      content,
      type,
      eventDate: req.body.eventDate,
      eventTime: req.body.eventTime,
      image: imageUrl,
      district,
      taluka,
      author,
      authorId: req.user.id,
      createdAt: new Date(),
    };

    const geoData = buildLocationGeoJSON(req.body);
    if (geoData.location) {
      feedData.location = geoData.location;
      feedData.locationAddress = geoData.locationAddress;
    }

    const feed = await Feed.create(feedData);
    logger.info({ feedId: feed._id, userId: req.user.id }, "Feed created successfully");

    res.status(201).json({
      success: true,
      data: feed,
      message: "Feed posted successfully",
    });
  } catch (error) {
    logger.error({ err: error }, "Error creating feed");
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
      logger.warn({ feedId: req.params.id, userId: req.user.id }, "Unauthorized attempt to delete feed");
      return res.status(401).json({
        success: false,
        message: "Not authorized to delete this feed",
      });
    }

    await feed.deleteOne();
    logger.info({ feedId: req.params.id, userId: req.user.id }, "Feed deleted successfully");

    res.status(200).json({
      success: true,
      message: "Feed deleted successfully",
    });
  } catch (error) {
    logger.error({ err: error, feedId: req.params.id }, "Error deleting feed");
    next(error);
  }
};
