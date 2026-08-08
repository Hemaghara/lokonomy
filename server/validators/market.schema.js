const { z } = require("zod");

const bulkPricingSchema = z.object({
  minQuantity: z.number().int().positive(),
  pricePerUnit: z.number().nonnegative(),
});

const sellerProfileSchema = z.object({
  name: z.string().min(2, "Seller name is required"),
  contactNumber: z.string().regex(/^\d{10}$/, "Valid 10-digit phone number is required"),
  whatsappNumber: z.string().regex(/^\d{10}$/, "Valid 10-digit WhatsApp number is required").optional().or(z.literal("")),
  contactPreference: z.enum(["call", "whatsapp", "email"]),
  email: z.string().email("Invalid email format").optional().or(z.literal("")),
  address: z.string().optional(),
});

const createProductSchema = {
  body: z.object({
    mainCategory: z.string().min(2, "Main category is required"),
    subCategory: z.string().min(2, "Sub category is required"),
    productName: z.string().min(2, "Product name is required").max(200),
    description: z.string().min(10, "Description must be at least 10 characters").max(5000),
    priceType: z.enum(["sell", "rent"]),
    price: z.number().nonnegative("Price cannot be negative").or(z.string().regex(/^\d+(\.\d+)?$/).transform(Number)),
    district: z.string().optional().nullable(),
    taluka: z.string().optional().nullable(),
    address: z.string().optional(),
    productImages: z.array(z.string().url().or(z.string().startsWith("data:image"))).optional(),
    latitude: z.number().or(z.string()).optional(),
    longitude: z.number().or(z.string()).optional(),
    sellerProfile: sellerProfileSchema,
    isAuction: z.boolean().optional().default(false),
    startingPrice: z.number().nonnegative().optional().or(z.string().regex(/^\d+(\.\d+)?$/).transform(Number)),
    auctionEnd: z.string().datetime().optional().nullable(),
    isPreOrderEnabled: z.boolean().optional().default(false),
    preOrderLeadTimeDays: z.number().int().nonnegative().optional(),
    maxPreOrders: z.number().int().nonnegative().optional(),
    isBulkEnabled: z.boolean().optional().default(false),
    minOrderQuantity: z.number().int().positive().optional().default(1),
    bulkPricing: z.array(bulkPricingSchema).optional(),
  })
};

const updateProductSchema = {
  body: createProductSchema.body.partial()
};

module.exports = {
  createProductSchema,
  updateProductSchema
};
