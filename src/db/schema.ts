import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  boolean,
  jsonb,
  varchar,
  index,
} from "drizzle-orm/pg-core";

export const organizations = pgTable("organizations", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  plan: varchar("plan", { length: 30 }).notNull().default("free"), // 'free' | 'event_pack' | 'pro'
  logoUrl: text("logo_url").notNull().default(""),
  primaryColor: varchar("primary_color", { length: 30 }).notNull().default("#7c3aed"),
  ownerId: uuid("owner_id").references((): any => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id").references((): any => organizations.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  email: varchar("email", { length: 120 }).notNull().unique(),
  password: text("password").notNull(),
  role: varchar("role", { length: 30 }).notNull().default("visitor"), // 'admin' | 'participant' | 'judge' | 'visitor'
  avatar: text("avatar").notNull().default(""),
  interests: jsonb("interests").notNull().default([]),
  organization: text("organization").notNull().default(""),
  phone: text("phone").notNull().default(""),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const events = pgTable("events", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id").references(() => organizations.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  type: varchar("type", { length: 50 }).notNull().default("hackathon"),
  tagline: text("tagline").notNull().default(""),
  description: text("description").notNull().default(""),
  venue: text("venue").notNull().default(""),
  city: text("city").notNull().default(""),
  startsAt: timestamp("starts_at").notNull().defaultNow(),
  endsAt: timestamp("ends_at").notNull().defaultNow(),
  status: varchar("status", { length: 20 }).notNull().default("live"),
  bannerGradient: text("banner_gradient").notNull().default("from-violet-600 via-fuchsia-500 to-amber-400"),
  scoringCriteria: jsonb("scoring_criteria").notNull().default([
    { key: "innovation", label: "Innovation", max: 10, weight: 1.2 },
    { key: "execution", label: "Execution", max: 10, weight: 1.0 },
    { key: "impact", label: "Impact", max: 10, weight: 1.0 },
    { key: "pitch", label: "Pitch", max: 10, weight: 0.8 },
  ]),
  categories: jsonb("categories").notNull().default(["AI/ML", "IoT", "FinTech", "HealthTech", "GreenTech", "EdTech"]),
  registrationOpen: boolean("registration_open").notNull().default(true),
  brandColor: varchar("brand_color", { length: 30 }).notNull().default("#4f46e5"),
  logoUrl: text("logo_url").notNull().default(""),
  ticketTiers: jsonb("ticket_tiers").notNull().default([
    { id: "free", name: "General Attendee", price: 0, currency: "INR", description: "Access to all expo booths, project showcase & crowd voting" },
    { id: "vip", name: "VIP Delegate Pass", price: 999, currency: "INR", description: "Priority hall seating, delegate kit & networking lounge access" },
  ]),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const projects = pgTable("projects", {
  id: uuid("id").defaultRandom().primaryKey(),
  eventId: uuid("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  title: text("title").notNull(),
  category: varchar("category", { length: 60 }).notNull().default("AI/ML"),
  teamName: text("team_name").notNull(),
  leaderName: text("leader_name").notNull(),
  leaderEmail: text("leader_email").notNull().default(""),
  leaderPhone: text("leader_phone").notNull().default(""),
  members: jsonb("members").notNull().default([]),
  description: text("description").notNull().default(""),
  techStack: jsonb("tech_stack").notNull().default([]),
  imageUrl: text("image_url").notNull().default(""),
  demoUrl: text("demo_url").notNull().default(""),
  repoUrl: text("repo_url").notNull().default(""),
  videoUrl: text("video_url").notNull().default(""),
  code: varchar("code", { length: 20 }).notNull().unique(),
  status: varchar("status", { length: 20 }).notNull().default("approved"),
  boothNo: varchar("booth_no", { length: 20 }).notNull().default(""),
  views: integer("views").notNull().default(0),
  checkins: integer("checkins").notNull().default(0),
  votes: integer("votes").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const judges = pgTable("judges", {
  id: uuid("id").defaultRandom().primaryKey(),
  eventId: uuid("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  email: text("email").notNull().default(""),
  organization: text("organization").notNull().default(""),
  expertise: jsonb("expertise").notNull().default([]),
  assignedCategories: jsonb("assigned_categories").notNull().default([]),
  code: varchar("code", { length: 20 }).notNull().unique(),
  avatarColor: text("avatar_color").notNull().default("from-violet-500 to-fuchsia-500"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const scores = pgTable("scores", {
  id: uuid("id").defaultRandom().primaryKey(),
  eventId: uuid("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
  projectId: uuid("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  judgeId: uuid("judge_id").notNull().references(() => judges.id, { onDelete: "cascade" }),
  criteriaScores: jsonb("criteria_scores").notNull().default({}),
  total: integer("total").notNull().default(0),
  weightedTotal: integer("weighted_total").notNull().default(0),
  comment: text("comment").notNull().default(""),
  flagged: boolean("flagged").notNull().default(false),
  flagReason: text("flag_reason").notNull().default(""),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const visitors = pgTable("visitors", {
  id: uuid("id").defaultRandom().primaryKey(),
  eventId: uuid("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  email: text("email").notNull().default(""),
  phone: text("phone").notNull().default(""),
  type: varchar("type", { length: 20 }).notNull().default("visitor"),
  interests: jsonb("interests").notNull().default([]),
  code: varchar("code", { length: 20 }).notNull().unique(),
  checkedIn: boolean("checked_in").notNull().default(false),
  checkinAt: timestamp("checkin_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const scans = pgTable("scans", {
  id: uuid("id").defaultRandom().primaryKey(),
  eventId: uuid("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
  projectId: uuid("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  visitorCode: varchar("visitor_code", { length: 20 }).notNull().default(""),
  source: varchar("source", { length: 20 }).notNull().default("qr"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const certificates = pgTable("certificates", {
  id: uuid("id").defaultRandom().primaryKey(),
  eventId: uuid("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
  projectId: uuid("project_id").references(() => projects.id, { onDelete: "set null" }),
  recipientName: text("recipient_name").notNull(),
  recipientEmail: text("recipient_email").notNull().default(""),
  role: varchar("role", { length: 30 }).notNull().default("participant"),
  title: text("title").notNull().default(""),
  code: varchar("code", { length: 30 }).notNull().unique(),
  verificationHash: text("verification_hash").notNull().default(""),
  issuedAt: timestamp("issued_at").notNull().defaultNow(),
});

export const feedbacks = pgTable("feedbacks", {
  id: uuid("id").defaultRandom().primaryKey(),
  eventId: uuid("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
  projectId: uuid("project_id").references(() => projects.id, { onDelete: "set null" }),
  authorName: text("author_name").notNull().default("Anonymous"),
  authorRole: varchar("author_role", { length: 30 }).notNull().default("visitor"),
  authorEmail: text("author_email").notNull().default(""),
  visitorCode: varchar("visitor_code", { length: 30 }).notNull().default(""),
  rating: integer("rating").notNull().default(5),
  message: text("message").notNull(),
  sentiment: varchar("sentiment", { length: 20 }).notNull().default("positive"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id").references(() => organizations.id, { onDelete: "set null" }),
  eventId: uuid("event_id").references(() => events.id, { onDelete: "set null" }),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  actorEmail: text("actor_email").notNull().default(""),
  actorRole: varchar("actor_role", { length: 30 }).notNull().default("system"),
  action: text("action").notNull(),
  targetType: varchar("target_type", { length: 50 }).notNull().default(""),
  targetId: text("target_id").notNull().default(""),
  details: jsonb("details").notNull().default({}),
  ipAddress: text("ip_address").notNull().default(""),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const orders = pgTable("orders", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id").references(() => organizations.id, { onDelete: "set null" }),
  eventId: uuid("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
  visitorId: uuid("visitor_id").references(() => visitors.id, { onDelete: "set null" }),
  tierId: varchar("tier_id", { length: 50 }).notNull().default("free"),
  tierName: text("tier_name").notNull().default("General Attendee"),
  amount: integer("amount").notNull().default(0), // in currency subunits or standard units
  currency: varchar("currency", { length: 10 }).notNull().default("INR"),
  status: varchar("status", { length: 30 }).notNull().default("paid"), // 'pending' | 'paid' | 'failed' | 'refunded'
  paymentProvider: varchar("payment_provider", { length: 30 }).notNull().default("mock"), // 'razorpay' | 'stripe' | 'free' | 'mock'
  providerOrderId: text("provider_order_id").notNull().default(""),
  providerPaymentId: text("provider_payment_id").notNull().default(""),
  buyerName: text("buyer_name").notNull(),
  buyerEmail: text("buyer_email").notNull(),
  buyerPhone: text("buyer_phone").notNull().default(""),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const sponsors = pgTable("sponsors", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id").references(() => organizations.id, { onDelete: "set null" }),
  eventId: uuid("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  tier: varchar("tier", { length: 30 }).notNull().default("gold"), // 'title' | 'platinum' | 'gold' | 'silver' | 'bronze'
  logoUrl: text("logo_url").notNull().default(""),
  website: text("website").notNull().default(""),
  boothNo: varchar("booth_no", { length: 30 }).notNull().default(""),
  brochureUrl: text("brochure_url").notNull().default(""),
  contactEmail: text("contact_email").notNull().default(""),
  passcode: varchar("passcode", { length: 30 }).notNull().default(""),
  views: integer("views").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const sponsorLeads = pgTable("sponsor_leads", {
  id: uuid("id").defaultRandom().primaryKey(),
  sponsorId: uuid("sponsor_id").notNull().references(() => sponsors.id, { onDelete: "cascade" }),
  eventId: uuid("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
  visitorName: text("visitor_name").notNull(),
  visitorEmail: text("visitor_email").notNull(),
  visitorPhone: text("visitor_phone").notNull().default(""),
  visitorCompany: text("visitor_company").notNull().default(""),
  interests: jsonb("interests").notNull().default([]),
  notes: text("notes").notNull().default(""),
  rating: integer("rating").notNull().default(3), // 1-5 quality
  capturedBy: text("captured_by").notNull().default("Booth Scanner"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const apiKeys = pgTable("api_keys", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id").references(() => organizations.id, { onDelete: "cascade" }),
  eventId: uuid("event_id").references(() => events.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  keyPrefix: varchar("key_prefix", { length: 16 }).notNull(),
  keyHash: text("key_hash").notNull(),
  permissions: jsonb("permissions").notNull().default(["read"]),
  lastUsedAt: timestamp("last_used_at"),
  status: varchar("status", { length: 20 }).notNull().default("active"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const floorPlans = pgTable(
  "floor_plans",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    eventId: uuid("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description").notNull().default(""),
    isDefault: boolean("is_default").notNull().default(false),
    status: varchar("status", { length: 20 }).notNull().default("active"), // 'active' | 'archived'
    gridWidth: integer("grid_width").notNull().default(20),
    gridHeight: integer("grid_height").notNull().default(15),
    walls: jsonb("walls").notNull().default([]), // [{ id, x1, y1, x2, y2, thickness? }]
    openings: jsonb("openings").notNull().default([]), // [{ id, x, y, width, height, type, label }]
    booths: jsonb("booths").notNull().default([]), // [{ id, label, x, y, width, height, projectId?, boothNo?, color? }]
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("floor_plans_event_id_idx").on(table.eventId),
  ]
);

export const floorTemplates = pgTable(
  "floor_templates",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description").notNull().default(""),
    gridWidth: integer("grid_width").notNull().default(20),
    gridHeight: integer("grid_height").notNull().default(15),
    walls: jsonb("walls").notNull().default([]),
    openings: jsonb("openings").notNull().default([]),
    booths: jsonb("booths").notNull().default([]), // Clean layout: label, x, y, width, height (NO project or visitor data!)
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("floor_templates_org_id_idx").on(table.organizationId),
  ]
);



