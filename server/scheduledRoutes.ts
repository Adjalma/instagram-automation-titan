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
import { updatePost, getPostsByStatus, getPostMedia, createPublicationLog, getPublicationLogsByPost } from "./db";
import { storageGetSignedUrl } from "./storage";
import { notifyOwner } from "./_core/notification";

const MAX_RETRIES = 3;

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

      const postIdNum = Number(postId);

      // Contar tentativas anteriores para este post
      const previousLogs = await getPublicationLogsByPost(postIdNum);
      const attempt = previousLogs.length + 1;

      if (success && instagramPostId) {
        await updatePost(postIdNum, {
          status: "published",
          publishedAt: new Date(),
          instagramPostId: String(instagramPostId),
          instagramPermalink: permalink ? String(permalink) : undefined,
          mcpPending: 0,
          retryCount: 0,
        });

        // Registrar log de sucesso
        await createPublicationLog({
          postId: postIdNum,
          attempt,
          status: "success",
          instagramPostId: String(instagramPostId),
          permalink: permalink ? String(permalink) : undefined,
        });

        // Notificar dono
        await notifyOwner({
          title: "✅ Post publicado no Instagram",
          content: `Post #${postIdNum} publicado com sucesso!\nInstagram ID: ${instagramPostId}\nLink: ${permalink || "N/A"}`,
        });

        console.log(`[ScheduledRoutes] Post ${postIdNum} publicado: ${instagramPostId}`);
        return res.json({ ok: true });
      } else {
        // Registrar log de falha
        await createPublicationLog({
          postId: postIdNum,
          attempt,
          status: "failed",
          error: error ? String(error) : "Erro desconhecido",
        });

        // Verificar se ainda há tentativas disponíveis
        const newRetryCount = attempt;
        if (newRetryCount < MAX_RETRIES) {
          // Backoff: próxima tentativa em 5 minutos
          const nextRetryAt = new Date(Date.now() + 5 * 60 * 1000);
          await updatePost(postIdNum, { mcpPending: 0, retryCount: newRetryCount, nextRetryAt });
          console.warn(`[ScheduledRoutes] Post ${postIdNum} falhou (tentativa ${newRetryCount}/${MAX_RETRIES}), próxima tentativa em ${nextRetryAt.toISOString()}: ${error}`);
          return res.json({ ok: false, error, willRetry: true, attempt: newRetryCount, nextRetryAt });
        } else {
          // Máximo de tentativas atingido — marcar como rejected para não tentar mais
          await updatePost(postIdNum, { mcpPending: 0, retryCount: newRetryCount, status: "rejected" });
          await notifyOwner({
            title: "❌ Falha ao publicar post no Instagram",
            content: `Post #${postIdNum} falhou após ${MAX_RETRIES} tentativas.\nÚltimo erro: ${error || "Desconhecido"}`,
          });
          console.error(`[ScheduledRoutes] Post ${postIdNum} rejeitado após ${MAX_RETRIES} tentativas: ${error}`);
          return res.json({ ok: false, error, willRetry: false, maxRetriesReached: true });
        }
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
      // Filtrar posts elegíveis: não aguardando MCP, não atingiram limite, e backoff expirado
      const now = new Date();
      const pendingPosts = (approved as any[]).filter((p) => {
        if (p.mcpPending) return false;
        if ((p.retryCount ?? 0) >= MAX_RETRIES) return false;
        if (p.nextRetryAt && new Date(p.nextRetryAt) > now) return false; // backoff ainda ativo
        return true;
      });

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

  /**
   * GET /api/scheduled/publication-logs
   * Retorna os últimos 100 logs de publicação para a UI.
   */
  app.get("/api/scheduled/publication-logs", async (req: Request, res: Response) => {
    try {
      const user = await getUser(req);
      if (!user) return res.status(401).json({ error: "Unauthorized" });
      const { getPublicationLogs } = await import("./db");
      const logs = await getPublicationLogs(100);
      return res.json({ logs });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });
}
