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
  // Image generation: Gemini
  geminiApiKey: process.env.GEMINI_API_KEY ?? "",
  // News API
  newsApiKey: process.env.NEWS_API_KEY ?? "",
  // Social media OAuth
  linkedinClientId: process.env.LINKEDIN_CLIENT_ID ?? "",
  linkedinClientSecret: process.env.LINKEDIN_CLIENT_SECRET ?? "",
  facebookAppId: process.env.FACEBOOK_APP_ID ?? "",
  facebookAppSecret: process.env.FACEBOOK_APP_SECRET ?? "",
  // Instagram direct
  igUserId: process.env.IG_USER_ID ?? "",
  igUsername: process.env.IG_USERNAME ?? "",
  // Supabase storage
  supabaseUrl: process.env.SUPABASE_URL ?? "",
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
  // First admin
  adminEmail: process.env.ADMIN_EMAIL ?? "admin@triarcsolutions.com.br",
  adminPassword: process.env.ADMIN_PASSWORD ?? "",
  // Cron security
  cronSecret: process.env.CRON_SECRET ?? "",
};
