import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { instagramAccounts } from "../drizzle/schema";
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
import { processScheduledPosts, fetchPostInsights, publishToInstagram, extractIgUserId } from "./instagram";
import { publishToLinkedIn } from "./linkedin";
import { publishToFacebook } from "./facebook";
import { storageGetSignedUrl } from "./storage";
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
    create: protectedProcedure.input(z.object({
      handle: z.string().min(1).max(128),
      displayName: z.string().min(1).max(256),
      platform: z.enum(["instagram", "linkedin", "facebook", "tiktok", "youtube"]).default("instagram"),
      accountType: z.enum(["personal", "business"]).default("business"),
      tone: z.enum(["personal", "corporate"]).default("corporate"),
      bio: z.string().optional(),
      profileUrl: z.string().optional(),
    })).mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const [result] = await db.insert(instagramAccounts).values({
        handle: input.handle,
        displayName: input.displayName,
        platform: input.platform,
        accountType: input.accountType,
        tone: input.tone,
        bio: input.bio ?? null,
        profileUrl: input.profileUrl ?? null,
      });
      return { id: (result as any).insertId };
    }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      await db.delete(instagramAccounts).where(eq(instagramAccounts.id, input.id));
      return { success: true };
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

      // Se não tem agendamento ou o agendamento já passou → publicar imediatamente (síncrono)
      if (!post.scheduledAt || new Date(post.scheduledAt as any) <= new Date()) {
        await updatePost(input.id, { status: "approved", mcpPending: 0 });
        // Publicar inline (await garante execução em Vercel serverless)
        const media = await getPostMedia(input.id) as any[];
        let imageUrl: string | undefined;
        if (media?.[0]?.mediaUrl) {
          const u = media[0].mediaUrl;
          imageUrl = u.startsWith("/manus-storage/")
            ? await storageGetSignedUrl(u.replace("/manus-storage/", ""))
            : u;
        }
        const caption: string = (post as any).caption || "";
        const allAccs = await getAllAccounts() as any[];
        const publishResults: Record<string, string> = {};
        // Instagram
        const igAccs = allAccs.filter((a: any) => a.platform === "instagram" && a.accessToken && a.linkedinUrn?.startsWith("ig:"));
        for (const igAcc of igAccs) {
          const igUserId = extractIgUserId(igAcc.linkedinUrn);
          if (!igUserId || !imageUrl) { publishResults.instagram = "sem_imagem"; continue; }
          try {
            const r = await publishToInstagram({ igUserId, accessToken: igAcc.accessToken, caption, imageUrl });
            await updatePost(input.id, { instagramPostId: r.postId, instagramPermalink: r.permalink, status: "published", publishedAt: new Date(), mcpPending: 0 });
            publishResults.instagram = r.postId;
            notifyOwner({ title: "✅ Instagram", content: `Post #${input.id} publicado!\n${r.permalink}` }).catch(() => {});
          } catch (e: any) { publishResults.instagram = `erro: ${e.message}`; console.error(`[Approve] Instagram post ${input.id}:`, e.message); }
        }
        // LinkedIn
        const liAccs = allAccs.filter((a: any) => a.platform === "linkedin" && a.accessToken && a.linkedinUrn);
        for (const liAcc of liAccs) {
          try {
            await publishToLinkedIn({ accessToken: liAcc.accessToken, linkedinUrn: liAcc.linkedinUrn, caption, imageUrl });
            await updatePost(input.id, { linkedinPublished: 1 });
            publishResults.linkedin = "ok";
            notifyOwner({ title: "✅ LinkedIn", content: `Post #${input.id} publicado no LinkedIn!` }).catch(() => {});
          } catch (e: any) { publishResults.linkedin = `erro: ${e.message}`; console.error(`[Approve] LinkedIn post ${input.id}:`, e.message); }
        }
        // Facebook
        const fbAccs = allAccs.filter((a: any) => a.platform === "facebook" && a.accessToken && (a.linkedinUrn?.startsWith("fb:page:") || a.linkedinUrn === "fb:personal"));
        for (const fbAcc of fbAccs) {
          const pageId = fbAcc.linkedinUrn.startsWith("fb:page:") ? fbAcc.linkedinUrn.replace("fb:page:", "") : "me";
          try {
            await publishToFacebook({ pageToken: fbAcc.accessToken, pageId, caption, imageUrl });
            await updatePost(input.id, { facebookPublished: 1 });
            publishResults.facebook = "ok";
            notifyOwner({ title: "✅ Facebook", content: `Post #${input.id} publicado no Facebook!` }).catch(() => {});
          } catch (e: any) { publishResults.facebook = `erro: ${e.message}`; console.error(`[Approve] Facebook post ${input.id}:`, e.message); }
        }
        console.log(`[Approve] Post ${input.id} resultados:`, publishResults);
        return { success: true, status: "approved", publishResults };
      }
      // Post com agendamento futuro → scheduled
      await updatePost(input.id, { status: "scheduled" });
      return { success: true, status: "scheduled" };
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
            const artResult = await generateImage({
              prompt: `Infographic-style premium tech illustration for Instagram post. Topic: ${theme.name}. Dark blue-gray background (#0a0e1a to #1a2035 gradient). Photorealistic 3D elements arranged in a clean editorial layout: holographic human figures, glowing neural network diagrams, floating UI panels with data visualizations, robotic arms, digital globe with connection lines, microscopic tech components magnified. Soft volumetric lighting with blue and cyan glows, subtle purple accents, golden highlights on key elements. Multiple depth layers creating cinematic depth of field. Professional infographic composition with visual hierarchy — large central focal element surrounded by smaller supporting elements. Ultra-detailed 8K quality, studio lighting, ray tracing reflections. Style inspired by premium tech magazine covers and AI research papers. Square 1:1 format 1080x1080. NO text, letters or numbers.`,
              originalImages: [{ url: "https://tsm.triarcsolutions.com.br/manus-storage/triarc-logo_4d0b8405.jpeg", mimeType: "image/jpeg" }],
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
          const artResult = await generateImage({
            prompt: `Premium infographic tech illustration for Instagram. Topic: ${theme}. Dark cinematic background (deep navy #0a0e1a). Photorealistic 3D composition: central holographic element representing the theme (robot, brain, server rack, globe, code visualization), surrounded by supporting 3D objects — floating data panels, circuit boards, particle streams, geometric wireframes. Soft blue and cyan volumetric lighting, purple ambient glow, golden accent highlights. Multiple layers of depth with bokeh and lens flare. Editorial infographic layout with clear visual hierarchy. Ultra-detailed 8K photorealistic quality, ray-traced reflections and shadows. Premium tech magazine aesthetic. Square 1:1 1080x1080. NO text or letters.`,
            originalImages: [{ url: "https://tsm.triarcsolutions.com.br/manus-storage/triarc-logo_4d0b8405.jpeg", mimeType: "image/jpeg" }],
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
      const allAccounts = await getAllAccounts() as any[];
      const igAcc = allAccounts.find((a: any) => a.platform === "instagram" && a.accessToken);
      if (!igAcc) throw new Error("Conta Instagram não encontrada");
      const { extractIgUserId } = await import("./instagram");
      const igUserId = extractIgUserId(igAcc.linkedinUrn ?? "") ?? igAcc.linkedinUrn;
      const insights = await fetchPostInsights(igUserId, igAcc.accessToken, (post as any).instagramPostId);
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
        linkedinPublished: p.linkedinPublished ?? 0,
        facebookPublished: p.facebookPublished ?? 0,
      }));
    }),

    syncAllInsights: protectedProcedure.mutation(async () => {
      const published = await getPostsByStatus('published');
      const postsWithId = (published as any[]).filter((p: any) => p.instagramPostId);
      let updated = 0;
      const errors: string[] = [];
      for (const post of postsWithId) {
        try {
          const port = process.env.PORT || 3000;
          const res = await fetch(`http://localhost:${port}/api/scheduled/insights/${post.instagramPostId}`, {
            headers: { 'x-internal-key': process.env.JWT_SECRET || 'internal' }
          });
          if (res.ok) {
            const data = await res.json() as { likes?: number; comments?: number };
            if (data.likes !== undefined || data.comments !== undefined) {
              await updatePost(post.id, { likes: data.likes ?? (post as any).likes ?? 0, comments: data.comments ?? (post as any).comments ?? 0 });
              updated++;
            }
          }
        } catch (e: any) {
          errors.push(`Post ${post.id}: ${e.message}`);
        }
      }
      return { updated, total: postsWithId.length, errors };
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
      const prompt = `Premium infographic-style tech illustration for Instagram post. Topic: ${input.theme}. ${input.description ? `Context: ${input.description}.` : ""} Dark cinematic background (deep navy #0a0e1a to #1a2035). Photorealistic 3D composition inspired by premium AI research visuals: central holographic 3D element representing the theme, surrounded by supporting objects — floating holographic UI panels with charts and data, neural network diagrams, robotic figures, digital globe, circuit board close-ups, particle streams, geometric wireframes. Soft volumetric blue and cyan lighting, purple ambient glow, golden accent highlights on focal points. Multiple depth layers with cinematic bokeh and lens flare. Editorial infographic layout with clear visual hierarchy — large central element, medium supporting elements, small detail elements. Ultra-detailed 8K photorealistic quality, ray-traced reflections, studio-quality lighting. Style of premium tech magazine covers and AI research paper illustrations. Square 1:1 1080x1080. Absolutely NO text, letters, numbers or words.`;
      const { url } = await generateImage({
        prompt,
        originalImages: [{ url: "https://tsm.triarcsolutions.com.br/manus-storage/triarc-logo_4d0b8405.jpeg", mimeType: "image/jpeg" }],
      });
      return { url };
    }),
  }),

  actionPlan: router({
    generate: protectedProcedure.input(z.object({
      period: z.enum(['week', 'month']).default('week'),
    })).mutation(async () => {
      const published = await getPostsByStatus('published');
      const publishedPosts = published as any[];
      const totalLikes = publishedPosts.reduce((s: number, p: any) => s + (p.likes ?? 0), 0);
      const totalComments = publishedPosts.reduce((s: number, p: any) => s + (p.comments ?? 0), 0);
      const avgEngagement = publishedPosts.length > 0
        ? ((totalLikes + totalComments) / publishedPosts.length).toFixed(1)
        : '0';
      const topPosts = publishedPosts
        .sort((a: any, b: any) => ((b.likes ?? 0) + (b.comments ?? 0)) - ((a.likes ?? 0) + (a.comments ?? 0)))
        .slice(0, 3)
        .map((p: any) => ({ theme: p.theme || 'Sem tema', likes: p.likes ?? 0, comments: p.comments ?? 0 }));
      const prompt = "Crie um plano de acao de marketing digital para a Triarc Solutions (empresa de tecnologia de Macae/RJ) baseado nos dados abaixo.\n\nDados de performance:\n- Posts publicados: " + publishedPosts.length + "\n- Total de curtidas: " + totalLikes + "\n- Total de comentarios: " + totalComments + "\n- Engajamento medio por post: " + avgEngagement + "\n- Top posts: " + JSON.stringify(topPosts) + "\n\nRetorne JSON com exatamente esta estrutura:\n{\n  \"diagnosis\": \"diagnostico da performance atual em 3-4 frases\",\n  \"score\": 75,\n  \"actions\": [{ \"priority\": \"alta\", \"title\": \"titulo\", \"description\": \"descricao\", \"metric\": \"metrica\", \"deadline\": \"prazo\" }],\n  \"contentCalendar\": [{ \"day\": \"Segunda\", \"type\": \"Educativo\", \"theme\": \"tema\", \"platform\": \"Instagram\" }],\n  \"kpis\": [{ \"name\": \"KPI\", \"current\": \"atual\", \"target\": \"meta\", \"period\": \"periodo\" }],\n  \"quickWins\": [\"acao 1\", \"acao 2\", \"acao 3\"]\n}";
      const res = await invokeLLM({
        messages: [
          { role: 'system', content: 'Voce e um estrategista de marketing digital especializado em empresas de tecnologia B2B no Brasil. Responda SEMPRE em JSON valido sem markdown.' },
          { role: 'user', content: prompt },
        ],
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'action_plan',
            strict: true,
            schema: {
              type: 'object',
              properties: {
                diagnosis: { type: 'string' },
                score: { type: 'number' },
                actions: { type: 'array', items: { type: 'object', properties: { priority: { type: 'string' }, title: { type: 'string' }, description: { type: 'string' }, metric: { type: 'string' }, deadline: { type: 'string' } }, required: ['priority', 'title', 'description', 'metric', 'deadline'], additionalProperties: false } },
                contentCalendar: { type: 'array', items: { type: 'object', properties: { day: { type: 'string' }, type: { type: 'string' }, theme: { type: 'string' }, platform: { type: 'string' } }, required: ['day', 'type', 'theme', 'platform'], additionalProperties: false } },
                kpis: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' }, current: { type: 'string' }, target: { type: 'string' }, period: { type: 'string' } }, required: ['name', 'current', 'target', 'period'], additionalProperties: false } },
                quickWins: { type: 'array', items: { type: 'string' } },
              },
              required: ['diagnosis', 'score', 'actions', 'contentCalendar', 'kpis', 'quickWins'],
              additionalProperties: false,
            },
          },
        },
      });
      const raw = res.choices?.[0]?.message?.content;
      if (!raw) throw new Error('LLM nao retornou resposta');
      return JSON.parse(typeof raw === 'string' ? raw : JSON.stringify(raw));
    }),
  }),
  marketIntel: router({
    analyze: protectedProcedure.input(z.object({
      niche: z.string().min(1),
      competitor: z.string().optional(),
    })).mutation(async ({ input }) => {
      const competitorContext = input.competitor
        ? `Analise também o concorrente: ${input.competitor}. Compare estratégias de conteúdo.`
        : "";
      const res = await invokeLLM({
        messages: [
          { role: "system", content: `Você é um especialista em marketing digital e social media para empresas de tecnologia B2B no Brasil. Responda sempre em JSON válido.` },
          { role: "user", content: `Faça uma análise completa de mercado para a Triarc Solutions (empresa de tecnologia e inovação de Macaé/RJ, especializada em software, IA, automação e consultoria) no nicho: "${input.niche}". ${competitorContext}\n\nRetorne JSON com exatamente esta estrutura:\n{\n  "summary": "diagnóstico do nicho em 3-4 frases",\n  "strengths": ["diferencial 1", "diferencial 2", "diferencial 3", "diferencial 4"],\n  "opportunities": ["oportunidade 1", "oportunidade 2", "oportunidade 3", "oportunidade 4"],\n  "contentPillars": ["pilar 1: descrição", "pilar 2: descrição", "pilar 3: descrição", "pilar 4: descrição"],\n  "hashtags": ["#hashtag1", "#hashtag2", "#hashtag3", "#hashtag4", "#hashtag5", "#hashtag6", "#hashtag7", "#hashtag8", "#hashtag9", "#hashtag10"],\n  "postingStrategy": "estratégia detalhada de frequência, horários e tipos de conteúdo por dia da semana"\n}` },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "market_intel",
            strict: true,
            schema: {
              type: "object",
              properties: {
                summary: { type: "string" },
                strengths: { type: "array", items: { type: "string" } },
                opportunities: { type: "array", items: { type: "string" } },
                contentPillars: { type: "array", items: { type: "string" } },
                hashtags: { type: "array", items: { type: "string" } },
                postingStrategy: { type: "string" },
              },
              required: ["summary", "strengths", "opportunities", "contentPillars", "hashtags", "postingStrategy"],
              additionalProperties: false,
            },
          },
        },
      });
      const raw = res.choices?.[0]?.message?.content;
      if (!raw) throw new Error("LLM não retornou resposta");
      return JSON.parse(typeof raw === "string" ? raw : JSON.stringify(raw)) as {
        summary: string;
        strengths: string[];
        opportunities: string[];
        contentPillars: string[];
        hashtags: string[];
        postingStrategy: string;
      };
    }),
  }),
});

export type AppRouter = typeof appRouter;
