/**
 * Publicação imediata de um único post (publishNow).
 * Caminho enxuto — sem side effects do agente completo.
 */
import { ENV, resolveIgAccessTokenFromEnv } from "./_core/env";
import { publishToInstagram } from "./autonomousAgent";
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
  uploadDataUrlToStorage,
  extractStorageKey,
  supabasePublicObjectUrl,
} from "./storage";

async function resolveImageForInstagram(postId: number, rawUrl: string): Promise<string> {
  if (rawUrl.startsWith("data:")) {
    console.log(`[PublishNow] Post ${postId}: data URL → Supabase`);
    const publicUrl = await uploadDataUrlToStorage(rawUrl, "published");
    await updateFirstPostMediaUrl(postId, publicUrl);
    return publicUrl;
  }

  const key = extractStorageKey(rawUrl);
  if (key) {
    return supabasePublicObjectUrl(key);
  }

  if (rawUrl.startsWith("http://") || rawUrl.startsWith("https://")) {
    return rawUrl;
  }

  if (rawUrl.startsWith("/storage/") || rawUrl.startsWith("/manus-storage/")) {
    const k = rawUrl.replace(/^\/(?:storage|manus-storage)\//, "");
    return supabasePublicObjectUrl(k);
  }

  throw new Error(`URL de imagem inválida: ${rawUrl.slice(0, 80)}`);
}

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

  try {
    const imageUrl = await resolveImageForInstagram(postId, media[0].mediaUrl);
    console.log(`[PublishNow] Post ${postId} imageUrl=${imageUrl.slice(0, 100)}... token=${tokenSource}`);

    const igRes = await publishToInstagram({
      igUserId,
      accessToken: envIgToken,
      caption: post.caption ?? "",
      imageUrl,
    });

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
    const msg = formatFetchError(err, `Post ${postId}`);
    console.error(`[PublishNow] Falha post ${postId}:`, msg);

    await updatePost(postId, { mcpPending: 0, retryCount: attempt }).catch(() => {});
    await createPublicationLog({ postId, attempt, status: "failed", error: msg }).catch(() => {});

    return { success: false, published: false, message: msg };
  }
}
