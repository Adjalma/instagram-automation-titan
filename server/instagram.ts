/**
 * instagram.ts — Helpers de integração com Instagram.
 *
 * ARQUITETURA DE PUBLICAÇÃO:
 * - O servidor NÃO publica diretamente no Instagram.
 * - manus-mcp-cli só funciona no contexto do agente Manus (shell tool call).
 * - O fluxo correto é:
 *   1. Usuário aprova post → status = "approved"
 *   2. Agente Manus agendado (a cada 10min) chama GET /api/scheduled/pending-posts
 *   3. Agente publica via MCP instagram create_instagram
 *   4. Agente reporta resultado via POST /api/scheduled/publish-result
 *   5. Servidor atualiza status para "published"
 */

import { getPostsByStatus, updatePost } from "./db";

/**
 * Verifica posts agendados vencidos e os move para "approved"
 * para que o agente Manus os publique na próxima execução.
 * Chamado pelo scheduler interno do servidor.
 */
export async function processScheduledPosts(): Promise<{
  processed: number;
  promoted: number;
  errors: string[];
}> {
  const scheduledPosts = await getPostsByStatus("scheduled");
  const now = new Date();
  let processed = 0;
  let promoted = 0;
  const errors: string[] = [];

  for (const post of scheduledPosts as any[]) {
    if (post.scheduledAt && new Date(post.scheduledAt) <= now) {
      processed++;
      try {
        await updatePost(post.id, { status: "approved", mcpPending: 0 });
        promoted++;
        console.log(`[Instagram] Post ${post.id} movido para fila de publicação.`);
      } catch (err: any) {
        errors.push(`Post ${post.id}: ${err.message}`);
      }
    }
  }

  return { processed, promoted, errors };
}

/**
 * Busca insights de um post publicado no Instagram.
 * Nota: esta função só pode ser chamada pelo agente Manus via shell,
 * não pelo servidor web diretamente.
 */
export async function fetchPostInsights(_instagramPostId: string): Promise<{
  likes?: number;
  comments?: number;
  reach?: number;
  impressions?: number;
}> {
  // Insights são buscados pelo agente Manus via MCP get_post_insights
  // O servidor não pode chamar manus-mcp-cli diretamente
  console.warn("[Instagram] fetchPostInsights deve ser chamado pelo agente Manus, não pelo servidor.");
  return {};
}
