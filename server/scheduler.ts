/**
 * Scheduler — agendador periódico de publicações do Triarc Social Manager.
 *
 * Executa processScheduledPosts() a cada INTERVAL_MS milissegundos para
 * publicar automaticamente posts cujo horário agendado já passou.
 *
 * O intervalo padrão é 5 minutos (300.000 ms). Em ambiente de desenvolvimento
 * pode ser sobrescrito via variável de ambiente SCHEDULER_INTERVAL_MS.
 */

import { processScheduledPosts } from "./instagram";

const INTERVAL_MS = parseInt(process.env.SCHEDULER_INTERVAL_MS || "300000", 10);

let schedulerHandle: ReturnType<typeof setInterval> | null = null;

async function runScheduledPublishing() {
  try {
    const result = await processScheduledPosts();
    if (result.processed > 0) {
      console.log(
        `[Scheduler] Processados ${result.processed} posts agendados — ${result.published} publicados.`
      );
      if (result.errors.length > 0) {
        console.warn(`[Scheduler] Erros:`, result.errors);
      }
    }
  } catch (err: any) {
    console.error("[Scheduler] Erro ao processar posts agendados:", err?.message || err);
  }
}

export function startScheduler() {
  if (schedulerHandle) {
    console.warn("[Scheduler] Já está em execução. Ignorando nova inicialização.");
    return;
  }

  console.log(
    `[Scheduler] Iniciado — verificando posts agendados a cada ${INTERVAL_MS / 1000}s.`
  );

  // Executa imediatamente na inicialização e depois a cada intervalo
  runScheduledPublishing();
  schedulerHandle = setInterval(runScheduledPublishing, INTERVAL_MS);
}

export function stopScheduler() {
  if (schedulerHandle) {
    clearInterval(schedulerHandle);
    schedulerHandle = null;
    console.log("[Scheduler] Parado.");
  }
}
