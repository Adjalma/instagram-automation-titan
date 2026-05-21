/**
 * LinkedIn OAuth 2.0 + UGC Posts API
 * Publica na Company Page triarc-solutions-brasil
 *
 * Escopos necessários (produto "Share on LinkedIn"):
 *   r_liteprofile         — ler perfil do usuário autenticado
 *   w_member_social       — publicar como pessoa física (fallback)
 *   w_organization_social — publicar como Company Page (principal)
 *   r_organization_social — ler posts da Company Page
 */
import { Express, Request, Response } from "express";
import { ENV } from "./_core/env";
import { getDb } from "./db";
import { instagramAccounts } from "../drizzle/schema";
import { eq } from "drizzle-orm";

const LINKEDIN_AUTH_URL = "https://www.linkedin.com/oauth/v2/authorization";
const LINKEDIN_TOKEN_URL = "https://www.linkedin.com/oauth/v2/accessToken";
const LINKEDIN_UGC_URL = "https://api.linkedin.com/v2/ugcPosts";
const LINKEDIN_ASSETS_URL = "https://api.linkedin.com/v2/assets?action=registerUpload";
const LINKEDIN_ORG_VANITY = "triarc-solutions-brasil";

// Produto "Share on LinkedIn" concede APENAS w_member_social
// w_organization_social requer produto "Community Management API" (não aprovado)
const SCOPES = "w_member_social";

function getRedirectUri(origin: string): string {
  if (origin.includes("tsm.triarcsolutions.com.br")) {
    return "https://tsm.triarcsolutions.com.br/auth/linkedin/callback";
  }
  if (origin.includes("triarcsolutions.com.br")) {
    return "https://triarcsolutions.com.br/auth/linkedin/callback";
  }
  return "http://localhost:3000/auth/linkedin/callback";
}

/**
 * Busca o Organization URN via vanityName.
 * Retorna urn:li:organization:{id} ou null se não encontrar / sem permissão.
 */
async function resolveOrganizationUrn(accessToken: string): Promise<string | null> {
  try {
    // Busca por vanityName (não requer r_organization_admin)
    const res = await fetch(
      `https://api.linkedin.com/v2/organizations?q=vanityName&vanityName=${LINKEDIN_ORG_VANITY}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    if (!res.ok) {
      console.warn("[LinkedIn] organizations lookup status:", res.status);
      return null;
    }
    const data = await res.json() as any;
    const org = data?.elements?.[0];
    if (org?.id) {
      const urn = `urn:li:organization:${org.id}`;
      console.log(`[LinkedIn] Organization encontrada: ${urn}`);
      return urn;
    }

    // Fallback: busca via organizationAcls (admin memberships)
    const aclRes = await fetch(
      "https://api.linkedin.com/v2/organizationAcls?q=roleAssignee&role=ADMINISTRATOR&projection=(elements*(organization~(id,vanityName,localizedName)))",
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    if (!aclRes.ok) return null;
    const aclData = await aclRes.json() as any;
    const match = aclData?.elements?.find(
      (e: any) => e["organization~"]?.vanityName === LINKEDIN_ORG_VANITY
    );
    if (match?.["organization~"]?.id) {
      const urn = `urn:li:organization:${match["organization~"].id}`;
      console.log(`[LinkedIn] Organization via ACL: ${urn}`);
      return urn;
    }
  } catch (err) {
    console.warn("[LinkedIn] Erro ao resolver organization URN:", err);
  }
  return null;
}

export function registerLinkedInRoutes(app: Express) {
  // Step 1: Redirect to LinkedIn OAuth
  app.get("/api/linkedin/auth", (req: Request, res: Response) => {
    const origin = req.query.origin as string || "http://localhost:3000";
    const accountId = req.query.accountId as string;
    const redirectUri = getRedirectUri(origin);
    const state = Buffer.from(JSON.stringify({ origin, accountId })).toString("base64url");

    const params = new URLSearchParams({
      response_type: "code",
      client_id: ENV.linkedinClientId,
      redirect_uri: redirectUri,
      scope: SCOPES,
      state,
    });

    res.redirect(`${LINKEDIN_AUTH_URL}?${params.toString()}`);
  });

  // Step 2: Callback — troca code por token, resolve org URN, salva no banco
  app.get("/auth/linkedin/callback", async (req: Request, res: Response) => {
    const { code, state, error } = req.query as Record<string, string>;

    if (error) {
      console.error("[LinkedIn] OAuth error:", error);
      return res.redirect("/?linkedin_error=" + encodeURIComponent(error));
    }

    let origin = "http://localhost:3000";
    let accountId: string | undefined;
    try {
      const decoded = JSON.parse(Buffer.from(state, "base64url").toString());
      origin = decoded.origin;
      accountId = decoded.accountId;
    } catch {
      console.warn("[LinkedIn] Could not parse state");
    }

    const redirectUri = getRedirectUri(origin);

    try {
      // Troca code por access token
      const tokenRes = await fetch(LINKEDIN_TOKEN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code,
          redirect_uri: redirectUri,
          client_id: ENV.linkedinClientId,
          client_secret: ENV.linkedinClientSecret,
        }),
      });

      const tokenData = await tokenRes.json() as any;
      if (!tokenData.access_token) {
        console.error("[LinkedIn] Token exchange failed:", tokenData);
        return res.redirect("/?linkedin_error=token_exchange_failed");
      }

      const { access_token, expires_in } = tokenData;
      const expiresAt = new Date(Date.now() + (expires_in ?? 5184000) * 1000);

      // Resolve o Organization URN da Company Page
      // Sem escopo de leitura de perfil, não há fallback para perfil pessoal
      const linkedinUrn: string | null = await resolveOrganizationUrn(access_token);
      if (!linkedinUrn) {
        console.warn("[LinkedIn] Não foi possível resolver Organization URN para triarc-solutions-brasil");
      }

      if (accountId) {
        const db = await getDb();
        if (!db) throw new Error("DB unavailable");
        await db.update(instagramAccounts)
          .set({
            accessToken: access_token,
            tokenExpiresAt: expiresAt,
            linkedinUrn: linkedinUrn ?? undefined,
          })
          .where(eq(instagramAccounts.id, parseInt(accountId)));
        console.log(`[LinkedIn] Token salvo para conta ${accountId}, URN: ${linkedinUrn}`);
      }

      res.redirect(`${origin}/accounts?linkedin_connected=1`);
    } catch (err) {
      console.error("[LinkedIn] Callback error:", err);
      res.redirect("/?linkedin_error=callback_failed");
    }
  });
}

/**
 * Publica post no LinkedIn (Company Page ou perfil pessoal)
 * O author é determinado pelo linkedinUrn salvo no banco:
 *   urn:li:organization:{id} → Company Page
 *   urn:li:person:{id}       → perfil pessoal (fallback)
 */
export async function publishToLinkedIn(params: {
  accessToken: string;
  linkedinUrn: string;
  caption: string;
  imageUrl?: string;
}): Promise<{ postId: string; permalink: string }> {
  const { accessToken, linkedinUrn, caption, imageUrl } = params;

  const isOrg = linkedinUrn.startsWith("urn:li:organization:");
  console.log(`[LinkedIn] Publicando como ${isOrg ? "Company Page" : "perfil pessoal"}: ${linkedinUrn}`);

  let shareMediaCategory = "NONE";
  let media: any[] = [];

  if (imageUrl) {
    try {
      const uploadedAsset = await registerLinkedInImage(accessToken, linkedinUrn, imageUrl);
      if (uploadedAsset) {
        shareMediaCategory = "IMAGE";
        media = [{
          status: "READY",
          description: { text: caption.slice(0, 200) },
          media: uploadedAsset,
          title: { text: "Triarc Solutions" },
        }];
      }
    } catch (err) {
      console.warn("[LinkedIn] Image upload failed, posting text-only:", err);
    }
  }

  const body: any = {
    author: linkedinUrn,
    lifecycleState: "PUBLISHED",
    specificContent: {
      "com.linkedin.ugc.ShareContent": {
        shareCommentary: { text: caption },
        shareMediaCategory,
        ...(media.length > 0 ? { media } : {}),
      },
    },
    visibility: {
      "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
    },
  };

  const res = await fetch(LINKEDIN_UGC_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "X-Restli-Protocol-Version": "2.0.0",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`LinkedIn UGC post failed: ${res.status} ${err}`);
  }

  const data = await res.json() as any;
  const postId = data.id ?? "";
  const permalink = `https://www.linkedin.com/feed/update/${encodeURIComponent(postId)}`;
  return { postId, permalink };
}

/**
 * Registra e faz upload de imagem para o LinkedIn Assets API
 */
async function registerLinkedInImage(
  accessToken: string,
  ownerUrn: string,
  imageUrl: string
): Promise<string | null> {
  const registerRes = await fetch(LINKEDIN_ASSETS_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      registerUploadRequest: {
        recipes: ["urn:li:digitalmediaRecipe:feedshare-image"],
        owner: ownerUrn,
        serviceRelationships: [{
          relationshipType: "OWNER",
          identifier: "urn:li:userGeneratedContent",
        }],
      },
    }),
  });

  if (!registerRes.ok) return null;
  const registerData = await registerRes.json() as any;
  const uploadUrl = registerData?.value?.uploadMechanism?.["com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest"]?.uploadUrl;
  const assetUrn = registerData?.value?.asset;
  if (!uploadUrl || !assetUrn) return null;

  const imgRes = await fetch(imageUrl);
  if (!imgRes.ok) return null;
  const imgBuffer = await imgRes.arrayBuffer();

  const uploadRes = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "image/jpeg",
    },
    body: imgBuffer,
  });

  if (!uploadRes.ok) return null;
  return assetUrn;
}
