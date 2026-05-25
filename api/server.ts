import "dotenv/config";
import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "../server/_core/oauth";
import { registerStorageProxy } from "../server/_core/storageProxy";
import { appRouter } from "../server/routers";
import { createContext } from "../server/_core/context";
import { registerScheduledRoutes } from "../server/scheduledRoutes";
import { registerLinkedInRoutes } from "../server/linkedin";
import { registerFacebookRoutes } from "../server/facebook";
import { runAutonomousAgent } from "../server/autonomousAgent";
import { sdk } from "../server/_core/sdk";
import { seedTriarcContent } from "../server/seed-triarc";

const app = express();
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Diagnóstico — verifica DB e variáveis de ambiente
app.get("/api/health", async (_req, res) => {
  const { getDb } = await import("../server/db");
  let dbOk = false;
  let dbError = "";
  try {
    const db = await getDb();
    if (db) {
      const { sql } = await import("drizzle-orm");
      await db.execute(sql`SELECT 1`);
      dbOk = true;
    }
  } catch (e: any) { dbError = e.message; }
  res.json({
    ok: dbOk,
    db: dbOk ? "connected" : `error: ${dbError}`,
    env: {
      DATABASE_URL: !!process.env.DATABASE_URL,
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

// Endpoint chamado pelo Vercel Cron Jobs a cada 5 minutos
app.get("/api/cron/tick", async (req, res) => {
  const auth = req.headers["authorization"];
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  try {
    await runAutonomousAgent();
    return res.json({ ok: true, ts: new Date().toISOString() });
  } catch (err: any) {
    console.error("[Cron] Erro:", err);
    return res.status(500).json({ error: err.message });
  }
});

app.use("/api/trpc", createExpressMiddleware({ router: appRouter, createContext }));

// Inicialização no cold start
sdk.ensureAdminUser().catch(e => console.error("[Auth] Erro ao criar admin:", e));
seedTriarcContent().catch(e => console.error("[Seed] Erro:", e));

export default app;
