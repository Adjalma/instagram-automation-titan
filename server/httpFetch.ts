const DEFAULT_TIMEOUT_MS = 60_000;
const DEFAULT_RETRIES = 3;

export function formatFetchError(err: unknown, step: string): string {
  const cause = (err as { cause?: { message?: string; code?: string } })?.cause;
  const parts = [
    step,
    err instanceof Error ? err.message : String(err),
    cause?.code,
    cause?.message,
  ].filter(Boolean);
  const joined = parts.join(" — ");
  if (/fetch failed/i.test(joined)) {
    return `${step}: falha de rede (timeout ou conexão). Verifique SUPABASE_URL e token Meta.`;
  }
  return joined;
}

export async function fetchWithRetry(
  url: string,
  init: RequestInit & { timeoutMs?: number } = {},
  label = "fetch"
): Promise<Response> {
  const timeoutMs = init.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  let lastErr: unknown;

  for (let attempt = 1; attempt <= DEFAULT_RETRIES; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, { ...init, signal: controller.signal });
      clearTimeout(timer);
      return res;
    } catch (err) {
      clearTimeout(timer);
      lastErr = err;
      if (attempt < DEFAULT_RETRIES) {
        await new Promise((r) => setTimeout(r, attempt * 1500));
        continue;
      }
    }
  }

  throw new Error(formatFetchError(lastErr, label));
}
