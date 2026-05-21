import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const instagramAccounts = mysqlTable("instagram_accounts", {
  id: int("id").autoincrement().primaryKey(),
  handle: varchar("handle", { length: 128 }).notNull().unique(),
  displayName: varchar("displayName", { length: 256 }).notNull(),
  accountType: mysqlEnum("accountType", ["personal", "business"]).notNull(),
  tone: mysqlEnum("tone", ["personal", "corporate"]).notNull(),
  avatarUrl: text("avatarUrl"),
  bio: text("bio"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type InstagramAccount = typeof instagramAccounts.$inferSelect;

export const posts = mysqlTable("posts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  accountId: int("accountId").notNull(),
  caption: text("caption"),
  status: mysqlEnum("status", ["draft", "pending", "approved", "scheduled", "published", "rejected"]).default("draft").notNull(),
  theme: text('theme'),
  scheduledAt: timestamp("scheduledAt"),
  publishedAt: timestamp("publishedAt"),
  instagramPostId: varchar("instagramPostId", { length: 256 }),
  instagramPermalink: text("instagramPermalink"),
  mcpPending: int("mcpPending").$defaultFn(() => 0).notNull(), // 1 = MCP command sent, awaiting manual confirmation
  retryCount: int("retryCount").$defaultFn(() => 0).notNull(), // número de tentativas de publicação
  nextRetryAt: timestamp("nextRetryAt"), // próximo horário de tentativa (backoff)
  likes: int("likes").$defaultFn(() => 0),
  comments: int("comments").$defaultFn(() => 0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Post = typeof posts.$inferSelect;
export type InsertPost = typeof posts.$inferInsert;

export const postMedia = mysqlTable("post_media", {
  id: int("id").autoincrement().primaryKey(),
  postId: int("postId").notNull(),
  mediaUrl: text("mediaUrl").notNull(),
  mediaType: mysqlEnum("mediaType", ["image", "video"]).default("image").notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PostMedia = typeof postMedia.$inferSelect;

export const assets = mysqlTable("assets", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 256 }).notNull(),
  url: text("url").notNull(),
  fileKey: varchar("fileKey", { length: 512 }).notNull(),
  mimeType: varchar("mimeType", { length: 128 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Asset = typeof assets.$inferSelect;

export const contentThemes = mysqlTable("content_themes", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 128 }).notNull(),
  slug: varchar("slug", { length: 128 }).notNull().unique(),
  description: text("description"),
  icon: varchar("icon", { length: 64 }),
  color: varchar("color", { length: 32 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ContentTheme = typeof contentThemes.$inferSelect;

export const publicationLogs = mysqlTable("publication_logs", {
  id: int("id").autoincrement().primaryKey(),
  postId: int("postId").notNull(),
  attempt: int("attempt").default(1).notNull(),
  status: mysqlEnum("status", ["success", "failed", "pending"]).notNull(),
  instagramPostId: varchar("instagramPostId", { length: 256 }),
  permalink: text("permalink"),
  error: text("error"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PublicationLog = typeof publicationLogs.$inferSelect;

export const triacContent = mysqlTable("triac_content", {
  id: int("id").autoincrement().primaryKey(),
  type: mysqlEnum("type", ["servico", "projeto"]).notNull(),
  name: varchar("name", { length: 256 }).notNull(),
  subtitle: varchar("subtitle", { length: 256 }),
  description: text("description").notNull(),
  category: varchar("category", { length: 128 }),
  technologies: text("technologies"), // JSON array
  highlights: text("highlights"), // JSON array
  status: mysqlEnum("status", ["ativo", "em_desenvolvimento", "em_breve"]).default("ativo").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type TriacContent = typeof triacContent.$inferSelect;

export const researchTopics = mysqlTable("research_topics", {
  id: int("id").autoincrement().primaryKey(),
  accountId: int("accountId").notNull(),
  name: varchar("name", { length: 256 }).notNull(),
  query: varchar("query", { length: 512 }).notNull(), // query para a NewsAPI
  language: varchar("language", { length: 8 }).default("pt").notNull(), // pt ou en
  active: int("active").default(1).notNull(), // 1 = ativo
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ResearchTopic = typeof researchTopics.$inferSelect;
export type InsertResearchTopic = typeof researchTopics.$inferInsert;

export const researchRuns = mysqlTable("research_runs", {
  id: int("id").autoincrement().primaryKey(),
  topicId: int("topicId").notNull(),
  postId: int("postId"), // post gerado (null se falhou)
  headlines: text("headlines"), // JSON array de títulos usados
  status: mysqlEnum("status", ["success", "failed", "skipped"]).notNull(),
  error: text("error"),
  ranAt: timestamp("ranAt").defaultNow().notNull(),
});

export type ResearchRun = typeof researchRuns.$inferSelect;
