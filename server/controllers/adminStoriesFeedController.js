const Story = require("../models/Story");
const Feed = require("../models/Feed");

exports.getStoriesFeedStats = async (req, res) => {
  try {
    const [totalStories, totalFeeds] = await Promise.all([
      Story.countDocuments(),
      Feed.countDocuments(),
    ]);

    const storyTypes = await Story.aggregate([
      { $group: { _id: "$type", count: { $sum: 1 } } },
    ]);

    const feedTypes = await Feed.aggregate([
      { $group: { _id: "$type", count: { $sum: 1 } } },
    ]);

    res.json({
      totalStories,
      totalFeeds,
      totalContent: totalStories + totalFeeds,
      storyTypes: storyTypes.reduce((acc, t) => {
        acc[t._id] = t.count;
        return acc;
      }, {}),
      feedTypes: feedTypes.reduce((acc, t) => {
        acc[t._id] = t.count;
        return acc;
      }, {}),
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
exports.getStories = async (req, res) => {
  try {
    const { page = 1, limit = 6, search = "", type } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    const query = {};

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { content: { $regex: search, $options: "i" } },
        { author: { $regex: search, $options: "i" } },
      ];
    }

    if (type && type !== "All") {
      query.type = type;
    }

    const [stories, total] = await Promise.all([
      Story.find(query)
        .populate("authorId", "name email profilePic")
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .lean(),
      Story.countDocuments(query),
    ]);

    res.json({
      stories,
      totalPages: Math.ceil(total / limitNum),
      currentPage: pageNum,
      total,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
exports.getFeeds = async (req, res) => {
  try {
    const { page = 1, limit = 6, search = "", type } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    const query = {};

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { content: { $regex: search, $options: "i" } },
        { author: { $regex: search, $options: "i" } },
      ];
    }

    if (type && type !== "All") {
      query.type = type;
    }

    const [feeds, total] = await Promise.all([
      Feed.find(query)
        .populate("authorId", "name email profilePic")
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .lean(),
      Feed.countDocuments(query),
    ]);

    res.json({
      feeds,
      totalPages: Math.ceil(total / limitNum),
      currentPage: pageNum,
      total,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.getStoryDetails = async (req, res) => {
  try {
    const story = await Story.findById(req.params.id)
      .populate("authorId", "name email phone profilePic district taluka subscription")
      .lean();

    if (!story) {
      return res.status(404).json({ message: "Story not found" });
    }

    res.json(story);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.getFeedDetails = async (req, res) => {
  try {
    const feed = await Feed.findById(req.params.id)
      .populate("authorId", "name email phone profilePic district taluka subscription")
      .lean();

    if (!feed) {
      return res.status(404).json({ message: "Feed post not found" });
    }

    res.json(feed);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.deleteStory = async (req, res) => {
  try {
    const story = await Story.findByIdAndDelete(req.params.id);
    if (!story) {
      return res.status(404).json({ message: "Story not found" });
    }
    res.json({ message: "Story deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.deleteFeed = async (req, res) => {
  try {
    const feed = await Feed.findByIdAndDelete(req.params.id);
    if (!feed) {
      return res.status(404).json({ message: "Feed not found" });
    }
    res.json({ message: "Feed post deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.verifyStory = async (req, res) => {
  try {
    const story = await Story.findByIdAndUpdate(
      req.params.id,
      { $set: { isVerified: !req.body.currentState } },
      { new: true },
    );
    if (!story) {
      return res.status(404).json({ success: false, message: "Story not found" });
    }
    res.status(200).json({ success: true, data: story });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.featureStory = async (req, res) => {
  try {
    const story = await Story.findByIdAndUpdate(
      req.params.id,
      { $set: { isFeatured: !req.body.currentState } },
      { new: true },
    );
    if (!story) {
      return res.status(404).json({ success: false, message: "Story not found" });
    }
    res.status(200).json({ success: true, data: story });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.adminDeleteComment = async (req, res) => {
  try {
    const { id, commentId } = req.params;
    const story = await Story.findById(id);
    if (!story) {
      return res.status(404).json({ success: false, message: "Story not found" });
    }

    story.comments.pull(commentId);
    await story.save();

    res.status(200).json({ success: true, message: "Comment deleted by admin" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateStory = async (req, res) => {
  try {
    const { title, content } = req.body;
    const story = await Story.findByIdAndUpdate(
      req.params.id,
      { $set: { title, content } },
      { new: true },
    );

    if (!story) {
      return res.status(404).json({ success: false, message: "Story not found" });
    }

    res.status(200).json({ success: true, data: story, message: "Story updated by admin" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
