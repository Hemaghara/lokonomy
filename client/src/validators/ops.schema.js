import { z } from "zod";

export const reportSchema = z.object({
  targetType: z.enum(["User", "Business", "Product", "Feed", "Story", "Job"]),
  reason: z.string().min(5, "Please provide a valid reason (min 5 characters)").max(1000, "Reason is too long"),
  description: z.string().max(2000, "Description is too long").optional(),
});
