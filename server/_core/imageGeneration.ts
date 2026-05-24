import { storagePut } from "server/storage";
import { ENV } from "./env";

export type GenerateImageOptions = {
  prompt: string;
  originalImages?: Array<{ url?: string; b64Json?: string; mimeType?: string }>;
};

export type GenerateImageResponse = { url?: string };

export async function generateImage(
  options: GenerateImageOptions
): Promise<GenerateImageResponse> {
  if (!ENV.geminiApiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  const model = "gemini-2.0-flash-preview-image-generation";
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${ENV.geminiApiKey}`;

  // Build contents — include reference images if provided
  const parts: unknown[] = [{ text: options.prompt }];

  for (const img of options.originalImages ?? []) {
    if (img.b64Json) {
      parts.push({
        inlineData: { mimeType: img.mimeType ?? "image/jpeg", data: img.b64Json },
      });
    } else if (img.url) {
      // Fetch remote image and embed as base64
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

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Gemini image generation failed (${response.status}): ${detail}`);
  }

  const result = (await response.json()) as {
    candidates?: Array<{
      content?: { parts?: Array<{ inlineData?: { data: string; mimeType: string } }> };
    }>;
  };

  const imagePart = result.candidates?.[0]?.content?.parts?.find((p) => p.inlineData);
  if (!imagePart?.inlineData) {
    throw new Error("Gemini did not return an image");
  }

  const { data: b64Data, mimeType } = imagePart.inlineData;
  const buffer = Buffer.from(b64Data, "base64");
  const ext = mimeType.split("/")[1] ?? "png";

  const { url } = await storagePut(`generated/${Date.now()}.${ext}`, buffer, mimeType);
  return { url };
}
