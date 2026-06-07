import { storagePut } from "server/storage";
import { ENV } from "./env";

export type GenerateImageOptions = {
  prompt: string;
  originalImages?: Array<{ url?: string; b64Json?: string; mimeType?: string }>;
};

export type GenerateImageResponse = { url?: string };

const GEMINI_TIMEOUT_MS = 55_000;
const MAX_RETRIES_PER_MODEL = 2;
const RETRYABLE_STATUSES = new Set([429, 500, 503]);

const IMAGE_NO_TEXT_RULES = `CRITICAL RULES: Do NOT render any text, letters, words, numbers, typography, headlines, titles or captions inside the image. No Portuguese or English visible. Convey the topic only through abstract visuals, icons, symbols, colors and composition. All readable text belongs in the Instagram caption, not in the image.`;

const TRIARC_VISUAL_STYLE =
  "Modern premium tech aesthetic, cyan (#00BFFF) and dark navy (#0A1628), minimalist corporate design, subtle circuit patterns and holographic glow. Place the Triarc Solutions logo emblem (circular tech badge with gears) in the bottom-right corner. 1080x1080 square, magazine quality.";

const GEMINI_IMAGE_MODEL_FALLBACKS = [
  "gemini-2.5-flash-image",
  "gemini-3.1-flash-image-preview",
] as const;

export function buildTriarcImagePrompt(topic: string): string {
  return `Premium Instagram visual for Triarc Solutions, a Brazilian tech company. Visual mood inspired by the concept: "${topic}". ${TRIARC_VISUAL_STYLE} ${IMAGE_NO_TEXT_RULES}`;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function formatGeminiHttpError(status: number, model: string, detail: string): string {
  if (status === 503 || detail.includes("high demand") || detail.includes("UNAVAILABLE")) {
    return (
      "Servidor Gemini sobrecarregado (alta demanda temporária). " +
      "Aguarde 1–2 minutos e clique em Gerar Imagem novamente."
    );
  }
  if (status === 429) {
    const isFreeTierZero =
      detail.includes("free_tier") &&
      (detail.includes("limit: 0") || detail.includes('"limit":0'));
    if (isFreeTierZero) {
      return (
        "Geração de IMAGEM no Gemini está com cota 0 no tier gratuito — separado do saldo de texto. " +
        "Vincule billing ao projeto da API key, crie NOVA GEMINI_API_KEY, atualize no Vercel."
      );
    }
    return "Limite Gemini atingido. Aguarde ~1 minuto ou cole URL de imagem manualmente.";
  }
  if (status === 403) {
    return "GEMINI_API_KEY inválida ou sem permissão. Verifique ai.google.dev.";
  }
  if (status === 400 && detail.includes("responseModalities")) {
    return `Configuração Gemini inválida [${model}]. Contate suporte — responseModalities.`;
  }
  return `Gemini falhou (${status}) [${model}]: ${detail.slice(0, 400)}`;
}

function uniqueModels(primary: string): string[] {
  const seen = new Set<string>();
  return [primary, ...GEMINI_IMAGE_MODEL_FALLBACKS].filter((m) => {
    if (seen.has(m)) return false;
    seen.add(m);
    return true;
  });
}

async function callGeminiImage(model: string, body: object): Promise<Response> {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${ENV.geminiApiKey}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS);
  const started = Date.now();
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    console.log(`[Gemini] ${model} → HTTP ${response.status} em ${Date.now() - started}ms`);
    return response;
  } catch (err: unknown) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error(
        `Gemini (${model}) excedeu ${GEMINI_TIMEOUT_MS / 1000}s. Tente novamente ou cole URL manualmente.`
      );
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

/** Retenta 503/429/500 com backoff; devolve response ou null se esgotou tentativas. */
async function callGeminiWithRetry(model: string, body: object): Promise<Response | null> {
  let lastDetail = "";

  for (let attempt = 1; attempt <= MAX_RETRIES_PER_MODEL; attempt++) {
    const response = await callGeminiImage(model, body);

    if (response.ok || response.status === 404) {
      return response;
    }

    lastDetail = await response.text().catch(() => "");

    if (!RETRYABLE_STATUSES.has(response.status)) {
      throw new Error(formatGeminiHttpError(response.status, model, lastDetail));
    }

    if (attempt < MAX_RETRIES_PER_MODEL) {
      const delayMs = attempt * 2000;
      console.warn(
        `[Gemini] ${model} HTTP ${response.status} — retry ${attempt}/${MAX_RETRIES_PER_MODEL} em ${delayMs}ms`
      );
      await sleep(delayMs);
    }
  }

  console.warn(`[Gemini] ${model} esgotou retries (${lastDetail.slice(0, 120)})`);
  return null;
}

function extractImagePart(result: {
  candidates?: Array<{
    content?: { parts?: Array<{ inlineData?: { data: string; mimeType: string }; text?: string }> };
    finishReason?: string;
  }>;
  promptFeedback?: { blockReason?: string };
}) {
  if (result.promptFeedback?.blockReason) {
    throw new Error(`Gemini bloqueou o prompt: ${result.promptFeedback.blockReason}`);
  }

  const candidate = result.candidates?.[0];
  if (!candidate) {
    throw new Error("Gemini não retornou candidatos — prompt pode ter sido bloqueado.");
  }

  if (candidate.finishReason && candidate.finishReason !== "STOP") {
    console.warn(`[Gemini] finishReason=${candidate.finishReason}`);
  }

  return candidate.content?.parts?.find((p) => p.inlineData?.data);
}

export async function generateImage(
  options: GenerateImageOptions
): Promise<GenerateImageResponse> {
  if (!ENV.geminiApiKey) {
    throw new Error("GEMINI_API_KEY não configurada no Vercel.");
  }

  const prompt = options.prompt.includes("Do NOT render any text")
    ? options.prompt
    : `${options.prompt}\n\n${IMAGE_NO_TEXT_RULES}`;

  const body = {
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      responseModalities: ["TEXT", "IMAGE"],
    },
  };

  const models = uniqueModels(ENV.geminiImageModel);
  let lastError = "";
  let saw503 = false;

  for (const model of models) {
    const response = await callGeminiWithRetry(model, body);

    if (!response) {
      saw503 = true;
      lastError = `modelo ${model} indisponível (503/429)`;
      continue;
    }

    if (response.status === 404) {
      lastError = await response.text().catch(() => `model ${model} not found`);
      console.warn(`[Gemini] Modelo ${model} indisponível (404)`);
      continue;
    }

    let result: unknown;
    try {
      result = await response.json();
    } catch {
      throw new Error(`Gemini (${model}) retornou JSON inválido.`);
    }

    const imagePart = extractImagePart(result as Parameters<typeof extractImagePart>[0]);
    if (!imagePart?.inlineData) {
      throw new Error(`Gemini (${model}) não retornou imagem — tente outro tema ou URL manual.`);
    }

    const { data: b64Data, mimeType } = imagePart.inlineData;
    const buffer = Buffer.from(b64Data, "base64");
    const ext = mimeType.split("/")[1]?.replace("jpeg", "jpg") ?? "png";

    const { url } = await storagePut(`generated/${Date.now()}.${ext}`, buffer, mimeType);
    console.log(`[Gemini] Imagem OK (${model}) → ${url.slice(0, 80)}...`);
    return { url };
  }

  if (saw503) {
    throw new Error(formatGeminiHttpError(503, models[0] ?? "gemini", "high demand"));
  }

  throw new Error(
    `Nenhum modelo Gemini de imagem disponível. ${lastError}. Verifique GEMINI_API_KEY e ai.dev/rate-limit.`
  );
}

export async function probeImageStack(): Promise<{
  geminiKey: boolean;
  geminiModel: string;
  supabase: boolean;
  bucket: string;
}> {
  return {
    geminiKey: !!ENV.geminiApiKey,
    geminiModel: ENV.geminiImageModel,
    supabase: !!(ENV.supabaseUrl && ENV.supabaseServiceRoleKey),
    bucket: process.env.SUPABASE_STORAGE_BUCKET ?? "triarc-social",
  };
}
