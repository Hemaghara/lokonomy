import { z } from "zod";

export const businessSchema = z.object({
  businessName: z.string().min(2, "Business name is required").max(100, "Business name is too long"),
  description: z.string().max(1000, "Description cannot exceed 1000 characters").optional(),
  mainCategory: z.string().min(2, "Main category is required"),
  subCategory: z.string().min(2, "Subcategory is required"),
  contactNumber: z.string().regex(/^\d{10}$/, "Valid 10-digit phone number is required"),
  email: z.string().email("Invalid email format").optional().or(z.literal("")),
  website: z.string().url("Invalid website URL").optional().or(z.literal("")).or(z.literal("https://")),
  address: z.string().min(5, "Address is required"),
  facebookLink: z.string().url("Invalid Facebook URL").optional().or(z.literal("")).or(z.literal("https://")),
  instagramLink: z.string().url("Invalid Instagram URL").optional().or(z.literal("")).or(z.literal("https://")),
  youtubeLink: z.string().url("Invalid YouTube URL").optional().or(z.literal("")).or(z.literal("https://")),
  twitterLink: z.string().url("Invalid Twitter URL").optional().or(z.literal("")).or(z.literal("https://")),
});
