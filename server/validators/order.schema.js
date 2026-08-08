const { z } = require("zod");

const createOrderSchema = {
  body: z.object({
    productId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid product ID format"),
    quantity: z.number().int().positive().default(1).or(z.string().regex(/^\d+$/).transform(Number)),
    paymentMethod: z.enum(["bank_transfer", "atm_card", "upi", "net_banking", "cod"]), // Note: cod might not be in the enum but could be handled
    shippingAddress: z.string().min(5, "Shipping address is required"),
    contactNumber: z.string().regex(/^\d{10}$/, "Valid 10-digit phone number is required"),
    transactionId: z.string().optional(),
  })
};

const updateOrderStatusSchema = {
  body: z.object({
    orderStatus: z.enum([
      "pending",
      "preparing",
      "processing",
      "shipped",
      "out_for_delivery",
      "delivered",
      "cancelled",
    ]),
  })
};

module.exports = {
  createOrderSchema,
  updateOrderStatusSchema
};
