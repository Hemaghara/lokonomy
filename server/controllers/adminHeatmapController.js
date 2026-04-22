const User = require("../models/User");
const SubscriptionTransaction = require("../models/SubscriptionTransaction");
const Report = require("../models/Report");
const Story = require("../models/Story");
const Feed = require("../models/Feed");

exports.getHeatmapData = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 365;
    const since = new Date();
    since.setDate(since.getDate() - days);
    since.setHours(0, 0, 0, 0);

    const aggregate = async (Model, dateField, valueField = null) => {
      const group = valueField
        ? {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: `$${dateField}` },
            },
            value: { $sum: `$${valueField}` },
          }
        : {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: `$${dateField}` },
            },
            value: { $sum: 1 },
          };
      const result = await Model.aggregate([
        { $match: { [dateField]: { $gte: since } } },
        { $group: group },
        { $sort: { _id: 1 } },
      ]);
      return Object.fromEntries(result.map((r) => [r._id, r.value]));
    };

    const [signupMap, revenueMap, reportMap, storyMap, feedMap] =
      await Promise.all([
        aggregate(User, "createdAt"),
        aggregate(SubscriptionTransaction, "createdAt", "amount").catch(
          () => ({}),
        ),
        aggregate(Report, "createdAt").catch(() => ({})),
        aggregate(Story, "createdAt").catch(() => ({})),
        aggregate(Feed, "createdAt").catch(() => ({})),
      ]);

    const dates = [];
    const cursor = new Date(since);
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    while (cursor <= today) {
      const key = cursor.toISOString().split("T")[0];
      dates.push({
        date: key,
        signups: signupMap[key] || 0,
        revenue: revenueMap[key] || 0,
        reports: reportMap[key] || 0,
        content: (storyMap[key] || 0) + (feedMap[key] || 0),
      });
      cursor.setDate(cursor.getDate() + 1);
    }

    res.json({ days, dates });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
