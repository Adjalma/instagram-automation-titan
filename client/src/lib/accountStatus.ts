/** Indica se a conta tem token OAuth salvo e está pronta para publicar. */
export function getAccountConnectionStatus(account: {
  platform?: string | null;
  accessToken?: string | null;
  linkedinUrn?: string | null;
}) {
  const platform = account.platform ?? "instagram";

  if (platform === "instagram") {
    if (!account.accessToken) return { connected: false, label: "Não conectado", level: "none" as const };
    if (account.linkedinUrn?.startsWith("ig:")) {
      return { connected: true, label: "Instagram OK", level: "full" as const };
    }
    return { connected: true, label: "Token OK (IG parcial)", level: "partial" as const };
  }

  if (platform === "facebook") {
    if (account.accessToken && account.linkedinUrn?.startsWith("fb:page:")) {
      return { connected: true, label: "Página OK", level: "full" as const };
    }
    if (account.accessToken) return { connected: true, label: "Token OK", level: "partial" as const };
    return { connected: false, label: "Não conectado", level: "none" as const };
  }

  if (platform === "linkedin") {
    if (account.accessToken && account.linkedinUrn) {
      return { connected: true, label: "LinkedIn OK", level: "full" as const };
    }
    if (account.accessToken) return { connected: true, label: "Token OK", level: "partial" as const };
    return { connected: false, label: "Não conectado", level: "none" as const };
  }

  return { connected: false, label: "N/A", level: "none" as const };
}
