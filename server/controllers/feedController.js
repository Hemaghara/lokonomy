const Feed = require("../models/Feed");
const User = require("../models/User");

// Ensure MongoDB indexes are properly synchronized and self-heal conflicts
Feed.createIndexes().catch((err) => {
  if (err.codeName === "IndexOptionsConflict") {
    Feed.collection.dropIndex("location_2dsphere").then(() => {
      Feed.createIndexes();
    }).catch(() => {});
  }
});

const { uploadMedia } = require("../utils/uploadMedia");
const { buildLocationGeoJSON } = require("../utils/geoHelpers");
const logger = require("../utils/logger");

exports.getAllFeeds = async (req, res, next) => {
  try {
    const { lat, lng, radius = 5000, district, type, search, page = 1, limit = 9 } = req.query;

    // Use $and to isolate different filter boundaries and protect scheduled feeds
    let query = {
      $and: [
        {
          $or: [
            { scheduledAt: { $exists: false } },
            { scheduledAt: { $lte: new Date() } },
          ],
        },
        {
          $or: [
            { expiresAt: { $exists: false } },
            { expiresAt: { $gt: new Date() } },
            { expiresAt: null },
          ],
        },
      ],
    };

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
      query.$and.push({
        $or: [
          { title: { $regex: search, $options: "i" } },
          { content: { $regex: search, $options: "i" } },
        ],
      });
    }

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.max(1, parseInt(limit));
    const skip = (pageNum - 1) * limitNum;

    let feeds;
    let totalCount = 0;
    if (lat && lng) {
      try {
        feeds = await Feed.find(query).skip(skip).limit(limitNum);
        totalCount = await Feed.countDocuments(query);
      } catch (geoError) {
        logger.warn({ err: geoError }, "Geo-query failed, falling back to district/general query");
        delete query.location;
        if (district) {
          query.district = district;
        }
        feeds = await Feed.find(query)
          .sort({
            isPinned: -1,
            pinnedAt: -1,
            createdAt: -1,
          })
          .skip(skip)
          .limit(limitNum);
        totalCount = await Feed.countDocuments(query);
      }
    } else {
      feeds = await Feed.find(query)
        .sort({
          isPinned: -1,
          pinnedAt: -1,
          createdAt: -1,
        })
        .skip(skip)
        .limit(limitNum);
      totalCount = await Feed.countDocuments(query);
    }

    res.status(200).json({
      success: true,
      count: feeds.length,
      totalCount,
      totalPages: Math.ceil(totalCount / limitNum),
      currentPage: pageNum,
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
    logger.error(
      { err: error, feedId: req.params.id },
      "Error fetching feed by ID",
    );
    next(error);
  }
};

exports.createFeed = async (req, res, next) => {
  try {
    const { title, content, type, image, district, taluka, author, scheduledAt, expiresAt } = req.body;

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
      scheduledAt: scheduledAt || null,
      expiresAt: expiresAt || null,
      createdAt: new Date(),
    };

    const geoData = buildLocationGeoJSON(req.body);
    if (geoData.location) {
      feedData.location = geoData.location;
      feedData.locationAddress = geoData.locationAddress;
    }

    const feed = await Feed.create(feedData);
    logger.info(
      { feedId: feed._id, userId: req.user.id },
      "Feed created successfully",
    );

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
      logger.warn(
        { feedId: req.params.id, userId: req.user.id },
        "Unauthorized attempt to delete feed",
      );
      return res.status(401).json({
        success: false,
        message: "Not authorized to delete this feed",
      });
    }

    await feed.deleteOne();
    logger.info(
      { feedId: req.params.id, userId: req.user.id },
      "Feed deleted successfully",
    );

    res.status(200).json({
      success: true,
      message: "Feed deleted successfully",
    });
  } catch (error) {
    logger.error({ err: error, feedId: req.params.id }, "Error deleting feed");
    next(error);
  }
};

exports.updateFeed = async (req, res, next) => {
  try {
    let feed = await Feed.findById(req.params.id);

    if (!feed) {
      return res
        .status(404)
        .json({ success: false, message: "Feed not found" });
    }

    if (feed.authorId.toString() !== req.user.id) {
      logger.warn(
        { feedId: req.params.id, userId: req.user.id },
        "Unauthorized attempt to update feed",
      );
      return res.status(401).json({
        success: false,
        message: "Not authorized to update this feed",
      });
    }

    const { title, content, type, image, district, taluka, eventDate, eventTime, scheduledAt, expiresAt } = req.body;

    let imageUrl = image;
    if (image && image.startsWith("data:image")) {
      const uploadRes = await uploadMedia(image, "feeds");
      imageUrl = uploadRes.secure_url;
    }

    const feedData = {
      title,
      content,
      type,
      eventDate,
      eventTime,
      image: imageUrl,
      district,
      taluka,
      scheduledAt: scheduledAt || null,
      expiresAt: expiresAt || null,
    };

    const geoData = buildLocationGeoJSON(req.body);
    if (geoData.location) {
      feedData.location = geoData.location;
      feedData.locationAddress = geoData.locationAddress;
    }

    feed = await Feed.findByIdAndUpdate(req.params.id, feedData, { new: true, runValidators: true });
    logger.info(
      { feedId: feed._id, userId: req.user.id },
      "Feed updated successfully",
    );

    res.status(200).json({
      success: true,
      data: feed,
      message: "Feed updated successfully",
    });
  } catch (error) {
    logger.error({ err: error, feedId: req.params.id }, "Error updating feed");
    next(error);
  }
};

exports.toggleLikeFeed = async (req, res, next) => {
  try {
    const feed = await Feed.findById(req.params.id);

    if (!feed) {
      return res
        .status(404)
        .json({ success: false, message: "Feed not found" });
    }

    if (!feed.likes) {
      feed.likes = [];
    }

    const isLiked = feed.likes.includes(req.user.id);
    if (isLiked) {
      feed.likes = feed.likes.filter((id) => id.toString() !== req.user.id);
    } else {
      feed.likes.push(req.user.id);
    }

    await feed.save();

    res.status(200).json({
      success: true,
      likesCount: feed.likes.length,
      isLiked: !isLiked,
    });
  } catch (error) {
    logger.error({ err: error, feedId: req.params.id }, "Error toggling like on feed");
    next(error);
  }
};

exports.addFeedComment = async (req, res, next) => {
  try {
    const { text } = req.body;
    if (!text || text.trim().length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "Comment text is required" });
    }
    if (text.length > 500) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Comment must be under 500 characters",
        });
    }

    const user = await User.findById(req.user.id).select("name");
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const feed = await Feed.findById(req.params.id);
    if (!feed) {
      return res
        .status(404)
        .json({ success: false, message: "Feed not found" });
    }

    const newComment = {
      user: req.user.id,
      userName: user.name,
      text: text.trim(),
      createdAt: new Date(),
    };

    feed.comments.push(newComment);
    await feed.save();

    const addedComment = feed.comments[feed.comments.length - 1];

    try {
      const io = req.app.get("io");
      if (io && feed.district) {
        io.to(`feeds_${feed.district}`).emit("feed_comment", {
          feedId: feed._id,
          comment: addedComment,
        });
      }
    } catch (socketErr) {
      logger.warn({ err: socketErr }, "Socket emit failed for feed comment");
    }

    res.status(201).json({
      success: true,
      data: addedComment,
      message: "Comment added successfully",
    });
  } catch (error) {
    logger.error(
      { err: error, feedId: req.params.id },
      "Error adding comment to feed",
    );
    next(error);
  }
};

exports.deleteFeedComment = async (req, res, next) => {
  try {
    const { id, commentId } = req.params;

    const feed = await Feed.findById(id);
    if (!feed) {
      return res
        .status(404)
        .json({ success: false, message: "Feed not found" });
    }

    const comment = feed.comments.id(commentId);
    if (!comment) {
      return res
        .status(404)
        .json({ success: false, message: "Comment not found" });
    }

    if (
      comment.user.toString() !== req.user.id &&
      feed.authorId.toString() !== req.user.id
    ) {
      return res.status(401).json({
        success: false,
        message: "Not authorized to delete this comment",
      });
    }

    feed.comments.pull(commentId);
    await feed.save();

    res.status(200).json({
      success: true,
      message: "Comment deleted successfully",
    });
  } catch (error) {
    logger.error({ err: error }, "Error deleting feed comment");
    next(error);
  }
};
