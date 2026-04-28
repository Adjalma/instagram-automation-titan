/**
 * Scheduler — agendador periódico do Triarc Social Manager.
 *
 * RESPONSABILIDADE: mover posts agendados vencidos para status "approved",
 * colocando-os na fila de publicação do agente Manus.
 *
 * A publicação real no Instagram é feita pelo agente Manus agendado
 * (tarefa externa) que chama GET /api/scheduled/pending-posts e
 * POST /api/scheduled/publish-result via HTTP.
 *
 * NÃO tenta chamar manus-mcp-cli diretamente — isso só funciona
 * no contexto do agente Manus, não no servidor web.
 */

import { getPostsByStatus, updatePost } from "./db";

const INTERVAL_MS = parseInt(process.env.SCHEDULER_INTERVAL_MS || "300000", 10);

let schedulerHandle: ReturnType<typeof setInterval> | null = null;

async function promoteScheduledPosts() {
  try {
    const scheduledPosts = await getPostsByStatus("scheduled");
    const now = new Date();
    let promoted = 0;

    for (const post of scheduledPosts as any[]) {
      if (post.scheduledAt && new Date(post.scheduledAt) <= now) {
        // Mover para "approved" para que o agente Manus publique
        await updatePost(post.id, { status: "approved", mcpPending: 0 });
        promoted++;
        console.log(`[Scheduler] Post ${post.id} movido para fila de publicação (agendado para ${post.scheduledAt}).`);
      }
    }

    if (promoted > 0) {
      console.log(`[Scheduler] ${promoted} post(s) movidos para fila de publicação.`);
    }
  } catch (err: any) {
    console.error("[Scheduler] Erro ao verificar posts agendados:", err?.message || err);
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

  // Executa imediatamente e depois a cada intervalo
  promoteScheduledPosts();
  schedulerHandle = setInterval(promoteScheduledPosts, INTERVAL_MS);
}

export function stopScheduler() {
  if (schedulerHandle) {
    clearInterval(schedulerHandle);
    schedulerHandle = null;
    console.log("[Scheduler] Parado.");
  }
}
