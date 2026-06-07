/**
 * Publicação imediata de um único post (publishNow).
 * Caminho enxuto — sem side effects do agente completo.
 */
import { ENV, resolveIgAccessTokenFromEnv } from "./_core/env";
import { publishToInstagram, publishToInstagramFromBuffer } from "./autonomousAgent";
import {
  getPostById,
  getPostMedia,
  updatePost,
  updateFirstPostMediaUrl,
  createPublicationLog,
  getPublicationLogsByPost,
} from "./db";
import { formatFetchError } from "./httpFetch";
import {
  parseDataUrlBuffer,
  getInstagramAccessibleUrl,
  uploadDataUrlToStorage,
} from "./storage";

export async function publishPostNow(postId: number): Promise<{
  success: boolean;
  published: boolean;
  permalink?: string;
  message: string;
}> {
  const post = await getPostById(postId);
  if (!post) {
    return { success: false, published: false, message: "Post não encontrado" };
  }

  await updatePost(postId, {
    status: "approved",
    mcpPending: 0,
    retryCount: 0,
    nextRetryAt: null,
  });

  const { token: envIgToken, source: tokenSource } = resolveIgAccessTokenFromEnv();
  const igUserId = ENV.igUserId?.trim();
  if (!envIgToken) {
    return {
      success: false,
      published: false,
      message: "IG_ACCESS_TOKEN não configurado no Vercel (Production).",
    };
  }
  if (!igUserId) {
    return {
      success: false,
      published: false,
      message: "IG_USER_ID não configurado no Vercel. Use 17841477720751822.",
    };
  }

  const media = await getPostMedia(postId);
  if (!media?.length || !media[0]?.mediaUrl) {
    return {
      success: false,
      published: false,
      message: "Post sem imagem — Instagram exige pelo menos uma imagem.",
    };
  }

  await updatePost(postId, { mcpPending: 1 });

  const prevLogs = await getPublicationLogsByPost(postId);
  const attempt = prevLogs.length + 1;
  const rawUrl = media[0].mediaUrl;

  try {
    let igRes;

    if (rawUrl.startsWith("data:")) {
      // Upload direto para Meta — não depende do Supabase (post legado)
      console.log(`[PublishNow] Post ${postId}: data URL → upload direto Meta (token=${tokenSource})`);
      const { buffer, mimeType } = parseDataUrlBuffer(rawUrl);
      igRes = await publishToInstagramFromBuffer({
        igUserId,
        accessToken: envIgToken,
        caption: post.caption ?? "",
        buffer,
        mimeType,
      });
      // Backup opcional no Supabase (não bloqueia publicação)
      void uploadDataUrlToStorage(rawUrl, "published")
        .then(({ displayUrl }) => updateFirstPostMediaUrl(postId, displayUrl))
        .catch((e) => console.warn(`[PublishNow] Supabase backup post ${postId}:`, e instanceof Error ? e.message : e));
    } else {
      const imageUrl = await getInstagramAccessibleUrl(rawUrl);
      console.log(`[PublishNow] Post ${postId} imageUrl=${imageUrl.slice(0, 100)}... token=${tokenSource}`);
      igRes = await publishToInstagram({
        igUserId,
        accessToken: envIgToken,
        caption: post.caption ?? "",
        imageUrl,
      });
    }

    await updatePost(postId, {
      status: "published",
      publishedAt: new Date(),
      instagramPostId: igRes.postId,
      instagramPermalink: igRes.permalink,
      mcpPending: 0,
      retryCount: 0,
    });

    await createPublicationLog({
      postId,
      attempt,
      status: "success",
      instagramPostId: igRes.postId,
      permalink: igRes.permalink,
    });

    return {
      success: true,
      published: true,
      permalink: igRes.permalink,
      message: "Post publicado no Instagram com sucesso!",
    };
  } catch (err: unknown) {
    const raw = err instanceof Error ? err.message : String(err);
    const msg =
      /Instagram|Supabase|upload|imagem|token|data URL|rupload|resumable/i.test(raw)
        ? raw.startsWith(`Post ${postId}`) ? raw : `Post ${postId}: ${raw}`
        : formatFetchError(err, `Post ${postId}`);
    console.error(`[PublishNow] Falha post ${postId}:`, msg);

    await updatePost(postId, { mcpPending: 0, retryCount: attempt }).catch(() => {});
    await createPublicationLog({ postId, attempt, status: "failed", error: msg }).catch(() => {});

    return { success: false, published: false, message: msg };
  }
}
