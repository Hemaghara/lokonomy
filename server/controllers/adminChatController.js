const Message = require("../models/Message");
const Report = require("../models/Report");

exports.getChatStats = async (req, res) => {
  try {
    const totalMessages = await Message.countDocuments();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const messagesToday = await Message.countDocuments({
      createdAt: { $gte: today },
    });

    const chatTypeStats = await Message.aggregate([
      { $group: { _id: "$chatType", count: { $sum: 1 } } },
    ]);
    const activeRooms = await Message.distinct("chatRoom");

    res.json({
      totalMessages,
      messagesToday,
      activeRooms: activeRooms.length,
      chatTypeStats,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
exports.getReportedChats = async (req, res) => {
  try {
    const reports = await Report.find({ targetType: "message" })
      .populate("reportedBy", "name email")
      .sort({ createdAt: -1 });

    res.json(reports);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.getConversation = async (req, res) => {
  try {
    const { chatRoom } = req.params;
    const messages = await Message.find({ chatRoom }).sort({ createdAt: 1 });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
