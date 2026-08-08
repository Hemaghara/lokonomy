const { z } = require("zod");

const businessHoursSchema = z.object({
  isOpen: z.boolean().default(true),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format").default("09:00"),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format").default("18:00"),
});

const createBusinessSchema = {
  body: z.object({
    businessName: z.string().min(2, "Business name is required").max(100),
    description: z.string().max(1000).optional(),
    businessType: z.string().optional(),
    mainCategory: z.string().min(2, "Main category is required"),
    subCategory: z.string().min(2, "Subcategory is required"),
    logo: z.string().url().or(z.string().startsWith("data:image")).optional().nullable(),
    photos: z.array(z.string().url().or(z.string().startsWith("data:image"))).optional(),
    businessHours: z.record(businessHoursSchema).optional(),
    contactNumber: z.string().regex(/^\d{10}$/, "Valid 10-digit phone number is required"),
    email: z.string().email("Invalid email format").optional().or(z.literal("")),
    website: z.string().url("Invalid website URL").optional().or(z.literal("")),
    address: z.string().min(5, "Address is required"),
    state: z.string().optional(),
    district: z.string().optional().nullable(),
    taluka: z.string().optional().nullable(),
    pincode: z.string().regex(/^\d{6}$/, "Invalid pincode").optional(),
    latitude: z.number().or(z.string()).optional(),
    longitude: z.number().or(z.string()).optional(),
    facebookLink: z.string().url().optional().or(z.literal("")),
    instagramLink: z.string().url().optional().or(z.literal("")),
    youtubeLink: z.string().url().optional().or(z.literal("")),
    twitterLink: z.string().url().optional().or(z.literal("")),
    whatsappNumber: z.string().regex(/^\d{10}$/, "Invalid 10-digit WhatsApp number").optional().or(z.literal("")),
  })
};

const updateBusinessSchema = {
  body: createBusinessSchema.body.partial()
};

const searchBusinessSchema = {
  query: z.object({
    lat: z.string().optional(),
    lng: z.string().optional(),
    radius: z.string().optional(),
    district: z.string().optional(),
    taluka: z.string().optional(),
    category: z.string().optional(),
    subcategory: z.string().optional(),
    search: z.string().optional(),
    openNow: z.enum(["true", "false"]).optional(),
    verified: z.enum(["true", "false"]).optional(),
    trending: z.enum(["true", "false"]).optional(),
    hasOffers: z.enum(["true", "false"]).optional(),
    sortBy: z.string().optional(),
  })
};

module.exports = {
  createBusinessSchema,
  updateBusinessSchema,
  searchBusinessSchema
};
