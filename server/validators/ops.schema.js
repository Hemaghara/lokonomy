const { z } = require("zod");

// Admin Schemas
const updateSystemSettingsSchema = {
  body: z.object({
    maintenanceMode: z.boolean().optional(),
    signupEnabled: z.boolean().optional(),
    minimumAppVersion: z.string().optional(),
    announcement: z.string().optional(),
  })
};

const blockEntitySchema = {
  body: z.object({
    reason: z.string().min(5, "Reason for blocking is required").max(500),
    durationDays: z.number().int().positive().optional(),
  })
};

// Commission Schemas
const processCommissionSchema = {
  body: z.object({
    amount: z.number().positive("Amount must be positive"),
    method: z.enum(["upi", "bank_transfer", "wallet"]),
    referenceId: z.string().min(3, "Reference ID is required"),
    notes: z.string().optional(),
  })
};

// Report/Support Schemas
const submitReportSchema = {
  body: z.object({
    targetId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid target ID"),
    targetType: z.enum(["User", "Business", "Product", "Feed", "Story", "Job"]),
    reason: z.string().min(5, "Reason is required").max(1000, "Reason is too long"),
    description: z.string().max(2000).optional(),
  })
};

const resolveReportSchema = {
  body: z.object({
    resolution: z.string().min(2, "Resolution details are required"),
    actionTaken: z.enum(["none", "warned", "suspended", "banned", "content_removed"]),
  })
};

// Subscription Schemas
const createSubscriptionPlanSchema = {
  body: z.object({
    name: z.string().min(2, "Plan name is required"),
    price: z.number().nonnegative("Price cannot be negative"),
    durationMonths: z.number().int().positive(),
    features: z.array(z.string()).min(1, "At least one feature is required"),
    isActive: z.boolean().optional().default(true),
  })
};

module.exports = {
  updateSystemSettingsSchema,
  blockEntitySchema,
  processCommissionSchema,
  submitReportSchema,
  resolveReportSchema,
  createSubscriptionPlanSchema
};
