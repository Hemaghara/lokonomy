const Story = require("../models/Story");
const Feed = require("../models/Feed");

exports.getScheduledContent = async (req, res) => {
  try {
    const now = new Date();

    const [scheduledStories, expiringStories, pinnedFeeds, scheduledFeeds] =
      await Promise.all([
        Story.find({ scheduledAt: { $gte: now } })
          .select("title author scheduledAt expiresAt status")
          .populate("author", "name email")
          .sort({ scheduledAt: 1 })
          .limit(50)
          .lean(),
        Story.find({
          expiresAt: {
            $gte: now,
            $lte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
          },
        })
          .select("title author expiresAt status")
          .populate("author", "name email")
          .sort({ expiresAt: 1 })
          .limit(20)
          .lean(),
        Feed.find({ isPinned: true })
          .select("caption author isPinned pinnedAt createdAt")
          .populate("author", "name email")
          .sort({ pinnedAt: -1 })
          .limit(20)
          .lean(),
        Feed.find({ scheduledAt: { $gte: now } })
          .select("caption author scheduledAt")
          .populate("author", "name email")
          .sort({ scheduledAt: 1 })
          .limit(20)
          .lean(),
      ]);

    res.json({
      scheduledStories,
      expiringStories,
      pinnedFeeds,
      scheduledFeeds,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.scheduleStory = async (req, res) => {
  try {
    const { scheduledAt, expiresAt } = req.body;
    const story = await Story.findByIdAndUpdate(
      req.params.id,
      { scheduledAt: scheduledAt || null, expiresAt: expiresAt || null },
      { new: true },
    );
    if (!story) return res.status(404).json({ message: "Story not found" });
    res.json({ message: "Story scheduled", story });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.togglePinFeed = async (req, res) => {
  try {
    const feed = await Feed.findById(req.params.id);
    if (!feed) return res.status(404).json({ message: "Feed post not found" });

    feed.isPinned = !feed.isPinned;
    feed.pinnedAt = feed.isPinned ? new Date() : null;
    await feed.save();

    res.json({
      message: feed.isPinned ? "Post pinned" : "Post unpinned",
      feed,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.scheduleFeed = async (req, res) => {
  try {
    const { scheduledAt } = req.body;
    const feed = await Feed.findByIdAndUpdate(
      req.params.id,
      { scheduledAt: scheduledAt || null },
      { new: true },
    );
    if (!feed) return res.status(404).json({ message: "Feed post not found" });
    res.json({ message: "Feed post scheduled", feed });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
