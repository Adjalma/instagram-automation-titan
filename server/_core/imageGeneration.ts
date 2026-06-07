import { storagePut } from "server/storage";
import { ENV } from "./env";

export type GenerateImageOptions = {
  prompt: string;
  compact?: boolean;
  /** Ignorado — logo descrito no prompt textual */
  originalImages?: Array<{ url?: string; b64Json?: string; mimeType?: string }>;
};

export type GenerateImageResponse = { url: string };

const GEMINI_TIMEOUT_MS = 90_000;
const MAX_RETRIES = 3;
const RETRYABLE_STATUSES = new Set([429, 500, 503]);

const IMAGE_NO_TEXT = "No text, letters or words in the image — visual only.";

const COMPACT_STYLE =
  "Triarc Solutions tech brand, cyan #00BFFF and navy #0A1628, modern minimal square 1080x1080, abstract visuals.";

export function buildTriarcImagePrompt(topic: string): string {
  return `Instagram visual for Triarc Solutions (Brazilian tech). Theme: "${topic}". ${COMPACT_STYLE} ${IMAGE_NO_TEXT}`;
}

export function buildCompactImagePrompt(topic: string): string {
  return `Square tech Instagram art, Triarc brand cyan/navy. Topic: "${topic}". ${IMAGE_NO_TEXT}`;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function formatGeminiHttpError(status: number, model: string, detail: string): string {
  if (status === 503 || detail.includes("high demand") || detail.includes("UNAVAILABLE")) {
    return "Gemini sobrecarregado (alta demanda). Aguarde 1–2 minutos e tente novamente.";
  }
  if (status === 429) {
    if (detail.includes("free_tier") && detail.includes("limit: 0")) {
      return "Cota de IMAGEM Gemini = 0. Verifique billing e GEMINI_API_KEY no Vercel.";
    }
    return "Limite Gemini atingido. Aguarde ~1 minuto.";
  }
  if (status === 403) {
    return "GEMINI_API_KEY inválida. Verifique ai.google.dev.";
  }
  return `Gemini erro ${status} [${model}]: ${detail.slice(0, 200)}`;
}

async function callGemini(model: string, prompt: string): Promise<Response> {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${ENV.geminiApiKey}`;
  const body = {
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: { responseModalities: ["TEXT", "IMAGE"] },
  };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS);
  const t0 = Date.now();
  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    console.log(`[Gemini] ${model} → ${res.status} (${Date.now() - t0}ms)`);
    return res;
  } catch (err: unknown) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error(`Gemini demorou mais de ${GEMINI_TIMEOUT_MS / 1000}s. Tente novamente.`);
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

async function callGeminiWithRetry(model: string, prompt: string): Promise<Response> {
  let lastDetail = "";
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    const res = await callGemini(model, prompt);
    if (res.ok || res.status === 404) return res;

    lastDetail = await res.text().catch(() => "");
    if (!RETRYABLE_STATUSES.has(res.status)) {
      throw new Error(formatGeminiHttpError(res.status, model, lastDetail));
    }
    if (attempt < MAX_RETRIES) {
      const wait = attempt * 3000;
      console.warn(`[Gemini] retry ${attempt}/${MAX_RETRIES} em ${wait}ms (${res.status})`);
      await sleep(wait);
    }
  }
  throw new Error(formatGeminiHttpError(503, model, lastDetail || "high demand"));
}

function extractImageB64(result: unknown): { data: string; mimeType: string } | null {
  const r = result as {
    candidates?: Array<{
      content?: { parts?: Array<{ inlineData?: { data: string; mimeType: string } }> };
    }>;
    promptFeedback?: { blockReason?: string };
  };

  if (r.promptFeedback?.blockReason) {
    throw new Error(`Gemini bloqueou o prompt: ${r.promptFeedback.blockReason}`);
  }

  for (const part of r.candidates?.[0]?.content?.parts ?? []) {
    if (part.inlineData?.data) {
      return { data: part.inlineData.data, mimeType: part.inlineData.mimeType || "image/png" };
    }
  }
  return null;
}

async function persistImage(b64Data: string, mimeType: string): Promise<string> {
  const buffer = Buffer.from(b64Data, "base64");
  const ext = mimeType.split("/")[1]?.replace("jpeg", "jpg") ?? "png";
  const relKey = `generated/${Date.now()}.${ext}`;

  try {
    const { url } = await storagePut(relKey, buffer, mimeType);
    return url;
  } catch (storageErr: unknown) {
    const msg = storageErr instanceof Error ? storageErr.message : String(storageErr);
    console.error("[Gemini] Storage falhou, usando data URL:", msg);
    return `data:${mimeType};base64,${b64Data}`;
  }
}

export async function generateImage(options: GenerateImageOptions): Promise<GenerateImageResponse> {
  if (!ENV.geminiApiKey) {
    throw new Error("GEMINI_API_KEY não configurada no Vercel.");
  }

  const prompt =
    options.compact || options.prompt.length <= 500
      ? options.prompt
      : buildCompactImagePrompt(options.prompt.slice(0, 150));

  const models = [ENV.geminiImageModel, "gemini-2.5-flash-image"].filter(
    (m, i, a) => a.indexOf(m) === i
  );

  let last404 = "";

  for (const model of models) {
    const response = await callGeminiWithRetry(model, prompt);

    if (response.status === 404) {
      last404 = model;
      continue;
    }

    const result = await response.json().catch(() => null);
    if (!result) throw new Error("Gemini retornou resposta inválida.");

    const image = extractImageB64(result);
    if (!image) {
      throw new Error("Gemini não retornou imagem — tente outro tema.");
    }

    const url = await persistImage(image.data, image.mimeType);
    console.log(`[Gemini] OK ${model} → ${url.slice(0, 80)}`);
    return { url };
  }

  throw new Error(
    last404
      ? `Modelo Gemini indisponível (${last404}). Configure GEMINI_IMAGE_MODEL=gemini-2.5-flash-image`
      : "Falha ao gerar imagem com Gemini."
  );
}

export async function probeImageStack(): Promise<{
  geminiKey: boolean;
  geminiModel: string;
  supabase: boolean;
  bucket: string;
  appUrl: string;
}> {
  return {
    geminiKey: !!ENV.geminiApiKey,
    geminiModel: ENV.geminiImageModel,
    supabase: !!(ENV.supabaseUrl && ENV.supabaseServiceRoleKey),
    bucket: process.env.SUPABASE_STORAGE_BUCKET ?? "triarc-social",
    appUrl: ENV.appUrl || "(not set)",
  };
}
