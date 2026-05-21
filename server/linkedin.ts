/**
 * LinkedIn OAuth 2.0 + UGC Posts API
 * Scopes: openid, profile, email, w_member_social
 */
import { Express, Request, Response } from "express";
import { ENV } from "./_core/env";
import { getDb } from "./db";
import { instagramAccounts } from "../drizzle/schema";
import { eq } from "drizzle-orm";

const LINKEDIN_AUTH_URL = "https://www.linkedin.com/oauth/v2/authorization";
const LINKEDIN_TOKEN_URL = "https://www.linkedin.com/oauth/v2/accessToken";
const LINKEDIN_USERINFO_URL = "https://api.linkedin.com/v2/userinfo";
const LINKEDIN_UGC_URL = "https://api.linkedin.com/v2/ugcPosts";
const LINKEDIN_ASSETS_URL = "https://api.linkedin.com/v2/assets?action=registerUpload";

const SCOPES = ["openid", "profile", "email", "w_member_social"].join(" ");

function getRedirectUri(origin: string): string {
  // Use the exact redirect URIs registered in LinkedIn app
  if (ENV.isProduction || origin.includes("triarcsolutions.com.br")) {
    return "https://triarcsolutions.com.br/auth/linkedin/callback";
  }
  // Dev: use localhost:3000 (must be registered in LinkedIn app)
  return "http://localhost:3000/auth/linkedin/callback";
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

  // Step 2: Callback — exchange code for token, save to DB
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
      // Exchange code for access token
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

      // Get LinkedIn profile (URN)
      const profileRes = await fetch(LINKEDIN_USERINFO_URL, {
        headers: { Authorization: `Bearer ${access_token}` },
      });
      const profile = await profileRes.json() as any;
      const linkedinUrn = profile.sub ? `urn:li:person:${profile.sub}` : null;

      // Save token to the LinkedIn account in DB
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
        console.log(`[LinkedIn] Token saved for account ${accountId}, URN: ${linkedinUrn}`);
      }

      res.redirect(`${origin}/accounts?linkedin_connected=1`);
    } catch (err) {
      console.error("[LinkedIn] Callback error:", err);
      res.redirect("/?linkedin_error=callback_failed");
    }
  });
}

/**
 * Publish a post to LinkedIn via UGC Posts API
 */
export async function publishToLinkedIn(params: {
  accessToken: string;
  linkedinUrn: string;
  caption: string;
  imageUrl?: string;
}): Promise<{ postId: string; permalink: string }> {
  const { accessToken, linkedinUrn, caption, imageUrl } = params;

  let shareMediaCategory = "NONE";
  let media: any[] = [];

  // Upload image if provided
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
 * Register and upload an image to LinkedIn
 */
async function registerLinkedInImage(
  accessToken: string,
  ownerUrn: string,
  imageUrl: string
): Promise<string | null> {
  // Register upload
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

  // Download image and upload to LinkedIn
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
