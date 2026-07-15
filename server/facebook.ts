/**
 * Facebook OAuth 2.0 + Pages API
 *
 * Fluxo:
 *   1. /api/facebook/auth → redireciona para Facebook Login
 *   2. /auth/facebook/callback → troca code por Short-Lived → Long-Lived Token → Page Token → salva no banco
 *   3. publishToFacebook() → publica post na Page via Graph API
 *   4. refreshFacebookTokenIfNeeded() → chamado pelo scheduler às 3h para renovar tokens próximos de expirar
 *
 * Long-Lived Tokens:
 *   - Short-Lived User Token: ~1-2h (retornado pelo OAuth)
 *   - Long-Lived User Token: ~60 dias (trocado via fb_exchange_token)
 *   - Page Access Token (de Long-Lived User): NÃO expira enquanto o User Token for válido
 *   - Renovação: trocar o Long-Lived User Token por um novo antes de expirar (sem novo login)
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
const FB_SCOPES = [
  "pages_show_list",
  "pages_read_engagement",
  "pages_manage_posts",   // necessário para publicar na Page
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
 * Troca um Short-Lived Token por um Long-Lived Token (~60 dias).
 * Chamado imediatamente após o OAuth callback para maximizar validade.
 */
export async function exchangeForLongLivedToken(
  shortToken: string
): Promise<{ token: string; expiresIn: number }> {
  const url =
    `${FB_GRAPH_URL}/oauth/access_token` +
    `?grant_type=fb_exchange_token` +
    `&client_id=${ENV.facebookAppId}` +
    `&client_secret=${ENV.facebookAppSecret}` +
    `&fb_exchange_token=${encodeURIComponent(shortToken)}`;
  const res = await fetch(url);
  const data = (await res.json()) as any;
  if (!data.access_token) {
    throw new Error(`Long-lived token exchange failed: ${JSON.stringify(data)}`);
  }
  return { token: data.access_token, expiresIn: data.expires_in ?? 5183944 }; // ~60 dias default
}

/**
 * Renova um Long-Lived Token existente antes de expirar.
 * Pode ser chamado repetidamente — cada chamada reinicia o contador de 60 dias.
 * Retorna null se a renovação falhar (token já expirado ou inválido → precisa de novo login).
 */
export async function refreshLongLivedToken(
  existingToken: string
): Promise<{ token: string; expiresAt: Date } | null> {
  try {
    const url =
      `${FB_GRAPH_URL}/oauth/access_token` +
      `?grant_type=fb_exchange_token` +
      `&client_id=${ENV.facebookAppId}` +
      `&client_secret=${ENV.facebookAppSecret}` +
      `&fb_exchange_token=${encodeURIComponent(existingToken)}`;
    const res = await fetch(url);
    const data = (await res.json()) as any;
    if (!data.access_token) {
      console.warn("[Facebook] Token refresh failed:", data);
      return null;
    }
    const expiresIn = data.expires_in ?? 5183944;
    const expiresAt = new Date(Date.now() + expiresIn * 1000);
    return { token: data.access_token, expiresAt };
  } catch (err) {
    console.error("[Facebook] refreshLongLivedToken error:", err);
    return null;
  }
}

/**
 * Verifica todas as contas Facebook no banco e renova tokens que expiram em menos de 10 dias.
 * Chamado pelo scheduler às 3h Brasília.
 * Retorna { renewed, failed, skipped }.
 */
export async function refreshFacebookTokensIfNeeded(): Promise<{
  renewed: number;
  failed: number;
  skipped: number;
}> {
  const db = await getDb();
  if (!db) return { renewed: 0, failed: 0, skipped: 0 };

  const accounts = await db
    .select()
    .from(instagramAccounts)
    .where(eq(instagramAccounts.platform, "facebook"));

  let renewed = 0, failed = 0, skipped = 0;
  const TEN_DAYS_MS = 10 * 24 * 3600 * 1000;

  for (const acc of accounts) {
    if (!acc.accessToken) { skipped++; continue; }

    const expiresAt = acc.tokenExpiresAt ? new Date(acc.tokenExpiresAt) : null;
    const expiresInMs = expiresAt ? expiresAt.getTime() - Date.now() : 0;

    // Só renova se expira em menos de 10 dias (ou já expirou)
    if (expiresAt && expiresInMs > TEN_DAYS_MS) { skipped++; continue; }

    console.log(`[Facebook] Renovando token da conta ${acc.handle} (expira em ${Math.round(expiresInMs / 86400000)} dias)`);
    const result = await refreshLongLivedToken(acc.accessToken);

    if (result) {
      await db.update(instagramAccounts)
        .set({ accessToken: result.token, tokenExpiresAt: result.expiresAt })
        .where(eq(instagramAccounts.id, acc.id));
      console.log(`[Facebook] Token renovado para ${acc.handle} — novo prazo: ${result.expiresAt.toLocaleDateString("pt-BR")}`);
      renewed++;
    } else {
      console.error(`[Facebook] Falha ao renovar token de ${acc.handle} — reconexão manual necessária`);
      failed++;
    }
  }

  return { renewed, failed, skipped };
}

/**
 * Busca o Page Access Token e Page ID da página da Triarc Solutions.
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
    const data = (await res.json()) as any;
    const pages: any[] = data?.data ?? [];

    if (pages.length === 0) {
      console.warn("[Facebook] Nenhuma página encontrada para este usuário");
      return null;
    }

    const triarc =
      pages.find(
        (p: any) =>
          p.name?.toLowerCase().includes("triarc") || p.id === FB_PAGE_VANITY
      ) ?? pages[0];

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

  // Step 2: Callback — troca code por Short-Lived → Long-Lived → Page Token → salva no banco
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
      // 1. Troca code por Short-Lived User Token
      const tokenRes = await fetch(
        `${FB_TOKEN_URL}?client_id=${ENV.facebookAppId}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${ENV.facebookAppSecret}&code=${code}`
      );
      const tokenData = (await tokenRes.json()) as any;

      if (!tokenData.access_token) {
        console.error("[Facebook] Token exchange failed:", tokenData);
        return res.redirect("/?facebook_error=token_exchange_failed");
      }

      // 2. Troca Short-Lived por Long-Lived Token (~60 dias)
      let userToken = tokenData.access_token;
      let tokenExpiresAt = new Date(Date.now() + 60 * 24 * 3600 * 1000); // fallback 60 dias
      try {
        const llt = await exchangeForLongLivedToken(userToken);
        userToken = llt.token;
        tokenExpiresAt = new Date(Date.now() + llt.expiresIn * 1000);
        console.log(`[Facebook] Long-lived token obtido (expira em ${Math.round(llt.expiresIn / 86400)} dias)`);
      } catch (e) {
        console.warn("[Facebook] Falha ao obter long-lived token, usando short token:", e);
      }

      // 3. Busca Page Access Token (Page tokens de Long-Lived User não expiram)
      const page = await resolvePageToken(userToken);

      let finalToken = userToken;
      let pageRef = "fb:personal";
      if (page) {
        finalToken = page.pageToken;
        pageRef = `fb:page:${page.pageId}`;
        // Page tokens derivados de Long-Lived User tokens não expiram
        // mas mantemos a data do User Token para forçar renovação preventiva
        console.log(`[Facebook] Usando Page token: ${page.pageName} (${page.pageId})`);
      } else {
        console.warn("[Facebook] Nenhuma Page encontrada — usando token pessoal como fallback");
      }

      if (accountId) {
        const db = await getDb();
        if (!db) throw new Error("DB unavailable");
        await db.update(instagramAccounts)
          .set({
            accessToken: finalToken,
            tokenExpiresAt,
            linkedinUrn: pageRef,
          })
          .where(eq(instagramAccounts.id, parseInt(accountId)));
        console.log(`[Facebook] Token salvo para conta ${accountId} (ref: ${pageRef}, expira: ${tokenExpiresAt.toLocaleDateString("pt-BR")})`);
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

  const feedParams: Record<string, string> = {
    message: caption,
    access_token: pageToken,
  };
  if (imageUrl) {
    feedParams.link = imageUrl;
  }

  const formData = new URLSearchParams(feedParams);
  const res = await fetch(`${FB_GRAPH_URL}/${pageId}/feed`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: formData.toString(),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Facebook post failed: ${res.status} ${err}`);
  }

  const data = (await res.json()) as any;
  const postId = data.id ?? "";

  const permalink = postId
    ? `https://www.facebook.com/${pageId}/posts/${postId.split("_")[1] ?? postId}`
    : `https://www.facebook.com/${pageId}`;

  return { postId, permalink };
}
