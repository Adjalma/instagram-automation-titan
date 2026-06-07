import { trpc } from "@/lib/trpc";
import { UNAUTHED_ERR_MSG } from '@shared/const';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpLink, TRPCClientError } from "@trpc/client";
import { createRoot } from "react-dom/client";
import superjson from "superjson";
import App from "./App";
import { getLoginUrl } from "./const";
import "./index.css";

// Override browser tab title
document.title = "Triarc Social Manager";

// Remove service workers legados imediatamente (não esperar load).
if ("serviceWorker" in navigator) {
  void navigator.serviceWorker.getRegistrations().then((regs) =>
    Promise.all(regs.map((r) => r.unregister()))
  );
  if ("caches" in window) {
    void caches.keys().then((keys) =>
      Promise.all(keys.map((key) => caches.delete(key)))
    );
  }
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
});

const redirectToLoginIfUnauthorized = (error: unknown) => {
  if (!(error instanceof TRPCClientError)) return;
  if (typeof window === "undefined") return;
  if (window.location.pathname === "/login") return;

  const isUnauthorized = error.message === UNAUTHED_ERR_MSG;
  if (!isUnauthorized) return;

  window.location.href = getLoginUrl();
};

queryClient.getQueryCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.query.state.error;
    redirectToLoginIfUnauthorized(error);
    console.error("[API Query Error]", error);
  }
});

queryClient.getMutationCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.mutation.state.error;
    redirectToLoginIfUnauthorized(error);
    console.error("[API Mutation Error]", error);
  }
});

const trpcClient = trpc.createClient({
  links: [
    httpLink({
      url: "/api/trpc",
      transformer: superjson,
      fetch(input, init) {
        const url = typeof input === "string" ? input : input.url;
        const isLongOp = /publishNow|generateArt|generateCaption|generate-image/i.test(url);
        const controller = new AbortController();
        const isAuthMe = /auth\.me/i.test(url);
        const timeoutMs = isLongOp ? 300_000 : isAuthMe ? 15_000 : 45_000;
        const timer = setTimeout(() => controller.abort(), timeoutMs);
        return globalThis
          .fetch(input, {
            ...(init ?? {}),
            credentials: "include",
            signal: controller.signal,
          })
          .catch((err) => {
            if (err?.name === "AbortError") {
              throw new Error(
                isLongOp
                  ? "Tempo esgotado (5 min). Verifique Logs de publicação ou tente de novo."
                  : isAuthMe
                  ? "Autenticação demorou (15s). Tente /login ou atualize a página."
                  : "Servidor demorou para responder (45s). Tente atualizar a página."
              );
            }
            throw err;
          })
          .finally(() => clearTimeout(timer));
      },
    }),
  ],
});

createRoot(document.getElementById("root")!).render(
  <trpc.Provider client={trpcClient} queryClient={queryClient}>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </trpc.Provider>
);
