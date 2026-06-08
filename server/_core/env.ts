/** Nomes aceitos para Page token IG no Vercel (prioridade top → bottom). */
const IG_TOKEN_ENV_KEYS = [
  "IG_ACCESS_TOKEN",
  "IG_ACESS_TOKEN", // typo comum no Vercel
  "FB_PAGE_TOKEN",
  "PAGE_ACCESS_TOKEN",
  "FACEBOOK_PAGE_TOKEN",
  "META_PAGE_ACCESS_TOKEN",
] as const;

/** Resolve Page token IG a partir de env vars (não lê OAuth Contas). */
export function resolveIgAccessTokenFromEnv(): { token: string; source: string | null } {
  for (const key of IG_TOKEN_ENV_KEYS) {
    const t = process.env[key]?.trim();
    if (t) return { token: t, source: key };
  }
  return { token: "", source: null };
}

/** Diagnóstico health — nomes de vars, sem expor valores. */
export function describeIgTokenEnv(): Record<string, string> {
  const status: Record<string, string> = {};
  for (const key of IG_TOKEN_ENV_KEYS) {
    const t = process.env[key]?.trim();
    status[key] = t ? `set (${t.length} chars)` : "not set";
  }
  const { source } = resolveIgAccessTokenFromEnv();
  status.resolvedFrom = source ?? "none";
  status.tokenRelatedKeys =
    Object.keys(process.env)
      .filter((k) => /IG|TOKEN|PAGE|FB_|FACEBOOK|META/i.test(k))
      .sort()
      .join(", ") || "(none)";
  return status;
}

export const ENV = {
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  isProduction: process.env.NODE_ENV === "production",
  appUrl: process.env.APP_URL ?? "http://localhost:3000",
  // LLM — DeepSeek (OpenAI-compatible)
  deepseekApiKey: process.env.DEEPSEEK_API_KEY ?? "",
  deepseekBaseUrl: process.env.DEEPSEEK_BASE_URL ?? "https://api.deepseek.com",
  deepseekModel: process.env.DEEPSEEK_MODEL ?? "deepseek-chat",
  // Fallback: Anthropic Claude
  anthropicApiKey: process.env.ANTHROPIC_API_KEY ?? "",
  // Image generation: Gemini (Nano Banana)
  geminiApiKey: process.env.GEMINI_API_KEY ?? "",
  /** Modelo de imagem — padrão gemini-2.5-flash-image (substitui preview 2.0 descontinuado) */
  geminiImageModel: process.env.GEMINI_IMAGE_MODEL ?? "gemini-2.5-flash-image",
  // News API
  newsApiKey: process.env.NEWS_API_KEY ?? "",
  // Social media OAuth
  linkedinClientId: process.env.LINKEDIN_CLIENT_ID ?? "",
  linkedinClientSecret: process.env.LINKEDIN_CLIENT_SECRET ?? "",
  facebookAppId: process.env.FACEBOOK_APP_ID ?? "",
  facebookAppSecret: process.env.FACEBOOK_APP_SECRET ?? "",
  /** Scopes OAuth customizados (separados por vírgula). Sobrescreve o padrão. */
  facebookOAuthScopes: process.env.FACEBOOK_OAUTH_SCOPES ?? "",
  /** "1" = inclui instagram_basic + instagram_content_publish (exige produto IG no app Meta) */
  facebookIgScopes: process.env.FACEBOOK_IG_SCOPES === "1",
  /** Facebook Login for Business — config_id do Meta Developer */
  facebookLoginConfigId: process.env.FACEBOOK_LOGIN_CONFIG_ID ?? "",
  // Instagram direct
  igUserId: process.env.IG_USER_ID ?? "",
  igUsername: process.env.IG_USERNAME ?? "",
  igAccessToken: process.env.IG_ACCESS_TOKEN ?? "",
  // Facebook
  fbPageId: process.env.PAGE_ID ?? "",
  fbPageToken: process.env.FB_PAGE_TOKEN ?? process.env.IG_ACCESS_TOKEN ?? "",
  // LinkedIn
  liAccessToken: process.env.LI_ACCESS_TOKEN ?? "",
  liPersonUrn: process.env.LI_PERSON_URN ?? "",
  // Supabase storage
  supabaseUrl: process.env.SUPABASE_URL ?? "",
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
  // First admin
  adminEmail: process.env.ADMIN_EMAIL ?? "admin@triarcsolutions.com.br",
  adminPassword: process.env.ADMIN_PASSWORD ?? "",
  // Cron security
  cronSecret: process.env.CRON_SECRET ?? "",
};
