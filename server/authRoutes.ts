import type { Express, Request, Response } from "express";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { sdk } from "./_core/sdk";
import { getSessionCookieOptions } from "./_core/cookies";
import * as db from "./db";
import crypto from "crypto";

/**
 * Login por email/senha usando ADMIN_EMAIL e ADMIN_PASSWORD do ambiente.
 * Cria sessão JWT idêntica ao fluxo OAuth — sem alterar o banco.
 * Não depende de OWNER_OPEN_ID: usa hash do email como openId estável.
 */
export function registerAuthRoutes(app: Express) {
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body ?? {};

      if (!email || !password) {
        return res.status(400).json({ error: "Email e senha são obrigatórios" });
      }

      const adminEmail = process.env.ADMIN_EMAIL;
      const adminPassword = process.env.ADMIN_PASSWORD;

      if (!adminEmail || !adminPassword) {
        console.error("[Login] ADMIN_EMAIL ou ADMIN_PASSWORD não configurados");
        return res.status(500).json({ error: "Credenciais de admin não configuradas" });
      }

      const emailMatch = email.trim().toLowerCase() === adminEmail.trim().toLowerCase();
      const passMatch = password === adminPassword;

      if (!emailMatch || !passMatch) {
        return res.status(401).json({ error: "Email ou senha incorretos" });
      }

      // Usa OWNER_OPEN_ID se disponível, senão deriva um ID estável do email
      const ownerOpenId =
        process.env.OWNER_OPEN_ID ||
        "admin_" + crypto.createHash("sha256").update(adminEmail).digest("hex").slice(0, 16);

      // Garante que o usuário admin existe no banco (idempotente)
      try {
        await db.upsertUser({
          openId: ownerOpenId,
          name: process.env.OWNER_NAME || "Admin",
          email: adminEmail,
          loginMethod: "email",
          lastSignedIn: new Date(),
        });
      } catch (dbErr: any) {
        // Falha no upsert não deve bloquear o login
        console.warn("[Login] upsertUser falhou (não crítico):", dbErr.message);
      }

      const sessionToken = await sdk.createSessionToken(ownerOpenId, {
        name: process.env.OWNER_NAME || "Admin",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      return res.json({ ok: true });
    } catch (err: any) {
      console.error("[Login] Erro:", err.message);
      return res.status(500).json({ error: "Erro interno ao fazer login" });
    }
  });
}
