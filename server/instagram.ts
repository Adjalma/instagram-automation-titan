/**
 * instagram.ts — Helpers de integração com Instagram.
 *
 * Publicação e insights via Instagram Graph API (agente autônomo interno).
 */

import { getPostsByStatus, updatePost } from "./db";
import { ENV } from "./_core/env";

const IG_GRAPH = "https://graph.facebook.com/v19.0";

/**
 * Verifica posts agendados vencidos e os move para "approved"
 * para publicação pelo agente autônomo.
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
 * Busca métricas de um post publicado via Graph API.
 */
export async function fetchPostInsights(
  instagramPostId: string,
  accessToken?: string
): Promise<{
  likes?: number;
  comments?: number;
  reach?: number;
  impressions?: number;
}> {
  const token = accessToken || ENV.igAccessToken;
  if (!token) {
    console.warn("[Instagram] fetchPostInsights: token não configurado");
    return {};
  }

  try {
    const mediaRes = await fetch(
      `${IG_GRAPH}/${instagramPostId}?fields=like_count,comments_count&access_token=${encodeURIComponent(token)}`
    );
    if (!mediaRes.ok) {
      const err = await mediaRes.text();
      console.warn(`[Instagram] fetchPostInsights media: ${mediaRes.status} ${err.slice(0, 200)}`);
      return {};
    }
    const media = (await mediaRes.json()) as { like_count?: number; comments_count?: number };

    let reach: number | undefined;
    let impressions: number | undefined;
    const insightsRes = await fetch(
      `${IG_GRAPH}/${instagramPostId}/insights?metric=reach,impressions&access_token=${encodeURIComponent(token)}`
    );
    if (insightsRes.ok) {
      const insightsData = (await insightsRes.json()) as { data?: { name: string; values: { value: number }[] }[] };
      for (const metric of insightsData.data ?? []) {
        const val = metric.values?.[0]?.value;
        if (metric.name === "reach") reach = val;
        if (metric.name === "impressions") impressions = val;
      }
    }

    return {
      likes: media.like_count,
      comments: media.comments_count,
      reach,
      impressions,
    };
  } catch (err: any) {
    console.warn("[Instagram] fetchPostInsights erro:", err?.message);
    return {};
  }
}
