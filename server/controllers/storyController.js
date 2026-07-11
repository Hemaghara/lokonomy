const Story = require("../models/Story");
const User = require("../models/User");
const { uploadMedia } = require("../utils/uploadMedia");
const { buildLocationGeoJSON } = require("../utils/geoHelpers");
const logger = require("../utils/logger");
const escapeRegex = require("../utils/escapeRegex");

exports.getAllStories = async (req, res, next) => {
  try {
    const {
      lat,
      lng,
      radius = 5000,
      district,
      type,
      search,
      sort = "latest",
      page = 1,
      limit = 12,
    } = req.query;

    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit) || 12));
    const skip = (pageNum - 1) * limitNum;

    if (sort === "trending") {
      const matchStage = {
        $and: [
          {
            $or: [{ expiresAt: { $gt: new Date() } }, { isHighlighted: true }],
          },
          {
            $or: [
              { scheduledAt: { $exists: false } },
              { scheduledAt: null },
              { scheduledAt: { $lte: new Date() } },
            ],
          },
        ],
      };

      if (district) matchStage.district = { $regex: new RegExp(`^${escapeRegex(district)}$`, "i") };
      if (type && type !== "All") matchStage.type = type;
      if (search) {
        matchStage.$or = [
          { title: { $regex: escapeRegex(search), $options: "i" } },
          { content: { $regex: escapeRegex(search), $options: "i" } },
        ];
      }

      const pipeline = [
        { $match: matchStage },
        {
          $addFields: {
            hoursElapsed: {
              $divide: [{ $subtract: [new Date(), "$createdAt"] }, 3600000],
            },
            likeCount: { $size: { $ifNull: ["$likes", []] } },
            commentCount: { $size: { $ifNull: ["$comments", []] } },
            trendingScore: {
              $divide: [
                {
                  $add: [
                    { $ifNull: ["$views", 0] },
                    { $multiply: [{ $size: { $ifNull: ["$likes", []] } }, 2] },
                    { $multiply: [{ $ifNull: ["$shares", 0] }, 3] },
                  ],
                },
                {
                  $add: [
                    {
                      $divide: [
                        { $subtract: [new Date(), "$createdAt"] },
                        3600000,
                      ],
                    },
                    1,
                  ],
                },
              ],
            },
          },
        },
        { $sort: { trendingScore: -1 } },
        {
          $facet: {
            data: [{ $skip: skip }, { $limit: limitNum }],
            totalCount: [{ $count: "count" }],
          },
        },
      ];

      const [result] = await Story.aggregate(pipeline);
      const stories = result.data || [];
      const total = result.totalCount[0]?.count || 0;
      const totalPages = Math.ceil(total / limitNum);

      return res.status(200).json({
        success: true,
        count: stories.length,
        data: stories,
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalCount: total,
          hasMore: pageNum < totalPages,
        },
      });
    }

    let query = {
      $and: [
        { $or: [{ expiresAt: { $gt: new Date() } }, { isHighlighted: true }] },
        {
          $or: [
            { scheduledAt: { $exists: false } },
            { scheduledAt: null },
            { scheduledAt: { $lte: new Date() } },
          ],
        },
      ],
    };

    if (lat && lng && district) {
      // Robust query: Match within radius OR match district (for stories without coordinates)
      query.$or = [
        {
          location: {
            $geoWithin: {
              $centerSphere: [
                [parseFloat(lng), parseFloat(lat)],
                parseFloat(radius) / 6378100,
              ],
            },
          },
        },
        {
          $and: [
            { district: { $regex: new RegExp(`^${escapeRegex(district)}$`, "i") } },
            {
              $or: [
                { location: { $exists: false } },
                { location: null },
                { "location.coordinates": { $exists: false } },
                { "location.coordinates": { $size: 0 } },
              ],
            },
          ],
        },
      ];
    } else if (lat && lng) {
      query.location = {
        $geoWithin: {
          $centerSphere: [
            [parseFloat(lng), parseFloat(lat)],
            parseFloat(radius) / 6378100,
          ],
        },
      };
    } else if (district) {
      query.district = { $regex: new RegExp(`^${escapeRegex(district)}$`, "i") };
    }

    if (type && type !== "All") {
      query.type = type;
    }

    if (search) {
      query.$or = [
        { title: { $regex: escapeRegex(search), $options: "i" } },
        { content: { $regex: escapeRegex(search), $options: "i" } },
      ];
    }

    const total = await Story.countDocuments(query);
    const totalPages = Math.ceil(total / limitNum);

    let sortOption = { createdAt: -1 };
    if (sort === "nearest" && lat && lng) {
      sortOption = { createdAt: -1 };
    }

    const stories = await Story.find(query)
      .sort(sortOption)
      .skip(skip)
      .limit(limitNum);

    res.status(200).json({
      success: true,
      count: stories.length,
      data: stories,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalCount: total,
        hasMore: pageNum < totalPages,
      },
    });
  } catch (error) {
    logger.error({ err: error }, "Error fetching stories");
    next(error);
  }
};

exports.getStoryById = async (req, res, next) => {
  try {
    const story = await Story.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: true },
    );

    if (!story) {
      return res
        .status(404)
        .json({ success: false, message: "Story not found" });
    }

    if (
      !story.isHighlighted &&
      story.expiresAt &&
      story.expiresAt < new Date()
    ) {
      return res.status(404).json({
        success: false,
        message: "This story has expired and is no longer available",
      });
    }

    res.status(200).json({
      success: true,
      data: story,
    });
  } catch (error) {
    logger.error(
      { err: error, storyId: req.params.id },
      "Error fetching story by ID",
    );
    next(error);
  }
};

exports.createStory = async (req, res, next) => {
  try {
    let {
      title,
      content,
      type,
      image,
      district,
      taluka,
      author,
      isHighlighted,
      highlightCategory,
      poll,
      media: mediaInput,
      latitude,
      longitude,
      locationAddress,
      actionLink,
    } = req.body;

    if (!district || !taluka) {
      const user = await User.findById(req.user.id);
      if (user) {
        if (!district) district = user.district;
        if (!taluka) taluka = user.taluka;
      }
    }

    if (isHighlighted) {
      const user = await User.findById(req.user.id);
      if (
        !user ||
        (user.subscription?.plan !== "gold" &&
          user.subscription?.plan !== "platinum")
      ) {
        logger.warn(
          { userId: req.user.id },
          "Unauthorized attempt to create highlight",
        );
        return res.status(403).json({
          success: false,
          message:
            "Only Gold and Platinum members can create story highlights.",
        });
      }
    }

    logger.debug({ title, type, userId: req.user.id }, "Creating new story");

    let imageUrl = image;
    if (image && image.startsWith("data:image")) {
      const uploadRes = await uploadMedia(image, "stories");
      imageUrl = uploadRes.secure_url;
    }

    let mediaArr = [];
    if (Array.isArray(mediaInput) && mediaInput.length > 0) {
      for (const item of mediaInput.slice(0, 5)) {
        if (item.url && item.url.startsWith("data:")) {
          try {
            const uploadRes = await uploadMedia(item.url, "stories");
            mediaArr.push({
              url: uploadRes.secure_url,
              type: item.type || "image",
              thumbnail: item.thumbnail || null,
            });
          } catch (uploadErr) {
            logger.warn({ err: uploadErr }, "Failed to upload media item");
          }
        } else if (item.url) {
          mediaArr.push({
            url: item.url,
            type: item.type || "image",
            thumbnail: item.thumbnail || null,
          });
        }
      }

      if (!imageUrl && mediaArr.length > 0) {
        imageUrl = mediaArr[0].url;
      }
    }

    const now = new Date();
    const expiresAt = isHighlighted
      ? null
      : new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const storyData = {
      title,
      content,
      type,
      image: imageUrl,
      media: mediaArr,
      district,
      taluka,
      author,
      authorId: req.user.id,
      isHighlighted: isHighlighted || false,
      highlightCategory: highlightCategory || "Other",
      createdAt: now,
      expiresAt,
      locationAddress: locationAddress || "",
    };

    if (actionLink && actionLink.url) {
      storyData.actionLink = actionLink;
    }

    const geoData = buildLocationGeoJSON({ latitude, longitude, locationAddress });
    if (geoData.location) {
      storyData.location = geoData.location;
      if (geoData.locationAddress) {
        storyData.locationAddress = geoData.locationAddress;
      }
    }

    if (
      poll &&
      poll.question &&
      Array.isArray(poll.options) &&
      poll.options.length >= 2
    ) {
      storyData.poll = {
        question: poll.question,
        options: poll.options.map((opt) => ({
          text: typeof opt === "string" ? opt : opt.text,
          votes: [],
        })),
        endsAt: poll.endsAt
          ? new Date(poll.endsAt)
          : new Date(now.getTime() + 24 * 60 * 60 * 1000),
      };
    }

    const story = await Story.create(storyData);
    logger.info(
      { storyId: story._id, userId: req.user.id },
      "Story created successfully",
    );

    await User.findByIdAndUpdate(req.user.id, {
      $inc: { "usage.storiesPosted": 1 },
    });

    try {
      const io = req.app.get("io");
      if (io && storyData.district) {
        io.to(`stories_${storyData.district}`).emit("new_story", story);
      }
    } catch (socketErr) {
      logger.warn({ err: socketErr }, "Socket emit failed for new story");
    }

    try {
      const { sendPushNotification } = require("../utils/pushService");
      const { createNotification } = require("./notificationController");
      const nearbyUsers = await User.find({
        district: storyData.district,
        _id: { $ne: req.user.id },
        notificationsEnabled: true,
      })
        .select("_id")
        .limit(100);

      for (const u of nearbyUsers) {
        await sendPushNotification(u._id, {
          title: `New ${type} in your area`,
          body: title.length > 60 ? title.substring(0, 60) + "..." : title,
          data: { url: `/stories/${story._id}`, type: "story" },
        }).catch(() => {});

        await createNotification({
          recipientId: u._id,
          type: "story",
          title: `New ${type} nearby: ${title}`,
          message:
            content.length > 80 ? content.substring(0, 80) + "..." : content,
          actionUrl: `/stories/${story._id}`,
          metadata: { storyId: story._id },
          io: req.app.get("io"),
        }).catch(() => {});
      }
    } catch (pushErr) {
      logger.warn({ err: pushErr }, "Push notification failed for new story");
    }

    res.status(201).json({
      success: true,
      data: story,
      message: isHighlighted
        ? "Highlight created successfully!"
        : "Story will be automatically removed after 24 hours",
    });
  } catch (error) {
    logger.error({ err: error }, "Error creating story");
    next(error);
  }
};

exports.updateStory = async (req, res, next) => {
  try {
    const story = await Story.findById(req.params.id);
    if (!story) {
      return res
        .status(404)
        .json({ success: false, message: "Story not found" });
    }
    if (story.authorId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to edit this story",
      });
    }

    const allowedFields = [
      "title",
      "content",
      "type",
      "image",
      "locationAddress",
      "district",
      "taluka",
      "media",
      "poll",
      "actionLink",
      "isHighlighted",
      "highlightCategory",
    ];
    const updates = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (req.body.isHighlighted !== undefined) {
      updates.expiresAt = req.body.isHighlighted ? null : new Date(Date.now() + 24 * 60 * 60 * 1000);
    }

    if (updates.image && updates.image.startsWith("data:image")) {
      const uploadRes = await uploadMedia(updates.image, "stories");
      updates.image = uploadRes.secure_url;
    }

    // Handle multi-media updates
    if (Array.isArray(req.body.media)) {
      const mediaArr = [];
      if (req.body.media.length > 0) {
        for (const item of req.body.media.slice(0, 5)) {
          if (item.url && item.url.startsWith("data:")) {
            try {
              const uploadRes = await uploadMedia(item.url, "stories");
              mediaArr.push({
                url: uploadRes.secure_url,
                type: item.type || "image",
                thumbnail: item.thumbnail || null,
              });
            } catch (uploadErr) {
              logger.warn({ err: uploadErr }, "Failed to upload media item during update");
            }
          } else if (item.url) {
            mediaArr.push({
              url: item.url,
              type: item.type || "image",
              thumbnail: item.thumbnail || null,
            });
          }
        }
      }
      updates.media = mediaArr;
      if (!updates.image && mediaArr.length > 0) {
        updates.image = mediaArr[0].url;
      } else if (mediaArr.length === 0) {
        updates.image = "";
      }
    }

    if (req.body.latitude && req.body.longitude) {
      const geoData = buildLocationGeoJSON({
        latitude: req.body.latitude,
        longitude: req.body.longitude,
        locationAddress: req.body.locationAddress,
      });
      if (geoData.location) {
        updates.location = geoData.location;
        if (geoData.locationAddress) updates.locationAddress = geoData.locationAddress;
      }
    }

    const updatedStory = await Story.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true },
    );

    logger.info({ storyId: req.params.id }, "Story updated");

    res.status(200).json({
      success: true,
      data: updatedStory,
      message: "Story updated successfully",
    });
  } catch (error) {
    logger.error(
      { err: error, storyId: req.params.id },
      "Error updating story",
    );
    next(error);
  }
};

exports.getHighlightsByBusiness = async (req, res, next) => {
  try {
    const { ownerId } = req.params;
    const highlights = await Story.find({
      authorId: ownerId,
      isHighlighted: true,
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: highlights.length,
      data: highlights,
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteStory = async (req, res, next) => {
  try {
    const story = await Story.findById(req.params.id);
    if (!story) {
      return res
        .status(404)
        .json({ success: false, message: "Story not found" });
    }
    if (story.authorId.toString() !== req.user.id) {
      logger.warn(
        { storyId: req.params.id, userId: req.user.id },
        "Unauthorized attempt to delete story",
      );
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this story",
      });
    }

    await story.deleteOne();
    logger.info(
      { storyId: req.params.id, userId: req.user.id },
      "Story deleted successfully",
    );

    res.status(200).json({
      success: true,
      message: "Story deleted",
    });
  } catch (error) {
    logger.error(
      { err: error, storyId: req.params.id },
      "Error deleting story",
    );
    next(error);
  }
};

exports.toggleLike = async (req, res, next) => {
  try {
    const story = await Story.findById(req.params.id);
    if (!story) {
      return res
        .status(404)
        .json({ success: false, message: "Story not found" });
    }

    const isLiked = story.likes.includes(req.user.id);
    const update = isLiked
      ? { $pull: { likes: req.user.id } }
      : { $addToSet: { likes: req.user.id } };

    const updatedStory = await Story.findByIdAndUpdate(req.params.id, update, {
      new: true,
    });

    try {
      const io = req.app.get("io");
      if (io && updatedStory.district) {
        io.to(`stories_${updatedStory.district}`).emit("story_updated", {
          _id: updatedStory._id,
          likes: updatedStory.likes,
        });
      }
    } catch (socketErr) {
      logger.warn({ err: socketErr }, "Socket emit failed for like update");
    }

    res.status(200).json({
      success: true,
      data: updatedStory,
      isLiked: !isLiked,
    });
  } catch (error) {
    next(error);
  }
};

exports.incrementShare = async (req, res, next) => {
  try {
    const updatedStory = await Story.findByIdAndUpdate(
      req.params.id,
      { $inc: { shares: 1 } },
      { new: true },
    );

    if (!updatedStory) {
      return res
        .status(404)
        .json({ success: false, message: "Story not found" });
    }

    res.status(200).json({
      success: true,
      data: updatedStory,
    });
  } catch (error) {
    next(error);
  }
};

exports.addComment = async (req, res, next) => {
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

    const story = await Story.findById(req.params.id);
    if (!story) {
      return res
        .status(404)
        .json({ success: false, message: "Story not found" });
    }

    const newComment = {
      user: req.user.id,
      userName: user.name,
      text: text.trim(),
      createdAt: new Date(),
    };

    story.comments.push(newComment);
    await story.save();

    const addedComment = story.comments[story.comments.length - 1];

    try {
      const io = req.app.get("io");
      if (io && story.district) {
        io.to(`stories_${story.district}`).emit("story_comment", {
          storyId: story._id,
          comment: addedComment,
        });
      }
    } catch (socketErr) {
      logger.warn({ err: socketErr }, "Socket emit failed for comment");
    }

    res.status(201).json({
      success: true,
      data: addedComment,
      message: "Comment added",
    });
  } catch (error) {
    logger.error(
      { err: error, storyId: req.params.id },
      "Error adding comment",
    );
    next(error);
  }
};

exports.deleteComment = async (req, res, next) => {
  try {
    const { id, commentId } = req.params;

    const story = await Story.findById(id);
    if (!story) {
      return res
        .status(404)
        .json({ success: false, message: "Story not found" });
    }

    const comment = story.comments.id(commentId);
    if (!comment) {
      return res
        .status(404)
        .json({ success: false, message: "Comment not found" });
    }

    if (
      comment.user.toString() !== req.user.id &&
      story.authorId.toString() !== req.user.id
    ) {
      return res.status(401).json({
        success: false,
        message: "Not authorized to delete this comment",
      });
    }

    story.comments.pull(commentId);
    await story.save();

    res.status(200).json({
      success: true,
      message: "Comment deleted",
    });
  } catch (error) {
    logger.error({ err: error }, "Error deleting comment");
    next(error);
  }
};

exports.toggleBookmark = async (req, res, next) => {
  try {
    const storyId = req.params.id;
    const userId = req.user.id;

    const story = await Story.findById(storyId);
    if (!story) {
      return res
        .status(404)
        .json({ success: false, message: "Story not found" });
    }

    const user = await User.findById(userId);
    const isBookmarked = user.savedStories?.includes(storyId);

    if (isBookmarked) {
      await User.findByIdAndUpdate(userId, {
        $pull: { savedStories: storyId },
      });
    } else {
      await User.findByIdAndUpdate(userId, {
        $addToSet: { savedStories: storyId },
      });
    }

    res.status(200).json({
      success: true,
      isBookmarked: !isBookmarked,
      message: isBookmarked ? "Bookmark removed" : "Story saved",
    });
  } catch (error) {
    logger.error({ err: error }, "Error toggling bookmark");
    next(error);
  }
};

exports.getSavedStories = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).populate({
      path: "savedStories",
      options: { sort: { createdAt: -1 } },
    });

    res.status(200).json({
      success: true,
      data: user.savedStories || [],
    });
  } catch (error) {
    logger.error({ err: error }, "Error fetching saved stories");
    next(error);
  }
};

exports.votePoll = async (req, res, next) => {
  try {
    const { optionIndex } = req.body;
    const storyId = req.params.id;
    const userId = req.user.id;

    const story = await Story.findById(storyId);
    if (!story) {
      return res
        .status(404)
        .json({ success: false, message: "Story not found" });
    }
    if (!story.poll || !story.poll.question) {
      return res
        .status(400)
        .json({ success: false, message: "This story has no poll" });
    }
    if (story.poll.endsAt && new Date(story.poll.endsAt) < new Date()) {
      return res
        .status(400)
        .json({ success: false, message: "This poll has ended" });
    }
    if (optionIndex < 0 || optionIndex >= story.poll.options.length) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid option" });
    }

    for (const option of story.poll.options) {
      option.votes = option.votes.filter((v) => v.toString() !== userId);
    }

    story.poll.options[optionIndex].votes.push(userId);
    await story.save();

    res.status(200).json({
      success: true,
      data: story.poll,
      message: "Vote recorded",
    });
  } catch (error) {
    logger.error({ err: error }, "Error voting on poll");
    next(error);
  }
};

exports.getRelatedStories = async (req, res, next) => {
  try {
    const story = await Story.findById(req.params.id);
    if (!story) {
      return res
        .status(404)
        .json({ success: false, message: "Story not found" });
    }

    const related = await Story.find({
      _id: { $ne: story._id },
      $or: [{ type: story.type }, { district: story.district }],
      $and: [
        { $or: [{ expiresAt: { $gt: new Date() } }, { isHighlighted: true }] },
      ],
    })
      .sort({ createdAt: -1 })
      .limit(4)
      .select("title type image district createdAt likes views author");

    res.status(200).json({
      success: true,
      data: related,
    });
  } catch (error) {
    logger.error({ err: error }, "Error fetching related stories");
    next(error);
  }
};

exports.getMyStoryStats = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const stories = await Story.find({ authorId: userId })
      .sort({ views: -1 })
      .select("title views likes shares comments createdAt type image");

    const totalViews = stories.reduce((sum, s) => sum + (s.views || 0), 0);
    const totalLikes = stories.reduce(
      (sum, s) => sum + (s.likes?.length || 0),
      0,
    );
    const totalShares = stories.reduce((sum, s) => sum + (s.shares || 0), 0);
    const totalComments = stories.reduce(
      (sum, s) => sum + (s.comments?.length || 0),
      0,
    );

    const activeStories = stories.filter((s) =>
      s.expiresAt ? new Date(s.expiresAt) > new Date() : true,
    );

    res.status(200).json({
      success: true,
      data: {
        totalStories: stories.length,
        activeStories: activeStories.length,
        totalViews,
        totalLikes,
        totalShares,
        totalComments,
        topStories: stories.slice(0, 5),
        allStories: stories,
      },
    });
  } catch (error) {
    logger.error({ err: error }, "Error fetching story stats");
    next(error);
  }
};

exports.verifyStory = async (req, res, next) => {
  try {
    const story = await Story.findByIdAndUpdate(
      req.params.id,
      { $set: { isVerified: !req.body.currentState } },
      { new: true },
    );
    if (!story) {
      return res
        .status(404)
        .json({ success: false, message: "Story not found" });
    }
    res.status(200).json({ success: true, data: story });
  } catch (error) {
    next(error);
  }
};

exports.featureStory = async (req, res, next) => {
  try {
    const story = await Story.findByIdAndUpdate(
      req.params.id,
      { $set: { isFeatured: !req.body.currentState } },
      { new: true },
    );
    if (!story) {
      return res
        .status(404)
        .json({ success: false, message: "Story not found" });
    }
    res.status(200).json({ success: true, data: story });
  } catch (error) {
    next(error);
  }
};

exports.adminDeleteComment = async (req, res, next) => {
  try {
    const { id, commentId } = req.params;
    const story = await Story.findById(id);
    if (!story) {
      return res
        .status(404)
        .json({ success: false, message: "Story not found" });
    }

    story.comments.pull(commentId);
    await story.save();

    res
      .status(200)
      .json({ success: true, message: "Comment deleted by admin" });
  } catch (error) {
    next(error);
  }
};
