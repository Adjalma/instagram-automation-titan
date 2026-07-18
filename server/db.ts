import { eq, desc, and, sql, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { createPool } from "mysql2";
import { InsertUser, users, instagramAccounts, posts, postMedia, assets, contentThemes, publicationLogs } from "../drizzle/schema";
import type { InsertPost } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;
let _lastDbError = "";
let _activeDbUrl = "";

export function getActiveDbUrl() { return _activeDbUrl; }

export async function getDb() {
  // IMPORTANTE: usar SOMENTE DB_URL — o Vercel sobrescreve DATABASE_URL com Supabase PostgreSQL
  // automaticamente via integração nativa, o que quebraria a conexão MySQL
  const dbUrl = process.env.DB_URL ?? "";
  if (!_db && dbUrl) {
    try {
      _activeDbUrl = dbUrl.replace(/:[^:@]+@/, ":***@");
      console.log("[Database] Connecting to:", _activeDbUrl);
      // Parseia a URL manualmente para evitar problemas com ssl= na query string
      let poolConfig: Record<string, unknown> = {
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        enableKeepAlive: true,
        keepAliveInitialDelay: 10000,
      };
      try {
        const parsed = new URL(dbUrl);
        poolConfig.host = parsed.hostname;
        poolConfig.port = parseInt(parsed.port || "3306", 10);
        poolConfig.user = decodeURIComponent(parsed.username);
        poolConfig.password = decodeURIComponent(parsed.password);
        poolConfig.database = parsed.pathname.replace(/^\//, "");
        // TiDB Cloud exige SSL — adiciona via opções explícitas
        if (parsed.hostname.includes("tidbcloud") || parsed.searchParams.has("ssl")) {
          poolConfig.ssl = { rejectUnauthorized: true };
        }
      } catch {
        // fallback para URI direta se o parse falhar
        (poolConfig as any).uri = dbUrl;
      }
      const pool = createPool(poolConfig as any);
      _db = drizzle(pool);
    } catch (error: any) {
      _lastDbError = error.message;
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
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
    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];
    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
    if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
    else if (user.openId === ENV.ownerOpenId) { values.role = 'admin'; updateSet.role = 'admin'; }
    if (!values.lastSignedIn) values.lastSignedIn = new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) { console.error("[Database] Failed to upsert user:", error); /* não propaga — banco indisponível não deve quebrar autenticação */ }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
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
  const result = await db.select({
    status: posts.status,
    count: sql<number>`COUNT(*)`,
  }).from(posts).where(eq(posts.accountId, accountId)).groupBy(posts.status);
  const stats: Record<string, number> = { draft: 0, pending: 0, approved: 0, scheduled: 0, published: 0, rejected: 0 };
  for (const row of result) { stats[row.status] = Number(row.count); }
  return stats;
}

// ─── Posts ───────────────────────────────────────────────────────
export async function createPost(data: { userId: number; accountId: number; caption?: string; theme?: string; scheduledAt?: Date; status?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.execute<any>(
    sql`INSERT INTO posts (userId, accountId, caption, theme, scheduledAt, status)
        VALUES (${data.userId}, ${data.accountId}, ${data.caption ?? null}, ${data.theme ?? null}, ${data.scheduledAt ?? null}, ${(data.status ?? 'draft')})`
  );
  return { id: result.insertId };
}

const POST_COLS = `p.id, p.userId, p.accountId, p.caption, p.status, p.theme, p.scheduledAt, p.publishedAt,
  p.instagramPostId, p.instagramPermalink, p.likes, p.comments, p.createdAt, p.updatedAt,
  p.mcpPending, p.retryCount, p.nextRetryAt, p.linkedinPublished, p.facebookPublished,
  (SELECT pm.mediaUrl FROM post_media pm WHERE pm.postId = p.id ORDER BY pm.sortOrder ASC LIMIT 1) AS mediaUrl,
  ia.platform AS platform, ia.handle AS handle`;
const POST_FROM = `posts p LEFT JOIN instagram_accounts ia ON p.accountId = ia.id`;

async function queryPosts(db: ReturnType<typeof drizzle>, rawSql: ReturnType<typeof sql>): Promise<any[]> {
  const result = await db.execute(rawSql);
  // Drizzle mysql2 execute returns [rows, fields] tuple
  const rows = Array.isArray(result) ? result[0] : result;
  return Array.isArray(rows) ? rows : [];
}

export async function getPostById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await queryPosts(db, sql`SELECT ${sql.raw(POST_COLS)} FROM ${sql.raw(POST_FROM)} WHERE p.id = ${id} LIMIT 1`);
  return rows[0];
}

export async function getPostsByAccount(accountId: number, status?: string) {
  const db = await getDb();
  if (!db) return [];
  if (status) {
    return queryPosts(db, sql`SELECT ${sql.raw(POST_COLS)} FROM ${sql.raw(POST_FROM)} WHERE p.accountId = ${accountId} AND p.status = ${status} ORDER BY p.createdAt DESC`);
  }
  return queryPosts(db, sql`SELECT ${sql.raw(POST_COLS)} FROM ${sql.raw(POST_FROM)} WHERE p.accountId = ${accountId} ORDER BY p.createdAt DESC`);
}

export async function getPostsByStatus(status: string) {
  const db = await getDb();
  if (!db) return [];
  return queryPosts(db, sql`SELECT ${sql.raw(POST_COLS)} FROM ${sql.raw(POST_FROM)} WHERE p.status = ${status} ORDER BY p.createdAt DESC`);
}

export async function getAllPosts() {
  const db = await getDb();
  if (!db) return [];
  return queryPosts(db, sql`SELECT ${sql.raw(POST_COLS)} FROM ${sql.raw(POST_FROM)} ORDER BY p.createdAt DESC`);
}

export async function updatePost(id: number, data: Partial<{ caption: string; status: string; theme: string; scheduledAt: Date | null; publishedAt: Date | null; instagramPostId: string; instagramPermalink: string; mcpPending: number; retryCount: number; nextRetryAt: Date | null; likes: number; comments: number; linkedinPublished: number; facebookPublished: number }>) {
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
export async function addPostMedia(postId: number, mediaUrl: string, mediaType: "image" | "video" = "image", sortOrder: number = 0) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(postMedia).values({ postId, mediaUrl, mediaType, sortOrder });
  return { id: result[0].insertId };
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
  const result = await db.insert(assets).values(data);
  return { id: result[0].insertId };
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
export async function createPublicationLog(data: { postId: number; attempt: number; status: "success" | "failed" | "pending"; instagramPostId?: string; permalink?: string; error?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(publicationLogs).values(data as any);
  return { id: result[0].insertId };
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

/** Retorna a última mensagem de erro do banco (para diagnóstico no /api/health) */
export function getLastDbError(): string {
  return _lastDbError;
}
