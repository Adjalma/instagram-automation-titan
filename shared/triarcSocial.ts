/** Apps/projetos excluídos do Instagram corporativo Triarc (pessoais, religiosos, legado). */
export const SOCIAL_EXCLUDED_APPS = [
  "Legendários Macaé",
  "Plataforma de Eventos Legendários",
  "Sentinela",
  "Farol das Escrituras",
  "Mir Macaé",
  "Rede Sião",
  "Titan App",
] as const;

export type TriacCatalogItem = {
  name: string;
  status?: string | null;
  type?: string | null;
  category?: string | null;
  subtitle?: string | null;
};

export function parseSocialExcludeEnv(raw?: string): string[] {
  if (!raw?.trim()) return [];
  return raw.split(",").map((s) => s.trim()).filter(Boolean);
}

export function isAllowedForSocial(
  name: string,
  status?: string | null,
  extraExcluded: string[] = []
): boolean {
  if (status && status !== "ativo") return false;
  const blocked = [...SOCIAL_EXCLUDED_APPS, ...extraExcluded];
  const lower = name.toLowerCase();
  return !blocked.some(
    (ex) => lower.includes(ex.toLowerCase()) || ex.toLowerCase().includes(lower)
  );
}

export function filterTriacForSocial<T extends TriacCatalogItem>(
  items: T[],
  extraExcluded: string[] = []
): T[] {
  return items.filter((i) => isAllowedForSocial(i.name, i.status ?? "ativo", extraExcluded));
}

/** Contexto IA — só produtos/serviços corporativos (sem apps excluídos). */
export const TRIARC_SOCIAL_APP_CONTEXT =
  "A Triarc Solutions é uma empresa de tecnologia e inovação em Macaé/RJ (triarcsolutions.com.br). " +
  "Serviços: desenvolvimento de software sob encomenda, IA e automação, gestão empresarial, suporte TI, data science. " +
  "Projetos em destaque: TopFlow.ai, COPE, SS-Milhas, TransCarga, TRIARC CRM, Grupo Conecta, Axis, Logos, Sintaxe, CB Integrativa. " +
  "O Triarc Social Manager é a plataforma interna de automação de conteúdo para Instagram.";
