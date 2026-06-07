import { sql } from "drizzle-orm";
import { waitUntil } from "@vercel/functions";
import { getDb } from "./db";
import { generateImage } from "./_core/imageGeneration";
import { ENV } from "./_core/env";

export type ImageJobStatus = "pending" | "processing" | "done" | "failed";

export type ImageJobRow = {
  id: number;
  userId: number;
  prompt: string;
  status: ImageJobStatus;
  url: string | null;
  error: string | null;
  createdAt: Date;
  updatedAt: Date;
};

const STALE_PROCESSING_MS = 4 * 60 * 1000;

let tableReady = false;

function internalAuthSecret(): string {
  return ENV.cronSecret || ENV.cookieSecret;
}

function appBaseUrl(): string {
  if (ENV.appUrl) return ENV.appUrl.replace(/\/$/, "");
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "";
}

export async function ensureImageJobsTable(): Promise<void> {
  if (tableReady) return;
  const db = await getDb();
  if (!db) return;

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS image_generation_jobs (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL,
      prompt TEXT NOT NULL,
      status VARCHAR(20) NOT NULL DEFAULT 'pending',
      url TEXT,
      error TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  tableReady = true;
}

function mapJobRow(row: {
  id: number;
  user_id: number;
  prompt: string;
  status: string;
  url: string | null;
  error: string | null;
  created_at: Date | string;
  updated_at: Date | string;
}): ImageJobRow {
  return {
    id: row.id,
    userId: row.user_id,
    prompt: row.prompt,
    status: row.status as ImageJobStatus,
    url: row.url,
    error: row.error,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export async function createImageJob(userId: number, prompt: string): Promise<number> {
  await ensureImageJobsTable();
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível");

  const rows = await db.execute<{ id: number }>(sql`
    INSERT INTO image_generation_jobs (user_id, prompt, status)
    VALUES (${userId}, ${prompt}, 'pending')
    RETURNING id
  `);
  const id = rows[0]?.id;
  if (!id) throw new Error("Falha ao criar job de imagem");
  return id;
}

export async function getImageJobById(jobId: number): Promise<ImageJobRow | null> {
  await ensureImageJobsTable();
  const db = await getDb();
  if (!db) return null;

  const rows = await db.execute<{
    id: number;
    user_id: number;
    prompt: string;
    status: string;
    url: string | null;
    error: string | null;
    created_at: Date | string;
    updated_at: Date | string;
  }>(sql`
    SELECT id, user_id, prompt, status, url, error, created_at, updated_at
    FROM image_generation_jobs
    WHERE id = ${jobId}
    LIMIT 1
  `);

  const row = rows[0];
  return row ? mapJobRow(row) : null;
}

export async function getImageJob(jobId: number, userId: number): Promise<ImageJobRow | null> {
  const job = await getImageJobById(jobId);
  if (!job || job.userId !== userId) return null;
  return job;
}

async function markJobFailed(jobId: number, message: string): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.execute(sql`
    UPDATE image_generation_jobs
    SET status = 'failed', error = ${message.slice(0, 500)}, updated_at = NOW()
    WHERE id = ${jobId}
  `);
}

async function resetJobToPending(jobId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.execute(sql`
    UPDATE image_generation_jobs
    SET status = 'pending', error = NULL, updated_at = NOW()
    WHERE id = ${jobId} AND status = 'processing'
  `);
  console.warn(`[ImageJob] ${jobId} resetado de processing → pending (stale)`);
}

export async function processImageJob(jobId: number): Promise<void> {
  await ensureImageJobsTable();
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível");

  const claimed = await db.execute<{ id: number; prompt: string }>(sql`
    UPDATE image_generation_jobs
    SET status = 'processing', updated_at = NOW()
    WHERE id = ${jobId} AND status = 'pending'
    RETURNING id, prompt
  `);

  const job = claimed[0];
  if (!job) {
    console.log(`[ImageJob] ${jobId} já em processamento ou concluído`);
    return;
  }

  console.log(`[ImageJob] Processando ${jobId}...`);
  try {
    const { url } = await generateImage({ prompt: job.prompt });
    if (!url) throw new Error("Gemini não retornou URL");

    await db.execute(sql`
      UPDATE image_generation_jobs
      SET status = 'done', url = ${url}, error = NULL, updated_at = NOW()
      WHERE id = ${jobId}
    `);
    console.log(`[ImageJob] ${jobId} concluído`);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[ImageJob] ${jobId} falhou:`, msg);
    await markJobFailed(jobId, msg);
  }
}

/** Nova invocação serverless dedicada (mais confiável que waitUntil no Express). */
function triggerRemoteProcessing(jobId: number): void {
  const secret = internalAuthSecret();
  const base = appBaseUrl();
  if (!secret || !base) {
    console.warn("[ImageJob] Sem APP_URL ou secret — remote dispatch ignorado");
    return;
  }

  const url = `${base}/api/internal/process-image-job/${jobId}`;
  void fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${secret}` },
  }).catch((err) => console.warn(`[ImageJob] Remote dispatch ${jobId} falhou:`, err));
}

/** Dispara processamento local (waitUntil) + invocação remota separada. */
export function dispatchImageJobProcessing(jobId: number): void {
  const task = processImageJob(jobId);
  try {
    waitUntil(task);
  } catch {
    void task;
  }
  triggerRemoteProcessing(jobId);
}

/** Re-dispara jobs presos; chamado no polling de status. */
export async function kickImageJob(jobId: number): Promise<void> {
  const job = await getImageJobById(jobId);
  if (!job || job.status === "done" || job.status === "failed") return;

  if (job.status === "processing") {
    if (Date.now() - job.updatedAt.getTime() > STALE_PROCESSING_MS) {
      await resetJobToPending(jobId);
      dispatchImageJobProcessing(jobId);
    }
    return;
  }

  const ageMs = Date.now() - job.createdAt.getTime();
  if (ageMs > 3000) {
    dispatchImageJobProcessing(jobId);
  }
}

/** @deprecated use dispatchImageJobProcessing */
export function scheduleImageJob(jobId: number): void {
  dispatchImageJobProcessing(jobId);
}

export function verifyInternalAuth(authHeader: string | undefined): boolean {
  const secret = internalAuthSecret();
  if (!secret || !authHeader) return false;
  return authHeader === `Bearer ${secret}`;
}
