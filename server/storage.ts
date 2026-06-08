import { ENV } from "./_core/env";
import { fetchWithRetry } from "./httpFetch";

const STORAGE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET ?? "triarc-social";

let bucketEnsured = false;

function appendHashSuffix(relKey: string): string {
  const hash = crypto.randomUUID().replace(/-/g, "").slice(0, 8);
  const lastDot = relKey.lastIndexOf(".");
  if (lastDot === -1) return `${relKey}_${hash}`;
  return `${relKey.slice(0, lastDot)}_${hash}${relKey.slice(lastDot)}`;
}

function normalizeKey(relKey: string): string {
  return relKey.replace(/^\/+/, "").replace(/^(storage|manus-storage)\//, "");
}

function supabaseHeaders(contentType?: string) {
  return {
    Authorization: `Bearer ${ENV.supabaseServiceRoleKey}`,
    apikey: ENV.supabaseServiceRoleKey,
    ...(contentType ? { "content-type": contentType } : {}),
  };
}

/** URL pública via proxy do app (funciona mesmo se bucket Supabase for privado). */
export function publicStorageUrl(key: string): string {
  const base = (ENV.appUrl || "https://tsm.triarcsolutions.com.br").replace(/\/$/, "");
  return `${base}/storage/${key}`;
}

/** URL direta Supabase (Meta/Instagram exige HTTPS sem redirect do app). */
export function supabasePublicObjectUrl(key: string): string {
  if (!ENV.supabaseUrl) {
    return publicStorageUrl(key);
  }
  const normalized = normalizeKey(key);
  return `${ENV.supabaseUrl.replace(/\/$/, "")}/storage/v1/object/public/${STORAGE_BUCKET}/${normalized}`;
}

export function extractStorageKey(mediaUrl: string): string | null {
  const fromProxy = mediaUrl.match(/\/(?:storage|manus-storage)\/([^?#]+)/);
  if (fromProxy) return decodeURIComponent(fromProxy[1]);

  const fromSupabase = mediaUrl.match(
    /\/storage\/v1\/object\/(?:public|sign)\/[^/]+\/([^?#]+)/
  );
  if (fromSupabase) return decodeURIComponent(fromSupabase[1]);

  return null;
}

export async function ensureStorageBucket(): Promise<void> {
  if (bucketEnsured) return;
  if (!ENV.supabaseUrl || !ENV.supabaseServiceRoleKey) {
    throw new Error("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY não configurados");
  }

  const listRes = await fetchWithRetry(
    `${ENV.supabaseUrl}/storage/v1/bucket`,
    { headers: supabaseHeaders(), timeoutMs: 15_000 },
    "Supabase list buckets"
  );

  if (listRes.ok) {
    const buckets = (await listRes.json()) as Array<{ id: string; name: string }>;
    if (buckets.some((b) => b.id === STORAGE_BUCKET || b.name === STORAGE_BUCKET)) {
      bucketEnsured = true;
      return;
    }
  }

  const createRes = await fetchWithRetry(
    `${ENV.supabaseUrl}/storage/v1/bucket`,
    {
      method: "POST",
      headers: { ...supabaseHeaders("application/json"), "content-type": "application/json" },
      body: JSON.stringify({
        id: STORAGE_BUCKET,
        name: STORAGE_BUCKET,
        public: true,
        file_size_limit: 10485760,
      }),
      timeoutMs: 15_000,
    },
    "Supabase create bucket"
  );

  if (createRes.ok || createRes.status === 409) {
    bucketEnsured = true;
    console.log(`[Storage] Bucket "${STORAGE_BUCKET}" pronto`);
    return;
  }

  const err = await createRes.text().catch(() => "");
  console.warn(`[Storage] Bucket create ${createRes.status}: ${err.slice(0, 150)}`);
  bucketEnsured = true;
}

async function uploadBytes(key: string, raw: Buffer, contentType: string): Promise<void> {
  const uploadUrl = `${ENV.supabaseUrl}/storage/v1/object/${STORAGE_BUCKET}/${key}`;
  const headers = {
    ...supabaseHeaders(contentType),
    "x-upsert": "true",
    "cache-control": "3600",
  };

  let res = await fetchWithRetry(uploadUrl, { method: "POST", headers, body: raw as unknown as BodyInit, timeoutMs: 120_000 }, "upload Supabase");
  if (!res.ok && (res.status === 400 || res.status === 405)) {
    res = await fetchWithRetry(uploadUrl, { method: "PUT", headers, body: raw as unknown as BodyInit, timeoutMs: 120_000 }, "upload Supabase (PUT)");
  }

  if (!res.ok) {
    const err = await res.text().catch(() => "");
    throw new Error(`Supabase upload (${res.status}): ${err.slice(0, 250)}`);
  }
}

export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream"
): Promise<{ key: string; url: string }> {
  if (!ENV.supabaseUrl || !ENV.supabaseServiceRoleKey) {
    throw new Error("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY não configurados");
  }

  const key = appendHashSuffix(normalizeKey(relKey));
  const raw = typeof data === "string" ? Buffer.from(data) : Buffer.from(data);

  // Bucket já criado no cold start — upload direto evita timeout no list buckets
  await uploadBytes(key, raw, contentType);

  return { key, url: supabasePublicObjectUrl(key) };
}

export function parseDataUrlBuffer(dataUrl: string): { buffer: Buffer; mimeType: string } {
  const match = /^data:([^;]+);base64,([\/+A-Za-z0-9=\s\S]+)$/.exec(dataUrl);
  if (!match) throw new Error("data URL inválida");
  const mimeType = match[1];
  const buffer = Buffer.from(match[2], "base64");
  if (buffer.length > 8 * 1024 * 1024) {
    throw new Error("Imagem muito grande (>8MB). Gere a imagem de novo com Gerar Imagem.");
  }
  return { buffer, mimeType };
}

export async function uploadDataUrlToStorage(
  dataUrl: string,
  relKeyPrefix = "generated"
): Promise<{ signedUrl: string; displayUrl: string }> {
  const { buffer, mimeType } = parseDataUrlBuffer(dataUrl);
  const ext = mimeType.split("/")[1]?.replace("jpeg", "jpg") ?? "png";
  const { key } = await storagePut(`${relKeyPrefix}/${Date.now()}.${ext}`, buffer, mimeType);
  const signedUrl = await storageGetSignedUrl(key);
  return { signedUrl, displayUrl: publicStorageUrl(key) };
}

export async function storageGet(relKey: string): Promise<{ key: string; url: string }> {
  const key = normalizeKey(relKey);
  return { key, url: publicStorageUrl(key) };
}

export async function storageGetSignedUrl(relKey: string, expiresIn = 86400): Promise<string> {
  if (!ENV.supabaseUrl || !ENV.supabaseServiceRoleKey) {
    return publicStorageUrl(normalizeKey(relKey));
  }

  const key = normalizeKey(relKey);
  const signUrl = `${ENV.supabaseUrl}/storage/v1/object/sign/${STORAGE_BUCKET}/${key}`;

  const res = await fetchWithRetry(
    signUrl,
    {
      method: "POST",
      headers: { ...supabaseHeaders("application/json"), "content-type": "application/json" },
      body: JSON.stringify({ expiresIn }),
      timeoutMs: 30_000,
    },
    "Supabase signed URL"
  );

  if (!res.ok) {
    return supabasePublicObjectUrl(key);
  }

  const { signedURL } = (await res.json()) as { signedURL: string };
  return `${ENV.supabaseUrl.replace(/\/$/, "")}${signedURL}`;
}

/** URL HTTPS que a Meta consegue baixar (signed > public > proxy app). */
export async function getInstagramAccessibleUrl(mediaUrl: string): Promise<string> {
  const key = extractStorageKey(mediaUrl);
  if (key) {
    return storageGetSignedUrl(key);
  }
  if (mediaUrl.startsWith("/storage/") || mediaUrl.startsWith("/manus-storage/")) {
    const k = mediaUrl.replace(/^\/(?:storage|manus-storage)\//, "");
    return storageGetSignedUrl(k);
  }
  if (mediaUrl.startsWith("http://") || mediaUrl.startsWith("https://")) {
    return mediaUrl;
  }
  throw new Error(`URL de imagem inválida: ${mediaUrl.slice(0, 80)}`);
}
