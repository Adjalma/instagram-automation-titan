/**
 * Vercel Cron: executa a cada 5 minutos.
 * Move posts agendados vencidos para status "approved" e dispara publicações pendentes.
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getPostsByStatus, updatePost } from "../../server/db";

export const config = { maxDuration: 60 };

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Proteção básica: a Vercel envia o header authorization em chamadas de cron
  const authHeader = req.headers["authorization"];
  if (
    process.env.NODE_ENV === "production" &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const scheduledPosts = await getPostsByStatus("scheduled");
    const now = new Date();
    let promoted = 0;

    for (const post of scheduledPosts as any[]) {
      if (post.scheduledAt && new Date(post.scheduledAt) <= now) {
        await updatePost(post.id, { status: "approved", mcpPending: 0 });
        promoted++;
        console.log(`[Cron/publish] Post ${post.id} → approved`);
      }
    }

    console.log(`[Cron/publish] ${promoted} post(s) promovidos.`);
    return res.json({ ok: true, promoted });
  } catch (err: any) {
    console.error("[Cron/publish] Erro:", err?.message);
    return res.status(500).json({ error: err?.message });
  }
}
