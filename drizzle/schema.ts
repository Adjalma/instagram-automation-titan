import { integer, pgEnum, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("role", ["user", "admin"]);
export const platformEnum = pgEnum("platform", ["instagram", "linkedin", "facebook", "tiktok", "youtube"]);
export const accountTypeEnum = pgEnum("accountType", ["personal", "business"]);
export const toneEnum = pgEnum("tone", ["personal", "corporate"]);
export const postStatusEnum = pgEnum("post_status", ["draft", "pending", "approved", "scheduled", "published", "rejected"]);
export const mediaTypeEnum = pgEnum("media_type", ["image", "video"]);
export const logStatusEnum = pgEnum("log_status", ["success", "failed", "pending"]);
export const contentTypeEnum = pgEnum("content_type", ["servico", "projeto"]);
export const contentStatusEnum = pgEnum("content_status", ["ativo", "em_desenvolvimento", "em_breve"]);
export const researchRunStatusEnum = pgEnum("research_run_status", ["success", "failed", "skipped"]);

export const users = pgTable("users", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  passwordHash: varchar("passwordHash", { length: 256 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: roleEnum("role").default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const instagramAccounts = pgTable("instagram_accounts", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  handle: varchar("handle", { length: 128 }).notNull().unique(),
  displayName: varchar("displayName", { length: 256 }).notNull(),
  platform: platformEnum("platform").default("instagram").notNull(),
  accountType: accountTypeEnum("accountType").notNull(),
  tone: toneEnum("tone").notNull(),
  avatarUrl: text("avatarUrl"),
  bio: text("bio"),
  profileUrl: text("profileUrl"),
  accessToken: text("accessToken"),
  tokenExpiresAt: timestamp("tokenExpiresAt"),
  linkedinUrn: varchar("linkedinUrn", { length: 256 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type InstagramAccount = typeof instagramAccounts.$inferSelect;

export const posts = pgTable("posts", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("userId").notNull(),
  accountId: integer("accountId").notNull(),
  caption: text("caption"),
  status: postStatusEnum("status").default("draft").notNull(),
  theme: text("theme"),
  scheduledAt: timestamp("scheduledAt"),
  publishedAt: timestamp("publishedAt"),
  instagramPostId: varchar("instagramPostId", { length: 256 }),
  instagramPermalink: text("instagramPermalink"),
  mcpPending: integer("mcpPending").default(0).notNull(),
  retryCount: integer("retryCount").default(0).notNull(),
  nextRetryAt: timestamp("nextRetryAt"),
  linkedinPublished: integer("linkedinPublished").default(0).notNull(),
  facebookPublished: integer("facebookPublished").default(0).notNull(),
  likes: integer("likes").default(0),
  comments: integer("comments").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Post = typeof posts.$inferSelect;
export type InsertPost = typeof posts.$inferInsert;

export const postMedia = pgTable("post_media", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  postId: integer("postId").notNull(),
  mediaUrl: text("mediaUrl").notNull(),
  mediaType: mediaTypeEnum("media_type").default("image").notNull(),
  sortOrder: integer("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PostMedia = typeof postMedia.$inferSelect;

export const assets = pgTable("assets", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("userId").notNull(),
  name: varchar("name", { length: 256 }).notNull(),
  url: text("url").notNull(),
  fileKey: varchar("fileKey", { length: 512 }).notNull(),
  mimeType: varchar("mimeType", { length: 128 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Asset = typeof assets.$inferSelect;

export const contentThemes = pgTable("content_themes", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: varchar("name", { length: 128 }).notNull(),
  slug: varchar("slug", { length: 128 }).notNull().unique(),
  description: text("description"),
  icon: varchar("icon", { length: 64 }),
  color: varchar("color", { length: 32 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ContentTheme = typeof contentThemes.$inferSelect;

export const publicationLogs = pgTable("publication_logs", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  postId: integer("postId").notNull(),
  attempt: integer("attempt").default(1).notNull(),
  status: logStatusEnum("log_status").notNull(),
  instagramPostId: varchar("instagramPostId", { length: 256 }),
  permalink: text("permalink"),
  error: text("error"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PublicationLog = typeof publicationLogs.$inferSelect;

export const triacContent = pgTable("triac_content", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  type: contentTypeEnum("content_type").notNull(),
  name: varchar("name", { length: 256 }).notNull(),
  subtitle: varchar("subtitle", { length: 256 }),
  description: text("description").notNull(),
  category: varchar("category", { length: 128 }),
  technologies: text("technologies"),
  highlights: text("highlights"),
  status: contentStatusEnum("content_status").default("ativo").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type TriacContent = typeof triacContent.$inferSelect;

export const researchTopics = pgTable("research_topics", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  accountId: integer("accountId").notNull(),
  name: varchar("name", { length: 256 }).notNull(),
  query: varchar("query", { length: 512 }).notNull(),
  language: varchar("language", { length: 8 }).default("pt").notNull(),
  active: integer("active").default(1).notNull(),
  publishHour: integer("publishHour").default(8).notNull(),
  autoPublish: integer("autoPublish").default(0).notNull(),
  sortOrder: integer("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ResearchTopic = typeof researchTopics.$inferSelect;
export type InsertResearchTopic = typeof researchTopics.$inferInsert;

export const researchRuns = pgTable("research_runs", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  topicId: integer("topicId").notNull(),
  postId: integer("postId"),
  headlines: text("headlines"),
  status: researchRunStatusEnum("research_run_status").notNull(),
  error: text("error"),
  ranAt: timestamp("ranAt").defaultNow().notNull(),
});

export type ResearchRun = typeof researchRuns.$inferSelect;
