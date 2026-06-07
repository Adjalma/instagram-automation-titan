import { storagePut } from "server/storage";
import { ENV } from "./env";

export type GenerateImageOptions = {
  prompt: string;
  originalImages?: Array<{ url?: string; b64Json?: string; mimeType?: string }>;
};

export type GenerateImageResponse = { url?: string };

const GEMINI_TIMEOUT_MS = 50_000;

/** Modelos de imagem erram muito texto em PT — proibir texto na arte. */
const IMAGE_NO_TEXT_RULES = `CRITICAL RULES: Do NOT render any text, letters, words, numbers, typography, headlines, titles or captions inside the image. No Portuguese or English visible. Convey the topic only through abstract visuals, icons, symbols, colors and composition. All readable text belongs in the Instagram caption, not in the image.`;

const TRIARC_VISUAL_STYLE =
  "Modern premium tech aesthetic, cyan (#00BFFF) and dark navy (#0A1628), minimalist corporate design, subtle circuit patterns and holographic glow. Place the Triarc Solutions logo emblem (circular tech badge with gears) in the bottom-right corner. 1080x1080 square, magazine quality.";

const GEMINI_IMAGE_MODEL_FALLBACKS = [
  "gemini-2.5-flash-image",
  "gemini-3.1-flash-image",
  "gemini-3-pro-image",
] as const;

export function buildTriarcImagePrompt(topic: string): string {
  return `Premium Instagram visual for Triarc Solutions, a Brazilian tech company. Visual mood inspired by the concept: "${topic}". ${TRIARC_VISUAL_STYLE} ${IMAGE_NO_TEXT_RULES}`;
}

function formatGeminiHttpError(status: number, model: string, detail: string): string {
  if (status === 429) {
    const isFreeTierZero =
      detail.includes("free_tier") &&
      (detail.includes("limit: 0") || detail.includes('"limit":0'));
    if (isFreeTierZero) {
      return (
        "Geração de IMAGEM no Gemini está com cota 0 no tier gratuito — separado do saldo de texto. " +
        "Vincule billing ao projeto da API key, crie NOVA GEMINI_API_KEY, atualize no Vercel. " +
        "Alternativa: cole URL de imagem manualmente."
      );
    }
    return "Limite Gemini atingido. Aguarde ~1 minuto ou cole URL de imagem manualmente.";
  }
  if (status === 403) {
    return "GEMINI_API_KEY inválida ou sem permissão. Verifique ai.google.dev.";
  }
  return `Gemini falhou (${status}) [${model}]: ${detail.slice(0, 300)}`;
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
  try {
    return await fetch(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (err: unknown) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error(
        "Gemini demorou mais de 50s. No Vercel Hobby o limite é 10s — faça upgrade Pro " +
        "ou cole uma URL de imagem manualmente."
      );
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
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

  // Só texto no prompt — referência de logo via URL costuma falhar (502) e aumenta latência
  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { responseModalities: ["IMAGE"] },
  };

  const models = uniqueModels(ENV.geminiImageModel);
  let lastError = "";

  for (const model of models) {
    const response = await callGeminiImage(model, body);

    if (response.status === 404) {
      lastError = await response.text().catch(() => `model ${model} not found`);
      console.warn(`[Gemini] Modelo ${model} indisponível (404)`);
      continue;
    }

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      throw new Error(formatGeminiHttpError(response.status, model, detail));
    }

    const result = (await response.json()) as {
      candidates?: Array<{
        content?: { parts?: Array<{ inlineData?: { data: string; mimeType: string } }> };
      }>;
    };

    const imagePart = result.candidates?.[0]?.content?.parts?.find((p) => p.inlineData);
    if (!imagePart?.inlineData) {
      throw new Error(`Gemini (${model}) não retornou imagem — tente outro tema ou URL manual.`);
    }

    const { data: b64Data, mimeType } = imagePart.inlineData;
    const buffer = Buffer.from(b64Data, "base64");
    const ext = mimeType.split("/")[1]?.replace("jpeg", "jpg") ?? "png";

    try {
      const { url } = await storagePut(`generated/${Date.now()}.${ext}`, buffer, mimeType);
      console.log(`[Gemini] Imagem gerada com ${model}`);
      return { url };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("Supabase storage")) {
        throw new Error(
          `${msg} — crie o bucket "${process.env.SUPABASE_STORAGE_BUCKET ?? "triarc-social"}" no Supabase Storage (público).`
        );
      }
      throw err;
    }
  }

  throw new Error(
    `Nenhum modelo Gemini de imagem disponível. ${lastError}. Verifique GEMINI_API_KEY e ai.dev/rate-limit.`
  );
}
