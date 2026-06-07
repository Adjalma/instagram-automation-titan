import { sql } from "drizzle-orm";
import { waitUntil } from "@vercel/functions";
import { getDb } from "./db";
import { generateImage } from "./_core/imageGeneration";

export type ImageJobStatus = "pending" | "processing" | "done" | "failed";

export type ImageJobRow = {
  id: number;
  userId: number;
  prompt: string;
  status: ImageJobStatus;
  url: string | null;
  error: string | null;
};

let tableReady = false;

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

export async function getImageJob(jobId: number, userId: number): Promise<ImageJobRow | null> {
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
  }>(sql`
    SELECT id, user_id, prompt, status, url, error
    FROM image_generation_jobs
    WHERE id = ${jobId} AND user_id = ${userId}
    LIMIT 1
  `);

  const row = rows[0];
  if (!row) return null;

  return {
    id: row.id,
    userId: row.user_id,
    prompt: row.prompt,
    status: row.status as ImageJobStatus,
    url: row.url,
    error: row.error,
  };
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

/** Agenda processamento em background (Vercel waitUntil) sem bloquear a resposta HTTP. */
export function scheduleImageJob(jobId: number): void {
  const task = processImageJob(jobId);

  try {
    waitUntil(task);
  } catch {
    void task;
  }
}
