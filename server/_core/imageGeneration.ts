import { storagePut } from "server/storage";
import { ENV } from "./env";

export type GenerateImageOptions = {
  prompt: string;
  originalImages?: Array<{ url?: string; b64Json?: string; mimeType?: string }>;
};

export type GenerateImageResponse = { url?: string };

/** Modelos de imagem erram muito texto em PT — proibir texto na arte. */
const IMAGE_NO_TEXT_RULES = `CRITICAL RULES: Do NOT render any text, letters, words, numbers, typography, headlines, titles or captions inside the image. No Portuguese or English visible. Convey the topic only through abstract visuals, icons, symbols, colors and composition. All readable text belongs in the Instagram caption, not in the image.`;

const TRIARC_VISUAL_STYLE =
  "Modern premium tech aesthetic, cyan (#00BFFF) and dark navy (#0A1628), minimalist corporate design, subtle circuit patterns and holographic glow. Place the Triarc Solutions logo emblem (circular tech badge with gears) in the bottom-right corner. 1080x1080 square, magazine quality.";

/** Fallbacks se o modelo principal retornar 404 (preview antigos descontinuados). */
const GEMINI_IMAGE_MODEL_FALLBACKS = [
  "gemini-2.5-flash-image",
  "gemini-3.1-flash-image",
  "gemini-3-pro-image",
] as const;

/** Prompt padronizado: visual puro, sem texto na imagem. */
export function buildTriarcImagePrompt(topic: string): string {
  return `Premium Instagram visual for Triarc Solutions, a Brazilian tech company. Visual mood inspired by the concept: "${topic}". ${TRIARC_VISUAL_STYLE} ${IMAGE_NO_TEXT_RULES}`;
}

function formatGeminiHttpError(status: number, model: string, detail: string): string {
  if (status === 429) {
    return (
      "Cota da API Gemini esgotada. Geração de imagem exige billing ativo no Google AI Studio " +
      "(ai.google.dev) — o plano gratuito pode ter limite 0 para modelos de imagem. " +
      "Ative faturamento ou aguarde ~1 min e tente de novo. Alternativa: cole uma URL de imagem manualmente."
    );
  }
  if (status === 403) {
    return "GEMINI_API_KEY inválida ou sem permissão para gerar imagens. Verifique a chave em ai.google.dev.";
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

export async function generateImage(
  options: GenerateImageOptions
): Promise<GenerateImageResponse> {
  if (!ENV.geminiApiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  const prompt = options.prompt.includes("Do NOT render any text")
    ? options.prompt
    : `${options.prompt}\n\n${IMAGE_NO_TEXT_RULES}`;

  const parts: unknown[] = [{ text: prompt }];

  for (const img of options.originalImages ?? []) {
    if (img.b64Json) {
      parts.push({
        inlineData: { mimeType: img.mimeType ?? "image/jpeg", data: img.b64Json },
      });
    } else if (img.url) {
      try {
        const imgRes = await fetch(img.url);
        if (imgRes.ok) {
          const buf = await imgRes.arrayBuffer();
          const b64 = Buffer.from(buf).toString("base64");
          const mimeType = imgRes.headers.get("content-type") ?? img.mimeType ?? "image/jpeg";
          parts.push({ inlineData: { mimeType, data: b64 } });
        }
      } catch {
        // skip unavailable reference images
      }
    }
  }

  const body = {
    contents: [{ parts }],
    generationConfig: { responseModalities: ["IMAGE", "TEXT"] },
  };

  const models = uniqueModels(ENV.geminiImageModel);
  let lastError = "";

  for (const model of models) {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${ENV.geminiApiKey}`;

    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });

    if (response.status === 404) {
      lastError = await response.text().catch(() => `model ${model} not found`);
      console.warn(`[Gemini] Modelo ${model} indisponível (404), tentando próximo...`);
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
      throw new Error(`Gemini (${model}) did not return an image`);
    }

    const { data: b64Data, mimeType } = imagePart.inlineData;
    const buffer = Buffer.from(b64Data, "base64");
    const ext = mimeType.split("/")[1] ?? "png";

    const { url } = await storagePut(`generated/${Date.now()}.${ext}`, buffer, mimeType);
    console.log(`[Gemini] Imagem gerada com modelo ${model}`);
    return { url };
  }

  throw new Error(
    `Gemini image generation failed: nenhum modelo de imagem disponível. Último erro: ${lastError}. ` +
    `Configure GEMINI_IMAGE_MODEL (ex: gemini-2.5-flash-image) ou verifique a API key.`
  );
}
