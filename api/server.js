var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// drizzle/schema.ts
var schema_exports = {};
__export(schema_exports, {
  assets: () => assets,
  contentThemes: () => contentThemes,
  instagramAccounts: () => instagramAccounts,
  postMedia: () => postMedia,
  posts: () => posts,
  publicationLogs: () => publicationLogs,
  researchRuns: () => researchRuns,
  researchTopics: () => researchTopics,
  triacContent: () => triacContent,
  users: () => users
});
import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";
var users, instagramAccounts, posts, postMedia, assets, contentThemes, publicationLogs, triacContent, researchTopics, researchRuns;
var init_schema = __esm({
  "drizzle/schema.ts"() {
    "use strict";
    users = mysqlTable("users", {
      id: int("id").autoincrement().primaryKey(),
      openId: varchar("openId", { length: 64 }).notNull().unique(),
      name: text("name"),
      email: varchar("email", { length: 320 }),
      loginMethod: varchar("loginMethod", { length: 64 }),
      role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
      lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull()
    });
    instagramAccounts = mysqlTable("instagram_accounts", {
      id: int("id").autoincrement().primaryKey(),
      handle: varchar("handle", { length: 128 }).notNull().unique(),
      displayName: varchar("displayName", { length: 256 }).notNull(),
      platform: mysqlEnum("platform", ["instagram", "linkedin", "facebook", "tiktok", "youtube"]).default("instagram").notNull(),
      accountType: mysqlEnum("accountType", ["personal", "business"]).notNull(),
      tone: mysqlEnum("tone", ["personal", "corporate"]).notNull(),
      avatarUrl: text("avatarUrl"),
      bio: text("bio"),
      profileUrl: text("profileUrl"),
      // URL do perfil na rede social
      accessToken: text("accessToken"),
      // OAuth access token (LinkedIn, Facebook, etc)
      tokenExpiresAt: timestamp("tokenExpiresAt"),
      // expiração do token
      linkedinUrn: varchar("linkedinUrn", { length: 256 }),
      // LinkedIn person/org URN
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
    posts = mysqlTable("posts", {
      id: int("id").autoincrement().primaryKey(),
      userId: int("userId").notNull(),
      accountId: int("accountId").notNull(),
      caption: text("caption"),
      status: mysqlEnum("status", ["draft", "pending", "approved", "scheduled", "published", "rejected"]).default("draft").notNull(),
      theme: text("theme"),
      scheduledAt: timestamp("scheduledAt"),
      publishedAt: timestamp("publishedAt"),
      instagramPostId: varchar("instagramPostId", { length: 256 }),
      instagramPermalink: text("instagramPermalink"),
      mcpPending: int("mcpPending").$defaultFn(() => 0).notNull(),
      // 1 = MCP command sent, awaiting manual confirmation
      retryCount: int("retryCount").$defaultFn(() => 0).notNull(),
      // número de tentativas de publicação
      nextRetryAt: timestamp("nextRetryAt"),
      // próximo horário de tentativa (backoff)
      linkedinPublished: int("linkedinPublished").$defaultFn(() => 0).notNull(),
      // 1 = publicado no LinkedIn
      facebookPublished: int("facebookPublished").$defaultFn(() => 0).notNull(),
      // 1 = publicado no Facebook
      likes: int("likes").$defaultFn(() => 0),
      comments: int("comments").$defaultFn(() => 0),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
    });
    postMedia = mysqlTable("post_media", {
      id: int("id").autoincrement().primaryKey(),
      postId: int("postId").notNull(),
      mediaUrl: text("mediaUrl").notNull(),
      mediaType: mysqlEnum("mediaType", ["image", "video"]).default("image").notNull(),
      sortOrder: int("sortOrder").default(0).notNull(),
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
    assets = mysqlTable("assets", {
      id: int("id").autoincrement().primaryKey(),
      userId: int("userId").notNull(),
      name: varchar("name", { length: 256 }).notNull(),
      url: text("url").notNull(),
      fileKey: varchar("fileKey", { length: 512 }).notNull(),
      mimeType: varchar("mimeType", { length: 128 }),
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
    contentThemes = mysqlTable("content_themes", {
      id: int("id").autoincrement().primaryKey(),
      name: varchar("name", { length: 128 }).notNull(),
      slug: varchar("slug", { length: 128 }).notNull().unique(),
      description: text("description"),
      icon: varchar("icon", { length: 64 }),
      color: varchar("color", { length: 32 }),
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
    publicationLogs = mysqlTable("publication_logs", {
      id: int("id").autoincrement().primaryKey(),
      postId: int("postId").notNull(),
      attempt: int("attempt").default(1).notNull(),
      status: mysqlEnum("status", ["success", "failed", "pending"]).notNull(),
      instagramPostId: varchar("instagramPostId", { length: 256 }),
      permalink: text("permalink"),
      error: text("error"),
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
    triacContent = mysqlTable("triac_content", {
      id: int("id").autoincrement().primaryKey(),
      type: mysqlEnum("type", ["servico", "projeto"]).notNull(),
      name: varchar("name", { length: 256 }).notNull(),
      subtitle: varchar("subtitle", { length: 256 }),
      description: text("description").notNull(),
      category: varchar("category", { length: 128 }),
      technologies: text("technologies"),
      // JSON array
      highlights: text("highlights"),
      // JSON array
      status: mysqlEnum("status", ["ativo", "em_desenvolvimento", "em_breve"]).default("ativo").notNull(),
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
    researchTopics = mysqlTable("research_topics", {
      id: int("id").autoincrement().primaryKey(),
      accountId: int("accountId").notNull(),
      name: varchar("name", { length: 256 }).notNull(),
      query: varchar("query", { length: 512 }).notNull(),
      // query para a NewsAPI
      language: varchar("language", { length: 8 }).default("pt").notNull(),
      // pt ou en
      active: int("active").default(1).notNull(),
      // 1 = ativo
      publishHour: int("publishHour").default(8).notNull(),
      // hora de publicação (0-23, Brasília)
      autoPublish: int("autoPublish").default(0).notNull(),
      // 1 = publicar automaticamente sem aprovação manual
      sortOrder: int("sortOrder").default(0).notNull(),
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
    researchRuns = mysqlTable("research_runs", {
      id: int("id").autoincrement().primaryKey(),
      topicId: int("topicId").notNull(),
      postId: int("postId"),
      // post gerado (null se falhou)
      headlines: text("headlines"),
      // JSON array de títulos usados
      status: mysqlEnum("status", ["success", "failed", "skipped"]).notNull(),
      error: text("error"),
      ranAt: timestamp("ranAt").defaultNow().notNull()
    });
  }
});

// server/_core/env.ts
var ENV;
var init_env = __esm({
  "server/_core/env.ts"() {
    "use strict";
    ENV = {
      appId: process.env.VITE_APP_ID ?? "",
      cookieSecret: process.env.JWT_SECRET ?? "",
      databaseUrl: process.env.DATABASE_URL ?? "",
      oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
      ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
      isProduction: process.env.NODE_ENV === "production",
      forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
      forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
      newsApiKey: process.env.NEWS_API_KEY ?? "",
      linkedinClientId: process.env.LINKEDIN_CLIENT_ID ?? "",
      linkedinClientSecret: process.env.LINKEDIN_CLIENT_SECRET ?? "",
      facebookAppId: process.env.FACEBOOK_APP_ID ?? "",
      facebookAppSecret: process.env.FACEBOOK_APP_SECRET ?? ""
    };
  }
});

// server/db.ts
var db_exports = {};
__export(db_exports, {
  addPostMedia: () => addPostMedia,
  createAsset: () => createAsset,
  createPost: () => createPost,
  createPublicationLog: () => createPublicationLog,
  deleteAsset: () => deleteAsset,
  deletePost: () => deletePost,
  deletePostMedia: () => deletePostMedia,
  getAccountById: () => getAccountById,
  getAccountStats: () => getAccountStats,
  getAllAccounts: () => getAllAccounts,
  getAllPosts: () => getAllPosts,
  getAllThemes: () => getAllThemes,
  getAssetsByUser: () => getAssetsByUser,
  getDb: () => getDb,
  getLastDbError: () => getLastDbError,
  getPostById: () => getPostById,
  getPostMedia: () => getPostMedia,
  getPostsByAccount: () => getPostsByAccount,
  getPostsByStatus: () => getPostsByStatus,
  getPublicationLogs: () => getPublicationLogs,
  getPublicationLogsByPost: () => getPublicationLogsByPost,
  getThemeBySlug: () => getThemeBySlug,
  getUserByOpenId: () => getUserByOpenId,
  updatePost: () => updatePost,
  upsertUser: () => upsertUser
});
import { eq, desc, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { createPool } from "mysql2";
async function getDb() {
  const rawUrl = process.env.DATABASE_URL ?? "";
  const dbUrl = rawUrl.startsWith("mysql") ? rawUrl : process.env.DB_URL ?? "";
  if (!_db && dbUrl) {
    try {
      const pool = createPool({
        uri: dbUrl,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        enableKeepAlive: true,
        keepAliveInitialDelay: 1e4
      });
      _db = drizzle(pool);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}
async function upsertUser(user) {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }
  try {
    const values = { openId: user.openId };
    const updateSet = {};
    const textFields = ["name", "email", "loginMethod"];
    const assignNullable = (field) => {
      const value = user[field];
      if (value === void 0) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== void 0) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== void 0) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }
    if (!values.lastSignedIn) values.lastSignedIn = /* @__PURE__ */ new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = /* @__PURE__ */ new Date();
    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}
async function getUserByOpenId(openId) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function getAllAccounts() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(instagramAccounts);
}
async function getAccountById(id) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(instagramAccounts).where(eq(instagramAccounts.id, id)).limit(1);
  return result[0];
}
async function getAccountStats(accountId) {
  const db = await getDb();
  if (!db) return { draft: 0, pending: 0, approved: 0, scheduled: 0, published: 0, rejected: 0 };
  const result = await db.select({
    status: posts.status,
    count: sql`COUNT(*)`
  }).from(posts).where(eq(posts.accountId, accountId)).groupBy(posts.status);
  const stats = { draft: 0, pending: 0, approved: 0, scheduled: 0, published: 0, rejected: 0 };
  for (const row of result) {
    stats[row.status] = Number(row.count);
  }
  return stats;
}
async function createPost(data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.execute(
    sql`INSERT INTO posts (userId, accountId, caption, theme, scheduledAt, status)
        VALUES (${data.userId}, ${data.accountId}, ${data.caption ?? null}, ${data.theme ?? null}, ${data.scheduledAt ?? null}, ${data.status ?? "draft"})`
  );
  return { id: result.insertId };
}
async function queryPosts(db, rawSql) {
  const result = await db.execute(rawSql);
  const rows = Array.isArray(result) ? result[0] : result;
  return Array.isArray(rows) ? rows : [];
}
async function getPostById(id) {
  const db = await getDb();
  if (!db) return void 0;
  const rows = await queryPosts(db, sql`SELECT ${sql.raw(POST_COLS)} FROM posts p WHERE p.id = ${id} LIMIT 1`);
  return rows[0];
}
async function getPostsByAccount(accountId, status) {
  const db = await getDb();
  if (!db) return [];
  if (status) {
    return queryPosts(db, sql`SELECT ${sql.raw(POST_COLS)} FROM posts p WHERE p.accountId = ${accountId} AND p.status = ${status} ORDER BY p.createdAt DESC`);
  }
  return queryPosts(db, sql`SELECT ${sql.raw(POST_COLS)} FROM posts p WHERE p.accountId = ${accountId} ORDER BY p.createdAt DESC`);
}
async function getPostsByStatus(status) {
  const db = await getDb();
  if (!db) return [];
  return queryPosts(db, sql`SELECT ${sql.raw(POST_COLS)} FROM posts p WHERE p.status = ${status} ORDER BY p.createdAt DESC`);
}
async function getAllPosts() {
  const db = await getDb();
  if (!db) return [];
  return queryPosts(db, sql`SELECT ${sql.raw(POST_COLS)} FROM posts p ORDER BY p.createdAt DESC`);
}
async function updatePost(id, data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(posts).set(data).where(eq(posts.id, id));
}
async function deletePost(id) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(postMedia).where(eq(postMedia.postId, id));
  await db.delete(posts).where(eq(posts.id, id));
}
async function addPostMedia(postId, mediaUrl, mediaType = "image", sortOrder = 0) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(postMedia).values({ postId, mediaUrl, mediaType, sortOrder });
  return { id: result[0].insertId };
}
async function getPostMedia(postId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(postMedia).where(eq(postMedia.postId, postId)).orderBy(postMedia.sortOrder);
}
async function deletePostMedia(id) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(postMedia).where(eq(postMedia.id, id));
}
async function createAsset(data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(assets).values(data);
  return { id: result[0].insertId };
}
async function getAssetsByUser(userId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(assets).where(eq(assets.userId, userId)).orderBy(desc(assets.createdAt));
}
async function deleteAsset(id) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(assets).where(eq(assets.id, id));
}
async function createPublicationLog(data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(publicationLogs).values(data);
  return { id: result[0].insertId };
}
async function getPublicationLogs(limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(publicationLogs).orderBy(desc(publicationLogs.createdAt)).limit(limit);
}
async function getPublicationLogsByPost(postId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(publicationLogs).where(eq(publicationLogs.postId, postId)).orderBy(desc(publicationLogs.createdAt));
}
async function getAllThemes() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(contentThemes);
}
async function getThemeBySlug(slug) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(contentThemes).where(eq(contentThemes.slug, slug)).limit(1);
  return result[0];
}
function getLastDbError() {
  return "";
}
var _db, POST_COLS;
var init_db = __esm({
  "server/db.ts"() {
    "use strict";
    init_schema();
    init_env();
    _db = null;
    POST_COLS = `p.id, p.userId, p.accountId, p.caption, p.status, p.theme, p.scheduledAt, p.publishedAt,
  p.instagramPostId, p.instagramPermalink, p.likes, p.comments, p.createdAt, p.updatedAt,
  p.mcpPending, p.retryCount, p.nextRetryAt, p.linkedinPublished, p.facebookPublished,
  (SELECT pm.mediaUrl FROM post_media pm WHERE pm.postId = p.id ORDER BY pm.sortOrder ASC LIMIT 1) AS mediaUrl`;
  }
});

// server/vercel.ts
import "dotenv/config";
import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";

// shared/const.ts
var COOKIE_NAME = "app_session_id";
var ONE_YEAR_MS = 1e3 * 60 * 60 * 24 * 365;
var AXIOS_TIMEOUT_MS = 3e4;
var UNAUTHED_ERR_MSG = "Please login (10001)";
var NOT_ADMIN_ERR_MSG = "You do not have required permission (10002)";

// server/_core/oauth.ts
init_db();

// server/_core/cookies.ts
function isSecureRequest(req) {
  if (req.protocol === "https") return true;
  const forwardedProto = req.headers["x-forwarded-proto"];
  if (!forwardedProto) return false;
  const protoList = Array.isArray(forwardedProto) ? forwardedProto : forwardedProto.split(",");
  return protoList.some((proto) => proto.trim().toLowerCase() === "https");
}
function getSessionCookieOptions(req) {
  return {
    httpOnly: true,
    path: "/",
    sameSite: "none",
    secure: isSecureRequest(req)
  };
}

// shared/_core/errors.ts
var HttpError = class extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.name = "HttpError";
  }
};
var ForbiddenError = (msg) => new HttpError(403, msg);

// server/_core/sdk.ts
init_db();
init_env();
import axios from "axios";
import { parse as parseCookieHeader } from "cookie";
import { SignJWT, jwtVerify } from "jose";
var isNonEmptyString = (value) => typeof value === "string" && value.length > 0;
var EXCHANGE_TOKEN_PATH = `/webdev.v1.WebDevAuthPublicService/ExchangeToken`;
var GET_USER_INFO_PATH = `/webdev.v1.WebDevAuthPublicService/GetUserInfo`;
var GET_USER_INFO_WITH_JWT_PATH = `/webdev.v1.WebDevAuthPublicService/GetUserInfoWithJwt`;
var OAuthService = class {
  constructor(client) {
    this.client = client;
    console.log("[OAuth] Initialized with baseURL:", ENV.oAuthServerUrl);
    if (!ENV.oAuthServerUrl) {
      console.error(
        "[OAuth] ERROR: OAUTH_SERVER_URL is not configured! Set OAUTH_SERVER_URL environment variable."
      );
    }
  }
  decodeState(state) {
    const redirectUri = atob(state);
    return redirectUri;
  }
  async getTokenByCode(code, state) {
    const payload = {
      clientId: ENV.appId,
      grantType: "authorization_code",
      code,
      redirectUri: this.decodeState(state)
    };
    const { data } = await this.client.post(
      EXCHANGE_TOKEN_PATH,
      payload
    );
    return data;
  }
  async getUserInfoByToken(token) {
    const { data } = await this.client.post(
      GET_USER_INFO_PATH,
      {
        accessToken: token.accessToken
      }
    );
    return data;
  }
};
var createOAuthHttpClient = () => axios.create({
  baseURL: ENV.oAuthServerUrl,
  timeout: AXIOS_TIMEOUT_MS
});
var SDKServer = class {
  client;
  oauthService;
  constructor(client = createOAuthHttpClient()) {
    this.client = client;
    this.oauthService = new OAuthService(this.client);
  }
  deriveLoginMethod(platforms, fallback) {
    if (fallback && fallback.length > 0) return fallback;
    if (!Array.isArray(platforms) || platforms.length === 0) return null;
    const set = new Set(
      platforms.filter((p) => typeof p === "string")
    );
    if (set.has("REGISTERED_PLATFORM_EMAIL")) return "email";
    if (set.has("REGISTERED_PLATFORM_GOOGLE")) return "google";
    if (set.has("REGISTERED_PLATFORM_APPLE")) return "apple";
    if (set.has("REGISTERED_PLATFORM_MICROSOFT") || set.has("REGISTERED_PLATFORM_AZURE"))
      return "microsoft";
    if (set.has("REGISTERED_PLATFORM_GITHUB")) return "github";
    const first = Array.from(set)[0];
    return first ? first.toLowerCase() : null;
  }
  /**
   * Exchange OAuth authorization code for access token
   * @example
   * const tokenResponse = await sdk.exchangeCodeForToken(code, state);
   */
  async exchangeCodeForToken(code, state) {
    return this.oauthService.getTokenByCode(code, state);
  }
  /**
   * Get user information using access token
   * @example
   * const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
   */
  async getUserInfo(accessToken) {
    const data = await this.oauthService.getUserInfoByToken({
      accessToken
    });
    const loginMethod = this.deriveLoginMethod(
      data?.platforms,
      data?.platform ?? data.platform ?? null
    );
    return {
      ...data,
      platform: loginMethod,
      loginMethod
    };
  }
  parseCookies(cookieHeader) {
    if (!cookieHeader) {
      return /* @__PURE__ */ new Map();
    }
    const parsed = parseCookieHeader(cookieHeader);
    return new Map(Object.entries(parsed));
  }
  getSessionSecret() {
    const secret = ENV.cookieSecret;
    return new TextEncoder().encode(secret);
  }
  /**
   * Create a session token for a Manus user openId
   * @example
   * const sessionToken = await sdk.createSessionToken(userInfo.openId);
   */
  async createSessionToken(openId, options = {}) {
    return this.signSession(
      {
        openId,
        appId: ENV.appId,
        name: options.name || ""
      },
      options
    );
  }
  async signSession(payload, options = {}) {
    const issuedAt = Date.now();
    const expiresInMs = options.expiresInMs ?? ONE_YEAR_MS;
    const expirationSeconds = Math.floor((issuedAt + expiresInMs) / 1e3);
    const secretKey = this.getSessionSecret();
    return new SignJWT({
      openId: payload.openId,
      appId: payload.appId,
      name: payload.name
    }).setProtectedHeader({ alg: "HS256", typ: "JWT" }).setExpirationTime(expirationSeconds).sign(secretKey);
  }
  async verifySession(cookieValue) {
    if (!cookieValue) {
      console.warn("[Auth] Missing session cookie");
      return null;
    }
    try {
      const secretKey = this.getSessionSecret();
      const { payload } = await jwtVerify(cookieValue, secretKey, {
        algorithms: ["HS256"]
      });
      const { openId, appId, name } = payload;
      if (!isNonEmptyString(openId) || !isNonEmptyString(appId) || !isNonEmptyString(name)) {
        console.warn("[Auth] Session payload missing required fields");
        return null;
      }
      return {
        openId,
        appId,
        name
      };
    } catch (error) {
      console.warn("[Auth] Session verification failed", String(error));
      return null;
    }
  }
  async getUserInfoWithJwt(jwtToken) {
    const payload = {
      jwtToken,
      projectId: ENV.appId
    };
    const { data } = await this.client.post(
      GET_USER_INFO_WITH_JWT_PATH,
      payload
    );
    const loginMethod = this.deriveLoginMethod(
      data?.platforms,
      data?.platform ?? data.platform ?? null
    );
    return {
      ...data,
      platform: loginMethod,
      loginMethod
    };
  }
  async authenticateRequest(req) {
    const cookies = this.parseCookies(req.headers.cookie);
    const sessionCookie = cookies.get(COOKIE_NAME);
    const session = await this.verifySession(sessionCookie);
    if (!session) {
      throw ForbiddenError("Invalid session cookie");
    }
    const sessionUserId = session.openId;
    const signedInAt = /* @__PURE__ */ new Date();
    let user = await getUserByOpenId(sessionUserId);
    if (!user) {
      try {
        const userInfo = await this.getUserInfoWithJwt(sessionCookie ?? "");
        await upsertUser({
          openId: userInfo.openId,
          name: userInfo.name || null,
          email: userInfo.email ?? null,
          loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
          lastSignedIn: signedInAt
        });
        user = await getUserByOpenId(userInfo.openId);
      } catch (error) {
        console.error("[Auth] Failed to sync user from OAuth:", error);
        throw ForbiddenError("Failed to sync user info");
      }
    }
    if (!user) {
      throw ForbiddenError("User not found");
    }
    await upsertUser({
      openId: user.openId,
      lastSignedIn: signedInAt
    });
    return user;
  }
};
var sdk = new SDKServer();

// server/_core/oauth.ts
function getQueryParam(req, key) {
  const value = req.query[key];
  return typeof value === "string" ? value : void 0;
}
function registerOAuthRoutes(app2) {
  app2.get("/api/oauth/callback", async (req, res) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");
    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }
    try {
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
      if (!userInfo.openId) {
        res.status(400).json({ error: "openId missing from user info" });
        return;
      }
      await upsertUser({
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
        lastSignedIn: /* @__PURE__ */ new Date()
      });
      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS
      });
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      res.redirect(302, "/");
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });
}

// server/storage.ts
init_env();
function getForgeConfig() {
  const forgeUrl = ENV.forgeApiUrl;
  const forgeKey = ENV.forgeApiKey;
  if (!forgeUrl || !forgeKey) {
    throw new Error(
      "Storage config missing: set BUILT_IN_FORGE_API_URL and BUILT_IN_FORGE_API_KEY"
    );
  }
  return { forgeUrl: forgeUrl.replace(/\/+$/, ""), forgeKey };
}
function normalizeKey(relKey) {
  return relKey.replace(/^\/+/, "");
}
function appendHashSuffix(relKey) {
  const hash = crypto.randomUUID().replace(/-/g, "").slice(0, 8);
  const lastDot = relKey.lastIndexOf(".");
  if (lastDot === -1) return `${relKey}_${hash}`;
  return `${relKey.slice(0, lastDot)}_${hash}${relKey.slice(lastDot)}`;
}
async function storagePut(relKey, data, contentType = "application/octet-stream") {
  const { forgeUrl, forgeKey } = getForgeConfig();
  const key = appendHashSuffix(normalizeKey(relKey));
  const presignUrl = new URL("v1/storage/presign/put", forgeUrl + "/");
  presignUrl.searchParams.set("path", key);
  const presignResp = await fetch(presignUrl, {
    headers: { Authorization: `Bearer ${forgeKey}` }
  });
  if (!presignResp.ok) {
    const msg = await presignResp.text().catch(() => presignResp.statusText);
    throw new Error(`Storage presign failed (${presignResp.status}): ${msg}`);
  }
  const { url: s3Url } = await presignResp.json();
  if (!s3Url) throw new Error("Forge returned empty presign URL");
  const blob = typeof data === "string" ? new Blob([data], { type: contentType }) : new Blob([data], { type: contentType });
  const uploadResp = await fetch(s3Url, {
    method: "PUT",
    headers: { "Content-Type": contentType },
    body: blob
  });
  if (!uploadResp.ok) {
    throw new Error(`Storage upload to S3 failed (${uploadResp.status})`);
  }
  return { key, url: `/manus-storage/${key}` };
}
async function storageGetSignedUrl(relKey) {
  const { forgeUrl, forgeKey } = getForgeConfig();
  const key = normalizeKey(relKey);
  const getUrl = new URL("v1/storage/presign/get", forgeUrl + "/");
  getUrl.searchParams.set("path", key);
  const resp = await fetch(getUrl, {
    headers: { Authorization: `Bearer ${forgeKey}` }
  });
  if (!resp.ok) {
    const msg = await resp.text().catch(() => resp.statusText);
    throw new Error(`Storage signed URL failed (${resp.status}): ${msg}`);
  }
  const { url } = await resp.json();
  return url;
}
async function ensureStorageBucket() {
}

// server/_core/storageProxy.ts
function registerStorageProxy(app2) {
  const handleStorage = async (req, res) => {
    const key = req.params[0];
    if (!key) return res.status(400).send("Missing storage key");
    try {
      const signedUrl = await storageGetSignedUrl(key);
      res.set("Cache-Control", "no-store");
      res.redirect(307, signedUrl);
    } catch (err) {
      console.error("[StorageProxy] failed:", err);
      res.status(502).send("Storage proxy error");
    }
  };
  app2.get("/storage/*", handleStorage);
  app2.get("/manus-storage/*", handleStorage);
}

// server/_core/systemRouter.ts
import { z } from "zod";

// server/_core/notification.ts
async function notifyOwner(payload) {
  const title = payload.title?.trim();
  const content = payload.content?.trim();
  if (!title || !content) return false;
  console.log(`[Notify] ${title}
${content}`);
  return true;
}

// server/_core/trpc.ts
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
var t = initTRPC.context().create({
  transformer: superjson
});
var router = t.router;
var publicProcedure = t.procedure;
var requireUser = t.middleware(async (opts) => {
  const { ctx, next } = opts;
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user
    }
  });
});
var protectedProcedure = t.procedure.use(requireUser);
var adminProcedure = t.procedure.use(
  t.middleware(async (opts) => {
    const { ctx, next } = opts;
    if (!ctx.user || ctx.user.role !== "admin") {
      throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }
    return next({
      ctx: {
        ...ctx,
        user: ctx.user
      }
    });
  })
);

// server/_core/systemRouter.ts
var systemRouter = router({
  health: publicProcedure.input(
    z.object({
      timestamp: z.number().min(0, "timestamp cannot be negative")
    })
  ).query(() => ({
    ok: true
  })),
  notifyOwner: adminProcedure.input(
    z.object({
      title: z.string().min(1, "title is required"),
      content: z.string().min(1, "content is required")
    })
  ).mutation(async ({ input }) => {
    const delivered = await notifyOwner(input);
    return {
      success: delivered
    };
  })
});

// server/routers.ts
init_schema();
init_db();
import { z as z3 } from "zod";
import { eq as eq3 } from "drizzle-orm";

// server/_core/llm.ts
init_env();
var ensureArray = (value) => Array.isArray(value) ? value : [value];
var normalizeContentPart = (part) => {
  if (typeof part === "string") {
    return { type: "text", text: part };
  }
  if (part.type === "text") {
    return part;
  }
  if (part.type === "image_url") {
    return part;
  }
  if (part.type === "file_url") {
    return part;
  }
  throw new Error("Unsupported message content part");
};
var normalizeMessage = (message) => {
  const { role, name, tool_call_id } = message;
  if (role === "tool" || role === "function") {
    const content = ensureArray(message.content).map((part) => typeof part === "string" ? part : JSON.stringify(part)).join("\n");
    return {
      role,
      name,
      tool_call_id,
      content
    };
  }
  const contentParts = ensureArray(message.content).map(normalizeContentPart);
  if (contentParts.length === 1 && contentParts[0].type === "text") {
    return {
      role,
      name,
      content: contentParts[0].text
    };
  }
  return {
    role,
    name,
    content: contentParts
  };
};
var normalizeToolChoice = (toolChoice, tools) => {
  if (!toolChoice) return void 0;
  if (toolChoice === "none" || toolChoice === "auto") {
    return toolChoice;
  }
  if (toolChoice === "required") {
    if (!tools || tools.length === 0) {
      throw new Error(
        "tool_choice 'required' was provided but no tools were configured"
      );
    }
    if (tools.length > 1) {
      throw new Error(
        "tool_choice 'required' needs a single tool or specify the tool name explicitly"
      );
    }
    return {
      type: "function",
      function: { name: tools[0].function.name }
    };
  }
  if ("name" in toolChoice) {
    return {
      type: "function",
      function: { name: toolChoice.name }
    };
  }
  return toolChoice;
};
var resolveApiUrl = () => ENV.forgeApiUrl && ENV.forgeApiUrl.trim().length > 0 ? `${ENV.forgeApiUrl.replace(/\/$/, "")}/v1/chat/completions` : "https://forge.manus.im/v1/chat/completions";
var assertApiKey = () => {
  if (!ENV.forgeApiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }
};
var normalizeResponseFormat = ({
  responseFormat,
  response_format,
  outputSchema,
  output_schema
}) => {
  const explicitFormat = responseFormat || response_format;
  if (explicitFormat) {
    if (explicitFormat.type === "json_schema" && !explicitFormat.json_schema?.schema) {
      throw new Error(
        "responseFormat json_schema requires a defined schema object"
      );
    }
    return explicitFormat;
  }
  const schema = outputSchema || output_schema;
  if (!schema) return void 0;
  if (!schema.name || !schema.schema) {
    throw new Error("outputSchema requires both name and schema");
  }
  return {
    type: "json_schema",
    json_schema: {
      name: schema.name,
      schema: schema.schema,
      ...typeof schema.strict === "boolean" ? { strict: schema.strict } : {}
    }
  };
};
async function invokeLLM(params) {
  assertApiKey();
  const {
    messages,
    tools,
    toolChoice,
    tool_choice,
    outputSchema,
    output_schema,
    responseFormat,
    response_format
  } = params;
  const payload = {
    model: "gemini-2.5-flash",
    messages: messages.map(normalizeMessage)
  };
  if (tools && tools.length > 0) {
    payload.tools = tools;
  }
  const normalizedToolChoice = normalizeToolChoice(
    toolChoice || tool_choice,
    tools
  );
  if (normalizedToolChoice) {
    payload.tool_choice = normalizedToolChoice;
  }
  payload.max_tokens = 32768;
  payload.thinking = {
    "budget_tokens": 128
  };
  const normalizedResponseFormat = normalizeResponseFormat({
    responseFormat,
    response_format,
    outputSchema,
    output_schema
  });
  if (normalizedResponseFormat) {
    payload.response_format = normalizedResponseFormat;
  }
  const response = await fetch(resolveApiUrl(), {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${ENV.forgeApiKey}`
    },
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `LLM invoke failed: ${response.status} ${response.statusText} \u2013 ${errorText}`
    );
  }
  return await response.json();
}

// server/_core/imageGeneration.ts
init_env();
async function probeImageStack() {
  return { ok: true };
}
async function generateImage(options) {
  if (!ENV.forgeApiUrl) {
    throw new Error("BUILT_IN_FORGE_API_URL is not configured");
  }
  if (!ENV.forgeApiKey) {
    throw new Error("BUILT_IN_FORGE_API_KEY is not configured");
  }
  const baseUrl = ENV.forgeApiUrl.endsWith("/") ? ENV.forgeApiUrl : `${ENV.forgeApiUrl}/`;
  const fullUrl = new URL(
    "images.v1.ImageService/GenerateImage",
    baseUrl
  ).toString();
  const response = await fetch(fullUrl, {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "connect-protocol-version": "1",
      authorization: `Bearer ${ENV.forgeApiKey}`
    },
    body: JSON.stringify({
      prompt: options.prompt,
      original_images: options.originalImages || []
    })
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(
      `Image generation request failed (${response.status} ${response.statusText})${detail ? `: ${detail}` : ""}`
    );
  }
  const result = await response.json();
  const base64Data = result.image.b64Json;
  const buffer = Buffer.from(base64Data, "base64");
  const { url } = await storagePut(
    `generated/${Date.now()}.png`,
    buffer,
    result.image.mimeType
  );
  return {
    url
  };
}

// server/instagram.ts
init_db();
async function processScheduledPosts() {
  const scheduledPosts = await getPostsByStatus("scheduled");
  const now = /* @__PURE__ */ new Date();
  let processed = 0;
  let promoted = 0;
  const errors = [];
  for (const post of scheduledPosts) {
    if (post.scheduledAt && new Date(post.scheduledAt) <= now) {
      processed++;
      try {
        await updatePost(post.id, { status: "approved", mcpPending: 0 });
        promoted++;
        console.log(`[Instagram] Post ${post.id} movido para fila de publica\xE7\xE3o.`);
      } catch (err) {
        errors.push(`Post ${post.id}: ${err.message}`);
      }
    }
  }
  return { processed, promoted, errors };
}
async function fetchPostInsights(_instagramPostId) {
  console.warn("[Instagram] fetchPostInsights deve ser chamado pelo agente Manus, n\xE3o pelo servidor.");
  return {};
}

// server/routers/research.ts
init_db();
init_schema();
import { z as z2 } from "zod";
import { eq as eq2, desc as desc2 } from "drizzle-orm";
var NEWS_API_KEY = process.env.NEWS_API_KEY ?? "";
var APP_CONTEXT = `A Triarc Solutions \xE9 uma empresa de tecnologia e inova\xE7\xE3o com sede em Maca\xE9/RJ. Pilares: Gest\xE3o, Treinamento e Tecnologia. Servi\xE7os: IA e automa\xE7\xE3o, desenvolvimento de software, data science. Site: triarcsolutions.com.br.`;
var TRIARC_TONE = `Tom corporativo profissional, moderno e acess\xEDvel. Posicione a Triarc Solutions como refer\xEAncia em tecnologia. Inclua CTA para triarcsolutions.com.br e hashtags do nicho tech/IA.`;
async function fetchNews(query, language) {
  const yesterday = new Date(Date.now() - 864e5).toISOString().split("T")[0];
  const lang = language === "pt" ? "pt" : "en";
  const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&from=${yesterday}&language=${lang}&pageSize=5&sortBy=publishedAt&apiKey=${NEWS_API_KEY}`;
  const res = await fetch(url, { headers: { "User-Agent": "TriarcSocialManager/1.0" } });
  const data = await res.json();
  if (data.status !== "ok" || !data.articles?.length) return [];
  return data.articles.slice(0, 5).map((a) => ({ title: a.title, description: a.description ?? "", url: a.url }));
}
async function generateCaption(topicName, articles) {
  const headlines = articles.map((a, i) => `${i + 1}. ${a.title}: ${a.description}`).join("\n");
  const response = await invokeLLM({
    messages: [
      { role: "system", content: `${APP_CONTEXT}
${TRIARC_TONE}
Voc\xEA \xE9 especialista em marketing digital para Instagram.` },
      {
        role: "user",
        content: `Crie uma legenda impactante para o Instagram da @triarcsolutions sobre o tema: "${topicName}".
Baseie-se nestas not\xEDcias das \xFAltimas 24 horas:
${headlines}

Requisitos:
- Conecte as novidades ao posicionamento da Triarc Solutions
- Tom profissional e inspirador
- M\xE1ximo 2200 caracteres
- Inclua emojis estrat\xE9gicos
- Termine com CTA para triarcsolutions.com.br
- Inclua 5-10 hashtags relevantes`
      }
    ]
  });
  const content = response.choices?.[0]?.message?.content;
  return typeof content === "string" ? content : "";
}
async function generateArtForResearch(topicName, headlines) {
  const topHeadline = headlines[0] ?? topicName;
  const prompt = `Premium Instagram post for Triarc Solutions tech company. Topic: "${topicName}". Headline: "${topHeadline}". Style: ultra-modern tech aesthetic, deep navy blue (#0A1628) background with electric cyan (#00BFFF) and neon purple (#7B2FBE) accents. Futuristic data visualization elements, glowing circuit patterns, holographic overlays. Bold typography with the topic name prominently displayed. Place the Triarc Solutions logo (circular tech emblem with gears and code symbols, navy blue, gray and green) prominently in the bottom-right corner. Professional social media design, 1080x1080 square format, magazine quality.`;
  const { url } = await generateImage({
    prompt,
    originalImages: [{ url: "https://tsm.triarcsolutions.com.br/manus-storage/triarc-logo_4d0b8405.jpeg", mimeType: "image/jpeg" }]
  });
  if (!url) throw new Error("Falha ao gerar imagem");
  return url;
}
var researchRouter = router({
  // Listar tópicos
  listTopics: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    return db.select().from(researchTopics).orderBy(researchTopics.sortOrder, researchTopics.createdAt);
  }),
  // Criar tópico
  createTopic: protectedProcedure.input(z2.object({
    accountId: z2.number(),
    name: z2.string().min(1).max(256),
    query: z2.string().min(1).max(512),
    language: z2.enum(["pt", "en"]).default("pt"),
    publishHour: z2.number().min(0).max(23).default(8)
  })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("DB unavailable");
    const [result] = await db.insert(researchTopics).values({
      accountId: input.accountId,
      name: input.name,
      query: input.query,
      language: input.language,
      publishHour: input.publishHour,
      active: 1
    });
    return { id: result.insertId };
  }),
  // Atualizar tópico (ativar/desativar, editar)
  updateTopic: protectedProcedure.input(z2.object({
    id: z2.number(),
    name: z2.string().min(1).max(256).optional(),
    query: z2.string().min(1).max(512).optional(),
    language: z2.enum(["pt", "en"]).optional(),
    active: z2.number().min(0).max(1).optional(),
    autoPublish: z2.number().min(0).max(1).optional()
  })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("DB unavailable");
    const { id, ...values } = input;
    await db.update(researchTopics).set(values).where(eq2(researchTopics.id, id));
    return { success: true };
  }),
  // Deletar tópico
  deleteTopic: protectedProcedure.input(z2.object({ id: z2.number() })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("DB unavailable");
    await db.delete(researchTopics).where(eq2(researchTopics.id, input.id));
    return { success: true };
  }),
  // Histórico de execuções
  listRuns: protectedProcedure.input(z2.object({
    topicId: z2.number().optional(),
    limit: z2.number().default(20)
  })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return [];
    const q = db.select().from(researchRuns).orderBy(desc2(researchRuns.ranAt)).limit(input.limit);
    if (input.topicId) {
      return db.select().from(researchRuns).where(eq2(researchRuns.topicId, input.topicId)).orderBy(desc2(researchRuns.ranAt)).limit(input.limit);
    }
    return q;
  }),
  // Executar pesquisa manualmente para um tópico
  runNow: protectedProcedure.input(z2.object({ topicId: z2.number() })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new Error("DB unavailable");
    const [topic] = await db.select().from(researchTopics).where(eq2(researchTopics.id, input.topicId)).limit(1);
    if (!topic) throw new Error("T\xF3pico n\xE3o encontrado");
    try {
      const articles = await fetchNews(topic.query, topic.language);
      if (!articles.length) {
        await db.insert(researchRuns).values({ topicId: topic.id, status: "skipped", error: "Nenhuma not\xEDcia encontrada" });
        return { success: false, message: "Nenhuma not\xEDcia encontrada para este t\xF3pico" };
      }
      const caption = await generateCaption(topic.name, articles);
      const imageUrl = await generateArtForResearch(topic.name, articles.map((a) => a.title));
      const userId = ctx.user.id;
      const postStatus = topic.autoPublish === 1 ? "approved" : "pending";
      const [postResult] = await db.insert(posts).values({
        userId,
        accountId: topic.accountId,
        caption,
        theme: `Pesquisa Di\xE1ria: ${topic.name}`,
        status: postStatus,
        mcpPending: 0
      });
      const postId = postResult.insertId;
      await db.insert(postMedia).values({
        postId,
        mediaUrl: imageUrl,
        mediaType: "image",
        sortOrder: 0
      });
      await db.insert(researchRuns).values({
        topicId: topic.id,
        postId,
        headlines: JSON.stringify(articles.map((a) => a.title)),
        status: "success"
      });
      return { success: true, postId, autoPublished: postStatus === "approved", message: `Post criado com sucesso! ID: ${postId}` };
    } catch (err) {
      await db.insert(researchRuns).values({
        topicId: topic.id,
        status: "failed",
        error: err?.message ?? "Erro desconhecido"
      });
      throw err;
    }
  }),
  // Executar todos os tópicos ativos (usado pelo cron)
  runAll: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("DB unavailable");
    const activeTopics = await db.select().from(researchTopics).where(eq2(researchTopics.active, 1));
    const results = [];
    for (const topic of activeTopics) {
      try {
        const articles = await fetchNews(topic.query, topic.language);
        if (!articles.length) {
          await db.insert(researchRuns).values({ topicId: topic.id, status: "skipped", error: "Sem not\xEDcias" });
          results.push({ topicId: topic.id, name: topic.name, success: false, error: "Sem not\xEDcias" });
          continue;
        }
        const caption = await generateCaption(topic.name, articles);
        const imageUrl = await generateArtForResearch(topic.name, articles.map((a) => a.title));
        const runAllStatus = topic.autoPublish === 1 ? "approved" : "pending";
        const [postResult] = await db.insert(posts).values({
          userId: ctx.user.id,
          accountId: topic.accountId,
          caption,
          theme: `Pesquisa Di\xE1ria: ${topic.name}`,
          status: runAllStatus,
          mcpPending: 0
        });
        const postId = postResult.insertId;
        await db.insert(postMedia).values({ postId, mediaUrl: imageUrl, mediaType: "image", sortOrder: 0 });
        await db.insert(researchRuns).values({
          topicId: topic.id,
          postId,
          headlines: JSON.stringify(articles.map((a) => a.title)),
          status: "success"
        });
        results.push({ topicId: topic.id, name: topic.name, success: true, postId });
      } catch (err) {
        await db.insert(researchRuns).values({ topicId: topic.id, status: "failed", error: err?.message });
        results.push({ topicId: topic.id, name: topic.name, success: false, error: err?.message });
      }
    }
    return { results, total: activeTopics.length, succeeded: results.filter((r) => r.success).length };
  })
});

// server/seed-triarc.ts
init_db();
init_schema();
var TRIARC_SERVICES = [
  {
    type: "servico",
    name: "Gest\xE3o Empresarial",
    subtitle: "Consultoria em Gest\xE3o",
    description: "Consultoria em gest\xE3o empresarial para otimiza\xE7\xE3o de processos e estrat\xE9gias. An\xE1lise de processos, planejamento estrat\xE9gico, otimiza\xE7\xE3o de opera\xE7\xF5es, gest\xE3o de projetos, compliance e negocia\xE7\xE3o estrat\xE9gica.",
    category: "Gest\xE3o",
    technologies: JSON.stringify(["Gest\xE3o de Projetos", "MS Project", "Compliance", "Planejamento Estrat\xE9gico"]),
    highlights: JSON.stringify(["Planejamento estrat\xE9gico", "Otimiza\xE7\xE3o de opera\xE7\xF5es", "Gest\xE3o de fornecedores", "Auditoria de contratos"]),
    status: "ativo"
  },
  {
    type: "servico",
    name: "Suporte T\xE9cnico em TI",
    subtitle: "Manuten\xE7\xE3o e Infraestrutura",
    description: "Suporte t\xE9cnico, manuten\xE7\xE3o preditiva e servi\xE7os especializados em tecnologia da informa\xE7\xE3o. Monitoramento de infraestrutura, gest\xE3o de problemas, suporte remoto e presencial.",
    category: "TI",
    technologies: JSON.stringify(["Manuten\xE7\xE3o Preditiva", "Monitoramento", "Suporte Remoto", "An\xE1lise de Performance"]),
    highlights: JSON.stringify(["Manuten\xE7\xE3o preditiva", "Suporte 24/7", "Monitoramento cont\xEDnuo", "An\xE1lise de falhas"]),
    status: "ativo"
  },
  {
    type: "servico",
    name: "Desenvolvimento Sob Encomenda",
    subtitle: "Software Personalizado",
    description: "Desenvolvimento de sistemas web, aplica\xE7\xF5es mobile e sistemas de gest\xE3o personalizados. Cria\xE7\xE3o de IAs, agentes especialistas e automa\xE7\xF5es sob medida para sua empresa.",
    category: "Desenvolvimento",
    technologies: JSON.stringify(["React", "TypeScript", "Node.js", "PostgreSQL", "IA/ML", "Mobile"]),
    highlights: JSON.stringify(["Sistemas web personalizados", "Apps mobile", "Cria\xE7\xE3o de IAs", "Agentes especialistas"]),
    status: "ativo"
  },
  {
    type: "servico",
    name: "Intelig\xEAncia Artificial e Automa\xE7\xE3o",
    subtitle: "IA Aplicada ao Neg\xF3cio",
    description: "Solu\xE7\xF5es avan\xE7adas em IA, automa\xE7\xE3o e agentes especialistas. Machine Learning aplicado, processamento de linguagem natural, sistemas de recomenda\xE7\xE3o e automa\xE7\xE3o de fluxos de trabalho.",
    category: "IA & Automa\xE7\xE3o",
    technologies: JSON.stringify(["OpenAI API", "Machine Learning", "NLP", "Automa\xE7\xE3o", "Agentes IA"]),
    highlights: JSON.stringify(["IAs personalizadas", "Agentes especialistas", "Automa\xE7\xE3o de fluxos", "ML aplicado"]),
    status: "ativo"
  },
  {
    type: "servico",
    name: "Automa\xE7\xE3o Industrial",
    subtitle: "Processos Industriais Inteligentes",
    description: "Solu\xE7\xF5es de automa\xE7\xE3o para processos industriais e operacionais. Sistemas SCADA, integra\xE7\xE3o de equipamentos, monitoramento industrial e otimiza\xE7\xE3o de produ\xE7\xE3o.",
    category: "Industrial",
    technologies: JSON.stringify(["SCADA", "Automa\xE7\xE3o Industrial", "Controle de Processos", "IoT", "N8N"]),
    highlights: JSON.stringify(["Automa\xE7\xE3o de processos", "Sistemas SCADA", "Integra\xE7\xE3o de equipamentos", "Otimiza\xE7\xE3o de produ\xE7\xE3o"]),
    status: "ativo"
  },
  {
    type: "servico",
    name: "Treinamento Profissional",
    subtitle: "Capacita\xE7\xE3o e Desenvolvimento",
    description: "Treinamento em desenvolvimento profissional e gerencial. Capacita\xE7\xE3o t\xE9cnica, workshops especializados, programas de mentoria e desenvolvimento de lideran\xE7as.",
    category: "Treinamento",
    technologies: JSON.stringify(["E-learning", "Workshops", "Mentoria", "Capacita\xE7\xE3o T\xE9cnica"]),
    highlights: JSON.stringify(["Capacita\xE7\xE3o t\xE9cnica", "Desenvolvimento gerencial", "Workshops especializados", "Programas de mentoria"]),
    status: "ativo"
  },
  {
    type: "servico",
    name: "Licenciamento de Software",
    subtitle: "Software Propriet\xE1rio",
    description: "Desenvolvimento e licenciamento de programas de computador. Software propriet\xE1rio, distribui\xE7\xE3o, atualiza\xE7\xF5es, suporte t\xE9cnico especializado e auditoria de licen\xE7as.",
    category: "Software",
    technologies: JSON.stringify(["Software Propriet\xE1rio", "SaaS", "Licenciamento", "Distribui\xE7\xE3o"]),
    highlights: JSON.stringify(["Software propriet\xE1rio", "Receita recorrente", "Suporte especializado", "Auditoria de licen\xE7as"]),
    status: "ativo"
  },
  {
    type: "servico",
    name: "Data Science e Analytics",
    subtitle: "Intelig\xEAncia de Dados",
    description: "An\xE1lise de dados, Business Intelligence e visualiza\xE7\xF5es estrat\xE9gicas. Dashboards interativos, relat\xF3rios automatizados e insights acion\xE1veis para tomada de decis\xE3o.",
    category: "Dados",
    technologies: JSON.stringify(["Python", "Power BI", "SQL", "Machine Learning", "Visualiza\xE7\xE3o de Dados"]),
    highlights: JSON.stringify(["Dashboards interativos", "Relat\xF3rios automatizados", "Insights acion\xE1veis", "BI estrat\xE9gico"]),
    status: "ativo"
  }
];
var TRIARC_PROJECTS = [
  { name: "Sistema de Presen\xE7a de Eventos", subtitle: "Controle de Presen\xE7as em Eventos", description: "Plataforma para gest\xE3o e controle de presen\xE7a em eventos. Interface r\xE1pida e intuitiva para gerenciamento e acompanhamento de participantes com dashboard de m\xE9tricas.", category: "Plataformas", technologies: JSON.stringify(["React", "TypeScript", "Vite", "shadcn-ui", "Tailwind CSS"]), highlights: JSON.stringify(["Gest\xE3o \xE1gil de eventos", "Controle pr\xE1tico de presen\xE7a", "Design moderno e intuitivo", "Alta performance"]), status: "ativo" },
  { name: "Conex\xE3o Pessoas (COPE)", subtitle: "Plataforma de Conex\xE3o de Profissionais", description: "Plataforma inovadora de troca de habilidades entre profissionais. Sistema completo com gest\xE3o de usu\xE1rios, trades, assinaturas premium e monitoramento de receitas em tempo real. 1000+ usu\xE1rios, 5000+ trades.", category: "Plataformas", technologies: JSON.stringify(["React", "TypeScript", "Node.js", "PostgreSQL", "Supabase"]), highlights: JSON.stringify(["Plataforma SaaS completa", "Receita recorrente mensal", "Sistema de matching inteligente", "API RESTful documentada"]), status: "ativo" },
  { name: "SS-Milhas", subtitle: "Smart Management System de Milhas", description: "Sistema inteligente de gest\xE3o de milhas e pontos a\xE9reos. Gerenciamento de programas de fidelidade, rastreamento de milhas acumuladas e otimiza\xE7\xE3o de resgates. 500+ usu\xE1rios, 1M+ milhas gerenciadas.", category: "Plataformas", technologies: JSON.stringify(["React", "TypeScript", "Node.js", "MongoDB", "Real-time Sync"]), highlights: JSON.stringify(["Gest\xE3o inteligente de milhas", "Interface moderna", "Integra\xE7\xE3o com APIs de fidelidade", "Otimiza\xE7\xE3o autom\xE1tica"]), status: "ativo" },
  { name: "TopFlow.ai", subtitle: "Invisible SEO - Alavanque seu site", description: "Plataforma completa de SEO invis\xEDvel e automa\xE7\xE3o de marketing digital com IA. Otimiza\xE7\xE3o de sites, gera\xE7\xE3o de conte\xFAdo, gest\xE3o de campanhas em redes sociais e integra\xE7\xE3o com Instagram e Facebook Ads. 50+ sites, 1000+ otimiza\xE7\xF5es.", category: "IA & Automa\xE7\xE3o", technologies: JSON.stringify(["React 18", "TypeScript", "Supabase", "OpenAI API", "AI/ML"]), highlights: JSON.stringify(["SEO invis\xEDvel e automatizado", "IA de \xFAltima gera\xE7\xE3o", "Integra\xE7\xE3o com redes sociais", "Resultados mensur\xE1veis"]), status: "ativo" },
  { name: "CB Integrativa", subtitle: "Assistente Virtual de Sa\xFAde Integrativa", description: "Sistema completo de cuidado integrativo com bot inteligente para sa\xFAde. Gest\xE3o de cuidados integrativos, agendamento e acompanhamento com assistente virtual especializado em medicina integrativa e hol\xEDstica.", category: "Sa\xFAde", technologies: JSON.stringify(["React", "TypeScript", "Node.js", "OpenAI API", "PostgreSQL"]), highlights: JSON.stringify(["IA especializada em sa\xFAde", "Cuidado hol\xEDstico completo", "Telemedicina integrada", "Conformidade com LGPD"]), status: "ativo" },
  { name: "Grupo Conecta", subtitle: "Sistema de Ponto e Comunica\xE7\xE3o Empresarial", description: "Sistema completo de controle de ponto com geolocaliza\xE7\xE3o e comunica\xE7\xE3o empresarial. Agente de voz IA com ElevenLabs, mensageria em tempo real, gest\xE3o de funcion\xE1rios e app mobile nativo para Android e iOS.", category: "Gest\xE3o", technologies: JSON.stringify(["React 19", "TypeScript", "Supabase", "Capacitor", "ElevenLabs AI", "N8N"]), highlights: JSON.stringify(["Ponto digital com geolocaliza\xE7\xE3o", "Agente de voz IA", "App mobile nativo", "Automa\xE7\xE3o com N8N"]), status: "ativo" },
  { name: "Legend\xE1rios Maca\xE9", subtitle: "Plataforma Oficial do Movimento", description: "Plataforma web oficial para o movimento Legend\xE1rios Maca\xE9. Integra\xE7\xF5es autom\xE1ticas com portais Legend\xE1rios Global e Rio, sincroniza\xE7\xE3o em tempo real e timeline interativa. 1000+ visitantes, 50+ eventos.", category: "Plataformas", technologies: JSON.stringify(["React", "TypeScript", "Vite", "WordPress REST API", "React Query"]), highlights: JSON.stringify(["Plataforma oficial do movimento", "Integra\xE7\xF5es autom\xE1ticas", "Sincroniza\xE7\xE3o em tempo real", "Design responsivo"]), status: "ativo" },
  { name: "Sentinela", subtitle: "Plataforma de Conex\xE3o e Comunica\xE7\xE3o", description: "Plataforma de comunica\xE7\xE3o e conex\xE3o para o movimento Legend\xE1rios. Conecta membros, facilita comunica\xE7\xE3o, compartilha eventos e fortalece a comunidade com interface moderna.", category: "Plataformas", technologies: JSON.stringify(["React", "TypeScript", "Node.js", "PostgreSQL", "WebSocket"]), highlights: JSON.stringify(["Comunica\xE7\xE3o em tempo real", "Conex\xE3o comunit\xE1ria", "Interface moderna", "Fortalecimento da comunidade"]), status: "ativo" },
  { name: "TransCarga", subtitle: "Logistics Hub - Plataforma de Log\xEDstica", description: "Plataforma completa de log\xEDstica que conecta empresas e caminhoneiros. Rastreamento GPS em tempo real, geofencing, negocia\xE7\xF5es inteligentes, verifica\xE7\xE3o de documentos e assistente IA.", category: "Plataformas", technologies: JSON.stringify(["React 18", "TypeScript", "Supabase", "Leaflet Maps", "AI/ML"]), highlights: JSON.stringify(["Rastreamento em tempo real", "IA integrada", "Geofencing inteligente", "Plataforma completa"]), status: "ativo" },
  { name: "Logos", subtitle: "Reuni\xF5es gravadas, transcritas e resumidas", description: "Plataforma para gravar reuni\xF5es, gerar transcri\xE7\xE3o autom\xE1tica e produzir resumos acion\xE1veis. Centraliza o hist\xF3rico de encontros e facilita a busca no que foi dito.", category: "IA & Automa\xE7\xE3o", technologies: JSON.stringify(["React", "TypeScript", "Vite", "IA", "Speech-to-Text"]), highlights: JSON.stringify(["Gravar e transcrever", "Resumos com IA", "Busca nas reuni\xF5es", "Pronto para uso"]), status: "ativo" },
  { name: "Farol das Escrituras", subtitle: "Estudo e leitura das Escrituras", description: "Plataforma para aprofundamento b\xEDblico, leitura guiada e recursos que apoiam o estudo das Escrituras de forma clara e acess\xEDvel. Anota\xE7\xF5es, favoritos e busca de refer\xEAncias.", category: "Plataformas", technologies: JSON.stringify(["React", "TypeScript", "Vite", "Tailwind CSS"]), highlights: JSON.stringify(["Estudo b\xEDblico", "UX limpa", "Multi-dispositivo", "Pronto para uso"]), status: "ativo" },
  { name: "Mir Maca\xE9", subtitle: "An\xE1lise e captura de dados da congrega\xE7\xE3o", description: "Plataforma da congrega\xE7\xE3o Mir Maca\xE9 para reunir, validar e visualizar dados operacionais e pastorais. Automatiza coleta de dados, reduz trabalho manual e oferece pain\xE9is claros.", category: "Gest\xE3o", technologies: JSON.stringify(["React", "TypeScript", "Vite", "TanStack Query", "API REST", "Automa\xE7\xE3o"]), highlights: JSON.stringify(["Dados da Mir Maca\xE9", "Captura automatizada", "An\xE1lise e pain\xE9is", "Menos planilha manual"]), status: "ativo" },
  { name: "Triarc Key Generator", subtitle: "Gera\xE7\xE3o segura de chaves criptogr\xE1ficas", description: "Ferramenta para gera\xE7\xE3o, valida\xE7\xE3o e gest\xE3o de chaves criptogr\xE1ficas e secrets no ecossistema TRIARC, com boas pr\xE1ticas de seguran\xE7a.", category: "Sistemas", technologies: JSON.stringify(["TypeScript", "Node.js", "Web Crypto API", "CLI"]), highlights: JSON.stringify(["Seguran\xE7a first", "Developer experience", "Chaves e secrets", "TRIARC tooling"]), status: "ativo" },
  { name: "Axis", subtitle: "Dashboards interativos e configur\xE1veis", description: "Plataforma para montar dashboards totalmente interativos e sob medida. Arraste widgets, ligue fontes de dados, defina filtros e compartilhe vis\xF5es claras com a equipe.", category: "Gest\xE3o", technologies: JSON.stringify(["React", "TypeScript", "Vite", "TanStack Query", "Visualiza\xE7\xE3o de dados"]), highlights: JSON.stringify(["100% configur\xE1vel", "Altamente interativo", "Dados conectados", "Pronto para uso"]), status: "ativo" },
  { name: "Sintaxe", subtitle: "Programa\xE7\xE3o para crian\xE7as e adolescentes", description: "Plataforma de aprendizagem de programa\xE7\xE3o para o p\xFAblico jovem. Linguagem clara, passos curtos e desafios gamificados que ensinam l\xF3gica, sintaxe e resolu\xE7\xE3o de problemas.", category: "Plataformas", technologies: JSON.stringify(["React", "TypeScript", "Vite", "Gamifica\xE7\xE3o"]), highlights: JSON.stringify(["Ensino de programa\xE7\xE3o", "Gamificado", "Para jovens", "Aprendizado pr\xE1tico"]), status: "ativo" },
  { name: "NutriSystem", subtitle: "Sistema Completo de Gest\xE3o Nutricional", description: "Plataforma completa para gest\xE3o nutricional e acompanhamento de pacientes. Planos alimentares, c\xE1lculo autom\xE1tico de macronutrientes, acompanhamento de evolu\xE7\xE3o e relat\xF3rios.", category: "Sa\xFAde", technologies: JSON.stringify(["React", "TypeScript", "Node.js", "PostgreSQL", "Supabase"]), highlights: JSON.stringify(["Sistema completo de nutri\xE7\xE3o", "Interface moderna", "Gest\xE3o profissional", "Tecnologia de ponta"]), status: "em_desenvolvimento" },
  { name: "TRIARC CRM", subtitle: "Sistema de Gest\xE3o de Relacionamento com Cliente", description: "CRM completo com IA integrada, pipeline de vendas drag-and-drop, gera\xE7\xE3o de faturas, relat\xF3rios inteligentes e integra\xE7\xE3o com TopFlow AI. Dashboard anal\xEDtico completo.", category: "Gest\xE3o", technologies: JSON.stringify(["React 18", "TypeScript", "Supabase", "AI/ML", "DnD Kit", "PWA"]), highlights: JSON.stringify(["CRM completo", "IA para insights", "Pipeline de vendas inteligente", "Integra\xE7\xE3o com TopFlow AI"]), status: "em_desenvolvimento" },
  { name: "SS Finan\xE7as", subtitle: "Sistema de Gest\xE3o Financeira Pessoal", description: "Plataforma completa para gest\xE3o financeira pessoal com controle de receitas, despesas, investimentos e metas. Categoriza\xE7\xE3o autom\xE1tica por IA e dashboard visual interativo.", category: "Gest\xE3o", technologies: JSON.stringify(["React", "TypeScript", "Supabase", "AI/ML", "Chart.js"]), highlights: JSON.stringify(["Gest\xE3o financeira completa", "IA para categoriza\xE7\xE3o", "Dashboard visual", "Metas e investimentos"]), status: "em_desenvolvimento" },
  { name: "Jarvis", subtitle: "Assistente de IA em evolu\xE7\xE3o", description: "Assistente inteligente conversacional em evolu\xE7\xE3o cont\xEDnua, com foco em automa\xE7\xE3o de tarefas, respostas contextuais e extensibilidade via plugins.", category: "IA & Automa\xE7\xE3o", technologies: JSON.stringify(["React", "TypeScript", "Node.js", "OpenAI API", "AI/ML"]), highlights: JSON.stringify(["IA conversacional", "Arquitetura evolutiva", "Automa\xE7\xE3o", "Open source"]), status: "em_desenvolvimento" },
  { name: "KryptoStudio", subtitle: "Do conte\xFAdo a slides, infogr\xE1ficos e v\xEDdeo", description: "Plataforma estilo Notebook LM: adicione documentos e PDFs como fonte \xFAnica de verdade e a IA gera apresenta\xE7\xF5es, infogr\xE1ficos e v\xEDdeos. Ideal para estudar, ensinar ou comunicar.", category: "IA & Automa\xE7\xE3o", technologies: JSON.stringify(["React", "TypeScript", "IA generativa", "Busca sem\xE2ntica", "Multim\xEDdia"]), highlights: JSON.stringify(["Inspirado no Notebook LM", "Slides e infogr\xE1ficos", "V\xEDdeo a partir do conte\xFAdo", "IA nas suas fontes"]), status: "em_desenvolvimento" },
  { name: "Era das Alian\xE7as", subtitle: "Jogo de estrat\xE9gia e alian\xE7as", description: "Jogo digital onde jogadores negociam alian\xE7as, expandem influ\xEAncia e disputam objetivos em cen\xE1rios por eras. Combina decis\xF5es estrat\xE9gicas, diplomacia entre fac\xE7\xF5es e progress\xE3o cont\xEDnua.", category: "Plataformas", technologies: JSON.stringify(["React", "TypeScript", "Vite", "Supabase", "Tailwind CSS"]), highlights: JSON.stringify(["Estrat\xE9gia e diplomacia", "Alian\xE7as din\xE2micas", "Progress\xE3o por eras", "Multijogador"]), status: "em_desenvolvimento" },
  { name: "KidShield", subtitle: "Family Guardian Suite", description: "Suite voltada \xE0 prote\xE7\xE3o digital familiar: controles parentais, alertas e ferramentas para acompanhar o uso seguro de dispositivos e conte\xFAdos. Privacidade e LGPD em foco.", category: "Sa\xFAde", technologies: JSON.stringify(["React", "TypeScript", "Node.js", "PostgreSQL"]), highlights: JSON.stringify(["Fam\xEDlia em primeiro lugar", "Seguran\xE7a digital", "Controles parentais", "Privacidade"]), status: "em_desenvolvimento" },
  { name: "Rede Si\xE3o", subtitle: "A rede social dos evang\xE9licos", description: "Rede social pensada para o p\xFAblico evang\xE9lico: feed, perfis, grupos e conversas em um ambiente alinhado \xE0 f\xE9, fam\xEDlia e comunidade crist\xE3. Compartilhe vida, eventos, louvor e mensagem.", category: "Plataformas", technologies: JSON.stringify(["React", "TypeScript", "Vite", "Supabase", "Tailwind CSS"]), highlights: JSON.stringify(["Rede social crist\xE3", "Como o Facebook com prop\xF3sito", "Grupos e igrejas", "Comunidade evang\xE9lica"]), status: "em_desenvolvimento" },
  { name: "Pratiko", subtitle: "Praticidade no dia a dia", description: "Sistema para simplificar rotinas operacionais e tarefas recorrentes, com foco em produtividade e clareza de processos. Checklists, lembretes e relat\xF3rios simples.", category: "Gest\xE3o", technologies: JSON.stringify(["React", "TypeScript", "Vite", "Supabase", "shadcn-ui"]), highlights: JSON.stringify(["Produtividade", "Processos claros", "Baixa fric\xE7\xE3o", "Gest\xE3o leve"]), status: "em_desenvolvimento" },
  { name: "Titan App", subtitle: "PWA de Escalada", description: "Aplicativo PWA de escalada desenvolvido pela Triarc Solutions. Registro de vias, modo offline, comunidade de escaladores, dicas de seguran\xE7a e tracking de progresso. Slogan: Iron Grip. Endless Ascend.", category: "Plataformas", technologies: JSON.stringify(["React", "TypeScript", "PWA", "Supabase", "Offline First"]), highlights: JSON.stringify(["Modo offline", "Comunidade de escaladores", "Tracking de progresso", "PWA nativo"]), status: "ativo" },
  { name: "Triarc Social Manager", subtitle: "Automa\xE7\xE3o de Conte\xFAdo para Instagram", description: "Plataforma interna de automa\xE7\xE3o de conte\xFAdo para Instagram da Triarc Solutions. Gera\xE7\xE3o de legendas e artes com IA, agendamento, aprova\xE7\xE3o e publica\xE7\xE3o autom\xE1tica.", category: "IA & Automa\xE7\xE3o", technologies: JSON.stringify(["React", "TypeScript", "Node.js", "OpenAI API", "tRPC", "MySQL"]), highlights: JSON.stringify(["IA para legendas e artes", "Agendamento autom\xE1tico", "Fluxo de aprova\xE7\xE3o", "Publica\xE7\xE3o via MCP"]), status: "ativo" },
  { name: "Plataforma de Eventos Legend\xE1rios", subtitle: "Gest\xE3o de Eventos Crist\xE3os", description: "Plataforma completa para gest\xE3o de eventos do movimento Legend\xE1rios. Inscri\xE7\xF5es, controle de presen\xE7a, comunica\xE7\xE3o com participantes e relat\xF3rios de eventos.", category: "Plataformas", technologies: JSON.stringify(["React", "TypeScript", "Node.js", "PostgreSQL"]), highlights: JSON.stringify(["Gest\xE3o completa de eventos", "Controle de presen\xE7a", "Comunica\xE7\xE3o integrada", "Relat\xF3rios detalhados"]), status: "ativo" },
  { name: "Sistema de Auditoria Empresarial", subtitle: "Conformidade e Compliance", description: "Sistema para auditoria interna e conformidade empresarial. Checklists de auditoria, rastreamento de n\xE3o conformidades, planos de a\xE7\xE3o corretiva e relat\xF3rios executivos.", category: "Gest\xE3o", technologies: JSON.stringify(["React", "TypeScript", "Node.js", "PostgreSQL", "PDF Generation"]), highlights: JSON.stringify(["Auditoria interna completa", "Rastreamento de conformidade", "Planos de a\xE7\xE3o", "Relat\xF3rios executivos"]), status: "ativo" },
  { name: "Portal RH Inteligente", subtitle: "Gest\xE3o de Pessoas com IA", description: "Portal de RH com IA integrada para gest\xE3o de colaboradores. Onboarding digital, avalia\xE7\xE3o de desempenho, gest\xE3o de f\xE9rias e banco de horas, tudo automatizado.", category: "Gest\xE3o", technologies: JSON.stringify(["React", "TypeScript", "Supabase", "OpenAI API", "N8N"]), highlights: JSON.stringify(["Onboarding digital", "IA para avalia\xE7\xF5es", "Banco de horas autom\xE1tico", "Gest\xE3o completa de pessoas"]), status: "em_desenvolvimento" },
  { name: "EduTech Triarc", subtitle: "Plataforma de E-learning Corporativo", description: "Plataforma de ensino a dist\xE2ncia para treinamentos corporativos. Cursos em v\xEDdeo, quizzes, certificados digitais, trilhas de aprendizagem e gamifica\xE7\xE3o.", category: "Treinamento", technologies: JSON.stringify(["React", "TypeScript", "Node.js", "PostgreSQL", "Video Streaming"]), highlights: JSON.stringify(["E-learning corporativo", "Certificados digitais", "Gamifica\xE7\xE3o", "Trilhas de aprendizagem"]), status: "em_desenvolvimento" },
  { name: "Monitor IoT Industrial", subtitle: "Monitoramento de Equipamentos em Tempo Real", description: "Sistema de monitoramento IoT para equipamentos industriais. Coleta de dados de sensores, alertas de manuten\xE7\xE3o preditiva, dashboards em tempo real e hist\xF3rico de opera\xE7\xF5es.", category: "Industrial", technologies: JSON.stringify(["React", "TypeScript", "Node.js", "MQTT", "InfluxDB", "IoT"]), highlights: JSON.stringify(["Monitoramento em tempo real", "Manuten\xE7\xE3o preditiva", "Alertas inteligentes", "Hist\xF3rico completo"]), status: "em_desenvolvimento" },
  { name: "Chatbot Corporativo IA", subtitle: "Assistente Virtual para Empresas", description: "Chatbot inteligente treinado com a base de conhecimento da empresa. Atendimento ao cliente, suporte interno, FAQ automatizado e integra\xE7\xE3o com WhatsApp e Telegram.", category: "IA & Automa\xE7\xE3o", technologies: JSON.stringify(["Node.js", "OpenAI API", "WhatsApp API", "Telegram Bot", "Vector DB"]), highlights: JSON.stringify(["Treinado com dados da empresa", "Multi-canal", "Atendimento 24/7", "Integra\xE7\xE3o WhatsApp"]), status: "em_breve" },
  { name: "Dashboard Financeiro Empresarial", subtitle: "BI e Analytics para Neg\xF3cios", description: "Dashboard de business intelligence para gest\xE3o financeira empresarial. KPIs em tempo real, fluxo de caixa, DRE autom\xE1tico, proje\xE7\xF5es e alertas de desvio or\xE7ament\xE1rio.", category: "Dados", technologies: JSON.stringify(["React", "TypeScript", "Python", "Power BI Embedded", "PostgreSQL"]), highlights: JSON.stringify(["KPIs em tempo real", "DRE autom\xE1tico", "Proje\xE7\xF5es financeiras", "Alertas de desvio"]), status: "em_breve" },
  { name: "Marketplace de Servi\xE7os Locais", subtitle: "Conectando Profissionais e Clientes em Maca\xE9", description: "Marketplace para conex\xE3o de prestadores de servi\xE7os locais com clientes em Maca\xE9/RJ. Perfis profissionais, avalia\xE7\xF5es, agendamento online e pagamento integrado.", category: "Plataformas", technologies: JSON.stringify(["React", "TypeScript", "Node.js", "PostgreSQL", "Stripe", "Maps API"]), highlights: JSON.stringify(["Marketplace local", "Avalia\xE7\xF5es verificadas", "Agendamento online", "Pagamento integrado"]), status: "em_breve" },
  { name: "Sistema de Gest\xE3o Escolar", subtitle: "Administra\xE7\xE3o Completa para Escolas", description: "Sistema completo para gest\xE3o escolar. Matr\xEDculas, grade curricular, lan\xE7amento de notas, boletins digitais, comunica\xE7\xE3o com pais e relat\xF3rios pedag\xF3gicos.", category: "Plataformas", technologies: JSON.stringify(["React", "TypeScript", "Node.js", "PostgreSQL", "PDF Generation"]), highlights: JSON.stringify(["Gest\xE3o completa escolar", "Boletins digitais", "Comunica\xE7\xE3o com pais", "Relat\xF3rios pedag\xF3gicos"]), status: "em_breve" }
];
async function seedTriarcContent() {
  const db = await getDb();
  if (!db) return;
  const existing = await db.select({ id: triacContent.id }).from(triacContent).limit(1);
  if (existing.length > 0) return;
  const allItems = [
    ...TRIARC_SERVICES,
    ...TRIARC_PROJECTS.map((p) => ({ ...p, type: "projeto" }))
  ];
  await db.insert(triacContent).values(allItems);
  console.log(`[Seed] ${allItems.length} itens Triarc inseridos (${TRIARC_SERVICES.length} servi\xE7os + ${TRIARC_PROJECTS.length} projetos)`);
}

// server/routers.ts
init_schema();
init_db();
var APP_CONTEXT2 = `A Triarc Solutions \xE9 uma empresa de tecnologia e inova\xE7\xE3o com sede em Maca\xE9/RJ. Site oficial: triarcsolutions.com.br. Pilares: Gest\xE3o, Treinamento e Tecnologia. Servi\xE7os: desenvolvimento de software sob encomenda, IA e automa\xE7\xE3o, gest\xE3o empresarial, suporte t\xE9cnico em TI, automa\xE7\xE3o industrial, treinamento profissional, licenciamento de software e data science. Projetos em destaque: TopFlow.ai (SEO com IA), COPE (plataforma de conex\xE3o de profissionais), SS-Milhas (gest\xE3o de milhas), TransCarga (log\xEDstica inteligente), TRIARC CRM, NutriSystem, Grupo Conecta e mais de 36 projetos entregues. O Triarc Social Manager \xE9 a plataforma interna de automa\xE7\xE3o de conte\xFAdo para Instagram da Triarc Solutions.`;
var TRIARC_TONE2 = `Use um tom corporativo profissional, moderno e acess\xEDvel. Posicione a Triarc Solutions como refer\xEAncia em tecnologia e inova\xE7\xE3o. Destaque expertise t\xE9cnica, resultados concretos e valor para o cliente. Sempre inclua CTA direcionando para triarcsolutions.com.br. Use hashtags do nicho tech/inova\xE7\xE3o/neg\xF3cios.`;
var appRouter = router({
  system: systemRouter,
  research: researchRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true };
    })
  }),
  accounts: router({
    list: protectedProcedure.query(async () => {
      return getAllAccounts();
    }),
    getById: protectedProcedure.input(z3.object({ id: z3.number() })).query(async ({ input }) => {
      return getAccountById(input.id);
    }),
    stats: protectedProcedure.input(z3.object({ accountId: z3.number() })).query(async ({ input }) => {
      return getAccountStats(input.accountId);
    }),
    create: protectedProcedure.input(z3.object({
      handle: z3.string().min(1).max(128),
      displayName: z3.string().min(1).max(256),
      platform: z3.enum(["instagram", "linkedin", "facebook", "tiktok", "youtube"]).default("instagram"),
      accountType: z3.enum(["personal", "business"]).default("business"),
      tone: z3.enum(["personal", "corporate"]).default("corporate"),
      bio: z3.string().optional(),
      profileUrl: z3.string().optional()
    })).mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const [result] = await db.insert(instagramAccounts).values({
        handle: input.handle,
        displayName: input.displayName,
        platform: input.platform,
        accountType: input.accountType,
        tone: input.tone,
        bio: input.bio ?? null,
        profileUrl: input.profileUrl ?? null
      });
      return { id: result.insertId };
    }),
    delete: protectedProcedure.input(z3.object({ id: z3.number() })).mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      await db.delete(instagramAccounts).where(eq3(instagramAccounts.id, input.id));
      return { success: true };
    })
  }),
  posts: router({
    create: protectedProcedure.input(z3.object({
      accountId: z3.number(),
      caption: z3.string().optional(),
      theme: z3.string().optional(),
      scheduledAt: z3.string().optional(),
      mediaUrls: z3.array(z3.string()).optional()
    })).mutation(async ({ ctx, input }) => {
      const { id } = await createPost({
        userId: ctx.user.id,
        accountId: input.accountId,
        caption: input.caption,
        theme: input.theme,
        scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : void 0,
        status: "draft"
      });
      if (input.mediaUrls) {
        for (let i = 0; i < input.mediaUrls.length; i++) {
          await addPostMedia(id, input.mediaUrls[i], "image", i);
        }
      }
      return { id };
    }),
    getById: protectedProcedure.input(z3.object({ id: z3.number() })).query(async ({ input }) => {
      const post = await getPostById(input.id);
      if (!post) return null;
      const media = await getPostMedia(input.id);
      return { ...post, media };
    }),
    list: protectedProcedure.input(z3.object({
      accountId: z3.number().optional(),
      status: z3.string().optional()
    }).optional()).query(async ({ input }) => {
      if (input?.accountId && input?.status) {
        return getPostsByAccount(input.accountId, input.status);
      }
      if (input?.accountId) {
        return getPostsByAccount(input.accountId);
      }
      if (input?.status) {
        return getPostsByStatus(input.status);
      }
      return getAllPosts();
    }),
    update: protectedProcedure.input(z3.object({
      id: z3.number(),
      caption: z3.string().optional(),
      theme: z3.string().optional(),
      scheduledAt: z3.string().nullable().optional(),
      status: z3.string().optional()
    })).mutation(async ({ input }) => {
      const data = {};
      if (input.caption !== void 0) data.caption = input.caption;
      if (input.theme !== void 0) data.theme = input.theme;
      if (input.scheduledAt !== void 0) data.scheduledAt = input.scheduledAt ? new Date(input.scheduledAt) : null;
      if (input.status !== void 0) data.status = input.status;
      await updatePost(input.id, data);
      return { success: true };
    }),
    approve: protectedProcedure.input(z3.object({ id: z3.number() })).mutation(async ({ input }) => {
      const post = await getPostById(input.id);
      if (!post) throw new Error("Post not found");
      if (!post.scheduledAt || new Date(post.scheduledAt) <= /* @__PURE__ */ new Date()) {
        await updatePost(input.id, { status: "approved", mcpPending: 0 });
        return { success: true, status: "approved" };
      }
      await updatePost(input.id, { status: "scheduled" });
      return { success: true, status: "scheduled" };
      ;
    }),
    reject: protectedProcedure.input(z3.object({ id: z3.number() })).mutation(async ({ input }) => {
      await updatePost(input.id, { status: "rejected" });
      return { success: true };
    }),
    submitForApproval: protectedProcedure.input(z3.object({ id: z3.number() })).mutation(async ({ input }) => {
      await updatePost(input.id, { status: "pending" });
      const post = await getPostById(input.id);
      const account = post ? await getAccountById(post.accountId) : null;
      await notifyOwner({
        title: "Novo post pronto para aprova\xE7\xE3o",
        content: `Um post para @${account?.handle ?? "desconhecido"} est\xE1 aguardando sua aprova\xE7\xE3o. Tema: ${post?.theme ?? "Sem tema"}`
      });
      return { success: true };
    }),
    delete: protectedProcedure.input(z3.object({ id: z3.number() })).mutation(async ({ input }) => {
      await deletePost(input.id);
      return { success: true };
    }),
    addMedia: protectedProcedure.input(z3.object({
      postId: z3.number(),
      mediaUrl: z3.string(),
      mediaType: z3.enum(["image", "video"]).optional(),
      sortOrder: z3.number().optional()
    })).mutation(async ({ input }) => {
      const { id } = await addPostMedia(input.postId, input.mediaUrl, input.mediaType ?? "image", input.sortOrder ?? 0);
      return { id };
    }),
    removeMedia: protectedProcedure.input(z3.object({ id: z3.number() })).mutation(async ({ input }) => {
      await deletePostMedia(input.id);
      return { success: true };
    }),
    getMedia: protectedProcedure.input(z3.object({ postId: z3.number() })).query(async ({ input }) => {
      return getPostMedia(input.postId);
    })
  }),
  assets: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return getAssetsByUser(ctx.user.id);
    }),
    upload: protectedProcedure.input(z3.object({
      name: z3.string(),
      base64: z3.string(),
      mimeType: z3.string()
    })).mutation(async ({ ctx, input }) => {
      const buffer = Buffer.from(input.base64, "base64");
      const ext = input.mimeType.split("/")[1] || "png";
      const fileKey = `assets/${ctx.user.id}/${Date.now()}.${ext}`;
      const { url } = await storagePut(fileKey, buffer, input.mimeType);
      const { id } = await createAsset({
        userId: ctx.user.id,
        name: input.name,
        url,
        fileKey,
        mimeType: input.mimeType
      });
      return { id, url };
    }),
    delete: protectedProcedure.input(z3.object({ id: z3.number() })).mutation(async ({ input }) => {
      await deleteAsset(input.id);
      return { success: true };
    })
  }),
  themes: router({
    list: protectedProcedure.query(async () => {
      return getAllThemes();
    })
  }),
  automation: router({
    generateWeek: protectedProcedure.input(z3.object({
      accountIds: z3.array(z3.number()).optional()
    })).mutation(async ({ ctx, input }) => {
      const accounts = await getAllAccounts();
      const targetAccounts = input.accountIds ? accounts.filter((a) => input.accountIds.includes(a.id)) : accounts;
      if (targetAccounts.length === 0) throw new Error("Nenhuma conta encontrada");
      const db = await getDb();
      const triacItems = db ? await db.select().from(triacContent) : [];
      const contentItems = triacItems.length > 0 ? triacItems : TRIARC_PROJECTS.map((p, i) => ({ id: i + 1, name: p.name, subtitle: p.subtitle, description: p.description, category: p.category, type: "projeto" }));
      if (contentItems.length === 0) throw new Error("Nenhum conte\xFAdo Triarc encontrado");
      const bestTimes = [
        { hour: 8, minute: 0 },
        // Manhã cedo
        { hour: 12, minute: 30 },
        // Almoço
        { hour: 18, minute: 0 },
        // Fim do expediente
        { hour: 20, minute: 0 }
        // Noite
      ];
      const createdPosts = [];
      const now = /* @__PURE__ */ new Date();
      for (let day = 1; day <= 7; day++) {
        for (const account of targetAccounts) {
          const theme = contentItems[(day + account.id) % contentItems.length];
          const scheduleDate = new Date(now);
          scheduleDate.setDate(now.getDate() + day);
          const timeSlot = bestTimes[(day + account.id) % bestTimes.length];
          scheduleDate.setHours(timeSlot.hour, timeSlot.minute, 0, 0);
          const toneInstruction = TRIARC_TONE2;
          let caption = "";
          try {
            const response = await invokeLLM({
              messages: [
                {
                  role: "system",
                  content: `Voc\xEA \xE9 um especialista em marketing de conte\xFAdo para Instagram. ${APP_CONTEXT2}

${toneInstruction}

A legenda deve incluir:
- Texto envolvente e relevante ao tema/projeto/servi\xE7o
- Hashtags estrat\xE9gicas (8-15 hashtags do nicho tech, inova\xE7\xE3o, neg\xF3cios)
- CTA claro direcionando para triarcsolutions.com.br
- Emojis moderados e profissionais

Responda APENAS com a legenda pronta.`
                },
                {
                  role: "user",
                  content: `Crie uma legenda para @triarcsolutions no Instagram. Tema/Projeto: ${theme.name}. Dia ${day} da semana de conte\xFAdo. Foque em mostrar o valor e impacto desse servi\xE7o/projeto para empresas e profissionais.`
                }
              ]
            });
            const rawContent = response.choices?.[0]?.message?.content;
            caption = typeof rawContent === "string" ? rawContent : "";
          } catch (e) {
            caption = `[Erro na gera\xE7\xE3o] Tema: ${theme.name} para @${account.handle}`;
          }
          let mediaUrl = "";
          try {
            const style = "Design moderno e limpo com elementos tech, cores azul ciano (#00BFFF) e cinza escuro, estilo corporativo premium, minimalista e sofisticado";
            const artResult = await generateImage({
              prompt: `Instagram post for Triarc Solutions tech company. Topic: ${theme.name}. ${style}. Place the Triarc Solutions logo (circular tech emblem with gears and code symbols, navy blue, gray and green) prominently in the bottom-right corner. Professional social media design, 1080x1080 square.`,
              originalImages: [{ url: "https://tsm.triarcsolutions.com.br/manus-storage/triarc-logo_4d0b8405.jpeg", mimeType: "image/jpeg" }]
            });
            mediaUrl = artResult.url ?? "";
          } catch (e) {
          }
          const { id } = await createPost({
            userId: ctx.user.id,
            accountId: account.id,
            caption,
            theme: theme.name,
            scheduledAt: scheduleDate,
            status: "pending"
          });
          if (mediaUrl) {
            await addPostMedia(id, mediaUrl, "image", 0);
          }
          createdPosts.push({ id, account: account.handle, theme: theme.name, day });
        }
      }
      await notifyOwner({
        title: `${createdPosts.length} posts gerados automaticamente`,
        content: `A automa\xE7\xE3o criou ${createdPosts.length} posts para a semana. Eles est\xE3o aguardando sua aprova\xE7\xE3o no painel.`
      });
      return { created: createdPosts.length, posts: createdPosts };
    }),
    generateBatch: protectedProcedure.input(z3.object({
      accountId: z3.number(),
      themes: z3.array(z3.string()),
      startDate: z3.string(),
      intervalHours: z3.number().default(24)
    })).mutation(async ({ ctx, input }) => {
      const account = await getAccountById(input.accountId);
      if (!account) throw new Error("Conta n\xE3o encontrada");
      const createdPosts = [];
      const startDate = new Date(input.startDate);
      for (let i = 0; i < input.themes.length; i++) {
        const theme = input.themes[i];
        const scheduleDate = new Date(startDate);
        scheduleDate.setHours(scheduleDate.getHours() + i * input.intervalHours);
        const toneInstruction = TRIARC_TONE2;
        let caption = "";
        try {
          const response = await invokeLLM({
            messages: [
              {
                role: "system",
                content: `Voc\xEA \xE9 um especialista em marketing para Instagram. ${APP_CONTEXT2}

${toneInstruction}

Inclua hashtags estrat\xE9gicas do nicho tech/inova\xE7\xE3o, CTA claro para triarcsolutions.com.br. Responda APENAS com a legenda.`
              },
              { role: "user", content: `Legenda para @triarcsolutions. Tema/Projeto: ${theme}. Destaque o impacto e valor para o cliente.` }
            ]
          });
          const rawBatch = response.choices?.[0]?.message?.content;
          caption = typeof rawBatch === "string" ? rawBatch : "";
        } catch (e) {
          caption = `[Erro] Tema: ${theme}`;
        }
        let mediaUrl = "";
        try {
          const style = "Design moderno tech, cores azul ciano (#00BFFF) e cinza escuro, estilo corporativo premium";
          const artResult = await generateImage({
            prompt: `Instagram post for Triarc Solutions tech company. Topic: ${theme}. ${style}. Place the Triarc Solutions logo (circular tech emblem with gears and code symbols, navy blue, gray and green) prominently in the bottom-right corner. 1080x1080 square.`,
            originalImages: [{ url: "https://tsm.triarcsolutions.com.br/manus-storage/triarc-logo_4d0b8405.jpeg", mimeType: "image/jpeg" }]
          });
          mediaUrl = artResult.url ?? "";
        } catch (e) {
        }
        const { id } = await createPost({
          userId: ctx.user.id,
          accountId: account.id,
          caption,
          theme,
          scheduledAt: scheduleDate,
          status: "pending"
        });
        if (mediaUrl) await addPostMedia(id, mediaUrl, "image", 0);
        createdPosts.push({ id, theme, scheduledAt: scheduleDate.toISOString() });
      }
      await notifyOwner({
        title: `Lote de ${createdPosts.length} posts gerados`,
        content: `${createdPosts.length} posts para @${account.handle} aguardam aprova\xE7\xE3o.`
      });
      return { created: createdPosts.length, posts: createdPosts };
    }),
    getQueue: protectedProcedure.input(z3.object({
      accountId: z3.number().optional()
    }).optional()).query(async ({ input }) => {
      const statuses = ["pending", "approved", "scheduled"];
      const allPosts = input?.accountId ? await getPostsByAccount(input.accountId) : await getAllPosts();
      return allPosts.filter((p) => statuses.includes(p.status)).sort((a, b) => {
        const dateA = a.scheduledAt ? new Date(a.scheduledAt).getTime() : 0;
        const dateB = b.scheduledAt ? new Date(b.scheduledAt).getTime() : 0;
        return dateA - dateB;
      });
    }),
    approveAll: protectedProcedure.mutation(async () => {
      const pendingPosts = await getPostsByStatus("pending");
      let approved = 0;
      let scheduled = 0;
      for (const post of pendingPosts) {
        const p = post;
        if (!p.scheduledAt || new Date(p.scheduledAt) <= /* @__PURE__ */ new Date()) {
          await updatePost(p.id, { status: "approved", mcpPending: 0 });
          approved++;
        } else {
          await updatePost(p.id, { status: "scheduled" });
          scheduled++;
        }
      }
      return { approved, published: 0, scheduled, total: pendingPosts.length };
    }),
    processScheduled: protectedProcedure.mutation(async () => {
      return processScheduledPosts();
    }),
    publishNow: protectedProcedure.input(z3.object({ postId: z3.number() })).mutation(async ({ input }) => {
      const post = await getPostById(input.postId);
      if (!post) throw new Error("Post not found");
      await updatePost(input.postId, { status: "approved", mcpPending: 0, retryCount: 0 });
      return { success: true, message: "Post adicionado \xE0 fila de publica\xE7\xE3o imediata. O agente publicar\xE1 em breve." };
    }),
    getLogs: protectedProcedure.query(async () => {
      return getPublicationLogs(100);
    }),
    getPostLogs: protectedProcedure.input(z3.object({ postId: z3.number() })).query(async ({ input }) => {
      return getPublicationLogsByPost(input.postId);
    }),
    syncInsights: protectedProcedure.input(z3.object({ postId: z3.number() })).mutation(async ({ input }) => {
      const post = await getPostById(input.postId);
      if (!post || !post.instagramPostId) throw new Error("Post not published or no Instagram ID");
      const insights = await fetchPostInsights(post.instagramPostId);
      await updatePost(input.postId, {
        likes: insights.likes ?? 0,
        comments: insights.comments ?? 0
      });
      return { success: true, insights };
    })
  }),
  triacContent: router({
    list: protectedProcedure.input(z3.object({
      type: z3.enum(["servico", "projeto", "all"]).optional()
    }).optional()).query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      const items = await db.select().from(triacContent);
      if (input?.type && input.type !== "all") {
        return items.filter((i) => i.type === input.type);
      }
      return items;
    })
  }),
  analytics: router({
    // Dados da conta Instagram via MCP (chamado pelo agente, cacheado no banco)
    // Como o MCP só pode ser chamado pelo agente, estes endpoints retornam dados
    // armazenados no banco ou buscam via endpoint interno do agente.
    getAccountStats: protectedProcedure.query(async () => {
      const accounts = await getAllAccounts();
      const triarc = accounts.find((a) => a.handle === "triarcsolutions") || accounts[0];
      if (!triarc) return null;
      const stats = await getAccountStats(triarc.id);
      return { account: triarc, stats };
    }),
    getPostsWithMetrics: protectedProcedure.query(async () => {
      const published = await getPostsByStatus("published");
      return published.map((p) => ({
        id: p.id,
        caption: p.caption,
        publishedAt: p.publishedAt,
        instagramPostId: p.instagramPostId,
        instagramPermalink: p.instagramPermalink,
        likes: p.likes ?? 0,
        comments: p.comments ?? 0,
        theme: p.theme,
        linkedinPublished: p.linkedinPublished ?? 0,
        facebookPublished: p.facebookPublished ?? 0
      }));
    }),
    syncAllInsights: protectedProcedure.mutation(async () => {
      const published = await getPostsByStatus("published");
      const postsWithId = published.filter((p) => p.instagramPostId);
      let updated = 0;
      const errors = [];
      for (const post of postsWithId) {
        try {
          const port = process.env.PORT || 3e3;
          const res = await fetch(`http://localhost:${port}/api/scheduled/insights/${post.instagramPostId}`, {
            headers: { "x-internal-key": process.env.JWT_SECRET || "internal" }
          });
          if (res.ok) {
            const data = await res.json();
            if (data.likes !== void 0 || data.comments !== void 0) {
              await updatePost(post.id, { likes: data.likes ?? post.likes ?? 0, comments: data.comments ?? post.comments ?? 0 });
              updated++;
            }
          }
        } catch (e) {
          errors.push(`Post ${post.id}: ${e.message}`);
        }
      }
      return { updated, total: postsWithId.length, errors };
    }),
    getSummary: protectedProcedure.query(async () => {
      const [all, pending, approved, published, scheduled] = await Promise.all([
        getAllPosts(),
        getPostsByStatus("pending"),
        getPostsByStatus("approved"),
        getPostsByStatus("published"),
        getPostsByStatus("scheduled")
      ]);
      const publishedPosts = published;
      const totalLikes = publishedPosts.reduce((s, p) => s + (p.likes ?? 0), 0);
      const totalComments = publishedPosts.reduce((s, p) => s + (p.comments ?? 0), 0);
      return {
        total: all.length,
        pending: pending.length,
        approved: approved.length,
        published: publishedPosts.length,
        scheduled: scheduled.length,
        totalLikes,
        totalComments
      };
    })
  }),
  ai: router({
    generateCaption: protectedProcedure.input(z3.object({
      accountId: z3.number(),
      theme: z3.string(),
      extraContext: z3.string().optional()
    })).mutation(async ({ input }) => {
      const account = await getAccountById(input.accountId);
      if (!account) throw new Error("Account not found");
      const toneInstruction = TRIARC_TONE2;
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `Voc\xEA \xE9 um especialista em marketing de conte\xFAdo para Instagram. ${APP_CONTEXT2}

${toneInstruction}

A legenda deve incluir:
- Texto envolvente e relevante ao tema/projeto/servi\xE7o
- Hashtags estrat\xE9gicas (8-15 hashtags do nicho tech, inova\xE7\xE3o, neg\xF3cios)
- CTA claro para triarcsolutions.com.br
- Emojis moderados e profissionais

Responda APENAS com a legenda pronta, sem explica\xE7\xF5es adicionais.`
          },
          {
            role: "user",
            content: `Crie uma legenda para @triarcsolutions no Instagram.
Tema/Projeto/Servi\xE7o: ${input.theme}
${input.extraContext ? `Contexto adicional: ${input.extraContext}` : ""}
Destaque o impacto, tecnologias usadas e valor para o cliente.`
          }
        ]
      });
      const caption = response.choices?.[0]?.message?.content ?? "Erro ao gerar legenda.";
      return { caption };
    }),
    generateArt: protectedProcedure.input(z3.object({
      accountId: z3.number(),
      theme: z3.string(),
      description: z3.string().optional(),
      includelogo: z3.boolean().optional()
    })).mutation(async ({ input }) => {
      const account = await getAccountById(input.accountId);
      if (!account) throw new Error("Account not found");
      const style = "Design moderno e limpo com elementos tech, cores azul ciano (#00BFFF) e cinza escuro, estilo corporativo premium, minimalista e sofisticado";
      const prompt = `Instagram post image for Triarc Solutions tech company. Topic: ${input.theme}. ${style}. ${input.description ?? ""}. Place the Triarc Solutions logo (circular tech emblem with gears and code symbols, navy blue, gray and green) prominently in the bottom-right corner. Professional social media design, 1080x1080 square format.`;
      const { url } = await generateImage({
        prompt,
        originalImages: [{ url: "https://tsm.triarcsolutions.com.br/manus-storage/triarc-logo_4d0b8405.jpeg", mimeType: "image/jpeg" }]
      });
      return { url };
    })
  }),
  actionPlan: router({
    generate: protectedProcedure.input(z3.object({
      period: z3.enum(["week", "month"]).default("week")
    })).mutation(async () => {
      const published = await getPostsByStatus("published");
      const publishedPosts = published;
      const totalLikes = publishedPosts.reduce((s, p) => s + (p.likes ?? 0), 0);
      const totalComments = publishedPosts.reduce((s, p) => s + (p.comments ?? 0), 0);
      const avgEngagement = publishedPosts.length > 0 ? ((totalLikes + totalComments) / publishedPosts.length).toFixed(1) : "0";
      const topPosts = publishedPosts.sort((a, b) => (b.likes ?? 0) + (b.comments ?? 0) - ((a.likes ?? 0) + (a.comments ?? 0))).slice(0, 3).map((p) => ({ theme: p.theme || "Sem tema", likes: p.likes ?? 0, comments: p.comments ?? 0 }));
      const prompt = "Crie um plano de acao de marketing digital para a Triarc Solutions (empresa de tecnologia de Macae/RJ) baseado nos dados abaixo.\n\nDados de performance:\n- Posts publicados: " + publishedPosts.length + "\n- Total de curtidas: " + totalLikes + "\n- Total de comentarios: " + totalComments + "\n- Engajamento medio por post: " + avgEngagement + "\n- Top posts: " + JSON.stringify(topPosts) + '\n\nRetorne JSON com exatamente esta estrutura:\n{\n  "diagnosis": "diagnostico da performance atual em 3-4 frases",\n  "score": 75,\n  "actions": [{ "priority": "alta", "title": "titulo", "description": "descricao", "metric": "metrica", "deadline": "prazo" }],\n  "contentCalendar": [{ "day": "Segunda", "type": "Educativo", "theme": "tema", "platform": "Instagram" }],\n  "kpis": [{ "name": "KPI", "current": "atual", "target": "meta", "period": "periodo" }],\n  "quickWins": ["acao 1", "acao 2", "acao 3"]\n}';
      const res = await invokeLLM({
        messages: [
          { role: "system", content: "Voce e um estrategista de marketing digital especializado em empresas de tecnologia B2B no Brasil. Responda SEMPRE em JSON valido sem markdown." },
          { role: "user", content: prompt }
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "action_plan",
            strict: true,
            schema: {
              type: "object",
              properties: {
                diagnosis: { type: "string" },
                score: { type: "number" },
                actions: { type: "array", items: { type: "object", properties: { priority: { type: "string" }, title: { type: "string" }, description: { type: "string" }, metric: { type: "string" }, deadline: { type: "string" } }, required: ["priority", "title", "description", "metric", "deadline"], additionalProperties: false } },
                contentCalendar: { type: "array", items: { type: "object", properties: { day: { type: "string" }, type: { type: "string" }, theme: { type: "string" }, platform: { type: "string" } }, required: ["day", "type", "theme", "platform"], additionalProperties: false } },
                kpis: { type: "array", items: { type: "object", properties: { name: { type: "string" }, current: { type: "string" }, target: { type: "string" }, period: { type: "string" } }, required: ["name", "current", "target", "period"], additionalProperties: false } },
                quickWins: { type: "array", items: { type: "string" } }
              },
              required: ["diagnosis", "score", "actions", "contentCalendar", "kpis", "quickWins"],
              additionalProperties: false
            }
          }
        }
      });
      const raw = res.choices?.[0]?.message?.content;
      if (!raw) throw new Error("LLM nao retornou resposta");
      return JSON.parse(typeof raw === "string" ? raw : JSON.stringify(raw));
    })
  }),
  marketIntel: router({
    analyze: protectedProcedure.input(z3.object({
      niche: z3.string().min(1),
      competitor: z3.string().optional()
    })).mutation(async ({ input }) => {
      const competitorContext = input.competitor ? `Analise tamb\xE9m o concorrente: ${input.competitor}. Compare estrat\xE9gias de conte\xFAdo.` : "";
      const res = await invokeLLM({
        messages: [
          { role: "system", content: `Voc\xEA \xE9 um especialista em marketing digital e social media para empresas de tecnologia B2B no Brasil. Responda sempre em JSON v\xE1lido.` },
          { role: "user", content: `Fa\xE7a uma an\xE1lise completa de mercado para a Triarc Solutions (empresa de tecnologia e inova\xE7\xE3o de Maca\xE9/RJ, especializada em software, IA, automa\xE7\xE3o e consultoria) no nicho: "${input.niche}". ${competitorContext}

Retorne JSON com exatamente esta estrutura:
{
  "summary": "diagn\xF3stico do nicho em 3-4 frases",
  "strengths": ["diferencial 1", "diferencial 2", "diferencial 3", "diferencial 4"],
  "opportunities": ["oportunidade 1", "oportunidade 2", "oportunidade 3", "oportunidade 4"],
  "contentPillars": ["pilar 1: descri\xE7\xE3o", "pilar 2: descri\xE7\xE3o", "pilar 3: descri\xE7\xE3o", "pilar 4: descri\xE7\xE3o"],
  "hashtags": ["#hashtag1", "#hashtag2", "#hashtag3", "#hashtag4", "#hashtag5", "#hashtag6", "#hashtag7", "#hashtag8", "#hashtag9", "#hashtag10"],
  "postingStrategy": "estrat\xE9gia detalhada de frequ\xEAncia, hor\xE1rios e tipos de conte\xFAdo por dia da semana"
}` }
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "market_intel",
            strict: true,
            schema: {
              type: "object",
              properties: {
                summary: { type: "string" },
                strengths: { type: "array", items: { type: "string" } },
                opportunities: { type: "array", items: { type: "string" } },
                contentPillars: { type: "array", items: { type: "string" } },
                hashtags: { type: "array", items: { type: "string" } },
                postingStrategy: { type: "string" }
              },
              required: ["summary", "strengths", "opportunities", "contentPillars", "hashtags", "postingStrategy"],
              additionalProperties: false
            }
          }
        }
      });
      const raw = res.choices?.[0]?.message?.content;
      if (!raw) throw new Error("LLM n\xE3o retornou resposta");
      return JSON.parse(typeof raw === "string" ? raw : JSON.stringify(raw));
    })
  })
});

// server/_core/context.ts
async function createContext(opts) {
  let user = null;
  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    user = null;
  }
  return {
    req: opts.req,
    res: opts.res,
    user
  };
}

// server/scheduledRoutes.ts
init_db();

// server/linkedin.ts
init_env();
init_db();
init_schema();
import { eq as eq4 } from "drizzle-orm";
var LINKEDIN_AUTH_URL = "https://www.linkedin.com/oauth/v2/authorization";
var LINKEDIN_TOKEN_URL = "https://www.linkedin.com/oauth/v2/accessToken";
var LINKEDIN_UGC_URL = "https://api.linkedin.com/v2/ugcPosts";
var LINKEDIN_ASSETS_URL = "https://api.linkedin.com/v2/assets?action=registerUpload";
var LINKEDIN_ORG_VANITY = "triarc-solutions-brasil";
var SCOPES = "w_member_social openid profile";
var LINKEDIN_REDIRECT_URI = "https://tsm.triarcsolutions.com.br/auth/linkedin/callback";
function getRedirectUri(_origin) {
  return LINKEDIN_REDIRECT_URI;
}
async function resolveOrganizationUrn(accessToken) {
  try {
    const res = await fetch(
      `https://api.linkedin.com/v2/organizations?q=vanityName&vanityName=${LINKEDIN_ORG_VANITY}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    if (!res.ok) {
      console.warn("[LinkedIn] organizations lookup status:", res.status);
      return null;
    }
    const data = await res.json();
    const org = data?.elements?.[0];
    if (org?.id) {
      const urn = `urn:li:organization:${org.id}`;
      console.log(`[LinkedIn] Organization encontrada: ${urn}`);
      return urn;
    }
    const aclRes = await fetch(
      "https://api.linkedin.com/v2/organizationAcls?q=roleAssignee&role=ADMINISTRATOR&projection=(elements*(organization~(id,vanityName,localizedName)))",
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    if (!aclRes.ok) return null;
    const aclData = await aclRes.json();
    const match = aclData?.elements?.find(
      (e) => e["organization~"]?.vanityName === LINKEDIN_ORG_VANITY
    );
    if (match?.["organization~"]?.id) {
      const urn = `urn:li:organization:${match["organization~"].id}`;
      console.log(`[LinkedIn] Organization via ACL: ${urn}`);
      return urn;
    }
  } catch (err) {
    console.warn("[LinkedIn] Erro ao resolver organization URN:", err);
  }
  return null;
}
function registerLinkedInRoutes(app2) {
  app2.get("/api/linkedin/auth", (req, res) => {
    const origin = req.query.origin || "http://localhost:3000";
    const accountId = req.query.accountId;
    const redirectUri = getRedirectUri(origin);
    const state = Buffer.from(JSON.stringify({ origin, accountId })).toString("base64url");
    const params = new URLSearchParams({
      response_type: "code",
      client_id: ENV.linkedinClientId,
      redirect_uri: redirectUri,
      scope: SCOPES,
      state
    });
    res.redirect(`${LINKEDIN_AUTH_URL}?${params.toString()}`);
  });
  app2.get("/auth/linkedin/callback", async (req, res) => {
    const { code, state, error } = req.query;
    if (error) {
      console.error("[LinkedIn] OAuth error:", error);
      return res.redirect("/?linkedin_error=" + encodeURIComponent(error));
    }
    let origin = "http://localhost:3000";
    let accountId;
    try {
      const decoded = JSON.parse(Buffer.from(state, "base64url").toString());
      origin = decoded.origin;
      accountId = decoded.accountId;
    } catch {
      console.warn("[LinkedIn] Could not parse state");
    }
    const redirectUri = getRedirectUri(origin);
    try {
      const tokenRes = await fetch(LINKEDIN_TOKEN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code,
          redirect_uri: redirectUri,
          client_id: ENV.linkedinClientId,
          client_secret: ENV.linkedinClientSecret
        })
      });
      const tokenData = await tokenRes.json();
      if (!tokenData.access_token) {
        console.error("[LinkedIn] Token exchange failed:", tokenData);
        return res.redirect("/?linkedin_error=token_exchange_failed");
      }
      const { access_token, expires_in } = tokenData;
      const expiresAt = new Date(Date.now() + (expires_in ?? 5184e3) * 1e3);
      let linkedinUrn = await resolveOrganizationUrn(access_token);
      if (!linkedinUrn) {
        console.warn("[LinkedIn] Organization URN n\xE3o resolvido, buscando URN pessoal...");
        try {
          const uiRes = await fetch("https://api.linkedin.com/v2/userinfo", {
            headers: { Authorization: `Bearer ${access_token}` }
          });
          if (uiRes.ok) {
            const ui = await uiRes.json();
            if (ui?.sub) {
              linkedinUrn = `urn:li:person:${ui.sub}`;
              console.log(`[LinkedIn] URN via userinfo: ${linkedinUrn}`);
            }
          }
          if (!linkedinUrn) {
            const meRes = await fetch("https://api.linkedin.com/v2/me", {
              headers: { Authorization: `Bearer ${access_token}` }
            });
            if (meRes.ok) {
              const me = await meRes.json();
              if (me?.id) {
                linkedinUrn = `urn:li:person:${me.id}`;
                console.log(`[LinkedIn] URN via /v2/me: ${linkedinUrn}`);
              }
            }
          }
        } catch (e) {
          console.warn("[LinkedIn] Falha ao buscar URN pessoal:", e);
        }
      }
      if (accountId) {
        const db = await getDb();
        if (!db) throw new Error("DB unavailable");
        await db.update(instagramAccounts).set({
          accessToken: access_token,
          tokenExpiresAt: expiresAt,
          linkedinUrn: linkedinUrn ?? void 0
        }).where(eq4(instagramAccounts.id, parseInt(accountId)));
        console.log(`[LinkedIn] Token salvo para conta ${accountId}, URN: ${linkedinUrn}`);
      }
      res.redirect(`${origin}/accounts?linkedin_connected=1`);
    } catch (err) {
      console.error("[LinkedIn] Callback error:", err);
      res.redirect("/?linkedin_error=callback_failed");
    }
  });
}
async function publishToLinkedIn(params) {
  const { accessToken, linkedinUrn, caption, imageUrl } = params;
  const isOrg = linkedinUrn.startsWith("urn:li:organization:");
  console.log(`[LinkedIn] Publicando como ${isOrg ? "Company Page" : "perfil pessoal"}: ${linkedinUrn}`);
  let shareMediaCategory = "NONE";
  let media = [];
  if (imageUrl) {
    try {
      const uploadedAsset = await registerLinkedInImage(accessToken, linkedinUrn, imageUrl);
      if (uploadedAsset) {
        shareMediaCategory = "IMAGE";
        media = [{
          status: "READY",
          description: { text: caption.slice(0, 200) },
          media: uploadedAsset,
          title: { text: "Triarc Solutions" }
        }];
      }
    } catch (err) {
      console.warn("[LinkedIn] Image upload failed, posting text-only:", err);
    }
  }
  const body = {
    author: linkedinUrn,
    lifecycleState: "PUBLISHED",
    specificContent: {
      "com.linkedin.ugc.ShareContent": {
        shareCommentary: { text: caption },
        shareMediaCategory,
        ...media.length > 0 ? { media } : {}
      }
    },
    visibility: {
      "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"
    }
  };
  const res = await fetch(LINKEDIN_UGC_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "X-Restli-Protocol-Version": "2.0.0"
    },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`LinkedIn UGC post failed: ${res.status} ${err}`);
  }
  const data = await res.json();
  const postId = data.id ?? "";
  const permalink = `https://www.linkedin.com/feed/update/${encodeURIComponent(postId)}`;
  return { postId, permalink };
}
async function registerLinkedInImage(accessToken, ownerUrn, imageUrl) {
  const registerRes = await fetch(LINKEDIN_ASSETS_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      registerUploadRequest: {
        recipes: ["urn:li:digitalmediaRecipe:feedshare-image"],
        owner: ownerUrn,
        serviceRelationships: [{
          relationshipType: "OWNER",
          identifier: "urn:li:userGeneratedContent"
        }]
      }
    })
  });
  if (!registerRes.ok) return null;
  const registerData = await registerRes.json();
  const uploadUrl = registerData?.value?.uploadMechanism?.["com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest"]?.uploadUrl;
  const assetUrn = registerData?.value?.asset;
  if (!uploadUrl || !assetUrn) return null;
  const imgRes = await fetch(imageUrl);
  if (!imgRes.ok) return null;
  const imgBuffer = await imgRes.arrayBuffer();
  const uploadRes = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "image/jpeg"
    },
    body: imgBuffer
  });
  if (!uploadRes.ok) return null;
  return assetUrn;
}

// server/facebook.ts
init_env();
init_db();
init_schema();
import { eq as eq5 } from "drizzle-orm";
var FB_AUTH_URL = "https://www.facebook.com/v19.0/dialog/oauth";
var FB_TOKEN_URL = "https://graph.facebook.com/v19.0/oauth/access_token";
var FB_GRAPH_URL = "https://graph.facebook.com/v19.0";
var FB_SCOPES = ["pages_show_list", "pages_read_engagement", "pages_manage_posts"].join(",");
var FB_PAGE_VANITY = "Triarcsolutions";
var FACEBOOK_REDIRECT_URI = "https://tsm.triarcsolutions.com.br/auth/facebook/callback";
function getRedirectUri2(_origin) {
  return FACEBOOK_REDIRECT_URI;
}
async function resolvePageToken(userToken) {
  try {
    const res = await fetch(
      `${FB_GRAPH_URL}/me/accounts?fields=id,name,access_token,category&access_token=${userToken}`
    );
    if (!res.ok) {
      console.warn("[Facebook] /me/accounts status:", res.status, await res.text());
      return null;
    }
    const data = await res.json();
    const pages = data?.data ?? [];
    if (pages.length === 0) {
      console.warn("[Facebook] Nenhuma p\xE1gina encontrada para este usu\xE1rio");
      return null;
    }
    const triarc = pages.find(
      (p) => p.name?.toLowerCase().includes("triarc") || p.id === FB_PAGE_VANITY
    ) ?? pages[0];
    console.log(`[Facebook] P\xE1gina selecionada: ${triarc.name} (${triarc.id})`);
    return { pageId: triarc.id, pageToken: triarc.access_token, pageName: triarc.name };
  } catch (err) {
    console.warn("[Facebook] Erro ao resolver Page token:", err);
    return null;
  }
}
function registerFacebookRoutes(app2) {
  app2.get("/api/facebook/auth", (req, res) => {
    const origin = req.query.origin || "http://localhost:3000";
    const accountId = req.query.accountId;
    const redirectUri = getRedirectUri2(origin);
    const state = Buffer.from(JSON.stringify({ origin, accountId })).toString("base64url");
    const params = new URLSearchParams({
      client_id: ENV.facebookAppId,
      redirect_uri: redirectUri,
      scope: FB_SCOPES,
      state,
      response_type: "code"
    });
    res.redirect(`${FB_AUTH_URL}?${params.toString()}`);
  });
  app2.get("/auth/facebook/callback", async (req, res) => {
    const { code, state, error } = req.query;
    if (error) {
      console.error("[Facebook] OAuth error:", error);
      return res.redirect("/?facebook_error=" + encodeURIComponent(error));
    }
    let origin = "http://localhost:3000";
    let accountId;
    try {
      const decoded = JSON.parse(Buffer.from(state, "base64url").toString());
      origin = decoded.origin;
      accountId = decoded.accountId;
    } catch {
      console.warn("[Facebook] Could not parse state");
    }
    const redirectUri = getRedirectUri2(origin);
    try {
      const tokenRes = await fetch(
        `${FB_TOKEN_URL}?client_id=${ENV.facebookAppId}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${ENV.facebookAppSecret}&code=${code}`
      );
      const tokenData = await tokenRes.json();
      if (!tokenData.access_token) {
        console.error("[Facebook] Token exchange failed:", tokenData);
        return res.redirect("/?facebook_error=token_exchange_failed");
      }
      const userToken = tokenData.access_token;
      const page = await resolvePageToken(userToken);
      let finalToken = userToken;
      let pageRef = "fb:personal";
      if (page) {
        finalToken = page.pageToken;
        pageRef = `fb:page:${page.pageId}`;
        console.log(`[Facebook] Usando Page token: ${page.pageName} (${page.pageId})`);
      } else {
        console.warn("[Facebook] Nenhuma Page encontrada \u2014 usando token pessoal como fallback");
      }
      const expiresAt = new Date(Date.now() + 60 * 24 * 3600 * 1e3);
      if (accountId) {
        const db = await getDb();
        if (!db) throw new Error("DB unavailable");
        await db.update(instagramAccounts).set({
          accessToken: finalToken,
          tokenExpiresAt: expiresAt,
          linkedinUrn: pageRef
        }).where(eq5(instagramAccounts.id, parseInt(accountId)));
        console.log(`[Facebook] Token salvo para conta ${accountId} (ref: ${pageRef})`);
      }
      res.redirect(`${origin}/accounts?facebook_connected=1`);
    } catch (err) {
      console.error("[Facebook] Callback error:", err);
      res.redirect("/?facebook_error=callback_failed");
    }
  });
}
async function publishToFacebook(params) {
  const { pageToken, pageId, caption, imageUrl } = params;
  let postId;
  if (imageUrl) {
    const formData = new URLSearchParams({
      caption,
      url: imageUrl,
      access_token: pageToken,
      published: "true"
    });
    const res = await fetch(`${FB_GRAPH_URL}/${pageId}/photos`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formData.toString()
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Facebook photo post failed: ${res.status} ${err}`);
    }
    const data = await res.json();
    postId = data.post_id ?? data.id ?? "";
  } else {
    const formData = new URLSearchParams({
      message: caption,
      access_token: pageToken
    });
    const res = await fetch(`${FB_GRAPH_URL}/${pageId}/feed`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formData.toString()
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Facebook feed post failed: ${res.status} ${err}`);
    }
    const data = await res.json();
    postId = data.id ?? "";
  }
  const permalink = postId ? `https://www.facebook.com/${pageId}/posts/${postId.split("_")[1] ?? postId}` : `https://www.facebook.com/${pageId}`;
  return { postId, permalink };
}

// server/scheduledRoutes.ts
async function authenticateHeartbeat(req) {
  const cronUid = req.headers["x-manus-cron-task-uid"];
  if (cronUid && typeof cronUid === "string" && cronUid.length > 0) return true;
  try {
    const user = await sdk.authenticateRequest(req);
    return !!user;
  } catch {
    return false;
  }
}
var MAX_RETRIES = 3;
async function getUser(req) {
  try {
    return await sdk.authenticateRequest(req);
  } catch {
    return null;
  }
}
async function resolveMediaUrl(mediaUrl) {
  if (mediaUrl.startsWith("/manus-storage/")) {
    return storageGetSignedUrl(mediaUrl.replace("/manus-storage/", ""));
  }
  return mediaUrl;
}
async function publishToSocialPlatforms(postId, caption, imageUrl) {
  const post = await getPostById(postId);
  const allAccounts = await getAllAccounts();
  if (!post?.linkedinPublished) {
    const linkedinAccounts = allAccounts.filter(
      (a) => a.platform === "linkedin" && a.accessToken && a.linkedinUrn
    );
    for (const liAccount of linkedinAccounts) {
      try {
        const result = await publishToLinkedIn({
          accessToken: liAccount.accessToken,
          linkedinUrn: liAccount.linkedinUrn,
          caption,
          imageUrl
        });
        await updatePost(postId, { linkedinPublished: 1 });
        console.log(`[LinkedIn] Post ${postId} publicado: ${result.postId}`);
        await notifyOwner({
          title: "\u2705 Post publicado no LinkedIn",
          content: `Post #${postId} publicado!
Link: ${result.permalink}`
        });
      } catch (err) {
        console.error(`[LinkedIn] Falha post ${postId}:`, err.message);
      }
    }
  } else {
    console.log(`[LinkedIn] Post ${postId} j\xE1 publicado \u2014 ignorando.`);
  }
  if (!post?.facebookPublished) {
    const facebookAccounts = allAccounts.filter(
      (a) => a.platform === "facebook" && a.accessToken && (a.linkedinUrn?.startsWith("fb:page:") || a.linkedinUrn === "fb:personal")
    );
    for (const fbAccount of facebookAccounts) {
      const pageId = fbAccount.linkedinUrn.startsWith("fb:page:") ? fbAccount.linkedinUrn.replace("fb:page:", "") : "me";
      try {
        const result = await publishToFacebook({
          pageToken: fbAccount.accessToken,
          pageId,
          caption,
          imageUrl
        });
        await updatePost(postId, { facebookPublished: 1 });
        console.log(`[Facebook] Post ${postId} publicado: ${result.postId}`);
        await notifyOwner({
          title: "\u2705 Post publicado no Facebook",
          content: `Post #${postId} publicado!
Link: ${result.permalink}`
        });
      } catch (err) {
        console.error(`[Facebook] Falha post ${postId}:`, err.message);
      }
    }
  } else {
    console.log(`[Facebook] Post ${postId} j\xE1 publicado \u2014 ignorando.`);
  }
}
function registerScheduledRoutes(app2) {
  app2.get("/api/scheduled/pending-posts", async (req, res) => {
    try {
      const user = await getUser(req);
      if (!user) return res.status(401).json({ error: "Unauthorized" });
      const allAccounts = await getAllAccounts();
      const instagramAccountIds = new Set(
        allAccounts.filter((a) => a.platform === "instagram" || !a.platform).map((a) => a.id)
      );
      const approved = await getPostsByStatus("approved");
      const now = /* @__PURE__ */ new Date();
      const pendingPosts = approved.filter((p) => {
        if (!instagramAccountIds.has(p.accountId)) return false;
        if (p.mcpPending) return false;
        if ((p.retryCount ?? 0) >= MAX_RETRIES) return false;
        if (p.nextRetryAt && new Date(p.nextRetryAt) > now) return false;
        return true;
      });
      console.log(`[ScheduledRoutes] pending-posts: ${approved.length} aprovados, ${pendingPosts.length} prontos para Instagram`);
      if (pendingPosts.length === 0) {
        return res.json({ posts: [] });
      }
      await Promise.all(pendingPosts.map((p) => updatePost(p.id, { mcpPending: 1 })));
      const postsWithMedia = await Promise.all(
        pendingPosts.map(async (post) => {
          const media = await getPostMedia(post.id);
          const mediaWithUrls = await Promise.all(
            media.map(async (m) => ({
              ...m,
              publicUrl: await resolveMediaUrl(m.mediaUrl)
            }))
          );
          return { ...post, media: mediaWithUrls };
        })
      );
      Promise.all(
        postsWithMedia.map(async (post) => {
          const imageUrl = post.media?.[0]?.publicUrl;
          try {
            await publishToSocialPlatforms(post.id, post.caption || "", imageUrl);
          } catch (e) {
            console.error(`[ScheduledRoutes] Erro ao publicar post ${post.id} em LinkedIn/Facebook:`, e.message);
          }
        })
      ).catch((e) => console.error("[ScheduledRoutes] Erro geral LinkedIn/Facebook:", e.message));
      console.log(`[ScheduledRoutes] Retornando ${postsWithMedia.length} post(s) para o AGENT publicar no Instagram`);
      return res.json({ posts: postsWithMedia });
    } catch (err) {
      console.error("[ScheduledRoutes] Erro ao buscar posts pendentes:", err.message);
      return res.status(500).json({ error: err.message });
    }
  });
  app2.post("/api/scheduled/publish-result", async (req, res) => {
    try {
      const user = await getUser(req);
      if (!user) return res.status(401).json({ error: "Unauthorized" });
      const { postId, instagramPostId, permalink, success, error } = req.body;
      if (!postId) return res.status(400).json({ error: "postId is required" });
      const postIdNum = Number(postId);
      const previousLogs = await getPublicationLogsByPost(postIdNum);
      const attempt = previousLogs.length + 1;
      console.log(`[ScheduledRoutes] publish-result: postId=${postIdNum} success=${success} instagramPostId=${instagramPostId}`);
      if (success && instagramPostId) {
        await updatePost(postIdNum, {
          status: "published",
          publishedAt: /* @__PURE__ */ new Date(),
          instagramPostId: String(instagramPostId),
          instagramPermalink: permalink ? String(permalink) : void 0,
          mcpPending: 0,
          retryCount: 0
        });
        await createPublicationLog({
          postId: postIdNum,
          attempt,
          status: "success",
          instagramPostId: String(instagramPostId),
          permalink: permalink ? String(permalink) : void 0
        });
        await notifyOwner({
          title: "\u2705 Post publicado no Instagram",
          content: `Post #${postIdNum} publicado!
Instagram ID: ${instagramPostId}
Link: ${permalink || "N/A"}`
        });
        console.log(`[ScheduledRoutes] Post ${postIdNum} publicado no Instagram: ${instagramPostId}`);
        return res.json({ ok: true });
      } else {
        await createPublicationLog({
          postId: postIdNum,
          attempt,
          status: "failed",
          error: error ? String(error) : "Erro desconhecido"
        });
        const newRetryCount = attempt;
        if (newRetryCount < MAX_RETRIES) {
          const nextRetryAt = new Date(Date.now() + 5 * 60 * 1e3);
          await updatePost(postIdNum, { mcpPending: 0, retryCount: newRetryCount, nextRetryAt });
          console.warn(`[ScheduledRoutes] Post ${postIdNum} falhou (${newRetryCount}/${MAX_RETRIES}), pr\xF3xima tentativa em ${nextRetryAt.toISOString()}`);
          return res.json({ ok: false, error, willRetry: true, attempt: newRetryCount, nextRetryAt });
        } else {
          await updatePost(postIdNum, { mcpPending: 0, retryCount: newRetryCount, status: "rejected" });
          await notifyOwner({
            title: "\u274C Falha ao publicar post no Instagram",
            content: `Post #${postIdNum} falhou ap\xF3s ${MAX_RETRIES} tentativas.
Erro: ${error || "Desconhecido"}`
          });
          console.error(`[ScheduledRoutes] Post ${postIdNum} rejeitado ap\xF3s ${MAX_RETRIES} tentativas`);
          return res.json({ ok: false, error, willRetry: false, maxRetriesReached: true });
        }
      }
    } catch (err) {
      console.error("[ScheduledRoutes] Erro:", err.message);
      return res.status(500).json({ error: err.message });
    }
  });
  app2.get("/api/scheduled/insights/:instagramPostId", async (req, res) => {
    const internalKey = req.headers["x-internal-key"];
    if (internalKey !== (process.env.JWT_SECRET || "internal")) return res.status(401).json({ error: "Unauthorized" });
    try {
      const { getDb: getDb2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      const { posts: posts2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
      const { eq: eq7 } = await import("drizzle-orm");
      const db = await getDb2();
      if (!db) return res.status(503).json({ error: "DB unavailable" });
      const [post] = await db.select().from(posts2).where(eq7(posts2.instagramPostId, req.params.instagramPostId)).limit(1);
      if (!post) return res.status(404).json({ error: "Post not found" });
      return res.json({ likes: post.likes ?? 0, comments: post.comments ?? 0 });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  });
  app2.post("/api/scheduled/heartbeat-publish", async (req, res) => {
    const start = Date.now();
    try {
      const ok = await authenticateHeartbeat(req);
      if (!ok) return res.status(403).json({ error: "cron-only" });
      const { getDb: getDb2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      const { posts: postsTable } = await Promise.resolve().then(() => (init_schema(), schema_exports));
      const { eq: eq7, and: and3, lte } = await import("drizzle-orm");
      const db = await getDb2();
      let promoted = 0;
      if (db) {
        const now2 = /* @__PURE__ */ new Date();
        const scheduled = await db.select().from(postsTable).where(and3(eq7(postsTable.status, "scheduled"), lte(postsTable.scheduledAt, now2)));
        for (const p of scheduled) {
          await updatePost(p.id, { status: "approved", mcpPending: 0 });
          promoted++;
        }
        if (promoted > 0) console.log(`[Heartbeat] ${promoted} post(s) promovidos scheduled\u2192approved`);
      }
      const approved = await getPostsByStatus("approved");
      const now = /* @__PURE__ */ new Date();
      const ready = approved.filter((p) => {
        if (p.mcpPending) return false;
        if ((p.retryCount ?? 0) >= MAX_RETRIES) return false;
        if (p.nextRetryAt && new Date(p.nextRetryAt) > now) return false;
        return true;
      });
      if (ready.length === 0) {
        return res.json({ ok: true, promoted, processed: 0, elapsed: Date.now() - start });
      }
      const allAccounts = await getAllAccounts();
      const linkedinAccounts = allAccounts.filter(
        (a) => a.platform === "linkedin" && a.accessToken && a.linkedinUrn
      );
      const facebookAccounts = allAccounts.filter(
        (a) => a.platform === "facebook" && a.accessToken && (a.linkedinUrn?.startsWith("fb:page:") || a.linkedinUrn === "fb:personal")
      );
      let fbPublished = 0, liPublished = 0, igQueued = 0;
      for (const post of ready) {
        const media = await getPostMedia(post.id);
        let imageUrl;
        if (media?.[0]?.mediaUrl) {
          const url = media[0].mediaUrl;
          imageUrl = url.startsWith("/manus-storage/") ? await storageGetSignedUrl(url.replace("/manus-storage/", "")) : url;
        }
        const caption = post.caption || "";
        if (!post.linkedinPublished) {
          for (const liAcc of linkedinAccounts) {
            try {
              const r = await publishToLinkedIn({ accessToken: liAcc.accessToken, linkedinUrn: liAcc.linkedinUrn, caption, imageUrl });
              await updatePost(post.id, { linkedinPublished: 1 });
              liPublished++;
              console.log(`[Heartbeat] Post ${post.id} \u2192 LinkedIn: ${r.postId}`);
              notifyOwner({ title: "\u2705 LinkedIn (heartbeat)", content: `Post #${post.id} publicado no LinkedIn.` }).catch(() => {
              });
            } catch (e) {
              console.error(`[Heartbeat] LinkedIn post ${post.id}:`, e.message);
            }
          }
        }
        if (!post.facebookPublished) {
          for (const fbAcc of facebookAccounts) {
            const pageId = fbAcc.linkedinUrn.startsWith("fb:page:") ? fbAcc.linkedinUrn.replace("fb:page:", "") : "me";
            try {
              const r = await publishToFacebook({ pageToken: fbAcc.accessToken, pageId, caption, imageUrl });
              await updatePost(post.id, { facebookPublished: 1 });
              fbPublished++;
              console.log(`[Heartbeat] Post ${post.id} \u2192 Facebook: ${r.postId}`);
              notifyOwner({ title: "\u2705 Facebook (heartbeat)", content: `Post #${post.id} publicado no Facebook.` }).catch(() => {
              });
            } catch (e) {
              console.error(`[Heartbeat] Facebook post ${post.id}:`, e.message);
            }
          }
        }
        if (!post.instagramPostId) {
          await updatePost(post.id, { mcpPending: 1 });
          igQueued++;
        }
      }
      console.log(`[Heartbeat] Conclu\xEDdo em ${Date.now() - start}ms \u2014 promoted=${promoted} ig_queued=${igQueued} li=${liPublished} fb=${fbPublished}`);
      return res.json({ ok: true, promoted, processed: ready.length, igQueued, liPublished, fbPublished, elapsed: Date.now() - start });
    } catch (err) {
      console.error("[Heartbeat] Erro:", err.message);
      return res.status(500).json({ error: err.message, stack: err.stack, timestamp: (/* @__PURE__ */ new Date()).toISOString() });
    }
  });
  app2.get("/api/scheduled/publication-logs", async (req, res) => {
    try {
      const user = await getUser(req);
      if (!user) return res.status(401).json({ error: "Unauthorized" });
      const { getPublicationLogs: getPublicationLogs2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      const logs = await getPublicationLogs2(100);
      return res.json({ logs });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  });
}

// server/imageRoutes.ts
init_db();
var TOTAL_MS = 11e4;
function registerImageRoutes(app2) {
  app2.post("/api/generate-image", async (req, res) => {
    const t0 = Date.now();
    try {
      let user;
      try {
        user = await sdk.authenticateRequest(req);
      } catch (authErr) {
        if (authErr instanceof HttpError) {
          return res.status(authErr.statusCode).json({ error: authErr.message });
        }
        return res.status(401).json({ error: "Sess\xE3o expirada. Fa\xE7a login novamente." });
      }
      const { accountId, theme, description } = req.body ?? {};
      if (!accountId || !theme?.trim()) {
        return res.status(400).json({ error: "Conta e tema s\xE3o obrigat\xF3rios" });
      }
      const account = await getAccountById(Number(accountId));
      if (!account) {
        return res.status(404).json({ error: "Conta n\xE3o encontrada" });
      }
      const extra = description?.trim().slice(0, 150) ?? "";
      const prompt = `Post profissional para Instagram. Tema: ${String(theme).trim()}. ${extra}`.trim();
      console.log(`[generate-image] user=${user.id} theme="${theme}"`);
      const budget = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Tempo esgotado (110s). Tente novamente.")), TOTAL_MS);
      });
      const { url } = await Promise.race([
        generateImage({ prompt }),
        budget
      ]);
      console.log(`[generate-image] OK ${Date.now() - t0}ms`);
      return res.json({ url });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[generate-image] ERRO ${Date.now() - t0}ms:`, msg);
      return res.status(500).json({ error: msg });
    }
  });
}

// server/scheduler.ts
init_db();
init_schema();
import { eq as eq6 } from "drizzle-orm";
init_env();
var INTERVAL_MS = parseInt(process.env.SCHEDULER_INTERVAL_MS || "300000", 10);
var TZ_OFFSET = -3;
var ranToday = /* @__PURE__ */ new Set();
async function promoteScheduledPosts() {
  try {
    const scheduledPosts = await getPostsByStatus("scheduled");
    const now = /* @__PURE__ */ new Date();
    let promoted = 0;
    for (const post of scheduledPosts) {
      if (post.scheduledAt && new Date(post.scheduledAt) <= now) {
        await updatePost(post.id, { status: "approved", mcpPending: 0 });
        promoted++;
        console.log(`[Scheduler] Post ${post.id} movido para fila de publica\xE7\xE3o.`);
      }
    }
    if (promoted > 0) console.log(`[Scheduler] ${promoted} post(s) promovidos.`);
  } catch (err) {
    console.error("[Scheduler] Erro ao verificar posts agendados:", err?.message);
  }
}
function getBrasiliaDateHour() {
  const now = /* @__PURE__ */ new Date();
  const brasiliaMs = now.getTime() + TZ_OFFSET * 36e5;
  const brasilia = new Date(brasiliaMs);
  const date = brasilia.toISOString().split("T")[0];
  const hour = brasilia.getUTCHours();
  return { date, hour };
}
async function fetchNews2(query, language) {
  const key = ENV.newsApiKey;
  if (!key) {
    console.error("[DailyResearch] NEWS_API_KEY n\xE3o configurada");
    return [];
  }
  const yesterday = new Date(Date.now() - 864e5).toISOString().split("T")[0];
  const enQuery = query.replace(/intelig[eê]ncia artificial/gi, "artificial intelligence").replace(/automa[çc][aã]o/gi, "automation").replace(/tecnologia/gi, "technology");
  const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(enQuery)}&from=${yesterday}&language=en&pageSize=5&sortBy=publishedAt&apiKey=${key}`;
  console.log(`[DailyResearch] Buscando not\xEDcias: ${url.replace(key, "***")}`);
  try {
    const res = await fetch(url, { headers: { "User-Agent": "TriarcSocialManager/1.0" } });
    const data = await res.json();
    if (data.status !== "ok") {
      console.error(`[DailyResearch] NewsAPI erro: ${data.code} \u2014 ${data.message}`);
      return [];
    }
    if (!data.articles?.length) return [];
    return data.articles.slice(0, 5).map((a) => ({ title: a.title, description: a.description ?? "" }));
  } catch (e) {
    console.error("[DailyResearch] Fetch error:", e.message);
    return [];
  }
}
async function runTopicResearch(topic) {
  const db = await getDb();
  if (!db) return;
  try {
    const articles = await fetchNews2(topic.query, topic.language);
    if (!articles.length) {
      await db.insert(researchRuns).values({ topicId: topic.id, status: "skipped", error: "Sem not\xEDcias" });
      console.log(`[DailyResearch] T\xF3pico "${topic.name}": sem not\xEDcias.`);
      return;
    }
    const headlines = articles.map((a, i) => `${i + 1}. ${a.title}: ${a.description}`).join("\n");
    const llmRes = await invokeLLM({
      messages: [
        { role: "system", content: "Voc\xEA \xE9 especialista em marketing digital para Instagram da Triarc Solutions, empresa de tecnologia de Maca\xE9/RJ. Tom corporativo, moderno e acess\xEDvel. Inclua CTA para triarcsolutions.com.br e hashtags tech." },
        { role: "user", content: `Crie uma legenda impactante para o Instagram da @triarcsolutions sobre: "${topic.name}".
Not\xEDcias das \xFAltimas 24h:
${headlines}

Conecte as novidades ao posicionamento da Triarc. M\xE1ximo 2200 chars. Emojis estrat\xE9gicos. CTA + 5-10 hashtags.` }
      ]
    });
    const caption = typeof llmRes.choices?.[0]?.message?.content === "string" ? llmRes.choices[0].message.content : `Novidades em ${topic.name}! Acompanhe as tend\xEAncias com a Triarc Solutions. triarcsolutions.com.br`;
    const prompt = `Premium Instagram post for Triarc Solutions tech company. Topic: "${topic.name}". Headline: "${articles[0].title}". Ultra-modern tech aesthetic, deep navy blue (#0A1628) background with electric cyan (#00BFFF) and neon purple (#7B2FBE) accents. Futuristic data visualization, glowing circuit patterns, holographic overlays. Bold typography with topic name. Place the Triarc Solutions logo (circular tech emblem with gears and code symbols, navy blue, gray and green) prominently in the bottom-right corner. 1080x1080 square, magazine quality.`;
    const { url: imageUrl } = await generateImage({
      prompt,
      originalImages: [{ url: "https://tsm.triarcsolutions.com.br/manus-storage/triarc-logo_4d0b8405.jpeg", mimeType: "image/jpeg" }]
    });
    if (!imageUrl) throw new Error("Falha ao gerar imagem");
    const postStatus = topic.autoPublish === 1 ? "approved" : "pending";
    const [postResult] = await db.insert(posts).values({
      userId: 1,
      accountId: topic.accountId,
      caption,
      theme: `Pesquisa Di\xE1ria: ${topic.name}`,
      status: postStatus,
      mcpPending: 0
    });
    const postId = postResult.insertId;
    await db.insert(postMedia).values({ postId, mediaUrl: imageUrl, mediaType: "image", sortOrder: 0 });
    await db.insert(researchRuns).values({
      topicId: topic.id,
      postId,
      headlines: JSON.stringify(articles.map((a) => a.title)),
      status: "success"
    });
    console.log(`[DailyResearch] T\xF3pico "${topic.name}" (${topic.id}): post ${postId} criado como ${postStatus} \xE0s ${getBrasiliaDateHour().hour}h Bras\xEDlia.`);
  } catch (err) {
    const db2 = await getDb();
    if (db2) await db2.insert(researchRuns).values({ topicId: topic.id, status: "failed", error: err?.message });
    console.error(`[DailyResearch] Erro no t\xF3pico "${topic.name}":`, err?.message);
  }
}
async function checkAndRunTopicsForHour(date, hour) {
  const db = await getDb();
  if (!db) return;
  const activeTopics = await db.select().from(researchTopics).where(eq6(researchTopics.active, 1));
  for (const topic of activeTopics) {
    const key = `${topic.id}:${date}`;
    if (topic.publishHour === hour && !ranToday.has(key)) {
      ranToday.add(key);
      console.log(`[DailyResearch] Disparando t\xF3pico "${topic.name}" (${hour}h Bras\xEDlia)...`);
      runTopicResearch(topic).catch((err) => console.error(`[DailyResearch] Erro:`, err?.message));
    }
  }
}
async function tick() {
  await promoteScheduledPosts();
  const { date, hour } = getBrasiliaDateHour();
  ranToday.forEach((key) => {
    if (!key.endsWith(`:${date}`)) ranToday.delete(key);
  });
  await checkAndRunTopicsForHour(date, hour);
}
async function runSchedulerTick() {
  await tick();
}

// server/vercel.ts
init_db();
import { sql as sql2 } from "drizzle-orm";

// server/imageJobs.ts
async function ensureImageJobsTable() {
}
async function processImageJob(_jobId) {
}
function verifyInternalAuth(_req, _res, _next) {
  _next();
}

// server/vercel.ts
var app = express();
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.get("/api/health", async (_req, res) => {
  let dbOk = false;
  let dbError = "";
  try {
    const db = await getDb();
    if (db) {
      await db.execute(sql2`SELECT 1 AS ok`);
      dbOk = true;
    } else {
      dbError = getLastDbError() || "getDb() returned null";
    }
  } catch (e) {
    dbError = e.message;
  }
  const dbUrlCandidates = {
    DATABASE_URL: process.env.DATABASE_URL ? "set (" + process.env.DATABASE_URL.length + " chars)" : "not set",
    DB_URL: process.env.DB_URL ? "set (" + process.env.DB_URL.length + " chars)" : "not set",
    POSTGRES_URL: process.env.POSTGRES_URL ? "set (" + process.env.POSTGRES_URL.length + " chars)" : "not set",
    POSTGRES_PRISMA_URL: process.env.POSTGRES_PRISMA_URL ? "set" : "not set",
    SUPABASE_DB_URL: process.env.SUPABASE_DB_URL ? "set" : "not set"
  };
  const rawDbUrl = process.env.DATABASE_URL ?? "";
  const activeUrl = rawDbUrl.startsWith("mysql") ? rawDbUrl : process.env.DB_URL ?? "";
  const masked = activeUrl ? activeUrl.replace(/:[^:@]+@/, ":***@") : "(none found)";
  const relevantKeys = Object.keys(process.env).filter((k) => /^(DATABASE|POSTGRES|SUPABASE|DB_)/i.test(k)).map((k) => k);
  res.json({
    ok: dbOk,
    db: dbOk ? "connected" : `error: ${dbError}`,
    env: {
      dbUrlCandidates,
      activeUrl: masked,
      allDbRelatedKeys: relevantKeys,
      totalEnvKeys: Object.keys(process.env).length,
      JWT_SECRET: !!process.env.JWT_SECRET,
      ADMIN_EMAIL: process.env.ADMIN_EMAIL || "(n\xE3o definido)",
      ADMIN_PASSWORD: !!process.env.ADMIN_PASSWORD,
      NODE_ENV: process.env.NODE_ENV || "(not set)",
      SUPABASE_URL: process.env.SUPABASE_URL ? "set" : "not set",
      GEMINI_API_KEY: process.env.GEMINI_API_KEY ? "set" : "not set",
      GEMINI_IMAGE_MODEL: process.env.GEMINI_IMAGE_MODEL ?? "gemini-2.5-flash-image (default)",
      SUPABASE_STORAGE_BUCKET: process.env.SUPABASE_STORAGE_BUCKET ?? "triarc-social (default)",
      APP_URL: process.env.APP_URL ?? "(not set)",
      IG_USER_ID: process.env.IG_USER_ID ? "set" : "not set",
      igToken: process.env.IG_ACCESS_TOKEN ? "set" : "not set"
    },
    imageStack: await probeImageStack(),
    ts: (/* @__PURE__ */ new Date()).toISOString()
  });
});
registerStorageProxy(app);
registerOAuthRoutes(app);
registerScheduledRoutes(app);
registerLinkedInRoutes(app);
registerFacebookRoutes(app);
registerImageRoutes(app);
app.get("/api/cron/tick", async (req, res) => {
  if (req.headers["authorization"] !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  try {
    await runSchedulerTick();
    return res.json({ ok: true, ts: (/* @__PURE__ */ new Date()).toISOString() });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});
app.post("/api/internal/process-image-job/:id", async (req, res) => {
  verifyInternalAuth(req, res, () => {
  });
  const jobId = parseInt(String(req.params.id), 10);
  if (!Number.isFinite(jobId)) {
    return res.status(400).json({ error: "Invalid job id" });
  }
  try {
    await processImageJob(jobId);
    return res.json({ ok: true, jobId });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: msg });
  }
});
app.use("/api/trpc", createExpressMiddleware({
  router: appRouter,
  createContext,
  onError: ({ path, error }) => {
    console.error(`[tRPC] ${path ?? "?"}:`, error.message);
  }
}));
setTimeout(() => {
  seedTriarcContent().catch((e) => console.error("[Seed] Erro triac_content:", e));
  ensureStorageBucket().catch((e) => console.error("[Storage] Bucket:", e.message));
  ensureImageJobsTable().catch((e) => console.error("[ImageJob] Tabela:", e.message));
}, 5e3);
var config = { maxDuration: 300 };
var vercel_default = app;
export {
  config,
  vercel_default as default
};
