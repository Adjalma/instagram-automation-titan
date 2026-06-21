/**
 * instagram.ts — Publicação direta no Instagram via API Graph do Meta.
 *
 * Fluxo de 2 etapas:
 * 1. POST /{ig-user-id}/media  → cria container (retorna creation_id)
 * 2. POST /{ig-user-id}/media_publish  → publica o container
 *
 * O campo linkedinUrn da conta Instagram deve ter formato "ig:{igUserId}",
 * ex: "ig:17841477720751822"
 */
import { getPostsByStatus, updatePost } from "./db";

const GRAPH_BASE = "https://graph.facebook.com/v19.0";

export interface InstagramPublishOptions {
  /** Instagram Business Account ID (ex: "17841477720751822") */
  igUserId: string;
  /** Token de acesso com instagram_content_publish */
  accessToken: string;
  /** Legenda do post */
  caption: string;
  /** URL pública da imagem */
  imageUrl: string;
}

export interface InstagramPublishResult {
  postId: string;
  permalink?: string;
}

/**
 * Publica uma imagem no Instagram via API Graph.
 * Retorna o ID do post publicado.
 */
export async function publishToInstagram(
  opts: InstagramPublishOptions
): Promise<InstagramPublishResult> {
  const { igUserId, accessToken, caption, imageUrl } = opts;

  // Etapa 1: criar container de mídia
  const createRes = await fetch(
    `${GRAPH_BASE}/${igUserId}/media`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        image_url: imageUrl,
        caption,
        access_token: accessToken,
      }),
    }
  );
  const createData = await createRes.json() as any;
  if (!createRes.ok || createData.error) {
    throw new Error(
      `[Instagram] Falha ao criar container: ${JSON.stringify(createData.error ?? createData)}`
    );
  }
  const creationId: string = createData.id;
  console.log(`[Instagram] Container criado: ${creationId}`);

  // Aguardar 2s para o container ficar pronto
  await new Promise((r) => setTimeout(r, 2000));

  // Etapa 2: publicar o container
  const publishRes = await fetch(
    `${GRAPH_BASE}/${igUserId}/media_publish`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        creation_id: creationId,
        access_token: accessToken,
      }),
    }
  );
  const publishData = await publishRes.json() as any;
  if (!publishRes.ok || publishData.error) {
    throw new Error(
      `[Instagram] Falha ao publicar container: ${JSON.stringify(publishData.error ?? publishData)}`
    );
  }
  const postId: string = publishData.id;
  console.log(`[Instagram] Post publicado: ${postId}`);

  return { postId, permalink: `https://www.instagram.com/p/${postId}/` };
}

/**
 * Extrai o Instagram Business Account ID do campo linkedinUrn.
 * Formato esperado: "ig:17841477720751822"
 */
export function extractIgUserId(linkedinUrn: string): string | null {
  if (linkedinUrn?.startsWith("ig:")) return linkedinUrn.replace("ig:", "");
  return null;
}

/**
 * Verifica posts agendados vencidos e os move para "approved".
 */
export async function processScheduledPosts(): Promise<{
  processed: number;
  promoted: number;
  errors: string[];
}> {
  const scheduledPosts = await getPostsByStatus("scheduled");
  const now = new Date();
  let processed = 0;
  let promoted = 0;
  const errors: string[] = [];
  for (const post of scheduledPosts as any[]) {
    if (post.scheduledAt && new Date(post.scheduledAt) <= now) {
      processed++;
      try {
        await updatePost(post.id, { status: "approved", mcpPending: 0 });
        promoted++;
        console.log(`[Instagram] Post ${post.id} movido para fila de publicação.`);
      } catch (err: any) {
        errors.push(`Post ${post.id}: ${err.message}`);
      }
    }
  }
  return { processed, promoted, errors };
}

/**
 * Busca insights de um post publicado no Instagram via API Graph.
 */
export async function fetchPostInsights(
  igUserId: string,
  accessToken: string,
  instagramPostId: string
): Promise<{ likes?: number; comments?: number; reach?: number; impressions?: number }> {
  try {
    const res = await fetch(
      `${GRAPH_BASE}/${instagramPostId}/insights?metric=impressions,reach,likes,comments_count&access_token=${accessToken}`
    );
    const data = await res.json() as any;
    if (data.error) return {};
    const metrics: Record<string, number> = {};
    for (const item of data.data ?? []) {
      metrics[item.name] = item.values?.[0]?.value ?? 0;
    }
    return {
      impressions: metrics.impressions,
      reach: metrics.reach,
      likes: metrics.likes,
      comments: metrics.comments_count,
    };
  } catch {
    return {};
  }
}
