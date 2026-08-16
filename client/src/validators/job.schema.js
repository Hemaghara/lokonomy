import { z } from "zod";

export const jobSchema = z.object({
  position: z.string().min(2, "Position is required").max(100),
  location: z.string().min(2, "Location is required"),
  vacancies: z.number().int().positive().or(z.string().regex(/^\d+$/).transform(Number)),
  education: z.enum(["10th pass", "12th pass", "Graduate", "Post Graduate"]),
  state: z.string().min(2, "State is required"),
  district: z.string().min(2, "District is required"),
  experience: z.string().min(1, "Experience is required"),
  skills: z.string().min(2, "Skills are required"),
  salary: z.string().min(1, "Salary is required"), 
  salaryMin: z.number().nonnegative().optional().or(z.string().regex(/^\d+(\.\d+)?$/).transform(Number).optional()),
  salaryMax: z.number().nonnegative().optional().or(z.string().regex(/^\d+(\.\d+)?$/).transform(Number).optional()),
  gender: z.enum(["Male", "Female", "Both"]),
  posterName: z.string().min(2, "Poster name is required"),
  posterEmail: z.string().email("Invalid email format"),
  posterContact: z.string().regex(/^\d{10}$/, "Valid 10-digit phone number is required"),
  description: z.string().max(5000, "Description is too long").optional(),
  jobType: z.enum(["Full-time", "Part-time", "Freelance", "Contract"]).optional(),
  category: z.string().optional(),
});
