import { ENV } from "./_core/env";

const STORAGE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET ?? "triarc-social";

function appendHashSuffix(relKey: string): string {
  const hash = crypto.randomUUID().replace(/-/g, "").slice(0, 8);
  const lastDot = relKey.lastIndexOf(".");
  if (lastDot === -1) return `${relKey}_${hash}`;
  return `${relKey.slice(0, lastDot)}_${hash}${relKey.slice(lastDot)}`;
}

function normalizeKey(relKey: string): string {
  return relKey.replace(/^\/+/, "").replace(/^(storage|manus-storage)\//, "");
}

function supabaseHeaders() {
  return {
    Authorization: `Bearer ${ENV.supabaseServiceRoleKey}`,
    apikey: ENV.supabaseServiceRoleKey,
  };
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
  const uploadUrl = `${ENV.supabaseUrl}/storage/v1/object/${STORAGE_BUCKET}/${key}`;

  const raw = typeof data === "string" ? Buffer.from(data) : data;

  const res = await fetch(uploadUrl, {
    method: "POST",
    headers: { ...supabaseHeaders(), "content-type": contentType },
    body: raw as unknown as BodyInit,
  });

  if (!res.ok) {
    const err = await res.text().catch(() => "");
    throw new Error(`Supabase storage upload failed (${res.status}): ${err}`);
  }

  const publicUrl = `${ENV.supabaseUrl}/storage/v1/object/public/${STORAGE_BUCKET}/${key}`;
  return { key, url: publicUrl };
}

export async function storageGet(relKey: string): Promise<{ key: string; url: string }> {
  const key = normalizeKey(relKey);
  const publicUrl = `${ENV.supabaseUrl}/storage/v1/object/public/${STORAGE_BUCKET}/${key}`;
  return { key, url: publicUrl };
}

export async function storageGetSignedUrl(relKey: string): Promise<string> {
  if (!ENV.supabaseUrl || !ENV.supabaseServiceRoleKey) {
    throw new Error("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY não configurados");
  }

  const key = normalizeKey(relKey);
  const signUrl = `${ENV.supabaseUrl}/storage/v1/object/sign/${STORAGE_BUCKET}/${key}`;

  const res = await fetch(signUrl, {
    method: "POST",
    headers: { ...supabaseHeaders(), "content-type": "application/json" },
    body: JSON.stringify({ expiresIn: 3600 }),
  });

  if (!res.ok) {
    // fallback: public URL
    return `${ENV.supabaseUrl}/storage/v1/object/public/${STORAGE_BUCKET}/${key}`;
  }

  const { signedURL } = (await res.json()) as { signedURL: string };
  return `${ENV.supabaseUrl}${signedURL}`;
}
