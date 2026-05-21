import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { researchTopics, researchRuns, posts, postMedia } from "../../drizzle/schema";
import { eq, desc, and } from "drizzle-orm";
import { invokeLLM } from "../_core/llm";
import { generateImage } from "../_core/imageGeneration";
import { getAllAccounts } from "../db";

const NEWS_API_KEY = process.env.NEWS_API_KEY ?? "";

const APP_CONTEXT = `A Triarc Solutions é uma empresa de tecnologia e inovação com sede em Macaé/RJ. Pilares: Gestão, Treinamento e Tecnologia. Serviços: IA e automação, desenvolvimento de software, data science. Site: triarcsolutions.com.br.`;
const TRIARC_TONE = `Tom corporativo profissional, moderno e acessível. Posicione a Triarc Solutions como referência em tecnologia. Inclua CTA para triarcsolutions.com.br e hashtags do nicho tech/IA.`;

// Busca notícias das últimas 24h para um query
async function fetchNews(query: string, language: string): Promise<{ title: string; description: string; url: string }[]> {
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
  const lang = language === "pt" ? "pt" : "en";
  const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&from=${yesterday}&language=${lang}&pageSize=5&sortBy=publishedAt&apiKey=${NEWS_API_KEY}`;
  const res = await fetch(url, { headers: { "User-Agent": "TriarcSocialManager/1.0" } });
  const data = await res.json() as { status: string; articles?: { title: string; description: string; url: string }[] };
  if (data.status !== "ok" || !data.articles?.length) return [];
  return data.articles.slice(0, 5).map(a => ({ title: a.title, description: a.description ?? "", url: a.url }));
}

// Gera legenda baseada nas notícias
async function generateCaption(topicName: string, articles: { title: string; description: string }[]): Promise<string> {
  const headlines = articles.map((a, i) => `${i + 1}. ${a.title}: ${a.description}`).join("\n");
  const response = await invokeLLM({
    messages: [
      { role: "system", content: `${APP_CONTEXT}\n${TRIARC_TONE}\nVocê é especialista em marketing digital para Instagram.` },
      {
        role: "user" as const,
        content: `Crie uma legenda impactante para o Instagram da @triarcsolutions sobre o tema: "${topicName}".
Baseie-se nestas notícias das últimas 24 horas:
${headlines}

Requisitos:
- Conecte as novidades ao posicionamento da Triarc Solutions
- Tom profissional e inspirador
- Máximo 2200 caracteres
- Inclua emojis estratégicos
- Termine com CTA para triarcsolutions.com.br
- Inclua 5-10 hashtags relevantes`,
      },
    ],
  });
  const content = response.choices?.[0]?.message?.content;
  return typeof content === "string" ? content : "";
}

// Gera imagem premium para o post
async function generateArtForResearch(topicName: string, headlines: string[]): Promise<string> {
  const topHeadline = headlines[0] ?? topicName;
  const prompt = `Premium Instagram post for Triarc Solutions tech company. Topic: "${topicName}". Headline: "${topHeadline}". 
Style: ultra-modern tech aesthetic, deep navy blue (#0A1628) background with electric cyan (#00BFFF) and neon purple (#7B2FBE) accents. 
Futuristic data visualization elements, glowing circuit patterns, holographic overlays. 
Bold typography with the topic name prominently displayed. Subtle "TRIARC" watermark. 
Professional social media design, 1080x1080 square format, magazine quality.`;
  const { url } = await generateImage({ prompt });
  if (!url) throw new Error("Falha ao gerar imagem");
  return url as string;
}

export const researchRouter = router({
  // Listar tópicos
  listTopics: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    return db.select().from(researchTopics).orderBy(researchTopics.sortOrder, researchTopics.createdAt);
  }),

  // Criar tópico
  createTopic: protectedProcedure.input(z.object({
    accountId: z.number(),
    name: z.string().min(1).max(256),
    query: z.string().min(1).max(512),
    language: z.enum(["pt", "en"]).default("pt"),
  })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("DB unavailable");
    const [result] = await db.insert(researchTopics).values({
      accountId: input.accountId,
      name: input.name,
      query: input.query,
      language: input.language,
      active: 1,
    });
    return { id: (result as any).insertId };
  }),

  // Atualizar tópico (ativar/desativar, editar)
  updateTopic: protectedProcedure.input(z.object({
    id: z.number(),
    name: z.string().min(1).max(256).optional(),
    query: z.string().min(1).max(512).optional(),
    language: z.enum(["pt", "en"]).optional(),
    active: z.number().min(0).max(1).optional(),
  })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("DB unavailable");
    const { id, ...values } = input;
    await db.update(researchTopics).set(values).where(eq(researchTopics.id, id));
    return { success: true };
  }),

  // Deletar tópico
  deleteTopic: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("DB unavailable");
    await db.delete(researchTopics).where(eq(researchTopics.id, input.id));
    return { success: true };
  }),

  // Histórico de execuções
  listRuns: protectedProcedure.input(z.object({
    topicId: z.number().optional(),
    limit: z.number().default(20),
  })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return [];
    const q = db.select().from(researchRuns).orderBy(desc(researchRuns.ranAt)).limit(input.limit);
    if (input.topicId) {
      return db.select().from(researchRuns)
        .where(eq(researchRuns.topicId, input.topicId))
        .orderBy(desc(researchRuns.ranAt))
        .limit(input.limit);
    }
    return q;
  }),

  // Executar pesquisa manualmente para um tópico
  runNow: protectedProcedure.input(z.object({ topicId: z.number() })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new Error("DB unavailable");

    const [topic] = await db.select().from(researchTopics).where(eq(researchTopics.id, input.topicId)).limit(1);
    if (!topic) throw new Error("Tópico não encontrado");

    try {
      // 1. Buscar notícias
      const articles = await fetchNews(topic.query, topic.language);
      if (!articles.length) {
        await db.insert(researchRuns).values({ topicId: topic.id, status: "skipped", error: "Nenhuma notícia encontrada" });
        return { success: false, message: "Nenhuma notícia encontrada para este tópico" };
      }

      // 2. Gerar legenda
      const caption = await generateCaption(topic.name, articles);

      // 3. Gerar imagem premium
      const imageUrl = await generateArtForResearch(topic.name, articles.map(a => a.title));

      // 4. Criar post no banco
      const userId = ctx.user.id;
      const [postResult] = await db.insert(posts).values({
        userId,
        accountId: topic.accountId,
        caption,
        theme: `Pesquisa Diária: ${topic.name}`,
        status: "pending",
      });
      const postId = (postResult as any).insertId as number;

      // 5. Salvar imagem como mídia do post
      await db.insert(postMedia).values({
        postId,
        mediaUrl: imageUrl,
        mediaType: "image",
        sortOrder: 0,
      });

      // 6. Registrar execução
      await db.insert(researchRuns).values({
        topicId: topic.id,
        postId,
        headlines: JSON.stringify(articles.map(a => a.title)),
        status: "success",
      });

      return { success: true, postId, message: `Post criado com sucesso! ID: ${postId}` };
    } catch (err: any) {
      await db.insert(researchRuns).values({
        topicId: topic.id,
        status: "failed",
        error: err?.message ?? "Erro desconhecido",
      });
      throw err;
    }
  }),

  // Executar todos os tópicos ativos (usado pelo cron)
  runAll: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("DB unavailable");

    const activeTopics = await db.select().from(researchTopics).where(eq(researchTopics.active, 1));
    const results: { topicId: number; name: string; success: boolean; postId?: number; error?: string }[] = [];

    for (const topic of activeTopics) {
      try {
        const articles = await fetchNews(topic.query, topic.language);
        if (!articles.length) {
          await db.insert(researchRuns).values({ topicId: topic.id, status: "skipped", error: "Sem notícias" });
          results.push({ topicId: topic.id, name: topic.name, success: false, error: "Sem notícias" });
          continue;
        }

        const caption = await generateCaption(topic.name, articles);
        const imageUrl = await generateArtForResearch(topic.name, articles.map(a => a.title));

        const [postResult] = await db.insert(posts).values({
          userId: ctx.user.id,
          accountId: topic.accountId,
          caption,
          theme: `Pesquisa Diária: ${topic.name}`,
          status: "pending",
        });
        const postId = (postResult as any).insertId as number;

        await db.insert(postMedia).values({ postId, mediaUrl: imageUrl, mediaType: "image", sortOrder: 0 });
        await db.insert(researchRuns).values({
          topicId: topic.id, postId,
          headlines: JSON.stringify(articles.map(a => a.title)),
          status: "success",
        });

        results.push({ topicId: topic.id, name: topic.name, success: true, postId });
      } catch (err: any) {
        await db.insert(researchRuns).values({ topicId: topic.id, status: "failed", error: err?.message });
        results.push({ topicId: topic.id, name: topic.name, success: false, error: err?.message });
      }
    }

    return { results, total: activeTopics.length, succeeded: results.filter(r => r.success).length };
  }),
});
