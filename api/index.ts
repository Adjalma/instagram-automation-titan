/**
 * Vercel Serverless entry point.
 * Wraps the existing Express app so it runs as a Vercel Function.
 */
import "dotenv/config";
import express from "express";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "../server/_core/oauth";
import { registerStorageProxy } from "../server/_core/storageProxy";
import { registerLinkedInRoutes } from "../server/linkedin";
import { registerFacebookRoutes } from "../server/facebook";
import { registerScheduledRoutes } from "../server/scheduledRoutes";
import { appRouter } from "../server/routers";
import { createContext } from "../server/_core/context";
import path from "path";

const app = express();

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

registerStorageProxy(app);
registerOAuthRoutes(app);
registerScheduledRoutes(app);
registerLinkedInRoutes(app);
registerFacebookRoutes(app);

app.use(
  "/api/trpc",
  createExpressMiddleware({ router: appRouter, createContext })
);

// Serve static frontend build
app.use(express.static(path.join(process.cwd(), "dist/public")));
app.get("*", (_req, res) => {
  res.sendFile(path.join(process.cwd(), "dist/public", "index.html"));
});

export default (req: VercelRequest, res: VercelResponse) => {
  app(req as any, res as any);
};
