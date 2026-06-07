/**
 * Agente Autônomo — Triarc Social Manager
 *
 * Funcionalidades:
 *  1. Publica posts aprovados no Instagram via Graph API
 *  2. Responde comentários automaticamente (Instagram, Facebook, LinkedIn)
 *  3. Aceita convites de conexão no LinkedIn
 *  4. Envia até 100 solicitações de conexão por dia no LinkedIn
 *  5. Monitora engajamento e ajusta horários de publicação
 */

import { ENV, resolveIgAccessTokenFromEnv } from "./_core/env";
import { invokeLLM } from "./_core/llm";
import { notifyOwner } from "./_core/notification";
import {
  getAllAccounts, getAllPosts, getPostsByStatus, getPostById, getPostMedia, updateFirstPostMediaUrl,
  updatePost, createPublicationLog, getPublicationLogsByPost,
} from "./db";
import { publishToLinkedIn } from "./linkedin";
import { publishToFacebook } from "./facebook";
import { uploadDataUrlToStorage, getInstagramAccessibleUrl } from "./storage";
import { fetchWithRetry } from "./httpFetch";

const IG_GRAPH = "https://graph.facebook.com/v21.0";

/** URL que os servidores da Meta conseguem baixar (HTTPS direto, sem redirect do app). */
async function resolveMediaUrlForInstagram(mediaUrl: string): Promise<string> {
  if (mediaUrl.startsWith("data:")) {
    throw new Error("Imagem em data URL — use Publicar Agora para converter automaticamente");
  }
  return getInstagramAccessibleUrl(mediaUrl);
}
const LI_API = "https://api.linkedin.com/v2";

// ─── Instagram Graph API ─────────────────────────────────────────────────────

export async function publishToInstagram(params: {
  igUserId: string;
  accessToken: string;
  caption: string;
  imageUrl?: string;
}): Promise<{ postId: string; permalink: string }> {
  const { igUserId, accessToken, caption, imageUrl } = params;

  if (!imageUrl) {
    throw new Error("Instagram requer pelo menos uma imagem");
  }

  const containerBody: Record<string, string> = {
    caption,
    access_token: accessToken,
    image_url: imageUrl,
  };

  const containerRes = await fetchWithRetry(
    `${IG_GRAPH}/${igUserId}/media`,
    {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(containerBody).toString(),
      timeoutMs: 90_000,
    },
    "Instagram criar container"
  );

  if (!containerRes.ok) {
    const err = await containerRes.text();
    throw new Error(`Instagram container (${containerRes.status}): ${err.slice(0, 300)}`);
  }

  const { id: creationId } = (await containerRes.json()) as { id: string };

  const publishRes = await fetchWithRetry(
    `${IG_GRAPH}/${igUserId}/media_publish`,
    {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ creation_id: creationId, access_token: accessToken }).toString(),
      timeoutMs: 90_000,
    },
    "Instagram publicar"
  );

  if (!publishRes.ok) {
    const err = await publishRes.text();
    throw new Error(`Instagram publish (${publishRes.status}): ${err.slice(0, 300)}`);
  }

  const { id: mediaId } = (await publishRes.json()) as { id: string };
  const permalink = `https://www.instagram.com/p/${mediaId}/`;
  return { postId: mediaId, permalink };
}

// ─── Instagram Comments ───────────────────────────────────────────────────────

async function fetchIgComments(mediaId: string, accessToken: string): Promise<Array<{ id: string; text: string; username: string }>> {
  const res = await fetch(
    `${IG_GRAPH}/${mediaId}/comments?fields=id,text,username,timestamp&access_token=${accessToken}`
  );
  if (!res.ok) return [];
  const data = (await res.json()) as any;
  return data.data ?? [];
}

async function replyIgComment(commentId: string, message: string, accessToken: string): Promise<void> {
  await fetch(`${IG_GRAPH}/${commentId}/replies`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ message, access_token: accessToken }).toString(),
  });
}

async function autoReplyIgComments(igUserId: string, accessToken: string, postCaption: string): Promise<void> {
  // Get recent media
  const mediaRes = await fetch(
    `${IG_GRAPH}/${igUserId}/media?fields=id,timestamp&limit=10&access_token=${accessToken}`
  );
  if (!mediaRes.ok) return;
  const media = ((await mediaRes.json()) as any).data ?? [];

  for (const post of media) {
    const comments = await fetchIgComments(post.id, accessToken);
    for (const comment of comments) {
      if (!comment.text || comment.username?.toLowerCase().includes("triarc")) continue;

      try {
        const res = await invokeLLM({
          messages: [
            {
              role: "system",
              content: `Você é o social media manager da Triarc Solutions. Responda comentários de forma profissional, amigável e autêntica. Nunca mencione que é IA. Resposta curta (máximo 2 frases). Contexto do post: ${postCaption?.slice(0, 200)}`,
            },
            { role: "user", content: `Comentário de @${comment.username}: "${comment.text}"` },
          ],
        });
        const reply = res.choices?.[0]?.message?.content?.trim();
        if (reply) {
          await replyIgComment(comment.id, reply, accessToken);
          console.log(`[IG] Respondido @${comment.username}: ${reply.slice(0, 60)}...`);
        }
      } catch (e: any) {
        console.warn(`[IG] Falha ao responder comentário ${comment.id}:`, e.message);
      }
    }
  }
}

// ─── Facebook Comments ────────────────────────────────────────────────────────

async function autoReplyFbComments(pageId: string, pageToken: string): Promise<void> {
  const postsRes = await fetch(
    `https://graph.facebook.com/v19.0/${pageId}/posts?fields=id,message&limit=10&access_token=${pageToken}`
  );
  if (!postsRes.ok) return;
  const fbPosts = ((await postsRes.json()) as any).data ?? [];

  for (const post of fbPosts) {
    const commentsRes = await fetch(
      `https://graph.facebook.com/v19.0/${post.id}/comments?fields=id,message,from&access_token=${pageToken}`
    );
    if (!commentsRes.ok) continue;
    const comments = ((await commentsRes.json()) as any).data ?? [];

    for (const comment of comments) {
      if (!comment.message) continue;

      try {
        const res = await invokeLLM({
          messages: [
            {
              role: "system",
              content: `Você é o social media manager da Triarc Solutions. Responda comentários de forma profissional e amigável. Resposta curta (máximo 2 frases).`,
            },
            { role: "user", content: `Comentário de ${comment.from?.name ?? "alguém"}: "${comment.message}"` },
          ],
        });
        const reply = res.choices?.[0]?.message?.content?.trim();
        if (reply) {
          await fetch(`https://graph.facebook.com/v19.0/${comment.id}/comments`, {
            method: "POST",
            headers: { "content-type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({ message: reply, access_token: pageToken }).toString(),
          });
          console.log(`[FB] Respondido ${comment.from?.name}: ${reply.slice(0, 60)}...`);
        }
      } catch (e: any) {
        console.warn(`[FB] Falha ao responder comentário ${comment.id}:`, e.message);
      }
    }
  }
}

// ─── LinkedIn Connections ────────────────────────────────────────────────────

export async function acceptLinkedInInvitations(accessToken: string): Promise<number> {
  let accepted = 0;
  try {
    const res = await fetch(`${LI_API}/invitations?invitationType=CONNECTION`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) return 0;
    const data = (await res.json()) as any;
    const invitations = data.elements ?? [];

    for (const inv of invitations.slice(0, 20)) {
      try {
        await fetch(`${LI_API}/invitations/${inv.entityUrn}?action=accept`, {
          method: "POST",
          headers: { Authorization: `Bearer ${accessToken}`, "content-type": "application/json" },
        });
        accepted++;
      } catch { /* skip individual failures */ }
    }
  } catch (e: any) {
    console.warn("[LinkedIn] Falha ao aceitar convites:", e.message);
  }
  console.log(`[LinkedIn] Aceitos ${accepted} convites de conexão`);
  return accepted;
}

export async function sendLinkedInConnectionRequests(
  accessToken: string,
  dailyLimit = 100
): Promise<number> {
  let sent = 0;
  try {
    // Search for people in tech/business in Brazil
    const searches = [
      "CTO Brasil tecnologia",
      "CEO startup inovação",
      "Gerente TI",
      "Desenvolvedor software",
    ];

    for (const query of searches) {
      if (sent >= dailyLimit) break;

      const searchRes = await fetch(
        `${LI_API}/search/blended?keywords=${encodeURIComponent(query)}&origin=GLOBAL_SEARCH_HEADER&q=blended&start=0&count=25`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (!searchRes.ok) continue;

      const data = (await searchRes.json()) as any;
      const people = (data.elements ?? [])
        .filter((e: any) => e["$type"]?.includes("MiniProfile"))
        .slice(0, Math.floor(dailyLimit / searches.length));

      for (const person of people) {
        if (sent >= dailyLimit) break;
        try {
          const profileUrn = person.objectUrn;
          if (!profileUrn) continue;

          await fetch(`${LI_API}/invitations`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "content-type": "application/json",
              "x-restli-protocol-version": "2.0.0",
            },
            body: JSON.stringify({
              invitee: {
                "com.linkedin.voyager.growth.invitation.InviteeProfile": {
                  profileId: person.publicIdentifier,
                },
              },
              message: "Olá! Sou da Triarc Solutions, empresa de tecnologia e inovação. Seria um prazer conectarmos!",
            }),
          });
          sent++;
          await new Promise(r => setTimeout(r, 2000)); // Rate limiting
        } catch { /* skip individual failures */ }
      }
    }
  } catch (e: any) {
    console.warn("[LinkedIn] Falha ao enviar convites:", e.message);
  }
  console.log(`[LinkedIn] Enviados ${sent} convites de conexão`);
  return sent;
}

// ─── AI Decision: Melhor horário de publicação ────────────────────────────────

export async function decideBestPostingTime(): Promise<{ hour: number; minute: number; reason: string }> {
  const res = await invokeLLM({
    messages: [
      {
        role: "system",
        content: "Você é um especialista em social media marketing no Brasil. Responda apenas com JSON.",
      },
      {
        role: "user",
        content: `Com base em dados de engajamento de empresas B2B de tecnologia no Brasil, qual o MELHOR horário para postar agora (${new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })})? Considere dia da semana, horário comercial e hábitos de uso de redes sociais no Brasil.

Responda: {"hour": 18, "minute": 0, "reason": "explicação curta"}`,
      },
    ],
    response_format: { type: "json_object" },
  });

  try {
    const raw = res.choices?.[0]?.message?.content ?? "{}";
    return JSON.parse(raw);
  } catch {
    return { hour: 18, minute: 0, reason: "Horário padrão de alto engajamento" };
  }
}

// ─── Loop principal do agente autônomo ───────────────────────────────────────

const MAX_RETRIES = 3;
let dailyConnectionsSent = 0;
let lastConnectionReset = new Date().toDateString();

export async function runAutonomousAgent(options?: {
  /** Publicar só este post (publishNow) — evita timeout e side effects */
  postId?: number;
}): Promise<{
  postsPublished: number;
  commentsReplied: number;
  connectionsAccepted: number;
  connectionsSent: number;
  errors: string[];
}> {
  const result = { postsPublished: 0, commentsReplied: 0, connectionsAccepted: 0, connectionsSent: 0, errors: [] as string[] };

  // Reset daily connection counter
  if (new Date().toDateString() !== lastConnectionReset) {
    dailyConnectionsSent = 0;
    lastConnectionReset = new Date().toDateString();
  }

  const allAccounts = await getAllAccounts() as any[];

  // ── 1. Publicar posts aprovados ───────────────────────────────
  const now = new Date();
  let approved: any[];

  if (options?.postId) {
    const post = await getPostById(options.postId) as any;
    approved = post ? [post] : [];
    if (post?.mcpPending) {
      await updatePost(post.id, { mcpPending: 0 });
      post.mcpPending = 0;
      console.log(`[Agent] Post ${post.id}: mcpPending resetado (publishNow)`);
    }
  } else {
    approved = await getPostsByStatus("approved") as any[];
    for (const post of approved) {
      if (post.mcpPending && post.updatedAt) {
        const stuckMs = now.getTime() - new Date(post.updatedAt).getTime();
        if (stuckMs > 5 * 60 * 1000) {
          await updatePost(post.id, { mcpPending: 0 });
          post.mcpPending = 0;
          console.log(`[Agent] Post ${post.id}: mcpPending resetado (travado há ${Math.round(stuckMs / 60000)}min)`);
        }
      }
    }
  }

  const readyPosts = approved.filter((p: any) => {
    if (options?.postId && p.id !== options.postId) return false;
    if (p.mcpPending) return false;
    if ((p.retryCount ?? 0) >= MAX_RETRIES) return false;
    if (p.nextRetryAt && new Date(p.nextRetryAt) > now) return false;
    return true;
  });

  for (const post of readyPosts) {
    await updatePost(post.id, { mcpPending: 1 });

    const media = await getPostMedia(post.id) as any[];
    const rawImageUrl = media?.[0]?.mediaUrl || undefined;
    let imageUrl: string | undefined;
    try {
      if (rawImageUrl?.startsWith("data:")) {
        console.log(`[Agent] Post ${post.id}: convertendo data URL → Supabase`);
        const { signedUrl, displayUrl } = await uploadDataUrlToStorage(rawImageUrl, "published");
        await updateFirstPostMediaUrl(post.id, displayUrl);
        imageUrl = signedUrl;
      } else if (rawImageUrl) {
        imageUrl = await resolveMediaUrlForInstagram(rawImageUrl);
      }
    } catch (imgErr: any) {
      await updatePost(post.id, { mcpPending: 0 });
      result.errors.push(`Post ${post.id}: ${imgErr.message}`);
      continue;
    }

    // Encontra conta Instagram vinculada ao post (banco ou env var)
    const igAccount = allAccounts.find(
      (a: any) => a.id === post.accountId && a.platform === "instagram" && a.accessToken
    ) ?? allAccounts.find((a: any) => a.platform === "instagram" && a.accessToken);

    // Page token no Vercel (IG_ACCESS_TOKEN, FB_PAGE_TOKEN, etc.) — ignora OAuth Contas
    const { token: envIgToken, source: envTokenSource } = resolveIgAccessTokenFromEnv();
    const useEnvToken = Boolean(envIgToken);
    const igToken = useEnvToken ? envIgToken : (igAccount?.accessToken || "");
    if (!igToken) {
      console.warn(`[Agent] Post ${post.id}: sem token Instagram — configure IG_ACCESS_TOKEN ou conecte em Contas`);
      await updatePost(post.id, { mcpPending: 0 });
      result.errors.push(`Post ${post.id}: sem token Instagram`);
      continue;
    }

    const igUserId = useEnvToken && ENV.igUserId
      ? ENV.igUserId
      : igAccount?.linkedinUrn?.startsWith("ig:")
        ? igAccount.linkedinUrn.replace("ig:", "")
        : ENV.igUserId;

    if (!igUserId) {
      console.warn(`[Agent] Post ${post.id}: IG_USER_ID não configurado`);
      await updatePost(post.id, { mcpPending: 0 });
      result.errors.push(`Post ${post.id}: IG_USER_ID não configurado`);
      continue;
    }

    const prevLogs = await getPublicationLogsByPost(post.id);
    const attempt = prevLogs.length + 1;

    try {
      const igRes = await publishToInstagram({
        igUserId,
        accessToken: igToken,
        caption: post.caption ?? "",
        imageUrl,
      });

      await updatePost(post.id, {
        status: "published",
        publishedAt: new Date(),
        instagramPostId: igRes.postId,
        instagramPermalink: igRes.permalink,
        mcpPending: 0,
        retryCount: 0,
      });

      await createPublicationLog({ postId: post.id, attempt, status: "success", instagramPostId: igRes.postId, permalink: igRes.permalink });

      await notifyOwner({ title: "✅ Post publicado no Instagram", content: `Post #${post.id}: ${igRes.permalink}` });

      result.postsPublished++;
      console.log(`[Agent] Post ${post.id} publicado no Instagram: ${igRes.permalink}`);

      if (!options?.postId) {
        await publishToOtherPlatforms(post.id, post.caption ?? "", imageUrl, allAccounts);
      }

    } catch (err: any) {
      const tokenHint = useEnvToken
        ? ` (token: env ${envTokenSource ?? "?"})`
        : " (token: Contas OAuth)";
      const errMsg = `${err.message}${tokenHint}`;
      await createPublicationLog({ postId: post.id, attempt, status: "failed", error: errMsg });

      if (attempt >= MAX_RETRIES) {
        await updatePost(post.id, { status: "rejected", mcpPending: 0, retryCount: attempt });
        await notifyOwner({ title: "❌ Falha ao publicar", content: `Post #${post.id} falhou após ${MAX_RETRIES} tentativas: ${err.message}` });
      } else {
        const nextRetryAt = new Date(Date.now() + 5 * 60 * 1000);
        await updatePost(post.id, { mcpPending: 0, retryCount: attempt, nextRetryAt });
      }

      result.errors.push(`Post ${post.id}: ${err.message}`);
      console.error(`[Agent] Falha ao publicar post ${post.id}:`, err.message);
    }
  }

  if (!options?.postId) {
  // ── 2. Responder comentários ─────────────────────────────────
  const igAccount = allAccounts.find((a: any) => a.platform === "instagram" && a.accessToken);
  const { token: envIgTokenForComments } = resolveIgAccessTokenFromEnv();
  const igToken = envIgTokenForComments || igAccount?.accessToken;
  if (igToken && ENV.igUserId) {
    try {
      await autoReplyIgComments(ENV.igUserId, igToken, "Triarc Solutions");
    } catch (e: any) {
      result.errors.push(`IG comments: ${e.message}`);
    }
  }

  // Facebook — usa conta do banco ou env vars
  const fbAccounts = allAccounts.filter((a: any) => a.platform === "facebook" && a.accessToken && a.linkedinUrn);
  if (fbAccounts.length > 0) {
    for (const fbAcc of fbAccounts) {
      const pageId = fbAcc.linkedinUrn.startsWith("fb:page:")
        ? fbAcc.linkedinUrn.replace("fb:page:", "")
        : null;
      if (!pageId) continue;
      try {
        await autoReplyFbComments(pageId, fbAcc.accessToken);
      } catch (e: any) {
        result.errors.push(`FB comments: ${e.message}`);
      }
    }
  } else if (ENV.fbPageToken && ENV.fbPageId) {
    try {
      await autoReplyFbComments(ENV.fbPageId, ENV.fbPageToken);
    } catch (e: any) {
      result.errors.push(`FB comments: ${e.message}`);
    }
  }

  // ── 3. LinkedIn: aceitar convites e enviar solicitações ───────
  const liAccount = allAccounts.find((a: any) => a.platform === "linkedin" && a.accessToken);
  const liToken = liAccount?.accessToken || ENV.liAccessToken;
  if (liToken) {
    try {
      result.connectionsAccepted = await acceptLinkedInInvitations(liToken);
    } catch (e: any) {
      result.errors.push(`LI accept: ${e.message}`);
    }

    if (dailyConnectionsSent < 100) {
      try {
        const toSend = 100 - dailyConnectionsSent;
        const sent = await sendLinkedInConnectionRequests(liToken, toSend);
        dailyConnectionsSent += sent;
        result.connectionsSent = sent;
      } catch (e: any) {
        result.errors.push(`LI connections: ${e.message}`);
      }
    }
  }
  }

  console.log(`[Agent] Ciclo completo: ${result.postsPublished} publicados, ${result.connectionsAccepted} convites aceitos, ${result.connectionsSent} solicitações enviadas`);
  return result;
}

async function publishToOtherPlatforms(postId: number, caption: string, imageUrl: string | undefined, allAccounts: any[]) {
  const liAccounts = allAccounts.filter((a: any) => a.platform === "linkedin" && a.accessToken && a.linkedinUrn);
  for (const liAcc of liAccounts) {
    try {
      const res = await publishToLinkedIn({ accessToken: liAcc.accessToken, linkedinUrn: liAcc.linkedinUrn, caption, imageUrl });
      await updatePost(postId, { linkedinPublished: 1 });
      console.log(`[Agent] Post ${postId} publicado no LinkedIn: ${res.permalink}`);
    } catch (e: any) {
      console.error(`[Agent] LinkedIn falhou para post ${postId}:`, e.message);
    }
  }

  const fbAccounts = allAccounts.filter((a: any) => a.platform === "facebook" && a.accessToken && a.linkedinUrn);
  for (const fbAcc of fbAccounts) {
    const pageId = fbAcc.linkedinUrn.startsWith("fb:page:")
      ? fbAcc.linkedinUrn.replace("fb:page:", "")
      : "me";
    try {
      const res = await publishToFacebook({ pageToken: fbAcc.accessToken, pageId, caption, imageUrl });
      await updatePost(postId, { facebookPublished: 1 });
      console.log(`[Agent] Post ${postId} publicado no Facebook: ${res.permalink}`);
    } catch (e: any) {
      console.error(`[Agent] Facebook falhou para post ${postId}:`, e.message);
    }
  }
}
