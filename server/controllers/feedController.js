const Feed = require("../models/Feed");
const User = require("../models/User");
const Comment = require("../models/Comment");
const { uploadMedia } = require("../utils/uploadMedia");
const { buildLocationGeoJSON } = require("../utils/geoHelpers");
const logger = require("../utils/logger");

const sanitize = (str) => {
  if (typeof str !== "string") return str;
  return str.replace(/<[^>]*>/g, "").trim();
};

exports.getAllFeeds = async (req, res, next) => {
  try {
    const { lat, lng, radius = 5000, district, type, search, page = 1, limit = 9, sort = "latest" } = req.query;

    let query = {
      status: { $ne: "flagged" },
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
          { tags: { $regex: search, $options: "i" } },
        ],
      });
    }

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.max(1, parseInt(limit));
    const skip = (pageNum - 1) * limitNum;

    let sortOptions = { isPinned: -1, pinnedAt: -1, createdAt: -1 };
    switch (sort) {
      case "popular":
        sortOptions = { isPinned: -1, pinnedAt: -1 };
        break;
      case "most_commented":
        sortOptions = { isPinned: -1, pinnedAt: -1 };
        break;
      default:
        break;
    }

    let feeds;
    let totalCount = 0;

    if (sort === "popular" || sort === "most_commented") {
      const matchStage = { ...query };
      delete matchStage.location;

      const pipeline = [];

      if (lat && lng) {
        pipeline.push({
          $geoNear: {
            near: { type: "Point", coordinates: [parseFloat(lng), parseFloat(lat)] },
            distanceField: "distance",
            maxDistance: parseFloat(radius),
            query: matchStage,
            spherical: true,
          },
        });
      } else {
        pipeline.push({ $match: matchStage });
      }

      if (sort === "popular") {
        pipeline.push({ $addFields: { likesCount: { $size: { $ifNull: ["$likes", []] } } } });
        pipeline.push({ $sort: { isPinned: -1, likesCount: -1, createdAt: -1 } });
      } else {
        pipeline.push({ $sort: { isPinned: -1, commentCount: -1, createdAt: -1 } });
      }

      const countPipeline = [...pipeline, { $count: "total" }];
      const countResult = await Feed.aggregate(countPipeline);
      totalCount = countResult[0]?.total || 0;

      pipeline.push({ $skip: skip });
      pipeline.push({ $limit: limitNum });

      feeds = await Feed.aggregate(pipeline);
    } else if (lat && lng) {
      try {
        feeds = await Feed.find(query).skip(skip).limit(limitNum).lean();
        const countQuery = { ...query };
        if (countQuery.location && countQuery.location.$near) {
          countQuery.location = {
            $geoWithin: {
              $centerSphere: [
                [parseFloat(lng), parseFloat(lat)],
                parseFloat(radius) / 6378100,
              ],
            },
          };
        }
        totalCount = await Feed.countDocuments(countQuery);
      } catch (geoError) {
        logger.warn({ err: geoError }, "Geo-query failed, falling back to district/general query");
        delete query.location;
        if (district) {
          query.district = district;
        }
        feeds = await Feed.find(query)
          .sort(sortOptions)
          .skip(skip)
          .limit(limitNum)
          .lean();
        totalCount = await Feed.countDocuments(query);
      }
    } else {
      feeds = await Feed.find(query)
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum)
        .lean();
      totalCount = await Feed.countDocuments(query);
    }

    res.set("Cache-Control", "public, max-age=30, s-maxage=60");

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
    const feed = await Feed.findByIdAndUpdate(
      req.params.id,
      { $inc: { viewCount: 1 } },
      { new: true }
    ).lean();

    if (!feed) {
      return res
        .status(404)
        .json({ success: false, message: "Feed not found" });
    }

    try {
      const authorUser = await User.findById(feed.authorId).select("name paymentQrCode").lean();
      if (authorUser) {
        feed.authorProfilePhoto = authorUser.paymentQrCode || null;
        feed.authorName = authorUser.name;
      }
    } catch (profileErr) {
      logger.warn({ err: profileErr }, "Could not fetch author profile photo");
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
    const { title, content, type, image, district, taluka, scheduledAt, expiresAt, tags } = req.body;

    const currentUser = await User.findById(req.user.id).select("name").lean();
    const authorName = currentUser?.name || "Anonymous";

    logger.debug({ title, type, userId: req.user.id }, "Creating new feed");

    let imageUrl = image;
    if (image && image.startsWith("data:image")) {
      const uploadRes = await uploadMedia(image, "feeds");
      imageUrl = uploadRes.secure_url;
    }

    const feedData = {
      title: sanitize(title),
      content: sanitize(content),
      type,
      eventDate: req.body.eventDate,
      eventTime: req.body.eventTime,
      image: imageUrl,
      district,
      taluka,
      author: authorName,
      authorId: req.user.id,
      scheduledAt: scheduledAt || null,
      expiresAt: expiresAt || null,
      tags: Array.isArray(tags) ? tags.map(t => sanitize(t).toLowerCase()) : [],
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

    try {
      const io = req.app.get("io");
      if (io && feed.district) {
        io.to(`feeds_${feed.district}`).emit("new_feed", {
          feedId: feed._id,
          title: feed.title,
          type: feed.type,
          author: feed.author,
        });
      }
    } catch (socketErr) {
      logger.warn({ err: socketErr }, "Socket emit failed for new feed");
    }

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

    const { title, content, type, image, district, taluka, eventDate, eventTime, scheduledAt, expiresAt, tags } = req.body;

    let imageUrl = image;
    if (image && image.startsWith("data:image")) {
      const uploadRes = await uploadMedia(image, "feeds");
      imageUrl = uploadRes.secure_url;
    }

    const feedData = {
      title: sanitize(title),
      content: sanitize(content),
      type,
      eventDate,
      eventTime,
      image: imageUrl,
      district,
      taluka,
      scheduledAt: scheduledAt || null,
      expiresAt: expiresAt || null,
      tags: Array.isArray(tags) ? tags.map(t => sanitize(t).toLowerCase()) : feed.tags,
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

    const isLiked = feed.likes && feed.likes.some((id) => id.toString() === req.user.id);
    let updatedFeed;

    if (isLiked) {
      updatedFeed = await Feed.findByIdAndUpdate(
        req.params.id,
        { $pull: { likes: req.user.id } },
        { new: true }
      );
    } else {
      updatedFeed = await Feed.findByIdAndUpdate(
        req.params.id,
        { $addToSet: { likes: req.user.id } },
        { new: true }
      );
    }

    if (!updatedFeed) {
      return res.status(404).json({ success: false, message: "Feed not found" });
    }

    try {
      const io = req.app.get("io");
      if (io) {
        io.to(`feed_${updatedFeed._id}`).emit("feed_like", {
          feedId: updatedFeed._id,
          likesCount: updatedFeed.likes.length,
          isLiked: !isLiked,
          userId: req.user.id,
        });
        if (updatedFeed.district) {
          io.to(`feeds_${updatedFeed.district}`).emit("feed_like_update", {
            feedId: updatedFeed._id,
            likesCount: updatedFeed.likes.length,
          });
        }
      }
    } catch (socketErr) {
      logger.warn({ err: socketErr }, "Socket emit failed for feed like");
    }

    res.status(200).json({
      success: true,
      likesCount: updatedFeed.likes.length,
      isLiked: !isLiked,
    });
  } catch (error) {
    logger.error({ err: error, feedId: req.params.id }, "Error toggling like on feed");
    next(error);
  }
};

exports.getFeedComments = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.max(1, parseInt(limit));
    const skip = (pageNum - 1) * limitNum;

    const query = { targetId: req.params.id, targetType: "Feed" };

    const comments = await Comment.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    const totalCount = await Comment.countDocuments(query);

    res.status(200).json({
      success: true,
      count: comments.length,
      totalCount,
      totalPages: Math.ceil(totalCount / limitNum),
      currentPage: pageNum,
      data: comments,
    });
  } catch (error) {
    logger.error({ err: error, feedId: req.params.id }, "Error fetching feed comments");
    next(error);
  }
};

exports.addFeedComment = async (req, res, next) => {
  try {
    const { text } = req.body;
    if (!text || text.trim().length === 0) {
      return res.status(400).json({ success: false, message: "Comment text is required" });
    }
    if (text.length > 500) {
      return res.status(400).json({ success: false, message: "Comment must be under 500 characters" });
    }

    const user = await User.findById(req.user.id).select("name paymentQrCode");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const feed = await Feed.findById(req.params.id);
    if (!feed) {
      return res.status(404).json({ success: false, message: "Feed not found" });
    }

    const newComment = await Comment.create({
      targetId: feed._id,
      targetType: "Feed",
      user: req.user.id,
      userName: user.name,
      userAvatar: user.paymentQrCode,
      text: sanitize(text.trim()),
    });

    feed.commentCount = (feed.commentCount || 0) + 1;
    await feed.save();

    try {
      const io = req.app.get("io");
      if (io) {
        io.to(`feed_${feed._id}`).emit("feed_comment", {
          feedId: feed._id,
          comment: newComment,
        });
        if (feed.district) {
          io.to(`feeds_${feed.district}`).emit("feed_comment", {
            feedId: feed._id,
            comment: newComment,
          });
        }
      }
    } catch (socketErr) {
      logger.warn({ err: socketErr }, "Socket emit failed for feed comment");
    }

    res.status(201).json({
      success: true,
      data: newComment,
      message: "Comment added successfully",
    });
  } catch (error) {
    logger.error({ err: error, feedId: req.params.id }, "Error adding comment to feed");
    next(error);
  }
};

exports.deleteFeedComment = async (req, res, next) => {
  try {
    const { id, commentId } = req.params;

    const feed = await Feed.findById(id);
    if (!feed) {
      return res.status(404).json({ success: false, message: "Feed not found" });
    }

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ success: false, message: "Comment not found" });
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

    await comment.deleteOne();

    feed.commentCount = Math.max(0, (feed.commentCount || 0) - 1);
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

exports.toggleBookmark = async (req, res, next) => {
  try {
    const feed = await Feed.findById(req.params.id);
    if (!feed) {
      return res.status(404).json({ success: false, message: "Feed not found" });
    }

    const isBookmarked = feed.bookmarks && feed.bookmarks.some(id => id.toString() === req.user.id);
    let updatedFeed;

    if (isBookmarked) {
      updatedFeed = await Feed.findByIdAndUpdate(
        req.params.id,
        { $pull: { bookmarks: req.user.id } },
        { new: true }
      );
    } else {
      updatedFeed = await Feed.findByIdAndUpdate(
        req.params.id,
        { $addToSet: { bookmarks: req.user.id } },
        { new: true }
      );
    }

    if (!updatedFeed) {
      return res.status(404).json({ success: false, message: "Feed not found" });
    }

    res.status(200).json({
      success: true,
      isBookmarked: !isBookmarked,
      bookmarksCount: updatedFeed.bookmarks.length,
    });
  } catch (error) {
    logger.error({ err: error, feedId: req.params.id }, "Error toggling bookmark");
    next(error);
  }
};

exports.getTrendingFeeds = async (req, res, next) => {
  try {
    const { district, limit = 6 } = req.query;
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const matchQuery = {
      status: { $ne: "flagged" },
      createdAt: { $gte: sevenDaysAgo },
    };

    if (district) {
      matchQuery.district = district;
    }

    const feeds = await Feed.aggregate([
      { $match: matchQuery },
      {
        $addFields: {
          likesCount: { $size: { $ifNull: ["$likes", []] } },
          commentsCount: { $ifNull: ["$commentCount", 0] },
          engagementScore: {
            $add: [
              { $multiply: [{ $size: { $ifNull: ["$likes", []] } }, 2] },
              { $ifNull: ["$commentCount", 0] },
              { $ifNull: ["$viewCount", 0] },
            ],
          },
        },
      },
      { $sort: { engagementScore: -1 } },
      { $limit: parseInt(limit) },
    ]);

    res.set("Cache-Control", "public, max-age=120, s-maxage=300");

    res.status(200).json({
      success: true,
      data: feeds,
    });
  } catch (error) {
    logger.error({ err: error }, "Error fetching trending feeds");
    next(error);
  }
};

exports.getRelatedFeeds = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { limit = 4 } = req.query;

    const currentFeed = await Feed.findById(id).lean();
    if (!currentFeed) {
      return res.status(404).json({ success: false, message: "Feed not found" });
    }

    const query = {
      _id: { $ne: currentFeed._id },
      status: { $ne: "flagged" },
      type: currentFeed.type,
    };

    if (currentFeed.district) {
      query.district = currentFeed.district;
    }

    let feeds = await Feed.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .lean();

    if (feeds.length < parseInt(limit)) {
      const existingIds = feeds.map(f => f._id);
      existingIds.push(currentFeed._id);

      const more = await Feed.find({
        _id: { $nin: existingIds },
        status: { $ne: "flagged" },
        type: currentFeed.type,
      })
        .sort({ createdAt: -1 })
        .limit(parseInt(limit) - feeds.length)
        .lean();

      feeds = [...feeds, ...more];
    }

    res.set("Cache-Control", "public, max-age=60, s-maxage=120");

    res.status(200).json({
      success: true,
      data: feeds,
    });
  } catch (error) {
    logger.error({ err: error, feedId: req.params.id }, "Error fetching related feeds");
    next(error);
  }
};
