import type { Express, Request, Response } from "express";
import { sdk } from "./_core/sdk";
import { getAccountById } from "./db";
import { buildCompactImagePrompt, generateImage } from "./_core/imageGeneration";
import { HttpError } from "@shared/_core/errors";

const TOTAL_MS = 110_000;

export function registerImageRoutes(app: Express): void {
  app.post("/api/generate-image", async (req: Request, res: Response) => {
    const t0 = Date.now();
    try {
      let user;
      try {
        user = await sdk.authenticateRequest(req);
      } catch (authErr: unknown) {
        if (authErr instanceof HttpError) {
          return res.status(authErr.statusCode).json({ error: authErr.message });
        }
        return res.status(401).json({ error: "Sessão expirada. Faça login novamente." });
      }

      const { accountId, theme, description } = req.body ?? {};
      if (!accountId || !theme?.trim()) {
        return res.status(400).json({ error: "Conta e tema são obrigatórios" });
      }

      const account = await getAccountById(Number(accountId));
      if (!account) {
        return res.status(404).json({ error: "Conta não encontrada" });
      }

      let prompt = buildCompactImagePrompt(String(theme).trim());
      const extra = description?.trim().slice(0, 150);
      if (extra) prompt += ` Context: ${extra}.`;

      console.log(`[generate-image] user=${user.id} theme="${theme}"`);

      const budget = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error("Tempo esgotado (110s). Tente novamente.")), TOTAL_MS);
      });

      const { url } = await Promise.race([
        generateImage({ prompt, compact: true }),
        budget,
      ]);

      console.log(`[generate-image] OK ${Date.now() - t0}ms`);
      return res.json({ url });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[generate-image] ERRO ${Date.now() - t0}ms:`, msg);
      return res.status(500).json({ error: msg });
    }
  });
}
