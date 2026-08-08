import { z } from "zod";

export const marketSchema = z.object({
  productName: z.string().min(2, "Product name is required").max(200, "Product name is too long"),
  description: z.string().min(10, "Description must be at least 10 characters").max(5000),
  price: z.number().positive("Price must be greater than 0").or(z.string().regex(/^\d+(\.\d+)?$/, "Invalid price format").transform(Number)),
  priceType: z.enum(["sell", "rent"]),
  mainCategory: z.string().min(2, "Main category is required"),
  subCategory: z.string().min(2, "Sub category is required"),
  sellerProfile: z.object({
    name: z.string().min(2, "Seller name is required"),
    contactNumber: z.string().regex(/^\d{10}$/, "Valid 10-digit phone number is required"),
    whatsappNumber: z.string().regex(/^\d{10}$/, "Valid 10-digit WhatsApp number is required").optional().or(z.literal("")),
    contactPreference: z.enum(["call", "whatsapp", "email"]),
    email: z.string().email("Invalid email format").optional().or(z.literal("")),
  }),
  isAuction: z.boolean().optional(),
  startingPrice: z.number().nonnegative().optional().or(z.string().regex(/^\d+(\.\d+)?$/).transform(Number)).or(z.literal("")),
});
