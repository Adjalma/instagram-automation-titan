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
} from "./db";
import { invokeLLM } from "./_core/llm";
import { generateImage } from "./_core/imageGeneration";
import { notifyOwner } from "./_core/notification";
import { storagePut } from "./storage";

const APP_CONTEXT = `O Titan App é um aplicativo PWA de escalada desenvolvido pela Triarc Solutions. Link oficial: titan.triarcsolutions.com.br. Slogan: "Iron Grip. Endless Ascend." Funcionalidades: registro de vias, modo offline, comunidade de escaladores, dicas de segurança, tracking de progresso. O sistema de gerenciamento é o Triarc Social Manager, plataforma de automação de conteúdo para Instagram da Triarc Solutions.`;

export const appRouter = router({
  system: systemRouter,
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
      const newStatus = post.scheduledAt ? "scheduled" : "approved";
      await updatePost(input.id, { status: newStatus });
      return { success: true, status: newStatus };
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

  ai: router({
    generateCaption: protectedProcedure.input(z.object({
      accountId: z.number(),
      theme: z.string(),
      extraContext: z.string().optional(),
    })).mutation(async ({ input }) => {
      const account = await getAccountById(input.accountId);
      if (!account) throw new Error("Account not found");
      const toneInstruction = account.tone === "personal"
        ? "Use um tom pessoal, autêntico e apaixonado. Fale como um escalador que está compartilhando sua jornada real. Use primeira pessoa. Seja inspirador mas genuíno."
        : "Use um tom corporativo profissional mas acessível. Fale como uma empresa de tecnologia inovadora. Destaque expertise técnica e valor do produto. Seja informativo e confiável.";
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `Você é um especialista em marketing de conteúdo para Instagram. ${APP_CONTEXT}\n\n${toneInstruction}\n\nA legenda deve incluir:\n- Texto envolvente e relevante para o tema\n- Hashtags estratégicas (8-15 hashtags)\n- CTA (Call to Action) claro\n- Menção ao link titan.triarcsolutions.com.br quando relevante\n- Emojis moderados para engajamento\n\nResponda APENAS com a legenda pronta, sem explicações adicionais.`,
          },
          {
            role: "user",
            content: `Crie uma legenda para o Instagram da conta @${account.handle}.\nTema: ${input.theme}\n${input.extraContext ? `Contexto adicional: ${input.extraContext}` : ""}`,
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
      const style = account.tone === "personal"
        ? "Estilo fotográfico natural de escalada ao ar livre, cores vibrantes, atmosfera aventureira"
        : "Design moderno e limpo com elementos tech, cores azul ciano e cinza metálico, estilo corporativo premium";
      const prompt = `Instagram post image for climbing/tech brand. Theme: ${input.theme}. ${style}. ${input.description ?? ""}. Include branding elements with the text "TITAN" and tagline "Iron Grip. Endless Ascend." in a metallic shield emblem. Professional social media design, 1080x1080 square format.`;
      const { url } = await generateImage({ prompt });
      return { url };
    }),
  }),
});

export type AppRouter = typeof appRouter;
