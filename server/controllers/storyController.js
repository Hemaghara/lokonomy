const Story = require("../models/Story");
const User = require("../models/User");
const { uploadMedia } = require("../utils/uploadMedia");
const { buildLocationGeoJSON } = require("../utils/geoHelpers");
const logger = require("../utils/logger");

exports.getAllStories = async (req, res, next) => {
  try {
    const { lat, lng, radius = 5000, district, type, search } = req.query;
    let query = {
      $or: [{ expiresAt: { $gt: new Date() } }, { isHighlighted: true }],
    };

    if (lat && lng) {
      query.location = {
        $geoWithin: {
          $centerSphere: [
            [parseFloat(lng), parseFloat(lat)],
            parseFloat(radius) / 6378100,
          ],
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

    const stories = await Story.find(query).sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: stories.length,
      data: stories,
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
    const {
      title,
      content,
      type,
      image,
      district,
      taluka,
      author,
      isHighlighted,
      highlightCategory,
    } = req.body;

    if (isHighlighted) {
      const user = await User.findById(req.user.id);
      if (
        !user ||
        (user.subscription.plan !== "gold" &&
          user.subscription.plan !== "platinum")
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
      const res = await uploadMedia(image, "stories");
      imageUrl = res.secure_url;
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
      district,
      taluka,
      author,
      authorId: req.user.id,
      isHighlighted: isHighlighted || false,
      highlightCategory: highlightCategory || "Other",
      createdAt: now,
      expiresAt,
    };

    const geoData = buildLocationGeoJSON(req.body);
    if (geoData.location) {
      storyData.location = geoData.location;
      storyData.locationAddress = geoData.locationAddress;
    }

    const story = await Story.create(storyData);
    logger.info(
      { storyId: story._id, userId: req.user.id },
      "Story created successfully",
    );

    await User.findByIdAndUpdate(req.user.id, {
      $inc: { "usage.storiesPosted": 1 },
    });

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
      return res.status(401).json({
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
