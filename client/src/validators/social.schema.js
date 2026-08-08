import { z } from "zod";

export const feedSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title must be under 100 characters"),
  content: z.string().min(1, "Content is required").max(5000, "Content must be under 5000 characters"),
  type: z.enum(["Sale", "Offer", "Information", "New Arrival", "Exhibition", "Event"]),
  eventDate: z.string().optional(),
  eventTime: z.string().optional(),
});

export const storySchema = z.object({
  title: z.string().min(1, "Title is required").max(150, "Title cannot exceed 150 characters"),
  content: z.string().min(1, "Content is required").max(3000, "Content cannot exceed 3000 characters"),
  type: z.enum(["News", "Offers", "Promotions", "Events", "Announcements", "Tips"]),
  actionLinkUrl: z.string().optional(),
  actionLinkText: z.enum(["Shop Now", "Learn More", "Get Offer", "Visit Link", "Book Now", "Contact Us", "Download"]).optional(),
});

export const commentSchema = z.object({
  text: z.string().min(1, "Comment cannot be empty").max(1000, "Comment is too long"),
});
