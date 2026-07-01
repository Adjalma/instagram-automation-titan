import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Loader2, Instagram, FileText, Clock,
  CheckCircle, AlertCircle, Rocket, ArrowRight,
  Linkedin, Facebook, Youtube, Music, Globe,
  Activity, TrendingUp, Zap,
} from "lucide-react";
import { useLocation } from "wouter";
import { useEffect } from "react";
import React from "react";
import QueryError from "@/components/QueryError";

const PLATFORM_CONFIG: Record<string, { label: string; icon: React.ElementType; neon: string; bg: string }> = {
  instagram: { label: "Instagram", icon: Instagram, neon: "oklch(0.75 0.22 340)", bg: "oklch(0.75 0.22 340 / 10%)" },
  linkedin:  { label: "LinkedIn",  icon: Linkedin,  neon: "oklch(0.65 0.18 240)", bg: "oklch(0.65 0.18 240 / 10%)" },
  facebook:  { label: "Facebook",  icon: Facebook,  neon: "oklch(0.65 0.18 255)", bg: "oklch(0.65 0.18 255 / 10%)" },
  tiktok:    { label: "TikTok",    icon: Music,     neon: "oklch(0.82 0.18 195)", bg: "oklch(0.82 0.18 195 / 10%)" },
  youtube:   { label: "YouTube",   icon: Youtube,   neon: "oklch(0.65 0.25 25)",  bg: "oklch(0.65 0.25 25 / 10%)" },
};

const STAT_CARDS = [
  { key: "pending",   label: "Pendentes",  neon: "oklch(0.82 0.18 80)",  path: "/approval" },
  { key: "approved",  label: "Aprovados",  neon: "oklch(0.80 0.18 145)", path: "/approval" },
  { key: "scheduled", label: "Agendados",  neon: "oklch(0.82 0.18 195)", path: "/calendar" },
  { key: "published", label: "Publicados", neon: "oklch(0.72 0.22 290)", path: "/history" },
];

export default function Home() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    document.title = "Triarc Social Manager — Automação Instagram";
  }, []);

  const { data: accounts, isLoading: loadingAccounts, isError: accountsError, error: accountsErr, refetch: refetchAccounts } = trpc.accounts.list.useQuery();
  const triarc = accounts?.find((a: any) => a.platform === "instagram" || !a.platform) ?? accounts?.[0];
  const triacId = triarc?.id ?? 0;
  const { data: stats, isLoading: loadingStats, isError: statsError, error: statsErr, refetch: refetchStats } = trpc.accounts.stats.useQuery({ accountId: triacId }, { enabled: !!triacId });
  const { data: pendingPosts } = trpc.posts.list.useQuery({ status: "pending" });
  const { data: approvedPosts } = trpc.posts.list.useQuery({ status: "approved" });
  const { data: expiringTokens } = trpc.accounts.expiringTokens.useQuery();
  const isLoading = loadingAccounts || (!!triacId && loadingStats);

  if (accountsError) return <QueryError message={accountsErr?.message} onRetry={() => refetchAccounts()} />;
  if (statsError && triacId) return <QueryError message={statsErr?.message} onRetry={() => refetchStats()} />;

  const criticalTokens = expiringTokens?.filter((t: any) => t.daysLeft <= 3) ?? [];
  const warningTokens = expiringTokens?.filter((t: any) => t.daysLeft > 3 && t.daysLeft <= 14) ?? [];
  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="h-8 w-8 animate-spin" style={{ color: "oklch(0.82 0.18 195)" }} />
    </div>
  );

  const pendingCount = pendingPosts?.length ?? 0;
  const approvedCount = approvedPosts?.length ?? 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: "'Orbitron', sans-serif", background: "linear-gradient(135deg, oklch(0.92 0.01 220), oklch(0.82 0.18 195))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Dashboard
          </h1>
          <p className="text-xs mt-1 font-mono uppercase tracking-widest" style={{ color: "oklch(0.82 0.18 195 / 60%)" }}>
            Triarc Social Manager // Visão Geral
          </p>
        </div>
        <div className="badge-online">Online</div>
      </div>

      {/* Alertas de token expirando */}
      {criticalTokens.length > 0 && (
        <div className="rounded-lg border p-4 flex items-start gap-3" style={{ background: "oklch(0.18 0.04 25 / 80%)", borderColor: "oklch(0.65 0.25 25 / 60%)", boxShadow: "0 0 16px oklch(0.65 0.25 25 / 20%)" }}>
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" style={{ color: "oklch(0.75 0.25 25)" }} />
          <div className="flex-1">
            <p className="text-sm font-semibold" style={{ color: "oklch(0.88 0.12 25)" }}>⚠️ Token expirando em breve!</p>
            {criticalTokens.map((t: any) => (
              <p key={t.id} className="text-xs mt-1" style={{ color: "oklch(0.75 0.08 25)" }}>
                <span className="font-mono font-bold" style={{ color: "oklch(0.88 0.12 25)" }}>{t.displayName}</span> ({t.platform}) — expira em <span className="font-bold" style={{ color: "oklch(0.75 0.25 25)" }}>{t.daysLeft <= 0 ? 'EXPIRADO' : `${t.daysLeft} dia(s)`}</span>. Gere um novo token no <a href="https://developers.facebook.com/tools/explorer" target="_blank" rel="noopener" className="underline" style={{ color: "oklch(0.82 0.18 195)" }}>Graph Explorer</a> e envie ao Manus.
              </p>
            ))}
          </div>
        </div>
      )}
      {warningTokens.length > 0 && criticalTokens.length === 0 && (
        <div className="rounded-lg border p-4 flex items-start gap-3" style={{ background: "oklch(0.18 0.04 80 / 60%)", borderColor: "oklch(0.82 0.18 80 / 40%)", boxShadow: "0 0 12px oklch(0.82 0.18 80 / 10%)" }}>
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" style={{ color: "oklch(0.82 0.18 80)" }} />
          <div className="flex-1">
            <p className="text-sm font-semibold" style={{ color: "oklch(0.88 0.12 80)" }}>Token expirando em breve</p>
            {warningTokens.map((t: any) => (
              <p key={t.id} className="text-xs mt-1" style={{ color: "oklch(0.72 0.06 80)" }}>
                <span className="font-mono font-bold" style={{ color: "oklch(0.88 0.12 80)" }}>{t.displayName}</span> ({t.platform}) — expira em <span className="font-bold">{t.daysLeft} dia(s)</span>. Renove no <a href="https://developers.facebook.com/tools/explorer" target="_blank" rel="noopener" className="underline" style={{ color: "oklch(0.82 0.18 195)" }}>Graph Explorer</a>.
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Stats rápidos */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {STAT_CARDS.map(({ key, label, neon, path }) => (
          <button
            key={key}
            onClick={() => setLocation(path)}
            className="text-left p-4 rounded-xl transition-all group"
            style={{ background: "oklch(0.17 0.03 240 / 90%)", border: `1px solid ${neon.replace(")", " / 25%)")}`, backdropFilter: "blur(12px)" }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = neon.replace(")", " / 45%)"); (e.currentTarget as HTMLElement).style.boxShadow = `0 0 20px ${neon.replace(")", " / 10%)")}`; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = neon.replace(")", " / 20%)"); (e.currentTarget as HTMLElement).style.boxShadow = "none"; }}
          >
            <div className="stat-value" style={{ background: `linear-gradient(135deg, oklch(0.92 0.01 220), ${neon})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              {(stats as any)?.[key] ?? 0}
            </div>
            <p className="label-mono mt-1">{label}</p>
          </button>
        ))}
      </div>

      {/* Redes Conectadas */}
      {(accounts ?? []).length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4" style={{ color: "oklch(0.82 0.18 195)" }} />
            <h2 className="label-mono" style={{ color: "oklch(0.82 0.18 195 / 80%)" }}>Redes Conectadas</h2>
            <div className="flex-1 h-px" style={{ background: "linear-gradient(90deg, oklch(0.82 0.18 195 / 30%), transparent)" }} />
          </div>
          <div className="grid gap-3">
            {(accounts ?? []).map((account: any) => {
              const platform = account.platform ?? "instagram";
              const cfg = PLATFORM_CONFIG[platform] ?? { label: platform, icon: Globe, neon: "oklch(0.65 0.01 240)", bg: "oklch(0.65 0.01 240 / 10%)" };
              const Icon = cfg.icon;
              const isInstagram = platform === "instagram";
              return (
                <div
                  key={account.id}
                  className="rounded-xl p-4 transition-all"
                  style={{ background: "oklch(0.17 0.03 240 / 90%)", border: `1px solid ${cfg.neon.replace(")", " / 25%)")}`, backdropFilter: "blur(12px)" }}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: cfg.bg, boxShadow: `0 0 12px ${cfg.neon.replace(")", " / 20%)")}` }}>
                      <Icon className="h-5 w-5" style={{ color: cfg.neon }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm truncate" style={{ color: "oklch(0.92 0.01 220)" }}>
                        {platform === "instagram" || platform === "tiktok" ? "@" : ""}{account.handle}
                      </p>
                      <p className="text-xs truncate" style={{ color: "oklch(0.55 0.02 240)" }}>{account.displayName}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs px-2 py-0.5 rounded-full font-mono" style={{ background: cfg.bg, color: cfg.neon, border: `1px solid ${cfg.neon.replace(")", " / 30%)")}` }}>
                        {cfg.label}
                      </span>
                      {isInstagram && account.accessToken && (
                        <span className="badge-online">Ativo</span>
                      )}
                      {!isInstagram && (
                        <span className="text-xs px-2 py-0.5 rounded-full font-mono" style={{ background: "oklch(0.82 0.18 195 / 8%)", color: "oklch(0.82 0.18 195 / 60%)", border: "1px solid oklch(0.82 0.18 195 / 20%)" }}>
                          Cadastrada
                        </span>
                      )}
                    </div>
                  </div>
                  {isInstagram && (
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { label: "Pendentes", value: stats?.pending ?? 0, neon: "oklch(0.82 0.18 80)", path: "/approval" },
                        { label: "Aprovados", value: stats?.approved ?? 0, neon: "oklch(0.80 0.18 145)", path: "/approval" },
                        { label: "Agendados", value: stats?.scheduled ?? 0, neon: "oklch(0.82 0.18 195)", path: "/calendar" },
                        { label: "Publicados", value: stats?.published ?? 0, neon: "oklch(0.72 0.22 290)", path: "/history" },
                      ].map(s => (
                        <button
                          key={s.label}
                          onClick={() => setLocation(s.path)}
                          className="text-center py-3 rounded-lg transition-all"
                          style={{ background: `${s.neon.replace(")", " / 8%)")}`, border: `1px solid ${s.neon.replace(")", " / 20%)")}` }}
                          onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = s.neon.replace(")", " / 40%)")}
                          onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = s.neon.replace(")", " / 20%)")}
                        >
                          <div className="text-xl font-bold" style={{ fontFamily: "'Orbitron', sans-serif", color: s.neon }}>{s.value}</div>
                          <p className="text-[10px] font-mono uppercase tracking-wide mt-0.5" style={{ color: "oklch(0.55 0.02 240)" }}>{s.label}</p>
                        </button>
                      ))}
                    </div>
                  )}
                  {!isInstagram && account.profileUrl && (
                    <a href={account.profileUrl} target="_blank" rel="noopener noreferrer"
                      className="text-xs hover:underline truncate block" style={{ color: "oklch(0.82 0.18 195 / 70%)" }}>
                      {account.profileUrl}
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Alerta: posts aprovados */}
      {approvedCount > 0 && (
        <div className="rounded-xl p-4" style={{ background: "oklch(0.80 0.18 145 / 12%)", border: "1px solid oklch(0.80 0.18 145 / 35%)" }}>
          <div className="flex items-center gap-2 mb-3">
            <Rocket className="h-5 w-5" style={{ color: "oklch(0.80 0.18 145)" }} />
            <p className="font-bold text-sm" style={{ color: "oklch(0.80 0.18 145)" }}>
              {approvedCount} post{approvedCount > 1 ? "s" : ""} aprovado{approvedCount > 1 ? "s" : ""} — aguardando publicação
            </p>
            <Button size="sm" className="ml-auto gap-1.5 text-xs h-7" style={{ background: "oklch(0.80 0.18 145 / 20%)", color: "oklch(0.80 0.18 145)", border: "1px solid oklch(0.80 0.18 145 / 40%)" }} onClick={() => setLocation("/approval")}>
              Publicar <ArrowRight className="h-3 w-3" />
            </Button>
          </div>
          <div className="space-y-1.5">
            {(approvedPosts ?? []).slice(0, 3).map((post: any) => (
              <div key={post.id} className="flex items-center gap-2 p-2 rounded-lg" style={{ background: "oklch(0.80 0.18 145 / 5%)" }}>
                <CheckCircle className="h-3.5 w-3.5 shrink-0" style={{ color: "oklch(0.80 0.18 145)" }} />
                <p className="text-xs truncate flex-1" style={{ color: "oklch(0.75 0.01 220)" }}>{post.caption?.substring(0, 80) ?? "Sem legenda"}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Alerta: posts pendentes */}
      {pendingCount > 0 && (
        <div className="rounded-xl p-4" style={{ background: "oklch(0.82 0.18 80 / 12%)", border: "1px solid oklch(0.82 0.18 80 / 35%)" }}>
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="h-5 w-5" style={{ color: "oklch(0.82 0.18 80)" }} />
            <p className="font-bold text-sm" style={{ color: "oklch(0.82 0.18 80)" }}>
              {pendingCount} post{pendingCount > 1 ? "s" : ""} aguardando aprovação
            </p>
            <Button size="sm" className="ml-auto gap-1.5 text-xs h-7" style={{ background: "oklch(0.82 0.18 80 / 20%)", color: "oklch(0.82 0.18 80)", border: "1px solid oklch(0.82 0.18 80 / 40%)" }} onClick={() => setLocation("/approval")}>
              Revisar <ArrowRight className="h-3 w-3" />
            </Button>
          </div>
          <div className="space-y-1.5">
            {(pendingPosts ?? []).slice(0, 3).map((post: any) => (
              <div key={post.id} className="flex items-center gap-2 p-2 rounded-lg" style={{ background: "oklch(0.82 0.18 80 / 5%)" }}>
                <FileText className="h-3.5 w-3.5 shrink-0" style={{ color: "oklch(0.82 0.18 80 / 70%)" }} />
                <p className="text-xs truncate flex-1" style={{ color: "oklch(0.75 0.01 220)" }}>{post.caption?.substring(0, 80) ?? "Sem legenda"}</p>
                {post.scheduledAt && (
                  <div className="flex items-center gap-1 text-[10px] shrink-0 font-mono" style={{ color: "oklch(0.55 0.02 240)" }}>
                    <Clock className="h-3 w-3" />
                    {new Date(post.scheduledAt).toLocaleDateString("pt-BR")}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => setLocation("/create")}
          className="flex items-center gap-3 p-4 rounded-xl text-left transition-all group"
          style={{ background: "oklch(0.17 0.03 240 / 90%)", border: "1px solid oklch(0.82 0.18 195 / 22%)" }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "oklch(0.82 0.18 195 / 40%)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 0 20px oklch(0.82 0.18 195 / 8%)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "oklch(0.82 0.18 195 / 15%)"; (e.currentTarget as HTMLElement).style.boxShadow = "none"; }}
        >
          <Zap className="h-5 w-5 shrink-0" style={{ color: "oklch(0.82 0.18 195)" }} />
          <div>
            <p className="text-sm font-semibold" style={{ color: "oklch(0.92 0.01 220)" }}>Criar Post</p>
            <p className="text-[10px] font-mono" style={{ color: "oklch(0.55 0.02 240)" }}>IA + Imagem</p>
          </div>
        </button>
        <button
          onClick={() => setLocation("/analytics")}
          className="flex items-center gap-3 p-4 rounded-xl text-left transition-all"
          style={{ background: "oklch(0.17 0.03 240 / 90%)", border: "1px solid oklch(0.72 0.22 290 / 22%)" }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "oklch(0.72 0.22 290 / 40%)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 0 20px oklch(0.72 0.22 290 / 8%)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "oklch(0.72 0.22 290 / 15%)"; (e.currentTarget as HTMLElement).style.boxShadow = "none"; }}
        >
          <TrendingUp className="h-5 w-5 shrink-0" style={{ color: "oklch(0.72 0.22 290)" }} />
          <div>
            <p className="text-sm font-semibold" style={{ color: "oklch(0.92 0.01 220)" }}>Analytics</p>
            <p className="text-[10px] font-mono" style={{ color: "oklch(0.55 0.02 240)" }}>Métricas reais</p>
          </div>
        </button>
      </div>
    </div>
  );
}
