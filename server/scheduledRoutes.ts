/**
 * Rotas para tarefas agendadas — chamadas pelo agente Manus via HTTP.
 *
 * O agente Manus (que tem acesso ao MCP do Instagram) publica os posts
 * e depois reporta o resultado para este endpoint, que atualiza o banco.
 *
 * Segurança: usa o mesmo mecanismo de sessão OAuth da plataforma.
 * O agente usa o cookie SCHEDULED_TASK_COOKIE injetado automaticamente.
 */
import type { Express, Request, Response } from "express";
import { sdk } from "./_core/sdk";
import { updatePost, getPostsByStatus, getPostMedia } from "./db";
import { storageGetSignedUrl } from "./storage";

async function getUser(req: Request) {
  try { return await sdk.authenticateRequest(req); } catch { return null; }
}

export function registerScheduledRoutes(app: Express) {
  /**
   * POST /api/scheduled/publish-result
   * Recebe o resultado de uma publicação feita pelo agente Manus via MCP.
   * Body: { postId, instagramPostId, permalink, success, error? }
   */
  app.post("/api/scheduled/publish-result", async (req: Request, res: Response) => {
    try {
      const user = await getUser(req);
      if (!user) return res.status(401).json({ error: "Unauthorized" });

      const { postId, instagramPostId, permalink, success, error } = req.body;
      if (!postId) return res.status(400).json({ error: "postId is required" });

      if (success && instagramPostId) {
        await updatePost(Number(postId), {
          status: "published",
          publishedAt: new Date(),
          instagramPostId: String(instagramPostId),
          instagramPermalink: permalink ? String(permalink) : undefined,
          mcpPending: 0,
        });
        console.log(`[ScheduledRoutes] Post ${postId} publicado: ${instagramPostId}`);
        return res.json({ ok: true });
      } else {
        await updatePost(Number(postId), { mcpPending: 0 });
        console.warn(`[ScheduledRoutes] Post ${postId} falhou: ${error}`);
        return res.json({ ok: false, error });
      }
    } catch (err: any) {
      console.error("[ScheduledRoutes] Erro:", err.message);
      return res.status(500).json({ error: err.message });
    }
  });

  /**
   * GET /api/scheduled/pending-posts
   * Retorna posts aprovados com mcpPending=0 prontos para publicação.
   * Usado pelo agente Manus para saber quais posts publicar.
   */
  app.get("/api/scheduled/pending-posts", async (req: Request, res: Response) => {
    try {
      const user = await getUser(req);
      if (!user) return res.status(401).json({ error: "Unauthorized" });

      const approved = await getPostsByStatus("approved");
      const pendingPosts = (approved as any[]).filter((p) => !p.mcpPending);

      const postsWithMedia = await Promise.all(
        pendingPosts.map(async (post: any) => {
          const media = await getPostMedia(post.id);
          const mediaWithUrls = await Promise.all(
            (media as any[]).map(async (m) => {
              let mediaUrl: string = m.mediaUrl;
              if (mediaUrl.startsWith("/manus-storage/")) {
                const key = mediaUrl.replace("/manus-storage/", "");
                mediaUrl = await storageGetSignedUrl(key);
              }
              return { ...m, publicUrl: mediaUrl };
            })
          );
          return { ...post, media: mediaWithUrls };
        })
      );

      return res.json({ posts: postsWithMedia });
    } catch (err: any) {
      console.error("[ScheduledRoutes] Erro ao buscar posts pendentes:", err.message);
      return res.status(500).json({ error: err.message });
    }
  });
}
