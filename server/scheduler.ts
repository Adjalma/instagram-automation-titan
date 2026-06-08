/**
 * Scheduler — agendador periódico do Triarc Social Manager.
 *
 * Responsabilidades:
 * 1. Mover posts agendados vencidos para status "approved" (a cada 5 min)
 * 2. Executar pesquisa de notícias por tópico no horário configurado (publishHour, Brasília)
 */

import { getPostsByStatus, updatePost, getDb } from "./db";
import { researchTopics, researchRuns, posts, postMedia } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { invokeLLM } from "./_core/llm";
import { generateImage, buildTriarcImagePrompt } from "./_core/imageGeneration";
import { ENV } from "./_core/env";
import { TRIARC_LOGO_URL } from "@shared/const";
import { runAutonomousAgent } from "./autonomousAgent";

const INTERVAL_MS = parseInt(process.env.SCHEDULER_INTERVAL_MS || "300000", 10);
const TZ_OFFSET = -3; // America/Sao_Paulo (UTC-3)

let schedulerHandle: ReturnType<typeof setInterval> | null = null;
// Controla quais tópicos já rodaram hoje: Set de "topicId:YYYY-MM-DD"
const ranToday: Set<string> = new Set();

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

    const { url: imageUrl } = await generateImage({
      prompt: buildTriarcImagePrompt(topic.name),
      originalImages: [{ url: TRIARC_LOGO_URL, mimeType: "image/jpeg" }],
    });
    if (!imageUrl) throw new Error("Falha ao gerar imagem");

    // autoPublish=1 → vai direto para fila do agente sem aprovacao manual
    const postStatus = topic.autoPublish === 1 ? 'approved' : 'pending';
    const [postResult] = await db.insert(posts).values({
      userId: 1,
      accountId: topic.accountId,
      caption,
      theme: `Pesquisa Diária: ${topic.name}`,
      status: postStatus as any,
      mcpPending: 0,
    }).returning({ id: posts.id });
    const postId = postResult.id;

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
/** Tick único: agendados, pesquisa diária e agente autônomo (dev + cron Vercel). */
export async function runSchedulerTick(): Promise<void> {
  await promoteScheduledPosts();

  const { date, hour } = getBrasiliaDateHour();

  // Limpar chaves de dias anteriores
  ranToday.forEach(key => {
    if (!key.endsWith(`:${date}`)) ranToday.delete(key);
  });

  await checkAndRunTopicsForHour(date, hour);

  await runAutonomousAgent();
}

async function tick() {
  try {
    await runSchedulerTick();
  } catch (err: any) {
    console.error("[Scheduler] Tick erro:", err?.message);
  }
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
