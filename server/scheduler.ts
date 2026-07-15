/**
 * Scheduler — agendador periódico do Triarc Social Manager.
 *
 * Responsabilidades:
 * 1. Mover posts agendados vencidos para status "approved" (a cada 5 min)
 * 2. Executar pesquisa de notícias por tópico no horário configurado (publishHour, Brasília)
 * 3. Sincronizar insights (likes/comments) do Instagram às 3h Brasília
 * 4. Alertar sobre tokens expirados via notificação ao owner
 */

import { getPostsByStatus, updatePost, getAllAccounts, getDb } from "./db";
import { researchTopics, researchRuns, posts, postMedia } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { invokeLLM } from "./_core/llm";
import { generateImage } from "./_core/imageGeneration";
import { refreshFacebookTokensIfNeeded } from "./facebook";
import { notifyOwner } from "./_core/notification";
import { ENV } from "./_core/env";

const INTERVAL_MS = parseInt(process.env.SCHEDULER_INTERVAL_MS || "300000", 10);
const TZ_OFFSET = -3; // America/Sao_Paulo (UTC-3)

let schedulerHandle: ReturnType<typeof setInterval> | null = null;
// Controla quais tópicos já rodaram hoje: Set de "topicId:YYYY-MM-DD"
const ranToday: Set<string> = new Set();
// Controla tarefas diárias únicas: Set de "task:YYYY-MM-DD"
const dailyTasks: Set<string> = new Set();

// ─── Posts agendados ──────────────────────────────────────────────────────────
async function promoteScheduledPosts() {
  try {
    const scheduledPosts = await getPostsByStatus("scheduled");
    const now = new Date();
    let promoted = 0;
    for (const post of scheduledPosts as any[]) {
      if (post.scheduledAt && new Date(post.scheduledAt) <= now) {
        await updatePost(post.id, { status: "approved", mcpPending: 0 });
        promoted++;
        console.log(`[Scheduler] Post ${post.id} movido para fila de publicação.`);
      }
    }
    if (promoted > 0) console.log(`[Scheduler] ${promoted} post(s) promovidos.`);
  } catch (err: any) {
    console.error("[Scheduler] Erro ao verificar posts agendados:", err?.message);
  }
}

// ─── Helpers de data/hora ─────────────────────────────────────────────────────
function getBrasiliaDateHour(): { date: string; hour: number } {
  const now = new Date();
  const brasiliaMs = now.getTime() + TZ_OFFSET * 3600000;
  const brasilia = new Date(brasiliaMs);
  const date = brasilia.toISOString().split("T")[0];
  const hour = brasilia.getUTCHours();
  return { date, hour };
}

// ─── Sync automático de insights ─────────────────────────────────────────────
async function syncInsightsDaily(date: string) {
  const key = `syncInsights:${date}`;
  if (dailyTasks.has(key)) return;
  dailyTasks.add(key);

  console.log("[Insights] Iniciando sync automático de insights...");
  try {
    const { fetchPostInsights } = await import("./instagram");
    const published = await getPostsByStatus("published");
    // Apenas IDs numéricos são válidos na Graph API
    const postsWithId = (published as any[]).filter(
      (p: any) => p.instagramPostId && /^\d+$/.test(p.instagramPostId)
    );

    const accounts = await getAllAccounts() as any[];
    const igAccount = accounts.find((a: any) => a.platform === "instagram");
    if (!igAccount?.accessToken) {
      console.warn("[Insights] Conta Instagram sem token — sync ignorado.");
      return;
    }

    let updated = 0;
    for (const post of postsWithId) {
      try {
        const insights = await fetchPostInsights(
          igAccount.linkedinUrn?.replace("ig:", "") ?? igAccount.id.toString(),
          igAccount.accessToken,
          post.instagramPostId
        );
        if (insights.likes !== undefined || insights.comments !== undefined) {
          await updatePost(post.id, {
            likes: insights.likes ?? Number(post.likes ?? 0),
            comments: insights.comments ?? Number(post.comments ?? 0),
          });
          updated++;
        }
      } catch {
        // ignorar erros individuais — não interrompe o loop
      }
    }
    console.log(`[Insights] Sync concluído: ${updated}/${postsWithId.length} posts atualizados.`);
  } catch (err: any) {
    console.error("[Insights] Erro no sync automático:", err?.message);
  }
}

// ─── Verificar tokens expirados ───────────────────────────────────────────────
async function checkExpiredTokens(date: string) {
  const key = `checkTokens:${date}`;
  if (dailyTasks.has(key)) return;
  dailyTasks.add(key);

  try {
    const accounts = await getAllAccounts() as any[];
    const now = new Date();
    const expired: string[] = [];

    for (const acc of accounts) {
      if (acc.tokenExpiresAt && new Date(acc.tokenExpiresAt) < now) {
        expired.push(`${acc.platform ?? "instagram"}: @${acc.handle}`);
      }
    }

    if (expired.length > 0) {
      const msg = `⚠️ Tokens expirados detectados:\n${expired.join("\n")}\n\nAcesse Contas no TSM para renovar.`;
      console.warn("[Tokens]", msg);
      await notifyOwner({ title: "⚠️ Token expirado no TSM", content: msg });
    }
  } catch (err: any) {
    console.error("[Tokens] Erro ao verificar tokens:", err?.message);
  }
}

// ─── Geração de conteúdo ──────────────────────────────────────────────────────
async function fetchNews(query: string, language: string): Promise<{ title: string; description: string }[]> {
  const key = ENV.newsApiKey;
  if (!key) { console.error("[DailyResearch] NEWS_API_KEY não configurada"); return []; }
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
  // NewsAPI plano gratuito só suporta inglês — traduzir query para EN
  const enQuery = query.replace(/intelig[eê]ncia artificial/gi, "artificial intelligence")
    .replace(/automa[çc][aã]o/gi, "automation").replace(/tecnologia/gi, "technology");
  const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(enQuery)}&from=${yesterday}&language=en&pageSize=5&sortBy=publishedAt&apiKey=${key}`;
  console.log(`[DailyResearch] Buscando notícias: ${url.replace(key, '***')}`);
  try {
    const res = await fetch(url, { headers: { "User-Agent": "TriarcSocialManager/1.0" } });
    const data = await res.json() as { status: string; code?: string; message?: string; articles?: { title: string; description: string }[] };
    if (data.status !== "ok") { console.error(`[DailyResearch] NewsAPI erro: ${data.code} — ${data.message}`); return []; }
    if (!data.articles?.length) return [];
    return data.articles.slice(0, 5).map(a => ({ title: a.title, description: a.description ?? "" }));
  } catch (e: any) { console.error("[DailyResearch] Fetch error:", e.message); return []; }
}

async function runTopicResearch(topic: { id: number; name: string; query: string; language: string; accountId: number; autoPublish?: number }) {
  const db = await getDb();
  if (!db) return;

  try {
    const articles = await fetchNews(topic.query, topic.language);
    if (!articles.length) {
      await db.insert(researchRuns).values({ topicId: topic.id, status: "skipped", error: "Sem notícias" });
      console.log(`[DailyResearch] Tópico "${topic.name}": sem notícias.`);
      return;
    }

    const headlines = articles.map((a, i) => `${i + 1}. ${a.title}: ${a.description}`).join("\n");
    const llmRes = await invokeLLM({
      messages: [
        { role: "system", content: "Você é especialista em marketing digital para Instagram da Triarc Solutions, empresa de tecnologia de Macaé/RJ. Tom corporativo, moderno e acessível. Inclua CTA para triarcsolutions.com.br e hashtags tech." },
        { role: "user" as const, content: `Crie uma legenda impactante para o Instagram da @triarcsolutions sobre: "${topic.name}".\nNotícias das últimas 24h:\n${headlines}\n\nConecte as novidades ao posicionamento da Triarc. Máximo 2200 chars. Emojis estratégicos. CTA + 5-10 hashtags.` },
      ],
    });
    const caption = typeof llmRes.choices?.[0]?.message?.content === "string"
      ? llmRes.choices[0].message.content
      : `Novidades em ${topic.name}! Acompanhe as tendências com a Triarc Solutions. triarcsolutions.com.br`;

    const prompt = `Premium Instagram post for Triarc Solutions tech company. Topic: "${topic.name}". Headline: "${articles[0].title}". Ultra-modern tech aesthetic, deep navy blue (#0A1628) background with electric cyan (#00BFFF) and neon purple (#7B2FBE) accents. Futuristic data visualization, glowing circuit patterns, holographic overlays. Bold typography with topic name. Place the Triarc Solutions logo (circular tech emblem with gears and code symbols, navy blue, gray and green) prominently in the bottom-right corner. 1080x1080 square, magazine quality.`;
    const { url: imageUrl } = await generateImage({
      prompt,
      originalImages: [{ url: "https://tsm.triarcsolutions.com.br/manus-storage/triarc-logo_4d0b8405.jpeg", mimeType: "image/jpeg" }],
    });
    if (!imageUrl) throw new Error("Falha ao gerar imagem");

    // autoPublish=1 → vai direto para fila do MCP sem aprovacao manual
    const postStatus = topic.autoPublish === 1 ? 'approved' : 'pending';
    const [postResult] = await db.insert(posts).values({
      userId: 1,
      accountId: topic.accountId,
      caption,
      theme: `Pesquisa Diária: ${topic.name}`,
      status: postStatus,
      mcpPending: 0,
    });
    const postId = (postResult as any).insertId as number;

    await db.insert(postMedia).values({ postId, mediaUrl: imageUrl as string, mediaType: "image", sortOrder: 0 });
    await db.insert(researchRuns).values({
      topicId: topic.id, postId,
      headlines: JSON.stringify(articles.map(a => a.title)),
      status: "success",
    });

    console.log(`[DailyResearch] Tópico "${topic.name}" (${topic.id}): post ${postId} criado como ${postStatus} às ${getBrasiliaDateHour().hour}h Brasília.`);
  } catch (err: any) {
    const db2 = await getDb();
    if (db2) await db2.insert(researchRuns).values({ topicId: topic.id, status: "failed", error: err?.message });
    console.error(`[DailyResearch] Erro no tópico "${topic.name}":`, err?.message);
  }
}

// ─── Verificar e disparar tópicos para a hora atual ───────────────────────────
async function checkAndRunTopicsForHour(date: string, hour: number) {
  const db = await getDb();
  if (!db) return;

  const activeTopics = await db.select().from(researchTopics).where(eq(researchTopics.active, 1));
  for (const topic of activeTopics) {
    const key = `${topic.id}:${date}`;
    if (topic.publishHour === hour && !ranToday.has(key)) {
      ranToday.add(key);
      console.log(`[DailyResearch] Disparando tópico "${topic.name}" (${hour}h Brasília)...`);
      runTopicResearch(topic).catch((err: any) => console.error(`[DailyResearch] Erro:`, err?.message));
    }
  }
}

// ─── Loop principal ───────────────────────────────────────────────────────────
async function tick() {
  await promoteScheduledPosts();

  const { date, hour } = getBrasiliaDateHour();

  // Limpar chaves de dias anteriores
  ranToday.forEach(key => {
    if (!key.endsWith(`:${date}`)) ranToday.delete(key);
  });
  dailyTasks.forEach(key => {
    const parts = key.split(":");
    const taskDate = parts[parts.length - 1];
    if (taskDate !== date) dailyTasks.delete(key);
  });

  // Às 3h Brasília: sync de insights + renovação de tokens Facebook + verificação de expirados
  if (hour === 3) {
    syncInsightsDaily(date).catch((e: any) => console.error("[Insights] Erro:", e?.message));
    // Renova tokens Facebook que expiram em menos de 10 dias (sem novo login)
    const fbKey = `refreshFbTokens:${date}`;
    if (!dailyTasks.has(fbKey)) {
      dailyTasks.add(fbKey);
      refreshFacebookTokensIfNeeded()
        .then(({ renewed, failed }) => {
          if (renewed > 0) console.log(`[Facebook] ${renewed} token(s) renovado(s) automaticamente`);
          if (failed > 0) notifyOwner({ title: "⚠️ Token Facebook não renovável", content: `${failed} conta(s) precisam de reconexão manual em Contas no TSM.` }).catch(() => {});
        })
        .catch((e: any) => console.error("[Facebook] Erro ao renovar tokens:", e?.message));
    }
    checkExpiredTokens(date).catch((e: any) => console.error("[Tokens] Erro:", e?.message));
  }

  await checkAndRunTopicsForHour(date, hour);
}

export function startScheduler() {
  if (schedulerHandle) {
    console.warn("[Scheduler] Já está em execução.");
    return;
  }
  console.log(`[Scheduler] Iniciado — intervalo ${INTERVAL_MS / 1000}s | pesquisa por tópico no horário configurado (Brasília).`);
  tick();
  schedulerHandle = setInterval(tick, INTERVAL_MS);
}

export function stopScheduler() {
  if (schedulerHandle) {
    clearInterval(schedulerHandle);
    schedulerHandle = null;
    console.log("[Scheduler] Parado.");
  }
}

/** Alias para o vercel.ts — executa um ciclo do scheduler manualmente */
export async function runSchedulerTick(): Promise<void> {
  await tick();
}
