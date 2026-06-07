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
import { runAutonomousAgent } from "./autonomousAgent";
import { sdk } from "./_core/sdk";
import { seedTriarcContent, seedContentThemes } from "./seed-triarc";
import { getDb, getLastDbError } from "./db";
import { sql } from "drizzle-orm";

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
    },
    ts: new Date().toISOString(),
  });
});

registerStorageProxy(app);
registerOAuthRoutes(app);
registerScheduledRoutes(app);
registerLinkedInRoutes(app);
registerFacebookRoutes(app);

app.get("/api/cron/tick", async (req, res) => {
  if (req.headers["authorization"] !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  try {
    await runAutonomousAgent();
    return res.json({ ok: true, ts: new Date().toISOString() });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.use("/api/trpc", createExpressMiddleware({ router: appRouter, createContext }));

// Inicialização no cold start
sdk.ensureAdminUser().catch(e => console.error("[Auth] Erro ao criar admin:", e));
seedTriarcContent().catch(e => console.error("[Seed] Erro triac_content:", e));
seedContentThemes().catch(e => console.error("[Seed] Erro content_themes:", e));

/** Geração de imagem Gemini pode levar 15–60s — requer Pro no Vercel (Hobby = 10s max). */
export const config = { maxDuration: 60 };

export default app;
