const Campaign = require("../models/Campaign");
const User = require("../models/User");
const Notification = require("../models/Notification");

const buildSegmentQuery = (segment = {}) => {
  const query = {};
  if (segment.districts?.length) query.district = { $in: segment.districts };
  if (segment.plans?.length)
    query["subscription.plan"] = { $in: segment.plans };
  if (segment.lastLoginBefore)
    query.lastLoginDate = {
      ...query.lastLoginDate,
      $lte: new Date(segment.lastLoginBefore),
    };
  if (segment.lastLoginAfter)
    query.lastLoginDate = {
      ...query.lastLoginDate,
      $gte: new Date(segment.lastLoginAfter),
    };
  if (segment.minLoyaltyPoints != null)
    query.loyaltyPoints = {
      ...query.loyaltyPoints,
      $gte: segment.minLoyaltyPoints,
    };
  if (segment.maxLoyaltyPoints != null)
    query.loyaltyPoints = {
      ...query.loyaltyPoints,
      $lte: segment.maxLoyaltyPoints,
    };
  return query;
};
exports.getCampaigns = async (req, res) => {
  try {
    const campaigns = await Campaign.find()
      .sort({ createdAt: -1 })
      .populate("createdBy", "name email")
      .lean();
    res.json(campaigns);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.createCampaign = async (req, res) => {
  try {
    const { name, description, type, segment, notification, scheduledAt } =
      req.body;

    const query = buildSegmentQuery(segment);
    const targetedCount = await User.countDocuments(query);

    const campaign = await Campaign.create({
      name,
      description,
      type,
      segment,
      notification,
      scheduledAt,
      createdBy: req.admin._id,
      status: scheduledAt ? "scheduled" : "draft",
      stats: { targetedCount },
    });

    res.status(201).json({ campaign, targetedCount });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.sendCampaign = async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign)
      return res.status(404).json({ message: "Campaign not found" });
    if (campaign.status === "running" || campaign.status === "completed") {
      return res.status(400).json({ message: "Campaign already sent" });
    }

    const query = buildSegmentQuery(campaign.segment);
    const users = await User.find(query).select("_id").lean();

    const notifications = users.map((u) => ({
      user: u._id,
      type: "campaign",
      title: campaign.notification.title,
      message: campaign.notification.body,
      referenceId: campaign._id,
      referenceType: "Campaign",
      seen: false,
      seenAt: null,
    }));

    if (notifications.length > 0) {
      await Notification.insertMany(notifications, { ordered: false });
    }

    campaign.status = "completed";
    campaign.stats.sentCount = users.length;
    await campaign.save();

    const io = req.app.get("io");
    if (io) {
      users.forEach((u) => {
        io.to(`user_${u._id}`).emit("newNotification", {
          title: campaign.notification.title,
          message: campaign.notification.body,
        });
      });
    }

    res.json({ message: "Campaign sent", sentCount: users.length });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.markNotificationSeen = async (req, res) => {
  try {
    const notif = await Notification.findByIdAndUpdate(
      req.params.id,
      { seen: true, seenAt: new Date() },
      { new: true },
    );
    if (!notif)
      return res.status(404).json({ message: "Notification not found" });

    if (notif.referenceType === "Campaign" && notif.referenceId) {
      await Campaign.findByIdAndUpdate(notif.referenceId, {
        $inc: { "stats.openedCount": 1 },
      });
    }

    res.json({ success: true, notif });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.previewSegment = async (req, res) => {
  try {
    const segment = req.body.segment || {};
    const query = buildSegmentQuery(segment);
    const count = await User.countDocuments(query);
    const sample = await User.find(query)
      .select(
        "name email district subscription.plan loyaltyPoints lastLoginDate",
      )
      .limit(5)
      .lean();
    res.json({ count, sample });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.deleteCampaign = async (req, res) => {
  try {
    await Campaign.findByIdAndDelete(req.params.id);
    res.json({ message: "Campaign deleted" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.runCampaign = async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign)
      return res.status(404).json({ message: "Campaign not found" });

    if (campaign.status === "completed") {
      return res.status(400).json({ message: "Campaign already completed" });
    }

    campaign.status = "running";
    await campaign.save();

    setTimeout(async () => {
      campaign.status = "completed";
      await campaign.save();
    }, 5000);

    res.json({ message: "Campaign execution started", campaign });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
