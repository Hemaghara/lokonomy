const BusinessQA = require("../models/BusinessQA");
const Business = require("../models/Business");
const User = require("../models/User");
const logger = require("../utils/logger");

exports.getQuestions = async (req, res) => {
  try {
    const questions = await BusinessQA.find({
      businessId: req.params.businessId,
    }).sort({ createdAt: -1 });

    questions.sort((a, b) => {
      const aAnswered = a.answers.length > 0 ? 1 : 0;
      const bAnswered = b.answers.length > 0 ? 1 : 0;
      if (aAnswered !== bAnswered) return aAnswered - bAnswered;
      return b.upvotes.length - a.upvotes.length;
    });

    res.json(questions);
  } catch (err) {
    logger.error(
      { err, businessId: req.params.businessId },
      "Error fetching QA questions",
    );
    res.status(500).json({ message: "Server error" });
  }
};

exports.postQuestion = async (req, res) => {
  try {
    const { question } = req.body;
    if (!question || !question.trim())
      return res.status(400).json({ message: "Question is required" });

    const [business, user] = await Promise.all([
      Business.findById(req.params.businessId),
      User.findById(req.user.id).select("name"),
    ]);

    if (!business)
      return res.status(404).json({ message: "Business not found" });
    if (!user) return res.status(404).json({ message: "User not found" });

    if (business.ownerId && business.ownerId === req.user.id) {
      return res
        .status(403)
        .json({ message: "Business owners cannot post questions" });
    }

    const qa = await BusinessQA.create({
      businessId: req.params.businessId,
      question: question.trim(),
      askedBy: req.user.id,
      askedByName: user.name,
    });

    logger.info(
      { qaId: qa._id, businessId: req.params.businessId, userId: req.user.id },
      "Question posted successfully",
    );
    res.status(201).json(qa);
  } catch (err) {
    logger.error(
      { err, businessId: req.params.businessId, userId: req.user.id },
      "Error posting QA question",
    );
    res.status(500).json({ message: err.message });
  }
};

exports.postAnswer = async (req, res) => {
  try {
    const { answer } = req.body;
    if (!answer || !answer.trim())
      return res.status(400).json({ message: "Answer is required" });

    const [qa, user] = await Promise.all([
      BusinessQA.findById(req.params.questionId),
      User.findById(req.user.id).select("name"),
    ]);

    if (!qa) return res.status(404).json({ message: "Question not found" });
    if (!user) return res.status(404).json({ message: "User not found" });

    const business = await Business.findById(qa.businessId);
    const isOwner = business && business.ownerId === req.user.id;

    qa.answers.push({
      answeredBy: req.user.id,
      answeredByName: user.name,
      isOwner,
      answer: answer.trim(),
    });

    await qa.save();
    logger.info(
      { qaId: qa._id, userId: req.user.id },
      "Answer posted successfully",
    );
    res.json(qa);
  } catch (err) {
    logger.error(
      { err, questionId: req.params.questionId, userId: req.user.id },
      "Error posting QA answer",
    );
    res.status(500).json({ message: err.message });
  }
};

exports.deleteQuestion = async (req, res) => {
  try {
    const qa = await BusinessQA.findById(req.params.questionId);
    if (!qa) return res.status(404).json({ message: "Question not found" });

    const business = await Business.findById(qa.businessId);
    const isBusinessOwner = business && business.ownerId === req.user.id;
    const isAsker = qa.askedBy === req.user.id;

    if (!isAsker && !isBusinessOwner) {
      logger.warn(
        { questionId: req.params.questionId, userId: req.user.id },
        "Unauthorized QA deletion attempt",
      );
      return res.status(403).json({ message: "Unauthorized" });
    }

    await qa.deleteOne();
    logger.info(
      { questionId: req.params.questionId, userId: req.user.id },
      "Question deleted successfully",
    );
    res.json({ message: "Question deleted" });
  } catch (err) {
    logger.error(
      { err, questionId: req.params.questionId },
      "Error deleting QA question",
    );
    res.status(500).json({ message: err.message });
  }
};

exports.upvoteQuestion = async (req, res) => {
  try {
    const qa = await BusinessQA.findById(req.params.questionId);
    if (!qa) return res.status(404).json({ message: "Question not found" });

    const userId = req.user.id;
    const alreadyUpvoted = qa.upvotes.includes(userId);

    if (alreadyUpvoted) {
      qa.upvotes = qa.upvotes.filter((id) => id !== userId);
    } else {
      qa.upvotes.push(userId);
    }

    await qa.save();
    res.json({ upvotes: qa.upvotes.length, upvoted: !alreadyUpvoted });
  } catch (err) {
    logger.error(
      { err, questionId: req.params.questionId, userId: req.user.id },
      "Error upvoting QA question",
    );
    res.status(500).json({ message: err.message });
  }
};
