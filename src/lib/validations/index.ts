import { z } from "zod";

// --- Auth Schemas ---
export const loginSchema = z
  .object({
    email: z.string().email("Invalid email address").optional(),
    password: z.string().min(1, "Password is required").optional(),
    judgeCode: z.string().min(1, "Judge code cannot be empty").optional(),
  })
  .refine((data) => data.judgeCode || (data.email && data.password), {
    message: "Either email and password OR a judge code must be provided",
  });

export const registerSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Invalid email address"),
  password: z.string().min(4, "Password must be at least 4 characters"),
  role: z.enum(["admin", "participant", "judge", "visitor"]).default("visitor"),
  organization: z.string().optional().default(""),
  phone: z.string().optional().default(""),
  interests: z.array(z.string()).optional().default([]),
  eventId: z.string().optional(),
  // Participant project details (optional on initial registration)
  projectTitle: z.string().optional(),
  category: z.string().optional().default("AI/ML"),
  teamName: z.string().optional(),
  projectDescription: z.string().optional(),
  techStack: z.union([z.array(z.string()), z.string()]).optional().default([]),
  imageUrl: z.string().optional(),
  demoUrl: z.string().optional(),
  repoUrl: z.string().optional(),
  videoUrl: z.string().optional(),
  members: z.array(z.any()).optional().default([]),
});

// --- Event Schemas ---
export const eventCreateSchema = z.object({
  name: z.string().min(2, "Event name must be at least 2 characters"),
  type: z.string().min(1, "Event type is required"),
  tagline: z.string().min(1, "Tagline is required"),
  description: z.string().min(5, "Description must be at least 5 characters"),
  venue: z.string().min(1, "Venue is required"),
  city: z.string().min(1, "City is required"),
  startsAt: z.string().or(z.date()).optional(),
  endsAt: z.string().or(z.date()).optional(),
  status: z.enum(["draft", "upcoming", "live", "completed", "ended"]).default("live"),
  bannerGradient: z.string().optional(),
  scoringCriteria: z
    .array(
      z.object({
        key: z.string(),
        label: z.string(),
        max: z.number().default(10),
        weight: z.number().default(1),
      })
    )
    .optional(),
  categories: z.array(z.string()).optional(),
  registrationOpen: z.boolean().optional().default(true),
  organizationId: z.string().uuid().optional(),
});

export const eventUpdateSchema = eventCreateSchema.partial();

// --- Project Schemas ---
export const projectCreateSchema = z.object({
  eventId: z.string().min(1, "Event ID is required"),
  userId: z.string().optional(),
  title: z.string().min(2, "Project title must be at least 2 characters"),
  category: z.string().default("AI/ML"),
  teamName: z.string().min(1, "Team name is required"),
  leaderName: z.string().min(1, "Leader name is required"),
  leaderEmail: z.string().email("Invalid leader email").or(z.literal("")).optional(),
  leaderPhone: z.string().optional(),
  members: z.array(z.any()).optional().default([]),
  description: z.string().optional().default(""),
  techStack: z.union([z.array(z.string()), z.string()]).optional().default([]),
  imageUrl: z.string().optional().default(""),
  demoUrl: z.string().optional().default(""),
  repoUrl: z.string().optional().default(""),
  videoUrl: z.string().optional().default(""),
});

export const projectUpdateSchema = projectCreateSchema.partial().extend({
  id: z.string().min(1, "Project ID is required"),
});

// --- Score Schemas ---
export const scoreCreateSchema = z.object({
  eventId: z.string().min(1, "Event ID is required"),
  projectId: z.string().min(1, "Project ID is required"),
  judgeId: z.string().min(1, "Judge ID is required"),
  criteriaScores: z.record(z.string(), z.number().or(z.string())),
  comment: z.string().optional().default(""),
});

// --- Checkin Schema ---
export const checkinSchema = z.object({
  code: z.string().min(1, "Visitor pass code is required"),
});

// --- Feedback & Crowd Vote Schema ---
export const feedbackSchema = z.object({
  eventId: z.string().min(1, "Event ID is required"),
  projectId: z.string().nullable().optional(),
  message: z.string().min(1, "Review message cannot be empty"),
  rating: z.number().min(1).max(5).default(5),
  authorName: z.string().optional().default("Visitor"),
  authorRole: z.string().optional().default("visitor"),
  authorEmail: z.string().email().or(z.literal("")).optional().default(""),
  visitorCode: z.string().optional().default(""),
});

// --- Certificate Schema ---
export const certificateCreateItemSchema = z.object({
  eventId: z.string().optional(),
  projectId: z.string().nullable().optional(),
  recipientName: z.string().min(1, "Recipient name is required"),
  recipientEmail: z.string().email().or(z.literal("")).optional().default(""),
  role: z.string().default("participant"),
  title: z.string().default("Certificate of Excellence"),
  code: z.string().optional(),
  signatory1: z.string().optional(),
  signatory2: z.string().optional(),
  theme: z.string().optional(),
});

export const certificateCreateSchema = z.union([
  certificateCreateItemSchema,
  z.array(certificateCreateItemSchema),
]);

/**
 * Helper to safely validate request body with Zod schema.
 */
export function validateBody<T>(schema: z.ZodSchema<T>, body: unknown): {
  success: true;
  data: T;
} | {
  success: false;
  error: string;
  details: Record<string, string[]>;
} {
  const result = schema.safeParse(body);
  if (result.success) {
    return { success: true, data: result.data };
  }
  const fieldErrors: Record<string, string[]> = {};
  for (const issue of result.error.issues) {
    const path = issue.path.join(".") || "body";
    if (!fieldErrors[path]) fieldErrors[path] = [];
    fieldErrors[path].push(issue.message);
  }
  const errorMsg = Object.entries(fieldErrors)
    .map(([field, errs]) => `${field}: ${errs.join(", ")}`)
    .join("; ");
  return { success: false, error: errorMsg, details: fieldErrors };
}
