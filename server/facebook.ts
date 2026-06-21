/**
 * Facebook OAuth 2.0 + Pages API
 *
 * Fluxo:
 *   1. /api/facebook/auth → redireciona para Facebook Login
 *   2. /auth/facebook/callback → troca code por user token → busca Page token → salva no banco
 *   3. publishToFacebook() → publica post na Page via Graph API
 *
 * Permissões necessárias no app Meta:
 *   pages_show_list, pages_read_engagement, instagram_basic, instagram_content_publish
 */
import { Express, Request, Response } from "express";
import { ENV } from "./_core/env";
import { getDb } from "./db";
import { instagramAccounts } from "../drizzle/schema";
import { eq } from "drizzle-orm";

const FB_AUTH_URL = "https://www.facebook.com/v19.0/dialog/oauth";
const FB_TOKEN_URL = "https://graph.facebook.com/v19.0/oauth/access_token";
const FB_GRAPH_URL = "https://graph.facebook.com/v19.0";

// Permissões mínimas para publicar em Pages
// NOTA: pages_manage_posts requer App Review aprovado para aparecer no OAuth.
// Em modo de desenvolvimento, o app Meta já tem acesso total às páginas do
// próprio desenvolvedor — o Page Access Token obtido via /me/accounts já
// inclui as permissões necessárias sem precisar solicitar pages_manage_posts
// explicitamente no scope do Login Dialog.
// Escopos válidos para Facebook Login sem App Review.
// instagram_basic e instagram_content_publish também requerem App Review
// quando usados no Facebook Login Dialog. Para conectar a página do Facebook
// e obter o Page Access Token, apenas estes são necessários:
const FB_SCOPES = [
  "pages_show_list",
  "pages_read_engagement",
  "business_management",
].join(",");

// Vanity name da página da Triarc Solutions no Facebook
const FB_PAGE_VANITY = "Triarcsolutions";

// URI fixa — deve bater exatamente com o cadastrado no Facebook Login
const FACEBOOK_REDIRECT_URI = "https://tsm.triarcsolutions.com.br/auth/facebook/callback";

function getRedirectUri(_origin: string): string {
  return FACEBOOK_REDIRECT_URI;
}

/**
 * Busca o Page Access Token e Page ID da página da Triarc Solutions.
 * Retorna { pageId, pageToken } ou null se não encontrar.
 */
async function resolvePageToken(
  userToken: string
): Promise<{ pageId: string; pageToken: string; pageName: string } | null> {
  try {
    const res = await fetch(
      `${FB_GRAPH_URL}/me/accounts?fields=id,name,access_token,category&access_token=${userToken}`
    );
    if (!res.ok) {
      console.warn("[Facebook] /me/accounts status:", res.status, await res.text());
      return null;
    }
    const data = await res.json() as any;
    const pages: any[] = data?.data ?? [];

    if (pages.length === 0) {
      console.warn("[Facebook] Nenhuma página encontrada para este usuário");
      return null;
    }

    // Tenta encontrar a página da Triarc pelo nome (case-insensitive)
    const triarc = pages.find((p: any) =>
      p.name?.toLowerCase().includes("triarc") ||
      p.id === FB_PAGE_VANITY
    ) ?? pages[0]; // fallback: primeira página disponível

    console.log(`[Facebook] Página selecionada: ${triarc.name} (${triarc.id})`);
    return { pageId: triarc.id, pageToken: triarc.access_token, pageName: triarc.name };
  } catch (err) {
    console.warn("[Facebook] Erro ao resolver Page token:", err);
    return null;
  }
}

export function registerFacebookRoutes(app: Express) {
  // Step 1: Redireciona para Facebook Login
  app.get("/api/facebook/auth", (req: Request, res: Response) => {
    const origin = (req.query.origin as string) || "http://localhost:3000";
    const accountId = req.query.accountId as string;
    const redirectUri = getRedirectUri(origin);
    const state = Buffer.from(JSON.stringify({ origin, accountId })).toString("base64url");

    const params = new URLSearchParams({
      client_id: ENV.facebookAppId,
      redirect_uri: redirectUri,
      scope: FB_SCOPES,
      state,
      response_type: "code",
    });

    res.redirect(`${FB_AUTH_URL}?${params.toString()}`);
  });

  // Step 2: Callback — troca code por token, busca Page token, salva no banco
  app.get("/auth/facebook/callback", async (req: Request, res: Response) => {
    const { code, state, error } = req.query as Record<string, string>;

    if (error) {
      console.error("[Facebook] OAuth error:", error);
      return res.redirect("/?facebook_error=" + encodeURIComponent(error));
    }

    let origin = "http://localhost:3000";
    let accountId: string | undefined;
    try {
      const decoded = JSON.parse(Buffer.from(state, "base64url").toString());
      origin = decoded.origin;
      accountId = decoded.accountId;
    } catch {
      console.warn("[Facebook] Could not parse state");
    }

    const redirectUri = getRedirectUri(origin);

    try {
      // Troca code por User Access Token
      const tokenRes = await fetch(
        `${FB_TOKEN_URL}?client_id=${ENV.facebookAppId}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${ENV.facebookAppSecret}&code=${code}`
      );
      const tokenData = await tokenRes.json() as any;

      if (!tokenData.access_token) {
        console.error("[Facebook] Token exchange failed:", tokenData);
        return res.redirect("/?facebook_error=token_exchange_failed");
      }

      const userToken = tokenData.access_token;

      // Busca o Page Access Token da página da Triarc
      const page = await resolvePageToken(userToken);

      // Fallback: se não há Page, usa o próprio userToken para publicar no perfil/feed pessoal
      let finalToken = userToken;
      let pageRef = "fb:personal";
      if (page) {
        finalToken = page.pageToken;
        pageRef = `fb:page:${page.pageId}`;
        console.log(`[Facebook] Usando Page token: ${page.pageName} (${page.pageId})`);
      } else {
        console.warn("[Facebook] Nenhuma Page encontrada — usando token pessoal como fallback");
      }

      const expiresAt = new Date(Date.now() + 60 * 24 * 3600 * 1000); // 60 dias

      if (accountId) {
        const db = await getDb();
        if (!db) throw new Error("DB unavailable");
        await db.update(instagramAccounts)
          .set({
            accessToken: finalToken,
            tokenExpiresAt: expiresAt,
            linkedinUrn: pageRef,
          })
          .where(eq(instagramAccounts.id, parseInt(accountId)));
        console.log(`[Facebook] Token salvo para conta ${accountId} (ref: ${pageRef})`);
      }

      res.redirect(`${origin}/accounts?facebook_connected=1`);
    } catch (err) {
      console.error("[Facebook] Callback error:", err);
      res.redirect("/?facebook_error=callback_failed");
    }
  });
}

/**
 * Publica post na Facebook Page via Graph API
 */
export async function publishToFacebook(params: {
  pageToken: string;
  pageId: string;
  caption: string;
  imageUrl?: string;
}): Promise<{ postId: string; permalink: string }> {
  const { pageToken, pageId, caption, imageUrl } = params;

  let postId: string;

  if (imageUrl) {
    // Publica com foto via /photos endpoint
    const formData = new URLSearchParams({
      caption,
      url: imageUrl,
      access_token: pageToken,
      published: "true",
    });

    const res = await fetch(`${FB_GRAPH_URL}/${pageId}/photos`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formData.toString(),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Facebook photo post failed: ${res.status} ${err}`);
    }

    const data = await res.json() as any;
    postId = data.post_id ?? data.id ?? "";
  } else {
    // Publica só texto via /feed endpoint
    const formData = new URLSearchParams({
      message: caption,
      access_token: pageToken,
    });

    const res = await fetch(`${FB_GRAPH_URL}/${pageId}/feed`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formData.toString(),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Facebook feed post failed: ${res.status} ${err}`);
    }

    const data = await res.json() as any;
    postId = data.id ?? "";
  }

  const permalink = postId
    ? `https://www.facebook.com/${pageId}/posts/${postId.split("_")[1] ?? postId}`
    : `https://www.facebook.com/${pageId}`;

  return { postId, permalink };
}
