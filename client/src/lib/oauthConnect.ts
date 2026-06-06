const POPUP = "width=600,height=720,left=120,top=80,scrollbars=yes,resizable=yes";

export function openOAuthConnect(
  provider: "facebook" | "linkedin",
  accountId: number,
  onComplete?: () => void,
  options?: { forInstagram?: boolean }
): boolean {
  const origin = window.location.origin;
  const path = provider === "facebook" ? "/api/facebook/auth" : "/api/linkedin/auth";
  const extra = options?.forInstagram ? "&forInstagram=1" : "";
  const url = `${path}?origin=${encodeURIComponent(origin)}&accountId=${accountId}&popup=1${extra}`;

  const popup = window.open(url, `tsm_oauth_${provider}_${accountId}`, POPUP);
  if (!popup) return false;

  let done = false;
  const finish = () => {
    if (done) return;
    done = true;
    window.removeEventListener("message", onMessage);
    clearInterval(poll);
    onComplete?.();
  };

  const onMessage = (event: MessageEvent) => {
    if (event.origin !== window.location.origin) return;
    if (event.data?.type !== "oauth_complete") return;
    finish();
  };

  window.addEventListener("message", onMessage);

  const poll = window.setInterval(() => {
    if (popup.closed) finish();
  }, 400);

  return true;
}
