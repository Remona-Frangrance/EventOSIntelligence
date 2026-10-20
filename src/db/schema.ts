import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  boolean,
  jsonb,
  varchar,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
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
  issuedAt: timestamp("issued_at").notNull().defaultNow(),
});

export const feedbacks = pgTable("feedbacks", {
  id: uuid("id").defaultRandom().primaryKey(),
  eventId: uuid("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
  projectId: uuid("project_id").references(() => projects.id, { onDelete: "set null" }),
  authorName: text("author_name").notNull().default("Anonymous"),
  authorRole: varchar("author_role", { length: 30 }).notNull().default("visitor"),
  rating: integer("rating").notNull().default(5),
  message: text("message").notNull(),
  sentiment: varchar("sentiment", { length: 20 }).notNull().default("positive"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

