import { ENV } from "./env";

export type Role = "system" | "user" | "assistant" | "tool" | "function";

export type TextContent = { type: "text"; text: string };
export type ImageContent = { type: "image_url"; image_url: { url: string; detail?: "auto" | "low" | "high" } };
export type FileContent = { type: "file_url"; file_url: { url: string; mime_type?: string } };
export type MessageContent = string | TextContent | ImageContent | FileContent;

export type Message = {
  role: Role;
  content: MessageContent | MessageContent[];
  name?: string;
  tool_call_id?: string;
};

export type Tool = {
  type: "function";
  function: { name: string; description?: string; parameters?: Record<string, unknown> };
};

export type ToolChoice =
  | "none" | "auto" | "required"
  | { name: string }
  | { type: "function"; function: { name: string } };

export type JsonSchema = { name: string; schema: Record<string, unknown>; strict?: boolean };
export type OutputSchema = JsonSchema;
export type ResponseFormat =
  | { type: "text" }
  | { type: "json_object" }
  | { type: "json_schema"; json_schema: JsonSchema };

export type ToolCall = {
  id: string;
  type: "function";
  function: { name: string; arguments: string };
};

export type InvokeParams = {
  messages: Message[];
  tools?: Tool[];
  toolChoice?: ToolChoice;
  tool_choice?: ToolChoice;
  maxTokens?: number;
  max_tokens?: number;
  outputSchema?: OutputSchema;
  output_schema?: OutputSchema;
  responseFormat?: ResponseFormat;
  response_format?: ResponseFormat;
};

export type InvokeResult = {
  id: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: { role: Role; content: string; tool_calls?: ToolCall[] };
    finish_reason: string | null;
  }>;
  usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
};

function extractText(content: MessageContent | MessageContent[]): string {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content.map((p) => (typeof p === "string" ? p : p.type === "text" ? p.text : "")).join("\n");
  }
  if (content.type === "text") return content.text;
  return "";
}

function normalizeMessage(msg: Message): { role: string; content: string } {
  return {
    role: msg.role === "function" ? "tool" : msg.role,
    content: extractText(msg.content),
  };
}

function needsJson(params: InvokeParams): boolean {
  const fmt = params.responseFormat ?? params.response_format;
  if (fmt && (fmt.type === "json_object" || fmt.type === "json_schema")) return true;
  if (params.outputSchema ?? params.output_schema) return true;
  return false;
}

export async function invokeLLM(params: InvokeParams): Promise<InvokeResult> {
  // DeepSeek is OpenAI-compatible — use it as primary LLM
  const apiKey = ENV.deepseekApiKey || ENV.anthropicApiKey;
  if (!apiKey) throw new Error("No LLM API key configured (DEEPSEEK_API_KEY or ANTHROPIC_API_KEY)");

  const useDeepSeek = Boolean(ENV.deepseekApiKey);
  const apiUrl = useDeepSeek
    ? `${ENV.deepseekBaseUrl.replace(/\/$/, "")}/v1/chat/completions`
    : "https://api.anthropic.com/v1/messages";

  if (useDeepSeek) {
    return invokeOpenAICompat(params, apiUrl, ENV.deepseekApiKey, ENV.deepseekModel);
  } else {
    return invokeAnthropicRest(params, ENV.anthropicApiKey);
  }
}

async function invokeOpenAICompat(
  params: InvokeParams,
  apiUrl: string,
  apiKey: string,
  model: string,
  timeoutMs = 60_000,
): Promise<InvokeResult> {
  const messages = params.messages.map(normalizeMessage);

  if (needsJson(params)) {
    const sys = messages.find((m) => m.role === "system");
    if (sys) {
      sys.content += "\n\nResponda SEMPRE com JSON válido puro, sem markdown.";
    } else {
      messages.unshift({ role: "system", content: "Responda SEMPRE com JSON válido puro, sem markdown." });
    }
  }

  const payload: Record<string, unknown> = {
    model,
    messages,
    max_tokens: Math.min(params.maxTokens ?? params.max_tokens ?? 8192, 8192),
  };

  if (needsJson(params)) {
    payload.response_format = { type: "json_object" };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    if (!response.ok) {
      const err = await response.text().catch(() => "");
      throw new Error(`LLM request failed (${response.status}): ${err.slice(0, 300)}`);
    }

    return response.json() as Promise<InvokeResult>;
  } catch (err: unknown) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error(`LLM demorou mais de ${timeoutMs / 1000}s. Tente novamente.`);
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

async function invokeAnthropicRest(params: InvokeParams, apiKey: string): Promise<InvokeResult> {
  const systemMsgs = params.messages.filter((m) => m.role === "system");
  const convMsgs = params.messages.filter((m) => m.role !== "system");

  let systemPrompt = systemMsgs.map((m) => extractText(m.content)).join("\n\n");
  if (needsJson(params)) systemPrompt += "\n\nResponda SEMPRE com JSON válido puro, sem markdown.";

  const messages = convMsgs.map((m) => ({
    role: m.role === "assistant" ? "assistant" : "user",
    content: extractText(m.content),
  }));

  if (messages.length === 0 || messages[0].role !== "user") {
    messages.unshift({ role: "user", content: "Continue." });
  }

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: Math.min(params.maxTokens ?? params.max_tokens ?? 8192, 8192),
      ...(systemPrompt ? { system: systemPrompt } : {}),
      messages,
    }),
  });

  if (!response.ok) {
    const err = await response.text().catch(() => "");
    throw new Error(`Anthropic request failed (${response.status}): ${err}`);
  }

  const data = (await response.json()) as any;
  const text = (data.content as Array<{ type: string; text?: string }>)
    .filter((b) => b.type === "text")
    .map((b) => b.text ?? "")
    .join("\n");

  return {
    id: data.id,
    created: Math.floor(Date.now() / 1000),
    model: data.model,
    choices: [{ index: 0, message: { role: "assistant", content: text }, finish_reason: data.stop_reason ?? null }],
    usage: data.usage
      ? { prompt_tokens: data.usage.input_tokens, completion_tokens: data.usage.output_tokens, total_tokens: data.usage.input_tokens + data.usage.output_tokens }
      : undefined,
  };
}
