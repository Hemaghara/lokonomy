const express = require("express");
const router = express.Router();
const ctrl = require("../../controllers/adminSupportController");
const { protectAdmin } = require("../../middleware/adminMiddleware");

router.get("/support/tickets", protectAdmin, ctrl.getAllTickets);
router.get("/support/tickets/:id", protectAdmin, ctrl.getTicketById);
router.patch("/support/tickets/:id/status", protectAdmin, ctrl.updateTicketStatus);
router.patch("/support/tickets/:id/assign", protectAdmin, ctrl.assignTicket);
router.post("/support/tickets/:id/reply", protectAdmin, ctrl.replyToTicket);
router.patch("/support/tickets/:id/priority", protectAdmin, ctrl.updatePriority);
router.delete("/support/tickets/:id", protectAdmin, ctrl.deleteTicket);

module.exports = router;
