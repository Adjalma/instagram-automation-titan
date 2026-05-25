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
import { seedTriarcContent } from "./seed-triarc";
import { getDb } from "./db";
import { sql } from "drizzle-orm";

const app = express();
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Diagnóstico
app.get("/api/health", async (_req, res) => {
  let dbOk = false;
  let dbError = "";
  try {
    const db = await getDb();
    if (db) { dbOk = true; }
    else { dbError = "getDb() returned null — check DATABASE_URL and Vercel logs"; }
  } catch (e: any) { dbError = e.message; }
  res.json({
    ok: dbOk,
    db: dbOk ? "connected" : `error: ${dbError}`,
    env: {
      DATABASE_URL: process.env.DATABASE_URL ? process.env.DATABASE_URL.replace(/:[^:@]+@/, ":***@") : "(not set)",
      JWT_SECRET: !!process.env.JWT_SECRET,
      ADMIN_EMAIL: process.env.ADMIN_EMAIL || "(não definido)",
      ADMIN_PASSWORD: !!process.env.ADMIN_PASSWORD,
    }
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
seedTriarcContent().catch(e => console.error("[Seed] Erro:", e));

export default app;
