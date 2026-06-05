import type { Response } from "express";

export type OAuthState = {
  origin: string;
  accountId?: string;
  popup: boolean;
};

export function parseOAuthState(state: string | undefined, fallbackOrigin: string): OAuthState {
  try {
    const decoded = JSON.parse(Buffer.from(state!, "base64url").toString());
    return {
      origin: decoded.origin || fallbackOrigin,
      accountId: decoded.accountId,
      popup: decoded.popup === true || decoded.popup === "1",
    };
  } catch {
    return { origin: fallbackOrigin, popup: false };
  }
}

export function buildOAuthState(origin: string, accountId: string | undefined, popup: boolean): string {
  return Buffer.from(JSON.stringify({ origin, accountId, popup: popup ? true : undefined })).toString("base64url");
}

export function finishOAuth(
  res: Response,
  opts: {
    origin: string;
    popup: boolean;
    provider: "facebook" | "linkedin";
    success: boolean;
    error?: string;
  }
) {
  const { origin, popup, provider, success, error } = opts;
  const param = success
    ? `${provider}_connected=1`
    : `${provider}_error=${encodeURIComponent(error ?? "unknown")}`;
  const redirectUrl = `${origin}/accounts?${param}`;

  if (popup) {
    const message = success
      ? "Conta conectada com sucesso!"
      : `Erro ao conectar: ${error ?? "desconhecido"}`;
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(`<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="UTF-8"><title>OAuth</title></head>
<body style="font-family:system-ui,sans-serif;text-align:center;padding:48px 24px">
<p>${message}</p>
<p style="color:#666;font-size:14px">Fechando esta janela...</p>
<script>
(function(){
  var payload = { type: "oauth_complete", provider: ${JSON.stringify(provider)}, success: ${success ? "true" : "false"} };
  try {
    if (window.opener && !window.opener.closed) {
      window.opener.postMessage(payload, ${JSON.stringify(origin)});
      window.close();
      setTimeout(function(){ window.close(); }, 300);
      return;
    }
  } catch (e) {}
  window.location.replace(${JSON.stringify(redirectUrl)});
})();
</script>
</body></html>`);
    return;
  }

  res.redirect(redirectUrl);
}
