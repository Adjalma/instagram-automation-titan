// Data API removido (era Manus-specific). Funcionalidade substituída por integrações diretas.
export async function callDataApi(_apiId: string, _options?: unknown): Promise<unknown> {
  throw new Error("callDataApi não disponível — use integrações diretas (Instagram/LinkedIn/Facebook Graph API)");
}
