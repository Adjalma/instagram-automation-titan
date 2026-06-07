import { ENV } from "./_core/env";

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

export async function ensureStorageBucket(): Promise<void> {
  if (bucketEnsured) return;
  if (!ENV.supabaseUrl || !ENV.supabaseServiceRoleKey) {
    throw new Error("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY não configurados");
  }

  const listRes = await fetch(`${ENV.supabaseUrl}/storage/v1/bucket`, {
    headers: supabaseHeaders(),
  });

  if (listRes.ok) {
    const buckets = (await listRes.json()) as Array<{ id: string; name: string }>;
    if (buckets.some((b) => b.id === STORAGE_BUCKET || b.name === STORAGE_BUCKET)) {
      bucketEnsured = true;
      return;
    }
  }

  const createRes = await fetch(`${ENV.supabaseUrl}/storage/v1/bucket`, {
    method: "POST",
    headers: { ...supabaseHeaders("application/json"), "content-type": "application/json" },
    body: JSON.stringify({
      id: STORAGE_BUCKET,
      name: STORAGE_BUCKET,
      public: true,
      file_size_limit: 10485760,
    }),
  });

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

  let res = await fetch(uploadUrl, { method: "POST", headers, body: raw as unknown as BodyInit });
  if (!res.ok && (res.status === 400 || res.status === 405)) {
    res = await fetch(uploadUrl, { method: "PUT", headers, body: raw as unknown as BodyInit });
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

  await ensureStorageBucket();

  const key = appendHashSuffix(normalizeKey(relKey));
  const raw = typeof data === "string" ? Buffer.from(data) : Buffer.from(data);

  await uploadBytes(key, raw, contentType);

  return { key, url: publicStorageUrl(key) };
}

export async function uploadDataUrlToStorage(
  dataUrl: string,
  relKeyPrefix = "generated"
): Promise<string> {
  const match = /^data:([^;]+);base64,(.+)$/s.exec(dataUrl);
  if (!match) throw new Error("data URL inválida");
  const mimeType = match[1];
  const buffer = Buffer.from(match[2], "base64");
  const ext = mimeType.split("/")[1]?.replace("jpeg", "jpg") ?? "png";
  const { url } = await storagePut(`${relKeyPrefix}/${Date.now()}.${ext}`, buffer, mimeType);
  return url;
}

export async function storageGet(relKey: string): Promise<{ key: string; url: string }> {
  const key = normalizeKey(relKey);
  return { key, url: publicStorageUrl(key) };
}

export async function storageGetSignedUrl(relKey: string): Promise<string> {
  if (!ENV.supabaseUrl || !ENV.supabaseServiceRoleKey) {
    return publicStorageUrl(normalizeKey(relKey));
  }

  const key = normalizeKey(relKey);
  const signUrl = `${ENV.supabaseUrl}/storage/v1/object/sign/${STORAGE_BUCKET}/${key}`;

  const res = await fetch(signUrl, {
    method: "POST",
    headers: { ...supabaseHeaders("application/json"), "content-type": "application/json" },
    body: JSON.stringify({ expiresIn: 3600 }),
  });

  if (!res.ok) {
    return `${ENV.supabaseUrl}/storage/v1/object/public/${STORAGE_BUCKET}/${key}`;
  }

  const { signedURL } = (await res.json()) as { signedURL: string };
  return `${ENV.supabaseUrl}${signedURL}`;
}
