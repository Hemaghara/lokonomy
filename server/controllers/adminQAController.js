const BusinessQA = require("../models/BusinessQA");
const Business = require("../models/Business");
exports.getAllQA = async (req, res) => {
  try {
    const { search, answered, page = 1, limit = 15 } = req.query;
    let query = {};

    if (search) {
      query.$or = [
        { question: { $regex: search, $options: "i" } },
        { askedByName: { $regex: search, $options: "i" } },
      ];
    }
    if (answered === "yes") query["answers.0"] = { $exists: true };
    if (answered === "no") query["answers.0"] = { $exists: false };

    const currentPage = parseInt(page);
    const pageLimit = parseInt(limit);
    const skip = (currentPage - 1) * pageLimit;

    const total = await BusinessQA.countDocuments(query);

    const qas = await BusinessQA.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageLimit)
      .lean();

    const businessIds = [...new Set(qas.map((q) => q.businessId))];
    const businesses = await Business.find({ _id: { $in: businessIds } })
      .select("name")
      .lean();
    const bMap = {};
    businesses.forEach((b) => {
      bMap[String(b._id)] = b.name;
    });

    const enriched = qas.map((q) => ({
      ...q,
      businessName: bMap[q.businessId] || "Unknown Business",
    }));

    const stats = {
      total: await BusinessQA.countDocuments(),
      answered: await BusinessQA.countDocuments({
        "answers.0": { $exists: true },
      }),
      unanswered: await BusinessQA.countDocuments({
        "answers.0": { $exists: false },
      }),
    };

    res.json({
      qas: enriched,
      currentPage,
      totalPages: Math.ceil(total / pageLimit),
      total,
      stats,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
exports.deleteQuestion = async (req, res) => {
  try {
    const qa = await BusinessQA.findByIdAndDelete(req.params.id);
    if (!qa) return res.status(404).json({ message: "Question not found" });
    res.json({ message: "Question deleted" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.deleteAnswer = async (req, res) => {
  try {
    const qa = await BusinessQA.findById(req.params.id);
    if (!qa) return res.status(404).json({ message: "Question not found" });

    qa.answers = qa.answers.filter(
      (a) => String(a._id) !== req.params.answerId,
    );
    await qa.save();
    res.json({ message: "Answer deleted", qa });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.togglePinQA = async (req, res) => {
  try {
    const qa = await BusinessQA.findById(req.params.id);
    if (!qa) return res.status(404).json({ message: "Question not found" });

    qa.isPinned = !qa.isPinned;
    await qa.save();
    res.json({
      message: qa.isPinned ? "Question pinned" : "Question unpinned",
      qa,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
