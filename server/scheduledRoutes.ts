/**
 * Rotas para tarefas agendadas — chamadas pelo agente Manus via HTTP.
 *
 * Fluxo correto:
 * 1. GET /pending-posts → retorna posts aprovados de contas Instagram, marca mcpPending=1
 * 2. POST /publish-result → agente reporta sucesso/falha do Instagram
 *    → em caso de SUCESSO: publica automaticamente no LinkedIn e Facebook (se ainda não publicados)
 */
import type { Express, Request, Response } from "express";
import { sdk } from "./_core/sdk";
import { updatePost, getPostsByStatus, getPostById, getPostMedia, createPublicationLog, getPublicationLogsByPost, getAllAccounts } from "./db";
import { storageGetSignedUrl } from "./storage";
import { notifyOwner } from "./_core/notification";
import { publishToLinkedIn } from "./linkedin";
import { publishToFacebook } from "./facebook";

const MAX_RETRIES = 3;

async function getUser(req: Request) {
  try { return await sdk.authenticateRequest(req); } catch { return null; }
}

/**
 * Publica em LinkedIn e Facebook após sucesso no Instagram.
 * Verifica flags linkedinPublished / facebookPublished para evitar duplicatas.
 */
async function publishToOtherPlatforms(postId: number, caption: string, imageUrl?: string) {
  // Recarregar o post para ter os flags atualizados
  const post = await getPostById(postId) as any;
  const allAccounts = await getAllAccounts() as any[];

  // ── LinkedIn ──────────────────────────────────────────────────
  if (!post?.linkedinPublished) {
    const linkedinAccounts = allAccounts.filter(
      (a: any) => a.platform === "linkedin" && a.accessToken && a.linkedinUrn
    );
    for (const liAccount of linkedinAccounts) {
      try {
        const result = await publishToLinkedIn({
          accessToken: liAccount.accessToken,
          linkedinUrn: liAccount.linkedinUrn,
          caption,
          imageUrl,
        });
        await updatePost(postId, { linkedinPublished: 1 });
        console.log(`[LinkedIn] Post ${postId} publicado: ${result.postId}`);
        await notifyOwner({
          title: "✅ Post publicado no LinkedIn",
          content: `Post #${postId} publicado!\nLink: ${result.permalink}`,
        });
      } catch (err: any) {
        console.error(`[LinkedIn] Falha post ${postId}:`, err.message);
      }
    }
  } else {
    console.log(`[LinkedIn] Post ${postId} já publicado anteriormente — ignorando.`);
  }

  // ── Facebook ──────────────────────────────────────────────────
  if (!post?.facebookPublished) {
    const facebookAccounts = allAccounts.filter(
      (a: any) => a.platform === "facebook" && a.accessToken &&
        (a.linkedinUrn?.startsWith("fb:page:") || a.linkedinUrn === "fb:personal")
    );
    for (const fbAccount of facebookAccounts) {
      // fb:page:{id} → publica na Page; fb:personal → publica no feed pessoal (usa "me")
      const pageId = fbAccount.linkedinUrn.startsWith("fb:page:")
        ? fbAccount.linkedinUrn.replace("fb:page:", "")
        : "me";
      try {
        const result = await publishToFacebook({
          pageToken: fbAccount.accessToken,
          pageId,
          caption,
          imageUrl,
        });
        await updatePost(postId, { facebookPublished: 1 });
        console.log(`[Facebook] Post ${postId} publicado: ${result.postId}`);
        await notifyOwner({
          title: "✅ Post publicado no Facebook",
          content: `Post #${postId} publicado!\nLink: ${result.permalink}`,
        });
      } catch (err: any) {
        console.error(`[Facebook] Falha post ${postId}:`, err.message);
      }
    }
  } else {
    console.log(`[Facebook] Post ${postId} já publicado anteriormente — ignorando.`);
  }
}

export function registerScheduledRoutes(app: Express) {
  /**
   * POST /api/scheduled/publish-result
   * Recebe o resultado de uma publicação feita pelo agente Manus via MCP.
   * Body: { postId, instagramPostId, permalink, success, error? }
   * Em caso de sucesso: publica automaticamente no LinkedIn e Facebook.
   */
  app.post("/api/scheduled/publish-result", async (req: Request, res: Response) => {
    try {
      const user = await getUser(req);
      if (!user) return res.status(401).json({ error: "Unauthorized" });

      const { postId, instagramPostId, permalink, success, error } = req.body;
      if (!postId) return res.status(400).json({ error: "postId is required" });

      const postIdNum = Number(postId);
      const previousLogs = await getPublicationLogsByPost(postIdNum);
      const attempt = previousLogs.length + 1;

      console.log(`[ScheduledRoutes] publish-result recebido: postId=${postIdNum} success=${success} instagramPostId=${instagramPostId}`);

      if (success && instagramPostId) {
        await updatePost(postIdNum, {
          status: "published",
          publishedAt: new Date(),
          instagramPostId: String(instagramPostId),
          instagramPermalink: permalink ? String(permalink) : undefined,
          mcpPending: 0,
          retryCount: 0,
        });

        await createPublicationLog({
          postId: postIdNum,
          attempt,
          status: "success",
          instagramPostId: String(instagramPostId),
          permalink: permalink ? String(permalink) : undefined,
        });

        await notifyOwner({
          title: "✅ Post publicado no Instagram",
          content: `Post #${postIdNum} publicado com sucesso!\nInstagram ID: ${instagramPostId}\nLink: ${permalink || "N/A"}`,
        });

        console.log(`[ScheduledRoutes] Post ${postIdNum} publicado no Instagram: ${instagramPostId}`);

        // Buscar mídia do post para publicar nas outras plataformas
        try {
          const post = await getPostById(postIdNum);
          if (post) {
            const media = await getPostMedia(postIdNum) as any[];
            let imageUrl: string | undefined;
            if (media?.[0]?.mediaUrl) {
              const url = media[0].mediaUrl;
              imageUrl = url.startsWith("/manus-storage/")
                ? await storageGetSignedUrl(url.replace("/manus-storage/", ""))
                : url;
            }
            // Publicar no LinkedIn e Facebook (não bloqueia a resposta)
            publishToOtherPlatforms(postIdNum, (post as any).caption || "", imageUrl).catch((e) =>
              console.error("[ScheduledRoutes] Erro ao publicar em outras plataformas:", e.message)
            );
          }
        } catch (e: any) {
          console.error("[ScheduledRoutes] Erro ao buscar post para outras plataformas:", e.message);
        }

        return res.json({ ok: true });
      } else {
        await createPublicationLog({
          postId: postIdNum,
          attempt,
          status: "failed",
          error: error ? String(error) : "Erro desconhecido",
        });

        const newRetryCount = attempt;
        if (newRetryCount < MAX_RETRIES) {
          const nextRetryAt = new Date(Date.now() + 5 * 60 * 1000);
          await updatePost(postIdNum, { mcpPending: 0, retryCount: newRetryCount, nextRetryAt });
          console.warn(`[ScheduledRoutes] Post ${postIdNum} falhou (tentativa ${newRetryCount}/${MAX_RETRIES}), próxima em ${nextRetryAt.toISOString()}: ${error}`);
          return res.json({ ok: false, error, willRetry: true, attempt: newRetryCount, nextRetryAt });
        } else {
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
   * Retorna posts aprovados de contas INSTAGRAM com mcpPending=0 prontos para publicação via MCP.
   * Filtra explicitamente por platform='instagram' para evitar que posts de contas
   * LinkedIn/Facebook entrem na fila do AGENT cron (que só publica no Instagram).
   * Marca mcpPending=1 imediatamente para evitar publicação duplicada.
   */
  app.get("/api/scheduled/pending-posts", async (req: Request, res: Response) => {
    try {
      const user = await getUser(req);
      if (!user) return res.status(401).json({ error: "Unauthorized" });

      // Buscar todas as contas Instagram ativas
      const allAccounts = await getAllAccounts() as any[];
      const instagramAccountIds = new Set(
        allAccounts
          .filter((a: any) => a.platform === "instagram" || !a.platform)
          .map((a: any) => a.id)
      );

      const approved = await getPostsByStatus("approved");
      const now = new Date();

      // Filtrar: apenas posts de contas Instagram, sem mcpPending, dentro do limite de retries
      const pendingPosts = (approved as any[]).filter((p) => {
        if (!instagramAccountIds.has(p.accountId)) return false; // ← somente contas Instagram
        if (p.mcpPending) return false;
        if ((p.retryCount ?? 0) >= MAX_RETRIES) return false;
        if (p.nextRetryAt && new Date(p.nextRetryAt) > now) return false;
        return true;
      });

      const totalApproved = approved.length;
      const instagramApproved = (approved as any[]).filter((p) => instagramAccountIds.has(p.accountId)).length;
      console.log(`[ScheduledRoutes] pending-posts: ${totalApproved} aprovados no total, ${instagramApproved} de contas Instagram, ${pendingPosts.length} prontos para publicar`);

      if (pendingPosts.length === 0) {
        return res.json({ posts: [] });
      }

      // Marcar mcpPending=1 ANTES de retornar para evitar duplicatas
      await Promise.all(pendingPosts.map((p: any) => updatePost(p.id, { mcpPending: 1 })));

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

      console.log(`[ScheduledRoutes] Retornando ${postsWithMedia.length} post(s) Instagram para publicação`);
      return res.json({ posts: postsWithMedia });
    } catch (err: any) {
      console.error("[ScheduledRoutes] Erro ao buscar posts pendentes:", err.message);
      return res.status(500).json({ error: err.message });
    }
  });

  /**
   * GET /api/scheduled/insights/:instagramPostId
   * Endpoint interno: retorna likes/comments do banco para um post do Instagram.
   * Chamado pelo router analytics.syncAllInsights.
   */
  app.get("/api/scheduled/insights/:instagramPostId", async (req: Request, res: Response) => {
    const internalKey = req.headers['x-internal-key'];
    if (internalKey !== (process.env.JWT_SECRET || 'internal')) return res.status(401).json({ error: 'Unauthorized' });
    try {
      const { getDb } = await import('./db');
      const { posts } = await import('../drizzle/schema');
      const { eq } = await import('drizzle-orm');
      const db = await getDb();
      if (!db) return res.status(503).json({ error: 'DB unavailable' });
      const [post] = await db.select().from(posts).where(eq(posts.instagramPostId, req.params.instagramPostId)).limit(1);
      if (!post) return res.status(404).json({ error: 'Post not found' });
      return res.json({ likes: post.likes ?? 0, comments: post.comments ?? 0 });
    } catch (err: any) {
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
