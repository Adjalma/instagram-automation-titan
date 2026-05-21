import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import {
  getAllAccounts, getAccountById, getAccountStats,
  createPost, getPostById, getPostsByAccount, getPostsByStatus, getAllPosts, updatePost, deletePost,
  addPostMedia, getPostMedia, deletePostMedia,
  createAsset, getAssetsByUser, deleteAsset,
  getAllThemes, getThemeBySlug,
  getPublicationLogs, getPublicationLogsByPost, createPublicationLog,
} from "./db";
import { invokeLLM } from "./_core/llm";
import { generateImage } from "./_core/imageGeneration";
import { notifyOwner } from "./_core/notification";
import { storagePut } from "./storage";
import { processScheduledPosts, fetchPostInsights } from "./instagram";
import { researchRouter } from "./routers/research";
import { seedTriarcContent, TRIARC_SERVICES, TRIARC_PROJECTS } from "./seed-triarc";
import { triacContent, TriacContent } from "../drizzle/schema";
import { getDb } from "./db";

const APP_CONTEXT = `A Triarc Solutions é uma empresa de tecnologia e inovação com sede em Macaé/RJ. Site oficial: triarcsolutions.com.br. Pilares: Gestão, Treinamento e Tecnologia. Serviços: desenvolvimento de software sob encomenda, IA e automação, gestão empresarial, suporte técnico em TI, automação industrial, treinamento profissional, licenciamento de software e data science. Projetos em destaque: TopFlow.ai (SEO com IA), COPE (plataforma de conexão de profissionais), SS-Milhas (gestão de milhas), TransCarga (logística inteligente), TRIARC CRM, NutriSystem, Grupo Conecta e mais de 36 projetos entregues. O Triarc Social Manager é a plataforma interna de automação de conteúdo para Instagram da Triarc Solutions.`;

const TRIARC_TONE = `Use um tom corporativo profissional, moderno e acessível. Posicione a Triarc Solutions como referência em tecnologia e inovação. Destaque expertise técnica, resultados concretos e valor para o cliente. Sempre inclua CTA direcionando para triarcsolutions.com.br. Use hashtags do nicho tech/inovação/negócios.`;

export const appRouter = router({
  system: systemRouter,
  research: researchRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  accounts: router({
    list: protectedProcedure.query(async () => {
      return getAllAccounts();
    }),
    getById: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      return getAccountById(input.id);
    }),
    stats: protectedProcedure.input(z.object({ accountId: z.number() })).query(async ({ input }) => {
      return getAccountStats(input.accountId);
    }),
  }),

  posts: router({
    create: protectedProcedure.input(z.object({
      accountId: z.number(),
      caption: z.string().optional(),
      theme: z.string().optional(),
      scheduledAt: z.string().optional(),
      mediaUrls: z.array(z.string()).optional(),
    })).mutation(async ({ ctx, input }) => {
      const { id } = await createPost({
        userId: ctx.user.id,
        accountId: input.accountId,
        caption: input.caption,
        theme: input.theme,
        scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : undefined,
        status: "draft",
      });
      if (input.mediaUrls) {
        for (let i = 0; i < input.mediaUrls.length; i++) {
          await addPostMedia(id, input.mediaUrls[i], "image", i);
        }
      }
      return { id };
    }),
    getById: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      const post = await getPostById(input.id);
      if (!post) return null;
      const media = await getPostMedia(input.id);
      return { ...post, media };
    }),
    list: protectedProcedure.input(z.object({
      accountId: z.number().optional(),
      status: z.string().optional(),
    }).optional()).query(async ({ input }) => {
      if (input?.accountId && input?.status) {
        return getPostsByAccount(input.accountId, input.status);
      }
      if (input?.accountId) {
        return getPostsByAccount(input.accountId);
      }
      if (input?.status) {
        return getPostsByStatus(input.status);
      }
      return getAllPosts();
    }),
    update: protectedProcedure.input(z.object({
      id: z.number(),
      caption: z.string().optional(),
      theme: z.string().optional(),
      scheduledAt: z.string().nullable().optional(),
      status: z.string().optional(),
    })).mutation(async ({ input }) => {
      const data: any = {};
      if (input.caption !== undefined) data.caption = input.caption;
      if (input.theme !== undefined) data.theme = input.theme;
      if (input.scheduledAt !== undefined) data.scheduledAt = input.scheduledAt ? new Date(input.scheduledAt) : null;
      if (input.status !== undefined) data.status = input.status;
      await updatePost(input.id, data);
      return { success: true };
    }),
    approve: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      const post = await getPostById(input.id);
      if (!post) throw new Error("Post not found");

       // Se não tem agendamento ou o agendamento já passou → fila imediata (approved)
      if (!post.scheduledAt || new Date(post.scheduledAt as any) <= new Date()) {
        await updatePost(input.id, { status: "approved", mcpPending: 0 });
        return { success: true, status: "approved" };
      }
      // Post com agendamento futuro → scheduled
      await updatePost(input.id, { status: "scheduled" });
      return { success: true, status: "scheduled" };;
    }),
    reject: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      await updatePost(input.id, { status: "rejected" });
      return { success: true };
    }),
    submitForApproval: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      await updatePost(input.id, { status: "pending" });
      const post = await getPostById(input.id);
      const account = post ? await getAccountById(post.accountId) : null;
      await notifyOwner({
        title: "Novo post pronto para aprovação",
        content: `Um post para @${account?.handle ?? "desconhecido"} está aguardando sua aprovação. Tema: ${post?.theme ?? "Sem tema"}`,
      });
      return { success: true };
    }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      await deletePost(input.id);
      return { success: true };
    }),
    addMedia: protectedProcedure.input(z.object({
      postId: z.number(),
      mediaUrl: z.string(),
      mediaType: z.enum(["image", "video"]).optional(),
      sortOrder: z.number().optional(),
    })).mutation(async ({ input }) => {
      const { id } = await addPostMedia(input.postId, input.mediaUrl, input.mediaType ?? "image", input.sortOrder ?? 0);
      return { id };
    }),
    removeMedia: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      await deletePostMedia(input.id);
      return { success: true };
    }),
    getMedia: protectedProcedure.input(z.object({ postId: z.number() })).query(async ({ input }) => {
      return getPostMedia(input.postId);
    }),
  }),

  assets: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return getAssetsByUser(ctx.user.id);
    }),
    upload: protectedProcedure.input(z.object({
      name: z.string(),
      base64: z.string(),
      mimeType: z.string(),
    })).mutation(async ({ ctx, input }) => {
      const buffer = Buffer.from(input.base64, "base64");
      const ext = input.mimeType.split("/")[1] || "png";
      const fileKey = `assets/${ctx.user.id}/${Date.now()}.${ext}`;
      const { url } = await storagePut(fileKey, buffer, input.mimeType);
      const { id } = await createAsset({
        userId: ctx.user.id,
        name: input.name,
        url,
        fileKey,
        mimeType: input.mimeType,
      });
      return { id, url };
    }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      await deleteAsset(input.id);
      return { success: true };
    }),
  }),

  themes: router({
    list: protectedProcedure.query(async () => {
      return getAllThemes();
    }),
  }),

  automation: router({
    generateWeek: protectedProcedure.input(z.object({
      accountIds: z.array(z.number()).optional(),
    })).mutation(async ({ ctx, input }) => {
      const accounts = await getAllAccounts();
      const targetAccounts = input.accountIds
        ? accounts.filter(a => input.accountIds!.includes(a.id))
        : accounts;
      if (targetAccounts.length === 0) throw new Error("Nenhuma conta encontrada");

      // Busca projetos e serviços reais da Triarc como base de conteúdo
      const db = await getDb();
      const triacItems = db ? await db.select().from(triacContent) : [];
      const contentItems = triacItems.length > 0 ? triacItems : TRIARC_PROJECTS.map((p, i) => ({ id: i + 1, name: p.name, subtitle: p.subtitle, description: p.description, category: p.category, type: "projeto" as const }));
      if (contentItems.length === 0) throw new Error("Nenhum conteúdo Triarc encontrado");

      // Best posting times (Brazilian timezone UTC-3)
      const bestTimes = [
        { hour: 8, minute: 0 },   // Manhã cedo
        { hour: 12, minute: 30 }, // Almoço
        { hour: 18, minute: 0 },  // Fim do expediente
        { hour: 20, minute: 0 },  // Noite
      ];

      const createdPosts: { id: number; account: string; theme: string; day: number }[] = [];
      const now = new Date();

      for (let day = 1; day <= 7; day++) {
        for (const account of targetAccounts) {
          const theme = contentItems[(day + account.id) % contentItems.length];
          const scheduleDate = new Date(now);
          scheduleDate.setDate(now.getDate() + day);
          const timeSlot = bestTimes[(day + account.id) % bestTimes.length];
          scheduleDate.setHours(timeSlot.hour, timeSlot.minute, 0, 0);

          const toneInstruction = TRIARC_TONE;

          // Generate caption with AI
          let caption = "";
          try {
            const response = await invokeLLM({
              messages: [
                {
                  role: "system",
                  content: `Você é um especialista em marketing de conteúdo para Instagram. ${APP_CONTEXT}\n\n${toneInstruction}\n\nA legenda deve incluir:\n- Texto envolvente e relevante ao tema/projeto/serviço\n- Hashtags estratégicas (8-15 hashtags do nicho tech, inovação, negócios)\n- CTA claro direcionando para triarcsolutions.com.br\n- Emojis moderados e profissionais\n\nResponda APENAS com a legenda pronta.`,
                },
                {
                  role: "user",
                  content: `Crie uma legenda para @triarcsolutions no Instagram. Tema/Projeto: ${theme.name}. Dia ${day} da semana de conteúdo. Foque em mostrar o valor e impacto desse serviço/projeto para empresas e profissionais.`,
                },
              ],
            });
            const rawContent = response.choices?.[0]?.message?.content;
            caption = typeof rawContent === "string" ? rawContent : "";
          } catch (e) {
            caption = `[Erro na geração] Tema: ${theme.name} para @${account.handle}`;
          }

          // Generate art with AI
          let mediaUrl = "";
          try {
            const style = "Design moderno e limpo com elementos tech, cores azul ciano (#00BFFF) e cinza escuro, estilo corporativo premium, minimalista e sofisticado";
            const artResult = await generateImage({
              prompt: `Instagram post for Triarc Solutions tech company. Topic: ${theme.name}. ${style}. Include subtle TRIARC branding. Professional social media design, 1080x1080 square.`,
            });
            mediaUrl = artResult.url ?? "";
          } catch (e) {
            // Art generation failed, post without media
          }

          const { id } = await createPost({
            userId: ctx.user.id,
            accountId: account.id,
            caption,
            theme: theme.name,
            scheduledAt: scheduleDate,
            status: "pending",
          });

          if (mediaUrl) {
            await addPostMedia(id, mediaUrl, "image", 0);
          }

          createdPosts.push({ id, account: account.handle, theme: theme.name, day });
        }
      }

      // Notify owner
      await notifyOwner({
        title: `${createdPosts.length} posts gerados automaticamente`,
        content: `A automação criou ${createdPosts.length} posts para a semana. Eles estão aguardando sua aprovação no painel.`,
      });

      return { created: createdPosts.length, posts: createdPosts };
    }),

    generateBatch: protectedProcedure.input(z.object({
      accountId: z.number(),
      themes: z.array(z.string()),
      startDate: z.string(),
      intervalHours: z.number().default(24),
    })).mutation(async ({ ctx, input }) => {
      const account = await getAccountById(input.accountId);
      if (!account) throw new Error("Conta não encontrada");

      const createdPosts: { id: number; theme: string; scheduledAt: string }[] = [];
      const startDate = new Date(input.startDate);

      for (let i = 0; i < input.themes.length; i++) {
        const theme = input.themes[i];
        const scheduleDate = new Date(startDate);
        scheduleDate.setHours(scheduleDate.getHours() + (i * input.intervalHours));

        const toneInstruction = TRIARC_TONE;

        let caption = "";
        try {
          const response = await invokeLLM({
            messages: [
              {
                role: "system",
                content: `Você é um especialista em marketing para Instagram. ${APP_CONTEXT}\n\n${toneInstruction}\n\nInclua hashtags estratégicas do nicho tech/inovação, CTA claro para triarcsolutions.com.br. Responda APENAS com a legenda.`,
              },
              { role: "user", content: `Legenda para @triarcsolutions. Tema/Projeto: ${theme}. Destaque o impacto e valor para o cliente.` },
            ],
          });
          const rawBatch = response.choices?.[0]?.message?.content;
          caption = typeof rawBatch === "string" ? rawBatch : "";
        } catch (e) {
          caption = `[Erro] Tema: ${theme}`;
        }

        let mediaUrl = "";
        try {
          const style = "Design moderno tech, cores azul ciano (#00BFFF) e cinza escuro, estilo corporativo premium";
          const artResult = await generateImage({
            prompt: `Instagram post for Triarc Solutions tech company. Topic: ${theme}. ${style}. Include subtle TRIARC branding. 1080x1080 square.`,
          });
          mediaUrl = artResult.url ?? "";
        } catch (e) { /* continue without media */ }

        const { id } = await createPost({
          userId: ctx.user.id,
          accountId: account.id,
          caption,
          theme,
          scheduledAt: scheduleDate,
          status: "pending",
        });

        if (mediaUrl) await addPostMedia(id, mediaUrl, "image", 0);
        createdPosts.push({ id, theme, scheduledAt: scheduleDate.toISOString() });
      }

      await notifyOwner({
        title: `Lote de ${createdPosts.length} posts gerados`,
        content: `${createdPosts.length} posts para @${account.handle} aguardam aprovação.`,
      });

      return { created: createdPosts.length, posts: createdPosts };
    }),

    getQueue: protectedProcedure.input(z.object({
      accountId: z.number().optional(),
    }).optional()).query(async ({ input }) => {
      const statuses = ["pending", "approved", "scheduled"];
      const allPosts = input?.accountId
        ? await getPostsByAccount(input.accountId)
        : await getAllPosts();
      return allPosts
        .filter((p: any) => statuses.includes(p.status))
        .sort((a: any, b: any) => {
          const dateA = a.scheduledAt ? new Date(a.scheduledAt).getTime() : 0;
          const dateB = b.scheduledAt ? new Date(b.scheduledAt).getTime() : 0;
          return dateA - dateB;
        });
    }),

    approveAll: protectedProcedure.mutation(async () => {
      const pendingPosts = await getPostsByStatus("pending");
      let approved = 0;
      let scheduled = 0;
      for (const post of pendingPosts) {
        const p = post as any;
        if (!p.scheduledAt || new Date(p.scheduledAt) <= new Date()) {
          await updatePost(p.id, { status: "approved", mcpPending: 0 });
          approved++;
        } else {
          await updatePost(p.id, { status: "scheduled" });
          scheduled++;
        }
      }
      return { approved, published: 0, scheduled, total: pendingPosts.length };
    }),

    processScheduled: protectedProcedure.mutation(async () => {
      return processScheduledPosts();
    }),

    publishNow: protectedProcedure.input(z.object({ postId: z.number() })).mutation(async ({ input }) => {
      // Marca o post como approved e mcpPending=0 para que o agente o publique na próxima execução
      const post = await getPostById(input.postId);
      if (!post) throw new Error("Post not found");
      await updatePost(input.postId, { status: "approved", mcpPending: 0, retryCount: 0 });
      return { success: true, message: "Post adicionado à fila de publicação imediata. O agente publicará em breve." };
    }),

    getLogs: protectedProcedure.query(async () => {
      return getPublicationLogs(100);
    }),

    getPostLogs: protectedProcedure.input(z.object({ postId: z.number() })).query(async ({ input }) => {
      return getPublicationLogsByPost(input.postId);
    }),

    syncInsights: protectedProcedure.input(z.object({ postId: z.number() })).mutation(async ({ input }) => {
      const post = await getPostById(input.postId);
      if (!post || !(post as any).instagramPostId) throw new Error("Post not published or no Instagram ID");
      const insights = await fetchPostInsights((post as any).instagramPostId);
      await updatePost(input.postId, {
        likes: insights.likes ?? 0,
        comments: insights.comments ?? 0,
      });
      return { success: true, insights };
    }),
  }),

  triacContent: router({
    list: protectedProcedure.input(z.object({
      type: z.enum(["servico", "projeto", "all"]).optional(),
    }).optional()).query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      const items = await db.select().from(triacContent);
      if (input?.type && input.type !== "all") {
        return items.filter((i: TriacContent) => i.type === input.type);
      }
      return items;
    }),
  }),

  analytics: router({
    // Dados da conta Instagram via MCP (chamado pelo agente, cacheado no banco)
    // Como o MCP só pode ser chamado pelo agente, estes endpoints retornam dados
    // armazenados no banco ou buscam via endpoint interno do agente.
    getAccountStats: protectedProcedure.query(async () => {
      // Retorna stats da conta @triarcsolutions do banco
      const accounts = await getAllAccounts();
      const triarc = (accounts as any[]).find((a: any) => a.handle === 'triarcsolutions') || (accounts as any[])[0];
      if (!triarc) return null;
      const stats = await getAccountStats(triarc.id);
      return { account: triarc, stats };
    }),

    getPostsWithMetrics: protectedProcedure.query(async () => {
      // Retorna posts publicados com métricas do banco
      const published = await getPostsByStatus('published');
      return (published as any[]).map((p: any) => ({
        id: p.id,
        caption: p.caption,
        publishedAt: p.publishedAt,
        instagramPostId: p.instagramPostId,
        instagramPermalink: p.instagramPermalink,
        likes: p.likes ?? 0,
        comments: p.comments ?? 0,
        theme: p.theme,
      }));
    }),

    getSummary: protectedProcedure.query(async () => {
      // Resumo geral: total posts, pendentes, aprovados, publicados
      const [all, pending, approved, published, scheduled] = await Promise.all([
        getAllPosts(),
        getPostsByStatus('pending'),
        getPostsByStatus('approved'),
        getPostsByStatus('published'),
        getPostsByStatus('scheduled'),
      ]);
      const publishedPosts = published as any[];
      const totalLikes = publishedPosts.reduce((s: number, p: any) => s + (p.likes ?? 0), 0);
      const totalComments = publishedPosts.reduce((s: number, p: any) => s + (p.comments ?? 0), 0);
      return {
        total: (all as any[]).length,
        pending: (pending as any[]).length,
        approved: (approved as any[]).length,
        published: publishedPosts.length,
        scheduled: (scheduled as any[]).length,
        totalLikes,
        totalComments,
      };
    }),
  }),

  ai: router({
    generateCaption: protectedProcedure.input(z.object({
      accountId: z.number(),
      theme: z.string(),
      extraContext: z.string().optional(),
    })).mutation(async ({ input }) => {
      const account = await getAccountById(input.accountId);
      if (!account) throw new Error("Account not found");
      const toneInstruction = TRIARC_TONE;
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `Você é um especialista em marketing de conteúdo para Instagram. ${APP_CONTEXT}\n\n${toneInstruction}\n\nA legenda deve incluir:\n- Texto envolvente e relevante ao tema/projeto/serviço\n- Hashtags estratégicas (8-15 hashtags do nicho tech, inovação, negócios)\n- CTA claro para triarcsolutions.com.br\n- Emojis moderados e profissionais\n\nResponda APENAS com a legenda pronta, sem explicações adicionais.`,
          },
          {
            role: "user",
            content: `Crie uma legenda para @triarcsolutions no Instagram.\nTema/Projeto/Serviço: ${input.theme}\n${input.extraContext ? `Contexto adicional: ${input.extraContext}` : ""}\nDestaque o impacto, tecnologias usadas e valor para o cliente.`,
          },
        ],
      });
      const caption = response.choices?.[0]?.message?.content ?? "Erro ao gerar legenda.";
      return { caption };
    }),
    generateArt: protectedProcedure.input(z.object({
      accountId: z.number(),
      theme: z.string(),
      description: z.string().optional(),
      includelogo: z.boolean().optional(),
    })).mutation(async ({ input }) => {
      const account = await getAccountById(input.accountId);
      if (!account) throw new Error("Account not found");
      const style = "Design moderno e limpo com elementos tech, cores azul ciano (#00BFFF) e cinza escuro, estilo corporativo premium, minimalista e sofisticado";
      const prompt = `Instagram post image for Triarc Solutions tech company. Topic: ${input.theme}. ${style}. ${input.description ?? ""}. Include subtle TRIARC branding. Professional social media design, 1080x1080 square format.`;
      const { url } = await generateImage({ prompt });
      return { url };
    }),
  }),
});

export type AppRouter = typeof appRouter;
