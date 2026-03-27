const Story = require("../models/Story");
const User = require("../models/User");
const { uploadMedia } = require("../utils/uploadMedia");
const buildLocationGeoJSON = (body) => {
  const { latitude, longitude, locationAddress } = body;
  console.log(`Latitude:${latitude}`);
  console.log(`Longitude:${longitude}`);
  console.log(`Location Address:${locationAddress}`);
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
    console.log(`Stories:${stories}`);
    res.status(200).json({
      success: true,
      count: stories.length,
      data: stories,
    });
  } catch (error) {
    next(error);
  }
};

exports.getStoryById = async (req, res, next) => {
  try {
    const story = await Story.findById(req.params.id);
    console.log(`Story:${story}`);

    if (!story) {
      return res
        .status(404)
        .json({ success: false, message: "Story not found" });
    }

    if (story.expiresAt && story.expiresAt < new Date()) {
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
        return res.status(403).json({
          success: false,
          message:
            "Only Gold and Platinum members can create story highlights.",
        });
      }
    }

    console.log(`Title:${title}`);
    console.log(`Content:${content}`);
    console.log(`Type:${type}`);
    console.log(`Image:${image}`);
    console.log(`District:${district}`);
    console.log(`Taluka:${taluka}`);
    console.log(`Author:${author}`);

    let imageUrl = image;
    if (image && image.startsWith("data:image")) {
      const res = await uploadMedia(image, "stories");
      imageUrl = res.secure_url;
    }
    console.log(`Image URL:${imageUrl}`);

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
    console.log(`Story Data:${JSON.stringify(storyData)}`);

    const geoData = buildLocationGeoJSON(req.body);
    console.log(`Geo Data:${JSON.stringify(geoData)}`);
    if (geoData.location) {
      storyData.location = geoData.location;
      storyData.locationAddress = geoData.locationAddress;
    }

    const story = await Story.create(storyData);
    console.log(`Story:${story}`);

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
    console.error("Error creating story:", error);
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
    console.log(`Story:${story}`);
    if (!story) {
      return res
        .status(404)
        .json({ success: false, message: "Story not found" });
    }
    if (story.authorId.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        message: "Not authorized to delete this story",
      });
    }

    await story.deleteOne();

    res.status(200).json({
      success: true,
      message: "Story deleted",
    });
  } catch (error) {
    next(error);
  }
};
