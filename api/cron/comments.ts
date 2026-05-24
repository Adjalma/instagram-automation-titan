/**
 * Vercel Cron: executa a cada 2 minutos.
 * Responde comentários pendentes nas plataformas conectadas usando DeepSeek via LLM.
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getDb } from "../../server/db";
import { posts } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { invokeLLM } from "../../server/_core/llm";

export const config = { maxDuration: 60 };

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const authHeader = req.headers["authorization"];
  if (
    process.env.NODE_ENV === "production" &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const db = await getDb();
    if (!db) return res.status(503).json({ error: "DB unavailable" });

    // Busca posts publicados que possuem comentários pendentes de resposta
    const publishedPosts = await db
      .select()
      .from(posts)
      .where(eq(posts.status, "published"))
      .limit(10);

    let replied = 0;
    for (const post of publishedPosts) {
      // Placeholder: adicionar lógica de busca de comentários via Graph API
      // e resposta automática com invokeLLM quando integração estiver ativa.
      console.log(`[Cron/comments] Verificando post ${post.id}...`);
      // replied++ quando resposta for enviada
    }

    return res.json({ ok: true, replied });
  } catch (err: any) {
    console.error("[Cron/comments] Erro:", err?.message);
    return res.status(500).json({ error: err?.message });
  }
}
