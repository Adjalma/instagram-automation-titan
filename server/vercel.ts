import "dotenv/config";
import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./_core/oauth";
import { registerStorageProxy } from "./_core/storageProxy";
import { appRouter } from "./routers";
import { createContext } from "./_core/context";
import { registerScheduledRoutes } from "./scheduledRoutes";
import { registerLinkedInRoutes } from "./linkedin";
import { registerFacebookRoutes } from "./facebook";
import { registerImageRoutes } from "./imageRoutes";
import { runSchedulerTick } from "./scheduler";
import { sdk } from "./_core/sdk";
import { seedTriarcContent, seedContentThemes } from "./seed-triarc";
import { getDb, getLastDbError } from "./db";
import { sql } from "drizzle-orm";
import { ensureStorageBucket } from "./storage";
import { probeImageStack } from "./_core/imageGeneration";
import { describeIgTokenEnv } from "./_core/env";
import { ensureImageJobsTable, processImageJob, verifyInternalAuth } from "./imageJobs";

const app = express();
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

app.get("/api/health", async (_req, res) => {
  let dbOk = false;
  let dbError = "";
  try {
    const db = await getDb();
    if (db) {
      await db.execute(sql`SELECT 1 AS ok`);
      dbOk = true;
    } else {
      dbError = getLastDbError() || "getDb() returned null";
    }
  } catch (e: any) {
    dbError = e.message;
  }

  const dbUrlCandidates = {
    DATABASE_URL: process.env.DATABASE_URL ? "set (" + process.env.DATABASE_URL.length + " chars)" : "not set",
    DB_URL: process.env.DB_URL ? "set (" + process.env.DB_URL.length + " chars)" : "not set",
    POSTGRES_URL: process.env.POSTGRES_URL ? "set (" + process.env.POSTGRES_URL.length + " chars)" : "not set",
    POSTGRES_PRISMA_URL: process.env.POSTGRES_PRISMA_URL ? "set" : "not set",
    SUPABASE_DB_URL: process.env.SUPABASE_DB_URL ? "set" : "not set",
  };

  const activeUrl = process.env.DATABASE_URL || process.env.DB_URL || process.env.POSTGRES_URL || process.env.POSTGRES_PRISMA_URL || process.env.SUPABASE_DB_URL || "";
  const masked = activeUrl ? activeUrl.replace(/:[^:@]+@/, ":***@") : "(none found)";

  const relevantKeys = Object.keys(process.env)
    .filter(k => /^(DATABASE|POSTGRES|SUPABASE|DB_)/i.test(k))
    .map(k => k);

  res.json({
    ok: dbOk,
    db: dbOk ? "connected" : `error: ${dbError}`,
    env: {
      dbUrlCandidates,
      activeUrl: masked,
      allDbRelatedKeys: relevantKeys,
      totalEnvKeys: Object.keys(process.env).length,
      JWT_SECRET: !!process.env.JWT_SECRET,
      ADMIN_EMAIL: process.env.ADMIN_EMAIL || "(não definido)",
      ADMIN_PASSWORD: !!process.env.ADMIN_PASSWORD,
      NODE_ENV: process.env.NODE_ENV || "(not set)",
      SUPABASE_URL: process.env.SUPABASE_URL ? "set" : "not set",
      GEMINI_API_KEY: process.env.GEMINI_API_KEY ? "set" : "not set",
      GEMINI_IMAGE_MODEL: process.env.GEMINI_IMAGE_MODEL ?? "gemini-2.5-flash-image (default)",
      SUPABASE_STORAGE_BUCKET: process.env.SUPABASE_STORAGE_BUCKET ?? "triarc-social (default)",
      APP_URL: process.env.APP_URL ?? "(not set)",
      IG_USER_ID: process.env.IG_USER_ID ? "set" : "not set",
      igToken: describeIgTokenEnv(),
    },
    imageStack: await probeImageStack(),
    ts: new Date().toISOString(),
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
    return res.json({ ok: true, ts: new Date().toISOString() });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

/** Processa job de imagem em invocação serverless dedicada (evita timeout do request pai). */
app.post("/api/internal/process-image-job/:id", async (req, res) => {
  if (!verifyInternalAuth(req.headers.authorization)) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const jobId = parseInt(String(req.params.id), 10);
  if (!Number.isFinite(jobId)) {
    return res.status(400).json({ error: "Invalid job id" });
  }
  try {
    await processImageJob(jobId);
    return res.json({ ok: true, jobId });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: msg });
  }
});

app.use("/api/trpc", createExpressMiddleware({
  router: appRouter,
  createContext,
  onError: ({ path, error }) => {
    console.error(`[tRPC] ${path ?? "?"}:`, error.message);
  },
}));

// Inicialização adiada — não compete com auth.me no cold start
setTimeout(() => {
  sdk.ensureAdminUser().catch(e => console.error("[Auth] Erro ao criar admin:", e));
  seedTriarcContent().catch(e => console.error("[Seed] Erro triac_content:", e));
  seedContentThemes().catch(e => console.error("[Seed] Erro content_themes:", e));
  ensureStorageBucket().catch(e => console.error("[Storage] Bucket:", e.message));
  ensureImageJobsTable().catch(e => console.error("[ImageJob] Tabela:", e.message));
}, 5000);

/** Geração de imagem Gemini pode levar 15–120s. */
export const config = { maxDuration: 300 };

export default app;
