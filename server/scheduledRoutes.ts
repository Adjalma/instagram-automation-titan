/**
 * Rotas para tarefas agendadas — chamadas pelo agente Manus via HTTP.
 *
 * Fluxo correto:
 * 1. GET /pending-posts
 *    → Publica imediatamente no LinkedIn e Facebook via servidor (direto)
 *    → Retorna os posts para o AGENT cron publicar no Instagram via MCP
 *    → Marca mcpPending=1 para evitar duplicatas no Instagram
 *
 * 2. POST /publish-result
 *    → AGENT reporta resultado da publicação no Instagram
 *    → Atualiza status do post no banco
 *
 * LinkedIn e Facebook NÃO dependem do resultado do Instagram.
 * Os 3 canais publicam o mesmo conteúdo de forma independente.
 */
import type { Express, Request, Response } from "express";
import { sdk } from "./_core/sdk";
import { updatePost, getPostsByStatus, getPostById, getPostMedia, createPublicationLog, getPublicationLogsByPost, getAllAccounts } from "./db";
import { storageGetSignedUrl } from "./storage";
import { notifyOwner } from "./_core/notification";
import { publishToLinkedIn } from "./linkedin";
import { publishToFacebook } from "./facebook";
import { publishToInstagram, extractIgUserId } from "./instagram";

/** Autentica requisição de heartbeat via header x-manus-cron-task-uid ou sessão normal */
async function authenticateHeartbeat(req: Request): Promise<boolean> {
  const cronUid = req.headers["x-manus-cron-task-uid"];
  if (cronUid && typeof cronUid === "string" && cronUid.length > 0) return true;
  try {
    const user = await sdk.authenticateRequest(req);
    return !!user;
  } catch { return false; }
}

const MAX_RETRIES = 3;

async function getUser(req: Request) {
  try { return await sdk.authenticateRequest(req); } catch { return null; }
}

/**
 * Resolve a URL pública de uma mídia (signed URL do S3 se necessário).
 */
async function resolveMediaUrl(mediaUrl: string): Promise<string> {
  if (mediaUrl.startsWith("/manus-storage/")) {
    return storageGetSignedUrl(mediaUrl.replace("/manus-storage/", ""));
  }
  return mediaUrl;
}

/**
 * Publica um post no LinkedIn e no Facebook imediatamente.
 * Chamado no momento em que o post entra na fila (pending-posts),
 * de forma independente do Instagram.
 * Verifica flags linkedinPublished / facebookPublished para evitar duplicatas.
 */
async function publishToSocialPlatforms(postId: number, caption: string, imageUrl?: string) {
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
    console.log(`[LinkedIn] Post ${postId} já publicado — ignorando.`);
  }

  // ── Facebook ──────────────────────────────────────────────────
  if (!post?.facebookPublished) {
    const facebookAccounts = allAccounts.filter(
      (a: any) => a.platform === "facebook" && a.accessToken &&
        (a.linkedinUrn?.startsWith("fb:page:") || a.linkedinUrn === "fb:personal")
    );
    for (const fbAccount of facebookAccounts) {
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
    console.log(`[Facebook] Post ${postId} já publicado — ignorando.`);
  }
}

export function registerScheduledRoutes(app: Express) {

  /**
   * GET /api/scheduled/pending-posts
   *
   * 1. Filtra posts aprovados de contas INSTAGRAM (platform='instagram')
   * 2. Publica imediatamente no LinkedIn e Facebook (servidor direto, sem depender do MCP)
   * 3. Retorna os posts para o AGENT cron publicar no Instagram via MCP
   * 4. Marca mcpPending=1 para evitar dupla entrega ao Instagram
   */
  app.get("/api/scheduled/pending-posts", async (req: Request, res: Response) => {
    try {
      const user = await getUser(req);
      if (!user) return res.status(401).json({ error: "Unauthorized" });

      // Contas Instagram (inclui contas antigas sem campo platform)
      const allAccounts = await getAllAccounts() as any[];
      const instagramAccountIds = new Set(
        allAccounts
          .filter((a: any) => a.platform === "instagram" || !a.platform)
          .map((a: any) => a.id)
      );

      const approved = await getPostsByStatus("approved");
      const now = new Date();

      // Somente posts de contas Instagram, prontos para publicar
      const pendingPosts = (approved as any[]).filter((p) => {
        if (!instagramAccountIds.has(p.accountId)) return false;
        if (p.mcpPending) return false;
        if ((p.retryCount ?? 0) >= MAX_RETRIES) return false;
        if (p.nextRetryAt && new Date(p.nextRetryAt) > now) return false;
        return true;
      });

      console.log(`[ScheduledRoutes] pending-posts: ${approved.length} aprovados, ${pendingPosts.length} prontos para Instagram`);

      if (pendingPosts.length === 0) {
        return res.json({ posts: [] });
      }

      // Marcar mcpPending=1 ANTES de retornar (evita duplicata no Instagram)
      await Promise.all(pendingPosts.map((p: any) => updatePost(p.id, { mcpPending: 1 })));

      // Resolver mídias e preparar payload para o AGENT cron
      const postsWithMedia = await Promise.all(
        pendingPosts.map(async (post: any) => {
          const media = await getPostMedia(post.id);
          const mediaWithUrls = await Promise.all(
            (media as any[]).map(async (m) => ({
              ...m,
              publicUrl: await resolveMediaUrl(m.mediaUrl),
            }))
          );
          return { ...post, media: mediaWithUrls };
        })
      );

      // Publicar no LinkedIn e Facebook AGORA (independente do Instagram)
      // Executa em paralelo para todos os posts, sem bloquear a resposta ao AGENT
      Promise.all(
        postsWithMedia.map(async (post) => {
          const imageUrl = post.media?.[0]?.publicUrl;
          try {
            await publishToSocialPlatforms(post.id, post.caption || "", imageUrl);
          } catch (e: any) {
            console.error(`[ScheduledRoutes] Erro ao publicar post ${post.id} em LinkedIn/Facebook:`, e.message);
          }
        })
      ).catch((e) => console.error("[ScheduledRoutes] Erro geral LinkedIn/Facebook:", e.message));

      console.log(`[ScheduledRoutes] Retornando ${postsWithMedia.length} post(s) para o AGENT publicar no Instagram`);
      return res.json({ posts: postsWithMedia });
    } catch (err: any) {
      console.error("[ScheduledRoutes] Erro ao buscar posts pendentes:", err.message);
      return res.status(500).json({ error: err.message });
    }
  });

  /**
   * POST /api/scheduled/publish-result
   * Recebe o resultado da publicação no Instagram feita pelo AGENT cron via MCP.
   * Body: { postId, instagramPostId, permalink, success, error? }
   * Apenas atualiza o status do post — LinkedIn/Facebook já foram publicados no pending-posts.
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

      console.log(`[ScheduledRoutes] publish-result: postId=${postIdNum} success=${success} instagramPostId=${instagramPostId}`);

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
          content: `Post #${postIdNum} publicado!\nInstagram ID: ${instagramPostId}\nLink: ${permalink || "N/A"}`,
        });

        console.log(`[ScheduledRoutes] Post ${postIdNum} publicado no Instagram: ${instagramPostId}`);
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
          console.warn(`[ScheduledRoutes] Post ${postIdNum} falhou (${newRetryCount}/${MAX_RETRIES}), próxima tentativa em ${nextRetryAt.toISOString()}`);
          return res.json({ ok: false, error, willRetry: true, attempt: newRetryCount, nextRetryAt });
        } else {
          await updatePost(postIdNum, { mcpPending: 0, retryCount: newRetryCount, status: "rejected" });
          await notifyOwner({
            title: "❌ Falha ao publicar post no Instagram",
            content: `Post #${postIdNum} falhou após ${MAX_RETRIES} tentativas.\nErro: ${error || "Desconhecido"}`,
          });
          console.error(`[ScheduledRoutes] Post ${postIdNum} rejeitado após ${MAX_RETRIES} tentativas`);
          return res.json({ ok: false, error, willRetry: false, maxRetriesReached: true });
        }
      }
    } catch (err: any) {
      console.error("[ScheduledRoutes] Erro:", err.message);
      return res.status(500).json({ error: err.message });
    }
  });

  /**
   * GET /api/scheduled/insights/:instagramPostId
   * Endpoint interno: retorna likes/comments para um post do Instagram.
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
   * POST /api/scheduled/heartbeat-publish
   * Chamado pelo Heartbeat HTTP a cada 10 minutos.
   * 1. Promove posts agendados vencidos → approved
   * 2. Publica posts approved no Facebook e LinkedIn inline
   * 3. Marca posts Instagram como mcpPending=1 (AGENT cron publica via MCP)
   */
  app.post("/api/scheduled/heartbeat-publish", async (req: Request, res: Response) => {
    const start = Date.now();
    try {
      const ok = await authenticateHeartbeat(req);
      if (!ok) return res.status(403).json({ error: "cron-only" });

      // 1. Promover posts agendados vencidos
      const { getDb } = await import("./db");
      const { posts: postsTable } = await import("../drizzle/schema");
      const { eq, and, lte } = await import("drizzle-orm");
      const db = await getDb();
      let promoted = 0;
      if (db) {
        const now = new Date();
        const scheduled = await db.select().from(postsTable)
          .where(and(eq(postsTable.status, "scheduled"), lte(postsTable.scheduledAt, now)));
        for (const p of scheduled) {
          await updatePost(p.id, { status: "approved", mcpPending: 0 });
          promoted++;
        }
        if (promoted > 0) console.log(`[Heartbeat] ${promoted} post(s) promovidos scheduled→approved`);
      }

      // 2. Buscar posts approved prontos (sem mcpPending, sem retries esgotados)
      const approved = await getPostsByStatus("approved");
      const now = new Date();
      const ready = (approved as any[]).filter((p) => {
        if (p.mcpPending) return false;
        if ((p.retryCount ?? 0) >= MAX_RETRIES) return false;
        if (p.nextRetryAt && new Date(p.nextRetryAt) > now) return false;
        return true;
      });

      if (ready.length === 0) {
        return res.json({ ok: true, promoted, processed: 0, elapsed: Date.now() - start });
      }

      const allAccounts = await getAllAccounts() as any[];
      const linkedinAccounts = allAccounts.filter(
        (a: any) => a.platform === "linkedin" && a.accessToken && a.linkedinUrn
      );
      const facebookAccounts = allAccounts.filter(
        (a: any) => a.platform === "facebook" && a.accessToken &&
          (a.linkedinUrn?.startsWith("fb:page:") || a.linkedinUrn === "fb:personal")
      );

      let fbPublished = 0, liPublished = 0, igQueued = 0;

      for (const post of ready) {
        const media = await getPostMedia(post.id) as any[];
        let imageUrl: string | undefined;
        if (media?.[0]?.mediaUrl) {
          const url = media[0].mediaUrl;
          imageUrl = url.startsWith("/manus-storage/")
            ? await storageGetSignedUrl(url.replace("/manus-storage/", ""))
            : url;
        }
        const caption: string = post.caption || "";

        // LinkedIn
        if (!post.linkedinPublished) {
          for (const liAcc of linkedinAccounts) {
            try {
              const r = await publishToLinkedIn({ accessToken: liAcc.accessToken, linkedinUrn: liAcc.linkedinUrn, caption, imageUrl });
              await updatePost(post.id, { linkedinPublished: 1 });
              liPublished++;
              console.log(`[Heartbeat] Post ${post.id} → LinkedIn: ${r.postId}`);
              notifyOwner({ title: "✅ LinkedIn (heartbeat)", content: `Post #${post.id} publicado no LinkedIn.` }).catch(() => {});
            } catch (e: any) { console.error(`[Heartbeat] LinkedIn post ${post.id}:`, e.message); }
          }
        }

        // Facebook
        if (!post.facebookPublished) {
          for (const fbAcc of facebookAccounts) {
            const pageId = fbAcc.linkedinUrn.startsWith("fb:page:")
              ? fbAcc.linkedinUrn.replace("fb:page:", "") : "me";
            try {
              const r = await publishToFacebook({ pageToken: fbAcc.accessToken, pageId, caption, imageUrl });
              await updatePost(post.id, { facebookPublished: 1 });
              fbPublished++;
              console.log(`[Heartbeat] Post ${post.id} → Facebook: ${r.postId}`);
              notifyOwner({ title: "✅ Facebook (heartbeat)", content: `Post #${post.id} publicado no Facebook.` }).catch(() => {});
            } catch (e: any) { console.error(`[Heartbeat] Facebook post ${post.id}:`, e.message); }
          }
        }

        // Instagram: publicar diretamente via API Graph
        if (!post.instagramPostId) {
          const igAccounts = allAccounts.filter(
            (a: any) => a.platform === "instagram" && a.accessToken && a.linkedinUrn?.startsWith("ig:")
          );
          for (const igAcc of igAccounts) {
            const igUserId = extractIgUserId(igAcc.linkedinUrn);
            if (!igUserId || !imageUrl) {
              console.warn(`[Heartbeat] Instagram post ${post.id}: sem igUserId ou imageUrl, pulando.`);
              continue;
            }
            try {
              const r = await publishToInstagram({ igUserId, accessToken: igAcc.accessToken, caption, imageUrl });
              await updatePost(post.id, {
                instagramPostId: r.postId,
                instagramPermalink: r.permalink,
                status: "published",
                publishedAt: new Date(),
                mcpPending: 0,
              });
              igQueued++;
              console.log(`[Heartbeat] Post ${post.id} → Instagram: ${r.postId}`);
              notifyOwner({ title: "✅ Instagram (heartbeat)", content: `Post #${post.id} publicado no Instagram!\nLink: ${r.permalink}` }).catch(() => {});
            } catch (e: any) {
              console.error(`[Heartbeat] Instagram post ${post.id}:`, e.message);
            }
          }
        }
      }

      console.log(`[Heartbeat] Concluído em ${Date.now() - start}ms — promoted=${promoted} ig_queued=${igQueued} li=${liPublished} fb=${fbPublished}`);
      return res.json({ ok: true, promoted, processed: ready.length, igQueued, liPublished, fbPublished, elapsed: Date.now() - start });
    } catch (err: any) {
      console.error("[Heartbeat] Erro:", err.message);
      return res.status(500).json({ error: err.message, stack: err.stack, timestamp: new Date().toISOString() });
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
