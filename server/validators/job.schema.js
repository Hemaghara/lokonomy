const { z } = require("zod");

const createJobSchema = {
  body: z.object({
    position: z.string().min(2, "Position is required").max(100),
    location: z.string().min(2, "Location is required"),
    vacancies: z.number().int().positive().or(z.string().regex(/^\d+$/).transform(Number)),
    education: z.enum(["10th pass", "12th pass", "Graduate", "Post Graduate"]),
    state: z.string().min(2, "State is required"),
    district: z.string().min(2, "District is required"),
    experience: z.string().min(1, "Experience is required"),
    skills: z.string().min(2, "Skills are required"),
    salary: z.string().min(1, "Salary is required"), // legacy salary field
    salaryMin: z.number().nonnegative().optional().nullable().or(z.string().regex(/^\d+(\.\d+)?$/).transform(Number).optional()),
    salaryMax: z.number().nonnegative().optional().nullable().or(z.string().regex(/^\d+(\.\d+)?$/).transform(Number).optional()),
    gender: z.enum(["Male", "Female", "Both"]),
    posterName: z.string().min(2, "Poster name is required"),
    posterEmail: z.string().email("Invalid email format"),
    posterContact: z.string().regex(/^\d{10}$/, "Valid 10-digit phone number is required"),
    description: z.string().max(5000, "Description is too long").optional().or(z.literal("")),
    jobType: z.enum(["Full-time", "Part-time", "Freelance", "Contract"]).optional(),
    category: z.enum([
      "IT & Software",
      "Retail & Sales",
      "Manufacturing",
      "Healthcare",
      "Education",
      "Hospitality",
      "Agriculture",
      "Construction",
      "Transport",
      "Banking & Finance",
      "Government",
      "Other",
    ]).optional(),
    taluka: z.string().optional().or(z.literal("")),
    deadline: z.string().datetime().optional().nullable(),
  })
};

const updateJobSchema = {
  body: createJobSchema.body.partial()
};

const applyForJobSchema = {
  body: z.object({
    candidateName: z.string().min(2, "Name is required"),
    candidateEmail: z.string().email("Invalid email format"),
    candidateContact: z.string().regex(/^\d{10}$/, "Valid 10-digit phone number is required"),
    candidateSkills: z.string().optional(),
    candidateExperience: z.string().optional(),
    candidateEducation: z.string().optional(),
    candidateBiodata: z.string().optional(),
    candidateCertificate: z.string().optional(),
  })
};

module.exports = {
  createJobSchema,
  updateJobSchema,
  applyForJobSchema
};
