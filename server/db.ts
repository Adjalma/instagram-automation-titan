import { eq, desc, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import {
  InsertUser, users, instagramAccounts, posts, postMedia,
  assets, contentThemes, publicationLogs,
} from "../drizzle/schema";
import type { InsertPost } from "../drizzle/schema";

let _db: ReturnType<typeof drizzle> | null = null;
let _lastError = "";

export async function getDb() {
  if (_db) return _db;

  const url = process.env.DATABASE_URL
    || process.env.DB_URL
    || process.env.POSTGRES_URL
    || process.env.POSTGRES_PRISMA_URL
    || process.env.SUPABASE_DB_URL;
  if (!url) {
    _lastError = "No database URL found. Checked: DATABASE_URL, DB_URL, POSTGRES_URL, SUPABASE_DB_URL";
    console.error("[Database]", _lastError);
    return null;
  }

  try {
    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      _lastError = "Invalid database URL format";
      console.error("[Database]", _lastError);
      return null;
    }

    const host = parsed.hostname;
    const port = parseInt(parsed.port || "5432", 10);
    const database = parsed.pathname.replace("/", "") || "postgres";
    const username = decodeURIComponent(parsed.username || "postgres");
    const password = decodeURIComponent(parsed.password || "");

    console.log(`[Database] Connecting to ${host}:${port}/${database} as ${username}`);

    const client = postgres({
      host,
      port,
      database,
      username,
      password,
      max: 1,
      ssl: "require",
      idle_timeout: 20,
      connect_timeout: 30,
      prepare: false,
    });

    // Test raw connection before wrapping with Drizzle
    await client`SELECT 1 AS ok`;
    console.log("[Database] Raw connection OK");

    const db = drizzle(client);
    _db = db;
    _lastError = "";
    console.log("[Database] Connected to PostgreSQL");
  } catch (error: any) {
    const root = error?.cause ?? error;
    const msg = root?.message ?? error?.message ?? String(error);
    const code = root?.code ?? error?.code ?? "";
    _lastError = code ? `${code}: ${msg}` : msg;
    console.error("[Database] Connection failed:", _lastError, error);
    _db = null;
  }

  return _db;
}

export function getLastDbError() {
  return _lastError;
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
  theme?: string; scheduledAt?: Date; status?: string; mcpPending?: number;
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
    mcpPending: data.mcpPending ?? 0,
  }).returning({ id: posts.id });
  return { id: result[0].id };
}

const POST_COLS = `p.id, p."userId", p."accountId", p.caption, p.status, p.theme, p."scheduledAt", p."publishedAt",
  p."instagramPostId", p."instagramPermalink", p.likes, p.comments, p."createdAt", p."updatedAt",
  p."mcpPending", p."retryCount", p."nextRetryAt", p."linkedinPublished", p."facebookPublished",
  pm."mediaUrl" AS "mediaUrl"`;

const POST_LIST_LIMIT = 150;

const POST_FROM = sql.raw(`
  FROM posts p
  LEFT JOIN LATERAL (
    SELECT "mediaUrl" FROM post_media
    WHERE "postId" = p.id
    ORDER BY "sortOrder" ASC
    LIMIT 1
  ) pm ON true
`);

async function queryPosts(db: ReturnType<typeof drizzle>, rawSql: ReturnType<typeof sql>): Promise<any[]> {
  try {
    const result = await db.execute(rawSql);
    return Array.isArray(result) ? result : [];
  } catch (error) {
    _db = null;
    throw error;
  }
}

export async function getPostById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await queryPosts(db, sql`SELECT ${sql.raw(POST_COLS)} ${POST_FROM} WHERE p.id = ${id} LIMIT 1`);
  return rows[0];
}

export async function getPostsByAccount(accountId: number, status?: string) {
  const db = await getDb();
  if (!db) return [];
  if (status) {
    return queryPosts(db, sql`SELECT ${sql.raw(POST_COLS)} ${POST_FROM} WHERE p."accountId" = ${accountId} AND p.status = ${status} ORDER BY p."createdAt" DESC LIMIT ${POST_LIST_LIMIT}`);
  }
  return queryPosts(db, sql`SELECT ${sql.raw(POST_COLS)} ${POST_FROM} WHERE p."accountId" = ${accountId} ORDER BY p."createdAt" DESC LIMIT ${POST_LIST_LIMIT}`);
}

export async function getPostsByStatus(status: string) {
  const db = await getDb();
  if (!db) return [];
  return queryPosts(db, sql`SELECT ${sql.raw(POST_COLS)} ${POST_FROM} WHERE p.status = ${status} ORDER BY p."createdAt" DESC LIMIT ${POST_LIST_LIMIT}`);
}

export async function getAllPosts() {
  const db = await getDb();
  if (!db) return [];
  return queryPosts(db, sql`SELECT ${sql.raw(POST_COLS)} ${POST_FROM} ORDER BY p."createdAt" DESC LIMIT ${POST_LIST_LIMIT}`);
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

export async function updateFirstPostMediaUrl(postId: number, mediaUrl: string) {
  const db = await getDb();
  if (!db) return;
  const rows = await db
    .select({ id: postMedia.id })
    .from(postMedia)
    .where(eq(postMedia.postId, postId))
    .orderBy(postMedia.sortOrder)
    .limit(1);
  if (rows[0]) {
    await db.update(postMedia).set({ mediaUrl }).where(eq(postMedia.id, rows[0].id));
  }
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
  const { ensureContentThemes } = await import("./seed-triarc");
  return ensureContentThemes();
}

export async function getThemeBySlug(slug: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(contentThemes).where(eq(contentThemes.slug, slug)).limit(1);
  return result[0];
}
