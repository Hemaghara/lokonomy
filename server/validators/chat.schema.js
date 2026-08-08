const { z } = require("zod");

const sendMessageSchema = {
  body: z.object({
    receiverId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid receiver ID format"),
    message: z.string().min(1, "Message cannot be empty").max(2000, "Message too long").trim(),
    chatType: z.enum(["product", "business_inquiry"]).optional().default("product"),
    productId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid product ID format").optional().nullable(),
    businessId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid business ID format").optional().nullable(),
  })
};

module.exports = {
  sendMessageSchema
};
