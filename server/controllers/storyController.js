const Story = require("../models/Story");
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

exports.getAllStories = async (req, res, next) => {
  try {
    const { lat, lng, radius = 5000, district, type, search } = req.query;
    let query = { expiresAt: { $gt: new Date() } };

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

    let stories;
    if (lat && lng) {
      stories = await Story.find(query);
    } else {
      stories = await Story.find(query).sort({ createdAt: -1 });
    }
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

    if (!story) {
      return res
        .status(404)
        .json({ success: false, message: "Story not found" });
    }

    if (story.expiresAt && story.expiresAt < new Date()) {
      return res
        .status(404)
        .json({
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
    const { title, content, type, image, district, taluka, author } = req.body;

    let imageUrl = image;
    if (image && image.startsWith("data:image")) {
      imageUrl = await uploadToCloudinary(image, "stories");
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); 

    const storyData = {
      title,
      content,
      type,
      image: imageUrl,
      district,
      taluka,
      author,
      authorId: req.user.id,
      createdAt: now,
      expiresAt,
    };

    const geoData = buildLocationGeoJSON(req.body);
    if (geoData.location) {
      storyData.location = geoData.location;
      storyData.locationAddress = geoData.locationAddress;
    }

    const story = await Story.create(storyData);

    res.status(201).json({
      success: true,
      data: story,
      message: "Story will be automatically removed after 24 hours",
    });
  } catch (error) {
    console.error("Error creating story:", error);
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
