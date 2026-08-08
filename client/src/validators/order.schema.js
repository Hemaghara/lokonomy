import { z } from "zod";

export const orderSchema = z.object({
  shippingAddress: z.string().min(5, "Shipping address is required"),
  contactNumber: z.string().regex(/^\d{10}$/, "Valid 10-digit phone number is required"),
  paymentMethod: z.enum(["bank_transfer", "atm_card", "upi", "net_banking", "cod"], {
    errorMap: () => ({ message: "Please select a valid payment method" }),
  }),
});
