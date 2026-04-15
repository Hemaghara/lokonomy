const SupportTicket = require("../models/SupportTicket");
const Admin = require("../models/Admin");
const adminAuditController = require("./adminAuditController");

exports.getAllTickets = async (req, res) => {
  try {
    const {
      status,
      priority,
      category,
      search,
      page = 1,
      limit = 10,
    } = req.query;
    let query = {};

    if (status && status !== "all") query.status = status;
    if (priority && priority !== "all") query.priority = priority;
    if (category && category !== "all") query.category = category;
    if (search) {
      query.$or = [
        { ticketNumber: { $regex: search, $options: "i" } },
        { subject: { $regex: search, $options: "i" } },
        { userName: { $regex: search, $options: "i" } },
        { userEmail: { $regex: search, $options: "i" } },
      ];
    }

    const currentPage = parseInt(page);
    const pageLimit = parseInt(limit);
    const skip = (currentPage - 1) * pageLimit;

    const totalTickets = await SupportTicket.countDocuments(query);
    const totalPages = Math.ceil(totalTickets / pageLimit);

    const tickets = await SupportTicket.find(query)
      .populate("userId", "name email")
      .populate("assignedTo", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageLimit);

    const stats = {
      open: await SupportTicket.countDocuments({ status: "open" }),
      in_progress: await SupportTicket.countDocuments({
        status: "in_progress",
      }),
      resolved: await SupportTicket.countDocuments({ status: "resolved" }),
      closed: await SupportTicket.countDocuments({ status: "closed" }),
      urgent: await SupportTicket.countDocuments({
        priority: "urgent",
        status: { $in: ["open", "in_progress"] },
      }),
    };

    res.json({ tickets, currentPage, totalPages, totalTickets, stats });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.getTicketById = async (req, res) => {
  try {
    const ticket = await SupportTicket.findById(req.params.id)
      .populate("userId", "name email phoneNumber")
      .populate("assignedTo", "name email");
    if (!ticket) return res.status(404).json({ message: "Ticket not found" });
    res.json(ticket);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
exports.updateTicketStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const ticket = await SupportTicket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: "Ticket not found" });

    ticket.status = status;
    if (status === "resolved") ticket.resolvedAt = new Date();
    if (status === "closed") ticket.closedAt = new Date();
    await ticket.save();

    // Log the audit
    await adminAuditController.logAction(
      req.admin.id,
      "TICKET_STATUS_UPDATE",
      `Moved ticket #${ticket.ticketNumber} to ${status}`,
      req.ip,
    );

    res.json({ message: "Ticket status updated", ticket });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
exports.assignTicket = async (req, res) => {
  try {
    const { adminId } = req.body;
    const ticket = await SupportTicket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: "Ticket not found" });

    let adminName = "Unassigned";
    if (adminId) {
      const admin = await Admin.findById(adminId);
      if (!admin) return res.status(404).json({ message: "Admin not found" });
      ticket.assignedTo = adminId;
      ticket.assignedToName = admin.name;
      adminName = admin.name;
    } else {
      ticket.assignedTo = null;
      ticket.assignedToName = null;
    }

    if (ticket.status === "open") ticket.status = "in_progress";
    await ticket.save();

    await adminAuditController.logAction(
      req.admin.id,
      "TICKET_ASSIGNED",
      `Assigned ticket #${ticket.ticketNumber} to ${adminName}`,
      req.ip,
    );

    res.json({ message: "Ticket assigned", ticket });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
exports.replyToTicket = async (req, res) => {
  try {
    const { message } = req.body;
    if (!message?.trim())
      return res.status(400).json({ message: "Reply message is required" });

    const ticket = await SupportTicket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: "Ticket not found" });

    const admin = await Admin.findById(req.admin.id).select("name");

    ticket.replies.push({
      sender: "admin",
      senderName: admin?.name || "Admin",
      senderId: req.admin.id,
      message: message.trim(),
    });

    if (ticket.status === "open") ticket.status = "in_progress";
    await ticket.save();

    await adminAuditController.logAction(
      req.admin.id,
      "TICKET_REPLY",
      `Admin replied to ticket #${ticket.ticketNumber}`,
      req.ip,
    );

    res.json({ message: "Reply sent", ticket });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.updatePriority = async (req, res) => {
  try {
    const { priority } = req.body;
    const ticket = await SupportTicket.findByIdAndUpdate(
      req.params.id,
      { priority },
      { new: true },
    );
    if (!ticket) return res.status(404).json({ message: "Ticket not found" });

    await adminAuditController.logAction(
      req.admin.id,
      "TICKET_PRIORITY_UPDATE",
      `Updated priority of ticket #${ticket.ticketNumber} to ${priority}`,
      req.ip,
    );

    res.json({ message: "Priority updated", ticket });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.deleteTicket = async (req, res) => {
  try {
    const ticket = await SupportTicket.findByIdAndDelete(req.params.id);
    if (!ticket) return res.status(404).json({ message: "Ticket not found" });
    await adminAuditController.logAction(
      req.admin.id,
      "TICKET_DELETED",
      `Deleted ticket #${ticket.ticketNumber}. Final status: ${ticket.status}`,
      req.ip,
    );

    res.json({ message: "Ticket deleted" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
exports.createTicket = async (req, res) => {
  try {
    const { subject, description, category } = req.body;
    if (!subject?.trim() || !description?.trim())
      return res
        .status(400)
        .json({ message: "Subject and description required" });

    const User = require("../models/User");
    const user = await User.findById(req.user.id).select("name email");
    if (!user) return res.status(404).json({ message: "User not found" });

    const ticket = await SupportTicket.create({
      userId: user._id,
      userName: user.name,
      userEmail: user.email,
      subject: subject.trim(),
      description: description.trim(),
      category: category || "other",
    });

    res.status(201).json({ message: "Ticket created", ticket });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
