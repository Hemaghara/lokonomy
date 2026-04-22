const Report = require("../models/Report");
const Product = require("../models/Product");
const Story = require("../models/Story");
const Feed = require("../models/Feed");
const Business = require("../models/Business");
const Job = require("../models/Job");
const notificationController = require("./notificationController");
const adminAuditController = require("./adminAuditController");

exports.getAllReports = async (req, res) => {
  try {
    const { status, targetType, page = 1, limit = 10 } = req.query;
    let query = {};

    if (status && status !== "all") query.status = status;
    if (targetType && targetType !== "all") query.targetType = targetType;

    const currentPage = parseInt(page);
    const pageLimit = parseInt(limit);
    const skip = (currentPage - 1) * pageLimit;

    const totalReports = await Report.countDocuments(query);
    const reports = await Report.find(query)
      .populate("reportedBy", "name email")
      .populate("resolvedBy", "name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageLimit);

    res.json({
      reports,
      currentPage,
      totalPages: Math.ceil(totalReports / pageLimit),
      totalReports,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
exports.resolveReport = async (req, res) => {
  try {
    const { action, status } = req.body;
    const report = await Report.findById(req.params.id);

    if (!report) return res.status(404).json({ message: "Report not found" });

    let contentOwnerId = null;
    if (action === "removed") {
      switch (report.targetType) {
        case "feed":
        case "post":
          const feed = await Feed.findById(report.targetId);
          if (feed) {
            contentOwnerId = feed.authorId;
            await Feed.findByIdAndDelete(report.targetId);
          }
          break;
        case "story":
          const story = await Story.findById(report.targetId);
          if (story) {
            contentOwnerId = story.authorId;
            await Story.findByIdAndDelete(report.targetId);
          }
          break;
        case "product":
          const product = await Product.findById(report.targetId);
          if (product) {
            contentOwnerId = product.ownerId;
            await Product.findByIdAndDelete(report.targetId);
          }
          break;
        case "job":
          const job = await Job.findById(report.targetId);
          if (job) {
            contentOwnerId = job.posterId;
            await Job.findByIdAndDelete(report.targetId);
          }
          break;
        case "business":
          const biz = await Business.findById(report.targetId);
          if (biz) {
            contentOwnerId = biz.ownerId;
            await Business.findByIdAndUpdate(report.targetId, {
              verificationStatus: "rejected",
            });
          }
          break;
      }

      if (contentOwnerId) {
        await notificationController.createNotification({
          recipientId: contentOwnerId,
          type: "system",
          title: "Content Removed",
          message: `Your ${report.targetType} has been removed by administrators due to community complaints: ${report.reason}`,
          io: req.app.get("io"),
        });
      }
    } else if (action === "warned") {
      const contentModels = {
        feed: Feed,
        post: Feed,
        story: Story,
        product: Product,
        job: Job,
        business: Business,
      };
      const ownerFields = {
        feed: "authorId",
        post: "authorId",
        story: "authorId",
        product: "ownerId",
        job: "posterId",
        business: "ownerId",
      };
      const Model = contentModels[report.targetType];
      const ownerField = ownerFields[report.targetType];
      if (Model && ownerField) {
        const content = await Model.findById(report.targetId);
        if (content) {
          contentOwnerId = content[ownerField];
          await notificationController.createNotification({
            recipientId: contentOwnerId,
            type: "system",
            title: "Content Warning",
            message: `Your ${report.targetType} has received a community report for: "${report.reason}". Please review and ensure it complies with our community guidelines to avoid removal.`,
            io: req.app.get("io"),
          });
        }
      }
    }

    report.status = status || "resolved";
    report.actionTaken = action;
    report.resolvedBy = req.admin.id;
    report.resolvedAt = new Date();

    await report.save();
    await adminAuditController.logAction(
      req.admin.id,
      "RESOLVE_REPORT",
      `Action: ${action} taken on ${report.targetType} (ID: ${report.targetId})`,
      req.ip,
    );

    res.json({ message: "Report resolved and action taken", report });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.getReportedContent = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ message: "Report not found" });

    let content = null;
    switch (report.targetType) {
      case "feed":
      case "post":
        content = await Feed.findById(report.targetId)
          .populate("authorId", "name profileImage")
          .lean();
        break;
      case "story":
        content = await Story.findById(report.targetId)
          .populate("authorId", "name profileImage")
          .lean();
        break;
      case "product":
        content = await Product.findById(report.targetId)
          .populate("creator", "name profileImage")
          .lean();
        break;
      case "job":
        content = await Job.findById(report.targetId)
          .populate("postedBy", "name profileImage")
          .lean();
        break;
      case "business":
        content = await Business.findById(report.targetId)
          .populate("ownerId", "name profileImage")
          .lean();
        break;
    }

    res.json({
      targetType: report.targetType,
      content: content || {
        deleted: true,
        message: "Content has been removed",
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
