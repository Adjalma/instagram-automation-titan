import type { Express, Request, Response } from "express";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { sdk } from "./_core/sdk";
import { getSessionCookieOptions } from "./_core/cookies";
import * as db from "./db";

/**
 * Login por email/senha usando ADMIN_EMAIL e ADMIN_PASSWORD do ambiente.
 * Cria sessão JWT idêntica ao fluxo OAuth — sem alterar o banco.
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
        return res.status(500).json({ error: "Credenciais de admin não configuradas no servidor" });
      }

      const emailMatch = email.trim().toLowerCase() === adminEmail.trim().toLowerCase();
      const passMatch = password === adminPassword;

      if (!emailMatch || !passMatch) {
        return res.status(401).json({ error: "Email ou senha incorretos" });
      }

      // Busca ou cria o usuário admin no banco
      const ownerOpenId = process.env.OWNER_OPEN_ID;
      if (!ownerOpenId) {
        return res.status(500).json({ error: "OWNER_OPEN_ID não configurado" });
      }

      // Garante que o usuário admin existe no banco
      await db.upsertUser({
        openId: ownerOpenId,
        name: process.env.OWNER_NAME || "Admin",
        email: adminEmail,
        loginMethod: "email",
        lastSignedIn: new Date(),
      });

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
