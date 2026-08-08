const { z } = require("zod");

const createFeedSchema = {
  body: z.object({
    title: z.string().min(1, "Title is required").max(100, "Title must be under 100 characters").trim(),
    content: z.string().min(1, "Content is required").max(5000, "Content must be under 5000 characters"),
    type: z.enum(["Sale", "Offer", "Information", "New Arrival", "Exhibition", "Event"]),
    image: z.string().optional().or(z.literal("")),
    eventDate: z.string().optional().or(z.literal("")),
    eventTime: z.string().optional().or(z.literal("")),
    district: z.string().optional(),
    taluka: z.string().optional(),
    tags: z.array(z.string()).optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    locationAddress: z.string().optional(),
  })
};

const updateFeedSchema = {
  body: createFeedSchema.body.partial()
};

const createStorySchema = {
  body: z.object({
    title: z.string().min(1, "Title is required").max(150, "Title cannot exceed 150 characters").trim(),
    content: z.string().min(1, "Content is required").max(3000, "Content cannot exceed 3000 characters"),
    type: z.enum(["News", "Offers", "Promotions", "Events", "Announcements", "Tips"]),
    image: z.string().optional().or(z.literal("")),
    district: z.string().optional(),
    taluka: z.string().optional(),
    actionLinkUrl: z.string().optional().or(z.literal("")),
    actionLinkText: z.enum(["Shop Now", "Learn More", "Get Offer", "Visit Link", "Book Now", "Contact Us", "Download"]).optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    locationAddress: z.string().optional(),
  })
};

const createGroupSchema = {
  body: z.object({
    name: z.string().min(2, "Name is required").max(100).trim(),
    description: z.string().min(5, "Description must be at least 5 characters"),
    district: z.string().min(2, "District is required"),
    taluka: z.string().optional(),
    type: z.enum(["area", "interest", "business_association"]).optional().default("area"),
  })
};

const createCommentSchema = {
  body: z.object({
    targetId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid target ID format"),
    targetType: z.enum(["Feed", "Story", "BusinessQA", "ProductQA"]),
    text: z.string().min(1, "Comment cannot be empty").max(1000, "Comment is too long").trim(),
    parentId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid parent ID format").optional().nullable(),
  })
};

module.exports = {
  createFeedSchema,
  updateFeedSchema,
  createStorySchema,
  createGroupSchema,
  createCommentSchema
};
