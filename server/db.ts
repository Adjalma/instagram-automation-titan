import { eq, desc, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import {
  InsertUser, users, instagramAccounts, posts, postMedia,
  assets, contentThemes, publicationLogs,
} from "../drizzle/schema";
import type { InsertPost } from "../drizzle/schema";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (_db) return _db;

  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("[Database] DATABASE_URL env var is not set");
    return null;
  }

  try {
    // postgres-js is lazy: the actual TCP connection happens on first query.
    // We run SELECT 1 here so any connection error is caught and logged now.
    const client = postgres(url, {
      max: 1,
      ssl: { rejectUnauthorized: false },
      idle_timeout: 20,
      connect_timeout: 10,
      prepare: false,
    });
    const db = drizzle(client);
    await db.execute(sql`SELECT 1`);
    _db = db;
    console.log("[Database] Connected to PostgreSQL");
  } catch (error: any) {
    console.error("[Database] Connection failed:", error?.message ?? String(error));
    _db = null;
  }

  return _db;
}

// ─── Users ───────────────────────────────────────────────────────
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot upsert user: database not available"); return; }
  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};

    const fields = ["name", "email", "loginMethod", "passwordHash", "role", "lastSignedIn"] as const;
    for (const field of fields) {
      const val = (user as any)[field];
      if (val === undefined) continue;
      (values as any)[field] = val;
      updateSet[field] = val;
    }

    if (!values.lastSignedIn) values.lastSignedIn = new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

    await db.insert(users).values(values).onConflictDoUpdate({
      target: users.openId,
      set: updateSet as any,
    });
  } catch (error) { console.error("[Database] Failed to upsert user:", error); throw error; }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ─── Instagram Accounts ─────────────────────────────────────────
export async function getAllAccounts() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(instagramAccounts);
}

export async function getAccountById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(instagramAccounts).where(eq(instagramAccounts.id, id)).limit(1);
  return result[0];
}

export async function getAccountStats(accountId: number) {
  const db = await getDb();
  if (!db) return { draft: 0, pending: 0, approved: 0, scheduled: 0, published: 0, rejected: 0 };
  const result = await db
    .select({ status: posts.status, count: sql<number>`COUNT(*)` })
    .from(posts)
    .where(eq(posts.accountId, accountId))
    .groupBy(posts.status);
  const stats: Record<string, number> = { draft: 0, pending: 0, approved: 0, scheduled: 0, published: 0, rejected: 0 };
  for (const row of result) { stats[row.status] = Number(row.count); }
  return stats;
}

// ─── Posts ───────────────────────────────────────────────────────
export async function createPost(data: {
  userId: number; accountId: number; caption?: string;
  theme?: string; scheduledAt?: Date; status?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(posts).values({
    userId: data.userId,
    accountId: data.accountId,
    caption: data.caption ?? null,
    theme: data.theme ?? null,
    scheduledAt: data.scheduledAt ?? null,
    status: (data.status ?? "draft") as any,
  }).returning({ id: posts.id });
  return { id: result[0].id };
}

const POST_COLS = `p.id, p.\"userId\", p.\"accountId\", p.caption, p.status, p.theme, p.\"scheduledAt\", p.\"publishedAt\",
  p.\"instagramPostId\", p.\"instagramPermalink\", p.likes, p.comments, p.\"createdAt\", p.\"updatedAt\",
  p.\"mcpPending\", p.\"retryCount\", p.\"nextRetryAt\", p.\"linkedinPublished\", p.\"facebookPublished\",
  (SELECT pm.\"mediaUrl\" FROM post_media pm WHERE pm.\"postId\" = p.id ORDER BY pm.\"sortOrder\" ASC LIMIT 1) AS \"mediaUrl\"`;

async function queryPosts(db: ReturnType<typeof drizzle>, rawSql: ReturnType<typeof sql>): Promise<any[]> {
  const result = await db.execute(rawSql);
  return Array.isArray(result) ? result : [];
}

export async function getPostById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await queryPosts(db, sql`SELECT ${sql.raw(POST_COLS)} FROM posts p WHERE p.id = ${id} LIMIT 1`);
  return rows[0];
}

export async function getPostsByAccount(accountId: number, status?: string) {
  const db = await getDb();
  if (!db) return [];
  if (status) {
    return queryPosts(db, sql`SELECT ${sql.raw(POST_COLS)} FROM posts p WHERE p."accountId" = ${accountId} AND p.status = ${status} ORDER BY p."createdAt" DESC`);
  }
  return queryPosts(db, sql`SELECT ${sql.raw(POST_COLS)} FROM posts p WHERE p."accountId" = ${accountId} ORDER BY p."createdAt" DESC`);
}

export async function getPostsByStatus(status: string) {
  const db = await getDb();
  if (!db) return [];
  return queryPosts(db, sql`SELECT ${sql.raw(POST_COLS)} FROM posts p WHERE p.status = ${status} ORDER BY p."createdAt" DESC`);
}

export async function getAllPosts() {
  const db = await getDb();
  if (!db) return [];
  return queryPosts(db, sql`SELECT ${sql.raw(POST_COLS)} FROM posts p ORDER BY p."createdAt" DESC`);
}

export async function updatePost(id: number, data: Partial<{
  caption: string; status: string; theme: string; scheduledAt: Date | null;
  publishedAt: Date | null; instagramPostId: string; instagramPermalink: string;
  mcpPending: number; retryCount: number; nextRetryAt: Date | null;
  likes: number; comments: number; linkedinPublished: number; facebookPublished: number;
}>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(posts).set(data as any).where(eq(posts.id, id));
}

export async function deletePost(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(postMedia).where(eq(postMedia.postId, id));
  await db.delete(posts).where(eq(posts.id, id));
}

// ─── Post Media ──────────────────────────────────────────────────
export async function addPostMedia(postId: number, mediaUrl: string, mediaType: "image" | "video" = "image", sortOrder = 0) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(postMedia).values({ postId, mediaUrl, mediaType, sortOrder }).returning({ id: postMedia.id });
  return { id: result[0].id };
}

export async function getPostMedia(postId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(postMedia).where(eq(postMedia.postId, postId)).orderBy(postMedia.sortOrder);
}

export async function deletePostMedia(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(postMedia).where(eq(postMedia.id, id));
}

// ─── Assets ──────────────────────────────────────────────────────
export async function createAsset(data: { userId: number; name: string; url: string; fileKey: string; mimeType?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(assets).values(data).returning({ id: assets.id });
  return { id: result[0].id };
}

export async function getAssetsByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(assets).where(eq(assets.userId, userId)).orderBy(desc(assets.createdAt));
}

export async function deleteAsset(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(assets).where(eq(assets.id, id));
}

// ─── Publication Logs ───────────────────────────────────────────
export async function createPublicationLog(data: {
  postId: number; attempt: number; status: "success" | "failed" | "pending";
  instagramPostId?: string; permalink?: string; error?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(publicationLogs).values(data as any).returning({ id: publicationLogs.id });
  return { id: result[0].id };
}

export async function getPublicationLogs(limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(publicationLogs).orderBy(desc(publicationLogs.createdAt)).limit(limit);
}

export async function getPublicationLogsByPost(postId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(publicationLogs).where(eq(publicationLogs.postId, postId)).orderBy(desc(publicationLogs.createdAt));
}

// ─── Content Themes ──────────────────────────────────────────────
export async function getAllThemes() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(contentThemes);
}

export async function getThemeBySlug(slug: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(contentThemes).where(eq(contentThemes.slug, slug)).limit(1);
  return result[0];
}
