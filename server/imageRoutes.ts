import type { Express, Request, Response } from "express";
import { sdk } from "./_core/sdk";
import { getAccountById } from "./db";
import { buildTriarcImagePrompt, generateImage } from "./_core/imageGeneration";

const TOTAL_GENERATION_MS = 100_000;

function buildPrompt(theme: string, description?: string): string {
  let prompt = buildTriarcImagePrompt(theme.trim());
  const extra = description?.trim().slice(0, 500);
  if (extra) prompt += `\nVisual context: ${extra}`;
  return prompt;
}

async function generateWithBudget(prompt: string): Promise<string> {
  const budget = new Promise<never>((_, reject) => {
    setTimeout(
      () => reject(new Error("Geração excedeu 100s. Tente novamente em 1 minuto.")),
      TOTAL_GENERATION_MS
    );
  });
  const { url } = await Promise.race([generateImage({ prompt }), budget]);
  if (!url) throw new Error("Gemini não retornou URL da imagem");
  return url;
}

export function registerImageRoutes(app: Express): void {
  app.post("/api/generate-image", async (req: Request, res: Response) => {
    const started = Date.now();
    try {
      const user = await sdk.authenticateRequest(req);
      const { accountId, theme, description } = req.body ?? {};

      if (!accountId || !theme?.trim()) {
        return res.status(400).json({ error: "Conta e tema são obrigatórios" });
      }

      const account = await getAccountById(Number(accountId));
      if (!account) {
        return res.status(404).json({ error: "Conta não encontrada" });
      }

      const prompt = buildPrompt(String(theme), description ? String(description) : undefined);
      console.log(`[generate-image] user=${user.id} theme="${theme}"`);

      const url = await generateWithBudget(prompt);
      console.log(`[generate-image] OK em ${Date.now() - started}ms`);
      return res.json({ url });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[generate-image] FALHA em ${Date.now() - started}ms:`, msg);
      return res.status(500).json({ error: msg });
    }
  });
}
